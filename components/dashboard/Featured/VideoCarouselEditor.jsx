"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { uploadAdminImage, MAX_UPLOAD_BYTES } from "@/lib/uploadImage";

// Pulls the video id out of any common YouTube URL form:
// youtu.be/<id>, watch?v=<id>, /shorts/<id>, /embed/<id>, /live/<id>
export function extractYouTubeId(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  // bare 11-char id pasted directly
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/i,
  );
  return m ? m[1] : "";
}

// Validates a pasted link is a Facebook video/reel/watch URL and returns it
// as-is — the Facebook embed plugin needs the exact original href, not a
// transformed one.
export function normalizeFacebookUrl(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    const host = u.hostname.replace(/^www\.|^m\./gi, "");
    if (!/^(facebook\.com|fb\.watch)$/i.test(host)) return "";
    return u.toString();
  } catch {
    return "";
  }
}

// Validates an Instagram post/reel URL and returns the plain permalink —
// Instagram's own embed.js (loaded on the homepage) needs the real permalink
// on a data-instgrm-permalink attribute, not a pre-built /embed iframe src
// (that bare form gets blocked by Instagram's X-Frame-Options for
// unauthenticated iframes).
export function normalizeInstagramUrl(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    const host = u.hostname.replace(/^www\./i, "");
    if (!/^instagram\.com$/i.test(host)) return "";
    const path = u.pathname.replace(/\/+$/, "").replace(/\/embed$/i, "");
    return `https://www.instagram.com${path}/`;
  } catch {
    return "";
  }
}

const LINK_TYPES = [
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "direct", label: "Other (direct video link)" },
];

