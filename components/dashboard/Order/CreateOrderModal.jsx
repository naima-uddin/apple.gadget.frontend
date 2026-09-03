"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

const PAYMENT_METHODS = [
  { value: "cash-on-delivery", label: "Cash on Delivery" },
  { value: "online", label: "Online (card / SSLCommerz)" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "rocket", label: "Rocket" },
];

const INITIAL_STATUSES = [
  "pending",
  "accepted",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

const emptyBilling = {
  name: "",
  phone: "",
  email: "",
  city: "",
  zone: "",
  area: "",
  address: "",
  note: "",
};

// Shared manual-order form. Opened from the Orders page header (blank) and from
// each abandoned-cart / abandoned-checkout row (prefilled via `prefill`).
// prefill = { billingDetails?, items?, sourceCartUserId?, sourceCheckoutId? }
export default function CreateOrderModal({ onClose, onCreated, prefill = {} }) {
  const [billing, setBilling] = useState({
    ...emptyBilling,
    ...(prefill.billingDetails || {}),
  });
  // line item shape: { productId, title, image, price, quantity, color, size }
  const [items, setItems] = useState(() =>
    (prefill.items || []).map((it) => ({
      productId: String(it.productId || ""),
      title: it.title || "Product",
      image: it.image || null,
      price: Number(it.price) || 0,
      quantity: Math.max(1, Number(it.quantity) || 1),
      color: it.color || "",
      size: it.size || "",
    })),
  );
  const [paymentMethod, setPaymentMethod] = useState("cash-on-delivery");
  const [status, setStatus] = useState("pending");
  const [couponInput, setCouponInput] = useState("");
  const [shippingOverride, setShippingOverride] = useState(""); // blank = auto
  const [manualDiscount, setManualDiscount] = useState("");

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);

  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const quoteRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const couponCodes = couponInput
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

  // ── Product search ──────────────────────────────────────────────────────────
  const runSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const r = await fetch(
        `${API}/api/products?q=${encodeURIComponent(q)}&suggest=1&limit=8`,
        { credentials: "include" },
      );
      const body = await r.json();
      setResults(body.items || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => runSearch(search), 300);
    return () => clearTimeout(searchRef.current);
  }, [search, runSearch]);

  const addProduct = (p) => {
    setItems((prev) => [
      ...prev,
      {
        productId: String(p._id),
        title: p.title || "Product",
        image: p.images?.[0]?.url || null,
        price: Number(p.price) || 0,
        quantity: 1,
        color: "",
        size: "",
      },
    ]);
    setSearch("");
    setResults([]);
  };

  const updateItem = (idx, patch) =>
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    );
  const removeItem = (idx) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  // ── Live quote (server-authoritative pricing preview) ─────────────────────────
  useEffect(() => {
    clearTimeout(quoteRef.current);
    quoteRef.current = setTimeout(async () => {
      if (!items.length) {
        setQuote(null);
        return;
      }
      setQuoting(true);
      try {
        const r = await fetch(`${API}/api/orders/quote`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
              color: it.color || undefined,
              size: it.size || undefined,
            })),
            couponCodes,
            city: billing.city || null,
            zone: billing.zone || null,
            area: billing.area || null,
          }),
        });
        const body = await r.json();
        setQuote(r.ok ? body : null);
      } catch {
        setQuote(null);
      } finally {
        setQuoting(false);
      }
    }, 400);
    return () => clearTimeout(quoteRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, billing.city, billing.zone, billing.area, couponInput]);

  // Displayed totals: subtotal + coupon discount come from the server quote;
  // shipping and the manual discount can be overridden by the admin.
  const subtotal = quote?.subtotal ?? 0;
  const autoShipping = quote?.shipping ?? 0;
  const shipping =
    shippingOverride === "" ? autoShipping : Math.max(0, Number(shippingOverride) || 0);
  const couponDiscount = quote?.discount ?? 0;
  const extraDiscount = Math.max(0, Number(manualDiscount) || 0);
  const total = Math.max(0, subtotal + shipping - couponDiscount - extraDiscount);

  const priceFor = (idx) =>
    quote?.items?.[idx]?.price != null ? quote.items[idx].price : items[idx].price;

  // ── Submit ────────────────────────────────────────────────────────────────────
  const submit = async () => {
    setError("");
    if (!items.length) return setError("Add at least one product.");
    if (
      !billing.name.trim() ||
      !billing.phone.trim() ||
      !billing.city.trim() ||
      !billing.zone.trim()
    ) {
      return setError("Customer name, phone, city and zone are required.");
    }
    setSubmitting(true);
    try {
      const r = await fetch(`${API}/api/admin/orders`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingDetails: {
            name: billing.name.trim(),
            phone: billing.phone.trim(),
            email: billing.email.trim() || null,
            city: billing.city.trim(),
            zone: billing.zone.trim(),
            area: billing.area.trim() || null,
            address: billing.address.trim() || null,
            note: billing.note.trim() || null,
          },
          items: items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            color: it.color || undefined,
            size: it.size || undefined,
          })),
          paymentMethod,
          status,
          couponCodes,
          shipping: shippingOverride === "" ? undefined : Number(shippingOverride),
          manualDiscount: extraDiscount || undefined,
          sourceCartUserId: prefill.sourceCartUserId || undefined,
          sourceCheckoutId: prefill.sourceCheckoutId || undefined,
        }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || "Could not create order");
      onCreated?.(body);
      onClose();
    } catch (e) {
      setError(e.message || "Could not create order");
    } finally {
      setSubmitting(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[201] flex items-start justify-center p-4 overflow-y-auto pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 pointer-events-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Create Order
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Manually place an order — prices are computed automatically.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="px-6 py-5 space-y-6">
            {/* Customer */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                Customer
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  ["name", "Name *", "sm:col-span-1"],
                  ["phone", "Phone *", "sm:col-span-1"],
                  ["email", "Email", "sm:col-span-2"],
                  ["city", "City *", "sm:col-span-1"],
                  ["zone", "Zone *", "sm:col-span-1"],
                  ["area", "Area", "sm:col-span-1"],
                  ["address", "Address", "sm:col-span-1"],
                  ["note", "Note", "sm:col-span-2"],
                ].map(([key, label, span]) => (
                  <div key={key} className={span}>
                    <label className="block text-xs text-gray-500 mb-1">
                      {label}
                    </label>
                    <input
                      value={billing[key]}
                      onChange={(e) =>
                        setBilling((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                Use <strong>Dhaka</strong> as the city for inside-Dhaka delivery
                charge; the matching zone/area sets the exact shipping rate.
              </p>
            </section>

            {/* Products */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                Products
              </h4>
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products by name…"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
                {searching && (
                  <span className="absolute right-3 top-2.5 text-xs text-gray-400">
                    …
                  </span>
                )}
                {results.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full border border-gray-200 rounded-xl bg-white shadow-lg max-h-64 overflow-y-auto">
                    {results.map((p) => (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => addProduct(p)}
                        className="w-full flex items-center gap-3 text-left px-3 py-2 hover:bg-gray-50 border-b last:border-0"
                      >
                        {p.images?.[0]?.url && (
                          <img
                            src={p.images[0].url}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover shrink-0"
                          />
                        )}
                        <span className="flex-1 text-sm text-gray-800 truncate">
                          {p.title}
                        </span>
                        <span className="text-xs font-semibold text-gray-600 shrink-0">
                          ৳{(p.price || 0).toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {items.length === 0 ? (
                <p className="text-xs text-gray-400 mt-3 text-center py-4 border border-dashed rounded-xl">
                  No products added yet.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center gap-2 border border-gray-100 rounded-xl px-3 py-2 bg-gray-50/50"
                    >
                      {it.image && (
                        <img
                          src={it.image}
                          alt=""
                          className="w-9 h-9 rounded-lg object-cover shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-[8rem]">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {it.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          ৳{(priceFor(idx) || 0).toLocaleString()} each
                        </p>
                      </div>
                      <input
                        value={it.color}
                        onChange={(e) =>
                          updateItem(idx, { color: e.target.value })
                        }
                        placeholder="Color"
                        className="w-20 text-xs border border-gray-200 rounded-lg px-2 py-1.5"
                      />
                      <input
                        value={it.size}
                        onChange={(e) =>
                          updateItem(idx, { size: e.target.value })
                        }
                        placeholder="Size"
                        className="w-16 text-xs border border-gray-200 rounded-lg px-2 py-1.5"
                      />
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() =>
                            updateItem(idx, {
                              quantity: Math.max(1, it.quantity - 1),
                            })
                          }
                          className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={it.quantity}
                          onChange={(e) =>
                            updateItem(idx, {
                              quantity: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                          className="w-10 text-center text-xs py-1 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateItem(idx, { quantity: it.quantity + 1 })
                          }
                          className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-gray-300 hover:text-red-500 px-1"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Payment & pricing */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                Payment & Pricing
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Payment method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Initial status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 capitalize focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    {INITIAL_STATUSES.map((s) => (
                      <option key={s} value={s} className="capitalize">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Coupon code(s){" "}
                    <span className="text-gray-400">(comma-separated)</span>
                  </label>
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="e.g. SAVE10"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 uppercase focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Shipping (৳)
                    </label>
                    <input
                      type="number"
                      value={shippingOverride}
                      onChange={(e) => setShippingOverride(e.target.value)}
                      placeholder="Auto"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Extra discount (৳)
                    </label>
                    <input
                      type="number"
                      value={manualDiscount}
                      onChange={(e) => setManualDiscount(e.target.value)}
                      placeholder="0"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Summary */}
            <section className="bg-gray-50 rounded-xl px-4 py-3 text-sm space-y-1.5">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>
                  Shipping{shippingOverride === "" ? " (auto)" : " (manual)"}
                </span>
                <span>৳{shipping.toLocaleString()}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon discount</span>
                  <span>−৳{couponDiscount.toLocaleString()}</span>
                </div>
              )}
              {extraDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Extra discount</span>
                  <span>−৳{extraDiscount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
                <span>Total{quoting ? " …" : ""}</span>
                <span>৳{total.toLocaleString()}</span>
              </div>
              {quote?.couponErrors?.length > 0 && (
                <p className="text-xs text-amber-600 pt-1">
                  {quote.couponErrors.map((c) => c.error).join(" ")}
                </p>
              )}
            </section>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t flex justify-end gap-2 sticky bottom-0 bg-white rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm text-gray-600 border rounded-xl hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !items.length}
              className="px-5 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-[#1D1D1F] rounded-xl transition disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create Order"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
