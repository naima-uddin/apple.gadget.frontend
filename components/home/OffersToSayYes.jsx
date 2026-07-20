"use client";

import React, { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useLanguage } from "@/components/context/LanguageContext";
import SectionHeader from "./SectionHeader";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

const DEFAULT_BG = "#1D1D1F";
const DEFAULT_BUTTON = "#5B21B6";
const DEFAULT_TEXT = "#FFFFFF";
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const safeColor = (value, fallback) => (HEX_RE.test(value) ? value : fallback);

const EDGE_NOTCHES = [8, 26, 44, 62, 80, 98];

function TicketEdge({ side }) {
  return EDGE_NOTCHES.map((top) => (
    <div
      key={`${side}-${top}`}
      className={`absolute w-3.5 h-3.5 bg-white rounded-full z-10 -translate-y-1/2 ${
        side === "left" ? "-left-1.75" : "-right-1.75"
      }`}
      style={{ top: `${top}%` }}
    />
  ));
}

function CouponCopy({ code, buttonColor }) {
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
      style={{ backgroundColor: buttonColor }}
      className="mt-2 inline-flex items-center gap-1.5 self-start hover:opacity-90 rounded-md px-3 py-1.5 text-[11px] font-bold tracking-wide text-white transition"
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
  const bg = safeColor(offer.bgColor, DEFAULT_BG);
  const buttonColor = safeColor(offer.buttonColor, DEFAULT_BUTTON);
  const textColor = safeColor(offer.textColor, DEFAULT_TEXT);
  return (
    <div
      className="relative flex rounded-2xl overflow-hidden h-44 shadow-lg"
      style={{ backgroundColor: bg }}
    >
      {/* Scalloped tear edges on the two outer short sides */}
      <TicketEdge side="left" />
      <TicketEdge side="right" />

      {/* Ticket-perforation notches on the seam between the stub and the body */}
      <div className="absolute -top-3 left-16 -translate-x-1/2 w-6 h-6 bg-white rounded-full z-10" />
      <div className="absolute -bottom-3 left-16 -translate-x-1/2 w-6 h-6 bg-white rounded-full z-10" />
      <div
        className="absolute left-16 -translate-x-1/2 top-0 bottom-0 w-0.5 border-l-2 border-dashed"
        style={{ borderColor: `${buttonColor}80` }}
      />

      {/* Ticket stub: vertical COUPON label */}
      <div className="w-16 shrink-0 flex items-center justify-center">
        <span
          className="text-[10px] font-bold tracking-[0.3em] uppercase whitespace-nowrap opacity-30"
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            color: textColor,
          }}
        >
          {couponLabel} • {couponLabel} • {couponLabel}
        </span>
      </div>

      {/* Ticket body: title, subtitle, coupon code */}
      <div className="flex-1 min-w-0 flex flex-col justify-center px-5 py-4">
        <h2
          className="text-xl sm:text-2xl font-extrabold uppercase leading-tight"
          style={{ color: textColor }}
        >
          {offer.highlight}
        </h2>
        {offer.subtitle && (
          <p
            className="text-xs mt-1 truncate opacity-70"
            style={{ color: textColor }}
          >
            {offer.subtitle}
          </p>
        )}
        {offer.couponCode && (
          <CouponCopy code={offer.couponCode} buttonColor={buttonColor} />
        )}
      </div>
    </div>
  );
}

export default function OffersToSayYes() {
  const { t, lang } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [offers, setOffers] = useState([]);
  const [offersTitle, setOffersTitle] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/discounts`)
      .then((r) => r.json())
      .then((d) => {
        setOffers(d.items || []);
        setOffersTitle(d.offersTitle || null);
      })
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

  const titleHighlight =
    (lang === "bn" ? offersTitle?.highlightBn : offersTitle?.highlight) ||
    t("offers.title_highlight");
  const titleRest =
    (lang === "bn" ? offersTitle?.restBn : offersTitle?.rest) ||
    t("offers.title_rest");

  return (
    <div className="w-full max-w-7xl mx-auto px-1 md:px-2 lg:px-3 py-8">
      {/* Header */}
      <SectionHeader
        title={
          <>
            <span className="text-[#1D1D1F]">{titleHighlight}</span> {titleRest}
          </>
        }
      />

      {/* ── Mobile slider: one card at a time (hidden on md+) ── */}
      <div className="relative md:hidden px-1">
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
      <div className="relative hidden md:block px-2">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500">
          {visibleOffers.map((offer) => (
            <OfferCard key={offer._id} offer={offer} />
          ))}
        </div>

        <div className="flex justify-center gap-2 mt-2">
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
