"use client";

import React, { useState } from "react";
import HomepageLayoutOrder from "@/components/dashboard/Featured/HomepageLayoutOrder";
import FeaturedSectionsList from "@/components/dashboard/Featured/FeaturedSectionsList";

export default function FeaturedDashboardPage() {
  const [tab, setTab] = useState("layout"); // 'layout' | 'featured'

  return (
    <div className="space-y-4">
      <div className="max-w-4xl mx-auto flex gap-2">
        <button
          onClick={() => setTab("layout")}
          className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
            tab === "layout"
              ? "bg-[#1D1D1F] text-white"
              : "bg-gray-100 text-[#1D1D1F] hover:bg-gray-200"
          }`}
        >
          Page Layout
        </button>
        <button
          onClick={() => setTab("featured")}
          className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
            tab === "featured"
              ? "bg-[#1D1D1F] text-white"
              : "bg-gray-100 text-[#1D1D1F] hover:bg-gray-200"
          }`}
        >
          Featured Rows
        </button>
      </div>

      {tab === "layout" ? <HomepageLayoutOrder /> : <FeaturedSectionsList />}
    </div>
  );
}
