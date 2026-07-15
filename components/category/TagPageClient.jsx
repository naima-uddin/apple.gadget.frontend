"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import ProductFilters from "@/components/product/ProductFilters";
import SortDropdown from "@/components/product/SortDropdown";
import Link from "next/link";
import { getDisplayPrice } from "@/lib/pricing";
import AdSlot from "@/components/ui/AdSlot";
import NoProductsFound from "@/components/ui/NoProductsFound";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
const PRODUCTS_PER_PAGE = 10;

const TAG_CONFIG = {
  "deals-of-the-day": {
    label: "Deal of the Day",
    badge: "deals_of_the_day",
    icon: "🔥",
    defaultSort: "newest",
  },
  deals_of_the_day: {
    label: "Deal of the Day",
    badge: "deals_of_the_day",
    icon: "🔥",
    defaultSort: "newest",
  },
  "popular-pics": {
    label: "Today's Popular Picks",
    badge: "popular_pics",
    icon: "💖",
    defaultSort: "position",
  },
  popular_pics: {
    label: "Today's Popular Picks",
    badge: "popular_pics",
    icon: "💖",
    defaultSort: "position",
  },
  "best-seller": {
    label: "Best Sellers",
    badge: "best_seller",
    icon: "⭐",
    defaultSort: "priceHigh",
  },
  best_seller: {
    label: "Best Sellers",
    badge: "best_seller",
    icon: "⭐",
    defaultSort: "priceHigh",
  },
  hot: {
    label: "Hot Right Now",
    badge: "hot",
    icon: "🔥",
    defaultSort: "newest",
  },
  "new-arrival": {
    label: "New Arrivals",
    badge: "new_arrival",
    icon: "✨",
    defaultSort: "newest",
  },
  new_arrival: {
    label: "New Arrivals",
    badge: "new_arrival",
    icon: "✨",
    defaultSort: "newest",
  },
  trending: {
    label: "Trending Now",
    badge: "trending",
    icon: "📈",
    defaultSort: "newest",
  },
  "limited-edition": {
    label: "Limited Edition",
    badge: "limited",
    icon: "💎",
    defaultSort: "position",
  },
  limited: {
    label: "Limited Edition",
    badge: "limited",
    icon: "💎",
    defaultSort: "position",
  },
  featured: {
    label: "Featured Products",
    flag: "featured",
    icon: "🏅",
    defaultSort: "position",
  },
  "flash-sale": {
    label: "Flash Sale",
    flag: "flash-sale",
    icon: "⚡",
    defaultSort: "priceLow",
  },
  clearance: {
    label: "Clearance",
    flag: "clearance",
    icon: "🏷️",
    defaultSort: "priceLow",
  },
  "free-shipping": {
    label: "Free Shipping",
    flag: "freeShipping",
    icon: "🚚",
    defaultSort: "position",
  },
  "up-to-400-bkash-cashback": {
    label: "Up To 400 Bkash Cashback",
    badge: "bkash_cashback_400",
    icon: "💸",
    defaultSort: "position",
    badgeAliases: [
      "bkash_cashback_400",
      "up_to_400_bkash_cashback",
      "400_cashback",
    ],
  },
  "up-to-1000-tk-visa-mastercard": {
    label: "Up To 1000 Tk Visa/Mastercard",
    badge: "visa_mastercard_1000",
    icon: "💳",
    defaultSort: "position",
    badgeAliases: [
      "visa_mastercard_1000",
      "up_to_1000_tk_visa_mastercard",
      "1000_cashback",
    ],
  },
  "under-999-deals": {
    label: "Under 999 Deals",
    icon: "🧾",
    defaultSort: "priceLow",
    maxPrice: 999,
  },
  "get-points-save-more": {
    label: "Get Points Save More",
    icon: "🏆",
    defaultSort: "position",
    mode: "custom",
  },
};

