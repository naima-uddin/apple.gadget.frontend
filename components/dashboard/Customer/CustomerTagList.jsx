"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/components/context/UserContext";

const emptyForm = { name: "", color: "#3B82F6", description: "" };

export default function CustomerTagList() {
  const { user } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadTags = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API}/api/admin/customer-tags`, {
        credentials: "include",
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Failed to load tags");
      setItems(body.items || []);
    } catch (err) {
      alert(err.message || "Failed to load tags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const saveTag = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const resp = await fetch(
        editingId
          ? `${API}/api/admin/customer-tags/${editingId}`
          : `${API}/api/admin/customer-tags`,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(form),
        },
      );
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Save failed");
      resetForm();
      loadTags();
    } catch (err) {
      alert(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteTag = async (id) => {
    if (!confirm("Delete this customer tag?")) return;
    try {
      const resp = await fetch(`${API}/api/admin/customer-tags/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Delete failed");
      loadTags();
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#1F2937]">Customer Tags</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Create tags and assign them from each customer profile.
        </p>
      </div>

      <form
        onSubmit={saveTag}
        className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-[1fr_9rem_1fr_auto]"
      >
        <input
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          className="border border-gray-200 px-3 py-2 rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-[#1D1D1F] focus:border-[#1D1D1F]"
          placeholder="Tag name"
        />
        <input
          type="color"
          value={form.color}
          onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
          className="h-10 w-full rounded-xl border border-gray-200 bg-white p-1 outline-none transition focus:ring-2 focus:ring-[#1D1D1F] focus:border-[#1D1D1F]"
          title="Tag color"
        />
        <input
          value={form.description}
          onChange={(e) =>
            setForm((p) => ({ ...p, description: e.target.value }))
          }
          className="border border-gray-200 px-3 py-2 rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-[#1D1D1F] focus:border-[#1D1D1F]"
          placeholder="Description"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#1D1D1F] px-4 py-2 text-sm font-semibold text-white hover:bg-black transition-colors disabled:opacity-60"
          >
            {saving ? "Saving..." : editingId ? "Update" : "Add"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-gray-200 text-gray-700 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
          <svg
            className="animate-spin h-4 w-4 text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-20"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-80"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          Loading...
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3">Tag</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {items.map((tag) => (
                  <tr key={tag._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: tag.color || "#3B82F6" }}
                      >
                        {tag.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {tag.description || "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(tag._id);
                          setForm({
                            name: tag.name || "",
                            color: tag.color || "#3B82F6",
                            description: tag.description || "",
                          });
                        }}
                        className="mr-2 rounded-xl border border-gray-200 text-gray-700 px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors"
                      >
                        Edit
                      </button>
                      {user?.role === "admin" && (
                        <button
                          type="button"
                          onClick={() => deleteTag(tag._id)}
                          className="rounded-xl border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!items.length && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No customer tags yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
