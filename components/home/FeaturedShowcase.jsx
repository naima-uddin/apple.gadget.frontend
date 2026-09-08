"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaStar, FaShoppingCart, FaBolt } from "react-icons/fa";
import { useCart } from "@/components/context/CartContext";
import { getDisplayPrice } from "@/lib/pricing";
import { getVariantColors } from "@/components/cart/VariantEditModal";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

// Curve silhouette shared by the visible dark panel (SVG fill) and the CSS
// mask that clips the blurred background image to the exact same shape.
// Starbucks-style oval sweep (tuned to match the design), shifted a touch to the
// right so the dark panel is a little smaller: top starts x=83, leftmost ~x=56
// near the bottom — same shape, just pressed rightward.
const CURVE_D = "M100,0 L83,0 C54,18 62,72 56,100 L100,100 Z";
const CURVE_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><path d='${CURVE_D}' fill='white'/></svg>`,
)}")`;

// The showcase renders the admin's per-product chosen image (`showcaseImage`,
// set in the Featured Showcase editor) as the big hero visual. When no override
// is set it deliberately falls back to the product's SECOND image (the
// lifestyle / alternate shot), then the first image.
function heroImage(product) {
  if (product?.showcaseImage) return encodeURI(product.showcaseImage);
  const imgs = (product?.images || []).map((i) => i?.url).filter(Boolean);
  return encodeURI(imgs[1] || imgs[0] || "/assets/placeholder.svg");
}

