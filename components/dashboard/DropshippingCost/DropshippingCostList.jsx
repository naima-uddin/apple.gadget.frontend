"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/components/context/UserContext";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

const emptyForm = { name: "", cost: "", description: "" };

const inp =
  "w-full border border-gray-200 px-3 py-2 rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-[#1D1D1F] focus:border-[#1D1D1F]";

export default function DropshippingCostList() {
  const { user } = useUser();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API}/api/admin/dropshipping-costs`, {
        credentials: "include",
      });
      const body = await resp.json();
      if (!resp.ok)
        throw new Error(body.error || "Failed to load dropshipping costs");
      setItems(body.items || []);
    } catch (err) {
      alert(err.message || "Failed to load dropshipping costs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const saveItem = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (form.cost === "" || Number.isNaN(Number(form.cost)) || Number(form.cost) < 0) {
      alert("Enter a valid cost");
      return;
    }
    setSaving(true);
    try {
      const resp = await fetch(
        editingId
          ? `${API}/api/admin/dropshipping-costs/${editingId}`
          : `${API}/api/admin/dropshipping-costs`,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: form.name,
            cost: Number(form.cost),
            description: form.description,
          }),
        },
      );
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Save failed");
      resetForm();
      loadItems();
    } catch (err) {
      alert(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id) => {
    if (!confirm("Delete this dropshipping cost?")) return;
    try {
      const resp = await fetch(`${API}/api/admin/dropshipping-costs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Delete failed");
      loadItems();
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  };

  const total = items.reduce((sum, i) => sum + (Number(i.cost) || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#1F2937]">
          Dropshipping Cost
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Cost to bring a product from the dropshipping supplier to the store
          (courier, customs, handling, etc.). Add as many items as needed —
          edit or delete any of them anytime. Used in product Cost Per Item as
          Buying Price + Dropshipping Cost + Packaging Cost.
        </p>
      </div>

      <form
        onSubmit={saveItem}
        className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 md:grid-cols-[1fr_9rem_1fr_auto]"
      >
        <input
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          className={inp}
          placeholder="Item name (e.g. Local Courier)"
        />
        <input
          type="text"
          inputMode="decimal"
          value={form.cost}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9.]/g, "");
            setForm((p) => ({ ...p, cost: val }));
          }}
          className={inp}
          placeholder="Cost (৳)"
        />
        <input
          value={form.description}
          onChange={(e) =>
            setForm((p) => ({ ...p, description: e.target.value }))
          }
          className={inp}
          placeholder="Description (optional)"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#1D1D1F] px-4 py-2 text-sm font-medium text-white hover:bg-black transition-colors disabled:opacity-60"
          >
            {saving ? "Saving..." : editingId ? "Update" : "Add"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading...</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Cost</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.description || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      ৳{Number(item.cost).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(item._id);
                          setForm({
                            name: item.name || "",
                            cost: String(item.cost ?? ""),
                            description: item.description || "",
                          });
                        }}
                        className="mr-2 rounded-xl border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Edit
                      </button>
                      {user?.role === "admin" && (
                        <button
                          type="button"
                          onClick={() => deleteItem(item._id)}
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
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
                      colSpan={4}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No dropshipping cost items yet.
                    </td>
                  </tr>
                )}
              </tbody>
              {items.length > 0 && (
                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50">
                    <td colSpan={2} className="px-4 py-3 text-right font-medium text-gray-700">
                      Total
                    </td>
                    <td colSpan={2} className="px-4 py-3 font-semibold text-gray-900">
                      ৳{total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