export default function VideoCarouselEditor({
  sectionId = null,
  onSuccess,
  onCancel,
}) {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
  const isEdit = !!sectionId;

  const [subtitle, setSubtitle] = useState("");
  const [subtitleBn, setSubtitleBn] = useState("");
  const [isActive, setIsActive] = useState(true);
  // [{ url, public_id, youtubeId, productId, product }]
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [linkType, setLinkType] = useState("youtube");
  const [linkInput, setLinkInput] = useState("");

  // product search — attaches to one video card at a time
  const [attachIdx, setAttachIdx] = useState(null);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef(null);

  // Load section on edit
  useEffect(() => {
    if (!isEdit) return;
    fetch(`${API}/api/admin/featured/${sectionId}`, { credentials: "include" })
      .then((r) => r.json())
      .then(async (b) => {
        const s = b.section || {};
        setSubtitle(s.subtitle || "");
        setSubtitleBn(s.subtitleBn || "");
        setIsActive(s.isActive !== false);
        const vids = s.videos || [];
        // load linked product details for the previews
        const withProducts = await Promise.all(
          vids.map(async (v) => {
            if (!v.productId) return { ...v, product: null };
            const product = await fetch(
              `${API}/api/admin/products/${v.productId}`,
              { credentials: "include" },
            )
              .then((r) => r.json())
              .then((b2) => b2.product)
              .catch(() => null);
            return { ...v, product };
          }),
        );
        setVideos(withProducts);
      })
      .catch((err) => alert("Failed to load: " + err.message))
      .finally(() => setLoading(false));
  }, [sectionId, isEdit, API]);

  // Product search with debounce
  const searchProducts = useCallback(
    async (q) => {
      if (!q.trim()) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const r = await fetch(
          `${API}/api/admin/products?q=${encodeURIComponent(q)}&limit=8`,
          { credentials: "include" },
        );
        const b = await r.json();
        setSearchResults(b.items || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    },
    [API],
  );

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchProducts(query), 350);
    return () => clearTimeout(searchTimer.current);
  }, [query, searchProducts]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    for (const file of files) {
      try {
        const { asset } = await uploadAdminImage(file, "appleProduct/videos");
        setVideos((prev) => [
          ...prev,
          {
            url: asset.url,
            public_id: asset.public_id || "",
            youtubeId: "",
            facebookUrl: "",
            instagramUrl: "",
            previewTime: 0,
            productId: null,
            product: null,
          },
        ]);
      } catch (err) {
        alert(`Upload failed (${file.name}): ${err.message}`);
      }
    }
    setUploading(false);
    e.target.value = "";
  };

  const blankVideo = () => ({
    url: "",
    public_id: "",
    youtubeId: "",
    facebookUrl: "",
    instagramUrl: "",
    previewTime: 0,
    productId: null,
    product: null,
  });

  const handleAddLink = () => {
    const raw = linkInput.trim();
    if (!raw) return;

    if (linkType === "youtube") {
      const id = extractYouTubeId(raw);
      if (!id) {
        alert("Invalid YouTube link. Paste a video/shorts URL or a video ID.");
        return;
      }
      setVideos((prev) => [...prev, { ...blankVideo(), youtubeId: id }]);
    } else if (linkType === "facebook") {
      const url = normalizeFacebookUrl(raw);
      if (!url) {
        alert("Invalid Facebook link. Paste a facebook.com/fb.watch video URL.");
        return;
      }
      setVideos((prev) => [...prev, { ...blankVideo(), facebookUrl: url }]);
    } else if (linkType === "instagram") {
      const url = normalizeInstagramUrl(raw);
      if (!url) {
        alert("Invalid Instagram link. Paste an instagram.com post/reel URL.");
        return;
      }
      setVideos((prev) => [...prev, { ...blankVideo(), instagramUrl: url }]);
    } else {
      // Direct link — any hosted video file (mp4/webm/etc.)
      setVideos((prev) => [...prev, { ...blankVideo(), url: raw }]);
    }
    setLinkInput("");
  };

  const removeVideo = (idx) => {
    setVideos((prev) => prev.filter((_, i) => i !== idx));
    if (attachIdx === idx) setAttachIdx(null);
  };

  const moveVideo = (idx, dir) => {
    setVideos((prev) => {
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return next;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
    if (attachIdx === idx) setAttachIdx(idx + dir);
    else if (attachIdx === idx + dir) setAttachIdx(idx);
  };

  const attachProduct = (p) => {
    setVideos((prev) =>
      prev.map((v, i) =>
        i === attachIdx ? { ...v, productId: p._id, product: p } : v,
      ),
    );
    setAttachIdx(null);
    setQuery("");
    setSearchResults([]);
  };

  const detachProduct = (idx) =>
    setVideos((prev) =>
      prev.map((v, i) =>
        i === idx ? { ...v, productId: null, product: null } : v,
      ),
    );

  const handleSave = async () => {
    if (!subtitle.trim()) {
      alert("Tagline is required");
      return;
    }
    if (videos.length === 0) {
      alert("Add at least one video");
      return;
    }
    setSaving(true);
    try {
      const body = {
        type: "video",
        subtitle: subtitle.trim(),
        subtitleBn: subtitleBn.trim(),
        isActive,
        videos: videos.map((v) => ({
          url: v.url || "",
          public_id: v.public_id || "",
          youtubeId: v.youtubeId || "",
          facebookUrl: v.facebookUrl || "",
          instagramUrl: v.instagramUrl || "",
          previewTime: Math.max(0, Number(v.previewTime) || 0),
          productId: v.productId || null,
        })),
      };
      const url = isEdit
        ? `${API}/api/admin/featured/${sectionId}`
        : `${API}/api/admin/featured`;
      const resp = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed");
      onSuccess && onSuccess(data.section);
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getProductThumb = (p) =>
    p?.images?.[0]?.url || "/assets/placeholder.svg";
  const getProductPrice = (p) => p?.price ?? p?.variants?.[0]?.price ?? 0;
  const maxMb = Math.round(MAX_UPLOAD_BYTES / 1024 / 1024);

  if (loading)
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        Loading…
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow space-y-6">
      <h2 className="text-2xl font-bold tracking-tight text-[#1F2937] work-sans">
        {isEdit ? "Edit Video Carousel" : "New Shoppable Video Carousel"}
      </h2>

      {/* Tagline — this is the section's heading on the homepage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Tagline * (English)
          </label>
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="e.g. THIS IS HOW BEAUTY LOOKS LIKE"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Tagline (বাংলা)
          </label>
          <input
            value={subtitleBn}
            onChange={(e) => setSubtitleBn(e.target.value)}
            placeholder="ছোট ট্যাগলাইন (ঐচ্ছিক)"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      {/* Is Active toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsActive((v) => !v)}
          className={`relative w-12 h-6 rounded-full transition-colors ${isActive ? "bg-[#5B21B6]" : "bg-gray-300"}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? "translate-x-6" : ""}`}
          />
        </button>
        <span className="text-sm text-gray-700">
          {isActive ? "Active (visible on homepage)" : "Inactive (hidden)"}
        </span>
      </div>

      <hr />

      {/* Add videos */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-700">
          Videos{" "}
          <span className="font-normal text-gray-400">
            (upload a file — max {maxMb}MB — or paste a YouTube, Facebook,
            Instagram, or other direct video link)
          </span>
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="inline-flex items-center justify-center px-4 py-2 bg-[#5B21B6] text-white rounded-lg cursor-pointer hover:bg-violet-800 transition text-sm font-semibold shrink-0">
            {uploading ? "Uploading…" : "⬆ Upload Video"}
            <input
              type="file"
              accept="video/*"
              multiple
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <div className="flex flex-1 gap-2">
            <select
              value={linkType}
              onChange={(e) => setLinkType(e.target.value)}
              className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 shrink-0"
            >
              {LINK_TYPES.map((lt) => (
                <option key={lt.value} value={lt.value}>
                  {lt.label}
                </option>
              ))}
            </select>
            <input
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddLink()}
              placeholder={
                linkType === "youtube"
                  ? "Paste YouTube link (video / shorts)…"
                  : linkType === "facebook"
                    ? "Paste Facebook video/reel link…"
                    : linkType === "instagram"
                      ? "Paste Instagram post/reel link…"
                      : "Paste direct video URL (mp4, webm, …)…"
              }
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              type="button"
              onClick={handleAddLink}
              className="px-4 py-2 bg-violet-50 text-violet-800 rounded-lg font-semibold hover:bg-violet-100 transition text-sm shrink-0"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Video cards */}
        {videos.length > 0 && (
          <ul className="space-y-3">
            {videos.map((v, idx) => (
              <li
                key={`${v.public_id || v.youtubeId || v.facebookUrl || v.instagramUrl || v.url}-${idx}`}
                className="bg-gray-50 border rounded-xl p-3 space-y-3"
              >
                <div className="flex items-start gap-3">
                  {/* Order buttons */}
                  <div className="flex flex-col gap-1 pt-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveVideo(idx, -1)}
                      className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs leading-none"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={idx === videos.length - 1}
                      onClick={() => moveVideo(idx, 1)}
                      className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs leading-none"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Preview — portrait like the homepage cards */}
                  {v.youtubeId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg`}
                      alt="YouTube preview"
                      className="w-20 h-32 object-cover rounded-lg border bg-black shrink-0"
                    />
                  ) : v.facebookUrl ? (
                    <div className="w-20 h-32 rounded-lg border bg-[#0866FF] flex items-center justify-center shrink-0">
                      <span className="text-white text-[10px] font-bold uppercase tracking-wide">
                        Facebook
                      </span>
                    </div>
                  ) : v.instagramUrl ? (
                    <div className="w-20 h-32 rounded-lg border bg-linear-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] flex items-center justify-center shrink-0">
                      <span className="text-white text-[10px] font-bold uppercase tracking-wide">
                        Instagram
                      </span>
                    </div>
                  ) : (
                    <video
                      key={`${v.url}#t=${Number(v.previewTime) || 0}`}
                      src={`${v.url}#t=${Number(v.previewTime) || 0}`}
                      muted
                      playsInline
                      preload="metadata"
                      className="w-20 h-32 object-cover rounded-lg border bg-black shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-xs text-gray-500">
                      {v.youtubeId ? (
                        <>
                          YouTube ·{" "}
                          <a
                            href={`https://youtu.be/${v.youtubeId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-violet-700 hover:underline"
                          >
                            {v.youtubeId}
                          </a>
                        </>
                      ) : v.facebookUrl ? (
                        <>
                          Facebook ·{" "}
                          <a
                            href={v.facebookUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-violet-700 hover:underline truncate inline-block max-w-55 align-bottom"
                          >
                            {v.facebookUrl}
                          </a>
                        </>
                      ) : v.instagramUrl ? (
                        <>
                          Instagram ·{" "}
                          <a
                            href={v.instagramUrl.replace(/\/embed$/, "")}
                            target="_blank"
                            rel="noreferrer"
                            className="text-violet-700 hover:underline truncate inline-block max-w-55 align-bottom"
                          >
                            {v.instagramUrl.replace(/\/embed$/, "")}
                          </a>
                        </>
                      ) : (
                        "Uploaded/direct video"
                      )}
                    </p>

                    {/* Which frame shows while the card is paused / not centered
                        — not applicable to Facebook/Instagram embeds, which
                        always use the platform's own player chrome */}
                    {!v.facebookUrl && !v.instagramUrl && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className="text-xs text-gray-500">
                          Paused preview at
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={v.previewTime ?? 0}
                          onChange={(e) =>
                            setVideos((prev) =>
                              prev.map((vv, i) =>
                                i === idx
                                  ? { ...vv, previewTime: e.target.value }
                                  : vv,
                              ),
                            )
                          }
                          className="w-20 border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <span className="text-xs text-gray-400">
                          {v.youtubeId
                            ? "sec — shown live on the homepage while paused (thumbnail here stays YouTube's default)"
                            : "sec — this frame shows while the video is paused (thumbnail on the left updates)"}
                        </span>
                      </div>
                    )}

                    {/* Linked product */}
                    {v.product ? (
                      <div className="flex items-center gap-2 bg-white border rounded-lg px-2 py-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getProductThumb(v.product)}
                          alt={v.product.title}
                          className="w-8 h-8 object-cover rounded border shrink-0"
                          onError={(e) => {
                            e.currentTarget.src = "/assets/placeholder.svg";
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {v.product.title}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            ৳{getProductPrice(v.product)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => detachProduct(idx)}
                          className="text-red-400 hover:text-red-600 text-xs font-bold px-1"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAttachIdx(attachIdx === idx ? null : idx);
                          setQuery("");
                          setSearchResults([]);
                        }}
                        className="text-xs font-semibold text-violet-700 hover:text-violet-900"
                      >
                        {attachIdx === idx ? "✕ Cancel" : "+ Link a product"}
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeVideo(idx)}
                    className="text-red-400 hover:text-red-600 text-xs font-bold px-2 shrink-0"
                  >
                    Delete
                  </button>
                </div>

                {/* Product search (only for the card being linked) */}
                {attachIdx === idx && (
                  <div className="relative">
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search product by name…"
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    {searching && (
                      <span className="absolute right-3 top-2.5 text-xs text-gray-400">
                        Searching…
                      </span>
                    )}
                    {searchResults.length > 0 && (
                      <ul className="mt-1 border rounded-lg bg-white shadow-lg max-h-56 overflow-y-auto divide-y text-sm">
                        {searchResults.map((p) => (
                          <li
                            key={p._id}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-violet-50 cursor-pointer"
                            onClick={() => attachProduct(p)}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getProductThumb(p)}
                              alt={p.title}
                              className="w-10 h-10 object-cover rounded-lg border shrink-0"
                              onError={(e) => {
                                e.currentTarget.src = "/assets/placeholder.svg";
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{p.title}</p>
                              <p className="text-gray-400 text-xs">
                                ৳{getProductPrice(p)}
                              </p>
                            </div>
                            <span className="text-violet-700 font-semibold text-xs">
                              + Link
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="px-6 py-2 bg-[#5B21B6] text-white rounded-lg font-semibold hover:bg-violet-800 disabled:opacity-50 transition"
        >
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Carousel"}
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
