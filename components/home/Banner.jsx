"use client";

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

// The centred "sharp window": the same full-bleed image stays crisp inside this
// rounded rectangle and is blurred everywhere outside it. Using identical
// object-cover layers means the sharp window lines up perfectly with the blur.
// Horizontal inset caps the window at ~1080px and centres it (so it never
// stretches into a thin strip on wide screens); vertical insets leave room for
// the frosted navbar (top) and the title/thumbnail band (bottom).
const SIDE = "max(3.5%, calc((100% - 1260px) / 2))";
const INSET = { top: "11.5%", bottom: "13%", left: SIDE, right: SIDE };
const WINDOW_CLIP = `inset(11.5% ${SIDE} 13% ${SIDE} round 28px)`;

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
  if (!slide) return <section className="h-120 bg-[#EDEBE7]" />;

  const thumbs = slides
    .map((s, i) => ({ s, i }))
    .filter((x) => x.i !== current)
    .slice(0, 3);

  const goToLink = () => {
    if (slide?.buttonLink) router.push(slide.buttonLink);
  };

  return (
    <section
      className="relative h-120 w-full overflow-hidden -mt-12 sm:h-150 md:-mt-14 lg:h-165"
      onMouseEnter={() => clearInterval(autoRef.current)}
      onMouseLeave={startAuto}
    >
      {/* ── Layer 1: full-bleed BLURRED image (the surround) ── */}
      <div className="absolute inset-0">
        {slides.map((s, i) => (
          <Image
            key={s._id || i}
            src={s.image?.url || "/assets/placeholder.svg"}
            alt=""
            fill
            aria-hidden="true"
            priority={i === 0}
            quality={45}
            sizes="100vw"
            className={`scale-105 object-cover object-center blur-[3px] saturate-90 brightness-105 transition-opacity duration-700 ease-out ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>

      {/* soft veil + vignette so the blurred surround stays calm and premium
          (sits ABOVE the blur but BELOW the sharp window) */}
      <div className="absolute inset-0 bg-linear-to-b from-white/45 via-white/25 to-white/55" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(115% 80% at 50% 32%, transparent 42%, rgba(244,242,238,0.6) 100%)",
        }}
      />

      {/* ── Layer 2: the SAME full-bleed image kept SHARP, clipped to the
             centred rounded window (perfectly aligned with the blur below) ── */}
      <div className="absolute inset-0" style={{ clipPath: WINDOW_CLIP }}>
        {slides.map((s, i) => (
          <div
            key={s._id || i}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={s.image?.url || "/assets/placeholder.svg"}
              alt={s.title || "Banner"}
              fill
              priority={i === 0}
              quality={100}
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
        ))}
        {/* gentle right-side + bottom shade inside the window for text legibility */}
        <div className="absolute inset-0 bg-linear-to-l from-black/35 via-transparent to-transparent" />
      </div>

      {/* ── Window frame: border + soft drop shadow that casts onto the blur ── */}
      <div
        className="pointer-events-none absolute rounded-[28px] border border-white/50 shadow-[0_40px_90px_-30px_rgba(30,25,20,0.5)]"
        style={INSET}
      />

      {/* ── Content anchored to the window rectangle (whole window is a link) ── */}
      <div
        className={`absolute ${slide.buttonLink ? "cursor-pointer" : ""}`}
        style={INSET}
        onClick={goToLink}
      >
        {/* badge — top-left */}
        {slide.badge && (
          <span className="absolute left-4 top-4 inline-block rounded-full border border-white/25 bg-black/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm sm:left-6 sm:top-6">
            {slide.badge}
          </span>
        )}

        {/* description card — top-right */}
        {(slide.subtitle || slide.buttonText) && (
          <div className="absolute right-4 top-4 max-w-52 rounded-3xl border border-white/20 bg-black/15 p-5 text-right backdrop-blur-xl sm:right-6 sm:top-6 sm:max-w-xs">
            {slide.subtitle && (
              <p className="text-xs font-light leading-relaxed text-white/95 sm:text-[13px] sm:leading-relaxed">
                {slide.subtitle}
              </p>
            )}
            {slide.buttonText && slide.buttonLink && (
              <Link
                href={slide.buttonLink}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#1D1D1F] shadow-sm transition hover:bg-white/90 sm:text-xs"
              >
                {slide.buttonText}
                <svg
                  className="h-3.5 w-3.5"
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
              </Link>
            )}
          </div>
        )}

        {/* dots — bottom center of the window */}
        {total > 1 && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s._id || i}
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(i);
                }}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === current
                    ? "w-6 bg-white"
                    : "w-1.5 bg-white/60 hover:bg-white/90"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Big title — bottom-left, over the blurred surround ── */}
      {slide.title && (
        <h1
          onClick={goToLink}
          style={{ left: SIDE }}
          className={`${playfair.className} absolute bottom-6 max-w-[60%] cursor-pointer text-xl font-bold uppercase leading-[1.05] tracking-tight text-[#2A2622] text-balance sm:bottom-9 sm:text-3xl lg:text-[2.7rem]`}
        >
          {renderHighlight(slide.title)}
        </h1>
      )}

      {/* ── Thumbnails — bottom-right, over the blurred surround ── */}
      {thumbs.length > 0 && (
        <div
          style={{ right: SIDE }}
          className="absolute bottom-6 hidden items-center gap-2.5 sm:flex"
        >
          {thumbs.map(({ s, i }) => (
            <button
              key={s._id || i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="group relative h-11 w-11 overflow-hidden rounded-xl border border-white/70 bg-white shadow-lg ring-1 ring-black/5 transition hover:scale-105 md:h-12 md:w-12 lg:h-14 lg:w-14"
            >
              <Image
                src={s.image?.url || "/assets/placeholder.svg"}
                alt={s.title || `Slide ${i + 1}`}
                fill
                sizes="80px"
                className="object-cover transition group-hover:scale-110"
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default Banner;
