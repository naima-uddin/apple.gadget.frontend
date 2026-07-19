"use client";

import React, { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useLanguage } from "@/components/context/LanguageContext";
import SectionHeader from "./SectionHeader";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

function CouponCopy({ code }) {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="mt-2 inline-flex items-center gap-1.5 self-start bg-[#5B21B6] hover:bg-[#4C1D95] rounded-md px-3 py-1.5 text-[11px] font-bold tracking-wide text-white transition"
    >
      {copied ? (
        <span>{t("offers.copied")}</span>
      ) : (
        <>
          <span className="opacity-80">{t("offers.use_code")}:</span>
          <span>{code}</span>
        </>
      )}
    </button>
  );
}

function OfferCard({ offer }) {
  const { t: tr } = useLanguage();
  const couponLabel = tr("offers.coupon_label");
  return (
    <div className="relative flex bg-[#1D1D1F] rounded-2xl overflow-hidden h-44 shadow-lg">
      {/* Ticket-perforation notches on the seam between the stub and the body */}
      <div className="absolute -top-3 left-16 -translate-x-1/2 w-6 h-6 bg-white rounded-full z-10" />
      <div className="absolute -bottom-3 left-16 -translate-x-1/2 w-6 h-6 bg-white rounded-full z-10" />
      <div className="absolute left-16 -translate-x-1/2 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-[#5B21B6]/50" />

      {/* Ticket stub: vertical COUPON label */}
      <div className="w-16 shrink-0 flex items-center justify-center">
        <span
          className="text-[10px] font-bold tracking-[0.3em] text-white/25 uppercase whitespace-nowrap"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          {couponLabel} • {couponLabel} • {couponLabel}
        </span>
      </div>

      {/* Ticket body */}
      <div className="flex-1 min-w-0 flex flex-col justify-center px-5 py-4">
        {(offer.title || offer.spend) && (
          <p className="text-[11px] font-semibold tracking-wide text-white/45 uppercase mb-1 truncate">
            {offer.title || `${tr("offers.spend_label")} ${offer.spend}`}
          </p>
        )}
        <h2 className="text-xl sm:text-2xl font-extrabold text-white uppercase leading-tight">
          {offer.highlight}
          {offer.highlightSecondary ? ` ${offer.highlightSecondary}` : ""}
        </h2>
        {(offer.subtitle || offer.description) && (
          <p className="text-xs text-white/55 mt-1 truncate">
            {offer.subtitle || offer.description}
          </p>
        )}
        {offer.couponCode && <CouponCopy code={offer.couponCode} />}
      </div>
    </div>
  );
}

export default function OffersToSayYes() {
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/discounts`)
      .then((r) => r.json())
      .then((d) =>
        setOffers(
          d.items && d.items.length
            ? d.items
            : [
                {
                  _id: "tmp1",
                  title: "On purchase of 2+ styles",
                  highlight: "Get Extra 15% Off",
                  subtitle: "Limited time offer",
                  couponCode: "TWO15",
                },
                {
                  _id: "tmp2",
                  spend: "1999 TK",
                  highlight: "Free",
                  highlightSecondary: "Delivery",
                  subtitle: "On all prepaid orders",
                  title: "Auto Applied",
                  couponCode: "FREESHIP",
                },
              ],
        ),
      )
      .catch(() => setOffers([]));
  }, []);

  const slidesToShow = 3;
  const totalSlides = Math.max(1, Math.ceil(offers.length / slidesToShow));

  // Desktop auto-play
  useEffect(() => {
    if (offers.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(timer);
  }, [totalSlides, offers.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);

  const nextMobile = () => setMobileIndex((prev) => (prev + 1) % offers.length);
  const prevMobile = () =>
    setMobileIndex((prev) => (prev - 1 + offers.length) % offers.length);

  const visibleOffers = Array.from(
    { length: slidesToShow },
    (_, i) => offers[(currentSlide * slidesToShow + i) % offers.length],
  );

  if (offers.length === 0) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 md:px-6 lg:px-8 py-8">
      {/* Header */}
      <SectionHeader
        title={
          <>
            <span className="text-[#1D1D1F]">
              {t("offers.title_highlight")}
            </span>{" "}
            {t("offers.title_rest")}
          </>
        }
      />

      {/* ── Mobile slider: one card at a time (hidden on md+) ── */}
      <div className="relative md:hidden">
        <button
          onClick={prevMobile}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:border hover:border-[#1D1D1F] transition"
        >
          <FaChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={nextMobile}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:border hover:border-[#1D1D1F] transition"
        >
          <FaChevronRight className="w-4 h-4" />
        </button>

        {/* Sliding track */}
        <div className="overflow-hidden rounded-lg">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${mobileIndex * 100}%)` }}
          >
            {offers.map((offer) => (
              <div key={offer._id} className="w-full shrink-0">
                <OfferCard offer={offer} />
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-4">
          {offers.map((_, index) => (
            <button
              key={index}
              onClick={() => setMobileIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === mobileIndex
                  ? "bg-[#1D1D1F] w-8"
                  : "bg-gray-300 w-2 hover:bg-gray-400"
              }`}
              aria-label={`Go to offer ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ── Desktop slider: groups of 3 (shown on md+) ── */}
      <div className="relative hidden md:block">
        <button
          onClick={prevSlide}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:shadow-xl hover:border hover:border-[#1D1D1F] transition"
        >
          <FaChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:shadow-xl hover:border hover:border-[#1D1D1F] transition"
        >
          <FaChevronRight className="w-4 h-4" />
        </button>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500">
          {visibleOffers.map((offer) => (
            <OfferCard key={offer._id} offer={offer} />
          ))}
        </div>

        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? "bg-[#1D1D1F] w-8"
                  : "bg-gray-300 w-2 hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
