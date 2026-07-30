"use client";

import React, { useEffect, useRef, useState } from "react";
import { useUser } from "@/components/context/UserContext";

const DEFAULT_MEGA_MENU_TAGS = [
  {
    name: "Eid Offer",
    icon: "🌙",
    color: "text-emerald-600",
    href: "/tag/best-offer-on-eid-fest",
    isActive: true,
    order: 0,
  },
  {
    name: "Free Shipping",
    icon: "🚚",
    color: "text-green-600",
    href: "/tag/free-shipping",
    isActive: true,
    order: 1,
  },
  {
    name: "Best Seller",
    icon: "⭐",
    color: "text-yellow-600",
    href: "/tag/best-seller",
    isActive: true,
    order: 2,
  },
  {
    name: "Hot",
    icon: "🔥",
    color: "text-red-600",
    href: "/tag/hot",
    isActive: true,
    order: 3,
  },
  {
    name: "New Arrival",
    icon: "✨",
    color: "text-blue-600",
    href: "/tag/new-arrival",
    isActive: true,
    order: 4,
  },
  {
    name: "Popular Pics",
    icon: "💖",
    color: "text-pink-600",
    href: "/tag/popular-pics",
    isActive: true,
    order: 5,
  },
  {
    name: "Trending",
    icon: "📈",
    color: "text-purple-600",
    href: "/tag/trending",
    isActive: true,
    order: 6,
  },
  {
    name: "Limited Edition",
    icon: "💎",
    color: "text-purple-600",
    href: "/tag/limited-edition",
    isActive: true,
    order: 7,
  },
  {
    name: "400 cashback",
    icon: "💸",
    color: "text-cyan-600",
    href: "/tag/up-to-400-bkash-cashback",
    isActive: true,
    order: 8,
  },
  {
    name: "1000 cashback",
    icon: "💳",
    color: "text-sky-600",
    href: "/tag/up-to-1000-tk-visa-mastercard",
    isActive: true,
    order: 9,
  },
  {
    name: "Under 999",
    icon: "🧾",
    color: "text-lime-700",
    href: "/tag/under-999-deals",
    isActive: true,
    order: 10,
  },
  {
    name: "Points Save",
    icon: "🏆",
    color: "text-teal-600",
    href: "/tag/get-points-save-more",
    isActive: true,
    order: 13,
  },
  {
    name: "Featured",
    icon: "🏅",
    color: "text-violet-700",
    href: "/tag/featured",
    isActive: true,
    order: 14,
  },
  {
    name: "Coupon",
    icon: "🎟️",
    color: "text-teal-600",
    href: "/#offers",
    isActive: true,
    order: 15,
  },
  {
    name: "Flash Sale",
    icon: "⚡",
    color: "text-rose-600",
    href: "/tag/flash-sale",
    isActive: true,
    order: 16,
  },
  {
    name: "Clearance",
    icon: "🏷️",
    color: "text-amber-600",
    href: "/tag/clearance",
    isActive: true,
    order: 17,
  },
];

const makeLocalId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeMegaMenuTags = (items) => {
  const list = Array.isArray(items) ? items : [];
  const normalized = list
    .filter(Boolean)
    .map((item, index) => ({
      _localId: item._localId || makeLocalId(),
      name: String(item.name || "").trim(),
      href: String(item.href || "").trim() || "/tag/new-tag",
      icon: String(item.icon || "🏷️").trim(),
      color: String(item.color || "text-gray-700").trim(),
      isActive: item.isActive !== false,
      order: Number.isFinite(Number(item.order)) ? Number(item.order) : index,
    }))
    .filter((item) => item.name);

  return normalized.length
    ? normalized
        .sort((a, b) => a.order - b.order)
        .map((item, idx) => ({ ...item, order: idx }))
    : DEFAULT_MEGA_MENU_TAGS.map((item, idx) => ({
        ...item,
        _localId: makeLocalId(),
        order: idx,
      }));
};

