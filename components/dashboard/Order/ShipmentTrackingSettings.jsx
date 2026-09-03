"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/components/context/UserContext";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

const INTEGRATION_SLUGS = ["pathao", "steadfast", "redx"];

const CREDENTIAL_FIELDS = {
  pathao: [
    {
      key: "clientId",
      label: "Client ID",
      type: "text",
      secret: true,
      placeholder: "Pathao API access → Client ID",
    },
    {
      key: "clientSecret",
      label: "Client Secret",
      type: "password",
      secret: true,
      placeholder: "Pathao API access → Client Secret",
    },
    {
      key: "username",
      label: "Merchant username (login email)",
      type: "text",
      secret: true,
      placeholder: "merchant.pathao.com login email (not phone)",
    },
    {
      key: "password",
      label: "Merchant password",
      type: "password",
      secret: true,
      placeholder: "merchant panel login password",
    },
  ],
  steadfast: [
    {
      key: "apiKey",
      label: "API Key",
      type: "password",
      secret: true,
      placeholder: "Dashboard → API → Api-Key",
    },
    {
      key: "secretKey",
      label: "Secret Key",
      type: "password",
      secret: true,
      placeholder: "Dashboard → API → Secret-Key",
    },
    {
      key: "email",
      label: "Login email",
      type: "email",
      placeholder: "steadfast.com.bd login email",
    },
    {
      key: "password",
      label: "Login password",
      type: "password",
      secret: true,
      placeholder: "steadfast.com.bd login password",
    },
  ],
  redx: [
    {
      key: "phone",
      label: "Merchant phone (01XXXXXXXXX)",
      type: "text",
      placeholder: "01XXXXXXXXX (app/web login phone)",
    },
    {
      key: "password",
      label: "Merchant password",
      type: "password",
      secret: true,
      placeholder: "redx.com.bd login password",
    },
  ],
};

/** Where to find them — shown on the settings page */
const COURIER_HELP = {
  pathao: {
    summary: "Pathao merchant panel + API access",
    steps: [
      "Log in at merchant.pathao.com",
      "Apply for API access (Developer/API section)",
      "Get your Client ID, Client Secret, Username and Password",
      "Store ID: Merchant panel → Stores → your shop's ID",
    ],
    storeId: "The ID appears in the shop list under the Stores menu",
  },
  steadfast: {
    summary: "Steadfast merchant panel",
    steps: [
      "Open a merchant account at steadfast.com.bd and make sure the account is active/approved",
      "Parcel book: Dashboard → API → copy the Api-Key and Secret-Key",
      "If the test connection balance check passes but booking fails — contact Steadfast support to activate the account (09678-045045)",
      "Customer lifetime check: use the same email/password you log in to steadfast.com.bd with",
    ],
  },
  redx: {
    summary: "RedX merchant panel",
    steps: [
      "Log in to the redx.com.bd merchant panel",
      "Use the same phone and password you log in to the app/web with",
      "You can set the delivery area in the order modal while booking a parcel — not needed in settings",
    ],
  },
};

