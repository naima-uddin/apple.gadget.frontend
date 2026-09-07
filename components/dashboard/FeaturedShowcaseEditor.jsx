"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { uploadAdminImage } from "@/lib/uploadImage";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

const DEFAULTS = {
  enabled: true,
  title: "Featured Products",
  subtitle: "Handpicked gadgets, refreshed for you.",
  tabs: [
    { label: "Latest", type: "manual", productIds: [], imageMap: {}, qtyMap: {}, enabled: true },
    { label: "Top Seller", type: "manual", productIds: [], imageMap: {}, qtyMap: {}, enabled: true },
    { label: "Featured", type: "manual", productIds: [], imageMap: {}, qtyMap: {}, enabled: true },
    { label: "Trending", type: "manual", productIds: [], imageMap: {}, qtyMap: {}, enabled: true },
  ],
};

const TAB_TYPES = [
  { value: "latest", label: "Latest (newest products)" },
  { value: "top", label: "Top Seller (most sold)" },
  { value: "featured", label: "Featured (products with Featured flag)" },
  { value: "trending", label: "Trending (products with Trending badge)" },
  { value: "manual", label: "Manual (hand-pick products)" },
];

// Admin editor for the tabbed "Featured Products" showcase shown right after
// the category grid on the homepage. Saved to Setting.featuredShowcase and
// served (resolved) via GET /api/featured-showcase. Rendered by
// components/home/FeaturedShowcase.jsx.
export default function FeaturedShowcaseEditor() {
  const [cfg, setCfg] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/admin/settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const c = d.settings?.featuredShowcase;
        if (c && Array.isArray(c.tabs) && c.tabs.length) {
          setCfg({
            ...DEFAULTS,
            ...c,
            tabs: c.tabs.map((t) => ({
              label: t.label || "",
              type: t.type || "latest",
              productIds: (t.productIds || []).map(String),
              // normalise the per-product image override to a plain object of
              // { [productId]: index | url }
              imageMap: t.imageMap && typeof t.imageMap === "object" ? { ...t.imageMap } : {},
              // per-product add-to-cart quantity { [productId]: number }
              qtyMap: t.qtyMap && typeof t.qtyMap === "object" ? { ...t.qtyMap } : {},
              enabled: t.enabled !== false,
            })),
          });
        }
      })
      .catch(() => setMessage({ type: "error", text: "Failed to load data" }))
      .finally(() => setLoading(false));
  }, []);

  const set = (patch) => setCfg((prev) => ({ ...prev, ...patch }));

  const setTab = (idx, patch) =>
    setCfg((prev) => ({
      ...prev,
      tabs: prev.tabs.map((t, i) => (i === idx ? { ...t, ...patch } : t)),
    }));

  const addTab = () =>
    setCfg((prev) => ({
      ...prev,
      tabs: [
        ...prev.tabs,
        { label: "New Tab", type: "manual", productIds: [], imageMap: {}, qtyMap: {}, enabled: true },
      ],
    }));

  const removeTab = (idx) =>
    setCfg((prev) => ({
      ...prev,
      tabs: prev.tabs.filter((_, i) => i !== idx),
    }));

  const moveTab = (idx, dir) =>
    setCfg((prev) => {
      const tabs = [...prev.tabs];
      const j = idx + dir;
      if (j < 0 || j >= tabs.length) return prev;
      [tabs[idx], tabs[j]] = [tabs[j], tabs[idx]];
      return { ...prev, tabs };
    });

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        ...cfg,
        tabs: cfg.tabs.map((t) => {
          const productIds = t.type === "manual" ? t.productIds : [];
          // keep image overrides only for products still selected. A value is
          // either a custom uploaded image URL (string) or a product image
          // index (number).
          const imageMap = {};
          const qtyMap = {};
          if (t.type === "manual") {
            for (const id of productIds) {
              const v = t.imageMap?.[id];
              if (Number.isInteger(v) || (typeof v === "string" && v.trim()))
                imageMap[id] = v;
              const q = t.qtyMap?.[id];
              if (Number.isInteger(q) && q > 1) qtyMap[id] = q;
            }
          }
          return {
            label: t.label,
            type: t.type,
            enabled: t.enabled,
            productIds,
            imageMap,
            qtyMap,
          };
        }),
      };
      const resp = await fetch(`${API}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ featuredShowcase: payload }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Save failed");
      setMessage({ type: "success", text: "Saved! Homepage updated." });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <div className="py-16 text-center text-gray-400">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1F2937] work-sans">
            Featured Products Showcase
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            The tabbed, Starbucks-style showcase shown right after the category
            grid on the homepage. Set each tab to <strong>Manual</strong> to
            hand-pick its products, then for each product either{" "}
            <strong>upload your own showcase image</strong> or click one of its
            product images to use as the big hero. If you set neither, the
            product&apos;s <strong>2nd image</strong> is used by default — for
            the best floating look use a transparent-background PNG.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 shrink-0">
          <input
            type="checkbox"
            checked={cfg.enabled}
            onChange={(e) => set({ enabled: e.target.checked })}
            className="w-4 h-4"
          />
          {cfg.enabled ? "Enabled" : "Disabled"}
        </label>
      </div>

      {/* Heading text */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Heading
          </label>
          <input
            value={cfg.title || ""}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="Featured Products"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Subtitle
          </label>
          <input
            value={cfg.subtitle || ""}
            onChange={(e) => set({ subtitle: e.target.value })}
            placeholder="Handpicked gadgets, refreshed for you."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
            Tabs
          </h3>
          <button
            type="button"
            onClick={addTab}
            className="text-xs px-3 py-1.5 bg-[#1D1D1F] text-white rounded-lg font-semibold hover:bg-black"
          >
            + Add Tab
          </button>
        </div>

        {cfg.tabs.length === 0 && (
          <p className="text-sm text-gray-400">
            No tabs — add at least one, or the showcase stays hidden.
          </p>
        )}

        {cfg.tabs.map((tab, idx) => (
          <TabEditor
            key={idx}
            index={idx}
            tab={tab}
            isFirst={idx === 0}
            isLast={idx === cfg.tabs.length - 1}
            onChange={(patch) => setTab(idx, patch)}
            onRemove={() => removeTab(idx)}
            onMove={(dir) => moveTab(idx, dir)}
          />
        ))}
      </div>

      {message && (
        <p
          className={`text-sm font-medium ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2 bg-[#1D1D1F] text-white rounded-lg font-semibold hover:bg-black disabled:opacity-50 transition"
      >
        {saving ? "Saving…" : "Save Showcase"}
      </button>
    </div>
  );
}

