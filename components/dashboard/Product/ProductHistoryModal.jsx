"use client";

import React, { useEffect, useState } from "react";
import {
  FaTimes,
  FaPlus,
  FaPen,
  FaTrash,
  FaTrashRestore,
  FaClone,
  FaHistory,
} from "react-icons/fa";

// Visual config for each logged action type.
const ACTION_META = {
  create: { label: "Created", icon: FaPlus, cls: "bg-green-50 text-green-700" },
  update: { label: "Edited", icon: FaPen, cls: "bg-blue-50 text-blue-700" },
  trash: { label: "Moved to Trash", icon: FaTrash, cls: "bg-red-50 text-red-600" },
  restore: {
    label: "Restored",
    icon: FaTrashRestore,
    cls: "bg-green-50 text-green-700",
  },
  "permanent-delete": {
    label: "Permanently deleted",
    icon: FaTrash,
    cls: "bg-red-50 text-red-700",
  },
  duplicate: { label: "Duplicated", icon: FaClone, cls: "bg-gray-100 text-gray-700" },
};

const fmtTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ProductHistoryModal({ product, onClose }) {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!product?._id) return;
    let alive = true;
    setLoading(true);
    setError("");
    fetch(`${API}/api/admin/products/${product._id}/activity`, {
      credentials: "include",
    })
      .then((r) => r.json().then((b) => ({ ok: r.ok, b })))
      .then(({ ok, b }) => {
        if (!alive) return;
        if (!ok) throw new Error(b.error || "Failed to load history");
        setItems(b.items || []);
      })
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [API, product?._id]);

  // close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[80vh] flex flex-col bg-white rounded-2xl shadow-xl border border-gray-100"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b">
          <div>
            <h3 className="text-lg font-bold text-[#1F2937] flex items-center gap-2">
              <FaHistory className="text-gray-400" />
              Edit history
            </h3>
            <p className="mt-0.5 text-sm text-gray-500 line-clamp-1">
              {product?.title}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading…</div>
          ) : error ? (
            <div className="text-center py-10 text-red-600 text-sm">{error}</div>
          ) : items.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">
              No history recorded yet.
            </div>
          ) : (
            <ol className="relative border-l border-gray-200 ml-3">
              {items.map((it) => {
                const meta = ACTION_META[it.action] || {
                  label: it.action,
                  icon: FaHistory,
                  cls: "bg-gray-100 text-gray-700",
                };
                const Icon = meta.icon;
                return (
                  <li key={it._id} className="mb-5 ml-6">
                    <span className="absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-white bg-gray-100 text-gray-500">
                      <Icon className="h-3 w-3" />
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-xs font-medium ${meta.cls}`}
                      >
                        {meta.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {fmtTime(it.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">
                      by{" "}
                      <span className="font-medium">
                        {it.actorName || "Unknown admin"}
                      </span>
                      {it.actorEmail && (
                        <span className="text-gray-400"> ({it.actorEmail})</span>
                      )}
                    </p>
                    {it.action === "update" &&
                      Array.isArray(it.meta?.fields) &&
                      it.meta.fields.length > 0 && (
                        <p className="mt-0.5 text-xs text-gray-400">
                          Changed: {it.meta.fields.join(", ")}
                        </p>
                      )}
                    {it.action === "duplicate" && it.meta?.sourceTitle && (
                      <p className="mt-0.5 text-xs text-gray-400">
                        Copied from: {it.meta.sourceTitle}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
