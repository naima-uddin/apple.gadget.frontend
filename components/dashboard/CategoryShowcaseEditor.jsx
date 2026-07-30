"use client";

import React, { useState, useEffect, useRef } from "react";
import MediaPicker from "@/components/dashboard/MediaPicker";
import { uploadAdminImage } from "@/lib/uploadImage";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

const SLOT_LABELS = [
  "Left Big Tile",
  "Small Tile 1 (top)",
  "Small Tile 2 (top)",
  "Small Tile 3 (bottom)",
  "Small Tile 4 (bottom)",
  "Right Big Tile",
];

const EMPTY_TILE = () => ({
  image: { url: "", public_id: "" },
  label: "",
  link: "/",
});

const EMPTY_PAGE = () => ({
  title: "",
  tiles: Array.from({ length: 6 }, EMPTY_TILE),
});

const normalizePage = (p) => ({
  title: p?.title || "",
  tiles: Array.from({ length: 6 }, (_, i) => p?.tiles?.[i] || EMPTY_TILE()),
});

// Admin editor for the homepage bento "Category Showcase" slider.
// Multiple pages, each with 6 slots (image + label + link); the bento layout
// is fixed (big + 4 small + big). Live preview per page.
export default function CategoryShowcaseEditor() {
  const [pages, setPages] = useState([EMPTY_PAGE()]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const [pickerIdx, setPickerIdx] = useState(null); // which slot the media library is open for
  const [message, setMessage] = useState(null);
  const fileRefs = useRef([]);

  useEffect(() => {
    fetch(`${API}/api/category-showcase`)
      .then((r) => r.json())
      .then((cur) => {
        if (cur.pages?.length) {
          setPages(cur.pages.map(normalizePage));
        }
      })
      .catch(() => setMessage({ type: "error", text: "Failed to load data" }))
      .finally(() => setLoading(false));
  }, []);

  const page = pages[active] || EMPTY_PAGE();

  const patchPage = (patch) => {
    setPages((prev) => {
      const next = [...prev];
      next[active] = { ...next[active], ...patch };
      return next;
    });
  };

  const patchTile = (i, patch) => {
    setPages((prev) => {
      const next = [...prev];
      const tiles = [...next[active].tiles];
      tiles[i] = { ...tiles[i], ...patch };
      next[active] = { ...next[active], tiles };
      return next;
    });
  };

  const addPage = () => {
    setPages((prev) => [...prev, EMPTY_PAGE()]);
    setActive(pages.length);
  };

  const removePage = () => {
    if (pages.length <= 1) return;
    if (!confirm(`Delete Page ${active + 1}?`)) return;
    setPages((prev) => prev.filter((_, i) => i !== active));
    setActive((a) => Math.max(0, a - 1));
  };

  const handleImageUpload = async (i, file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    patchTile(i, { image: { url: preview, public_id: "" } });
    setUploadingIdx(i);
    try {
      const data = await uploadAdminImage(file, "appleProduct/showcase");
      patchTile(i, {
        image: { url: data.asset.url, public_id: data.asset.public_id },
      });
    } catch (err) {
      alert("Image upload failed: " + err.message);
      patchTile(i, { image: { url: "", public_id: "" } });
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
        body: JSON.stringify({ categoryShowcase: { pages } }),
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

  const slotEditor = (i) => {
    const tile = page.tiles[i];
    return (
      <div
        key={i}
        className="border border-gray-200 rounded-xl p-3 space-y-2 bg-white"
      >
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
          {SLOT_LABELS[i]}
        </p>

        {/* Image uploader */}
        <div
          onClick={() => fileRefs.current[i]?.click()}
          className="relative h-24 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-gray-400 transition flex items-center justify-center bg-gray-50"
        >
          {tile.image?.url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={tile.image.url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs text-gray-400">Click to upload image</span>
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
          {tile.image?.url && (
            <button
              type="button"
              onClick={() =>
                patchTile(i, { image: { url: "", public_id: "" } })
              }
              className="text-[11px] px-2 py-1 border border-red-200 rounded-lg text-red-500 hover:bg-red-50"
            >
              Remove image
            </button>
          )}
        </div>

        <input
          value={tile.label}
          onChange={(e) => patchTile(i, { label: e.target.value })}
          placeholder="Label — e.g. Headsets"
          className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
        />
        <input
          value={tile.link}
          onChange={(e) => patchTile(i, { link: e.target.value })}
          placeholder="Link — e.g. /category/headsets/"
          className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
        />
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-2xl shadow space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#1F2937] work-sans">Category Showcase</h2>
        <p className="text-sm text-gray-500 mt-1">
          Homepage bento slider (shown before &quot;Why Choose Us&quot;). Add
          one or more pages — each page has 6 tiles (image + label + link) in a
          fixed layout: one big tile on each side, four small in the middle.
          Multiple pages rotate as a slider with dots.
        </p>
      </div>

      {/* Page tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {pages.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
              i === active
                ? "bg-[#1D1D1F] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Page {i + 1}
          </button>
        ))}
        <button
          onClick={addPage}
          className="px-4 py-1.5 rounded-full text-sm font-semibold border border-dashed border-[#1D1D1F] text-[#1D1D1F] hover:bg-gray-50 transition"
        >
          + Add Page
        </button>
        {pages.length > 1 && (
          <button
            onClick={removePage}
            className="px-4 py-1.5 rounded-full text-sm font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition"
          >
            Delete Page {active + 1}
          </button>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Page Title
        </label>
        <input
          value={page.title}
          onChange={(e) => patchPage({ title: e.target.value })}
          placeholder="e.g. Shop by Category"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
        />
      </div>

      {/* Slot editors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {page.tiles.map((_, i) => slotEditor(i))}
      </div>

      {/* ── Live preview — exactly how the homepage renders this page ── */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">
          Live Preview — Page {active + 1}
        </h3>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6">
          {page.title && (
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#1F2937] text-center mb-5">
              {page.title}
            </h2>
          )}
          <div className="grid grid-cols-6 gap-2 md:gap-3 auto-rows-24 md:auto-rows-28">
            {[0, 1, 2, 5, 3, 4].map((slotIdx) => {
              const tile = page.tiles[slotIdx];
              const placement =
                slotIdx === 0
                  ? "col-span-2 row-span-2"
                  : slotIdx === 5
                    ? "col-span-2 row-span-2 col-start-5 row-start-1"
                    : "";
              return (
                <div
                  key={slotIdx}
                  className={`relative bg-[#F5F6F7] rounded-lg overflow-hidden flex items-center justify-center ${placement}`}
                >
                  {tile.image?.url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={tile.image.url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-gray-300 text-center px-1">
                      {SLOT_LABELS[slotIdx]}
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-black/60 via-black/25 to-transparent" />
                  {tile.label && (
                    <p className="absolute inset-x-0 bottom-1.5 px-1 text-[10px] md:text-xs font-semibold text-white text-center truncate drop-shadow">
                      {tile.label}
                    </p>
                  )}
                </div>
              );
            })}
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
        disabled={saving || uploadingIdx !== null}
        className="px-6 py-2 bg-[#1D1D1F] text-white rounded-lg font-semibold hover:bg-black disabled:opacity-50 transition"
      >
        {saving ? "Saving…" : "Save All Pages"}
      </button>
      <p className="text-xs text-gray-400">
        Note: saving requires the main admin account (settings permission).
      </p>

      <MediaPicker
        open={pickerIdx !== null}
        onSelect={(asset) => {
          if (pickerIdx !== null)
            patchTile(pickerIdx, {
              image: { url: asset.url, public_id: asset.public_id },
            });
          setPickerIdx(null);
        }}
        onClose={() => setPickerIdx(null)}
      />
    </div>
  );
}
