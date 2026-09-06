"use client";

import React, { useState, useEffect, useRef } from "react";
import MediaPicker from "@/components/dashboard/MediaPicker";
import { uploadAdminImage } from "@/lib/uploadImage";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

const MAX_IMAGES = 4;
const EMPTY_IMG = () => ({ url: "", public_id: "" });

// Admin editor for the homepage poster-style typographic hero (giant word +
// up to 4 images tucked between the letters), shown above "Why Choose Us".
// Rendered on the storefront by components/home/TypographicHero.jsx.
export default function TypographicHeroEditor() {
  const [enabled, setEnabled] = useState(true);
  const [word, setWord] = useState("GADGETS");
  const [images, setImages] = useState([]);
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
        const cfg = d.settings?.typographicHero;
        if (cfg) {
          setEnabled(cfg.enabled !== false);
          setWord(cfg.word || "GADGETS");
          setImages(
            (cfg.images || []).map((im) => ({
              url: im.url || "",
              public_id: im.public_id || "",
            })),
          );
        }
      })
      .catch(() => setMessage({ type: "error", text: "Failed to load data" }))
      .finally(() => setLoading(false));
  }, []);

  const patchImage = (i, patch) => {
    setImages((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  };

  const addImage = () =>
    setImages((prev) =>
      prev.length >= MAX_IMAGES ? prev : [...prev, EMPTY_IMG()],
    );

  const removeSlot = (i) =>
    setImages((prev) => prev.filter((_, idx) => idx !== i));

  const handleImageUpload = async (i, file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    patchImage(i, { url: preview, public_id: "" });
    setUploadingIdx(i);
    try {
      const data = await uploadAdminImage(file, "applebd/typographic-hero");
      patchImage(i, { url: data.asset.url, public_id: data.asset.public_id });
    } catch (err) {
      alert("Image upload failed: " + err.message);
      patchImage(i, { url: "", public_id: "" });
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const cleanImages = images.filter((im) => im.url);
      const resp = await fetch(`${API}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          typographicHero: { enabled, word, images: cleanImages },
        }),
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

  const previewWord = (word || "GADGETS").toUpperCase();
  const previewImages = images.filter((im) => im.url);

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-2xl shadow space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1F2937] work-sans">
            Typographic Hero
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            A big poster-style word shown above the &quot;Why Choose Us&quot;
            section on the homepage, with up to 4 images tucked between and
            overlapping the letters.{" "}
            <strong>
              Use transparent PNG cutouts (background removed)
            </strong>{" "}
            so the images blend into the type like a poster — photos with a
            solid/white background will show as rectangles.
          </p>
        </div>
        <label className="flex items-center gap-2 shrink-0 text-sm font-semibold text-gray-700">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          Enabled
        </label>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Big Word
        </label>
        <input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="e.g. GADGETS"
          className="w-full sm:w-80 border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-gray-500"
        />
        <p className="text-xs text-gray-400 mt-1">
          Shown in uppercase. Keep it short (one word reads best).
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
            Images between letters ({images.length}/{MAX_IMAGES})
          </h3>
          <button
            type="button"
            onClick={addImage}
            disabled={images.length >= MAX_IMAGES}
            className="px-4 py-1.5 rounded-full text-sm font-semibold border border-dashed border-[#1D1D1F] text-[#1D1D1F] hover:bg-gray-50 transition disabled:opacity-40"
          >
            + Add Image
          </button>
        </div>

        {images.length === 0 && (
          <p className="text-sm text-gray-400">
            No images yet — the storefront will show default gadget icons until
            you add images. Click &quot;Add Image&quot; to upload your own.
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {images.map((img, i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-xl p-3 space-y-2 bg-white"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Image {i + 1}
                </p>
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  className="text-[11px] px-2 py-0.5 border border-red-200 rounded text-red-500 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>

              <div
                onClick={() => fileRefs.current[i]?.click()}
                className="relative h-24 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-gray-400 transition flex items-center justify-center bg-gray-50"
              >
                {img.url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-gray-400 text-center px-2">
                    Click to upload
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
                  <span>🖼</span> Library
                </button>
                {img.url && (
                  <button
                    type="button"
                    onClick={() => patchImage(i, { url: "", public_id: "" })}
                    className="text-[11px] px-2 py-1 border border-red-200 rounded-lg text-red-500 hover:bg-red-50"
                  >
                    Clear
                  </button>
                )}
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
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <div
            className="flex flex-wrap items-end justify-center gap-1 px-4 pt-20 pb-10 font-black text-[#1F2937] leading-none"
            style={{
              fontSize: "clamp(2rem, 9vw, 5rem)",
              letterSpacing: "-0.04em",
              background:
                "linear-gradient(160deg,#F4F5F7 0%,#EAECEF 42%,#E1E4E9 70%,#EEF0F3 100%)",
            }}
          >
            {(() => {
              const letters = previewWord.split("");
              const count =
                letters.length > 1
                  ? Math.min(previewImages.length, letters.length)
                  : 0;
              const map = {};
              for (let k = 0; k < count; k++) {
                let idx =
                  Math.round(((k + 1) * letters.length) / (count + 1)) - 1;
                idx = Math.max(0, Math.min(letters.length - 1, idx));
                while (map[idx] !== undefined && idx < letters.length - 1) idx++;
                map[idx] = k;
              }
              const out = [];
              letters.forEach((ch, i) => {
                out.push(<span key={`l${i}`} className="relative z-10">{ch === " " ? " " : ch}</span>);
                const ci = map[i];
                if (ci !== undefined && previewImages[ci]) {
                  out.push(
                    <span
                      key={`c${i}`}
                      className="relative inline-block align-bottom"
                      style={{
                        width: "1em",
                        height: "1.55em",
                        marginLeft: "-0.28em",
                        marginRight: "-0.28em",
                        transform: `translateY(${
                          ["-0.42em", "-0.08em", "-0.9em", "-0.45em"][ci % 4]
                        })`,
                        zIndex: ci % 2 === 0 ? 20 : 1,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewImages[ci].url}
                        alt=""
                        className="w-full h-full object-contain object-bottom"
                        style={{
                          filter: "drop-shadow(0 8px 12px rgba(15,23,42,0.28))",
                        }}
                      />
                    </span>,
                  );
                }
              });
              return out;
            })()}
          </div>
        </div>
        {previewImages.length === 0 && (
          <p className="text-xs text-gray-400 mt-2">
            No images added — the live storefront falls back to default gadget
            icons.
          </p>
        )}
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
        {saving ? "Saving…" : "Save Typographic Hero"}
      </button>

      <MediaPicker
        open={pickerIdx !== null}
        onSelect={(asset) => {
          if (pickerIdx !== null)
            patchImage(pickerIdx, {
              url: asset.url,
              public_id: asset.public_id,
            });
          setPickerIdx(null);
        }}
        onClose={() => setPickerIdx(null)}
      />
    </div>
  );
}
