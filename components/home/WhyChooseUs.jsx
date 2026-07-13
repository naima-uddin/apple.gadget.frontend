"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/components/context/LanguageContext";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
const VISIBLE_FAQS = 4;

// Cayenne-style "Why Choose Us" block: intro text + FAQ accordion.
// FAQ items are managed in the dashboard under Policy Pages → FAQ.
export default function WhyChooseUs() {
  const { t } = useLanguage();
  const [faqs, setFaqs] = useState([]);
  const [storeName, setStoreName] = useState("");
  const [openIndex, setOpenIndex] = useState(0);

  useEffect(() => {
    fetch(`${API}/api/admin/top-banner`)
      .then((r) => r.json())
      .then((d) => {
        setFaqs((d.policyContent?.faq || []).slice(0, VISIBLE_FAQS));
        setStoreName(d.storeName || "");
      })
      .catch(() => setFaqs([]));
  }, []);

  if (faqs.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#1F2937] mb-2">
          {t("home.why_choose_us")}
        </h2>
        <p className="text-sm text-[#6B7280] leading-relaxed mb-6">
          {t("home.why_choose_desc").replace(
            "{store}",
            storeName || "our store",
          )}
        </p>

        <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
          {faqs.map((item, i) => {
            const open = openIndex === i;
            return (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 py-4 text-left"
                  aria-expanded={open}
                >
                  <span className="text-sm md:text-base font-semibold text-[#1F2937]">
                    {item.question}
                  </span>
                  <span
                    className={`shrink-0 text-[#6B7280] text-xl leading-none transition-transform duration-200 ${
                      open ? "rotate-45 text-[#5B21B6]" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    open
                      ? "grid-rows-[1fr] opacity-100 pb-4"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-sm text-[#6B7280] leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
