"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import OrderTrackingTimeline from "@/components/order/OrderTrackingTimeline";
import { formatOrderId } from "@/lib/orderId";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rejected: "Rejected",
  failed: "Failed",
};

const STATUS_COLORS = {
  pending: "bg-yellow-50 text-yellow-700",
  confirmed: "bg-blue-50 text-blue-700",
  processing: "bg-blue-50 text-blue-700",
  shipped: "bg-indigo-50 text-indigo-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
  rejected: "bg-red-50 text-red-600",
  failed: "bg-red-50 text-red-600",
};

function NotFoundHelp({ byPhone }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 space-y-3">
      <div className="flex gap-3">
        <span className="text-xl shrink-0" aria-hidden="true">
          🔍
        </span>
        <div>
          <p className="text-sm font-semibold text-amber-900">
            No order found
          </p>
          <p className="text-sm text-amber-800/90 mt-1 leading-relaxed">
            {byPhone
              ? "No orders found for this phone number. Please check the number and try again."
              : "Please check the Order ID again. You can find it in your confirmation email or the My Orders page."}
          </p>
        </div>
      </div>
      <Link
        href="/user/orders"
        className="inline-flex items-center justify-center w-full py-2.5 rounded-lg border border-rose-200 bg-white text-sm font-semibold text-rose-700 hover:bg-rose-50 transition"
      >
        Go to My Orders
      </Link>
    </div>
  );
}

function OrderCard({ order, courierLabels, onSelect, selected }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(order)}
      className={`w-full text-left rounded-xl border p-4 transition ${
        selected
          ? "border-rose-400 bg-rose-50/60 shadow-sm"
          : "border-gray-200 bg-white hover:border-rose-200 hover:bg-rose-50/30"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-sm font-semibold text-gray-800">
          {formatOrderId(order)}
        </span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            STATUS_COLORS[order.status] || "bg-gray-100 text-gray-500"
          }`}
        >
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>
      <p className="text-sm text-gray-600">
        {order.billingDetails?.name} · ৳{order.total?.toLocaleString()}
      </p>
      {order.shipment?.trackingId && (
        <p className="text-xs text-gray-400 mt-1">
          Tracking: {order.shipment.trackingId}
        </p>
      )}
      <p className="text-xs text-gray-400 mt-0.5">
        {new Date(order.createdAt).toLocaleDateString("bn-BD")}
      </p>
    </button>
  );
}

// Decide whether the entered value looks like a phone number.
// Bangladeshi mobile numbers are 11 digits (optionally with +88 country code);
// anything else (e.g. 518640AC) is treated as an Order ID.
function looksLikePhone(value) {
  const digits = value.replace(/[\s\-()]/g, "").replace(/^\+?88/, "");
  return /^\d{10,}$/.test(digits);
}

export default function TrackOrderPage() {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState(null);
  const [phoneOrders, setPhoneOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [courierLabels, setCourierLabels] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [notFoundByPhone, setNotFoundByPhone] = useState(false);

  const timelineRef = useRef(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    setError("");
    setNotFound(false);
    setOrder(null);
    setPhoneOrders([]);
    setSelectedOrder(null);

    const val = query.trim();
    if (!val) {
      setError("Please enter your Order ID or phone number.");
      return;
    }

    const byPhone = looksLikePhone(val);
    setNotFoundByPhone(byPhone);

    setLoading(true);
    try {
      const params = new URLSearchParams(
        byPhone ? { phone: val } : { orderId: val }
      );
      const r = await fetch(`${API}/api/orders/track?${params}`);
      const data = await r.json();
      if (r.ok) {
        setCourierLabels(data.courierLabels || {});
        if (byPhone) {
          setPhoneOrders(data.orders || []);
        } else {
          setOrder(data.order);
        }
      } else if (r.status === 404) {
        setNotFound(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Track Your Order</h1>
          <p className="text-sm text-gray-500 mt-2">
            Track your order using your Order ID or Phone Number.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order ID or Phone Number
              </label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by Order ID or phone number"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Enter your Order ID (from the confirmation email) or the phone
                number you used on the order
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {notFound && <NotFoundHelp byPhone={notFoundByPhone} />}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gray-600 text-white font-semibold text-sm hover:bg-gray-900 disabled:opacity-60 transition"
            >
              {loading ? "Searching…" : "Track Order"}
            </button>
          </form>
        </div>

        {/* Single order result (Order ID mode) */}
        {order && (
          <div className="mt-6 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Order</p>
                  <p className="font-mono text-sm font-semibold text-gray-800">
                    {formatOrderId(order)}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    STATUS_COLORS[order.status] || "bg-gray-100 text-gray-500"
                  }`}
                >
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {order.billingDetails?.name} · ৳{order.total?.toLocaleString()}
              </p>
              {order.shipment?.trackingId && (
                <p className="text-xs text-gray-500 mt-1">
                  Tracking ID: {order.shipment.trackingId}
                </p>
              )}
            </div>
            <OrderTrackingTimeline
              order={order}
              courierLabels={courierLabels}
            />
          </div>
        )}

        {/* Multiple results (phone lookup) */}
        {phoneOrders.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="text-sm font-medium text-gray-600">
              {phoneOrders.length} order(s) found — select one to see details
            </p>
            <div className="space-y-2">
              {phoneOrders.map((o) => (
                <OrderCard
                  key={o._id}
                  order={o}
                  courierLabels={courierLabels}
                  onSelect={(o) => {
                    setSelectedOrder(o);
                    setTimeout(() => {
                      timelineRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }, 50);
                  }}
                  selected={selectedOrder?._id === o._id}
                />
              ))}
            </div>
            {selectedOrder && (
              <div ref={timelineRef} className="mt-4 scroll-mt-6">
                <OrderTrackingTimeline
                  order={selectedOrder}
                  courierLabels={courierLabels}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
