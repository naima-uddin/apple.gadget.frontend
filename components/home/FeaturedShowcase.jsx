"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaStar, FaShoppingCart } from "react-icons/fa";
import { useCart } from "@/components/context/CartContext";
import { getDisplayPrice } from "@/lib/pricing";
import { getVariantColors } from "@/components/cart/VariantEditModal";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

// Storefront tabs — each maps to a query against the public products API.
// "Top Seller" relies on the `topSold` sort (monthlySold desc) added on the
// backend; the others use existing sort/flag/badge filters.
const TABS = [
  { key: "latest", label: "Latest", query: "sort=newest" },
  { key: "top", label: "Top Seller", query: "sort=topSold" },
  { key: "featured", label: "Featured", query: "flag=featured" },
  { key: "trending", label: "Trending", query: "badge=trending" },
];

// The showcase deliberately renders the product's SECOND image (the lifestyle /
// alternate shot) as the big hero visual, falling back to the first image.
function heroImage(product) {
  const imgs = (product?.images || []).map((i) => i?.url).filter(Boolean);
  return encodeURI(imgs[1] || imgs[0] || "/assets/placeholder.svg");
}

function thumbImage(product) {
  const imgs = (product?.images || []).map((i) => i?.url).filter(Boolean);
  return encodeURI(imgs[1] || imgs[0] || "/assets/placeholder.svg");
}

