"use client";

import React, { useState, useEffect, useCallback } from "react";
import Toggle from "@/components/dashboard/ui/Toggle";

export default function HomepageLayoutOrder() {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/admin/homepage-layout`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => setItems(b.items || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [API]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleActive = async (item) => {
    try {
      const resp = await fetch(
        `${API}/api/admin/homepage-layout/${item._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ isActive: !item.isActive }),
        },
      );
      if (!resp.ok) throw new Error("Failed");
      setItems((prev) =>
        prev.map((s) =>
          s._id === item._id ? { ...s, isActive: !s.isActive } : s,
        ),
      );
    } catch {
      alert("Failed to update");
    }
  };

  const handleMoveOrder = async (idx, dir) => {
    const next = [...items];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    const updates = next.map((s, i) => ({ _id: s._id, order: i }));
    setItems(next);
    try {
      await fetch(`${API}/api/admin/homepage-layout-reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
    } catch {
      load(); // rollback on error
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2937] work-sans">
          Homepage Section Order
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Decide which section appears where on the homepage. Toggle a
          section off to hide it entirely.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : (
        <ul className="space-y-3">
          {items.map((item, idx) => (
            <li
              key={item._id}
              className="bg-white border rounded-2xl p-4 flex items-center gap-4 shadow-sm"
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

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">
                  {item.type === "featuredRow" && (
                    <span className="inline-block mr-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-[#1D1D1F] rounded-full align-middle">
                      Featured Row
                    </span>
                  )}
                  {item.label || item.key}
                </p>
              </div>

              <Toggle
                checked={item.isActive}
                onChange={() => handleToggleActive(item)}
                label={item.label || item.key}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