export default function TagsForm() {
  const { user, refreshUser } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newlyAddedId, setNewlyAddedId] = useState("");
  const nameInputRefs = useRef({});

  useEffect(() => {
    if (!user) refreshUser();
  }, [user, refreshUser]);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/admin/settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => setTags(normalizeMegaMenuTags(b?.settings?.megaMenuTags)))
      .catch(() => setTags(normalizeMegaMenuTags(DEFAULT_MEGA_MENU_TAGS)))
      .finally(() => setLoading(false));
  }, [API]);

  useEffect(() => {
    if (!newlyAddedId) return;
    const input = nameInputRefs.current[newlyAddedId];
    if (input) {
      input.focus();
      input.select();
      setNewlyAddedId("");
    }
  }, [newlyAddedId, tags]);

  const handleAddTag = () => {
    const id = makeLocalId();
    setTags((prev) =>
      normalizeMegaMenuTags([
        {
          _localId: id,
          name: "New Tag",
          href: "/tag/new-tag",
          icon: "🏷️",
          color: "text-gray-700",
          isActive: true,
          order: -1,
        },
        ...(prev || []),
      ]),
    );
    setNewlyAddedId(id);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { megaMenuTags: normalizeMegaMenuTags(tags) };
      const safePayload = {
        megaMenuTags: (payload.megaMenuTags || []).map(
          ({ _localId, ...rest }) => rest,
        ),
      };
      const resp = await fetch(`${API}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(safePayload),
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Save failed");
      alert("Tags saved");
    } catch (err) {
      alert(err.message || "Failed to save tags");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center text-gray-500">
        Loading tags…
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-bold text-[#1F2937]">Mega Menu Tags</h2>
        <button
          type="button"
          className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm shrink-0 text-gray-700 hover:bg-gray-50 transition-colors"
          onClick={handleAddTag}
        >
          + Add tag
        </button>
      </div>

      <div className="space-y-3">
        {(tags || []).map((tag, idx) => (
          <div
            key={tag._localId || idx}
            className="border border-gray-200 rounded-lg p-3 grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
          >
            <label className="md:col-span-1 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={tag.isActive !== false}
                onChange={(e) =>
                  setTags((prev) =>
                    prev.map((item, i) =>
                      i === idx
                        ? { ...item, isActive: e.target.checked }
                        : item,
                    ),
                  )
                }
              />
              Show
            </label>

            <input
              ref={(el) => {
                if (el) nameInputRefs.current[tag._localId] = el;
              }}
              className="md:col-span-3 border px-3 py-2 rounded-lg"
              value={tag.name || ""}
              placeholder="Tag name"
              onChange={(e) =>
                setTags((prev) =>
                  prev.map((item, i) =>
                    i === idx ? { ...item, name: e.target.value } : item,
                  ),
                )
              }
            />

            <input
              className="md:col-span-3 border px-3 py-2 rounded-lg"
              value={tag.href || ""}
              placeholder="/tag/your-tag"
              onChange={(e) =>
                setTags((prev) =>
                  prev.map((item, i) =>
                    i === idx ? { ...item, href: e.target.value } : item,
                  ),
                )
              }
            />

            <input
              className="md:col-span-1 border px-3 py-2 rounded-lg"
              value={tag.icon || ""}
              placeholder="🏷️"
              onChange={(e) =>
                setTags((prev) =>
                  prev.map((item, i) =>
                    i === idx ? { ...item, icon: e.target.value } : item,
                  ),
                )
              }
            />

            <input
              className="md:col-span-2 border px-3 py-2 rounded-lg"
              value={tag.color || ""}
              placeholder="text-violet-700"
              onChange={(e) =>
                setTags((prev) =>
                  prev.map((item, i) =>
                    i === idx ? { ...item, color: e.target.value } : item,
                  ),
                )
              }
            />

            <div className="md:col-span-2 flex items-center gap-2 justify-end">
              <button
                type="button"
                className="px-2 py-1 border border-gray-200 rounded-lg text-xs"
                onClick={() => {
                  if (idx === 0) return;
                  setTags((prev) => {
                    const arr = [...prev];
                    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                    return arr.map((item, i) => ({ ...item, order: i }));
                  });
                }}
              >
                ↑
              </button>
              <button
                type="button"
                className="px-2 py-1 border border-gray-200 rounded-lg text-xs"
                onClick={() => {
                  setTags((prev) => {
                    if (idx >= prev.length - 1) return prev;
                    const arr = [...prev];
                    [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                    return arr.map((item, i) => ({ ...item, order: i }));
                  });
                }}
              >
                ↓
              </button>
              <button
                type="button"
                className="px-2 py-1 border border-gray-200 rounded-lg text-xs text-red-600 border-red-200"
                onClick={() =>
                  setTags((prev) =>
                    prev
                      .filter((_, i) => i !== idx)
                      .map((item, i) => ({ ...item, order: i })),
                  )
                }
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        {user?.role === "admin" ? (
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save tags"}
          </button>
        ) : (
          <button
            className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
            disabled
          >
            Read-only
          </button>
        )}
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 border border-gray-200 rounded-lg"
        >
          Reset
        </button>
      </div>

      <div className="mt-6 text-xs text-gray-500">
        Control which tags show in mega menu, their names, links, icons, and
        order.
      </div>
    </div>
  );
}
