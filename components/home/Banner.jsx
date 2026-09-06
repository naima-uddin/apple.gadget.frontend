"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

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

  // words wrapped in *asterisks* render in a lighter, italic accent
  const renderHighlight = (text) =>
    String(text)
      .split(/(\*[^*]+\*)/g)
      .map((part, i) =>
        part.startsWith("*") && part.endsWith("*") ? (
          <span key={i} className="italic font-light text-gray-400">
            {part.slice(1, -1)}
          </span>
        ) : (
          part
        ),
      );

  const slide = slides[current] || slides[0];
  if (!slide) return <section className="h-140 bg-[#EDEBE7]" />;

  // the other slides shown as small thumbnails (up to 3)
  const thumbs = slides
    .map((s, i) => ({ s, i }))
    .filter((x) => x.i !== current)
    .slice(0, 3);

  const goToLink = () => {
    if (slide?.buttonLink) router.push(slide.buttonLink);
  };

  return (
    <section
      className="relative w-full overflow-hidden -mt-12 md:-mt-14"
      onMouseEnter={() => clearInterval(autoRef.current)}
      onMouseLeave={startAuto}
    >
      {/* ── Blurred backdrop: the same active image, scaled up + heavily
             blurred, filling the whole band behind the clear card ── */}
      <div className="absolute inset-0">
        {slides.map((s, i) => (
          <div
            key={s._id || i}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden="true"
          >
            <Image
              src={s.image?.url || "/assets/placeholder.svg"}
              alt=""
              fill
              priority={i === 0}
              quality={60}
              sizes="100vw"
              className="scale-110 object-cover blur-2xl"
            />
          </div>
        ))}
        {/* light wash so the surrounding blur reads soft + keeps the title
            (dark text) and the frosted navbar legible */}
        <div className="absolute inset-0 bg-white/55" />
      </div>

      {/* ── Foreground ── */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6 md:pt-20">
        <div className="relative">
          {/* CLEAR hero card */}
          <div className="relative h-95 overflow-hidden rounded-[28px] shadow-2xl ring-1 ring-black/5 sm:h-115 lg:h-130">
            {slides.map((s, i) => (
              <div
                key={s._id || i}
                className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                  i === current ? "opacity-100" : "opacity-0"
                }`}
                aria-hidden={i === current ? undefined : true}
              >
                <Image
                  src={s.image?.url || "/assets/placeholder.svg"}
                  alt={s.title || "Banner"}
                  fill
                  priority={i === 0}
                  quality={100}
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  className="object-cover object-center"
                />
              </div>
            ))}
            {/* soft scrim for the overlaid text */}
            <div className="absolute inset-0 bg-linear-to-l from-black/45 via-transparent to-black/10" />

            {/* badge chip — top-left */}
            {slide.badge && (
              <span className="absolute left-5 top-5 inline-block rounded-full border border-white/25 bg-black/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm">
                {slide.badge}
              </span>
            )}

            {/* top-right glassy description card */}
            {(slide.subtitle || slide.buttonText) && (
              <div className="absolute right-4 top-4 max-w-60 rounded-2xl border border-white/15 bg-black/30 p-5 text-right backdrop-blur-md sm:right-6 sm:top-6 sm:max-w-xs">
                {slide.subtitle && (
                  <p className="text-xs leading-relaxed text-white/90 sm:text-sm">
                    {slide.subtitle}
                  </p>
                )}
                {slide.buttonText && slide.buttonLink && (
                  <Link
                    href={slide.buttonLink}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#1D1D1F] transition hover:bg-white/90 sm:text-sm"
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

            {/* dots — bottom center inside the card */}
            {total > 1 && (
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
                {slides.map((s, i) => (
                  <button
                    key={s._id || i}
                    onClick={() => goTo(i)}
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

          {/* thumbnails — float over the card's lower-right corner */}
          {thumbs.length > 0 && (
            <div className="absolute -bottom-5 right-3 hidden items-center gap-2.5 sm:flex md:right-5">
              {thumbs.map(({ s, i }) => (
                <button
                  key={s._id || i}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className="group relative h-14 w-14 overflow-hidden rounded-2xl border border-white/70 bg-white shadow-lg ring-1 ring-black/5 transition hover:scale-105 md:h-16 md:w-16 lg:h-20 lg:w-20"
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

          {/* big title — sits just below the card, over the blurred backdrop */}
          {slide.title && (
            <h1
              onClick={goToLink}
              className="mt-6 max-w-3xl cursor-pointer text-3xl font-bold uppercase leading-[1.05] tracking-tight text-[#1D1D1F] text-balance sm:mt-8 sm:text-5xl lg:text-6xl"
            >
              {renderHighlight(slide.title)}
            </h1>
          )}
        </div>
      </div>
    </section>
  );
};

export default Banner;
