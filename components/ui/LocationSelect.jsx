"use client";

import React, { useEffect, useRef, useState } from "react";
import SearchableSelect from "@/components/ui/SearchableSelect";

/**
 * Cascading City → Zone → Area picker, backed by the static /api/locations/
 * dataset (same source the checkout form uses). It manages its own dropdown
 * state and a free-text "Other" fallback for values that aren't in the list,
 * and reports the *resolved* strings up via `onChange({ city, zone, area })`.
 *
 * It seeds itself from the initial `city`/`zone`/`area` props once the location
 * data has loaded (so an existing order address is preselected, or shown as a
 * custom value when it isn't part of the dataset). Used by the order-edit forms
 * on the thank-you and My Orders pages.
 */
export default function LocationSelect({
  city = "",
  zone = "",
  area = "",
  onChange,
  labels = {},
  className = "",
}) {
  const [locationData, setLocationData] = useState({});
  const [sel, setSel] = useState({ city: "", zone: "", area: "" });
  const [custom, setCustom] = useState({ city: "", zone: "", area: "" });
  const seeded = useRef(false);

  const cities = Object.keys(locationData);
  const zones =
    sel.city && sel.city !== "other" && locationData[sel.city]
      ? Object.keys(locationData[sel.city].zones || {})
      : [];
  const areas =
    sel.city &&
    sel.city !== "other" &&
    sel.zone &&
    sel.zone !== "other" &&
    locationData[sel.city]
      ? locationData[sel.city].zones[sel.zone] || []
      : [];

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Trailing slash matches next.config `trailingSlash: true` (see checkout).
        const resp = await fetch("/api/locations/");
        const json = await resp.json();
        if (alive) setLocationData(json.locationData || {});
      } catch (err) {
        console.error("Failed to load location data", err);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Seed the dropdown/custom state from the initial address once data loads.
  useEffect(() => {
    if (seeded.current || !Object.keys(locationData).length) return;
    seeded.current = true;

    const cityList = Object.keys(locationData);
    const knownCity = city && cityList.includes(city);
    const nextSel = { city: "", zone: "", area: "" };
    const nextCustom = { city: "", zone: "", area: "" };

    nextSel.city = knownCity ? city : city ? "other" : "";
    nextCustom.city = knownCity ? "" : city || "";

    if (knownCity) {
      const zoneList = Object.keys(locationData[city].zones || {});
      const knownZone = zone && zoneList.includes(zone);
      nextSel.zone = knownZone ? zone : zone ? "other" : "";
      nextCustom.zone = knownZone ? "" : zone || "";

      if (knownZone) {
        const areaList = locationData[city].zones[zone] || [];
        const knownArea = area && areaList.includes(area);
        nextSel.area = knownArea ? area : area ? "other" : "";
        nextCustom.area = knownArea ? "" : area || "";
      } else {
        nextSel.area = area ? "other" : "";
        nextCustom.area = area || "";
      }
    } else {
      nextSel.zone = zone ? "other" : "";
      nextCustom.zone = zone || "";
      nextSel.area = area ? "other" : "";
      nextCustom.area = area || "";
    }

    setSel(nextSel);
    setCustom(nextCustom);
  }, [locationData, city, zone, area]);

  const emit = (nextSel, nextCustom) => {
    onChange?.({
      city: nextSel.city === "other" ? nextCustom.city : nextSel.city,
      zone: nextSel.zone === "other" ? nextCustom.zone : nextSel.zone,
      area: nextSel.area === "other" ? nextCustom.area : nextSel.area,
    });
  };

  const pickCity = (e) => {
    const value = e.target.value;
    const nextSel = { city: value, zone: "", area: "" };
    const nextCustom = { ...custom, zone: "", area: "" };
    setSel(nextSel);
    setCustom(nextCustom);
    emit(nextSel, nextCustom);
  };
  const pickZone = (e) => {
    const value = e.target.value;
    const nextSel = { ...sel, zone: value, area: "" };
    const nextCustom = { ...custom, area: "" };
    setSel(nextSel);
    setCustom(nextCustom);
    emit(nextSel, nextCustom);
  };
  const pickArea = (e) => {
    const nextSel = { ...sel, area: e.target.value };
    setSel(nextSel);
    emit(nextSel, custom);
  };
  const setCustomField = (field) => (e) => {
    const nextCustom = { ...custom, [field]: e.target.value };
    setCustom(nextCustom);
    emit(sel, nextCustom);
  };

  const inputCls =
    "w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition mt-2";

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 ${className}`}
    >
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">
          {labels.city || "City"}
        </label>
        <SearchableSelect
          name="city"
          value={sel.city}
          onChange={pickCity}
          options={cities}
          placeholder={labels.cityPh || "Select city"}
          required
        />
        {sel.city === "other" && (
          <input
            type="text"
            value={custom.city}
            onChange={setCustomField("city")}
            placeholder={labels.cityCustom || "Enter city"}
            className={inputCls}
            required
          />
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">
          {labels.zone || "Zone"}
        </label>
        <SearchableSelect
          name="zone"
          value={sel.zone}
          onChange={pickZone}
          options={zones}
          placeholder={labels.zonePh || "Select zone"}
          required
          disabled={!sel.city || sel.city === "other"}
        />
        {(sel.zone === "other" || sel.city === "other") && (
          <input
            type="text"
            value={custom.zone}
            onChange={setCustomField("zone")}
            placeholder={labels.zoneCustom || "Enter zone"}
            className={inputCls}
            required
          />
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">
          {labels.area || "Area"}
        </label>
        <SearchableSelect
          name="area"
          value={sel.area}
          onChange={pickArea}
          options={areas}
          placeholder={labels.areaPh || "Select area"}
          disabled={!sel.zone || sel.zone === "other" || sel.city === "other"}
        />
        {(sel.area === "other" ||
          sel.zone === "other" ||
          sel.city === "other") && (
          <input
            type="text"
            value={custom.area}
            onChange={setCustomField("area")}
            placeholder={labels.areaCustom || "Enter area"}
            className={inputCls}
          />
        )}
      </div>
    </div>
  );
}