export default function FeaturedShowcase() {
  const { addToCart } = useCart();
  const router = useRouter();
  // Whole config (title/subtitle + resolved tabs) comes from the admin-driven
  // /api/featured-showcase endpoint; the dashboard editor controls all of it.
  const [showcase, setShowcase] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  // Pause the auto-rotation while the visitor is interacting (hover/focus).
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/api/featured-showcase`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setShowcase(d.showcase || null);
      })
      .catch(() => {
        if (!cancelled) setShowcase(null);
      })
      .finally(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const tabs = showcase?.tabs || [];
  const activeTab = tabs[activeTabIndex] || null;
  const products = activeTab?.products || [];
  const active = products[activeIndex] || null;

  // Auto-advance through the tab's products every 5s (fades via the image key).
  // Pauses on hover/focus and respects reduced-motion.
  useEffect(() => {
    if (paused || products.length <= 1) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % products.length);
    }, 5000);
    return () => clearInterval(id);
  }, [paused, products.length, activeTabIndex]);

  const selectTab = (i) => {
    setActiveTabIndex(i);
    setActiveIndex(0);
  };

  const { price, compareAtPrice, discountPct } = useMemo(
    () => (active ? getDisplayPrice(active) : { price: 0 }),
    [active],
  );

  const variantColors = useMemo(
    () => (active ? getVariantColors(active) : []),
    [active],
  );

  const rating = Math.round(active?.averageRating || 0);
  const tabLabel = activeTab?.label;
  const loading = !loaded;

  // Render nothing until loaded (avoids an empty flash), then hide entirely
  // when the admin disabled it or no tab resolved any products.
  if (!loaded) return null;
  if (!showcase || tabs.length === 0) return null;

  // ── Shared content pieces (used by both the desktop curve layout and the
  //    stacked mobile layout) ──────────────────────────────────────────────

  const infoBlock = active && (
    <>
      <div className="flex items-center gap-2 mb-3">
        {discountPct ? (
          <span className="inline-flex items-center rounded-full bg-[#1D1D1F] text-white text-[11px] font-extrabold tracking-wide px-2.5 py-1 shadow-sm">
            −{discountPct}% OFF
          </span>
        ) : null}
        <span className="inline-flex w-fit items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#1D1D1F]" />
          {tabLabel}
        </span>
      </div>
      <h3 className="text-lg sm:text-3xl font-bold leading-tight text-[#1D1D1F] font-georgia">
        {active.title || active.slug}
      </h3>
      {active.description && (
        <p className="mt-2 text-xs sm:text-sm text-[#6B7280] line-clamp-2 max-w-md">
          {active.description}
        </p>
      )}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex">
          {[0, 1, 2, 3, 4].map((i) => (
            <FaStar
              key={i}
              className={`w-3.5 h-3.5 ${i < rating ? "text-[#1D1D1F]" : "text-gray-300"}`}
            />
          ))}
        </div>
        {active.reviewCount > 0 && (
          <span className="text-xs text-[#6B7280]">({active.reviewCount})</span>
        )}
      </div>
      {variantColors.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          {variantColors.slice(0, 5).map((c, i) => {
            const hex = c.hex?.trim()
              ? c.hex.startsWith("#")
                ? c.hex
                : `#${c.hex}`
              : "#cccccc";
            return (
              <span
                key={i}
                title={c.name}
                className="w-5 h-5 rounded-full inline-block border border-gray-200 ring-1 ring-black/5"
                style={{ backgroundColor: hex }}
              />
            );
          })}
        </div>
      )}
    </>
  );

  const thumbs = products.length > 1 && (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] mb-3">
        More in this pick
      </p>
      <div className="flex items-end gap-4 overflow-x-auto pb-1">
        {products.map((p, i) => (
          <button
            key={p._id || i}
            onClick={() => setActiveIndex(i)}
            title={p.title || p.slug}
            className={`relative shrink-0 h-16 w-16 transition-all duration-300 ${
              i === activeIndex
                ? "scale-110 opacity-100"
                : "opacity-50 hover:opacity-90"
            }`}
          >
            <Image
              src={heroImage(p)}
              alt={p.title || p.slug}
              fill
              sizes="64px"
              className="object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.18)]"
            />
          </button>
        ))}
      </div>
    </div>
  );

  // Rendered on the dark side of the curve — light text on #1D1D1F.
  const orderBlock = active && (
    <>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl sm:text-5xl font-bold tracking-tighter bg-linear-to-b from-[#1D1D1F] to-[#1D1D1F]/70 bg-clip-text text-transparent">
          ৳{price?.toLocaleString()}
        </span>
        {compareAtPrice && compareAtPrice > price && (
          <span className="text-base text-[#1D1D1F]/40 line-through">
            ৳{compareAtPrice.toLocaleString()}
          </span>
        )}
      </div>

      {(active.badges?.includes("best_seller") || activeTab?.type === "top") && (
        <p className="mt-3 text-sm font-semibold text-[#1D1D1F]/80">Bestseller</p>
      )}
      <div className="mt-1.5 flex">
        {[0, 1, 2, 3, 4].map((i) => (
          <FaStar
            key={i}
            className={`w-4 h-4 ${i < (rating || 5) ? "text-[#f5a623]" : "text-[#1D1D1F]/20"}`}
          />
        ))}
      </div>

      {active.freeShipping && (
        <p className="mt-4 text-xs text-[#1D1D1F]/65">✓ Free shipping included</p>
      )}

      <div className="mt-6 flex flex-col gap-2.5">
        {/* Buy Now — straight to checkout (adds the admin-defined quantity) */}
        <button
          onClick={() => {
            addToCart(active, active.showcaseQty || 1, { silent: true });
            router.push("/checkout");
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1D1D1F] text-white px-6 py-3 text-sm font-bold shadow-[0_10px_30px_-8px_rgba(29,29,31,0.5)] hover:bg-black active:scale-[0.98] transition-all"
        >
          <FaBolt className="w-4 h-4 text-white" />
          Buy Now
        </button>
        {/* Add to Cart — adds the admin-defined quantity */}
        <button
          onClick={() => addToCart(active, active.showcaseQty || 1)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-white/60 border border-[#1D1D1F]/15 text-[#1D1D1F] px-6 py-3 text-sm font-bold hover:bg-white/80 active:scale-[0.98] transition-all"
        >
          <FaShoppingCart className="w-4 h-4" />
          Add to Cart
        </button>
        <Link
          href={`/product/${active._id}/`}
          className="inline-flex items-center justify-center rounded-full border border-[#1D1D1F]/25 text-[#1D1D1F] px-6 py-3 text-sm font-semibold hover:bg-[#1D1D1F]/5 transition-all"
        >
          View Details
        </Link>
      </div>
    </>
  );

  const heroImg = active && (
    <Image
      key={active._id}
      src={heroImage(active)}
      alt={active.title || active.slug}
      fill
      sizes="(max-width: 1024px) 70vw, 44vw"
      className="object-contain drop-shadow-[0_28px_40px_rgba(0,0,0,0.30)] animate-[fadeIn_0.5s_ease]"
    />
  );

  const emptyState = (
    <div className="py-16 text-center text-[#6B7280] text-sm">
      {loading ? "Loading products…" : "No products in this pick yet."}
    </div>
  );

  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-6 mt-4 sm:mt-10 mb-6 sm:mb-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Heading + tab buttons */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2.5 sm:gap-4 mb-3 sm:mb-5">
        <div>
          <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#1D1D1F] font-georgia">
            {showcase.title || "Featured Products"}
          </h2>
          {showcase.subtitle && (
            <p className="text-sm text-[#6B7280] mt-1">{showcase.subtitle}</p>
          )}
        </div>
        <div className="flex flex-nowrap gap-1.5 sm:gap-2 overflow-x-auto -mx-1 px-1">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => selectTab(i)}
              className={`shrink-0 whitespace-nowrap px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-[13px] font-semibold backdrop-blur-md transition-all duration-300 active:scale-[0.97] ${
                i === activeTabIndex
                  ? "bg-linear-to-b from-[#2b2b2e] to-[#1D1D1F] text-white border border-white/10 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.2)]"
                  : "bg-white/40 text-[#1D1D1F] border border-white/70 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-white/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[32px] bg-white border border-[#ececf0] ring-1 ring-black/3 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.35)]">
        {/* ───────── DESKTOP: Starbucks-style curved split ───────── */}
        <div className="relative hidden lg:block min-h-[420px]">
          {/* Base dark curved panel with a subtle vertical gradient + a soft
              top sheen for depth (fallback colour if the bg image fails). */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="fsPanel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#CFDAE2" />
                <stop offset="55%" stopColor="#BAC8D3" />
                <stop offset="100%" stopColor="#A6B8C5" />
              </linearGradient>
            </defs>
            <path d={CURVE_D} fill="url(#fsPanel)" />
          </svg>

          {/* Faint top sheen on the panel (clipped to the curve) for depth. */}
          <div
            className="absolute inset-0 z-[1]"
            style={{
              maskImage: CURVE_MASK,
              WebkitMaskImage: CURVE_MASK,
              maskSize: "100% 100%",
              WebkitMaskSize: "100% 100%",
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
            }}
          >
            <div className="absolute inset-0 bg-linear-to-b from-white/30 to-transparent to-45%" />
          </div>

          {/* Left — product info + thumbnail selector (white side) */}
          <div className="absolute inset-y-0 left-0 w-[42%] p-8 xl:p-10 flex flex-col z-20">
            {active ? (
              <>
                {infoBlock}
                <div className="mt-auto pt-6">{thumbs}</div>
              </>
            ) : (
              emptyState
            )}
          </div>

          {/* Center — hero image straddling the curve, on a soft spotlight so
              the product reads as "placed" on the arc. Centered on the curve
              (~60% at mid-height, after the rightward shift) and enlarged so the
              product dominates like the Starbucks reference. */}
          <div className="absolute left-[38%] top-1/2 -translate-y-1/2 w-[44%] h-[92%] z-10">
            <div className="absolute inset-[-14%] bg-[radial-gradient(closest-side,rgba(255,255,255,0.92),rgba(255,255,255,0)_78%)] blur-lg" />
            <div className="relative h-full w-full">
              {heroImg}
            </div>
          </div>

          {/* Right — order panel over the dark curve. A gradient scrim behind
              just this column keeps the white text/price legible while the rest
              of the uploaded image stays clearly visible. */}
          <div className="absolute inset-y-0 right-0 w-[34%] z-15 bg-linear-to-l from-[#BAC8D3]/95 via-[#BAC8D3]/70 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-[26%] p-8 xl:p-10 flex flex-col justify-center text-[#1D1D1F] z-20">
            {orderBlock}
          </div>
        </div>

        {/* ───────── MOBILE / TABLET (< lg): full-bleed image (badges on top), thumbs, price/actions, then description ───────── */}
        <div className="lg:hidden">
          {active ? (
            <>
              {/* Full-bleed hero image — no surrounding padding; discount + tab
                  label overlaid at the top. */}
              <div className="relative w-full aspect-5/4 bg-linear-to-b from-[#CFDAE2] via-[#BAC8D3] to-[#A6B8C5] overflow-hidden">
                <div className="absolute inset-[12%] bg-[radial-gradient(closest-side,rgba(255,255,255,0.6),rgba(255,255,255,0)_75%)] blur-lg" />
                <div className="relative h-full w-full">{heroImg}</div>
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                  {discountPct ? (
                    <span className="inline-flex items-center rounded-full bg-[#1D1D1F] text-white text-[8px] font-extrabold tracking-wide px-1.5 py-0.5 shadow-sm">
                      −{discountPct}% OFF
                    </span>
                  ) : null}
                  {tabLabel && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/85 backdrop-blur-sm ring-1 ring-black/5 text-[8px] font-semibold uppercase tracking-wider text-[#1D1D1F] px-1.5 py-0.5 shadow-sm">
                      <span className="h-1 w-1 rounded-full bg-[#1D1D1F]" />
                      {tabLabel}
                    </span>
                  )}
                </div>
              </div>

              <div className="px-4 py-2.5">
                {/* Thumbnails */}
                {products.length > 1 && (
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {products.map((p, i) => (
                      <button
                        key={p._id || i}
                        onClick={() => setActiveIndex(i)}
                        title={p.title || p.slug}
                        className={`relative shrink-0 h-8 w-8 rounded-lg border overflow-hidden transition-all ${
                          i === activeIndex
                            ? "border-[#1D1D1F] ring-1 ring-[#1D1D1F]/20 bg-white"
                            : "border-gray-200 opacity-60 hover:opacity-100 bg-white/70"
                        }`}
                      >
                        <Image
                          src={heroImage(p)}
                          alt={p.title || p.slug}
                          fill
                          sizes="32px"
                          className="object-contain p-0.5"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Rating */}
                <div className="mt-1.5 flex items-center gap-1.5">
                  <div className="flex">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <FaStar
                        key={i}
                        className={`w-3 h-3 ${i < rating ? "text-[#1D1D1F]" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  {active.reviewCount > 0 && (
                    <span className="text-[10px] text-[#6B7280]">
                      ({active.reviewCount})
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl font-bold tracking-tight text-[#1D1D1F]">
                    ৳{price?.toLocaleString()}
                  </span>
                  {compareAtPrice && compareAtPrice > price && (
                    <span className="text-xs text-[#1D1D1F]/40 line-through">
                      ৳{compareAtPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Actions — Buy Now full width, then Add to Cart / View Details */}
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      addToCart(active, active.showcaseQty || 1, { silent: true });
                      router.push("/checkout");
                    }}
                    className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1D1D1F] text-white py-1.5 text-[11px] font-bold shadow-sm hover:bg-black active:scale-[0.98] transition-all"
                  >
                    <FaBolt className="w-3 h-3" /> Buy Now
                  </button>
                  <button
                    onClick={() => addToCart(active, active.showcaseQty || 1)}
                    className="inline-flex items-center justify-center gap-1 rounded-full bg-white border border-[#1D1D1F]/15 text-[#1D1D1F] py-1.5 text-[10px] font-bold whitespace-nowrap hover:bg-[#1D1D1F]/5 active:scale-[0.98] transition-all"
                  >
                    <FaShoppingCart className="w-2.5 h-2.5" /> Add to Cart
                  </button>
                  <Link
                    href={`/product/${active._id}/`}
                    className="inline-flex items-center justify-center rounded-full border border-[#1D1D1F]/25 text-[#1D1D1F] py-1.5 text-[10px] font-semibold whitespace-nowrap hover:bg-[#1D1D1F]/5 transition-all"
                  >
                    View Details
                  </Link>
                </div>

                {/* Title + description */}
                <div className="mt-2">
                  <h3 className="text-sm font-bold leading-tight text-[#1D1D1F] font-georgia">
                    {active.title || active.slug}
                  </h3>
                  {active.description && (
                    <p className="mt-1 text-[11px] leading-snug text-[#6B7280] line-clamp-3">
                      {active.description}
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            emptyState
          )}
        </div>
      </div>
    </section>
  );
}
