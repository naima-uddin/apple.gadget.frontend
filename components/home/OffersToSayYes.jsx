"use client";

import React, { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { HiOutlineClipboardCopy, HiCheck } from "react-icons/hi";
import { useLanguage } from "@/components/context/LanguageContext";
import SectionHeader from "./SectionHeader";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

const DEFAULT_BG = "#1D1D1F";
const DEFAULT_BUTTON = "#1D1D1F"; // Apple-default monochrome accent (never violet)
const DEFAULT_TEXT = "#FFFFFF";
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const safeColor = (value, fallback) => (HEX_RE.test(value) ? value : fallback);

/* ── Color utilities ─────────────────────────────────────────────── */
const toRgb = (hex) => ({
  r: parseInt(hex.slice(1, 3), 16),
  g: parseInt(hex.slice(3, 5), 16),
  b: parseInt(hex.slice(5, 7), 16),
});
// Relative luminance → pick black/white ink that stays readable on any color.
const readableInk = (hex) => {
  const { r, g, b } = toRgb(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? "#111111" : "#FFFFFF";
};
const withAlpha = (hex, alpha) => {
  const { r, g, b } = toRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/* ── Derived discount display (for the stub) ─────────────────────── */
function discountBadge(offer, tr) {
  const v = Number(offer.discountValue) || 0;
  if (offer.discountType === "free_shipping")
    return { big: tr("offers.free_shipping"), small: null };
  if (offer.discountType === "percentage" && v > 0)
    return { big: `${v}%`, small: tr("offers.off") };
  if (offer.discountType === "fixed" && v > 0)
    return { big: `৳${v}`, small: tr("offers.off") };
  return null;
}

function minSpendText(offer, tr) {
  const min = Number(offer.minOrderAmount) || 0;
  if (min > 0) return `${tr("offers.min_spend")} ৳${min}`;
  if (offer.spend) return `${tr("offers.min_spend")} ${offer.spend}`;
  return null;
}

function expiryText(offer, tr) {
  if (!offer.expiresAt) return null;
  const d = new Date(offer.expiresAt);
  if (isNaN(d)) return null;
  return `${tr("offers.valid_till")} ${d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

/* ── Dashed code chip + copy (lives in the ticket body) ──────────── */
function CouponCopy({ code, text }) {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();
  const copy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <button
      onClick={copy}
      aria-label={`${t("offers.use_code")} ${code}`}
      style={{
        color: text,
        backgroundColor: withAlpha(text, 0.1),
        borderColor: withAlpha(text, 0.4),
      }}
      className="group/btn inline-flex items-center gap-2 rounded-lg border border-dashed px-3 py-1.5 text-[13px] font-bold tracking-wide transition-colors duration-200 hover:bg-white/10 active:scale-95"
    >
      <span className="font-mono tabular-nums">{code}</span>
      {copied ? (
        <HiCheck className="h-4 w-4 shrink-0" />
      ) : (
        <HiOutlineClipboardCopy className="h-4 w-4 shrink-0 opacity-70 transition-opacity group-hover/btn:opacity-100" />
      )}
    </button>
  );
}

function OfferCard({ offer }) {
  const { t: tr } = useLanguage();
  const bg = safeColor(offer.bgColor, DEFAULT_BG);
  const accent = safeColor(offer.buttonColor, DEFAULT_BUTTON);
  const text = safeColor(offer.textColor, DEFAULT_TEXT);
  const stubInk = readableInk(accent);
  const badge = discountBadge(offer, tr);
  const minSpend = minSpendText(offer, tr);
  const expiry = expiryText(offer, tr);
  const couponLabel = tr("offers.coupon_label");

  return (
    <div className="group relative h-full">
      {/* Soft accent glow behind the card on hover */}
      <div
        className="pointer-events-none absolute -inset-1 rounded-[22px] opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-60"
        style={{ background: withAlpha(accent, 0.35) }}
        aria-hidden="true"
      />

      <article className="relative flex h-full min-h-36 sm:min-h-42 overflow-hidden rounded-2xl shadow-[0_12px_30px_-14px_rgba(0,0,0,0.5)] ring-1 ring-black/5 transition-transform duration-300 group-hover:-translate-y-1">
        {/* ── Ticket body ── */}
        <div
          className="relative flex flex-1 flex-col justify-between gap-2.5 p-4 sm:gap-3 sm:p-6"
          style={{ backgroundColor: bg, color: text }}
        >
          {/* subtle depth highlight */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(120% 100% at 0% 0%, ${withAlpha(
                accent,
                0.16,
              )} 0%, transparent 55%)`,
            }}
            aria-hidden="true"
          />

          <div className="relative flex items-start gap-3 sm:gap-3.5">
            {offer.image?.url && (
              <img
                src={offer.image.url}
                alt=""
                loading="lazy"
                className="h-12 w-12 shrink-0 object-contain drop-shadow-sm sm:h-[72px] sm:w-[72px]"
              />
            )}
            <div className="min-w-0">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.28em]"
                style={{ color: withAlpha(text, 0.5) }}
              >
                {couponLabel}
              </span>
              <h3 className="mt-1 text-lg font-extrabold uppercase leading-[1.05] tracking-tight sm:mt-1.5 sm:text-2xl">
                {offer.highlight}
                {offer.highlightSecondary && (
                  <>
                    <br />
                    {offer.highlightSecondary}
                  </>
                )}
              </h3>
              {offer.subtitle && (
                <p
                  className="mt-1.5 line-clamp-2 text-[13px] leading-snug"
                  style={{ color: withAlpha(text, 0.7) }}
                >
                  {offer.subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="relative flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {offer.couponCode && (
              <CouponCopy code={offer.couponCode} text={text} />
            )}
            {minSpend && (
              <span
                className="text-[11px] font-medium"
                style={{ color: withAlpha(text, 0.55) }}
              >
                {minSpend}
              </span>
            )}
          </div>
        </div>

        {/* ── Tear-off stub (two-tone, accent panel) ── */}
        <div
          className="relative flex w-20 shrink-0 flex-col items-center justify-center gap-1 border-l-2 border-dashed px-2 text-center sm:w-26"
          style={{
            backgroundColor: accent,
            color: stubInk,
            borderColor: withAlpha(stubInk, 0.45),
          }}
        >
          {/* carved perforation notches at the seam */}
          <span
            className="absolute -left-2.5 -top-2.5 z-20 h-5 w-5 rounded-full bg-white"
            aria-hidden="true"
          />
          <span
            className="absolute -bottom-2.5 -left-2.5 z-20 h-5 w-5 rounded-full bg-white"
            aria-hidden="true"
          />

          {badge ? (
            <>
              <div className="text-2xl font-black leading-none tracking-tight sm:text-3xl">
                {badge.big}
              </div>
              {badge.small && (
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] opacity-80">
                  {badge.small}
                </div>
              )}
            </>
          ) : (
            <span
              className="text-sm font-black uppercase tracking-[0.35em]"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              {couponLabel}
            </span>
          )}

          {expiry && (
            <div className="mt-1 px-1 text-[9px] font-semibold uppercase leading-tight tracking-wide opacity-75">
              {expiry}
            </div>
          )}
        </div>
      </article>
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
    <div className="w-full max-w-7xl mx-auto px-1 md:px-2 lg:px-3 py-4 md:py-8">
      {/* Header */}
      <SectionHeader
        title={
          <>
            <span className="text-[#1D1D1F]">{titleHighlight}</span> {titleRest}
          </>
        }
      />

      {/* ── Mobile slider: one card at a time (hidden on md+) ── */}
      <div className="relative md:hidden px-3">
        {/* Sliding track */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${mobileIndex * 100}%)` }}
          >
            {offers.map((offer) => (
              <div key={offer._id} className="w-full shrink-0 px-1 py-2">
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 py-2 transition-all duration-500">
          {visibleOffers.map((offer, i) => (
            <OfferCard key={offer?._id || i} offer={offer} />
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
