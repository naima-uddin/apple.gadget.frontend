"use client";

import React, { useState, useEffect, useCallback } from "react";
import BannerEditor from "./BannerEditor";
import { useUser } from "@/components/context/UserContext";
import Toggle from "@/components/dashboard/ui/Toggle";
import EmptyState from "@/components/dashboard/ui/EmptyState";

export default function BannersList() {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
  const { user } = useUser();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // 'list' | 'create' | 'edit'
  const [editId, setEditId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/admin/banners`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => setBanners(b.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [API]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleActive = async (banner) => {
    try {
      const resp = await fetch(`${API}/api/admin/banners/${banner._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      if (!resp.ok) throw new Error("Failed");
      setBanners((prev) =>
        prev.map((b) =>
          b._id === banner._id ? { ...b, isActive: !b.isActive } : b,
        ),
      );
    } catch {
      alert("Failed to update");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this banner slide? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const resp = await fetch(`${API}/api/admin/banners/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!resp.ok) throw new Error("Failed");
      setBanners((prev) => prev.filter((b) => b._id !== id));
    } catch {
      alert("Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const handleMoveOrder = async (idx, dir) => {
    const next = [...banners];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    const updates = next.map((b, i) => ({ _id: b._id, order: i }));
    setBanners(next);
    try {
      await fetch(`${API}/api/admin/banners-reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
    } catch {
      load();
    }
  };

  if (view === "create")
    return (
      <BannerEditor
        onSuccess={() => {
          setView("list");
          load();
        }}
        onCancel={() => setView("list")}
      />
    );

  if (view === "edit" && editId)
    return (
      <BannerEditor
        bannerId={editId}
        onSuccess={() => {
          setView("list");
          setEditId(null);
          load();
        }}
        onCancel={() => {
          setView("list");
          setEditId(null);
        }}
      />
    );

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F2937] work-sans">Banner Slides</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Slides shown in the homepage banner carousel
          </p>
        </div>
        <button
          onClick={() => setView("create")}
          className="px-4 py-2 bg-[#1D1D1F] text-white rounded-xl font-semibold hover:bg-black transition-colors text-sm shrink-0"
        >
          + Add Slide
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : banners.length === 0 ? (
        <EmptyState
          title="No banner slides yet"
          description={'Click "+ Add Slide" to upload your first banner.'}
        />
      ) : (
        <ul className="space-y-3">
          {banners.map((b, idx) => (
            <li
              key={b._id}
              className="bg-white border rounded-2xl p-3 flex items-center gap-4 shadow-sm"
            >
              {/* Reorder */}
              <div className="flex flex-col gap-1">
                <button
                  disabled={idx === 0}
                  onClick={() => handleMoveOrder(idx, -1)}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs leading-none"
                >
                  ▲
                </button>
                <button
                  disabled={idx === banners.length - 1}
                  onClick={() => handleMoveOrder(idx, 1)}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs leading-none"
                >
                  ▼
                </button>
              </div>

              {/* Thumbnail */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.image?.url || "/assets/placeholder.svg"}
                alt={b.title || "Banner"}
                className="w-28 h-16 object-cover rounded-lg border shrink-0 bg-gray-100"
                onError={(e) => {
                  e.currentTarget.src = "/assets/placeholder.svg";
                }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">
                  {b.title || (
                    <span className="text-gray-400 italic">No title</span>
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {b.subtitle || "—"}
                  {b.badge && (
                    <span className="ml-2 bg-blue-100 text-blue-700 rounded-lg px-1.5 py-0.5">
                      {b.badge}
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Link: <span className="text-blue-500">{b.buttonLink}</span>
                </p>
              </div>

              {/* Active toggle */}
              <Toggle
                checked={b.isActive}
                onChange={() => handleToggleActive(b)}
                label={b.title || "Banner slide"}
              />

              {/* Edit / Delete */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    setEditId(b._id);
                    setView("edit");
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-gray-50 text-[#1D1D1F] rounded-lg hover:bg-gray-100 transition"
                >
                  Edit
                </button>
                {user?.role === "admin" && (
                  <button
                    onClick={() => handleDelete(b._id)}
                    disabled={deleting === b._id}
                    className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                  >
                    {deleting === b._id ? "…" : "Delete"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
