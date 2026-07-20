"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/components/context/UserContext";
import MediaPicker from "@/components/dashboard/MediaPicker";
import { uploadAdminImage } from "@/lib/uploadImage";

function Section({
  title,
  badge,
  badgeColor = "bg-gray-100 text-gray-500",
  desc,
  children,
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
        {badge && (
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badgeColor}`}
          >
            {badge}
          </span>
        )}
      </div>
      {desc && <p className="px-5 pt-3 pb-0 text-xs text-gray-400">{desc}</p>}
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

const INPUT =
  "w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-300";

function ImageAssetField({
  label,
  desc,
  value,
  previewClassName,
  uploading,
  status,
  onUpload,
  onPickFromMedia,
  onDelete,
}) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-xs font-medium text-gray-600 mb-2">{label}</p>
      <div className="flex items-center gap-4 flex-wrap">
        <div
          className={`${previewClassName} bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0`}
        >
          {value?.url ? (
            <img
              src={value.url}
              alt={label}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <span className="text-xs text-gray-300">খালি</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs cursor-pointer bg-white hover:bg-gray-50">
            {uploading ? "Uploading…" : "Upload"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
                e.target.value = "";
              }}
            />
          </label>
          <button
            type="button"
            onClick={onPickFromMedia}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white hover:bg-gray-50"
          >
            From Media
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="px-3 py-1.5 border border-red-200 rounded-lg text-xs text-red-600 bg-white hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-gray-400">
        {status === "saving" && <span className="text-blue-500">Saving…</span>}
        {status === "saved" && <span className="text-green-600">Saved!</span>}
        {status && status !== "saving" && status !== "saved" && (
          <span className="text-red-500">Error: {status}</span>
        )}
        {!status && (desc || "Changes apply to the website immediately.")}
      </p>
    </div>
  );
}

export default function SettingsForm() {
  const { user, refreshUser } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [logoUploading, setLogoUploading] = useState(false);
  const [showLogoPicker, setShowLogoPicker] = useState(false);
  const [logoStatus, setLogoStatus] = useState("");

  const [faviconUploading, setFaviconUploading] = useState(false);
  const [showFaviconPicker, setShowFaviconPicker] = useState(false);
  const [faviconStatus, setFaviconStatus] = useState("");

  useEffect(() => {
    if (!user) refreshUser();
  }, [user, refreshUser]);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/admin/settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => setSettings(b.settings || null))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [API]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const resp = await fetch(`${API}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          storeName: settings.storeName,
          storeEmail: settings.storeEmail,
          cloudinaryFolder: settings.cloudinaryFolder,
        }),
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert(err.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const saveImageField = async (field, value, setStatus) => {
    setStatus("saving");
    try {
      const r = await fetch(`${API}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ [field]: value }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || `Server error (${r.status})`);
      }
      setStatus("saved");
      setTimeout(() => setStatus(""), 2500);
    } catch (err) {
      setStatus(err.message || "error");
    }
  };

  const handleImageUpload = async (field, folder, file, setUploading, setStatus) => {
    if (!file) return;
    setUploading(true);
    try {
      const b = await uploadAdminImage(file, folder);
      const asset = b.asset || {};
      setSettings((s) => ({ ...s, [field]: asset }));
      await saveImageField(field, asset, setStatus);
    } catch (err) {
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (field, setStatus) => {
    const publicId = settings?.[field]?.public_id;
    if (publicId) {
      try {
        await fetch(`${API}/api/admin/media`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ public_ids: [publicId] }),
        });
      } catch {
        // non-blocking
      }
    }
    setSettings((s) => ({ ...s, [field]: {} }));
    await saveImageField(field, {}, setStatus);
  };

  if (loading || !settings)
    return (
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl border border-gray-200 text-center text-sm text-gray-400">
        Loading settings…
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1F2937] work-sans">Settings</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Store info manage করুন
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-5 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50 ${
              saved ? "bg-green-600" : "bg-gray-900 hover:bg-gray-700"
            }`}
          >
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
          </button>
        </div>
      </div>

      {/* ── Store Info ──────────────────────────────────────────── */}
      <Section
        title="Store Info"
        badge="General"
        badgeColor="bg-gray-100 text-gray-500"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Store name">
            <input
              value={settings.storeName || ""}
              onChange={(e) =>
                setSettings((s) => ({ ...s, storeName: e.target.value }))
              }
              className={INPUT}
              placeholder="My Store"
            />
          </Field>
          <Field label="Contact email">
            <input
              value={settings.storeEmail || ""}
              onChange={(e) =>
                setSettings((s) => ({ ...s, storeEmail: e.target.value }))
              }
              className={INPUT}
              placeholder="info@example.com"
            />
          </Field>
          <Field label="Cloudinary folder">
            <input
              value={settings.cloudinaryFolder || ""}
              onChange={(e) =>
                setSettings((s) => ({ ...s, cloudinaryFolder: e.target.value }))
              }
              className={`${INPUT} sm:col-span-2`}
              placeholder="appleProduct/products"
            />
          </Field>
        </div>

        <ImageAssetField
          label="Website Logo"
          previewClassName="w-28 h-14"
          value={settings.websiteLogo}
          uploading={logoUploading}
          status={logoStatus}
          onUpload={(file) =>
            handleImageUpload(
              "websiteLogo",
              "appleProduct/settings",
              file,
              setLogoUploading,
              setLogoStatus,
            )
          }
          onPickFromMedia={() => setShowLogoPicker(true)}
          onDelete={() => handleDeleteImage("websiteLogo", setLogoStatus)}
        />

        <ImageAssetField
          label="Website Favicon"
          desc="Browser tab-এ ছোট icon হিসেবে দেখাবে। বর্গাকার ছবি (যেমন 32x32, 64x64) ভালো কাজ করে।"
          previewClassName="w-14 h-14"
          value={settings.websiteFavicon}
          uploading={faviconUploading}
          status={faviconStatus}
          onUpload={(file) =>
            handleImageUpload(
              "websiteFavicon",
              "appleProduct/settings",
              file,
              setFaviconUploading,
              setFaviconStatus,
            )
          }
          onPickFromMedia={() => setShowFaviconPicker(true)}
          onDelete={() => handleDeleteImage("websiteFavicon", setFaviconStatus)}
        />
      </Section>

      <MediaPicker
        open={showLogoPicker}
        onSelect={async (asset) => {
          const logo = asset || {};
          setSettings((s) => ({ ...s, websiteLogo: logo }));
          setShowLogoPicker(false);
          await saveImageField("websiteLogo", logo, setLogoStatus);
        }}
        onClose={() => setShowLogoPicker(false)}
      />

      <MediaPicker
        open={showFaviconPicker}
        onSelect={async (asset) => {
          const favicon = asset || {};
          setSettings((s) => ({ ...s, websiteFavicon: favicon }));
          setShowFaviconPicker(false);
          await saveImageField("websiteFavicon", favicon, setFaviconStatus);
        }}
        onClose={() => setShowFaviconPicker(false)}
      />
    </div>
  );
}
