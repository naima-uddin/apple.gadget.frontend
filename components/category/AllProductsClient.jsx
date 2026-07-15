"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import ProductFilters from "@/components/product/ProductFilters";
import SortDropdown from "@/components/product/SortDropdown";
import Link from "next/link";
import { getDisplayPrice } from "@/lib/pricing";
import AdSlot from "@/components/ui/AdSlot";
import NoProductsFound from "@/components/ui/NoProductsFound";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
const PRODUCTS_PER_PAGE = 20;

export default function AllProductsClient() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsLoadedOnce, setProductsLoadedOnce] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [sortOption, setSortOption] = useState("position");
  const [activeFilters, setActiveFilters] = useState({
    priceRange: [0, 0],
    expandedSubIds: new Set(),
    brands: new Set(),
    minRating: null,
  });

  useEffect(() => {
    const update = () => setIsMobileView(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoadingProducts(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(currentPage));
        params.set("limit", String(PRODUCTS_PER_PAGE));
        params.set("sort", sortOption);

        if (
          activeFilters.expandedSubIds &&
          activeFilters.expandedSubIds.size > 0
        ) {
          params.set(
            "categoryId",
            Array.from(activeFilters.expandedSubIds).join(","),
          );
        }

        if (Array.isArray(activeFilters.priceRange)) {
          const [minPrice, maxPrice] = activeFilters.priceRange;
          if (minPrice || maxPrice) {
            params.set("minPrice", String(minPrice));
            params.set("maxPrice", String(maxPrice));
          }
        }

        if (activeFilters.brands && activeFilters.brands.size > 0) {
          params.set("brand", Array.from(activeFilters.brands).join(","));
        }

        if (
          activeFilters.minRating !== null &&
          activeFilters.minRating !== undefined
        ) {
          params.set("minRating", String(activeFilters.minRating));
        }

        const response = await fetch(
          `${API}/api/products?${params.toString()}`,
        );
        const json = await response.json();

        if (!response.ok)
          throw new Error(json.error || "Failed to load products");

        const items = (json.items || []).map((p) => ({
          ...p,
          price: getDisplayPrice(p).price,
        }));

        setProducts(items);
        setTotalProducts(Number(json.total || 0));
        setProductsLoadedOnce(true);
      } catch (err) {
        console.error(err);
        setProducts([]);
        setTotalProducts(0);
        setProductsLoadedOnce(true);
      } finally {
        setLoadingProducts(false);
      }
    };

    load();
  }, [currentPage, sortOption, activeFilters]);

  const totalPages = Math.max(1, Math.ceil(totalProducts / PRODUCTS_PER_PAGE));
  const showingFrom =
    totalProducts === 0 ? 0 : (currentPage - 1) * PRODUCTS_PER_PAGE + 1;
  const showingTo = Math.min(currentPage * PRODUCTS_PER_PAGE, totalProducts);

  const paginationControls =
    !loadingProducts && totalPages > 1 ? (
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
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
    <>
      {/* ── Hero header ── */}
      <div className="bg-gradient-to-b from-[#F5F3FF] to-white border-b border-violet-100/60">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-6 pb-8 relative overflow-hidden">
          {/* decorative blobs */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-violet-200/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/4 w-64 h-64 rounded-full bg-purple-100/40 blur-3xl" />

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
            <span className="text-[#5B21B6] font-medium">All Products</span>
          </nav>

          {/* Title */}
          <div className="relative text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 bg-white border border-violet-200 text-[#5B21B6] text-[11px] font-semibold uppercase tracking-wider rounded-full px-3 py-1 shadow-sm mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5B21B6]" />
              Full Collection
            </span>
            <h1 className="text-3xl md:text-5xl text-[#1F2937] tracking-tight work-sans">
              All Products
            </h1>
            <p className="text-[#6B7280] mt-3 text-sm md:text-base leading-relaxed">
              Browse our complete variety of collections
            </p>
            {totalProducts > 0 && (
              <p className="mt-3 text-xs font-medium text-[#6B7280]">
                <span className="text-[#5B21B6] font-bold">
                  {totalProducts.toLocaleString()}
                </span>{" "}
                product{totalProducts !== 1 ? "s" : ""} available
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 py-2">
        <AdSlot page="allProductsPage" className="w-full" />
      </div>

      {/* ── Listing area ── */}
      <div className="bg-[#FAFAFB] w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-8">
          {/* Mobile sticky filter/sort bar */}
          <div className="lg:hidden sticky top-16 z-30 -mx-3 px-3 py-2 mb-4 bg-[#FAFAFB]/95 backdrop-blur border-b border-gray-100">
            <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-center">
              <button
                type="button"
                onClick={() => setShowMobileFilters(true)}
                className="h-9 px-3 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center gap-1.5 text-xs font-medium text-[#1F2937]"
                aria-label="Open filters"
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
                onChange={(value) => {
                  setSortOption(value);
                  setCurrentPage(1);
                }}
                className="w-full"
              />
              <div className="h-9 px-3 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center text-xs font-semibold text-[#5B21B6]">
                {totalProducts > 0 ? totalProducts : "—"}
              </div>
            </div>
          </div>

          {/* Mobile filter drawer */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <button
                type="button"
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                onClick={() => setShowMobileFilters(false)}
                aria-label="Close filters"
              />
              <div className="absolute left-0 top-0 h-full w-[85%] max-w-[340px] bg-white shadow-2xl overflow-y-auto p-4 rounded-r-2xl">
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(false)}
                  className="absolute top-3 right-3 h-8 w-8 bg-[#5B21B6] text-white rounded-full flex items-center justify-center shadow-sm hover:bg-[#4C1D95] transition-colors"
                  aria-label="Close filters panel"
                >
                  ✕
                </button>
                <div className="pt-2">
                  <ProductFilters
                    products={products}
                    subcategories={[]}
                    onChange={(f) => {
                      setActiveFilters(f);
                      setCurrentPage(1);
                    }}
                    sticky={false}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Filters + products grid */}
          <div className="grid grid-cols-12 gap-5">
            {/* Filter sidebar */}
            <div className="hidden lg:block col-span-12 lg:col-span-3">
              <ProductFilters
                products={products}
                subcategories={[]}
                onChange={(f) => {
                  setActiveFilters(f);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Products */}
            <div className="col-span-12 lg:col-span-9">
              {/* Desktop toolbar */}
              <div className="hidden lg:flex items-center justify-between gap-4 bg-white border border-gray-100 rounded-2xl shadow-sm px-5 py-3 mb-5">
                <p className="text-sm text-[#6B7280]">
                  {totalProducts > 0 ? (
                    <>
                      Showing{" "}
                      <span className="font-semibold text-[#1F2937]">
                        {showingFrom}–{showingTo}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-[#1F2937]">
                        {totalProducts.toLocaleString()}
                      </span>{" "}
                      products
                    </>
                  ) : (
                    "Products"
                  )}
                </p>
                <SortDropdown
                  value={sortOption}
                  onChange={(value) => {
                    setSortOption(value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              {!productsLoadedOnce && loadingProducts ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {Array(8)
                    .fill(0)
                    .map((_, i) => (
                      <ProductCard key={i} loading={true} />
                    ))}
                </div>
              ) : products.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {products.map((p) => (
                      <ProductCard
                        key={p._id}
                        product={p}
                        showDiscount={true}
                        maxTags={2}
                        imageHeight={isMobileView ? 160 : 200}
                      />
                    ))}
                  </div>

                  {loadingProducts && (
                    <div className="mt-4 text-center text-sm text-[#6B7280]">
                      Updating products...
                    </div>
                  )}
                </>
              ) : (
                <NoProductsFound />
              )}

              {paginationControls && (
                <div className="mt-10 flex justify-center">
                  {paginationControls}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
