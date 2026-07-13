"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

const FALLBACK = [
  {
    _id: "fallback-1",
    image: { url: "/banner/Oven_Big_banner_1.jpg" },
    badge: "",
    title: "",
    subtitle: "",
    buttonText: "",
    buttonLink: "/",
    rightTitle: "",
    rightText: "",
  },
];

const Banner = () => {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
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
      5000,
    );
  }, [total]);

  useEffect(() => {
    startAuto();
    return () => clearInterval(autoRef.current);
  }, [startAuto]);

  const go = (dir) => {
    setCurrent((p) => (p + dir + total) % total);
    startAuto();
  };

  // top-to-bottom fade: pure white under the navbar into soft gray at the base
  const BG_GRADIENT =
    "linear-gradient(180deg, #FFFFFF 0%, #FEFDFF 20%, #FAFAFC 40%, #F1F0F5 60%, #EAE9EE 80%, #F3F2F9 100%)";

  const slide = slides[current] || slides[0];
  if (!slide)
    return (
      <section className="h-75 md:h-110" style={{ background: BG_GRADIENT }} />
    );

  const hasSideText =
    slide.badge ||
    slide.title ||
    slide.subtitle ||
    slide.rightTitle ||
    slide.rightText;

  return (
    <section className="md:mb-12 lg:mb-14" style={{ background: BG_GRADIENT }}>
      {/* overflow-x-clip: side texts can slide in without a horizontal scrollbar,
          while the center image is free to hang below the banner's bottom edge */}
      <div
        className="relative max-w-7xl mx-auto overflow-x-clip"
        onMouseEnter={() => clearInterval(autoRef.current)}
        onMouseLeave={startAuto}
      >
        <div
          key={slide._id || current}
          className="banner-fade flex flex-col md:grid md:grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-6 px-4 md:px-6 py-8 md:py-0 md:h-110"
        >
          {/* Left text */}
          <div className="banner-slide-left order-2 md:order-1 text-center md:text-left max-w-xs md:max-w-sm">
            {slide.badge && (
              <p className="text-sm md:text-base text-gray-500 mb-1">
                {slide.badge}
              </p>
            )}
            {slide.title && (
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight mb-3">
                {slide.title}
              </h1>
            )}
            {slide.subtitle && (
              <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-5">
                {slide.subtitle}
              </p>
            )}
            {slide.buttonText && slide.buttonLink && (
              <Link
                href={slide.buttonLink}
                className="inline-block bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs md:text-sm font-semibold uppercase tracking-wider px-7 py-3 rounded-md transition"
              >
                {slide.buttonText}
              </Link>
            )}
          </div>

          {/* Center image — hangs below the banner edge for a floating look */}
          <div
            className={`order-1 md:order-2 relative w-full md:w-105 lg:w-120 h-55 sm:h-70 md:h-110 cursor-pointer ${
              hasSideText
                ? "z-10 md:translate-y-14 lg:translate-y-16"
                : "md:col-span-3 md:w-full"
            }`}
            onClick={() => {
              if (slide?.buttonLink) router.push(slide.buttonLink);
            }}
          >
            <Image
              src={slide.image?.url || "/assets/placeholder.svg"}
              alt={slide.title || "Banner"}
              fill
              priority
              quality={100}
              sizes="(max-width: 768px) 100vw, 500px"
              className={
                hasSideText
                  ? "object-contain drop-shadow-[0_30px_35px_rgba(0,0,0,0.18)]"
                  : "object-cover"
              }
            />
          </div>

          {/* Right text */}
          <div className="banner-slide-right order-3 text-center md:text-right max-w-xs md:max-w-sm md:justify-self-end">
            {slide.rightTitle && (
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 leading-tight mb-3">
                {slide.rightTitle}
              </h2>
            )}
            {slide.rightText && (
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                {slide.rightText}
              </p>
            )}
          </div>
        </div>

        {/* Prev / Next arrows */}
        {total > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Previous slide"
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full text-gray-700 hover:bg-white hover:shadow-md transition z-10"
            >
              <svg
                className="w-4 h-4 md:w-5 md:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next slide"
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full text-gray-700 hover:bg-white hover:shadow-md transition z-10"
            >
              <svg
                className="w-4 h-4 md:w-5 md:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* Dots */}
        {total > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => {
                  setCurrent(i);
                  startAuto();
                }}
                className={`h-1.5 rounded-full transition-all ${
                  i === current ? "bg-[#2563EB] w-5" : "bg-gray-300 w-1.5"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .banner-fade {
          animation: bannerFade 0.5s ease;
        }
        .banner-slide-left {
          animation: bannerSlideLeft 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .banner-slide-right {
          animation: bannerSlideRight 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes bannerFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes bannerSlideLeft {
          from {
            opacity: 0;
            transform: translateX(-60px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes bannerSlideRight {
          from {
            opacity: 0;
            transform: translateX(60px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .banner-fade,
          .banner-slide-left,
          .banner-slide-right {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
};

export default Banner;
