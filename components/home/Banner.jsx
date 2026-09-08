"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Banner (homepage hero)
// New design: two product images flanking the sides, centred text in the middle
// and a glassy "frosted" call-to-action button. Reads the same /api/banners
// data source. Each slide carries its own LEFT image (`image`) and RIGHT image
// (`rightImage`) — both fully editable from the dashboard. If a slide has no
// right image it falls back to mirroring the left one. The ORIGINAL banner
// design lives in <BannerClassic /> and can be reused anywhere.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Playfair_Display } from "next/font/google";

// Elegant high-contrast display serif for the hero title (upright + italic)
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const FALLBACK = [
  {
    _id: "fallback-1",
    image: { url: "/banner/Oven_Big_banner_1.jpg" },
    badge: "Smarter Every Day",
    title: "Your Time. Your *Style.*",
    subtitle:
      "Stay connected, track your day and enjoy smart features with a stylish smartwatch designed for your everyday lifestyle.",
    buttonText: "Shop Now",
    buttonLink: "/products",
    rightTitle: "",
    rightText: "",
  },
];

const Banner = () => {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
  const router = useRouter();
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const autoRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/api/banners`)
      .then((r) => r.json())
      .then((b) => setSlides((b.items || []).length > 0 ? b.items : FALLBACK))
      .catch(() => setSlides(FALLBACK));
  }, [API]);

  const total = slides.length;

  const startAuto = useCallback(() => {
    clearInterval(autoRef.current);
    if (total <= 1) return;
    autoRef.current = setInterval(
      () => setCurrent((p) => (p + 1) % total),
      7000,
    );
  }, [total]);

  useEffect(() => {
    startAuto();
    return () => clearInterval(autoRef.current);
  }, [startAuto]);

  const goTo = (idx) => {
    setCurrent(((idx % total) + total) % total);
    startAuto();
  };

  // words wrapped in *asterisks* render in an elegant serif italic accent
  const renderHighlight = (text) =>
    String(text)
      .split(/(\*[^*]+\*)/g)
      .map((part, i) =>
        part.startsWith("*") && part.endsWith("*") ? (
          <span key={i} className="font-medium italic text-gray-500">
            {part.slice(1, -1)}
          </span>
        ) : (
          part
        ),
      );

  const slide = slides[current] || slides[0];
  if (!slide) return <section className="h-120 bg-[#EEF2F6]" />;

  const goToLink = () => {
    if (slide?.buttonLink) router.push(slide.buttonLink);
  };

  return (
    <section
      className="relative h-68 w-full overflow-hidden -mt-12 min-[420px]:h-76 sm:h-112 md:-mt-14 md:h-136 lg:h-165"
      onMouseEnter={() => clearInterval(autoRef.current)}
      onMouseLeave={startAuto}
    >
      {/* ── Soft studio backdrop ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 20%, #FFFFFF 0%, #EEF2F6 45%, #DDE5EC 100%)",
        }}
      />

      {/* Giant ghost title behind everything (echoes the centred headline) */}
      {slide.title && (
        <span
          aria-hidden="true"
          className={`${playfair.className} pointer-events-none absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap text-center text-[22vw] font-bold uppercase leading-none tracking-tighter text-white/50 sm:text-[18vw]`}
        >
          {String(slide.title).replace(/\*/g, "").split(" ")[0]}
        </span>
      )}

      {/* ── Left image — pulled inward from the edge and sized down via the
             vertical padding so it never crowds the navbar or the centre text ── */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[30%] sm:left-[2%] sm:w-[24%] md:left-[4%] md:w-[23%] lg:left-[12%] lg:w-[27%]">
        {slides.map((s, i) => (
          <div
            key={`l-${s._id || i}`}
            className={`absolute inset-x-1 inset-y-5 transition-all duration-700 ease-out sm:inset-x-2 sm:inset-y-12 md:inset-y-16 lg:inset-y-14 ${
              i === current
                ? "translate-x-0 opacity-100"
                : "-translate-x-6 opacity-0"
            }`}
          >
            <Image
              src={s.image?.url || "/assets/placeholder.svg"}
              alt={s.title || "Banner"}
              fill
              priority={i === 0}
              quality={90}
              sizes="30vw"
              className="object-contain object-center drop-shadow-[0_30px_50px_rgba(30,40,60,0.25)]"
            />
          </div>
        ))}
      </div>

      {/* ── Right image (each slide's own rightImage, falls back to its left) ── */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[30%] sm:right-[2%] sm:w-[24%] md:right-[4%] md:w-[23%] lg:right-[12%] lg:w-[27%]">
        {slides.map((s, i) => (
          <div
            key={`r-${s._id || i}`}
            className={`absolute inset-x-1 inset-y-5 transition-all duration-700 ease-out sm:inset-x-2 sm:inset-y-12 md:inset-y-16 lg:inset-y-14 ${
              i === current
                ? "translate-x-0 opacity-100"
                : "translate-x-6 opacity-0"
            }`}
          >
            <Image
              src={s.rightImage?.url || s.image?.url || "/assets/placeholder.svg"}
              alt=""
              aria-hidden="true"
              fill
              quality={90}
              sizes="30vw"
              className="object-contain object-center drop-shadow-[0_30px_50px_rgba(30,40,60,0.25)]"
            />
          </div>
        ))}
      </div>

      {/* ── Centre content (top padding clears the transparent navbar) ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-5 pt-12 text-center sm:px-2 md:pt-14">
        {slide.badge && (
          <span className="mb-2 inline-block rounded-full border border-black/10 bg-white/60 px-2.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-[#1D1D1F] backdrop-blur-md sm:mb-4 sm:px-4 sm:py-1.5 sm:tracking-[0.22em] sm:text-[11px]">
            {slide.badge}
          </span>
        )}

        {slide.title && (
          <h1
            onClick={goToLink}
            className={`${playfair.className} max-w-[40%] cursor-pointer text-xl font-bold uppercase leading-[1.05] tracking-tight text-[#1D1D1F] text-balance min-[420px]:text-2xl sm:max-w-[46%] sm:text-4xl md:max-w-[46%] md:text-5xl lg:max-w-md lg:text-6xl`}
          >
            {renderHighlight(slide.title)}
          </h1>
        )}

        {slide.subtitle && (
          <p className="mt-4 hidden max-w-[42%] text-sm font-light leading-relaxed text-[#6B7280] md:block lg:max-w-[30%] xl:max-w-sm">
            {slide.subtitle}
          </p>
        )}

        {slide.buttonText && slide.buttonLink && (
          <Link
            href={slide.buttonLink}
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.12) 100%)",
              boxShadow:
                "inset 0 2px 2px rgba(255,255,255,0.85), inset 0 -3px 6px rgba(255,255,255,0.45), inset 0 0 0 1px rgba(255,255,255,0.4), inset 6px 0 12px -6px rgba(255,255,255,0.6), inset -6px 0 12px -6px rgba(255,255,255,0.6), 0 20px 35px -12px rgba(30,40,60,0.4)",
            }}
            className="group relative mt-4 inline-flex items-center gap-1.5 overflow-hidden rounded-full border border-white/50 px-4 py-2 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#1D1D1F] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 min-[420px]:px-6 min-[420px]:py-3 min-[420px]:text-[10px] sm:mt-7 sm:gap-2 sm:px-10 sm:py-4 sm:tracking-[0.18em] sm:text-sm"
          >
            {/* bright glossy specular sweep across the top half */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-1.5 top-[3px] h-1/2 rounded-full bg-linear-to-b from-white/95 via-white/40 to-transparent blur-[1px]"
            />
            {/* faint reflection along the bottom edge */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-6 bottom-[3px] h-1/4 rounded-full bg-linear-to-t from-white/45 to-transparent blur-[2px]"
            />
            {/* soft reflection glint near the right end */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-1/2 h-6 w-9 -translate-y-1/2 rounded-full bg-white/60 blur-md"
            />
            <span className="relative z-10 inline-flex items-center gap-2">
              {slide.buttonText}
              <svg
                className="h-3 w-3 transition-transform group-hover:translate-x-0.5 sm:h-4 sm:w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14M13 6l6 6-6 6"
                />
              </svg>
            </span>
          </Link>
        )}
      </div>

      {/* ── Dots ── */}
      {total > 1 && (
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
          {slides.map((s, i) => (
            <button
              key={s._id || i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === current
                  ? "w-6 bg-[#1D1D1F]"
                  : "w-1.5 bg-black/25 hover:bg-black/50"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default Banner;
