"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import NotificationBell from "@/components/dashboard/NotificationBell";
import { useUser } from "@/components/context/UserContext";
import { useGlobalBarcodeScan } from "@/hooks/useGlobalBarcodeScan";

export default function DashboardLayout({ children }) {
  const { user, loading, refreshUser } = useUser();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  const scanEnabled = !!user && ["admin", "moderator"].includes(user.role);
  useGlobalBarcodeScan(scanEnabled);

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1)
      router.back();
    else router.push("/dashboard");
  };

  // Not logged in (or session expired) → go straight to the login page.
  useEffect(() => {
    if (!user && !loading) router.replace("/auth/adminlogin");
  }, [user, loading, router]);

  // ── Still fetching session ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="animate-spin w-10 h-10 text-[#1D1D1F]"
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
          <p className="text-sm text-[#6B7280]">Please wait…</p>
        </div>
      </div>
    );
  }

  // ── Not logged in ── redirect effect above sends us to /auth/adminlogin ───
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <svg
          className="animate-spin w-10 h-10 text-[#1D1D1F]"
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
      </div>
    );
  }

  // ── Wrong role ────────────────────────────────────────────────────────────
  if (!["admin", "moderator"].includes(user.role)) {
    return (
      <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl border border-gray-200 shadow-sm text-center">
          <h2 className="text-xl font-semibold text-[#1F2937]">
            Access denied
          </h2>
          <p className="mt-2 text-sm text-[#6B7280]">
            You must be an admin or moderator to view this area.
          </p>
        </div>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className={`w-full md:grid gap-6 transition-all duration-300 ${
          collapsed
            ? "md:grid-cols-[76px_minmax(0,1fr)]"
            : "md:grid-cols-[clamp(16rem,18vw,19rem)_minmax(0,1fr)]"
        }`}
      >
        <Suspense fallback={null}>
          <div className="print:hidden">
            <Sidebar
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              mobileOpen={mobileSidebarOpen}
              onClose={() => setMobileSidebarOpen(false)}
            />
          </div>
        </Suspense>
        <main className="w-full min-w-0 p-2 md:p-4 lg:p-6 xl:p-8">
          <div className="print:hidden mb-6 flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
            <div className="flex items-center gap-2">
              {/* hamburger for mobile */}
              <button
                className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-[#1D1D1F] transition-colors"
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Open menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-2 px-4 py-1.5 border border-gray-200 rounded-full text-sm text-[#6B7280] hover:text-[#1D1D1F] hover:border-[#1D1D1F] transition-colors"
              >
                <span className="text-sm">←</span>
                <span>Back</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
