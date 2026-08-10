"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@/components/context/UserContext";
import RowActionsMenu from "@/components/dashboard/ui/RowActionsMenu";
import { FaEdit, FaTrash } from "react-icons/fa";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

const RISK_BADGE = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

function RiskBadge({ summary }) {
  if (!summary) return <span className="text-gray-400 text-xs">—</span>;
  const level = summary.riskLevel || "low";
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${RISK_BADGE[level]}`}
      title={`Risk score: ${summary.riskScore}/100`}
    >
      {summary.riskScore}
      <span className="opacity-70 capitalize">({level})</span>
    </span>
  );
}

function NewsletterBadge({ subscribed }) {
  return subscribed ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
      Subscribed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border bg-gray-50 text-gray-500 border-gray-200">
      Not subscribed
    </span>
  );
}

const SORT_ACCESSORS = {
  name: (u) => (u.name || "").toLowerCase(),
  mobile: (u) => u.mobile || "",
  orders: (u) => u.orderSummary?.totalOrders ?? 0,
  delivered: (u) => u.orderSummary?.delivered ?? 0,
  cancelled: (u) => u.orderSummary?.cancelled ?? 0,
  returned: (u) => u.orderSummary?.returned ?? 0,
  success: (u) => u.orderSummary?.deliverySuccessRate ?? 0,
  risk: (u) => u.orderSummary?.riskScore ?? 0,
  newsletter: (u) => (u.newsletterSubscribed ? 1 : 0),
  createdAt: (u) => (u.createdAt ? new Date(u.createdAt).getTime() : 0),
};

const SORT_COLUMNS = [
  { key: "name", label: "Customer" },
  { key: "mobile", label: "Mobile" },
  { key: "orders", label: "Orders" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "returned", label: "Returned" },
  { key: "success", label: "Success" },
  { key: "risk", label: "Risk" },
  { key: "newsletter", label: "Newsletter" },
];

function SortIcon({ active, dir }) {
  return (
    <span className={`ml-1 inline-block text-[10px] ${active ? "text-[#1D1D1F]" : "text-gray-300"}`}>
      {active && dir === "desc" ? "▼" : "▲"}
    </span>
  );
}

export default function CustomersList() {
  const { user, refreshUser } = useUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    if (!user) refreshUser();
  }, [user, refreshUser]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query || "",
        includeStats: "1",
      });
      const resp = await fetch(`${API}/api/admin/users?${params}`, {
        credentials: "include",
      });
      const body = await resp.json();
      if (resp.ok) setItems(body.items || []);
      else throw new Error(body.error || "Failed to load");
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedItems = useMemo(() => {
    const accessor = SORT_ACCESSORS[sortKey] || SORT_ACCESSORS.createdAt;
    const sorted = [...items].sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (av < bv) return -1;
      if (av > bv) return 1;
      return 0;
    });
    if (sortDir === "desc") sorted.reverse();
    return sorted;
  }, [items, sortKey, sortDir]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this user account?")) return;
    try {
      const resp = await fetch(`${API}/api/admin/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Delete failed");
      fetchUsers();
    } catch (err) {
      alert(err.message || "Failed");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#1F2937] work-sans">Customers</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Search by name, email, or mobile. List shows AppleBD stats — open
              profile for lifetime courier fraud check (Pathao/Steadfast/RedX).
            </p>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, mobile…"
            className="border border-gray-200 px-3 py-2 rounded-xl text-sm w-full sm:w-72 outline-none transition focus:ring-2 focus:ring-[#1D1D1F] focus:border-[#1D1D1F]"
          />
        </div>

        {loading ? (
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
            Loading customers…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/60 text-xs font-semibold uppercase tracking-wider text-[#1D1D1F]">
                <tr>
                  {SORT_COLUMNS.map((col) => (
                    <th key={col.key} className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className="inline-flex items-center hover:text-[#1D1D1F] focus:outline-none"
                      >
                        {col.label}
                        <SortIcon active={sortKey === col.key} dir={sortDir} />
                      </button>
                    </th>
                  ))}
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedItems.map((u) => {
                  const s = u.orderSummary;
                  return (
                    <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3">
                        <p className="font-medium text-gray-800">
                          {u.name || "—"}
                        </p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </td>
                      <td className="px-3 py-3 font-mono text-gray-700">
                        {u.mobile || "—"}
                      </td>
                      <td className="px-3 py-3 font-semibold">
                        {s?.totalOrders ?? 0}
                      </td>
                      <td className="px-3 py-3 text-green-700">
                        {s?.delivered ?? 0}
                      </td>
                      <td className="px-3 py-3 text-gray-600">
                        {s?.cancelled ?? 0}
                      </td>
                      <td className="px-3 py-3 text-orange-600">
                        {s?.returned ?? 0}
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {s?.deliverySuccessRate ?? 0}%
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <RiskBadge summary={s} />
                      </td>
                      <td className="px-3 py-3">
                        <NewsletterBadge subscribed={!!u.newsletterSubscribed} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/dashboard/customers/${u._id}/profile`}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-medium border border-gray-200 text-[#1D1D1F] hover:bg-gray-50 transition-colors"
                          >
                            Profile
                          </Link>
                          <RowActionsMenu
                            items={[
                              {
                                label: "Edit",
                                icon: <FaEdit className="h-3.5 w-3.5" />,
                                href: `/dashboard/customers/${u._id}`,
                              },
                              ...(user?.role === "admin"
                                ? [
                                    { divider: true },
                                    {
                                      label: "Delete",
                                      icon: <FaTrash className="h-3.5 w-3.5" />,
                                      onClick: () => handleDelete(u._id),
                                      danger: true,
                                    },
                                  ]
                                : []),
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {sortedItems.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-10 text-gray-400">
                      No customers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
