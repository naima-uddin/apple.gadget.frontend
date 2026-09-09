"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import ProductCard from "@/components/product/ProductCard";
import { useLanguage } from "@/components/context/LanguageContext";
import SectionHeader from "./SectionHeader";

// Resolves the responsive slider geometry for the current viewport:
//  • perView    – how many whole cards to step past per arrow/swipe (drives maxIndex)
//  • cardWidth  – each card's width as a % of the track. On phones this is < 100/perView
//                 so the *next* card peeks in from the right, inviting a swipe.
//  • imageHeight – card image height tuned to that width (narrow cards → shorter image).
function useResponsiveSlider() {
  const [state, setState] = useState({
    perView: 2,
    cardWidth: 50,
    imageHeight: 160,
  });
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1280)
        setState({ perView: 5, cardWidth: 20, imageHeight: 220 });
      else if (w >= 1024)
        setState({ perView: 4, cardWidth: 25, imageHeight: 210 });
      else if (w >= 768)
        setState({ perView: 3, cardWidth: 100 / 3, imageHeight: 200 });
      else if (w >= 640)
        setState({ perView: 2, cardWidth: 50, imageHeight: 200 });
      // Phones (< sm): two per row using the same vertical ProductCard as
      // desktop — matches the rest of the site instead of a special layout.
      else
        setState({ perView: 2, cardWidth: 50, imageHeight: 210 });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return state;
}

// Exported so FeaturedRow.jsx (individually-placed carousels) can reuse the
// exact same slider mechanics instead of duplicating them.
export function FeaturedSlider({ products }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { perView, cardWidth, imageHeight } = useResponsiveSlider();
  const maxIndex = Math.max(0, products.length - perView);
  const autoRef = useRef(null);
  const touchX = useRef(null);

  const startAuto = useCallback(() => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4000);
  }, [maxIndex]);

  useEffect(() => {
    startAuto();
    return () => clearInterval(autoRef.current);
  }, [startAuto]);

  // When the viewport (and thus perView/maxIndex) changes, keep the
  // current slide within range so the track can't over-translate into blanks.
  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  const go = (dir) => {
    setCurrentIndex((prev) => {
      const next = prev + dir;
      if (next < 0) return maxIndex;
      if (next > maxIndex) return 0;
      return next;
    });
    startAuto();
  };

  // Touch swipe (phones/tablets) — a horizontal drag past a small threshold
  // advances one slide in that direction.
  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  const dots = Array.from({ length: maxIndex + 1 });

  return (
    <div
      className="relative"
      onMouseEnter={() => clearInterval(autoRef.current)}
      onMouseLeave={startAuto}
    >
      {/* Arrows are hidden on phones (swipe + peek do the job there) and shown
          from sm up. */}
      {maxIndex > 0 && (
        <button
          onClick={() => go(-1)}
          className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 sm:-translate-x-4 z-10 w-8 h-8 text-base leading-none bg-white shadow-md rounded-full items-center justify-center text-gray-600 hover:bg-[#1D1D1F] hover:text-white transition"
          aria-label="Previous"
        >
          ‹
        </button>
      )}

      {/* Track — clip horizontally only so card shadows aren't cut off vertically */}
      <div className="overflow-x-hidden overflow-y-visible">
        <div
          className="flex transition-transform duration-500 ease-in-out pb-1.5 sm:pb-3"
          style={{ transform: `translateX(-${currentIndex * cardWidth}%)` }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {products.map((product, i) => (
            <div
              key={product._id || i}
              className="shrink-0 px-1 sm:px-2.5 py-1"
              style={{ width: `${cardWidth}%` }}
            >
              <ProductCard
                product={product}
                showDiscount={true}
                maxTags={2}
                showActionsOnHover={true}
                imageHeight={imageHeight}
                imageFit="cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right arrow */}
      {maxIndex > 0 && (
        <button
          onClick={() => go(1)}
          className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 sm:translate-x-4 z-10 w-8 h-8 text-base leading-none bg-white shadow-md rounded-full items-center justify-center text-gray-600 hover:bg-[#1D1D1F] hover:text-white transition"
          aria-label="Next"
        >
          ›
        </button>
      )}

      {/* Dots */}
      {dots.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-1.5 sm:mt-4">
          {dots.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentIndex(i);
                startAuto();
              }}
              className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? "bg-[#1D1D1F] w-4" : "bg-gray-300"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FeaturedSections() {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
  const { t, lang } = useLanguage();
  const [sections, setSections] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/featured`)
      .then((r) => r.json())
      .then((b) =>
        setSections(
          (b.items || []).filter(
            (s) => s.type !== "video" && s.products && s.products.length > 0,
          ),
        ),
      )
      .catch(() => setSections([]))
      .finally(() => setLoaded(true));
  }, [API]);

  if (!loaded || sections.length === 0) return null;

  return (
    // each dashboard section gets its own gray band; the white page background
    // shows through the space between bands
    <section className="w-full py-2 sm:py-4 space-y-3 sm:space-y-6 md:space-y-8 bg-white">
      {sections.map((sec) => (
        <div key={sec._id} className="w-full bg-[#F0F9FF] py-3 sm:py-6 md:py-8">
          <div className="max-w-7xl mx-auto px-1.5 sm:px-4">
            {/* Section header */}
            <SectionHeader
              title={lang === "bn" ? sec.titleBn || sec.title : sec.title}
              seeMoreHref={
                sec.viewAllLink && sec.viewAllLink !== "/"
                  ? sec.viewAllLink
                  : undefined
              }
              seeMoreLabel={t("home.see_more")}
            />
            {/* Product slider */}
            <FeaturedSlider products={sec.products} />
          </div>
        </div>
      ))}
    </section>
  );
}
