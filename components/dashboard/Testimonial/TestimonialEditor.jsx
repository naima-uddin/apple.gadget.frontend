"use client";

import React, { useState, useEffect, useRef } from "react";
import MediaPicker from "@/components/dashboard/MediaPicker";
import { uploadAdminImage } from "@/lib/uploadImage";

export default function TestimonialEditor({
  testimonialId = null,
  onSuccess,
  onCancel,
}) {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
  const isEdit = !!testimonialId;

  const [avatar, setAvatar] = useState({ url: "", public_id: "" });
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    fetch(`${API}/api/admin/testimonials/${testimonialId}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((b) => {
        const s = b.item || {};
        setAvatar(s.avatar || { url: "", public_id: "" });
        setName(s.name || "");
        setAddress(s.address || "");
        setMessage(s.message || "");
        setRating(s.rating || 5);
        setIsActive(s.isActive !== false);
      })
      .catch((err) => alert("Failed to load: " + err.message))
      .finally(() => setLoading(false));
  }, [testimonialId, isEdit, API]);

  const handleImageUpload = async (file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setAvatar({ url: preview, public_id: "", __uploading: true });
    setUploading(true);
    try {
      const data = await uploadAdminImage(file, "appleProduct/testimonials");
      setAvatar({ url: data.asset.url, public_id: data.asset.public_id });
    } catch (err) {
      alert("Image upload failed: " + err.message);
      setAvatar({ url: "", public_id: "" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !message.trim()) {
      alert("Name and message are required.");
      return;
    }
    setSaving(true);
    try {
      const body = { avatar, name, address, message, rating, isActive };
      const url = isEdit
        ? `${API}/api/admin/testimonials/${testimonialId}`
        : `${API}/api/admin/testimonials`;
      const resp = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed");
      onSuccess && onSuccess(data.item);
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <div className="py-16 text-center text-gray-400">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow space-y-5">
      <h2 className="text-2xl font-bold tracking-tight text-[#1F2937] work-sans">
        {isEdit ? "Edit Testimonial" : "New Testimonial"}
      </h2>

      {/* Avatar upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Customer Photo
        </label>
        <div className="flex items-center gap-4">
          <div
            className="relative w-24 h-24 shrink-0 rounded-full overflow-hidden border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400 transition bg-gray-50"
            onClick={() => fileRef.current?.click()}
          >
            {avatar.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar.url}
                alt="Avatar preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-2.21 3.58-4 8-4s8 1.79 8 4"
                  />
                </svg>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-[10px]">
                  Uploading…
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
            >
              Upload photo
            </button>
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
            >
              🖼 Select from Media Library
            </button>
            {avatar.url && (
              <button
                type="button"
                onClick={() => setAvatar({ url: "", public_id: "" })}
                className="text-xs px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 text-red-500"
              >
                Remove
              </button>
            )}
            <p className="text-[11px] text-gray-400">
              Optional — shows the customer&apos;s initial if left empty.
            </p>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImageUpload(e.target.files[0])}
        />
      </div>

      <MediaPicker
        open={showPicker}
        onSelect={(asset) => {
          setAvatar({ url: asset.url, public_id: asset.public_id });
          setShowPicker(false);
        }}
        onClose={() => setShowPicker(false)}
      />

      {/* Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Customer Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Rafiul Islam"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Address / Location
        </label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. Dhaka, Bangladesh"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Review Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="What did the customer say?"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Rating
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`text-2xl leading-none ${n <= rating ? "text-yellow-400" : "text-gray-300"}`}
              aria-label={`${n} star`}
            >
              ★
            </button>
          ))}
          <span className="text-sm text-gray-500 ml-2">{rating} / 5</span>
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
          disabled={saving || uploading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Testimonial"}
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
