"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@/components/context/UserContext";
import { hasPermission } from "@/lib/permissions";

export default function ProductAsideSections({
  product,
  setProduct,
  badgeOptions,
  setBadgeOptions,
  showBadgeManager,
  setShowBadgeManager,
  badgeSaving,
  saveBadgeOptions,
  newBadgeLabel,
  setNewBadgeLabel,
  newBadgeKey,
  setNewBadgeKey,
  normalizeBadgeKey,
  labelClass,
  inputClass,
  API,
}) {
  const [barcodeLookup, setBarcodeLookup] = useState({
    status: "idle",
    message: "",
  });
  const { user } = useUser();
  const canSeeBuyingPrice = hasPermission(user, "products.buying_price");

  // --- Dropshipping cost & packaging cost: pulled from their dashboard
  // list pages, with a quick inline add/edit so admins don't have to leave
  // the product form to create a new option. Dropshipping cost = what it
  // costs to bring this product from the supplier to the store; it feeds
  // the "Cost Per Item" total below alongside buying price + packaging.
  const [dropshippingItems, setDropshippingItems] = useState([]);
  const [showDeliveryManager, setShowDeliveryManager] = useState(false);
  const [newDropshipping, setNewDropshipping] = useState({
    name: "",
    cost: "",
    description: "",
  });
  const [editingDropshippingId, setEditingDropshippingId] = useState(null);
  const [deliverySaving, setDeliverySaving] = useState(false);

  const [packagingItems, setPackagingItems] = useState([]);
  const [showPackagingManager, setShowPackagingManager] = useState(false);
  const [newPackaging, setNewPackaging] = useState({
    name: "",
    cost: "",
    description: "",
  });
  const [editingPackagingId, setEditingPackagingId] = useState(null);
  const [packagingSaving, setPackagingSaving] = useState(false);

  const loadDropshippingItems = React.useCallback(async () => {
    try {
      const resp = await fetch(`${API}/api/admin/dropshipping-costs`, {
        credentials: "include",
      });
      const body = await resp.json();
      setDropshippingItems(body?.items || []);
    } catch {
      /* leave list empty */
    }
  }, [API]);

  const loadPackagingItems = React.useCallback(async () => {
    try {
      const resp = await fetch(`${API}/api/admin/packaging-costs`, {
        credentials: "include",
      });
      const body = await resp.json();
      setPackagingItems(body?.items || []);
    } catch {
      /* leave list empty */
    }
  }, [API]);

  useEffect(() => {
    loadDropshippingItems();
    loadPackagingItems();
  }, [loadDropshippingItems, loadPackagingItems]);

  const resetDropshippingForm = () => {
    setNewDropshipping({ name: "", cost: "", description: "" });
    setEditingDropshippingId(null);
  };

  const editDropshippingItem = (item) => {
    setEditingDropshippingId(item._id);
    setNewDropshipping({
      name: item.name || "",
      cost: String(item.cost ?? ""),
      description: item.description || "",
    });
  };

  const saveDropshippingItem = async () => {
    if (!newDropshipping.name.trim()) {
      alert("Enter an item name");
      return;
    }
    const cost = Number(newDropshipping.cost);
    if (!Number.isFinite(cost) || cost < 0) {
      alert("Enter a valid cost");
      return;
    }
    setDeliverySaving(true);
    try {
      const resp = await fetch(
        editingDropshippingId
          ? `${API}/api/admin/dropshipping-costs/${editingDropshippingId}`
          : `${API}/api/admin/dropshipping-costs`,
        {
          method: editingDropshippingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: newDropshipping.name,
            cost,
            description: newDropshipping.description,
          }),
        },
      );
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Save failed");
      resetDropshippingForm();
      await loadDropshippingItems();
    } catch (err) {
      alert(err.message || "Failed to save dropshipping cost");
    } finally {
      setDeliverySaving(false);
    }
  };

  const resetPackagingForm = () => {
    setNewPackaging({ name: "", cost: "", description: "" });
    setEditingPackagingId(null);
  };

  const editPackagingItem = (item) => {
    setEditingPackagingId(item._id);
    setNewPackaging({
      name: item.name || "",
      cost: String(item.cost ?? ""),
      description: item.description || "",
    });
  };

  const savePackagingItem = async () => {
    if (!newPackaging.name.trim()) {
      alert("Enter an item name");
      return;
    }
    const cost = Number(newPackaging.cost);
    if (!Number.isFinite(cost) || cost < 0) {
      alert("Enter a valid cost");
      return;
    }
    setPackagingSaving(true);
    try {
      const resp = await fetch(
        editingPackagingId
          ? `${API}/api/admin/packaging-costs/${editingPackagingId}`
          : `${API}/api/admin/packaging-costs`,
        {
          method: editingPackagingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: newPackaging.name,
            cost,
            description: newPackaging.description,
          }),
        },
      );
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Save failed");
      resetPackagingForm();
      await loadPackagingItems();
    } catch (err) {
      alert(err.message || "Failed to save packaging cost");
    } finally {
      setPackagingSaving(false);
    }
  };

  const generateSku = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const rand = (n) =>
      Array.from(
        { length: n },
        () => chars[Math.floor(Math.random() * chars.length)],
      ).join("");
    const date = new Date();
    const ymd =
      String(date.getFullYear()).slice(-2) +
      String(date.getMonth() + 1).padStart(2, "0") +
      String(date.getDate()).padStart(2, "0");
    setProduct((p) => ({ ...p, sku: `SB-${ymd}-${rand(5)}` }));
  };
  const promotionFlags = [
    {
      field: "featured",
      key: "flag:featured",
      label: "Featured",
      color: "bg-violet-100 text-violet-800",
    },
    {
      field: "coupon",
      key: "flag:coupon",
      label: "Coupon",
      color: "bg-teal-100 text-teal-800",
    },
    {
      field: "flashSale",
      key: "flag:flashSale",
      label: "Flash Sale",
      color: "bg-violet-100 text-violet-800",
    },
    {
      field: "clearance",
      key: "flag:clearance",
      label: "Clearance",
      color: "bg-amber-100 text-amber-800",
    },
    {
      field: "freeShipping",
      key: "flag:freeShipping",
      label: "Free Shipping",
      color: "bg-green-100 text-green-800",
    },
  ];
  const badgeChoices = [
    ...(badgeOptions || []).map((item) => ({
      ...item,
      key: `badge:${item.key}`,
      type: "badge",
      value: item.key,
    })),
    ...promotionFlags.map((item) => ({
      ...item,
      type: "flag",
      value: item.field,
    })),
  ];
  const selectedBadges = (badgeOptions || []).filter((item) =>
    (product.badges || []).includes(item.key),
  );
  const selectedFlags = promotionFlags.filter((item) => product[item.field]);
  const barcodeValue = String(product.barcode || "").trim();

  useEffect(() => {
    const code = barcodeValue.replace(/\s+/g, "");
    if (!code) {
      setBarcodeLookup({ status: "idle", message: "" });
      return;
    }
    let active = true;
    setBarcodeLookup({ status: "checking", message: "Checking barcode..." });
    const timer = setTimeout(async () => {
      try {
        const resp = await fetch(
          `${API}/api/admin/barcodes?code=${encodeURIComponent(code)}&limit=5`,
          {
            credentials: "include",
          },
        );
        const data = await resp.json();
        if (!active) return;
        const item =
          data?.items?.find((row) => String(row.code || "") === code) ||
          data?.items?.[0];
        if (!item) {
          setBarcodeLookup({
            status: "available",
            message: "Not added to any product — you can add this barcode",
          });
          return;
        }
        const linkedId = String(
          item.product?._id || item.product?.id || item.product || "",
        );
        const currentId = String(product._id || "");
        if (!linkedId) {
          setBarcodeLookup({
            status: "available",
            message: "Not added to any product — you can add this barcode",
          });
          return;
        }
        if (currentId && linkedId === currentId) {
          setBarcodeLookup({
            status: "linked",
            message: "Linked to this product",
          });
          return;
        }
        setBarcodeLookup({
          status: "taken",
          message: `Already linked to ${item.product?.title || "another product"}`,
        });
      } catch {
        if (!active) return;
        setBarcodeLookup({
          status: "error",
          message: "Could not verify barcode right now",
        });
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [barcodeValue, API, product._id, product?.title]);

  const barcodeStatusTone = useMemo(() => {
    switch (barcodeLookup.status) {
      case "available":
      case "linked":
        return "text-green-700 bg-green-50 border-green-200";
      case "taken":
        return "text-violet-800 bg-violet-50 border-violet-200";
      case "checking":
        return "text-blue-700 bg-blue-50 border-blue-200";
      case "error":
        return "text-amber-700 bg-amber-50 border-amber-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  }, [barcodeLookup.status]);

  const generateBarcode = () => {
    const code =
      `${Date.now()}${Math.floor(Math.random() * 900000 + 100000)}`.slice(
        0,
        12,
      );
    setProduct((p) => ({ ...p, barcode: code }));
  };

  const handleBadgeSelect = (value) => {
    if (!value) return;
    const choice = badgeChoices.find((item) => item.key === value);
    if (!choice) return;
    if (choice.type === "badge") {
      setProduct((p) => ({
        ...p,
        badges: (p.badges || []).includes(choice.value)
          ? p.badges || []
          : [...(p.badges || []), choice.value],
      }));
      return;
    }
    setProduct((p) => ({ ...p, [choice.value]: true }));
  };

  return (
    <>
      <section
        id="product-badges"
        className="rounded-2xl border border-gray-200 bg-slate-50 p-5 shadow-sm scroll-mt-6"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
          Product Badges & Promotion Flags
        </p>
        <div className="mt-4 space-y-3">
          <select
            value=""
            onChange={(e) => handleBadgeSelect(e.target.value)}
            className={inputClass}
          >
            <option value="">Select badges</option>
            {badgeChoices.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-2">
            {selectedBadges.map((item) => (
              <span
                key={item.key}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${item.color || "bg-gray-100 text-gray-800"}`}
              >
                {item.label}
                <button
                  type="button"
                  onClick={() =>
                    setProduct((p) => ({
                      ...p,
                      badges: (p.badges || []).filter(
                        (key) => key !== item.key,
                      ),
                    }))
                  }
                  className="text-gray-500 hover:text-red-600"
                >
                  x
                </button>
              </span>
            ))}
            {selectedFlags.map((item) => (
              <span
                key={item.field}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${item.color}`}
              >
                {item.label}
                <button
                  type="button"
                  onClick={() =>
                    setProduct((p) => ({ ...p, [item.field]: false }))
                  }
                  className="text-gray-500 hover:text-red-600"
                >
                  x
                </button>
              </span>
            ))}
            {!selectedBadges.length && !selectedFlags.length && (
              <p className="text-xs text-gray-500">No badge selected.</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowBadgeManager((v) => !v)}
          className="mt-3 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-gray-100"
        >
          {showBadgeManager ? "Hide Badge Manager" : "Manage Badges"}
        </button>

        {showBadgeManager && (
          <div className="mt-3 space-y-3 rounded-xl border border-gray-300 bg-gray-50 p-3">
            {(badgeOptions || []).map((item, index) => (
              <div
                key={`${item.key}-${index}`}
                className="space-y-2 rounded-lg bg-white p-2"
              >
                <input
                  type="text"
                  value={item.label || ""}
                  onChange={(e) =>
                    setBadgeOptions((prev) =>
                      prev.map((b, i) =>
                        i === index ? { ...b, label: e.target.value } : b,
                      ),
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Badge label"
                />
                <input
                  type="text"
                  value={item.key || ""}
                  onChange={(e) => {
                    const oldKey = item.key;
                    const nextKey = normalizeBadgeKey(e.target.value);
                    setBadgeOptions((prev) =>
                      prev.map((b, i) =>
                        i === index ? { ...b, key: nextKey } : b,
                      ),
                    );
                    if (oldKey && nextKey && oldKey !== nextKey) {
                      setProduct((prev) => ({
                        ...prev,
                        badges: (prev.badges || []).map((x) =>
                          x === oldKey ? nextKey : x,
                        ),
                      }));
                    }
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="badge_key"
                />
                <button
                  type="button"
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => {
                    const removed = badgeOptions[index];
                    setBadgeOptions(badgeOptions.filter((_, i) => i !== index));
                    if (removed?.key) {
                      setProduct((prev) => ({
                        ...prev,
                        badges: (prev.badges || []).filter(
                          (x) => x !== removed.key,
                        ),
                      }));
                    }
                  }}
                >
                  Remove
                </button>
              </div>
            ))}

            <div className="space-y-2 border-t border-gray-300 pt-3">
              <input
                type="text"
                value={newBadgeLabel}
                onChange={(e) => setNewBadgeLabel(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="New badge label"
              />
              <input
                type="text"
                value={newBadgeKey}
                onChange={(e) => setNewBadgeKey(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="new_badge_key"
              />
              <button
                type="button"
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-gray-100"
                onClick={() => {
                  const key = normalizeBadgeKey(newBadgeKey || newBadgeLabel);
                  const label = String(newBadgeLabel || "").trim();
                  if (!key || !label) return;
                  if ((badgeOptions || []).some((b) => b.key === key)) return;
                  setBadgeOptions((prev) => [
                    ...prev,
                    { key, label, color: "bg-gray-100 text-gray-800" },
                  ]);
                  setNewBadgeKey("");
                  setNewBadgeLabel("");
                }}
              >
                Add Badge
              </button>
            </div>

            <button
              type="button"
              disabled={badgeSaving}
              onClick={() => saveBadgeOptions(badgeOptions)}
              className="w-full rounded-lg bg-gray-800 px-4 py-2 text-sm text-white hover:bg-[#1D1D1F] disabled:opacity-60"
            >
              {badgeSaving ? "Saving..." : "Save Badge Options"}
            </button>
          </div>
        )}
      </section>

      <section
        id="pricing-inventory"
        className="rounded-2xl border border-gray-200 bg-slate-50 p-5 shadow-sm scroll-mt-6"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
          Pricing & Inventory
        </p>
        <div className="mt-4 space-y-4">
          {canSeeBuyingPrice && (
            <div>
              <label className={labelClass}>Buying Price</label>
              <input
                type="number"
                value={product.buyingPrice ?? ""}
                onChange={(e) =>
                  setProduct((p) => ({
                    ...p,
                    buyingPrice:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  }))
                }
                className={inputClass}
                placeholder="0.00"
                step="0.01"
              />
              <p className="mt-1 text-xs text-gray-500">
                This is the buying price of the product.
              </p>
            </div>
          )}
          {canSeeBuyingPrice && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>
                  Delivery Charge (dropshipping to store)
                </label>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value === "") return;
                    setProduct((p) => ({
                      ...p,
                      deliveryCharge: Number(e.target.value),
                    }));
                  }}
                  className={`${inputClass} mb-2`}
                >
                  <option value="">Pick saved cost…</option>
                  {dropshippingItems.map((item) => (
                    <option key={item._id} value={item.cost}>
                      {item.name} — ৳{item.cost}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={product.deliveryCharge ?? ""}
                  onChange={(e) =>
                    setProduct((p) => ({
                      ...p,
                      deliveryCharge:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                  placeholder="0.00"
                  step="0.01"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Cost to bring this product from the dropshipping supplier
                  to the store — not the customer-facing shipping charge.
                </p>
                <div className="mt-1.5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeliveryManager((v) => !v)}
                    className="text-xs font-semibold text-[#1D1D1F] hover:underline"
                  >
                    {showDeliveryManager ? "Hide" : "+ Add / Edit"}
                  </button>
                  <Link
                    href="/dashboard/dropshipping-cost"
                    className="text-xs text-gray-500 hover:underline"
                  >
                    Manage all
                  </Link>
                </div>
              </div>
              <div>
                <label className={labelClass}>Packaging Cost</label>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value === "") return;
                    setProduct((p) => ({
                      ...p,
                      packagingCost: Number(e.target.value),
                    }));
                  }}
                  className={`${inputClass} mb-2`}
                >
                  <option value="">Pick saved cost…</option>
                  {packagingItems.map((item) => (
                    <option key={item._id} value={item.cost}>
                      {item.name} — ৳{item.cost}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={product.packagingCost ?? ""}
                  onChange={(e) =>
                    setProduct((p) => ({
                      ...p,
                      packagingCost:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                  placeholder="0.00"
                  step="0.01"
                />
                <div className="mt-1.5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPackagingManager((v) => !v)}
                    className="text-xs font-semibold text-[#1D1D1F] hover:underline"
                  >
                    {showPackagingManager ? "Hide" : "+ Add / Edit"}
                  </button>
                  <Link
                    href="/dashboard/packaging-cost"
                    className="text-xs text-gray-500 hover:underline"
                  >
                    Manage all
                  </Link>
                </div>
              </div>
            </div>
          )}

          {canSeeBuyingPrice && showDeliveryManager && (
            <div className="space-y-2 rounded-xl border border-gray-300 bg-gray-50 p-3">
              <p className="text-xs font-semibold text-gray-700">
                {editingDropshippingId
                  ? "Edit dropshipping cost item"
                  : "Add dropshipping cost item"}
              </p>
              <input
                type="text"
                value={newDropshipping.name}
                onChange={(e) =>
                  setNewDropshipping((p) => ({ ...p, name: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Item name (e.g. Local Courier)"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={newDropshipping.cost}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, "");
                    setNewDropshipping((p) => ({ ...p, cost: val }));
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Cost (৳)"
                />
                <button
                  type="button"
                  disabled={deliverySaving}
                  onClick={saveDropshippingItem}
                  className="shrink-0 rounded-lg bg-gray-800 px-4 py-2 text-sm text-white hover:bg-[#1D1D1F] disabled:opacity-60"
                >
                  {deliverySaving
                    ? "Saving..."
                    : editingDropshippingId
                      ? "Update"
                      : "Add"}
                </button>
                {editingDropshippingId && (
                  <button
                    type="button"
                    onClick={resetDropshippingForm}
                    className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                )}
              </div>
              {dropshippingItems.length > 0 && (
                <div className="mt-2 max-h-32 divide-y divide-gray-200 overflow-y-auto border-t border-gray-300">
                  {dropshippingItems.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between py-1.5 text-xs"
                    >
                      <span className="text-gray-700">
                        {item.name} — ৳{item.cost}
                      </span>
                      <button
                        type="button"
                        onClick={() => editDropshippingItem(item)}
                        className="font-semibold text-[#1D1D1F] hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {canSeeBuyingPrice && showPackagingManager && (
            <div className="space-y-2 rounded-xl border border-gray-300 bg-gray-50 p-3">
              <p className="text-xs font-semibold text-gray-700">
                {editingPackagingId
                  ? "Edit packaging item"
                  : "Add packaging item"}
              </p>
              <input
                type="text"
                value={newPackaging.name}
                onChange={(e) =>
                  setNewPackaging((p) => ({ ...p, name: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Item name (e.g. Box)"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={newPackaging.cost}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, "");
                    setNewPackaging((p) => ({ ...p, cost: val }));
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Cost (৳)"
                />
                <button
                  type="button"
                  disabled={packagingSaving}
                  onClick={savePackagingItem}
                  className="shrink-0 rounded-lg bg-gray-800 px-4 py-2 text-sm text-white hover:bg-[#1D1D1F] disabled:opacity-60"
                >
                  {packagingSaving
                    ? "Saving..."
                    : editingPackagingId
                      ? "Update"
                      : "Add"}
                </button>
                {editingPackagingId && (
                  <button
                    type="button"
                    onClick={resetPackagingForm}
                    className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                )}
              </div>
              {packagingItems.length > 0 && (
                <div className="mt-2 max-h-32 divide-y divide-gray-200 overflow-y-auto border-t border-gray-300">
                  {packagingItems.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between py-1.5 text-xs"
                    >
                      <span className="text-gray-700">
                        {item.name} — ৳{item.cost}
                      </span>
                      <button
                        type="button"
                        onClick={() => editPackagingItem(item)}
                        className="font-semibold text-[#1D1D1F] hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {canSeeBuyingPrice && (
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Cost Per Item
                </p>
                <p className="text-xs text-gray-500">
                  Buying Price + Delivery Charge (dropshipping to store) +
                  Packaging Cost
                </p>
              </div>
              <p className="text-lg font-bold text-[#1D1D1F] tabular-nums">
                {(
                  Number(product.buyingPrice || 0) +
                  Number(product.deliveryCharge || 0) +
                  Number(product.packagingCost || 0)
                ).toFixed(2)}
              </p>
            </div>
          )}
          <div>
            <label className={labelClass}>
              Selling Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={product.price ?? ""}
              onChange={(e) =>
                setProduct((p) => ({
                  ...p,
                  price:
                    e.target.value === "" ? undefined : Number(e.target.value),
                }))
              }
              className={inputClass}
              placeholder="0.00"
              step="0.01"
            />
            <p className="mt-1 text-xs text-gray-500">
              Customer pays this price. Always fill this — offer বা no offer
              সবসময় এটা দিতে হবে।
            </p>
          </div>
          <div>
            <label className={labelClass}>MRP / Original Price</label>
            <input
              type="number"
              value={product.compareAtPrice ?? ""}
              onChange={(e) =>
                setProduct((p) => ({
                  ...p,
                  compareAtPrice:
                    e.target.value === "" ? undefined : Number(e.target.value),
                }))
              }
              className={inputClass}
              placeholder="0.00 (optional)"
              step="0.01"
            />
            <p className="mt-1 text-xs text-gray-500">
              Discount না থাকলে খালি রাখুন। এটা Selling Price-এর চেয়ে বেশি হলে
              frontend-এ কাটা দাম ও % discount দেখাবে।
            </p>
          </div>
          <div>
            <label className={labelClass}>Stock Quantity</label>
            <input
              type="number"
              value={product.inventory ?? ""}
              onChange={(e) =>
                setProduct((p) => ({
                  ...p,
                  inventory:
                    e.target.value === "" ? undefined : Number(e.target.value),
                }))
              }
              className={inputClass}
              placeholder="0"
            />
          </div>
          <div>
            <label className={labelClass}>SKU</label>
            <input
              type="text"
              value={product.sku || ""}
              onChange={(e) =>
                setProduct((p) => ({ ...p, sku: e.target.value }))
              }
              className={inputClass}
              placeholder="SB-260618-AB12C"
            />
            <div className="mt-2">
              <button
                type="button"
                onClick={generateSku}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-[#1D1D1F] hover:bg-gray-100"
              >
                Generate SKU
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Barcode</label>
            <input
              type="text"
              value={product.barcode || ""}
              onChange={(e) =>
                setProduct((p) => ({
                  ...p,
                  barcode: e.target.value.replace(/\s+/g, ""),
                }))
              }
              className={inputClass}
              placeholder="Scan or type barcode"
              inputMode="numeric"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={generateBarcode}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-[#1D1D1F] hover:bg-gray-100"
              >
                Generate Barcode
              </button>
              <Link
                href="/dashboard/barcodes"
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Manage Barcodes
              </Link>
            </div>
            {barcodeValue && (
              <p
                className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${barcodeStatusTone}`}
              >
                {barcodeLookup.status === "checking"
                  ? "Checking..."
                  : barcodeLookup.message || "Barcode set"}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Scanner input usually lands here automatically. Press Enter or
              type the number manually.
            </p>
          </div>
          <div>
            <label className={labelClass}>Availability Status</label>
            <select
              value={product.availability || "in_stock"}
              onChange={(e) =>
                setProduct((p) => ({ ...p, availability: e.target.value }))
              }
              className={inputClass}
            >
              <option value="in_stock">In Stock</option>
              <option value="pre_order">Pre-Order</option>
              <option value="upcoming">Coming Soon</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Low Stock Threshold</label>
            <input
              type="number"
              min="0"
              value={product.lowStockThreshold ?? 5}
              onChange={(e) =>
                setProduct((p) => ({
                  ...p,
                  lowStockThreshold: Math.max(0, Number(e.target.value)),
                }))
              }
              className={inputClass}
              placeholder="5"
            />
            <p className="mt-1 text-xs text-gray-400">
              Show "Low Stock" warning below this quantity
            </p>
          </div>
          <div className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 p-3">
            <div>
              <p className="text-xs font-semibold text-gray-700">
                Allow Overselling
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Customers can buy even when stock is 0
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setProduct((p) => ({
                  ...p,
                  allowOverselling: !p.allowOverselling,
                }))
              }
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none ${product.allowOverselling ? "bg-green-500" : "bg-gray-200"}`}
            >
              <span
                className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${product.allowOverselling ? "translate-x-4" : "translate-x-0.5"}`}
              />
            </button>
          </div>

          <div>
            <label className={labelClass}>Reward Points</label>
            <input
              type="number"
              value={product.rewardPoints ?? ""}
              onChange={(e) =>
                setProduct((p) => ({
                  ...p,
                  rewardPoints:
                    e.target.value === "" ? undefined : Number(e.target.value),
                }))
              }
              className={inputClass}
              placeholder="0"
            />
          </div>
        </div>
      </section>

      <section
        id="seo-search"
        className="rounded-2xl border border-gray-200 bg-slate-50 p-5 shadow-sm scroll-mt-6"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
          SEO & Search Optimization
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label className={labelClass}>SEO Title</label>
            <input
              type="text"
              value={product.seo?.title || ""}
              onChange={(e) =>
                setProduct((p) => ({
                  ...p,
                  seo: { ...(p.seo || {}), title: e.target.value },
                }))
              }
              className={inputClass}
              placeholder="Search title"
            />
            <p className="mt-1 text-xs text-gray-500">
              {(product.seo?.title || "").length}/60 recommended
            </p>
          </div>
          <div>
            <label className={labelClass}>SEO Meta Description</label>
            <textarea
              value={product.seo?.description || ""}
              onChange={(e) =>
                setProduct((p) => ({
                  ...p,
                  seo: { ...(p.seo || {}), description: e.target.value },
                }))
              }
              className={`${inputClass} h-28`}
              placeholder="Search description"
            />
            <p className="mt-1 text-xs text-gray-500">
              {(product.seo?.description || "").length}/155 recommended
            </p>
          </div>
          <div>
            <label className={labelClass}>SEO Keywords</label>
            <input
              type="text"
              value={product.seo?.keywords || ""}
              onChange={(e) =>
                setProduct((p) => ({
                  ...p,
                  seo: { ...(p.seo || {}), keywords: e.target.value },
                }))
              }
              className={inputClass}
              placeholder="comma separated keywords"
            />
          </div>
        </div>
      </section>
    </>
  );
}
