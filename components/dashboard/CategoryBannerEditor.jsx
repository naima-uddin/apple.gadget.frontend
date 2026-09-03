"use client";

import React, { useState, useEffect, useRef } from "react";
import MediaPicker from "@/components/dashboard/MediaPicker";
import { uploadAdminImage } from "@/lib/uploadImage";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

const DEFAULTS = {
  enabled: false,
  image: { url: "", public_id: "" },
  mobileImage: { url: "", public_id: "" },
  link: "/products/",
  label: "LIMITED TIME DEAL",
  heading: "Best Deals on",
  headingAccent: "Top Brands",
  subheading: "Grab amazing offers on your favorite products.",
  buttonText: "Shop Deals",
  buttonLink: "/products/",
  badgePrefix: "UP TO",
  badgeValue: "30% OFF",
  bgColor: "#111114",
  accentColor: "#F97316",
  products: [],
  brands: [],
};

// Admin editor for the mini promotional banner shown below "Shop by Category"
// on the homepage. Every field — text, colors, CTA, discount badge, product
// photos and the brand-logo row — is controlled here. Rendered by
// components/home/CategoryBanner.jsx.
export default function CategoryBannerEditor() {
  const [cfg, setCfg] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  // picker target: { kind: "product" | "brand", idx }
  const [picker, setPicker] = useState(null);
  const [uploading, setUploading] = useState(null); // `${kind}-${idx}`
  const fileRefs = useRef({});

  useEffect(() => {
    fetch(`${API}/api/admin/settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const c = d.settings?.categoryBanner;
        if (c) setCfg({ ...DEFAULTS, ...c });
      })
      .catch(() => setMessage({ type: "error", text: "Failed to load data" }))
      .finally(() => setLoading(false));
  }, []);

  const set = (patch) => setCfg((prev) => ({ ...prev, ...patch }));

  const setList = (kind, updater) =>
    setCfg((prev) => ({ ...prev, [kind]: updater(prev[kind] || []) }));

  const addProduct = () =>
    setList("products", (l) => [...l, { image: { url: "", public_id: "" } }]);
  const addBrand = () =>
    setList("brands", (l) => [
      ...l,
      { image: { url: "", public_id: "" }, link: "" },
    ]);

  const removeItem = (kind, idx) =>
    setList(kind, (l) => l.filter((_, i) => i !== idx));

  const moveItem = (kind, idx, dir) =>
    setList(kind, (l) => {
      const j = idx + dir;
      if (j < 0 || j >= l.length) return l;
      const next = [...l];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });

  const patchItem = (kind, idx, patch) =>
    setList(kind, (l) => {
      const next = [...l];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });

  const handleSingleUpload = async (field, file) => {
    if (!file) return;
    set({ [field]: { url: URL.createObjectURL(file), public_id: "" } });
    setUploading(field);
    try {
      const data = await uploadAdminImage(file, "applebd/category-banner");
      set({ [field]: { url: data.asset.url, public_id: data.asset.public_id } });
    } catch (err) {
      alert("Image upload failed: " + err.message);
      set({ [field]: { url: "", public_id: "" } });
    } finally {
      setUploading(null);
    }
  };

  const handleUpload = async (kind, idx, file) => {
    if (!file) return;
    const key = `${kind}-${idx}`;
    patchItem(kind, idx, { image: { url: URL.createObjectURL(file), public_id: "" } });
    setUploading(key);
    try {
      const folder =
        kind === "brand" ? "applebd/category-banner/brands" : "applebd/category-banner";
      const data = await uploadAdminImage(file, folder);
      patchItem(kind, idx, {
        image: { url: data.asset.url, public_id: data.asset.public_id },
      });
    } catch (err) {
      alert("Image upload failed: " + err.message);
      patchItem(kind, idx, { image: { url: "", public_id: "" } });
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const resp = await fetch(`${API}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ categoryBanner: cfg }),
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

  const field = (labelText, key, placeholder) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {labelText}
      </label>
      <input
        value={cfg[key] || ""}
        onChange={(e) => set({ [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
      />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-2xl shadow space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1F2937] work-sans">
            Category Banner
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            A mini-height promo banner shown right below “Shop by Category” on
            the homepage. Fully controlled here — text, colors, button,
            discount badge, product photos and the brand-logo row.
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

      {/* ── Text fields ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {field("Label (small caps)", "label", "e.g. LIMITED TIME DEAL")}
        {field("Subheading", "subheading", "e.g. Grab amazing offers…")}
        {field("Heading", "heading", "e.g. Best Deals on")}
        {field("Heading Accent (colored word)", "headingAccent", "e.g. Top Brands")}
        {field("Button Text", "buttonText", "e.g. Shop Deals")}
        {field("Button Link", "buttonLink", "e.g. /products/")}
        {field("Badge Prefix", "badgePrefix", "e.g. UP TO")}
        {field("Badge Value", "badgeValue", "e.g. 30% OFF")}
      </div>

      {/* ── Colors ── */}
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Background Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={cfg.bgColor || "#111114"}
              onChange={(e) => set({ bgColor: e.target.value })}
              className="h-9 w-12 rounded border border-gray-300"
            />
            <input
              value={cfg.bgColor || ""}
              onChange={(e) => set({ bgColor: e.target.value })}
              className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Accent Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={cfg.accentColor || "#F97316"}
              onChange={(e) => set({ accentColor: e.target.value })}
              className="h-9 w-12 rounded border border-gray-300"
            />
            <input
              value={cfg.accentColor || ""}
              onChange={(e) => set({ accentColor: e.target.value })}
              className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
        </div>
      </div>

      {/* ── Product photos ── */}
      <ImageList
        title="Product Photos (center)"
        kind="products"
        items={cfg.products}
        addLabel="+ Add Product Photo"
        onAdd={addProduct}
        onRemove={(i) => removeItem("products", i)}
        onMove={(i, d) => moveItem("products", i, d)}
        onPick={(i) => setPicker({ kind: "products", idx: i })}
        onClear={(i) => patchItem("products", i, { image: { url: "", public_id: "" } })}
        onFile={(i, f) => handleUpload("products", i, f)}
        uploading={uploading}
        fileRefs={fileRefs}
      />

      {/* ── Brand logos ── */}
      <ImageList
        title="Brand Logos (bottom row)"
        kind="brands"
        items={cfg.brands}
        addLabel="+ Add Brand Logo"
        withLink
        onLink={(i, v) => patchItem("brands", i, { link: v })}
        onAdd={addBrand}
        onRemove={(i) => removeItem("brands", i)}
        onMove={(i, d) => moveItem("brands", i, d)}
        onPick={(i) => setPicker({ kind: "brands", idx: i })}
        onClear={(i) => patchItem("brands", i, { image: { url: "", public_id: "" } })}
        onFile={(i, f) => handleUpload("brands", i, f)}
        uploading={uploading}
        fileRefs={fileRefs}
      />

      {/* ── Live preview ── */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">
          Live Preview
        </h3>
        <div
          className="relative overflow-hidden rounded-2xl px-6 py-5"
          style={{ backgroundColor: cfg.bgColor || "#111114" }}
        >
          <div className="flex items-center gap-6">
            <div className="shrink-0">
              {cfg.label && (
                <span
                  className="text-xs font-semibold uppercase"
                  style={{ color: cfg.accentColor }}
                >
                  {cfg.label}
                </span>
              )}
              <h2 className="mt-1 text-2xl font-bold text-white leading-tight">
                {cfg.heading}{" "}
                <span style={{ color: cfg.accentColor }}>{cfg.headingAccent}</span>
              </h2>
              {cfg.subheading && (
                <p className="mt-1 text-sm text-white/70 max-w-xs">
                  {cfg.subheading}
                </p>
              )}
              {cfg.buttonText && (
                <span
                  className="mt-3 inline-block rounded-full px-4 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: cfg.accentColor }}
                >
                  {cfg.buttonText} →
                </span>
              )}
            </div>
            <div className="flex-1 flex items-center justify-center gap-2 min-w-0 overflow-hidden">
              {(cfg.products || [])
                .filter((p) => p.image?.url)
                .map((p, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={i}
                    src={p.image.url}
                    alt=""
                    className="h-24 w-auto object-contain"
                  />
                ))}
            </div>
            {(cfg.badgePrefix || cfg.badgeValue) && (
              <div
                className="shrink-0 ml-auto flex flex-col items-center justify-center rounded-full text-center h-24 w-24"
                style={{ backgroundColor: cfg.accentColor }}
              >
                <span className="text-[10px] font-semibold uppercase text-white/90 leading-none">
                  {cfg.badgePrefix}
                </span>
                <span className="text-xl font-extrabold text-white leading-tight">
                  {cfg.badgeValue}
                </span>
              </div>
            )}
          </div>
          {(cfg.brands || []).filter((b) => b.image?.url).length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center flex-wrap gap-x-12 gap-y-3">
              {(cfg.brands || [])
                .filter((b) => b.image?.url)
                .map((b, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={i}
                    src={b.image.url}
                    alt=""
                    className="h-6 w-auto object-contain opacity-80"
                  />
                ))}
            </div>
          )}
        </div>
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
        disabled={saving || uploading !== null}
        className="px-6 py-2 bg-[#1D1D1F] text-white rounded-lg font-semibold hover:bg-black disabled:opacity-50 transition"
      >
        {saving ? "Saving…" : "Save Category Banner"}
      </button>

      <MediaPicker
        open={picker !== null}
        onSelect={(asset) => {
          if (picker?.kind === "single") {
            set({ [picker.field]: { url: asset.url, public_id: asset.public_id } });
          } else if (picker) {
            patchItem(picker.kind, picker.idx, {
              image: { url: asset.url, public_id: asset.public_id },
            });
          }
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
    </div>
  );
}

// Reusable image-card grid used for both product photos and brand logos.
function ImageList({
  title,
  kind,
  items = [],
  addLabel,
  withLink = false,
  onAdd,
  onRemove,
  onMove,
  onPick,
  onClear,
  onFile,
  onLink,
  uploading,
  fileRefs,
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
          {title}
        </h3>
        <button
          type="button"
          onClick={onAdd}
          className="px-4 py-1.5 rounded-full text-sm font-semibold border border-dashed border-[#1D1D1F] text-[#1D1D1F] hover:bg-gray-50 transition"
        >
          {addLabel}
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-gray-400">None yet — click above to add.</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item, i) => {
          const refKey = `${kind}-${i}`;
          const isUploading = uploading === refKey;
          return (
            <div
              key={i}
              className="border border-gray-200 rounded-xl p-3 space-y-2 bg-white"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-700">#{i + 1}</p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onMove(i, -1)}
                    disabled={i === 0}
                    className="w-6 h-6 flex items-center justify-center text-xs rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                    title="Move left"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => onMove(i, 1)}
                    disabled={i === items.length - 1}
                    className="w-6 h-6 flex items-center justify-center text-xs rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                    title="Move right"
                  >
                    →
                  </button>
                </div>
              </div>

              <div
                onClick={() => fileRefs.current[refKey]?.click()}
                className="relative h-20 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-gray-400 transition flex items-center justify-center bg-gray-50"
              >
                {item.image?.url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.image.url}
                    alt=""
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <span className="text-xs text-gray-400">Click to upload</span>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <span className="text-[#1D1D1F] font-semibold text-xs">
                      Uploading…
                    </span>
                  </div>
                )}
              </div>
              <input
                ref={(el) => {
                  fileRefs.current[refKey] = el;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFile(i, e.target.files[0])}
              />

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => onPick(i)}
                  className="text-[11px] px-2 py-1 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                >
                  <span>🖼</span> Library
                </button>
                {item.image?.url && (
                  <button
                    type="button"
                    onClick={() => onClear(i)}
                    className="text-[11px] px-2 py-1 border border-red-200 rounded-lg text-red-500 hover:bg-red-50"
                  >
                    Remove
                  </button>
                )}
              </div>

              {withLink && (
                <input
                  value={item.link || ""}
                  onChange={(e) => onLink(i, e.target.value)}
                  placeholder="Link (optional) — e.g. /brand/apple/"
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
              )}

              <button
                type="button"
                onClick={() => onRemove(i)}
                className="w-full text-[11px] px-2 py-1 border border-red-200 rounded-lg text-red-500 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
