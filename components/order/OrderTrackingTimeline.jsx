"use client";

import React from "react";

const DEFAULT_COURIER_LABELS = {
  pathao: "Pathao",
  steadfast: "Steadfast",
  redx: "RedX",
  sundarban: "Sundarban Courier",
  other: "Courier",
};

// Human-readable labels for each order status in the timeline
const STATUS_STEP_LABELS = {
  pending: "Order Placed",
  accepted: "Order Accepted",
  picked: "Being Prepared",
  approved: "Order Approved",
  confirmed: "Order Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  returned: "Returned",
  rejected: "Rejected",
  failed: "Delivery Failed",
  cancelled: "Cancelled",
};

// Statuses that should render with a "negative" (red) tone
const NEGATIVE_STATUSES = new Set([
  "rejected",
  "failed",
  "cancelled",
  "returned",
]);

function fmtDateTime(value) {
  if (!value) return null;
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCourierLabel(courier, courierLabels = {}) {
  if (!courier) return "Courier";
  return courierLabels[courier] || DEFAULT_COURIER_LABELS[courier] || courier;
}

// Builds a full chronological timeline of everything that happened to the
// order: when it was placed, every status change (confirmed, processing,
// shipped, delivered, …), and any live courier updates — merged and sorted
// oldest → newest so the customer can see exactly "kokhn ki hoyeche".
function buildCourierTimeline(order, courierLabels = {}) {
  const shipment = order.shipment || {};
  const events = [];

  // 1. Order placed — always the first event
  events.push({
    key: "placed",
    at: order.createdAt,
    title: "Order Placed",
    reached: true,
  });

  // 2. Every recorded status change
  const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
  history.forEach((h, i) => {
    // The very first "pending" entry duplicates "Order Placed"
    if (!h.newStatus || h.newStatus === "pending") return;
    events.push({
      key: `status-${i}-${h.at}`,
      at: h.at,
      title: STATUS_STEP_LABELS[h.newStatus] || h.newStatus,
      reached: true,
      tone: NEGATIVE_STATUSES.has(h.newStatus) ? "cancelled" : undefined,
    });
  });

  // Fallback for older orders that have no statusHistory recorded but are
  // no longer pending — surface the current status as one step.
  if (history.length === 0 && order.status && order.status !== "pending") {
    events.push({
      key: "status-current",
      at: order.updatedAt || order.createdAt,
      title: STATUS_STEP_LABELS[order.status] || order.status,
      reached: true,
      tone: NEGATIVE_STATUSES.has(order.status) ? "cancelled" : undefined,
    });
  }

  // 3. Live courier updates
  const courierLabel = getCourierLabel(shipment.courier, courierLabels);
  (shipment.trackingEvents || [])
    .filter((e) => e.source === "courier" && e.message)
    .forEach((ev, i) => {
      events.push({
        key: `courier-${i}-${ev.at}`,
        at: ev.at,
        title: ev.message,
        note: courierLabel,
        reached: true,
      });
    });

  // Sort oldest → newest, then attach a formatted timestamp subtitle
  events.sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0));

  return events.map((ev) => ({
    ...ev,
    subtitle: [ev.note, fmtDateTime(ev.at)].filter(Boolean).join(" · "),
  }));
}

export default function OrderTrackingTimeline({ order, courierLabels = {} }) {
  const steps = buildCourierTimeline(order, courierLabels);
  const shipment = order.shipment || {};
  const trackingUrl = shipment.trackingUrl;
  const courierLabel = getCourierLabel(shipment.courier, courierLabels);
  const hasCourierEvents = (shipment.trackingEvents || []).some(
    (e) => e.source === "courier" && e.message,
  );

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
      <div className="mb-4 space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {hasCourierEvents ? "Live courier updates" : "Delivery Tracking"}
          </p>
          {shipment.courierStatus && (
            <p className="text-sm text-gray-600 mt-0.5">
              Current status: {shipment.courierStatus}
            </p>
          )}
          {shipment.trackingId && (
            <p className="text-xs text-gray-500 mt-0.5">
              Tracking ID: {shipment.trackingId}
            </p>
          )}
        </div>
        {trackingUrl && (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-xl bg-rose-600 text-white text-sm font-semibold shadow-sm hover:bg-rose-700 transition"
          >
            Live tracking on {courierLabel}
            <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>

      <ol className="space-y-0 mt-2">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const dotClass =
            step.tone === "cancelled"
              ? "bg-red-500 ring-red-100"
              : step.reached
                ? "bg-green-500 ring-green-100"
                : "bg-gray-300 ring-gray-100";

          return (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className={`w-3 h-3 rounded-full ring-4 ${dotClass}`} />
                {!isLast && (
                  <span
                    className={`w-0.5 flex-1 min-h-[2rem] ${step.reached ? "bg-green-300" : "bg-gray-200"}`}
                  />
                )}
              </div>
              <div className={`pb-5 ${isLast ? "pb-0" : ""}`}>
                <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                {step.subtitle && (
                  <p className="text-xs mt-0.5 text-gray-500">{step.subtitle}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {!hasCourierEvents && trackingUrl && (
        <p className="text-[11px] text-gray-400 mt-3 border-t border-gray-200 pt-3">
          Tracking URL save করার পর courier থেকে updates auto fetch হবে। কিছুক্ষণ পর
          refresh করুন।
        </p>
      )}
    </div>
  );
}
