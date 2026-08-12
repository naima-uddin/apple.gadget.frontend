"use client";

import React, { useState, useEffect, useRef } from "react";
import MediaPicker from "@/components/dashboard/MediaPicker";
import { uploadAdminImage } from "@/lib/uploadImage";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

const EMPTY_ITEM = () => ({ question: "", answer: "" });

// Admin editor for the homepage "Why Choose Us" section. Controls the
// heading, intro paragraph (supports {store} placeholder), side image, the
// About/CTA pill, and the FAQ accordion items — everything the section on
// the homepage shows. Rendered by components/home/WhyChooseUs.jsx.
// When no items are added here the section falls back to Policy Pages → FAQ.
export default function WhyChooseUsEditor() {
  const [enabled, setEnabled] = useState(true);
  const [title, setTitle] = useState("");
  const [titleBn, setTitleBn] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionBn, setDescriptionBn] = useState("");
  const [image, setImage] = useState({ url: "", public_id: "" });
  const [buttonLabel, setButtonLabel] = useState("");
  const [buttonLink, setButtonLink] = useState("/about");
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [message, setMessage] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/api/admin/settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const cfg = d.settings?.whyChooseUs;
        if (cfg) {
          setEnabled(cfg.enabled !== false);
          setTitle(cfg.title || "");
          setTitleBn(cfg.titleBn || "");
          setDescription(cfg.description || "");
          setDescriptionBn(cfg.descriptionBn || "");
          setImage(cfg.image || { url: "", public_id: "" });
          setButtonLabel(cfg.buttonLabel || "");
          setButtonLink(cfg.buttonLink || "/about");
          setItems(
            (cfg.items || []).map((it) => ({
              question: it.question || "",
              answer: it.answer || "",
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
    if (!confirm("Remove this FAQ item?")) return;
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

  const handleImageUpload = async (file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setImage({ url: preview, public_id: "" });
    setUploading(true);
    try {
      const data = await uploadAdminImage(file, "applebd/why-choose-us");
      setImage({ url: data.asset.url, public_id: data.asset.public_id });
    } catch (err) {
      alert("Image upload failed: " + err.message);
      setImage({ url: "", public_id: "" });
    } finally {
      setUploading(false);
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
        body: JSON.stringify({
          whyChooseUs: {
            enabled,
            title,
            titleBn,
            description,
            descriptionBn,
            image,
            buttonLabel,
            buttonLink,
            items,
          },
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

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-2xl shadow space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1F2937] work-sans">
            Why Choose Us
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            The homepage &quot;Why Choose Us&quot; section — image on the left,
            intro text and an FAQ accordion on the right. Everything below is
            controlled here. Leave a field blank to keep the built-in default.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 shrink-0">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          Show section
        </label>
      </div>

      {/* Heading */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Heading (English)
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Why Choose Us"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Heading (Bangla)
          </label>
          <input
            value={titleBn}
            onChange={(e) => setTitleBn(e.target.value)}
            placeholder="e.g. কেন আমাদের বেছে নেবেন"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
        </div>
      </div>

      {/* Description */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Intro paragraph (English)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Use {store} to insert your store name."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Intro paragraph (Bangla)
          </label>
          <textarea
            value={descriptionBn}
            onChange={(e) => setDescriptionBn(e.target.value)}
            rows={4}
            placeholder="{store} লিখলে দোকানের নাম বসবে।"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
        </div>
      </div>

      {/* Image + CTA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Side image
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className="relative h-40 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-gray-400 transition flex items-center justify-center bg-gray-50"
          >
            {image?.url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={image.url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-gray-400">Click to upload image</span>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <span className="text-[#1D1D1F] font-semibold text-xs">
                  Uploading…
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
          <div className="flex items-center gap-1.5 flex-wrap mt-2">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="text-[11px] px-2 py-1 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1"
            >
              <span>🖼</span> Media Library
            </button>
            {image?.url && (
              <button
                type="button"
                onClick={() => setImage({ url: "", public_id: "" })}
                className="text-[11px] px-2 py-1 border border-red-200 rounded-lg text-red-500 hover:bg-red-50"
              >
                Remove image
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Button label
            </label>
            <input
              value={buttonLabel}
              onChange={(e) => setButtonLabel(e.target.value)}
              placeholder="e.g. About Us"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Button link
            </label>
            <input
              value={buttonLink}
              onChange={(e) => setButtonLink(e.target.value)}
              placeholder="e.g. /about"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>
        </div>
      </div>

      {/* FAQ items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
            FAQ Items
          </h3>
          <button
            type="button"
            onClick={addItem}
            className="px-4 py-1.5 rounded-full text-sm font-semibold border border-dashed border-[#1D1D1F] text-[#1D1D1F] hover:bg-gray-50 transition"
          >
            + Add Item
          </button>
        </div>

        <p className="text-xs text-gray-400">
          Only the first 4 items show on the homepage. Leave this list empty to
          use your Policy Pages → FAQ content instead.
        </p>

        {items.map((item, i) => (
          <div
            key={i}
            className="border border-gray-200 rounded-xl p-3 space-y-2 bg-white"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Item {i + 1}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveItem(i, -1)}
                  disabled={i === 0}
                  className="w-6 h-6 flex items-center justify-center text-xs rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(i, 1)}
                  disabled={i === items.length - 1}
                  className="w-6 h-6 flex items-center justify-center text-xs rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="text-[11px] px-2 py-1 border border-red-200 rounded-lg text-red-500 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
            <input
              value={item.question}
              onChange={(e) => patchItem(i, { question: e.target.value })}
              placeholder="Question"
              className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
            <textarea
              value={item.answer}
              onChange={(e) => patchItem(i, { answer: e.target.value })}
              rows={2}
              placeholder="Answer"
              className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>
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
        disabled={saving || uploading}
        className="px-6 py-2 bg-[#1D1D1F] text-white rounded-lg font-semibold hover:bg-black disabled:opacity-50 transition"
      >
        {saving ? "Saving…" : "Save Why Choose Us"}
      </button>

      <MediaPicker
        open={pickerOpen}
        onSelect={(asset) => {
          setImage({ url: asset.url, public_id: asset.public_id });
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}
