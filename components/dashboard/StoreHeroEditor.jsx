"use client";

import React, { useState, useEffect, useRef } from "react";
import MediaPicker from "@/components/dashboard/MediaPicker";
import { uploadAdminImage } from "@/lib/uploadImage";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

const EMPTY_ITEM = () => ({
  image: { url: "", public_id: "" },
  label: "",
  link: "/",
  isActive: true,
});

// Admin editor for the category-page "Store" heading + icon row (Mac /
// iPhone / iPad / … style quick category switcher), shown below the
// breadcrumb on every category/subcategory page. Heading text, subheading
// text, and each icon's image/label/link/visibility fully controlled here.
// Rendered by components/home/StoreHero.jsx.
export default function StoreHeroEditor() {
  const [heading, setHeading] = useState("Store.");
  const [subheading, setSubheading] = useState(
    "The best way to buy the products you love.",
  );
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const [pickerIdx, setPickerIdx] = useState(null);
  const [message, setMessage] = useState(null);
  const fileRefs = useRef([]);

  useEffect(() => {
    fetch(`${API}/api/admin/settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const cfg = d.settings?.storeHero;
        if (cfg) {
          setHeading(cfg.heading || "Store.");
          setSubheading(
            cfg.subheading || "The best way to buy the products you love.",
          );
          setItems(
            (cfg.items || []).map((it) => ({
              image: it.image || { url: "", public_id: "" },
              label: it.label || "",
              link: it.link || "/",
              isActive: it.isActive !== false,
            })),
          );
        }
      })
      .catch(() => setMessage({ type: "error", text: "Failed to load data" }))
      .finally(() => setLoading(false));
  }, []);

  const patchItem = (i, patch) => {
    setItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  };

  const addItem = () => setItems((prev) => [...prev, EMPTY_ITEM()]);

  const removeItem = (i) => {
    if (!confirm("Remove this category icon?")) return;
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  };

  const moveItem = (i, dir) => {
    setItems((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const handleImageUpload = async (i, file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    patchItem(i, { image: { url: preview, public_id: "" } });
    setUploadingIdx(i);
    try {
      const data = await uploadAdminImage(file, "applebd/store-hero");
      patchItem(i, {
        image: { url: data.asset.url, public_id: data.asset.public_id },
      });
    } catch (err) {
      alert("Image upload failed: " + err.message);
      patchItem(i, { image: { url: "", public_id: "" } });
    } finally {
      setUploadingIdx(null);
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
        body: JSON.stringify({ storeHero: { heading, subheading, items } }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Save failed");
      setMessage({ type: "success", text: "Saved! Category pages updated." });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <div className="py-16 text-center text-gray-400">Loading…</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-2xl shadow space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#1F2937] work-sans">
          Store Hero
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Heading + row of category icons shown below the breadcrumb on
          every category/subcategory page (e.g. Mac, iPhone, iPad…), as a
          quick category switcher. Each icon links wherever you set —
          usually a category page.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Heading
          </label>
          <input
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            placeholder="e.g. Store."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Subheading
          </label>
          <input
            value={subheading}
            onChange={(e) => setSubheading(e.target.value)}
            placeholder="e.g. The best way to buy the products you love."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
            Category Icons
          </h3>
          <button
            type="button"
            onClick={addItem}
            className="px-4 py-1.5 rounded-full text-sm font-semibold border border-dashed border-[#1D1D1F] text-[#1D1D1F] hover:bg-gray-50 transition"
          >
            + Add Icon
          </button>
        </div>

        {items.length === 0 && (
          <p className="text-sm text-gray-400">
            No icons yet — click &quot;Add Icon&quot; to create one.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-xl p-3 space-y-2 bg-white"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Icon {i + 1}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveItem(i, -1)}
                    disabled={i === 0}
                    className="w-6 h-6 flex items-center justify-center text-xs rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                    title="Move left"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(i, 1)}
                    disabled={i === items.length - 1}
                    className="w-6 h-6 flex items-center justify-center text-xs rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                    title="Move right"
                  >
                    →
                  </button>
                </div>
              </div>

              <div
                onClick={() => fileRefs.current[i]?.click()}
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
                  <span className="text-xs text-gray-400">
                    Click to upload icon
                  </span>
                )}
                {uploadingIdx === i && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <span className="text-[#1D1D1F] font-semibold text-xs">
                      Uploading…
                    </span>
                  </div>
                )}
              </div>
              <input
                ref={(el) => {
                  fileRefs.current[i] = el;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(i, e.target.files[0])}
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPickerIdx(i)}
                  className="text-[11px] px-2 py-1 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                >
                  <span>🖼</span> Media Library
                </button>
                {item.image?.url && (
                  <button
                    type="button"
                    onClick={() =>
                      patchItem(i, { image: { url: "", public_id: "" } })
                    }
                    className="text-[11px] px-2 py-1 border border-red-200 rounded-lg text-red-500 hover:bg-red-50"
                  >
                    Remove image
                  </button>
                )}
              </div>

              <input
                value={item.label}
                onChange={(e) => patchItem(i, { label: e.target.value })}
                placeholder="Label — e.g. iPhone"
                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
              <input
                value={item.link}
                onChange={(e) => patchItem(i, { link: e.target.value })}
                placeholder="Link — e.g. /category/iphone/"
                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
              />

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-1.5 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={item.isActive}
                    onChange={(e) =>
                      patchItem(i, { isActive: e.target.checked })
                    }
                  />
                  Visible
                </label>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="text-[11px] px-2 py-1 border border-red-200 rounded-lg text-red-500 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Live preview ── */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">
          Live Preview
        </h3>
        <div className="bg-[#F5F5F7] border border-gray-200 rounded-2xl p-6">
          {(heading || subheading) && (
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight leading-tight max-w-2xl">
              <span className="text-[#1D1D1F]">{heading} </span>
              <span className="text-[#6B7280]">{subheading}</span>
            </h1>
          )}
          {items.filter((it) => it.isActive).length > 0 ? (
            <div
              className={`flex flex-wrap gap-6 ${heading || subheading ? "mt-6" : ""}`}
            >
              {items
                .filter((it) => it.isActive)
                .map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-2 w-16"
                  >
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      {item.image?.url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={item.image.url}
                          alt=""
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded" />
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-[#1D1D1F] text-center truncate w-full">
                      {item.label || "Label"}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No visible icons yet.</p>
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
        disabled={saving || uploadingIdx !== null}
        className="px-6 py-2 bg-[#1D1D1F] text-white rounded-lg font-semibold hover:bg-black disabled:opacity-50 transition"
      >
        {saving ? "Saving…" : "Save Store Hero"}
      </button>

      <MediaPicker
        open={pickerIdx !== null}
        onSelect={(asset) => {
          if (pickerIdx !== null)
            patchItem(pickerIdx, {
              image: { url: asset.url, public_id: asset.public_id },
            });
          setPickerIdx(null);
        }}
        onClose={() => setPickerIdx(null)}
      />
    </div>
  );
}