function CourierManager({ couriers, onChange }) {
  const { user } = useUser();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "" });
  const [saving, setSaving] = useState(false);

  const createCourier = async () => {
    if (!name.trim()) return alert("Courier name is required.");
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/admin/couriers`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
        }),
      });
      const data = await r.json();
      if (r.ok) {
        setName("");
        setSlug("");
        onChange();
      } else {
        alert(data.error || "Could not create courier.");
      }
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (id) => {
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/admin/couriers/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editForm.name }),
      });
      if (r.ok) {
        setEditingId(null);
        onChange();
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteCourier = async (id) => {
    if (!confirm("Delete this courier?")) return;
    const r = await fetch(`${API}/api/admin/couriers/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (r.ok) onChange();
  };

  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Courier Names</h2>
      <p className="text-xs text-gray-500">
        Names shown in order forms. To connect API Key/Secret, use the
        &quot;Merchant API connections&quot; section above.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Courier name (e.g. Pathao)"
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-48 outline-none transition focus:ring-2 focus:ring-[#1D1D1F] focus:border-[#1D1D1F]"
        />
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Slug (optional)"
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 w-36 outline-none transition focus:ring-2 focus:ring-[#1D1D1F] focus:border-[#1D1D1F]"
        />
        <button
          type="button"
          onClick={createCourier}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium rounded-xl bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-60 transition-colors"
        >
          Add courier
        </button>
      </div>
      <ul className="divide-y divide-gray-100 border rounded-lg">
        {couriers.map((c) => (
          <li
            key={c._id}
            className="px-3 py-2.5 flex flex-wrap items-center gap-2 text-sm"
          >
            {editingId === c._id ? (
              <>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ name: e.target.value })}
                  className="border border-gray-200 rounded-xl px-2 py-1 flex-1 min-w-32 outline-none transition focus:ring-2 focus:ring-[#1D1D1F] focus:border-[#1D1D1F]"
                />
                <button
                  type="button"
                  onClick={() => saveEdit(c._id)}
                  className="text-xs text-green-700 font-medium"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-xs text-gray-500"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="font-medium text-gray-800">{c.name}</span>
                <span className="text-xs text-gray-400">({c.slug})</span>
                {c.apiEnabled && (
                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-lg">
                    API on
                  </span>
                )}
                {c.isSystem && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-lg">
                    built-in
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(c._id);
                    setEditForm({ name: c.name });
                  }}
                  className="text-xs text-gray-700 hover:text-[#1D1D1F] ml-auto"
                >
                  Edit
                </button>
                {user?.role === "admin" && (
                  <button
                    type="button"
                    onClick={() => deleteCourier(c._id)}
                    className="text-xs text-red-600"
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function CourierIntegrationCard({ courier, onSaved }) {
  const [expanded, setExpanded] = useState(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [credForm, setCredForm] = useState({});
  const [loadedMasked, setLoadedMasked] = useState({});
  const [storeForm, setStoreForm] = useState({});
  const [apiEnabled, setApiEnabled] = useState(false);
  const [showFields, setShowFields] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(
        `${API}/api/admin/couriers/${courier._id}/integration`,
        {
          credentials: "include",
        },
      );
      const body = await r.json();
      if (r.ok) {
        setData(body);
        setApiEnabled(Boolean(body.courier?.apiEnabled));
        setStoreForm(body.courier?.storeConfig || {});
        const masked = body.credentials || {};
        const fields = CREDENTIAL_FIELDS[courier.slug] || [];
        const initialForm = {};
        for (const f of fields) {
          const hasKey = `has${f.key.charAt(0).toUpperCase()}${f.key.slice(1)}`;
          if (masked[hasKey] && masked[f.key]) {
            initialForm[f.key] = masked[f.key];
          }
        }
        setCredForm(initialForm);
        setLoadedMasked(initialForm);
      }
    } finally {
      setLoading(false);
    }
  }, [courier._id, courier.slug]);

  useEffect(() => {
    load();
  }, [load]);

  const fields = CREDENTIAL_FIELDS[courier.slug] || [];
  const help = COURIER_HELP[courier.slug];

  const save = async () => {
    setSaving(true);
    try {
      const changedCreds = {};
      for (const [key, val] of Object.entries(credForm)) {
        if (
          val !== undefined &&
          val !== null &&
          val !== "" &&
          val !== loadedMasked[key]
        ) {
          changedCreds[key] = val;
        }
      }
      const r = await fetch(
        `${API}/api/admin/couriers/${courier._id}/integration`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiEnabled,
            credentials: changedCreds,
            storeConfig: storeForm,
          }),
        },
      );
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || "Save failed");
      await load();
      onSaved?.();
      alert("Integration saved");
    } catch (err) {
      alert(err.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const r = await fetch(
        `${API}/api/admin/couriers/${courier._id}/test-connection`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || "Test failed");
      alert(body.message || "Connected successfully");
      await load();
    } catch (err) {
      alert(err.message || "Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  const status = data?.courier?.integrationStatus;
  const masked = data?.credentials || {};

  return (
    <div className="border rounded-xl bg-gray-50/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 p-4 hover:bg-gray-100/50 text-left transition"
      >
        <div className="flex items-center gap-3">
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-gray-500 ${expanded ? "bg-gray-100 text-gray-800" : "bg-gray-200"}`}
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-90" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </span>
          <div>
            <h3 className="font-semibold text-gray-900">{courier.name}</h3>
            <p className="text-xs text-gray-500">
              {data?.configured ? (
                <span className="text-green-700 font-medium">Configured</span>
              ) : (
                <span className="text-amber-700">Not configured</span>
              )}
              {data?.credentialSource && data.credentialSource !== "none" && (
                <span className="ml-2">· source: {data.credentialSource}</span>
              )}
            </p>
          </div>
        </div>
        <span className="text-xs text-gray-400 shrink-0">
          {expanded ? "Collapse" : "Expand to configure"}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-200/80">
          <div className="flex justify-end pt-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={apiEnabled}
                onChange={(e) => setApiEnabled(e.target.checked)}
              />
              API enabled
            </label>
          </div>

          {loading ? (
            <p className="text-xs text-gray-400">Loading…</p>
          ) : (
            <>
              {help ? (
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-900 space-y-1">
                  <p className="font-semibold">{help.summary}</p>
                  <ul className="list-disc list-inside space-y-0.5 opacity-90">
                    {help.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="grid sm:grid-cols-2 gap-3">
                {fields.map((f) => {
                  const hasKey = `has${f.key.charAt(0).toUpperCase()}${f.key.slice(1)}`;
                  const isSaved = Boolean(masked[hasKey]);
                  const isUnchanged =
                    isSaved && credForm[f.key] === loadedMasked[f.key];
                  const isPassword = f.type === "password";
                  const isVisible = Boolean(showFields[f.key]);
                  return (
                    <div key={f.key}>
                      <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                        {f.label}
                        {isSaved && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-lg font-medium">
                            saved
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type={
                            isPassword && !isVisible
                              ? "password"
                              : isPassword
                                ? "text"
                                : f.type
                          }
                          value={credForm[f.key] ?? ""}
                          onChange={(e) =>
                            setCredForm((p) => ({
                              ...p,
                              [f.key]: e.target.value,
                            }))
                          }
                          placeholder={
                            isUnchanged ? "Clear to update" : f.placeholder || ""
                          }
                          className={`w-full text-sm border rounded-xl px-3 py-2 bg-white outline-none transition focus:ring-2 focus:ring-[#1D1D1F] focus:border-[#1D1D1F] ${isPassword ? "pr-9" : ""} ${isUnchanged ? "border-green-200" : "border-gray-200"}`}
                        />
                        {isPassword && (
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() =>
                              setShowFields((p) => ({
                                ...p,
                                [f.key]: !p[f.key],
                              }))
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {isVisible ? (
                              <svg
                                className="w-4 h-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </svg>
                            ) : (
                              <svg
                                className="w-4 h-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {courier.slug === "pathao" && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Store ID{" "}
                    <span className="text-gray-400">(for parcel booking)</span>
                  </label>
                  <input
                    type="number"
                    value={storeForm.pathaoStoreId ?? credForm.storeId ?? ""}
                    onChange={(e) =>
                      setStoreForm((p) => ({
                        ...p,
                        pathaoStoreId: e.target.value
                          ? Number(e.target.value)
                          : null,
                      }))
                    }
                    placeholder={help?.storeId || "Merchant panel → Stores"}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white max-w-xs outline-none transition focus:ring-2 focus:ring-[#1D1D1F] focus:border-[#1D1D1F]"
                  />
                </div>
              )}

              {courier.slug === "steadfast" && (
                <p className="text-[11px] text-gray-500">
                  The API Key + Secret Key handle both parcel booking and the
                  customer courier score. Login email/password is only a backup
                  (if the API fraud check fails).
                </p>
              )}

              {status?.lastTestedAt && (
                <p
                  className={`text-xs ${status.lastTestOk ? "text-green-700" : "text-red-600"}`}
                >
                  Last test: {new Date(status.lastTestedAt).toLocaleString()} —{" "}
                  {status.lastTestMessage}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="px-3 py-1.5 text-sm font-medium rounded-xl bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-60 transition-colors"
                >
                  {saving ? "Saving…" : "Save credentials"}
                </button>
                <button
                  type="button"
                  onClick={testConnection}
                  disabled={testing}
                  className="px-3 py-1.5 text-sm font-medium rounded-xl border border-gray-300 text-gray-800 hover:bg-gray-50 disabled:opacity-60 transition-colors"
                >
                  {testing ? "Testing…" : "Test connection"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ShopShipmentConfig({ onSaved }) {
  const [form, setForm] = useState({
    pickupAddress: "",
    defaultCourierSlug: "pathao",
    bookSetsStatus: "shipped",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/admin/shipment-config`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.shipmentConfig)
          setForm((p) => ({ ...p, ...data.shipmentConfig }));
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/admin/shipment-config`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipmentConfig: form }),
      });
      if (!r.ok) throw new Error("Save failed");
      onSaved?.();
      alert("Shop shipment settings saved");
    } catch (err) {
      alert(err.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
      <h2 className="text-base font-semibold text-gray-800">
        Shop pickup & defaults
      </h2>
      <p className="text-xs text-gray-500">
        Pickup address is where riders collect parcels. Order status after API
        booking is configurable.
      </p>
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Pickup address (your shop)
        </label>
        <textarea
          value={form.pickupAddress}
          onChange={(e) =>
            setForm((p) => ({ ...p, pickupAddress: e.target.value }))
          }
          rows={2}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
          placeholder="House, road, area — where courier rider picks up"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Default courier
          </label>
          <select
            value={form.defaultCourierSlug}
            onChange={(e) =>
              setForm((p) => ({ ...p, defaultCourierSlug: e.target.value }))
            }
            className="w-full text-sm border rounded-lg px-3 py-2"
          >
            <option value="pathao">Pathao</option>
            <option value="steadfast">Steadfast</option>
            <option value="redx">RedX</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Status after book
          </label>
          <select
            value={form.bookSetsStatus}
            onChange={(e) =>
              setForm((p) => ({ ...p, bookSetsStatus: e.target.value }))
            }
            className="w-full text-sm border rounded-lg px-3 py-2"
          >
            <option value="shipped">Shipped</option>
            <option value="processing">Processing</option>
            <option value="confirmed">Confirmed</option>
          </select>
        </div>
      </div>
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save shop settings"}
      </button>
    </section>
  );
}

export default function ShipmentTrackingSettings() {
  const { user } = useUser();
  const [couriers, setCouriers] = useState([]);

  const loadMeta = useCallback(async () => {
    const courierRes = await fetch(`${API}/api/admin/couriers`, {
      credentials: "include",
    });
    const courierData = courierRes.ok ? await courierRes.json() : { items: [] };
    setCouriers(courierData.items || []);
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const integrationCouriers = couriers.filter((c) =>
    INTEGRATION_SLUGS.includes(c.slug),
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/shipment-tracking"
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          ← Back to tracking orders
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-[#1F2937] work-sans mt-2">
          Courier Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Connect merchant accounts and manage courier names. Tracking updates
          come automatically from live tracking URLs.
        </p>
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-800">
          Merchant API connections (Courier Connect)
        </h2>
        <p className="text-xs text-gray-500">
          Pathao, Steadfast, RedX — enter the API Key/Secret or merchant login
          here. Credentials are stored encrypted. Save credentials → Test
          connection. The lifetime delivery history on the customer profile also
          works from here.
        </p>
        <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-900 space-y-1">
          <p className="font-semibold">
            Steadfast live tracking webhook (recommended)
          </p>
          <p>Steadfast merchant panel → Webhook → Callback URL:</p>
          <code className="block bg-white/80 px-2 py-1 rounded-lg border text-[11px] break-all">
            {typeof window !== "undefined"
              ? `${process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com"}/api/orders/webhooks/steadfast`
              : "/api/orders/webhooks/steadfast"}
          </code>
          <p>
            Bearer token: set{" "}
            <code>STEADFAST_WEBHOOK_BEARER</code> in the backend <code>.env</code>.
            Saving the Tracking URL also enables auto sync.
          </p>
        </div>
        {integrationCouriers.length === 0 ? (
          <p className="text-sm text-gray-400">Loading built-in couriers…</p>
        ) : (
          <div className="space-y-4">
            {integrationCouriers.map((c) => (
              <CourierIntegrationCard
                key={c._id}
                courier={c}
                onSaved={loadMeta}
              />
            ))}
          </div>
        )}
      </section>

      <ShopShipmentConfig onSaved={loadMeta} />
      <CourierManager couriers={couriers} onChange={loadMeta} />
    </div>
  );
}
