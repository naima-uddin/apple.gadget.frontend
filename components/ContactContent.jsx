"use client";

import React, { useState } from "react";
import { useStoreSettings } from "@/components/context/StoreSettingsContext";
import { useLanguage } from "@/components/context/LanguageContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

const CONTACT_ICON =
  "M21 10a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7H9v3l-4-4 4-4v3h4a4.5 4.5 0 004.5-4.5V6a4.5 4.5 0 00-4.5-4.5H5";

function Icon({ path, className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

export default function ContactContent() {
  const { contactInfo } = useStoreSettings();
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState(null); // 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 30000);
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        signal: controller.signal,
      });
      clearTimeout(tid);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setStatus("success");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      clearTimeout(tid);
      setStatus("error");
      setErrorMsg(
        err.name === "AbortError" ? t("contact.timeout_error") : err.message,
      );
    }
  };

  const hasContactInfo =
    contactInfo?.phone || contactInfo?.email || contactInfo?.address;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8 lg:col-span-3">
        <div className="mb-6 flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-[#1D1D1F] shadow-sm shadow-gray-100">
            <Icon path={CONTACT_ICON} className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-[#1F2937] sm:text-2xl">
              {t("contact.title")}
            </h1>
            <p className="mt-0.5 text-xs text-[#6B7280] sm:text-sm">
              {t("contact.desc")}
            </p>
          </div>
        </div>

        {status === "success" ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-5 text-sm text-emerald-800">
            <p className="font-semibold mb-1">{t("contact.success_title")}</p>
            <p>{t("contact.success_msg")}</p>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-1">
                {t("contact.name_label")}
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm transition focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                placeholder={t("contact.name_ph")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-1">
                {t("contact.email_label")}
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm transition focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                placeholder={t("contact.email_ph")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-1">
                {t("contact.message_label")}
              </label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm transition focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                placeholder={t("contact.message_ph")}
              />
            </div>
            {status === "error" && (
              <p className="text-sm text-red-600">{errorMsg}</p>
            )}
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-full bg-[#1D1D1F] px-6 py-2.5 text-sm font-medium text-white shadow-sm shadow-gray-300 transition hover:bg-black disabled:opacity-60"
            >
              {status === "loading" ? t("contact.sending") : t("contact.send")}
            </button>
          </form>
        )}
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#1D1D1F] via-gray-800 to-gray-700 p-6 text-white shadow-lg shadow-gray-300 lg:col-span-2">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-white/10"
          aria-hidden="true"
        />
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-300">
          {t("contact.title")}
        </p>
        <h2 className="mt-1 text-lg font-bold">যোগাযোগের তথ্য</h2>

        {hasContactInfo ? (
          <div className="mt-6 space-y-4">
            {contactInfo.phone && (
              <a
                href={`tel:${contactInfo.phone}`}
                className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm transition hover:bg-white/15"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon
                    className="h-4 w-4"
                    path="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
                  />
                </span>
                {contactInfo.phone}
              </a>
            )}
            {contactInfo.email && (
              <a
                href={`mailto:${contactInfo.email}`}
                className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm transition hover:bg-white/15"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon
                    className="h-4 w-4"
                    path="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z M22 6l-10 7L2 6"
                  />
                </span>
                {contactInfo.email}
              </a>
            )}
            {contactInfo.address && (
              <div className="flex items-start gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon
                    className="h-4 w-4"
                    path="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z"
                  />
                </span>
                <span>{contactInfo.address}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-6 text-sm text-gray-100">
            {t("contact.desc")}
          </p>
        )}
      </div>
    </div>
  );
}
