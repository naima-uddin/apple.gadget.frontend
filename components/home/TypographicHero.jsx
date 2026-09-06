"use client";

import React, { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

// A poster-style typographic hero: one giant display word (default "GADGETS")
// with up to 4 admin-uploaded images tucked between the letters — echoing the
// "objects interleaved with big type" look, kept in the sitewide monochrome
// Apple palette. Fully admin-controlled from the dashboard (word + images +
// enabled) via /api/typographic-hero. When no images are uploaded it falls
// back to the built-in gadget line-icons so it never looks empty.

// fallback icons keep a subtle rounded surface (line icons need a backdrop);
// real uploaded images render BARE and overlap the letters like the reference.
const iconChipClass =
  "inline-flex items-center justify-center align-middle rounded-2xl bg-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.35)] ring-1 ring-black/5 overflow-hidden text-[#1D1D1F]";

// vertical offsets following the reference rhythm: middle → bottom → top →
// center (container is baseline-aligned, so more-negative = higher up)
const CHIP_SHIFT = ["-0.42em", "-0.08em", "-0.9em", "-0.45em"];

// Lucide-style stroke icons (fallback when no images are uploaded)
const PhoneIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="5" y="2" width="14" height="20" rx="2.5" />
    <path d="M11 18h2" />
  </svg>
);
const WatchIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="5" />
    <path d="M12 9.5v2.5l1.5 1M9 3.5 8.5 7M15 3.5l.5 3.5M9 20.5l-.5-3.5M15 20.5l.5-3.5" />
  </svg>
);
const BudsIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 15a3 3 0 0 1-3-3 6 6 0 0 1 6-6 3 3 0 0 1 3 3v3a3 3 0 0 1-3 3z" />
    <path d="M18 15a3 3 0 0 0 3-3 6 6 0 0 0-6-6" />
    <path d="M9 15v4M15 15v4" />
  </svg>
);
const CameraIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.2a1 1 0 0 0 .8-.4l.9-1.2a1 1 0 0 1 .8-.4h3.6a1 1 0 0 1 .8.4l.9 1.2a1 1 0 0 0 .8.4h1.2A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
    <circle cx="12" cy="12.5" r="3" />
  </svg>
);
const FALLBACK_ICONS = [PhoneIcon, WatchIcon, BudsIcon, CameraIcon];

// Distribute N chips evenly into the internal gaps of an L-letter word.
// Returns a Set-like map: letterIndex -> chipIndex (chip shown AFTER that letter).
function chipAfterMap(letterCount, chipCount) {
  const map = {};
  for (let i = 0; i < chipCount; i++) {
    let idx = Math.round(((i + 1) * letterCount) / (chipCount + 1)) - 1;
    idx = Math.max(0, Math.min(letterCount - 1, idx));
    // avoid two chips after the same letter
    while (map[idx] !== undefined && idx < letterCount - 1) idx++;
    map[idx] = i;
  }
  return map;
}

export default function TypographicHero() {
  const [cfg, setCfg] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/api/typographic-hero`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setCfg(d);
      })
      .catch(() => {
        if (!cancelled) setCfg({ enabled: true, word: "GADGETS", images: [] });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!cfg || cfg.enabled === false) return null;

  const word = (cfg.word || "GADGETS").toUpperCase();
  const letters = word.split("");
  const images = (cfg.images || []).filter((im) => im?.url).slice(0, 4);

  // chips to render: uploaded images, or the 4 built-in icons as a fallback
  const chips =
    images.length > 0
      ? images.map((im) => ({ type: "image", ...im }))
      : FALLBACK_ICONS.map((Icon) => ({ type: "icon", Icon }));

  // only interleave chips among the letters (not for a 1-char word)
  const chipCount = letters.length > 1 ? Math.min(chips.length, letters.length) : 0;
  const afterMap = chipAfterMap(letters.length, chipCount);

  // Build the interleaved node list (static — no animation)
  const nodes = [];
  letters.forEach((ch, i) => {
    nodes.push(
      ch === " " ? (
        <span key={`sp-${i}`} className="inline-block w-[0.28em]" />
      ) : (
        <span key={`l-${i}`} className="relative z-10">
          {ch}
        </span>
      ),
    );

    const chipIdx = afterMap[i];
    if (chipIdx !== undefined && chips[chipIdx]) {
      const chip = chips[chipIdx];
      if (chip.type === "image") {
        // Bare cutout overlapping the letters — alternately in front of / behind
        // the type for depth, sitting at its staggered height like the reference.
        const inFront = chipIdx % 2 === 0;
        nodes.push(
          <span
            key={`c-${i}`}
            aria-hidden="true"
            className="relative inline-block align-bottom"
            style={{
              width: "1em",
              height: "1.55em",
              marginLeft: "-0.28em",
              marginRight: "-0.28em",
              transform: `translateY(${CHIP_SHIFT[chipIdx % CHIP_SHIFT.length]})`,
              zIndex: inFront ? 20 : 1,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={chip.url}
              alt=""
              className="w-full h-full object-contain object-bottom"
              style={{ filter: "drop-shadow(0 8px 12px rgba(15,23,42,0.28))" }}
            />
          </span>,
        );
      } else {
        // fallback line-icon keeps its soft rounded surface
        nodes.push(
          <span
            key={`c-${i}`}
            aria-hidden="true"
            className={`${iconChipClass} w-[0.62em] h-[0.62em]`}
            style={{ marginTop: CHIP_SHIFT[chipIdx % CHIP_SHIFT.length] }}
          >
            <chip.Icon className="w-[72%] h-[72%]" />
          </span>,
        );
      }
    }
  });

  return (
    <section className="typo-hero relative overflow-hidden">
      {/* Poster background: cool light gray wash with a subtle vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg,#F4F5F7 0%,#EAECEF 42%,#E1E4E9 70%,#EEF0F3 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.55]"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, rgba(255,255,255,0.9) 0%, transparent 55%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 md:pt-28 pb-10 sm:pb-14 md:pb-16">
        <h1
          className="flex flex-wrap items-end justify-center gap-1 sm:gap-2 font-black text-[#1F2937] leading-none select-none"
          style={{ fontSize: "clamp(2.25rem, 10vw, 6.5rem)", letterSpacing: "-0.04em" }}
        >
          {nodes}
        </h1>
      </div>
    </section>
  );
}
