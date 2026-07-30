"use client";

import React, { useState, useEffect, useCallback } from "react";
import FeaturedSectionEditor from "./FeaturedSectionEditor";
import VideoCarouselEditor from "./VideoCarouselEditor";
import { useUser } from "@/components/context/UserContext";
import Toggle from "@/components/dashboard/ui/Toggle";
import EmptyState from "@/components/dashboard/ui/EmptyState";

export default function FeaturedSectionsList() {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
  const { user } = useUser();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  // 'list' | 'create' | 'create-video' | 'edit'
  const [view, setView] = useState("list");
  const [editId, setEditId] = useState(null);
  const [editType, setEditType] = useState("products");
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/admin/featured`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => setSections(b.items || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [API]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleActive = async (section) => {
    try {
      const resp = await fetch(`${API}/api/admin/featured/${section._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !section.isActive }),
      });
      if (!resp.ok) throw new Error("Failed");
      setSections((prev) =>
        prev.map((s) =>
          s._id === section._id ? { ...s, isActive: !s.isActive } : s,
        ),
      );
    } catch {
      alert("Failed to update");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this featured section? This cannot be undone."))
      return;
    setDeleting(id);
    try {
      const resp = await fetch(`${API}/api/admin/featured/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!resp.ok) throw new Error("Failed");
      setSections((prev) => prev.filter((s) => s._id !== id));
    } catch {
      alert("Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const handleMoveOrder = async (idx, dir) => {
    const next = [...sections];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    const updates = next.map((s, i) => ({ _id: s._id, order: i }));
    setSections(next);
    try {
      await fetch(`${API}/api/admin/featured-reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
    } catch {
      load(); // rollback on error
    }
  };

  if (view === "create" || view === "create-video") {
    const Editor =
      view === "create-video" ? VideoCarouselEditor : FeaturedSectionEditor;
    return (
      <Editor
        onSuccess={() => {
          setView("list");
          load();
        }}
        onCancel={() => setView("list")}
      />
    );
  }

  if (view === "edit" && editId) {
    const Editor =
      editType === "video" ? VideoCarouselEditor : FeaturedSectionEditor;
    return (
      <Editor
        sectionId={editId}
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
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F2937] work-sans">
            Featured Sections
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Product &amp; video carousels displayed on the homepage, in this
            order
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setView("create")}
            className="px-4 py-2 bg-[#1D1D1F] text-white rounded-xl font-semibold hover:bg-black transition-colors text-sm"
          >
            + Product Section
          </button>
          <button
            onClick={() => setView("create-video")}
            className="px-4 py-2 bg-[#1D1D1F] text-white rounded-xl font-semibold hover:bg-black transition-colors text-sm"
          >
            + Video Carousel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : sections.length === 0 ? (
        <EmptyState
          title="No featured sections yet"
          description={
            'Click "+ New Section" to create your first product carousel.'
          }
        />
      ) : (
        <ul className="space-y-3">
          {sections.map((sec, idx) => (
            <li
              key={sec._id}
              className="bg-white border rounded-2xl p-4 flex items-center gap-4 shadow-sm"
            >
              {/* Order buttons */}
              <div className="flex flex-col gap-1">
                <button
                  disabled={idx === 0}
                  onClick={() => handleMoveOrder(idx, -1)}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs leading-none"
                >
                  ▲
                </button>
                <button
                  disabled={idx === sections.length - 1}
                  onClick={() => handleMoveOrder(idx, 1)}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs leading-none"
                >
                  ▼
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">
                  {sec.type === "video" && (
                    <span className="inline-block mr-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-[#1D1D1F] rounded-full align-middle">
                      Video
                    </span>
                  )}
                  {sec.type === "video" ? sec.subtitle || sec.title : sec.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {sec.type === "video" ? (
                    `${sec.videos?.length || 0} video${(sec.videos?.length || 0) !== 1 ? "s" : ""} · ${sec.videos?.filter((v) => v.productId).length || 0} linked product${(sec.videos?.filter((v) => v.productId).length || 0) !== 1 ? "s" : ""}`
                  ) : (
                    <>
                      {sec.productIds?.length
                        ? `${sec.productIds.length} product${sec.productIds.length !== 1 ? "s" : ""} selected manually`
                        : sec.categoryId
                          ? `Auto-fill from category · limit ${sec.limit}`
                          : "No products configured"}
                      {" · "}
                      <a
                        href={sec.viewAllLink}
                        className="text-blue-400 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {sec.viewAllLink}
                      </a>
                    </>
                  )}
                </p>
              </div>

              {/* Active toggle */}
              <Toggle
                checked={sec.isActive}
                onChange={() => handleToggleActive(sec)}
                label={sec.title || "Featured section"}
              />

              {/* Edit / Delete */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    setEditId(sec._id);
                    setEditType(sec.type === "video" ? "video" : "products");
                    setView("edit");
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-gray-50 text-[#1D1D1F] rounded-lg hover:bg-gray-100 transition"
                >
                  Edit
                </button>
                {user?.role === "admin" && (
                  <button
                    onClick={() => handleDelete(sec._id)}
                    disabled={deleting === sec._id}
                    className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                  >
                    {deleting === sec._id ? "…" : "Delete"}
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
