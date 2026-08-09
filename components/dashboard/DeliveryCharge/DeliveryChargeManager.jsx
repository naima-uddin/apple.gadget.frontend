"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

const INPUT =
  "w-full border border-gray-200 px-3 py-2 rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-[#1D1D1F] focus:border-[#1D1D1F]";

function Section({ title, desc, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function DeliveryChargeManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dhakaZones, setDhakaZones] = useState([]); // [{ zone, areas: [] }]
  const [insideDhaka, setInsideDhaka] = useState(70);
  const [outsideDhaka, setOutsideDhaka] = useState(130);
  // zoneCharges[zoneName] = "" | number-as-string
  const [zoneCharges, setZoneCharges] = useState({});
  // areaCharges[zoneName][areaName] = "" | number-as-string
  const [areaCharges, setAreaCharges] = useState({});
  const [expandedZones, setExpandedZones] = useState({});

  useEffect(() => {
    Promise.all([
      fetch("/api/locations-dhaka").then((r) => r.json()),
      fetch(`${API}/api/admin/settings`, { credentials: "include" }).then((r) =>
        r.json(),
      ),
    ])
      .then(([locJson, settingsJson]) => {
        setDhakaZones(locJson.zones || []);

        const dc = settingsJson.settings?.deliveryCharge || {};
        setInsideDhaka(dc.insideDhaka ?? 70);
        setOutsideDhaka(dc.outsideDhaka ?? 130);

        const zc = {};
        const ac = {};
        (dc.zones || []).forEach((z) => {
          if (z.charge != null) zc[z.zone] = String(z.charge);
          (z.areas || []).forEach((a) => {
            if (a.charge != null) {
              ac[z.zone] = ac[z.zone] || {};
              ac[z.zone][a.area] = String(a.charge);
            }
          });
        });
        setZoneCharges(zc);
        setAreaCharges(ac);
      })
      .catch((err) => console.error("Failed to load delivery charge data:", err))
      .finally(() => setLoading(false));
  }, []);

  const toggleZone = (zoneName) => {
    setExpandedZones((prev) => ({ ...prev, [zoneName]: !prev[zoneName] }));
  };

  const overriddenCount = useMemo(() => {
    let count = 0;
    Object.values(zoneCharges).forEach((v) => {
      if (v !== "" && v != null) count += 1;
    });
    Object.values(areaCharges).forEach((areas) => {
      Object.values(areas).forEach((v) => {
        if (v !== "" && v != null) count += 1;
      });
    });
    return count;
  }, [zoneCharges, areaCharges]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const zones = dhakaZones
        .map(({ zone }) => {
          const zoneCharge = zoneCharges[zone];
          const areas = Object.entries(areaCharges[zone] || {})
            .filter(([, v]) => v !== "" && v != null)
            .map(([area, v]) => ({ area, charge: Number(v) }));
          const hasZoneCharge = zoneCharge !== "" && zoneCharge != null;
          if (!hasZoneCharge && areas.length === 0) return null;
          return {
            zone,
            charge: hasZoneCharge ? Number(zoneCharge) : null,
            areas,
          };
        })
        .filter(Boolean);

      const deliveryCharge = {
        insideDhaka: Number(insideDhaka) || 0,
        outsideDhaka: Number(outsideDhaka) || 0,
        zones,
      };

      const resp = await fetch(`${API}/api/admin/settings/delivery-charge`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ deliveryCharge }),
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Save failed");
      toast.success("Delivery charge settings saved");
    } catch (err) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center text-sm text-gray-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1F2937]">
            Delivery Charge
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Set default shipping charges and optional overrides for specific
            Dhaka zones or areas. Checkout pulls these values directly — no
            more hardcoded charges.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-[#1D1D1F] text-white hover:bg-black transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      <Section
        title="Default charges"
        desc="Used whenever a customer's zone/area has no specific override."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Inside Dhaka (৳)">
            <input
              type="number"
              min="0"
              value={insideDhaka}
              onChange={(e) => setInsideDhaka(e.target.value)}
              className={INPUT}
            />
          </Field>
          <Field label="Outside Dhaka (৳)">
            <input
              type="number"
              min="0"
              value={outsideDhaka}
              onChange={(e) => setOutsideDhaka(e.target.value)}
              className={INPUT}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Dhaka zone & area overrides"
        desc={`Optional — leave blank to use the inside-Dhaka default. ${overriddenCount} override${overriddenCount === 1 ? "" : "s"} set.`}
      >
        <div className="divide-y divide-gray-100">
          {dhakaZones.map(({ zone, areas }) => {
            const expanded = !!expandedZones[zone];
            return (
              <div key={zone} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleZone(zone)}
                    className="shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 transition"
                    aria-label={expanded ? "Collapse" : "Expand"}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </button>
                  <span className="flex-1 text-sm text-gray-700">{zone}</span>
                  <span className="text-xs text-gray-400">৳</span>
                  <input
                    type="number"
                    min="0"
                    placeholder={String(insideDhaka)}
                    value={zoneCharges[zone] ?? ""}
                    onChange={(e) =>
                      setZoneCharges((prev) => ({
                        ...prev,
                        [zone]: e.target.value,
                      }))
                    }
                    className="w-24 border border-gray-200 px-2.5 py-1.5 rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-[#1D1D1F] focus:border-[#1D1D1F]"
                  />
                </div>

                {expanded && (
                  <div className="mt-2.5 ml-9 space-y-2">
                    {areas.map((area) => (
                      <div key={area} className="flex items-center gap-3">
                        <span className="flex-1 text-xs text-gray-500">
                          {area}
                        </span>
                        <span className="text-xs text-gray-400">৳</span>
                        <input
                          type="number"
                          min="0"
                          placeholder={
                            zoneCharges[zone] || String(insideDhaka)
                          }
                          value={areaCharges[zone]?.[area] ?? ""}
                          onChange={(e) =>
                            setAreaCharges((prev) => ({
                              ...prev,
                              [zone]: {
                                ...prev[zone],
                                [area]: e.target.value,
                              },
                            }))
                          }
                          className="w-24 border border-gray-200 px-2.5 py-1.5 rounded-xl text-xs outline-none transition focus:ring-2 focus:ring-[#1D1D1F] focus:border-[#1D1D1F]"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