export default function TagPageClient({ slug }) {
  const router = useRouter();

  const config = TAG_CONFIG[slug] || {
    label: slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    icon: "🏷️",
    defaultSort: "newest",
    // unknown slugs map to a product badge key (mega-menu tags use /tag/x-y → badge x_y)
    badge: slug.replace(/-/g, "_"),
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  // Desktop filter sidebar — collapsed by default; grid gains an extra column
  const [showDesktopFilters, setShowDesktopFilters] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [sortOption, setSortOption] = useState(
    config.defaultSort || "position",
  );
  const [activeFilters, setActiveFilters] = useState({
    priceRange: [0, 0],
    expandedSubIds: new Set(),
    brands: new Set(),
    minRating: null,
  });

  useEffect(() => {
    const updateViewport = () => setIsMobileView(window.innerWidth < 640);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (!slug) return;
    setSortOption(config.defaultSort || "position");
    setCurrentPage(1);
    setShowMobileFilters(false);
    setActiveFilters({
      priceRange: [0, 0],
      expandedSubIds: new Set(),
      brands: new Set(),
      minRating: null,
    });
    setLoading(true);

    (async () => {
      try {
        let query = "limit=500";

        if (config.mode !== "custom") {
          if (config.flag) query += `&flag=${encodeURIComponent(config.flag)}`;
          if (config.maxPrice != null)
            query += `&maxPrice=${encodeURIComponent(String(config.maxPrice))}`;
        }

        let items = [];

        if (
          config.mode !== "custom" &&
          Array.isArray(config.badgeAliases) &&
          config.badgeAliases.length > 0
        ) {
          const seen = new Set();
          for (const badgeName of config.badgeAliases) {
            const resp = await fetch(
              `${API}/api/products?${query}&badge=${encodeURIComponent(badgeName)}`,
            );
            const json = await resp.json();
            (json.items || []).forEach((p) => {
              const id = String(p._id || p.id || "");
              if (id && !seen.has(id)) {
                seen.add(id);
                items.push({ ...p, price: getDisplayPrice(p).price });
              }
            });
          }
        } else {
          if (config.mode !== "custom" && config.badge) {
            query += `&badge=${encodeURIComponent(config.badge)}`;
          }
          const resp = await fetch(`${API}/api/products?${query}`);
          const json = await resp.json();
          items = (json.items || []).map((p) => ({
            ...p,
            price: getDisplayPrice(p).price,
          }));
        }

        if (config.mode === "custom" && slug === "get-points-save-more") {
          items = items.filter((p) => Number(p.rewardPoints || 0) > 0);
        }

        setProducts(items);
      } catch (err) {
        console.error(err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const filtered = useMemo(() => {
    const { priceRange, brands, minRating } = activeFilters;
    return products.filter((p) => {
      const pr = getDisplayPrice(p).price;
      if (pr < priceRange[0] || pr > priceRange[1]) return false;
      if (brands.size > 0 && (!p.department || !brands.has(p.department)))
        return false;
      if (minRating !== null && (p.averageRating || 0) < minRating)
        return false;
      return true;
    });
  }, [products, activeFilters]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sortOption) {
      case "newest":
        list.sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        );
        break;
      case "oldest":
        list.sort(
          (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
        );
        break;
      case "nameAsc":
        list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        break;
      case "nameDesc":
        list.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
        break;
      case "priceHigh":
        list.sort(
          (a, b) => getDisplayPrice(b).price - getDisplayPrice(a).price,
        );
        break;
      case "priceLow":
        list.sort(
          (a, b) => getDisplayPrice(a).price - getDisplayPrice(b).price,
        );
        break;
      default:
        break;
    }
    return list;
  }, [filtered, sortOption]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PRODUCTS_PER_PAGE));
  const displayed = sorted.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE,
  );

  const paginationControls =
    totalPages > 1 ? (
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          className="h-9 px-3 bg-white border border-gray-200 rounded-full text-sm text-[#1F2937] hover:border-[#5B21B6] hover:text-[#5B21B6] transition-colors disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-[#1F2937]"
          aria-label="Previous page"
        >
          ‹
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(
            (page) =>
              page === 1 ||
              page === totalPages ||
              Math.abs(page - currentPage) <= 1,
          )
          .map((page, index, arr) => (
            <React.Fragment key={page}>
              {index > 0 && arr[index - 1] !== page - 1 && (
                <span className="px-1 text-gray-400">…</span>
              )}
              <button
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`h-9 min-w-9 px-3 rounded-full text-sm font-medium transition-colors ${
                  page === currentPage
                    ? "bg-[#5B21B6] text-white shadow-sm"
                    : "bg-white border border-gray-200 text-[#1F2937] hover:border-[#5B21B6] hover:text-[#5B21B6]"
                }`}
              >
                {page}
              </button>
            </React.Fragment>
          ))}

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          className="h-9 px-3 bg-white border border-gray-200 rounded-full text-sm text-[#1F2937] hover:border-[#5B21B6] hover:text-[#5B21B6] transition-colors disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-[#1F2937]"
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    ) : null;

  return (
    <div className="bg-white min-h-screen">
      {/* ── Hero header ── */}
      <div className="bg-gradient-to-b from-[#F5F3FF] to-white border-b border-violet-100/60">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-6 pb-8 relative overflow-hidden">
          <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-violet-200/30 blur-3xl" />

          {/* Breadcrumb row */}
          <nav className="relative flex items-center flex-wrap gap-1.5 text-sm text-[#6B7280] mb-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-full px-3 py-1 text-xs font-medium text-[#6B7280] hover:text-[#5B21B6] hover:border-[#5B21B6] shadow-sm transition-colors mr-2"
            >
              <span className="text-[10px]">‹</span> Back
            </button>
            <Link href="/" className="hover:text-[#5B21B6] transition-colors">
              Home
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-[#5B21B6] font-medium">{config.label}</span>
          </nav>

          {/* Title */}
          <div className="relative text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-5xl text-[#1F2937] tracking-tight work-sans">
              {config.icon} {config.label}
            </h1>
          </div>
        </div>
      </div>

      <AdSlot page="categoryPage" className="max-w-7xl mx-auto px-2 py-3" />

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-6">
        {loading ? (
          <div className="py-32 text-center text-gray-400 text-lg">
            Loading products…
          </div>
        ) : products.length === 0 ? (
          <NoProductsFound
            message={`No ${config.label} products right now. Check back soon!`}
          />
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Mobile filter/sort bar */}
            <div className="col-span-12 lg:hidden sticky top-16 z-30 bg-white/95 backdrop-blur py-2 -mt-2 mb-2 border-b border-gray-100">
              <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-center">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="h-9 px-3 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center gap-1.5 text-xs font-medium text-[#1F2937]"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#5B21B6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  Filter
                </button>
                <SortDropdown
                  value={sortOption}
                  onChange={(v) => {
                    setSortOption(v);
                    setCurrentPage(1);
                  }}
                  className="w-full"
                />
                <div className="h-9 px-3 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center text-xs font-semibold text-[#5B21B6]">
                  {sorted.length}
                </div>
              </div>
            </div>

            {/* Mobile filter drawer */}
            {showMobileFilters && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <button
                  className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                  onClick={() => setShowMobileFilters(false)}
                  aria-label="Close"
                />
                <div className="absolute left-0 top-0 h-full w-[85%] max-w-85 bg-white shadow-2xl overflow-y-auto p-4 rounded-r-2xl">
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="absolute top-3 right-3 h-8 w-8 bg-[#5B21B6] text-white rounded-full flex items-center justify-center shadow-sm hover:bg-[#4C1D95] transition-colors"
                  >
                    ✕
                  </button>
                  <div className="pt-2">
                    <ProductFilters
                      products={products}
                      subcategories={[]}
                      onChange={(f) => {
                        setActiveFilters(f);
                        setShowAll(false);
                      }}
                      sticky={false}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Desktop filter sidebar — kept mounted (CSS-hidden) so filter state survives collapse */}
            <div
              className={`hidden ${showDesktopFilters ? "lg:block" : ""} col-span-3`}
            >
              <ProductFilters
                products={products}
                subcategories={[]}
                onChange={(f) => {
                  setActiveFilters(f);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Products grid */}
            <div
              className={`col-span-12 ${showDesktopFilters ? "lg:col-span-9" : "lg:col-span-12"}`}
            >
              <div className="hidden lg:flex items-center justify-between gap-4 bg-white border border-gray-100 rounded-2xl shadow-sm px-5 py-3 mb-5">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setShowDesktopFilters((v) => !v)}
                    aria-expanded={showDesktopFilters}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border shadow-sm transition-colors ${
                      showDesktopFilters
                        ? "bg-[#5B21B6] text-white border-[#5B21B6]"
                        : "bg-white text-[#1F2937] border-gray-200 hover:border-[#5B21B6] hover:text-[#5B21B6]"
                    }`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                    Filters
                    <span className="text-[10px]">
                      {showDesktopFilters ? "▲" : "▼"}
                    </span>
                  </button>
                  {paginationControls}
                </div>
                <SortDropdown
                  value={sortOption}
                  onChange={(v) => {
                    setSortOption(v);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div
                className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 ${showDesktopFilters ? "lg:grid-cols-4" : "lg:grid-cols-5"} gap-2 md:gap-4`}
              >
                {displayed.map((p) => (
                  <ProductCard
                    key={p._id}
                    product={p}
                    showDiscount={true}
                    maxTags={2}
                    imageHeight={isMobileView ? 160 : 200}
                  />
                ))}
              </div>

              {paginationControls && (
                <div className="mt-10 flex justify-center lg:hidden">
                  {paginationControls}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
