"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/components/context/LanguageContext";
import SectionHeader from "./SectionHeader";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
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

// Each collage tile rounds its outward-facing corner more, giving the 2×2
// grid the soft, organic frame from the reference design.
const CORNERS = [
  "rounded-2xl rounded-tl-[2.5rem]",
  "rounded-2xl rounded-tr-[2.5rem]",
  "rounded-2xl rounded-bl-[2.5rem]",
  "rounded-2xl rounded-br-[2.5rem]",
];

function CollageTile({ src, alt, corner, onFail }) {
  const [broken, setBroken] = useState(false);
  return (
    <div
      className={`relative overflow-hidden bg-[#F5F6F7] ${corner}`}
    >
      {!broken && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 50vw, 20vw"
          className="object-cover"
          onError={() => {
            setBroken(true);
            onFail?.();
          }}
        />
      )}
    </div>
  );
}

// Cayenne-style "Why Choose Us": image on the left, intro + FAQ accordion on
// the right. FAQ items come from dashboard → Policy Pages → FAQ; the image is
// /whychoose.png in the frontend public folder (section adapts if it's absent).
export default function WhyChooseUs() {
  const { t, lang } = useLanguage();
  const [faqs, setFaqs] = useState(DEFAULT_FAQS);
  const [storeName, setStoreName] = useState("");
  const [cfg, setCfg] = useState(null);
  const [openIndex, setOpenIndex] = useState(0);
  const [hasImage, setHasImage] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/admin/top-banner`)
      .then((r) => r.json())
      .then((d) => {
        const wc = d.whyChooseUs || {};
        setCfg(wc);
        // Dashboard-defined FAQ items take priority; otherwise fall back to
        // Policy Pages → FAQ, then to the built-in defaults.
        const own = Array.isArray(wc.items) ? wc.items : [];
        const policy = d.policyContent?.faq || [];
        const source = own.length > 0 ? own : policy;
        if (source.length > 0) setFaqs(source.slice(0, VISIBLE_FAQS));
        setStoreName(d.storeName || "");
      })
      .catch(() => {});
  }, []);

  // Section can be turned off entirely from the dashboard.
  if (cfg && cfg.enabled === false) return null;

  // Admin overrides fall back to the localized defaults when left blank.
  const title =
    (lang === "bn" ? cfg?.titleBn : cfg?.title) ||
    cfg?.title ||
    t("home.why_choose_us");
  const descTemplate =
    (lang === "bn" ? cfg?.descriptionBn : cfg?.description) ||
    cfg?.description ||
    t("home.why_choose_desc");
  const description = descTemplate.replace("{store}", storeName || "our store");
  const buttonLabel = cfg?.buttonLabel || t("footer.about");
  const buttonLink = cfg?.buttonLink || "/about";

  // Build the 4-image collage: dashboard `images` array first, then the legacy
  // single `image`, then a built-in default. Missing slots cycle through what
  // we have so the 2×2 grid is always full.
  const configuredPics = (Array.isArray(cfg?.images) ? cfg.images : [])
    .map((im) => im?.url)
    .filter(Boolean);
  const legacyPic = cfg?.image?.url ? [cfg.image.url] : [];
  const basePics =
    configuredPics.length > 0
      ? configuredPics
      : legacyPic.length > 0
        ? legacyPic
        : ["/whychoose.jpg"];
  const collage = Array.from({ length: 4 }, (_, i) => basePics[i % basePics.length]);
  const hasConfigured = configuredPics.length > 0 || legacyPic.length > 0;

  return (
    <section className="w-full py-6 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section title — same style as the other homepage sections */}
        <SectionHeader title={title} />

        {/* White card: image left, content right */}
        <div
          className={`bg-white border border-gray-100 rounded-3xl shadow- grid grid-cols-1 gap-4 md:gap-6 items-stretch ${
            hasImage ? "md:grid-cols-[1fr_1.25fr]" : ""
          }`}
        >
          {/* Image collage — 2×2 grid with a center badge */}
          {hasImage && (
            <div className="relative p-3 md:p-4 min-h-72 md:min-h-96">
              <div className="grid grid-cols-2 grid-rows-2 gap-2 md:gap-3 h-full">
                {collage.map((src, i) => (
                  <CollageTile
                    key={i}
                    src={src}
                    alt={title}
                    corner={CORNERS[i]}
                    onFail={() => {
                      // Only collapse the whole column when we're relying on the
                      // built-in default (nothing configured) and it fails.
                      if (!hasConfigured && i === 0) setHasImage(false);
                    }}
                  />
                ))}
              </div>

              {/* Center authenticity seal, like the reference collage */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white shadow-lg ring-4 ring-white border border-gray-200 flex flex-col items-center justify-center text-center">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1D1D1F"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6 md:w-7 md:h-7"
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span className="mt-0.5 text-[9px] md:text-[10px] font-semibold uppercase tracking-wide text-[#1D1D1F] leading-tight">
                    100%
                    <br />
                    Authentic
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Text + accordion */}
          <div className=" p-2 md:p-4 mr-2">
            <p className="text-sm text-[#6B7280] leading-relaxed mb-5">
              {description}
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
                      <span className="text-sm md:text-base font-semibold text-[#1F2937] font-georgia">
                        {item.question}
                      </span>
                      <span
                        className={`shrink-0 text-[#6B7280] text-xl leading-none transition-transform duration-200 ${
                          open ? "rotate-45 text-[#1D1D1F]" : ""
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
            href={buttonLink}
            className="bg-white border border-[#1D1D1F] text-[#1D1D1F] hover:bg-[#1D1D1F] hover:text-white rounded-full px-5 py-2 text-xs font-semibold transition-colors shadow-sm"
          >
            {buttonLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
