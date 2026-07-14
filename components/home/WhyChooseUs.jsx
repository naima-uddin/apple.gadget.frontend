"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/components/context/LanguageContext";
import SectionHeader from "./SectionHeader";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
const VISIBLE_FAQS = 4;

// Shown when no FAQ items are configured in dashboard → Policy Pages → FAQ
const DEFAULT_FAQS = [
  {
    question: "Are all your products authentic?",
    answer:
      "Yes — every gadget we sell is 100% authentic and sourced from authorized distributors, with official warranty where applicable.",
  },
  {
    question: "How fast is delivery?",
    answer:
      "Orders inside Dhaka are usually delivered within 24–48 hours, and nationwide delivery takes 2–4 business days.",
  },
  {
    question: "Can I return or exchange a product?",
    answer:
      "Absolutely. You can return or exchange most items within 7 days of delivery as long as they are unused and in original packaging.",
  },
  {
    question: "Is there a return policy?",
    answer:
      "Yes, we have a clear return policy. Please refer to our Returns & Refunds page for detailed information on how to initiate a return or exchange.",
  },
];

// Cayenne-style "Why Choose Us": image on the left, intro + FAQ accordion on
// the right. FAQ items come from dashboard → Policy Pages → FAQ; the image is
// /whychoose.png in the frontend public folder (section adapts if it's absent).
export default function WhyChooseUs() {
  const { t } = useLanguage();
  const [faqs, setFaqs] = useState(DEFAULT_FAQS);
  const [storeName, setStoreName] = useState("");
  const [openIndex, setOpenIndex] = useState(0);
  const [hasImage, setHasImage] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/admin/top-banner`)
      .then((r) => r.json())
      .then((d) => {
        const items = d.policyContent?.faq || [];
        if (items.length > 0) setFaqs(items.slice(0, VISIBLE_FAQS));
        setStoreName(d.storeName || "");
      })
      .catch(() => {});
  }, []);

  return (
    <section className="w-full py-6 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section title — same style as the other homepage sections */}
        <SectionHeader title={t("home.why_choose_us")} />

        {/* White card: image left, content right */}
        <div
          className={`bg-white border border-gray-100 rounded-3xl shadow- grid grid-cols-1 gap-6 md:gap-8 items-stretch ${
            hasImage ? "md:grid-cols-[1fr_1.25fr]" : ""
          }`}
        >
          {/* Image */}
          {hasImage && (
            <div className="relative rounded-l-2xl  overflow-hidden bg-[#F5F6F7] min-h-64 md:min-h-80 ">
              <Image
                src="/whychoose.jpg"
                alt={t("home.why_choose_us")}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover"
                onError={() => setHasImage(false)}
              />
            </div>
          )}

          {/* Text + accordion */}
          <div className=" p-2 md:p-4 mr-2">
            <p className="text-sm text-[#6B7280] leading-relaxed mb-5">
              {t("home.why_choose_desc").replace(
                "{store}",
                storeName || "our store",
              )}
            </p>

            <div className="divide-y divide-gray-200 border-t border-gray-200">
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
        </div>

        {/* About Us pill — bottom right, like the reference */}
        <div className="flex justify-end mt-4">
          <Link
            href="/about"
            className="bg-white border border-[#5B21B6] text-[#5B21B6] hover:bg-[#5B21B6] hover:text-white rounded-full px-5 py-2 text-xs font-semibold transition-colors shadow-sm"
          >
            {t("footer.about")}
          </Link>
        </div>
      </div>
    </section>
  );
}
