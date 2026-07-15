"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { getDisplayPrice } from "@/lib/pricing";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

// Admin editor for the homepage "Deal of the Day" section.
// Single product select — saved to Setting.dealOfDayProductId.
// If no product is selected, the homepage section is hidden.
export default function DealOfDayEditor() {
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const debounceRef = useRef(null);

  // load the currently selected deal product
  useEffect(() => {
    fetch(`${API}/api/deal-of-day`)
      .then((r) => r.json())
      .then((json) => setSelected(json.product || null))
      .catch(() =>
        setMessage({ type: "error", text: "Failed to load current deal" }),
      )
      .finally(() => setLoading(false));
  }, []);

  const search = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const r = await fetch(
        `${API}/api/products?q=${encodeURIComponent(q)}&suggest=1&limit=12&status=published`,
        { credentials: "include" },
      );
      const json = await r.json();
      setResults(json.items || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  };

  const save = async (product) => {
    setSaving(true);
    setMessage(null);
    try {
      const resp = await fetch(`${API}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          dealOfDayProductId: product ? product._id || product.id : null,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Save failed");
      setSelected(product);
      setQuery("");
      setResults([]);
      setMessage({
        type: "success",
        text: product
          ? "Saved! This product is now the Deal of the Day."
          : "Removed. The Deal of the Day section is now hidden on the homepage.",
      });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <div className="py-16 text-center text-gray-400">Loading…</div>;

  const selectedId = selected?._id || selected?.id;
  const priceInfo = selected ? getDisplayPrice(selected) : null;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1F2937]">Deal of the Day</h2>
        <p className="text-sm text-[#6B7280] mt-1">
          Pick the product shown in the homepage &quot;Deal of the Day&quot;
          section (after Why Choose Us). Only one product can be selected — if
          none is selected, the section is hidden.
        </p>
      </div>

      {/* Current selection */}
      {selected ? (
        <div className="flex items-center gap-4 p-4 border border-violet-200 bg-violet-50 rounded-xl">
          <Image
            src={selected.images?.[0]?.url || "/assets/placeholder.svg"}
            alt={selected.title}
            width={64}
            height={64}
            className="w-16 h-16 object-contain rounded-lg bg-white border"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#5B21B6] uppercase tracking-wide">
              Current Deal of the Day
            </p>
            <p className="font-semibold text-[#1F2937] truncate">
              {selected.title}
            </p>
            {priceInfo?.price ? (
              <p className="text-sm text-[#6B7280]">
                ৳{priceInfo.price}
                {priceInfo.compareAtPrice ? (
                  <span className="line-through ml-2 text-gray-400">
                    ৳{priceInfo.compareAtPrice}
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>
          <button
            onClick={() => save(null)}
            disabled={saving}
            className="px-3 py-1.5 text-sm border border-red-200 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50 transition shrink-0"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="p-4 border border-dashed border-gray-300 rounded-xl text-sm text-gray-400 text-center">
          No product selected — the homepage section is hidden.
        </div>
      )}

      {/* Search */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Search a product to set as Deal of the Day
        </label>
        <div className="relative">
          <input
            value={query}
            onChange={handleInput}
            placeholder="Search products by name…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 pr-8"
          />
          {searching && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <svg
                className="animate-spin w-4 h-4 text-[#5B21B6]"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="mt-1 border rounded-lg divide-y max-h-80 overflow-y-auto bg-white shadow-lg">
            {results.map((p) => {
              const id = p._id || p.id;
              const img = p.images?.[0]?.url || "/assets/placeholder.svg";
              const isCurrent = id === selectedId;
              const { price, compareAtPrice } = getDisplayPrice(p);
              const outOfStock =
                p.availability === "out_of_stock" || p.inventory === 0;
              const isBestSeller = (p.badges || []).includes("best_seller");
              return (
                <button
                  key={id}
                  onClick={() => !isCurrent && save(p)}
                  disabled={saving}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-violet-50 transition text-sm disabled:opacity-50 ${
                    isCurrent ? "bg-violet-50" : ""
                  }`}
                >
                  <Image
                    src={img}
                    alt={p.title}
                    width={44}
                    height={44}
                    className="w-11 h-11 object-contain rounded-lg border bg-white shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-[#1F2937]">
                      {p.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs">
                      {price ? (
                        <span className="font-semibold text-[#5B21B6]">
                          ৳{price}
                        </span>
                      ) : null}
                      {compareAtPrice ? (
                        <span className="line-through text-gray-400">
                          ৳{compareAtPrice}
                        </span>
                      ) : null}
                      {isBestSeller && (
                        <span className="px-1.5 py-0.5 rounded-lg bg-amber-50 text-amber-600 font-semibold">
                          ⭐ Best Seller
                        </span>
                      )}
                      <span
                        className={
                          outOfStock ? "text-red-500" : "text-green-600"
                        }
                      >
                        {outOfStock ? "Out of stock" : "In stock"}
                      </span>
                    </div>
                  </div>
                  {isCurrent ? (
                    <span className="text-[#5B21B6] font-bold text-xs shrink-0">
                      ✓ Selected
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 shrink-0">
                      Click to select
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {query && !searching && results.length === 0 && (
          <p className="text-xs text-gray-400 mt-1">No products found</p>
        )}
      </div>

      {message && (
        <p
          className={`text-sm font-medium ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      <p className="text-xs text-gray-400">
        Note: saving requires the main admin account (settings permission).
        Selection is saved instantly when you click a product.
      </p>
    </div>
  );
}
