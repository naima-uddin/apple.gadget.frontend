"use client";

import React, { useState, useEffect, useRef } from "react";
import MediaPicker from "@/components/dashboard/MediaPicker";
import { uploadAdminImage } from "@/lib/uploadImage";

export default function BannerEditor({ bannerId = null, onSuccess, onCancel }) {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
  const isEdit = !!bannerId;

  const [image, setImage] = useState({ url: "", public_id: "" });
  const [rightImage, setRightImage] = useState({ url: "", public_id: "" });
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [buttonText, setButtonText] = useState("Shop Now");
  const [buttonLink, setButtonLink] = useState("/");
  const [badge, setBadge] = useState("");
  const [rightTitle, setRightTitle] = useState("");
  const [rightText, setRightText] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingRight, setUploadingRight] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showRightPicker, setShowRightPicker] = useState(false);
  const fileRef = useRef(null);
  const rightFileRef = useRef(null);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    fetch(`${API}/api/admin/banners/${bannerId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => {
        const s = b.banner || {};
        setImage(s.image || { url: "", public_id: "" });
        setRightImage(s.rightImage || { url: "", public_id: "" });
        setTitle(s.title || "");
        setSubtitle(s.subtitle || "");
        setButtonText(s.buttonText || "Shop Now");
        setButtonLink(s.buttonLink || "/");
        setBadge(s.badge || "");
        setRightTitle(s.rightTitle || "");
        setRightText(s.rightText || "");
        setIsActive(s.isActive !== false);
      })
      .catch((err) => alert("Failed to load: " + err.message))
      .finally(() => setLoading(false));
  }, [bannerId, isEdit, API]);

  // shared uploader used by both the left and right image slots
  const uploadTo = async (file, setter, setBusy) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setter({ url: preview, public_id: "", __uploading: true });
    setBusy(true);
    try {
      const data = await uploadAdminImage(file, "applebd/banners");
      setter({ url: data.asset.url, public_id: data.asset.public_id });
    } catch (err) {
      alert("Image upload failed: " + err.message);
      setter({ url: "", public_id: "" });
    } finally {
      setBusy(false);
    }
  };

  const handleImageUpload = (file) => uploadTo(file, setImage, setUploading);
  const handleRightImageUpload = (file) =>
    uploadTo(file, setRightImage, setUploadingRight);

  const handleSave = async () => {
    if (!image.url) {
      alert("Please upload a banner image");
      return;
    }
    setSaving(true);
    try {
      const body = {
        image,
        rightImage,
        title,
        subtitle,
        buttonText,
        buttonLink,
        badge,
        rightTitle,
        rightText,
        isActive,
      };
      const url = isEdit
        ? `${API}/api/admin/banners/${bannerId}`
        : `${API}/api/admin/banners`;
      const resp = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed");
      onSuccess && onSuccess(data.banner);
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // render *asterisk*-wrapped words as an italic accent, mirroring the banner
  const renderTitle = (text) =>
    String(text)
      .split(/(\*[^*]+\*)/g)
      .map((part, i) =>
        part.startsWith("*") && part.endsWith("*") ? (
          <span key={i} className="font-normal italic text-gray-200">
            {part.slice(1, -1)}
          </span>
        ) : (
          part
        ),
      );

  if (loading)
    return <div className="py-16 text-center text-gray-400">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow space-y-5">
      <h2 className="text-2xl font-bold tracking-tight text-[#1F2937] work-sans">
        {isEdit ? "Edit Banner Slide" : "New Banner Slide"}
      </h2>

      {/* Live preview — updates as you type so you can place text/button right */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Live Preview
        </label>
        <div
          className="relative h-52 overflow-hidden rounded-2xl border border-gray-200"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 20%, #FFFFFF 0%, #EEF2F6 45%, #DDE5EC 100%)",
          }}
        >
          {/* left image */}
          {image.url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={image.url}
              alt="left"
              className="absolute inset-y-0 left-0 h-full w-[36%] object-contain object-left drop-shadow-lg"
            />
          ) : (
            <div className="absolute inset-y-0 left-0 flex w-[36%] items-center justify-center text-center text-[10px] text-gray-400">
              Left image
            </div>
          )}

          {/* right image */}
          {rightImage.url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={rightImage.url}
              alt="right"
              className="absolute inset-y-0 right-0 h-full w-[36%] object-contain object-right drop-shadow-lg"
            />
          ) : (
            <div className="absolute inset-y-0 right-0 flex w-[36%] items-center justify-center text-center text-[10px] text-gray-400">
              Right image
            </div>
          )}

          {/* centre content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
            {badge && (
              <span className="mb-1.5 rounded-full border border-black/10 bg-white/60 px-2.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.18em] text-[#1D1D1F] backdrop-blur">
                {badge}
              </span>
            )}
            {title && (
              <h4 className="max-w-[52%] font-serif text-lg font-bold uppercase leading-none tracking-tight text-[#1D1D1F]">
                {renderTitle(title)}
              </h4>
            )}
            {subtitle && (
              <p className="mt-1 line-clamp-2 max-w-[54%] text-[9px] font-light leading-snug text-[#6B7280]">
                {subtitle}
              </p>
            )}
            {buttonText && (
              <span className="mt-2 inline-block rounded-full border border-white/60 bg-white/40 px-3 py-1 text-[8px] font-semibold uppercase tracking-wider text-[#1D1D1F] backdrop-blur">
                {buttonText} →
              </span>
            )}
          </div>
        </div>
        <p className="mt-1.5 text-[11px] text-gray-400">
          Approximate placement. On the live site two images flank the sides, the
          text sits centred in the middle and the button is a glassy frosted
          pill. Product cut-outs (transparent PNGs) look best on the sides.
        </p>
      </div>

      {/* Left image upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Left Image *
        </label>
        <div
          className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden cursor-pointer hover:border-blue-400 transition"
          style={{ height: "200px" }}
          onClick={() => fileRef.current?.click()}
        >
          {image.url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={image.url}
              alt="Banner preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4-4 4 4 4-6 4 6M4 20h16M4 4h16"
                />
              </svg>
              <span className="text-sm">Click to upload the left image</span>
              <span className="text-xs text-gray-300">
                Recommended: a product cut-out (transparent PNG) — it sits on the
                left side of the banner
              </span>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">
                Uploading…
              </span>
            </div>
          )}
          {image.url && !uploading && (
            <div className="absolute bottom-2 right-2">
              <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
                Click to change
              </span>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImageUpload(e.target.files[0])}
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 flex items-center gap-1"
          >
            <span>🖼</span> Select from Media Library
          </button>
          {image.url && (
            <button
              type="button"
              onClick={() => setImage({ url: "", public_id: "" })}
              className="text-xs px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 text-red-500"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <MediaPicker
        open={showPicker}
        onSelect={(asset) => {
          setImage({ url: asset.url, public_id: asset.public_id });
          setShowPicker(false);
        }}
        onClose={() => setShowPicker(false)}
      />

      {/* Right image upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Right Image
        </label>
        <div
          className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden cursor-pointer hover:border-blue-400 transition"
          style={{ height: "200px" }}
          onClick={() => rightFileRef.current?.click()}
        >
          {rightImage.url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={rightImage.url}
              alt="Right image preview"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4-4 4 4 4-6 4 6M4 20h16M4 4h16"
                />
              </svg>
              <span className="text-sm">Click to upload the right image</span>
              <span className="text-xs text-gray-300">
                Optional — a second product cut-out for the right side. Leave
                empty to mirror the left image.
              </span>
            </div>
          )}
          {uploadingRight && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">
                Uploading…
              </span>
            </div>
          )}
          {rightImage.url && !uploadingRight && (
            <div className="absolute bottom-2 right-2">
              <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
                Click to change
              </span>
            </div>
          )}
        </div>
        <input
          ref={rightFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleRightImageUpload(e.target.files[0])}
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRightPicker(true)}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 flex items-center gap-1"
          >
            <span>🖼</span> Select from Media Library
          </button>
          {rightImage.url && (
            <button
              type="button"
              onClick={() => setRightImage({ url: "", public_id: "" })}
              className="text-xs px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 text-red-500"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <MediaPicker
        open={showRightPicker}
        onSelect={(asset) => {
          setRightImage({ url: asset.url, public_id: asset.public_id });
          setShowRightPicker(false);
        }}
        onClose={() => setShowRightPicker(false)}
      />

      {/* CENTRE TEXT — description + glassy button in the middle of the banner */}
      <div className="border border-gray-200 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
          Centre Text &amp; Button
        </h3>
        <p className="text-xs text-gray-400 -mt-2">
          Description and the glassy button, shown centred between the two images.
        </p>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            rows={2}
            placeholder="e.g. Stay connected and enjoy smart features with a stylish smartwatch designed for your everyday lifestyle."
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Button Text
            </label>
            <input
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              placeholder="Shop Now"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Button Link
            </label>
            <input
              value={buttonLink}
              onChange={(e) => setButtonLink(e.target.value)}
              placeholder="/products"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* CENTRE HEADLINE — badge chip + big centred title */}
      <div className="border border-gray-200 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
          Badge &amp; Headline
        </h3>
        <p className="text-xs text-gray-400 -mt-2">
          The badge chip sits above the centred headline. Wrap words in
          *asterisks* to show them in an elegant italic accent — e.g.{" "}
          <code>Your Time. Your *Style.*</code>
        </p>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Small Badge (chip)
          </label>
          <input
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            placeholder="e.g. Smarter Every Day"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Big Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Your Time. Your *Style.*"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsActive((v) => !v)}
          className={`relative w-12 h-6 rounded-full transition-colors ${isActive ? "bg-blue-600" : "bg-gray-300"}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? "translate-x-6" : ""}`}
          />
        </button>
        <span className="text-sm text-gray-700">
          {isActive ? "Active (shown on homepage)" : "Inactive (hidden)"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving || uploading || uploadingRight}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Banner"}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
