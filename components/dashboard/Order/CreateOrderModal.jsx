"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import SearchableSelect from "@/components/ui/SearchableSelect";

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

const inputClass =
  "w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder:text-gray-400";
const labelClass = "block text-xs font-medium text-gray-700 mb-1";

// Shared manual-order form. Opened blank from the Orders page header, or
// prefilled from an abandoned cart / checkout row.
// prefill = { billingDetails?, items?, sourceCartUserId?, sourceCheckoutId? }
export default function CreateOrderModal({ onClose, onCreated, prefill = {} }) {
  const [billing, setBilling] = useState({
    ...emptyBilling,
    ...(prefill.billingDetails || {}),
  });
  // Free-text fallbacks used when the district/area isn't in the dropdown list.
  const [customCity, setCustomCity] = useState("");
  const [customZone, setCustomZone] = useState("");
  const [customArea, setCustomArea] = useState("");

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
  const [shippingOverride, setShippingOverride] = useState(""); // auto-filled from quote
  const shippingEditedRef = useRef(false); // true once the admin types their own charge
  const [shippingEdited, setShippingEdited] = useState(false); // render-safe mirror of the ref
  const [manualDiscount, setManualDiscount] = useState("");

  const [locationData, setLocationData] = useState({});
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

  // Resolve the "Other (type your own)" selections to their typed values.
  const resolvedCity = billing.city === "other" ? customCity : billing.city;
  const resolvedZone = billing.zone === "other" ? customZone : billing.zone;
  const resolvedArea = billing.area === "other" ? customArea : billing.area;

  // ── Location dropdowns (district → area → union) ──────────────────────────────
  useEffect(() => {
    fetch("/api/locations/")
      .then((r) => r.json())
      .then((j) => setLocationData(j.locationData || {}))
      .catch(() => {});
  }, []);

  const cities = useMemo(() => Object.keys(locationData), [locationData]);
  const zones = useMemo(() => {
    const c = billing.city;
    if (!c || c === "other" || !locationData[c]) return [];
    return Object.keys(locationData[c].zones || {});
  }, [locationData, billing.city]);
  const areas = useMemo(() => {
    const c = billing.city;
    const z = billing.zone;
    if (!c || !z || z === "other" || !locationData[c]) return [];
    return locationData[c].zones?.[z] || [];
  }, [locationData, billing.city, billing.zone]);

  const onCityChange = (e) => {
    setBilling((prev) => ({ ...prev, city: e.target.value, zone: "", area: "" }));
    setCustomZone("");
    setCustomArea("");
  };
  const onZoneChange = (e) =>
    setBilling((prev) => ({ ...prev, zone: e.target.value, area: "" }));
  const onAreaChange = (e) =>
    setBilling((prev) => ({ ...prev, area: e.target.value }));

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

  // ── Live quote — supplies the auto delivery charge + coupon discount ─────────
  // Keyed on product/qty/variant + address only (NOT edited prices), so editing a
  // price never triggers a refetch.
  const itemsKey = JSON.stringify(
    items.map((it) => [it.productId, it.quantity, it.color, it.size]),
  );
  useEffect(() => {
    clearTimeout(quoteRef.current);
    quoteRef.current = setTimeout(async () => {
      const applyShipping = (val) => {
        if (!shippingEditedRef.current) {
          setShippingOverride(val != null ? String(val) : "0");
        }
      };
      setQuoting(true);
      try {
        let shippingFromQuote = null;
        if (items.length) {
          // Full quote — needs items; also yields coupon discount + free-shipping.
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
              city: resolvedCity || null,
              zone: resolvedZone || null,
              area: resolvedArea || null,
            }),
          });
          const body = await r.json();
          if (r.ok) {
            setQuote(body);
            shippingFromQuote = body.shipping;
          } else {
            setQuote(null);
          }
        } else {
          setQuote(null);
        }

        // Always make the delivery charge reflect the address. If the full quote
        // gave us a shipping figure, use it (it accounts for free-shipping
        // products/coupons); otherwise — no products yet, or the quote failed to
        // resolve an item — fall back to the address-only charge so it still shows.
        if (shippingFromQuote != null) {
          applyShipping(shippingFromQuote);
        } else if (resolvedCity) {
          const rs = await fetch(`${API}/api/orders/shipping-quote`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              city: resolvedCity || null,
              zone: resolvedZone || null,
              area: resolvedArea || null,
            }),
          });
          const bs = await rs.json();
          if (rs.ok) applyShipping(bs.shipping);
        }
      } catch {
        setQuote(null);
      } finally {
        setQuoting(false);
      }
    }, 400);
    return () => clearTimeout(quoteRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, resolvedCity, resolvedZone, resolvedArea, couponInput]);

  // Subtotal comes from the (editable) line prices; shipping + coupon discount
  // come from the server quote. Extra discount + shipping can be overridden.
  const subtotal = items.reduce(
    (s, it) => s + (Number(it.price) || 0) * it.quantity,
    0,
  );
  const shipping = shippingOverride === "" ? 0 : Math.max(0, Number(shippingOverride) || 0);
  const couponDiscount = quote?.discount ?? 0;
  const extraDiscount = Math.max(0, Number(manualDiscount) || 0);
  const total = Math.max(0, subtotal + shipping - couponDiscount - extraDiscount);

  // ── Submit ────────────────────────────────────────────────────────────────────
  const submit = async () => {
    setError("");
    if (!items.length) return setError("Add at least one product.");
    if (
      !billing.name.trim() ||
      !billing.phone.trim() ||
      !resolvedCity?.trim() ||
      !resolvedZone?.trim()
    ) {
      return setError("Customer name, phone, district and area are required.");
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
            city: resolvedCity.trim(),
            zone: resolvedZone.trim(),
            area: resolvedArea?.trim() || null,
            address: billing.address.trim() || null,
            note: billing.note.trim() || null,
          },
          items: items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            price: Number(it.price) || 0,
            color: it.color || undefined,
            size: it.size || undefined,
          })),
          paymentMethod,
          status,
          couponCodes,
          shipping:
            shippingOverride === "" ? undefined : Number(shippingOverride),
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
              <p className="text-xs text-gray-500 mt-0.5">
                Place an order for a customer. Choose the address and the
                delivery charge is added automatically.
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
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Customer details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Name *</label>
                  <input
                    value={billing.name}
                    onChange={(e) =>
                      setBilling((p) => ({ ...p, name: e.target.value }))
                    }
                    className={inputClass}
                    placeholder="Customer full name"
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone *</label>
                  <input
                    value={billing.phone}
                    onChange={(e) =>
                      setBilling((p) => ({ ...p, phone: e.target.value }))
                    }
                    className={inputClass}
                    placeholder="01XXXXXXXXX"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Email (optional)</label>
                  <input
                    value={billing.email}
                    onChange={(e) =>
                      setBilling((p) => ({ ...p, email: e.target.value }))
                    }
                    className={inputClass}
                    placeholder="name@example.com"
                  />
                </div>

                {/* District / Area / Union — drives the delivery charge */}
                <div>
                  <label className={labelClass}>District (city) *</label>
                  <SearchableSelect
                    name="city"
                    options={cities}
                    value={billing.city}
                    onChange={onCityChange}
                    placeholder="Select district"
                  />
                  {billing.city === "other" && (
                    <input
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      className={`${inputClass} mt-2`}
                      placeholder="Type district name"
                    />
                  )}
                </div>
                <div>
                  <label className={labelClass}>Area (zone) *</label>
                  <SearchableSelect
                    name="zone"
                    options={zones}
                    value={billing.zone}
                    onChange={onZoneChange}
                    placeholder="Select area"
                    disabled={!billing.city}
                  />
                  {billing.zone === "other" && (
                    <input
                      value={customZone}
                      onChange={(e) => setCustomZone(e.target.value)}
                      className={`${inputClass} mt-2`}
                      placeholder="Type area name"
                    />
                  )}
                </div>
                <div>
                  <label className={labelClass}>Union (optional)</label>
                  <SearchableSelect
                    name="area"
                    options={areas}
                    value={billing.area}
                    onChange={onAreaChange}
                    placeholder="Select union"
                    disabled={!billing.zone}
                  />
                  {billing.area === "other" && (
                    <input
                      value={customArea}
                      onChange={(e) => setCustomArea(e.target.value)}
                      className={`${inputClass} mt-2`}
                      placeholder="Type union name"
                    />
                  )}
                </div>
                <div>
                  <label className={labelClass}>Street address (optional)</label>
                  <input
                    value={billing.address}
                    onChange={(e) =>
                      setBilling((p) => ({ ...p, address: e.target.value }))
                    }
                    className={inputClass}
                    placeholder="House, road, landmark"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Order note (optional)</label>
                  <input
                    value={billing.note}
                    onChange={(e) =>
                      setBilling((p) => ({ ...p, note: e.target.value }))
                    }
                    className={inputClass}
                    placeholder="Any instruction for this order"
                  />
                </div>
              </div>
            </section>

            {/* Products */}
            <section>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Products
              </h4>
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products by name to add…"
                  className={`${inputClass} pr-8`}
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
                <p className="text-xs text-gray-500 mt-3 text-center py-4 border border-dashed rounded-xl">
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
                      <p className="flex-1 min-w-[8rem] text-sm font-medium text-gray-900 truncate">
                        {it.title}
                      </p>
                      <input
                        value={it.color}
                        onChange={(e) =>
                          updateItem(idx, { color: e.target.value })
                        }
                        placeholder="Color"
                        className="w-20 text-xs text-gray-900 border border-gray-300 rounded-lg px-2 py-1.5"
                      />
                      <input
                        value={it.size}
                        onChange={(e) =>
                          updateItem(idx, { size: e.target.value })
                        }
                        placeholder="Size"
                        className="w-16 text-xs text-gray-900 border border-gray-300 rounded-lg px-2 py-1.5"
                      />
                      {/* Editable unit price */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">৳</span>
                        <input
                          type="number"
                          min={0}
                          value={it.price}
                          onChange={(e) =>
                            updateItem(idx, {
                              price: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          title="Unit price"
                          className="w-20 text-xs text-gray-900 border border-gray-300 rounded-lg px-2 py-1.5"
                        />
                      </div>
                      {/* Quantity stepper */}
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
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
                          className="w-10 text-center text-xs text-gray-900 py-1 focus:outline-none"
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
                      <span className="w-20 text-right text-xs font-semibold text-gray-900">
                        ৳{((Number(it.price) || 0) * it.quantity).toLocaleString()}
                      </span>
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
                  <p className="text-[11px] text-gray-500 pt-0.5">
                    Prices are filled in from the product — edit the ৳ box to
                    change the unit price.
                  </p>
                </div>
              )}
            </section>

            {/* Payment & pricing */}
            <section>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Payment & pricing
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Payment method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className={inputClass}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Initial status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={`${inputClass} capitalize`}
                  >
                    {INITIAL_STATUSES.map((s) => (
                      <option key={s} value={s} className="capitalize">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    Coupon code(s) — comma-separated
                  </label>
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="e.g. SAVE10"
                    className={`${inputClass} uppercase`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Delivery charge (৳)</label>
                    <input
                      type="number"
                      value={shippingOverride}
                      onChange={(e) => {
                        shippingEditedRef.current = true;
                        setShippingEdited(true);
                        setShippingOverride(e.target.value);
                      }}
                      placeholder={quoting ? "Calculating…" : "Select address"}
                      className={inputClass}
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Auto-filled from the address — edit to override.
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>Extra discount (৳)</label>
                    <input
                      type="number"
                      value={manualDiscount}
                      onChange={(e) => setManualDiscount(e.target.value)}
                      placeholder="0"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Summary */}
            <section className="bg-gray-50 rounded-xl px-4 py-3 text-sm space-y-1.5">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span>৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>
                  Delivery charge
                  {shippingEdited ? " (manual)" : " (auto)"}
                  {quoting ? " …" : ""}
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
                <span>Total to collect</span>
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
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-60"
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
