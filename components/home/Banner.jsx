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
      7000,
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

  // words wrapped in *asterisks* render in the violet highlight color
  const renderHighlight = (text) =>
    String(text)
      .split(/(\*[^*]+\*)/g)
      .map((part, i) =>
        part.startsWith("*") && part.endsWith("*") ? (
          <span key={i} className="text-[#5B21B6]">
            {part.slice(1, -1)}
          </span>
        ) : (
          part
        ),
      );

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
    <section style={{ background: BG_GRADIENT }}>
      {/* overflow-x-clip: side texts can slide in without a horizontal scrollbar */}
      <div
        className="relative max-w-7xl mx-auto overflow-x-clip"
        onMouseEnter={() => clearInterval(autoRef.current)}
        onMouseLeave={startAuto}
      >
        <div
          key={slide._id || current}
          className="banner-fade flex flex-col md:grid md:grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-6 px-4 md:px-6 py-8 md:py-0 md:h-110"
        >
          {/* Left text — nudged up so it clears the bottom arrows */}
          <div className="banner-slide-left text-center md:text-left max-w-xs md:max-w-sm md:mb-24">
            {slide.badge && (
              <p className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.25em] text-[#6B7280] mb-2.5">
                {slide.badge}
              </p>
            )}
            {slide.title && (
              <h1 className="text-3xl md:text-4xl xl:text-5xl font-bold tracking-tight text-[#1F2937] leading-[1.12] text-balance mb-4">
                {renderHighlight(slide.title)}
              </h1>
            )}
            {slide.subtitle && (
              <p className="text-sm text-[#6B7280] leading-relaxed mb-6 max-w-70 mx-auto md:mx-0">
                {slide.subtitle}
              </p>
            )}
            {slide.buttonText && slide.buttonLink && (
              <Link
                href={slide.buttonLink}
                className="inline-block bg-[#5B21B6] hover:bg-[#4C1D95] text-[#FFFFFF] text-xs md:text-sm font-semibold uppercase tracking-wider px-7 py-3 rounded-md transition"
              >
                {slide.buttonText}
              </Link>
            )}
          </div>

          {/* Center image — stays fully inside the banner band */}
          <div
            className={`relative w-full md:w-105 lg:w-120 xl:w-130 h-60 sm:h-75 md:h-100 lg:h-105 cursor-pointer ${
              hasSideText ? "z-10" : "md:col-span-3 md:w-full md:h-110"
            }`}
            onClick={() => {
              if (slide?.buttonLink) router.push(slide.buttonLink);
            }}
          >
            {/* Soft glow halo behind the product image */}
            {hasSideText && (
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-3/5 rounded-full blur-3xl"
                style={{
                  background:
                    "radial-gradient(closest-side, rgba(91,33,182,0.16), rgba(196,181,253,0.10) 55%, transparent 100%)",
                }}
              />
            )}
            <Image
              src={slide.image?.url || "/assets/placeholder.svg"}
              alt={slide.title || "Banner"}
              fill
              priority
              quality={100}
              sizes="(max-width: 768px) 100vw, 540px"
              className={
                hasSideText
                  ? "banner-image object-contain drop-shadow-[0_35px_40px_rgba(15,23,42,0.30)]"
                  : "object-cover"
              }
            />
          </div>

          {/* Right text — nudged up so it clears the bottom arrows */}
          <div className="banner-slide-right text-center md:text-right max-w-xs md:max-w-sm md:justify-self-end md:mb-24">
            {slide.rightTitle && (
              <h2 className="text-xl md:text-2xl xl:text-3xl font-bold tracking-tight text-[#1F2937] leading-snug text-balance mb-3">
                {renderHighlight(slide.rightTitle)}
              </h2>
            )}
            {slide.rightText && (
              <p className="text-sm text-[#6B7280] leading-relaxed max-w-70 mx-auto md:mx-0 md:ml-auto">
                {slide.rightText}
              </p>
            )}
          </div>
        </div>

        {/* Prev / Next arrows — minimal chevrons at the bottom corners */}
        {total > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Previous slide"
              className="absolute left-4 md:left-10 bottom-2 md:bottom-4 p-2 text-gray-800 hover:text-[#5B21B6] hover:-translate-x-0.5 transition z-20"
            >
              <svg
                className="w-5 h-5 md:w-6 md:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next slide"
              className="absolute right-4 md:right-10 bottom-2 md:bottom-4 p-2 text-gray-800 hover:text-[#5B21B6] hover:translate-x-0.5 transition z-20"
            >
              <svg
                className="w-5 h-5 md:w-6 md:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      <style jsx global>{`
        .banner-fade {
          animation: bannerFade 0.5s ease;
        }
        .banner-slide-left {
          animation: bannerSlideLeft 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.15s
            both;
        }
        .banner-slide-right {
          animation: bannerSlideRight 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.25s
            both;
        }
        /* image pops in first, then keeps gently floating */
        .banner-image {
          animation:
            bannerImageIn 0.9s cubic-bezier(0.22, 1, 0.36, 1) both,
            bannerFloat 5s ease-in-out 1s infinite alternate;
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
            transform: translateX(-70px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes bannerSlideRight {
          from {
            opacity: 0;
            transform: translateX(70px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes bannerImageIn {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.92);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes bannerFloat {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-10px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .banner-fade,
          .banner-slide-left,
          .banner-slide-right,
          .banner-image {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
};

export default Banner;
