"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import JsBarcode from "jsbarcode";
import {
  FaCopy,
  FaEdit,
  FaPlus,
  FaRegSave,
  FaRedo,
  FaSearch,
  FaPrint,
  FaTrash,
} from "react-icons/fa";
import { useUser } from "@/components/context/UserContext";
import RowActionsMenu from "@/components/dashboard/ui/RowActionsMenu";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

const EMPTY_FORM = {
  code: "",
  label: "",
  notes: "",
  productId: "",
  productTitle: "",
  isActive: true,
};

function BarcodeSvg({ code, className = "", height = 56 }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    if (!code) return;

    try {
      JsBarcode(ref.current, String(code), {
        format: "CODE128",
        width: 1.6,
        height,
        displayValue: true,
        fontSize: 12,
        margin: 0,
        background: "#ffffff",
        lineColor: "#111827",
      });
    } catch {
      ref.current.innerHTML = "";
    }
  }, [code, height]);

  return <svg ref={ref} className={className} />;
}

function makeBarcodeCode() {
  return `${Date.now()}${Math.floor(Math.random() * 900000 + 100000)}`.slice(
    0,
    12,
  );
}

export default function BarcodeManager() {
  const { user } = useUser();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [copiedCode, setCopiedCode] = useState("");

  const loadItems = useCallback(async (term = "") => {
    setLoading(true);
    setError("");
    try {
      const url = new URL(`${API}/api/admin/barcodes`);
      if (term.trim()) url.searchParams.set("code", term.trim());
      url.searchParams.set("limit", "100");
      const resp = await fetch(url.toString(), { credentials: "include" });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed to load barcodes");
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(err.message || "Failed to load barcodes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadItems(query), 300);
    return () => clearTimeout(timer);
  }, [query, loadItems]);

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      code: item.code || "",
      label: item.label || "",
      notes: item.notes || "",
      productId: item.product?._id || "",
      productTitle: item.product?.title || item.productTitle || "",
      isActive: item.isActive !== false,
    });
  };

  const handleGenerate = () => {
    setForm((prev) => ({ ...prev, code: makeBarcodeCode() }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        code: form.code.trim(),
        label: form.label.trim(),
        notes: form.notes.trim(),
        product: form.productId.trim() || null,
        productTitle: form.productTitle.trim(),
        isActive: !!form.isActive,
      };
      const resp = await fetch(
        editingId
          ? `${API}/api/admin/barcodes/${editingId}`
          : `${API}/api/admin/barcodes`,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Save failed");
      resetForm();
      await loadItems(query);
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete barcode ${item.code}?`)) return;
    setSaving(true);
    setError("");
    try {
      const resp = await fetch(`${API}/api/admin/barcodes/${item._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Delete failed");
      if (editingId === item._id) resetForm();
      await loadItems(query);
    } catch (err) {
      setError(err.message || "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    const total = items.length;
    const linked = items.filter((item) => item.product?._id).length;
    const active = items.filter((item) => item.isActive !== false).length;
    return { total, linked, active };
  }, [items]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Barcode Management
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#1F2937] work-sans">
              Manage Barcodes
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Create, edit, delete, and inspect barcode numbers from one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 font-medium text-gray-700">
              Total {stats.total}
            </span>
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 font-medium text-gray-700">
              Linked {stats.linked}
            </span>
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 font-medium text-gray-700">
              Active {stats.active}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <div className="flex min-w-[280px] flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <FaSearch className="text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                const code = query.trim().replace(/\s+/g, "");
                if (e.key === "Enter" && code) {
                  e.preventDefault();
                  router.push(
                    `/dashboard/barcodes/lookup?code=${encodeURIComponent(code)}`,
                  );
                }
              }}
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Search by barcode number, label, or product (Enter to open product)"
            />
          </div>
          <button
            type="button"
            onClick={() => loadItems(query)}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1D1D1F] px-4 py-2 text-sm font-semibold text-white hover:bg-black"
          >
            <FaPlus /> New Barcode
          </button>
          <Link
            href="/dashboard/barcodes/lookup"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-[#1D1D1F] hover:bg-gray-50"
          >
            <FaSearch /> Scan / Lookup
          </Link>
          <Link
            href="/dashboard/barcodes/print"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <FaPrint /> Print Labels
          </Link>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                {editingId ? "Edit Barcode" : "Create Barcode"}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-gray-900">
                {editingId ? "Update existing barcode" : "Add a new barcode"}
              </h2>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm font-medium text-gray-500 hover:text-gray-800"
              >
                Cancel
              </button>
            )}
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Barcode Number
              </label>
              <input
                value={form.code}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    code: e.target.value.replace(/\s+/g, ""),
                  }))
                }
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#1D1D1F]"
                placeholder="123456789012"
                inputMode="numeric"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-1.5 text-xs font-semibold text-[#1D1D1F] hover:bg-gray-50"
                >
                  <FaRedo /> Generate
                </button>
                <Link
                  href="/dashboard/products/new"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Open Product Form
                </Link>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Label
              </label>
              <input
                value={form.label}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, label: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#1D1D1F]"
                placeholder="Product label"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Product Title
              </label>
              <input
                value={form.productTitle}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, productTitle: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#1D1D1F]"
                placeholder="Optional display title"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Linked Product ID
              </label>
              <input
                value={form.productId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, productId: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#1D1D1F]"
                placeholder="MongoDB ObjectId"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="h-24 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#1D1D1F]"
                placeholder="Optional note"
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                }
                className="h-4 w-4"
              />
              Active barcode
            </label>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Preview
              </p>
              <BarcodeSvg code={form.code} className="w-full overflow-hidden" />
            </div>

            {error && (
              <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-[#1D1D1F]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || !form.code.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D1D1F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaRegSave />{" "}
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Barcode"
                  : "Save Barcode"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Barcode List
              </p>
              <h2 className="mt-1 text-lg font-semibold text-gray-900">
                {loading ? "Loading..." : `${items.length} barcode(s)`}
              </h2>
            </div>
            {copiedCode && (
              <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                Copied {copiedCode}
              </span>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="flex items-center gap-2 text-sm text-gray-500">
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
                Loading barcodes...
              </p>
            ) : items.length === 0 ? (
              <p className="text-sm text-gray-500">No barcodes found.</p>
            ) : (
              items.map((item) => {
                const linkedProduct = item.product;
                const isLinked = Boolean(
                  linkedProduct?._id || linkedProduct?.id,
                );
                return (
                  <div
                    key={item._id}
                    className="rounded-2xl border border-gray-200 p-4"
                  >
                    <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                        <BarcodeSvg
                          code={item.code}
                          className="w-full overflow-hidden"
                          height={52}
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-semibold text-gray-900">
                              {item.code}
                            </p>
                            <p className="text-sm text-gray-600">
                              {item.label || "No label"}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <FaEdit className="h-3.5 w-3.5" /> Edit
                            </button>
                            <RowActionsMenu
                              items={[
                                {
                                  label: "Copy code",
                                  icon: <FaCopy className="h-3.5 w-3.5" />,
                                  onClick: () => {
                                    navigator.clipboard?.writeText(item.code);
                                    setCopiedCode(item.code);
                                    window.setTimeout(
                                      () => setCopiedCode(""),
                                      1200,
                                    );
                                  },
                                },
                                ...(user?.role === "admin"
                                  ? [
                                      { divider: true },
                                      {
                                        label: "Delete",
                                        icon: (
                                          <FaTrash className="h-3.5 w-3.5" />
                                        ),
                                        onClick: () => handleDelete(item),
                                        danger: true,
                                      },
                                    ]
                                  : []),
                              ]}
                            />
                          </div>
                        </div>

                        <div className="grid gap-2 text-sm text-gray-600 md:grid-cols-2">
                          <p>
                            Status:{" "}
                            <span
                              className={`font-semibold ${
                                item.isActive !== false
                                  ? "text-green-700"
                                  : "text-gray-500"
                              }`}
                            >
                              {item.isActive !== false ? "Active" : "Disabled"}
                            </span>
                          </p>
                          <p>
                            Level:{" "}
                            <span className="font-medium text-gray-700">
                              {isLinked
                                ? linkedProduct?.title ||
                                  item.productTitle ||
                                  "Linked"
                                : "No level"}
                            </span>
                          </p>
                          <p>
                            Notes:{" "}
                            <span className="font-medium text-gray-700">
                              {item.notes || "None"}
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 font-medium text-gray-700">
                            {isLinked
                              ? linkedProduct?.title || item.productTitle
                              : "Unlinked"}
                          </span>
                          {isLinked && (
                            <>
                              <Link
                                href={`/dashboard/products/${linkedProduct._id}`}
                                className="text-[#1D1D1F] hover:underline"
                              >
                                Open product
                              </Link>
                              <Link
                                href={`/dashboard/barcodes/lookup?code=${encodeURIComponent(item.code)}`}
                                className="text-[#1D1D1F] hover:underline"
                              >
                                Lookup
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
