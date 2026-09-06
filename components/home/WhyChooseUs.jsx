"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
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

// Two flush columns (no center gap) with a staggered horizontal seam, giving
// four unequal tiles: 1 = very large, 2 = small, 3 = small, 4 = a bit large.
// Only the outer corner of each tile is rounded so the inner seams meet clean.
const TILES = [
  // 1 — top-left, very large
  "col-start-1 col-span-4 row-start-1 row-span-4 rounded-tl-[4rem]",
  // 2 — top-right, small
  "col-start-5 col-span-2 row-start-1 row-span-2 rounded-tr-[4rem]",
  // 3 — bottom-left, small
  "col-start-1 col-span-4 row-start-5 row-span-2 rounded-bl-[4rem]",
  // 4 — bottom-right, a bit large
  "col-start-5 col-span-2 row-start-3 row-span-4 rounded-br-[4rem]",
];

// Accent used for the top corner mark (reference uses a green arc). Kept local
// to this section — the rest of the theme stays Apple monochrome.
const MARK_GREEN = "#1E5631";

// Green shield "100% TRUSTED" badge (ribbon banner + stars), drawn inline so
// it stays crisp at any size and needs no external asset.
function TrustedBadge() {
  return (
    <svg
      viewBox="0 0 120 140"
      className="w-16 h-20 md:w-20 md:h-24 drop-shadow-lg"
      role="img"
      aria-label="100% Trusted"
    >
      <defs>
        <linearGradient id="wc-shield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7ED957" />
          <stop offset="0.5" stopColor="#3EA537" />
          <stop offset="1" stopColor="#1E5631" />
        </linearGradient>
        <linearGradient id="wc-ribbon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2E8B3D" />
          <stop offset="1" stopColor="#1B5E20" />
        </linearGradient>
      </defs>

      {/* Shield */}
      <path
        d="M60 4 L110 20 V58 C110 92 88 114 60 128 C32 114 10 92 10 58 V20 Z"
        fill="#155724"
      />
      <path
        d="M60 12 L102 26 V58 C102 87 83 106 60 118 C37 106 18 87 18 58 V26 Z"
        fill="url(#wc-shield)"
      />

      {/* 100% */}
      <text
        x="60"
        y="52"
        textAnchor="middle"
        fontSize="22"
        fontWeight="800"
        fill="#ffffff"
        fontFamily="Arial, sans-serif"
      >
        100%
      </text>

      {/* Stars */}
      <g fill="#ffffff">
        <path d="M42 96 l1.6 3.4 3.7.4-2.8 2.5.8 3.6-3.3-1.9-3.3 1.9.8-3.6-2.8-2.5 3.7-.4z" />
        <path d="M60 98 l1.8 3.9 4.2.5-3.1 2.9.9 4.1-3.8-2.2-3.8 2.2.9-4.1-3.1-2.9 4.2-.5z" />
        <path d="M78 96 l1.6 3.4 3.7.4-2.8 2.5.8 3.6-3.3-1.9-3.3 1.9.8-3.6-2.8-2.5 3.7-.4z" />
      </g>

      {/* Ribbon banner */}
      <path d="M6 66 L20 70 L18 88 L4 82 Z" fill="#14481a" />
      <path d="M114 66 L100 70 L102 88 L116 82 Z" fill="#14481a" />
      <rect x="14" y="62" width="92" height="24" rx="4" fill="url(#wc-ribbon)" />
      <text
        x="60"
        y="79"
        textAnchor="middle"
        fontSize="15"
        fontWeight="800"
        letterSpacing="1"
        fill="#ffffff"
        fontFamily="Arial, sans-serif"
      >
        TRUSTED
      </text>
    </svg>
  );
}

function CollageTile({ src, alt, className, onFail }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className={`relative overflow-hidden bg-[#F5F6F7] ${className}`}>
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
        {/* Section title with the About/CTA pill on the right of the heading */}
        <SectionHeader
          title={title}
          seeMoreHref={buttonLink}
          seeMoreLabel={buttonLabel}
        />

        {/* White card: image left, content right */}
        <div
          className={`rounded-3xl grid grid-cols-1 gap-4 md:gap-6 items-stretch ${
            hasImage ? "md:grid-cols-[1fr_1.25fr]" : ""
          }`}
        >
          {/* Image collage — two flush columns, no center gap, center badge */}
          {hasImage && (
            <div className="relative p-3 min-h-80 md:min-h-104">
              <div className="relative grid grid-cols-6 grid-rows-6 h-full overflow-hidden rounded-3xl">
                {collage.map((src, i) => (
                  <CollageTile
                    key={i}
                    src={src}
                    alt={title}
                    className={TILES[i]}
                    onFail={() => {
                      // Only collapse the whole column when we're relying on the
                      // built-in default (nothing configured) and it fails.
                      if (!hasConfigured && i === 0) setHasImage(false);
                    }}
                  />
                ))}

                {/* Green corner mark — top only, sitting on the first image */}
                <span
                  className="pointer-events-none absolute top-0 left-0 w-20 h-20 md:w-24 md:h-24 rounded-tl-[4rem] border-t-[6px] border-l-[6px] z-10"
                  style={{ borderColor: MARK_GREEN }}
                />
              </div>

              {/* Trusted shield badge — sits over the seam crossing */}
              <div className="absolute left-[66%] top-[64%] -translate-x-1/2 -translate-y-1/2 z-20">
                <TrustedBadge />
              </div>
            </div>
          )}

          {/* Text + accordion */}
          <div className=" p-2 md:p-4 mr-2">
            <p className="text-sm text-[#6B7280] leading-relaxed mb-5">
              {description}
            </p>

            <div className="space-y-2">
              {faqs.map((item, i) => {
                const open = openIndex === i;
                return (
                  <div
                    key={i}
                    className={`rounded-2xl transition-all duration-200 ${
                      open
                        ? "bg-[#F5F5F7] shadow-sm ring-1 ring-gray-200 px-4"
                        : "border-b border-gray-200 px-1"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIndex(open ? -1 : i)}
                      className="w-full flex items-center justify-between gap-4 py-4 text-left"
                      aria-expanded={open}
                    >
                      <span
                        className={`text-sm md:text-base font-semibold font-georgia transition-colors ${
                          open ? "text-[#1D1D1F]" : "text-[#1F2937]"
                        }`}
                      >
                        {item.question}
                      </span>
                      <span
                        className={`shrink-0 text-xl leading-none transition-transform duration-200 ${
                          open ? "rotate-45 text-[#1D1D1F]" : "text-[#6B7280]"
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
      </div>
    </section>
  );
}