export default function FeaturedShowcase() {
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState(TABS[0].key);
  const [productsByTab, setProductsByTab] = useState({});
  const [activeIndex, setActiveIndex] = useState(0);
  // A tab is "loading" until its fetch has populated an entry (even an empty
  // array). Deriving it avoids a synchronous setState inside the effect.
  const loading = productsByTab[activeTab] === undefined;

  const selectTab = (key) => {
    setActiveTab(key);
    setActiveIndex(0);
  };

  // Fetch (and cache in state) the products for whichever tab is active. The
  // active-index reset lives in the tab handler, so this effect only ever
  // updates state asynchronously (inside fetch callbacks).
  useEffect(() => {
    if (productsByTab[activeTab]) return;
    let cancelled = false;
    const tab = TABS.find((x) => x.key === activeTab);
    fetch(`${API}/api/products?${tab.query}&limit=8&status=published`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setProductsByTab((prev) => ({ ...prev, [activeTab]: d.items || [] }));
      })
      .catch(() => {
        if (!cancelled)
          setProductsByTab((prev) => ({ ...prev, [activeTab]: [] }));
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, productsByTab]);

  const products = productsByTab[activeTab] || [];
  const active = products[activeIndex] || null;

  const { price, compareAtPrice, discountPct } = useMemo(
    () => (active ? getDisplayPrice(active) : { price: 0 }),
    [active],
  );

  const variantColors = useMemo(
    () => (active ? getVariantColors(active) : []),
    [active],
  );

  const rating = Math.round(active?.averageRating || 0);

  // Hide the whole band when there is genuinely nothing to show for the
  // default tab — mirrors how FeaturedSections bails out.
  if (!loading && products.length === 0 && activeTab === TABS[0].key) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 sm:mt-10 mb-12">
      {/* Heading + tab buttons */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
        <div>
          <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#1D1D1F] font-georgia">
            Featured Products
          </h2>
          <p className="text-sm text-[#6B7280] mt-1">
            Handpicked gadgets, refreshed for you.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => selectTab(tab.key)}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-300 ${
                activeTab === tab.key
                  ? "bg-[#1D1D1F] text-white shadow-sm"
                  : "bg-white text-[#1D1D1F] border border-[#e5e5ea] hover:border-[#1D1D1F]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Starbucks-style showcase panel */}
      <div className="relative overflow-hidden rounded-[32px] bg-white border border-[#ececf0] shadow-[0_18px_50px_-20px_rgba(0,0,0,0.25)]">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1.35fr_0.9fr]">
          {/* LEFT — product info + thumbnail selector */}
          <div className="order-2 lg:order-1 p-6 sm:p-8 flex flex-col">
            {active ? (
              <>
                <span className="inline-flex w-fit items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] mb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1D1D1F]" />
                  {TABS.find((x) => x.key === activeTab)?.label}
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold leading-tight text-[#1D1D1F] font-georgia">
                  {active.title || active.slug}
                </h3>
                {active.description && (
                  <p className="mt-2 text-sm text-[#6B7280] line-clamp-2">
                    {active.description}
                  </p>
                )}

                {/* rating */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <FaStar
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rating ? "text-[#1D1D1F]" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  {active.reviewCount > 0 && (
                    <span className="text-xs text-[#6B7280]">
                      ({active.reviewCount})
                    </span>
                  )}
                </div>

                {/* color swatches */}
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

                {/* thumbnail selector — switches the active product */}
                <div className="mt-auto pt-6">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] mb-3">
                    More in this pick
                  </p>
                  <div className="flex items-center gap-3 overflow-x-auto pb-1">
                    {products.map((p, i) => (
                      <button
                        key={p._id || i}
                        onClick={() => setActiveIndex(i)}
                        className={`relative shrink-0 h-16 w-16 rounded-2xl overflow-hidden border transition-all duration-300 ${
                          i === activeIndex
                            ? "border-[#1D1D1F] ring-2 ring-[#1D1D1F] scale-105"
                            : "border-[#ececf0] hover:border-[#c9c9d1]"
                        }`}
                      >
                        <Image
                          src={thumbImage(p)}
                          alt={p.title || p.slug}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-[#6B7280] text-sm">
                {loading ? "Loading products…" : "No products in this pick yet."}
              </div>
            )}
          </div>

          {/* CENTER — big hero image (product's second image) */}
          <div className="order-1 lg:order-2 relative min-h-[260px] sm:min-h-[340px] lg:min-h-[420px] bg-[radial-gradient(120%_90%_at_50%_10%,#ffffff_0%,#f6f6f8_50%,#ececf0_100%)]">
            {active && (
              <Image
                key={active._id}
                src={heroImage(active)}
                alt={active.title || active.slug}
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                priority={false}
                className="object-contain p-8 drop-shadow-[0_25px_35px_rgba(0,0,0,0.18)] animate-[fadeIn_0.5s_ease]"
              />
            )}
            {discountPct && (
              <span className="absolute top-5 left-5 bg-[#1D1D1F] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                -{discountPct}%
              </span>
            )}
          </div>

          {/* RIGHT — dark Starbucks-style order panel */}
          <div className="order-3 relative p-6 sm:p-8 flex flex-col justify-center bg-[#1D1D1F] text-white">
            {active ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-bold tracking-tight">
                    ৳{price?.toLocaleString()}
                  </span>
                  {compareAtPrice && compareAtPrice > price && (
                    <span className="text-base text-white/50 line-through">
                      ৳{compareAtPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                {(active.badges?.includes("best_seller") ||
                  activeTab === "top") && (
                  <p className="mt-3 text-sm font-semibold text-white/90">
                    Bestseller
                  </p>
                )}
                <div className="mt-1.5 flex text-yellow-400">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <FaStar
                      key={i}
                      className={`w-4 h-4 ${
                        i < (rating || 5) ? "text-yellow-400" : "text-white/25"
                      }`}
                    />
                  ))}
                </div>

                {active.freeShipping && (
                  <p className="mt-4 text-xs text-white/70">
                    ✓ Free shipping included
                  </p>
                )}

                <div className="mt-6 flex flex-col gap-2.5">
                  <button
                    onClick={() => addToCart(active, 1)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-[#1D1D1F] px-6 py-3 text-sm font-bold hover:bg-white/90 active:scale-[0.98] transition-all"
                  >
                    <FaShoppingCart className="w-4 h-4" />
                    Order Now
                  </button>
                  <Link
                    href={`/product/${active._id}/`}
                    className="inline-flex items-center justify-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all"
                  >
                    View Details
                  </Link>
                </div>
              </>
            ) : (
              <div className="py-10 text-center text-white/50 text-sm">
                {loading ? "Loading…" : "—"}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
