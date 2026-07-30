"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/context/UserContext";

export default function CustomerEditor({ userId }) {
  const router = useRouter();
  const { user, refreshUser } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

  const [customer, setCustomer] = useState(null);
  const [tagOptions, setTagOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) refreshUser();
  }, [user, refreshUser]);

  useEffect(() => {
    fetch(`${API}/api/admin/customer-tags`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => setTagOptions(b.items || []))
      .catch(() => setTagOptions([]));
  }, [API]);

  useEffect(() => {
    if (!userId || userId === "new") return;
    setLoading(true);
    fetch(`${API}/api/admin/users/${userId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => {
        if (b.user) setCustomer(b.user);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [userId, API]);

  const handleSave = async () => {
    if (!customer) return;
    setSaving(true);
    try {
      const resp = await fetch(`${API}/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: customer.name,
          mobile: customer.mobile,
          isVerified: customer.isVerified,
          tags: (customer.tags || []).map((tag) => tag._id || tag),
        }),
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Save failed");
      router.push("/dashboard/customers");
    } catch (err) {
      alert(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!customer && loading)
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
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
        Loading…
      </div>
    );
  if (!customer)
    return (
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        No user selected
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold tracking-tight text-[#1F2937]">
          {userId === "new" ? "Create user" : "Edit customer"}
        </h2>
        <div>
          <button
            onClick={() => router.push("/dashboard/customers")}
            className="px-3 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm shrink-0 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            value={customer.email || ""}
            readOnly
            className="w-full border border-gray-200 px-3 py-2 rounded-xl text-sm bg-gray-50 outline-none transition focus:ring-2 focus:ring-[#1D1D1F] focus:border-[#1D1D1F]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Full name</label>
          <input
            value={customer.name || ""}
            onChange={(e) =>
              setCustomer((c) => ({ ...c, name: e.target.value }))
            }
            className="w-full border border-gray-200 px-3 py-2 rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-[#1D1D1F] focus:border-[#1D1D1F]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Mobile number</label>
          <input
            value={customer.mobile || ""}
            onChange={(e) =>
              setCustomer((c) => ({ ...c, mobile: e.target.value }))
            }
            className="w-full border border-gray-200 px-3 py-2 rounded-xl text-sm font-mono outline-none transition focus:ring-2 focus:ring-[#1D1D1F] focus:border-[#1D1D1F]"
            placeholder="e.g. 01700000000"
            inputMode="tel"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Provider</label>
            <input
              value={customer.provider || ""}
              readOnly
              className="w-full border border-gray-200 px-3 py-2 rounded-xl text-sm bg-gray-50 outline-none transition focus:ring-2 focus:ring-[#1D1D1F] focus:border-[#1D1D1F]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Created</label>
            <input
              value={new Date(customer.createdAt).toLocaleString()}
              readOnly
              className="w-full border border-gray-200 px-3 py-2 rounded-xl text-sm bg-gray-50 outline-none transition focus:ring-2 focus:ring-[#1D1D1F] focus:border-[#1D1D1F]"
            />
          </div>
        </div>

        <div>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!customer.isVerified}
              onChange={(e) =>
                setCustomer((c) => ({ ...c, isVerified: e.target.checked }))
              }
            />
            <span className="text-sm">Verified</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Customer Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {tagOptions.map((tag) => {
              const selected = (customer.tags || []).some(
                (item) => String(item._id || item) === String(tag._id),
              );
              return (
                <label
                  key={tag._id}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${selected ? "border-gray-300 bg-gray-50" : "border-gray-200 bg-white"}`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) =>
                      setCustomer((c) => ({
                        ...c,
                        tags: e.target.checked
                          ? [...(c.tags || []), tag]
                          : (c.tags || []).filter(
                              (item) =>
                                String(item._id || item) !== String(tag._id),
                            ),
                      }))
                    }
                  />
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: tag.color || "#3B82F6" }}
                  />
                  {tag.name}
                </label>
              );
            })}
            {!tagOptions.length && (
              <p className="text-sm text-gray-500">No tags created yet.</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-2 bg-[#1D1D1F] text-white hover:bg-black rounded-xl transition-colors disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => router.push("/dashboard/customers")}
            className="px-3 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
