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
  height: 64,
  timerEnabled: false,
  timerEndsAt: "",
};

// Admin editor for the thin promotional strip shown in the homepage slot that
// previously held Store Hero. Direct-image only: upload a wide/short banner
// image (and optionally a separate mobile image), set a click-through link and
// the desktop height. Rendered by components/home/PromoBanner.jsx.
export default function PromoBannerEditor() {
  const [cfg, setCfg] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [picker, setPicker] = useState(null); // { field }
  const [uploading, setUploading] = useState(null); // field name

  useEffect(() => {
    fetch(`${API}/api/admin/settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const c = d.settings?.promoBanner;
        if (c) setCfg({ ...DEFAULTS, ...c });
      })
      .catch(() => setMessage({ type: "error", text: "Failed to load data" }))
      .finally(() => setLoading(false));
  }, []);

  const set = (patch) => setCfg((prev) => ({ ...prev, ...patch }));

  const handleUpload = async (field, file) => {
    if (!file) return;
    set({ [field]: { url: URL.createObjectURL(file), public_id: "" } });
    setUploading(field);
    try {
      const data = await uploadAdminImage(file, "applebd/promo-banner");
      set({ [field]: { url: data.asset.url, public_id: data.asset.public_id } });
    } catch (err) {
      alert("Image upload failed: " + err.message);
      set({ [field]: { url: "", public_id: "" } });
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
        body: JSON.stringify({ promoBanner: cfg }),
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
            Promo Banner
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            A thin, very-small-height promotional strip shown near the top of the
            homepage (the slot that used to hold the mini category row). Upload a
            wide, short banner image — it becomes the whole clickable strip. Tip:
            use a wide image such as 1600×200.
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SingleImage
          label="Banner Image (desktop)"
          field="image"
          value={cfg.image}
          uploading={uploading}
          onFile={(f) => handleUpload("image", f)}
          onPick={() => setPicker({ field: "image" })}
          onClear={() => set({ image: { url: "", public_id: "" } })}
        />
        <SingleImage
          label="Mobile Image (optional)"
          field="mobileImage"
          value={cfg.mobileImage}
          uploading={uploading}
          onFile={(f) => handleUpload("mobileImage", f)}
          onPick={() => setPicker({ field: "mobileImage" })}
          onClear={() => set({ mobileImage: { url: "", public_id: "" } })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Banner Link
          </label>
          <input
            value={cfg.link || ""}
            onChange={(e) => set({ link: e.target.value })}
            placeholder="e.g. /products/"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Desktop Height (px)
          </label>
          <input
            type="number"
            min={36}
            max={200}
            value={cfg.height || 64}
            onChange={(e) => set({ height: Number(e.target.value) || 64 })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Keep it short (48–72px) for a premium thin strip.
          </p>
        </div>
      </div>

      {/* ── Countdown timer ── */}
      <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
              Countdown Timer
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Shows a flash-sale countdown (days/hrs/min/sec) at the top of the
              banner, ticking down to the end time below. It hides automatically
              once the time passes.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 shrink-0">
            <input
              type="checkbox"
              checked={cfg.timerEnabled}
              onChange={(e) => set({ timerEnabled: e.target.checked })}
              className="w-4 h-4"
            />
            {cfg.timerEnabled ? "On" : "Off"}
          </label>
        </div>
        {cfg.timerEnabled && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Sale Ends At
            </label>
            <input
              type="datetime-local"
              value={cfg.timerEndsAt || ""}
              onChange={(e) => set({ timerEndsAt: e.target.value })}
              className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Uses your local time. Leave the timer Off to hide it entirely.
            </p>
          </div>
        )}
      </div>

      {/* Live preview */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">
          Live Preview
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Desktop: thin fixed-height strip (object-cover) */}
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold text-gray-500 mb-1.5">
              Desktop
            </p>
            {cfg.image?.url ? (
              <div
                className="w-full overflow-hidden ring-1 ring-black/5"
                style={{ height: Number(cfg.height) || 64 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cfg.image.url}
                  alt=""
                  className="w-full h-full object-cover object-center"
                />
              </div>
            ) : (
              <div className="w-full h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-sm text-gray-400">
                Upload a banner image to see the preview
              </div>
            )}
          </div>

          {/* Mobile: dedicated image shown in full (natural aspect ratio) */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1.5">
              Mobile
            </p>
            <div className="mx-auto w-55 max-w-full rounded-[1.75rem] border-4 border-gray-800 bg-gray-800 overflow-hidden">
              <div className="rounded-[1.4rem] overflow-hidden bg-white">
                {cfg.mobileImage?.url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={cfg.mobileImage.url}
                    alt=""
                    className="block w-full h-auto"
                  />
                ) : cfg.image?.url ? (
                  <div style={{ height: Math.max(40, Math.round((Number(cfg.height) || 64) * 0.7)) }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cfg.image.url}
                      alt=""
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                ) : (
                  <div className="h-24 flex items-center justify-center text-xs text-gray-400 text-center px-2">
                    No mobile image
                  </div>
                )}
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-2 text-center">
              Mobile image shows in full (no crop).
            </p>
          </div>
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
        {saving ? "Saving…" : "Save Promo Banner"}
      </button>

      <MediaPicker
        open={picker !== null}
        onSelect={(asset) => {
          if (picker)
            set({ [picker.field]: { url: asset.url, public_id: asset.public_id } });
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
    </div>
  );
}

// Single uploadable image slot (desktop / mobile banner image).
function SingleImage({ label, field, value, uploading, onFile, onPick, onClear }) {
  const inputRef = useRef(null);
  const isUploading = uploading === field;
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        className="relative h-28 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-gray-400 transition flex items-center justify-center bg-white"
      >
        {value?.url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={value.url}
            alt=""
            className="w-full h-full object-contain p-1"
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
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files[0])}
      />
      <div className="flex items-center gap-1.5 flex-wrap mt-2">
        <button
          type="button"
          onClick={onPick}
          className="text-[11px] px-2 py-1 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1"
        >
          <span>🖼</span> Library
        </button>
        {value?.url && (
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] px-2 py-1 border border-red-200 rounded-lg text-red-500 hover:bg-red-50"
          >
            Remove image
          </button>
        )}
      </div>
    </div>
  );
}