// One tab row: label, type, enable, reorder/remove, and (for manual) a product
// picker.
function TabEditor({ index, tab, isFirst, isLast, onChange, onRemove, onMove }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-gray-400 w-5">{index + 1}</span>
        <input
          value={tab.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Tab label"
          className="flex-1 min-w-[140px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
        />
        <select
          value={tab.type}
          onChange={(e) => onChange({ type: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          {TAB_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
          <input
            type="checkbox"
            checked={tab.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
            className="w-4 h-4"
          />
          On
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={isFirst}
            className="w-7 h-7 rounded-lg border border-gray-300 text-gray-600 disabled:opacity-30 hover:bg-gray-100"
            title="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={isLast}
            className="w-7 h-7 rounded-lg border border-gray-300 text-gray-600 disabled:opacity-30 hover:bg-gray-100"
            title="Move down"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="w-7 h-7 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
            title="Remove tab"
          >
            ✕
          </button>
        </div>
      </div>

      {tab.type === "manual" ? (
        <ManualProductPicker
          productIds={tab.productIds || []}
          imageMap={tab.imageMap || {}}
          qtyMap={tab.qtyMap || {}}
          onChange={(productIds) => onChange({ productIds })}
          onImageMapChange={(imageMap) => onChange({ imageMap })}
          onQtyMapChange={(qtyMap) => onChange({ qtyMap })}
        />
      ) : (
        <p className="text-xs text-gray-400 pl-8">
          Auto — products are picked automatically for this tab.
        </p>
      )}
    </div>
  );
}

// Search + add products, shows selected as an ordered list. Each selected
// product exposes an image picker so the admin chooses which of its images is
// shown as the big hero in the storefront showcase.
function ManualProductPicker({ productIds, imageMap, qtyMap, onChange, onImageMapChange, onQtyMapChange }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  // id -> full product object. `selected` is derived from productIds + cache,
  // so the effect only ever fills the cache asynchronously (no sync setState).
  const [cache, setCache] = useState({});
  const debounceRef = useRef(null);

  const ids = (productIds || []).map(String);
  const selected = ids.map((id) => cache[id]).filter(Boolean);

  // Fetch product objects for any saved ids not yet in the cache.
  useEffect(() => {
    const missing = ids.filter((id) => !cache[id]);
    if (missing.length === 0) return;
    let cancelled = false;
    fetch(`${API}/api/products?ids=${missing.join(",")}&limit=50`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const add = Object.fromEntries(
          (d.items || []).map((p) => [String(p._id), p]),
        );
        setCache((prev) => ({ ...prev, ...add }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productIds]);

  const search = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const r = await fetch(
        `${API}/api/products?q=${encodeURIComponent(q)}&suggest=1&limit=10&status=published`,
        { credentials: "include" },
      );
      const json = await r.json();
      setResults(json.items || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  };

  const add = (p) => {
    const id = String(p._id);
    if (ids.includes(id)) return;
    setCache((prev) => ({ ...prev, [id]: p }));
    onChange([...ids, id]);
    setQuery("");
    setResults([]);
  };

  const remove = (id) => {
    const key = String(id);
    onChange(ids.filter((x) => x !== key));
    if (imageMap && imageMap[key] != null) {
      const next = { ...imageMap };
      delete next[key];
      onImageMapChange(next);
    }
    if (qtyMap && qtyMap[key] != null) {
      const next = { ...qtyMap };
      delete next[key];
      onQtyMapChange(next);
    }
  };

  // Set (or clear, when idx === null) the showcase-image override for a product.
  const setImage = (id, idx) => {
    const key = String(id);
    const next = { ...(imageMap || {}) };
    if (idx == null) delete next[key];
    else next[key] = idx;
    onImageMapChange(next);
  };

  // Set the add-to-cart quantity for a product (1 => cleared/default).
  const setQty = (id, qty) => {
    const key = String(id);
    const next = { ...(qtyMap || {}) };
    if (!Number.isInteger(qty) || qty <= 1) delete next[key];
    else next[key] = qty;
    onQtyMapChange(next);
  };

  return (
    <div className="pl-8 space-y-3">
      <div className="relative">
        <input
          value={query}
          onChange={handleInput}
          placeholder="Search products to add…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
        />
        {searching && (
          <span className="absolute right-3 top-2.5 text-xs text-gray-400">
            searching…
          </span>
        )}
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
            {results.map((p) => (
              <button
                type="button"
                key={p._id}
                onClick={() => add(p)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left"
              >
                <ProductThumb product={p} />
                <span className="text-sm text-gray-800 line-clamp-1">
                  {p.title || p.slug}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected.length > 0 ? (
        <div className="space-y-2">
          {selected.map((p) => (
            <SelectedProductRow
              key={p._id}
              product={p}
              override={imageMap ? imageMap[String(p._id)] : undefined}
              qty={qtyMap && Number.isInteger(qtyMap[String(p._id)]) ? qtyMap[String(p._id)] : 1}
              onSetImage={(val) => setImage(p._id, val)}
              onSetQty={(q) => setQty(p._id, q)}
              onRemove={() => remove(p._id)}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400">
          No products picked yet — search above to add.
        </p>
      )}
    </div>
  );
}

// One selected product: title + remove, plus the showcase-image controls. The
// admin can EITHER upload a custom image (their own artwork — recommended for
// the floating hero) OR click one of the product's own images. The chosen image
// is stored as the override value: a URL string for a custom upload, or a number
// for a product-image index. When nothing is chosen the storefront falls back to
// the product's 2nd image (index 1), then the 1st — that image is marked
// "Default".
function SelectedProductRow({ product, override, qty, onSetImage, onSetQty, onRemove }) {
  const images = (product.images || []).filter((i) => i && i.url);
  // Which product image the storefront uses when there's no explicit override.
  const defaultIndex = images.length > 1 ? 1 : 0;

  // Decode the override into its two possible forms.
  const customUrl = typeof override === "string" && override.trim() ? override : null;
  const selectedIndex = Number.isInteger(override) ? override : null;

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const { asset } = await uploadAdminImage(file, "applebd/featured-showcase");
      onSetImage(asset.url); // store the custom URL as the override
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-center gap-2 mb-2">
        <ProductThumb product={product} small />
        <span className="text-sm text-gray-800 flex-1 truncate">
          {product.title || product.slug}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-400 hover:text-red-600 text-xs px-1"
          title="Remove product"
        >
          ✕
        </button>
      </div>

      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
        Showcase image
      </p>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {/* Custom uploaded image (if any) shown first, highlighted */}
        {customUrl && (
          <div
            className="relative shrink-0 h-14 w-14 rounded-lg overflow-hidden border border-[#1D1D1F] ring-2 ring-[#1D1D1F]"
            title="Custom uploaded image"
          >
            <Image src={encodeURI(customUrl)} alt="" fill sizes="56px" className="object-cover" />
            <span className="absolute bottom-0 inset-x-0 bg-[#1D1D1F] text-white text-[9px] font-semibold text-center py-0.5">
              Custom
            </span>
            <button
              type="button"
              onClick={() => onSetImage(null)}
              className="absolute top-0 right-0 bg-black/60 text-white w-4 h-4 leading-none text-[10px] rounded-bl"
              title="Remove custom image"
            >
              ✕
            </button>
          </div>
        )}

        {/* Upload tile */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="shrink-0 h-14 w-14 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-[#1D1D1F] hover:text-[#1D1D1F] flex flex-col items-center justify-center gap-0.5 disabled:opacity-50"
          title="Upload your own image"
        >
          <span className="text-lg leading-none">{uploading ? "…" : "⬆"}</span>
          <span className="text-[9px] font-semibold">
            {uploading ? "Uploading" : "Upload"}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />

        {/* Divider between upload and the product's own images */}
        {images.length > 0 && <span className="shrink-0 h-10 w-px bg-gray-200 mx-1" />}

        {/* The product's own images — click to use one instead of a custom upload */}
        {images.map((img, idx) => {
          const isPicked = !customUrl && selectedIndex === idx;
          // Highlight the effective product image only when no custom image is
          // set: the explicit pick, or the default when nothing is picked.
          const isEffective =
            !customUrl && (selectedIndex == null ? idx === defaultIndex : isPicked);
          return (
            <button
              type="button"
              key={idx}
              onClick={() => onSetImage(isPicked ? null : idx)}
              title={isPicked ? "Showcase image (click to reset)" : "Use this product image"}
              className={`relative shrink-0 h-14 w-14 rounded-lg overflow-hidden border transition-all ${
                isEffective
                  ? "border-[#1D1D1F] ring-2 ring-[#1D1D1F]"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <Image src={encodeURI(img.url)} alt="" fill sizes="56px" className="object-cover" />
              {isPicked && (
                <span className="absolute bottom-0 inset-x-0 bg-[#1D1D1F] text-white text-[9px] font-semibold text-center py-0.5">
                  Showcase
                </span>
              )}
              {!isPicked && isEffective && (
                <span className="absolute bottom-0 inset-x-0 bg-gray-700/80 text-white text-[9px] font-semibold text-center py-0.5">
                  Default
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
      <p className="text-[11px] text-gray-400 mt-1.5">
        Upload your own image (transparent PNG works best), or click a product
        image. Leave unset to use the product&apos;s 2nd image.
      </p>

      {/* Add-to-cart quantity */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
        <span className="text-xs font-semibold text-gray-600">
          Add-to-cart quantity
        </span>
        <div className="inline-flex items-center rounded-lg border border-gray-300 overflow-hidden">
          <button
            type="button"
            onClick={() => onSetQty(Math.max(1, (qty || 1) - 1))}
            className="w-7 h-7 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            disabled={(qty || 1) <= 1}
            title="Decrease"
          >
            −
          </button>
          <input
            type="number"
            min="1"
            value={qty || 1}
            onChange={(e) => onSetQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-12 h-7 text-center text-sm border-x border-gray-300 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => onSetQty((qty || 1) + 1)}
            className="w-7 h-7 text-gray-600 hover:bg-gray-100"
            title="Increase"
          >
            +
          </button>
        </div>
        <span className="text-[11px] text-gray-400">
          units added per Buy&nbsp;Now / Add&nbsp;to&nbsp;Cart
        </span>
      </div>
    </div>
  );
}

function ProductThumb({ product, small }) {
  const url =
    (product.images && product.images[0] && product.images[0].url) ||
    "/assets/placeholder.svg";
  const size = small ? 22 : 32;
  return (
    <span
      className="relative inline-block rounded overflow-hidden bg-gray-100 shrink-0"
      style={{ width: size, height: size }}
    >
      <Image
        src={encodeURI(url)}
        alt=""
        fill
        sizes="32px"
        className="object-cover"
      />
    </span>
  );
}
