"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/context/UserContext";
import { useStoreSettings } from "@/components/context/StoreSettingsContext";

export default function AdminLogin() {
  const router = useRouter();
  const { refreshUser } = useUser();
  const { storeName, logoUrl } = useStoreSettings();
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

  // only login supported now, so no "mode" toggling or registration state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("error");
  const [loading, setLoading] = useState(false);

  const showMessage = (msg, t = "error") => {
    setMessage(msg);
    setType(t);
  };

  const clear = () => {
    setMessage("");
    setType("error");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clear();
    if (!email || !password)
      return showMessage("Email and password are required");

    setLoading(true);
    try {
      // Admin login: authenticate directly with backend (no Firebase)
      const resp = await fetch(`${API}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(body.error || `Server responded ${resp.status}`);
      }

      await refreshUser();
      showMessage("Login successful — redirecting...", "success");
      setTimeout(() => router.push("/dashboard"), 1000);
    } catch (err) {
      console.error("Admin login error:", err);
      showMessage(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-6">
          {logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logoUrl}
              alt={storeName || "Store"}
              className="h-14 w-14 rounded-2xl object-contain bg-white border border-gray-200 p-1 shadow-sm"
            />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1D1D1F] text-lg font-bold text-white shadow-sm">
              {storeName
                ? storeName.replace(/\s+/g, "").slice(0, 2).toUpperCase()
                : "SB"}
            </span>
          )}
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[#1F2937] work-sans">
            Admin Sign in
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Sign in to manage {storeName || "your store"}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#1D1D1F] focus:ring-2 focus:ring-gray-100 transition"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10 border border-gray-200 bg-white text-gray-900 placeholder-gray-400 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#1D1D1F] focus:ring-2 focus:ring-gray-100 transition"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1D1D1F] transition-colors"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3-11-7 1.02-2.1 2.6-3.89 4.54-5.06" />
                      <path d="M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
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
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1D1D1F] hover:bg-black text-white px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              {loading && (
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
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
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {message && (
            <div
              className={`mt-4 p-3 rounded-xl text-sm ${type === "success" ? "bg-green-50 text-green-800 border border-green-200" : type === "info" ? "bg-blue-50 text-blue-800 border border-blue-200" : "bg-red-50 text-red-800 border border-red-200"}`}
            >
              <div className="flex items-start gap-2">
                {type === "success" && (
                  <svg
                    className="w-5 h-5 text-green-500 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                {type === "error" && (
                  <svg
                    className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                {type === "info" && (
                  <svg
                    className="w-5 h-5 text-blue-500 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                <div className="flex-1">
                  <p>{message}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-gray-200 bg-white p-4 text-xs text-[#6B7280]">
          <svg
            className="w-4 h-4 text-[#1D1D1F] shrink-0 mt-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <p>
            Protected area — passwords are hashed, login attempts and IPs are
            logged, and accounts lock after repeated failed attempts.
          </p>
        </div>
      </div>
    </div>
  );
}
