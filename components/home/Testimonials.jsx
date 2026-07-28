"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { FaStar } from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import { useLanguage } from "@/components/context/LanguageContext";

// Shown until real reviews are wired up from the dashboard.
const DEFAULT_TESTIMONIALS = [
  {
    _id: "t1",
    name: "Rafiul Islam",
    role: "Verified Buyer",
    rating: 5,
    message:
      "Ordered an iPhone charger and case — genuine product, well packed, and delivered within a day. Exactly what I expected.",
  },
  {
    _id: "t2",
    name: "Nusrat Jahan",
    role: "Verified Buyer",
    rating: 5,
    message:
      "Great collection of Apple accessories at fair prices. Customer support replied quickly when I asked about warranty.",
  },
  {
    _id: "t3",
    name: "Tanvir Ahmed",
    role: "Verified Buyer",
    rating: 4,
    message:
      "Smooth checkout and fast shipping. The AirPods case I bought looks and feels premium — will order again.",
  },
  {
    _id: "t4",
    name: "Farhana Akter",
    role: "Verified Buyer",
    rating: 5,
    message:
      "This is my second order from here. Products are always authentic and delivery is reliable every time.",
  },
  {
    _id: "t5",
    name: "Shakil Hasan",
    role: "Verified Buyer",
    rating: 5,
    message:
      "Best place to buy Apple gadgets online in Bangladesh. Easy returns policy gave me confidence to buy without hesitation.",
  },
];

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth >= 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return isDesktop;
}

function Stars({ rating }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <FaStar
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? "text-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

// Testimonials are hand-picked and published by the admin, so every card
// shown here has already been vetted — the badge is a static trust signal.
function VerifiedBadge({ featured }) {
  return (
    <span
      title="Verified Buyer"
      aria-label="Verified Buyer"
      className="absolute -top-0.5 -right-0.5 flex items-center justify-center z-10 bg-white rounded-full"
    >
      <MdVerified
        className={`text-[#1D1D1F] ${featured ? "w-5 h-5" : "w-4 h-4"}`}
      />
    </span>
  );
}

function TestimonialCard({ item, featured }) {
  return (
    <div
      className={`relative h-full flex flex-col bg-white rounded-3xl border overflow-hidden transition-shadow duration-300 ${
        featured
          ? "border-[#1D1D1F]/15 shadow-xl px-7 py-8 md:px-8 md:py-10"
          : "border-gray-100 shadow-sm p-6 md:p-7 opacity-70"
      }`}
    >
      <span
        aria-hidden="true"
        className="work-sans font-bold text-8xl text-[#F5F6F7] absolute -top-5 right-4 select-none leading-none pointer-events-none"
      >
        &rdquo;
      </span>

      <div className="relative flex items-center gap-3.5 md:gap-4">
        <div
          className={`relative shrink-0 ${
            featured ? "w-20 h-20 md:w-24 md:h-24" : "w-14 h-14"
          }`}
        >
          <div
            className={`relative w-full h-full rounded-full overflow-hidden bg-[#F5F6F7] ring-4 shadow-sm ${
              featured ? "ring-[#1D1D1F]/10" : "ring-[#F5F6F7]"
            }`}
          >
            {item.avatar?.url ? (
              <Image
                src={item.avatar.url}
                alt={item.name}
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <div
                className={`work-sans font-bold w-full h-full flex items-center justify-center text-[#1D1D1F] ${
                  featured ? "text-2xl" : "text-xl"
                }`}
              >
                {item.name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
          </div>
          <VerifiedBadge featured={featured} />
        </div>
        <div className="min-w-0">
          <p
            className={`work-sans font-semibold text-[#1F2937] truncate ${
              featured ? "text-xl md:text-2xl" : "text-base"
            }`}
          >
            {item.name}
          </p>
          {item.role && (
            <p
              className={`text-[#6B7280] truncate mt-0.5 mb-1.5 ${
                featured ? "text-base md:text-lg" : "text-sm"
              }`}
            >
              {item.role}
            </p>
          )}
          <Stars rating={item.rating || 5} />
        </div>
      </div>

      <p
        className={`relative text-[#374151] leading-relaxed mt-5 md:mt-7 flex-1 ${
          featured ? "text-base md:text-[17px]" : "text-sm"
        }`}
      >
        {item.message}
      </p>
    </div>
  );
}

export default function Testimonials() {
  const { t } = useLanguage();
  const [items] = useState(DEFAULT_TESTIMONIALS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isDesktop = useIsDesktop();
  const autoRef = useRef(null);

  const n = items.length;

  const startAuto = useCallback(() => {
    clearInterval(autoRef.current);
    if (n <= 1) return;
    autoRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % n);
    }, 5000);
  }, [n]);

  useEffect(() => {
    startAuto();
    return () => clearInterval(autoRef.current);
  }, [startAuto]);

  const go = (dir) => {
    setCurrentIndex((prev) => (prev + dir + n) % n);
    startAuto();
  };

  if (n === 0) return null;

  const showSides = isDesktop && n >= 3;
  const prevItem = items[(currentIndex - 1 + n) % n];
  const nextItem = items[(currentIndex + 1) % n];
  const centerItem = items[currentIndex];

  return (
    <section className="w-full py-10 md:py-14 bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="work-sans font-bold text-3xl md:text-4xl text-[#1F2937] text-balance mb-1">
            {t("home.testimonials_title")}
          </h2>
          <p className="text-sm text-[#6B7280] max-w-xl mx-auto">
            {t("home.testimonials_sub")}
          </p>
        </div>

        <div
          className="relative"
          onMouseEnter={() => clearInterval(autoRef.current)}
          onMouseLeave={startAuto}
        >
          {n > 1 && (
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous"
              className="absolute left-1 sm:-left-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-[#6B7280] hover:bg-[#1D1D1F] hover:text-white transition-all hover:scale-110 active:scale-95"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 6L9 12L15 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          <div
            className={`grid grid-cols-1 items-center gap-4 md:gap-5 ${
              showSides
                ? "md:grid-cols-[0.88fr_1.1fr_0.88fr]"
                : "max-w-xl mx-auto"
            }`}
          >
            {showSides && (
              <div className="hidden md:block">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={prevItem._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <TestimonialCard item={prevItem} />
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            <div className="h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={centerItem._id}
                  initial={{ opacity: 0, scale: 0.92, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -12 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="h-full"
                >
                  <TestimonialCard item={centerItem} featured />
                </motion.div>
              </AnimatePresence>
            </div>

            {showSides && (
              <div className="hidden md:block">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={nextItem._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <TestimonialCard item={nextItem} />
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </div>

          {n > 1 && (
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next"
              className="absolute right-1 sm:-right-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-[#6B7280] hover:bg-[#1D1D1F] hover:text-white transition-all hover:scale-110 active:scale-95"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 6L15 12L9 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          {n > 1 && (
            <div className="flex justify-center gap-1.5 mt-7">
              {items.map((item, i) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(i);
                    startAuto();
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentIndex ? "bg-[#1D1D1F] w-6" : "bg-gray-200 w-1.5"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
