"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/components/context/UserContext";

export default function AddressManager() {
  const { user, refreshUser } = useUser();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    zone: "",
    address: "",
    type: "Home",
  });

  const [locationData, setLocationData] = useState({});
  const [cities, setCities] = useState([]);
  const [zones, setZones] = useState([]);
  const [orderAddresses, setOrderAddresses] = useState([]);
  const [savingOrderAddr, setSavingOrderAddr] = useState(null);

  const API = process.env.NEXT_PUBLIC_API_URL || "";

  const addressKey = (a) =>
    [a.fullName ?? a.name, a.phone, a.email, a.city, a.zone, a.address]
      .map((v) =>
        String(v || "")
          .trim()
          .toLowerCase(),
      )
      .join("|");

  const loadAddresses = async () => {
    try {
      const res = await fetch(`${API}/api/user/addresses`, {
        credentials: "include",
      });
      const json = await res.json();
      setAddresses(json.addresses || []);
    } catch (err) {
      console.error("failed to load addresses", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // run once on mount - do not refer to outer helpers so lint is happy
    const init = async () => {
      const base = process.env.NEXT_PUBLIC_API_URL || "";
      let savedAddresses = [];
      try {
        const res = await fetch(`${base}/api/user/addresses`, {
          credentials: "include",
        });
        const json = await res.json();
        savedAddresses = json.addresses || [];
        setAddresses(savedAddresses);
      } catch (err) {
        console.error("failed to load addresses", err);
      }

      try {
        const resp = await fetch("/api/locations");
        const json = await resp.json();
        setLocationData(json.locationData || {});
        const cityList = json.locationData
          ? Object.keys(json.locationData)
          : [];
        setCities(cityList);
      } catch (err) {
        console.error("Failed to load location data", err);
      }

      // Surface addresses used on past orders that aren't saved yet, so the
      // user can find/re-save an address they checked out with previously.
      try {
        const resp = await fetch(`${base}/api/orders/my`, {
          credentials: "include",
        });
        const json = await resp.json();
        const seen = new Set(savedAddresses.map(addressKey));
        const fromOrders = [];
        (json.orders || []).forEach((order) => {
          const billing = order.billingDetails || {};
          if (!billing.address || !billing.city) return;
          const fullAddress = [billing.address, billing.area]
            .filter(Boolean)
            .join(", ");
          const candidate = {
            fullName: billing.name || "",
            email: billing.email || "",
            phone: billing.phone || "",
            city: billing.city || "",
            zone: billing.zone || "",
            address: fullAddress,
            type: "Home",
          };
          const key = addressKey(candidate);
          if (seen.has(key)) return;
          seen.add(key);
          fromOrders.push(candidate);
        });
        setOrderAddresses(fromOrders.slice(0, 6));
      } catch (err) {
        console.error("Failed to load addresses from previous orders", err);
      }

      setLoading(false);
    };
    init();
  }, []);

  const saveOrderAddress = async (addr, idx) => {
    setSavingOrderAddr(idx);
    try {
      const res = await fetch(`${API}/api/user/addresses`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addr),
      });
      const json = await res.json();
      if (json.ok) {
        setOrderAddresses((prev) => prev.filter((_, i) => i !== idx));
        loadAddresses();
      } else {
        alert(json.error || "Failed to save address");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save address");
    } finally {
      setSavingOrderAddr(null);
    }
  };

  useEffect(() => {
    if (formData.city && locationData[formData.city]) {
      const availableZones = Object.keys(
        locationData[formData.city].zones || {},
      );
      setZones(availableZones);
      setFormData((prev) => ({ ...prev, zone: "" }));
    }
  }, [formData.city, locationData]);

  const openForm = (addr) => {
    if (addr) {
      setEditingId(addr._id);
      setFormData({
        fullName: addr.fullName || "",
        email: addr.email || "",
        phone: addr.phone || "",
        city: addr.city || "",
        zone: addr.zone || "",
        address: addr.address || "",
        type: addr.type || "Home",
      });
    } else {
      setEditingId(null);
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        city: "",
        zone: "",
        address: "",
        type: "Home",
      });
    }
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId
        ? `${API}/api/user/addresses/${editingId}`
        : `${API}/api/user/addresses`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.ok) {
        loadAddresses();
        setFormOpen(false);
        refreshUser();
      } else {
        alert(json.error || "Failed to save address");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save address");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this address?")) return;
    try {
      const res = await fetch(`${API}/api/user/addresses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (json.ok) {
        loadAddresses();
        refreshUser();
      } else {
        alert(json.error || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  };

  const inputClass =
    "w-full border border-gray-200 px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#1F2937]">
            My Addresses
          </h2>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Manage delivery addresses used at checkout.
          </p>
        </div>
        <button
          onClick={() => openForm(null)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#5B21B6] text-white rounded-full font-medium hover:bg-violet-700 transition"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Address
        </button>
      </div>

      {/* inline form */}
      {formOpen && (
        <div className="bg-violet-50/60 border border-violet-100 p-4 md:p-6 rounded-2xl w-full mb-6">
          <h3 className="text-lg font-bold text-[#1F2937] mb-5">
            {editingId ? "Edit Address" : "Add New Address"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#6B7280] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  placeholder="John Doe"
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[#6B7280] mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  placeholder="you@example.com"
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[#6B7280] mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  placeholder="017XXXXXXXX"
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[#6B7280] mb-1.5">
                  City
                </label>
                <select
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className={inputClass}
                  required
                >
                  <option value="">Select city</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#6B7280] mb-1.5">
                  Zone
                </label>
                <select
                  value={formData.zone}
                  onChange={(e) =>
                    setFormData({ ...formData, zone: e.target.value })
                  }
                  className={inputClass}
                  required
                >
                  <option value="">Select zone</option>
                  {zones.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#6B7280] mb-1.5">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                placeholder="Street, house #, area"
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className={inputClass}
                required
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {["Home", "Office"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: opt })}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                    formData.type === opt
                      ? "bg-[#5B21B6] text-white border-[#5B21B6]"
                      : "border-gray-200 text-gray-600 hover:border-violet-300"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 border border-gray-200 rounded-full text-sm font-medium hover:bg-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-[#5B21B6] text-white rounded-full text-sm font-semibold hover:bg-violet-700 transition"
              >
                Save Address
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-10">
          <svg
            className="animate-spin w-7 h-7 text-[#5B21B6]"
            viewBox="0 0 24 24"
            fill="none"
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
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        </div>
      )}

      {!loading && orderAddresses.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-semibold text-[#1F2937] mb-2">
            Addresses from your previous orders
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {orderAddresses.map((addr, idx) => (
              <div
                key={idx}
                className="p-3.5 border border-dashed border-violet-200 rounded-xl bg-violet-50/40"
              >
                <p className="font-semibold text-sm text-[#1F2937]">
                  {addr.fullName || "Unnamed"}
                </p>
                <p className="text-sm text-[#6B7280]">{addr.phone}</p>
                <p className="text-sm text-[#6B7280]">
                  {addr.address}, {addr.zone}, {addr.city}
                </p>
                <button
                  onClick={() => saveOrderAddress(addr, idx)}
                  disabled={savingOrderAddr === idx}
                  className="mt-2 text-sm font-medium text-[#5B21B6] hover:underline disabled:opacity-50"
                >
                  {savingOrderAddr === idx
                    ? "Saving..."
                    : "Save to my addresses"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && addresses.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-violet-200"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <p className="font-medium">No addresses saved yet.</p>
        </div>
      )}
      {!loading && addresses.length > 0 && (
        <>
          <p className="text-sm text-[#6B7280] mb-3">
            Total addresses: {addresses.length}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {addresses.map((addr) => (
              <div
                key={addr._id}
                className="p-4 border border-gray-100 rounded-xl bg-white hover:border-violet-200 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-[#1F2937] truncate">
                        {addr.fullName}
                      </p>
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-violet-50 text-[#5B21B6]">
                        {addr.type}
                      </span>
                    </div>
                    <p className="text-sm text-[#6B7280]">{addr.phone}</p>
                    <p className="text-sm text-[#6B7280]">{addr.email}</p>
                    <p className="text-sm text-[#6B7280] mt-1">
                      {addr.address}, {addr.zone}, {addr.city}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => openForm(addr)}
                    className="text-sm font-medium text-[#5B21B6] hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(addr._id)}
                    className="text-sm font-medium text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
