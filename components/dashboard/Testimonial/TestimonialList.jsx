"use client";

import React, { useState, useEffect, useCallback } from "react";
import TestimonialEditor from "./TestimonialEditor";
import { useUser } from "@/components/context/UserContext";

export default function TestimonialList() {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
  const { user } = useUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [editId, setEditId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/admin/testimonials`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => setItems(b.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [API]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleActive = async (item) => {
    try {
      const resp = await fetch(`${API}/api/admin/testimonials/${item._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      if (!resp.ok) throw new Error("Failed");
      setItems((prev) =>
        prev.map((p) =>
          p._id === item._id ? { ...p, isActive: !p.isActive } : p,
        ),
      );
    } catch {
      alert("Failed to update");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this testimonial? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const resp = await fetch(`${API}/api/admin/testimonials/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!resp.ok) throw new Error("Failed");
      setItems((prev) => prev.filter((p) => p._id !== id));
    } catch {
      alert("Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const handleMoveOrder = async (idx, dir) => {
    const next = [...items];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    const updates = next.map((p, i) => ({ _id: p._id, order: i }));
    setItems(next);
    try {
      await fetch(`${API}/api/admin/testimonials-reorder`, {
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
      <TestimonialEditor
        onSuccess={() => {
          setView("list");
          load();
        }}
        onCancel={() => setView("list")}
      />
    );

  if (view === "edit" && editId)
    return (
      <TestimonialEditor
        testimonialId={editId}
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
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F2937] work-sans">
            Testimonials
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Customer reviews shown in the &quot;What Our Customers Say&quot;
            section on the homepage.
          </p>
        </div>
        <button
          onClick={() => setView("create")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-sm shrink-0"
        >
          + Add Testimonial
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium mb-2">No testimonials yet</p>
          <p className="text-sm">
            Click &quot;+ Add Testimonial&quot; to create one.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item, idx) => (
            <li
              key={item._id}
              className="bg-white border rounded-2xl p-3 flex items-center gap-4 shadow-sm"
            >
              <div className="flex flex-col gap-1">
                <button
                  disabled={idx === 0}
                  onClick={() => handleMoveOrder(idx, -1)}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs leading-none"
                >
                  ▲
                </button>
                <button
                  disabled={idx === items.length - 1}
                  onClick={() => handleMoveOrder(idx, 1)}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs leading-none"
                >
                  ▼
                </button>
              </div>

              {item.avatar?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.avatar.url}
                  alt={item.name}
                  className="w-14 h-14 object-cover rounded-full border shrink-0 bg-gray-50"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center font-bold shrink-0">
                  {item.name?.[0]?.toUpperCase() || "?"}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">
                  {item.name}
                </p>
                {item.address && (
                  <p className="text-xs text-gray-400 truncate">
                    {item.address}
                  </p>
                )}
                <p className="text-xs text-yellow-500 mb-0.5">
                  {"★".repeat(item.rating || 5)}
                  <span className="text-gray-300">
                    {"★".repeat(5 - (item.rating || 5))}
                  </span>
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {item.message}
                </p>
              </div>

              <button
                onClick={() => handleToggleActive(item)}
                className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${item.isActive ? "bg-blue-600" : "bg-gray-300"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${item.isActive ? "translate-x-5" : ""}`}
                />
              </button>

              <button
                onClick={() => {
                  setEditId(item._id);
                  setView("edit");
                }}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 shrink-0"
              >
                Edit
              </button>

              {user?.role === "admin" && (
                <button
                  onClick={() => handleDelete(item._id)}
                  disabled={deleting === item._id}
                  className="px-3 py-1.5 text-sm border border-red-200 rounded-lg hover:bg-red-50 text-red-500 shrink-0 disabled:opacity-50"
                >
                  {deleting === item._id ? "…" : "Delete"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
