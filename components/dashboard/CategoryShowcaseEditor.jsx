"use client";

import React, { useState, useEffect, useRef } from "react";
import { uploadAdminImage } from "@/lib/uploadImage";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

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

// Admin editor for the homepage bento "Category Showcase" section.
// Each of the 6 slots takes an uploaded image, a label, and a link; the
// bento layout itself is fixed (big + 4 small + big). Live preview below.
export default function CategoryShowcaseEditor() {
  const [title, setTitle] = useState("Shop by Category");
  const [tiles, setTiles] = useState(Array.from({ length: 6 }, EMPTY_TILE));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const [message, setMessage] = useState(null);
  const fileRefs = useRef([]);

  useEffect(() => {
    fetch(`${API}/api/category-showcase`)
      .then((r) => r.json())
      .then((cur) => {
        if (cur.title) setTitle(cur.title);
        if (cur.tiles?.length) {
          setTiles(
            Array.from(
              { length: 6 },
              (_, i) =>
                cur.tiles[i] || EMPTY_TILE(),
            ),
          );
        } else if (cur.categories?.length) {
          // prefill from the legacy category-based config
          setTiles(
            Array.from({ length: 6 }, (_, i) => {
              const c = cur.categories[i];
              if (!c) return EMPTY_TILE();
              return {
                image: {
                  url: (c.images && c.images[0] && c.images[0].url) || "",
                  public_id: "",
                },
                label: c.name || "",
                link: `/category/${c.slug || ""}/`,
              };
            }),
          );
        }
      })
      .catch(() => setMessage({ type: "error", text: "Failed to load data" }))
      .finally(() => setLoading(false));
  }, []);

  const patchTile = (i, patch) => {
    setTiles((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
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
        body: JSON.stringify({ categoryShowcase: { title, tiles } }),
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
    const tile = tiles[i];
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
          className="relative h-24 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-violet-400 transition flex items-center justify-center bg-gray-50"
        >
          {tile.image?.url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={tile.image.url}
              alt=""
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-xs text-gray-400">
              Click to upload image
            </span>
          )}
          {uploadingIdx === i && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="text-violet-600 font-semibold text-xs">
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
        {tile.image?.url && (
          <button
            type="button"
            onClick={() => patchTile(i, { image: { url: "", public_id: "" } })}
            className="text-[11px] px-2 py-1 border border-red-200 rounded text-red-500 hover:bg-red-50"
          >
            Remove image
          </button>
        )}

        <input
          value={tile.label}
          onChange={(e) => patchTile(i, { label: e.target.value })}
          placeholder="Label — e.g. Headsets"
          className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <input
          value={tile.link}
          onChange={(e) => patchTile(i, { link: e.target.value })}
          placeholder="Link — e.g. /category/headsets/"
          className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-2xl shadow space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Category Showcase</h2>
        <p className="text-sm text-gray-500 mt-1">
          Homepage bento section (shown before &quot;Why Choose Us&quot;).
          Upload an image, set a label and a link for each of the 6 tiles —
          the layout is fixed: one big tile on each side, four small in the
          middle. Transparent PNG images look best.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Section Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Shop by Category"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {/* Slot editors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiles.map((_, i) => slotEditor(i))}
      </div>

      {/* ── Live preview — exactly how the homepage renders it ── */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">
          Live Preview
        </h3>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6">
          {title && (
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#1F2937] text-center mb-5">
              {title}
            </h2>
          )}
          <div className="grid grid-cols-4 gap-2 md:gap-3">
            {[0, 1, 2, 5, 3, 4].map((slotIdx) => {
              const tile = tiles[slotIdx];
              const big = slotIdx === 0 || slotIdx === 5;
              const placement =
                slotIdx === 0
                  ? "row-span-2"
                  : slotIdx === 5
                    ? "row-span-2 col-start-4 row-start-1"
                    : "";
              return (
                <div
                  key={slotIdx}
                  className={`relative bg-[#F5F6F7] rounded-xl overflow-hidden flex items-center justify-center ${big ? "min-h-40 md:min-h-56" : "h-16 md:h-24"} ${placement}`}
                >
                  {tile.image?.url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={tile.image.url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-gray-300">
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
        className="px-6 py-2 bg-[#5B21B6] text-white rounded-lg font-semibold hover:bg-[#4C1D95] disabled:opacity-50 transition"
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>
      <p className="text-xs text-gray-400">
        Note: saving requires the main admin account (settings permission).
      </p>
    </div>
  );
}
