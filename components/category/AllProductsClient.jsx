"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import ProductFilters from "@/components/product/ProductFilters";
import SortDropdown from "@/components/product/SortDropdown";
import Link from "next/link";
import { useCategories } from "@/components/context/CategoryContext";
import { getDisplayPrice } from "@/lib/pricing";
import AdSlot from "@/components/ui/AdSlot";
import NoProductsFound from "@/components/ui/NoProductsFound";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
const PRODUCTS_PER_PAGE = 10;

export default function AllProductsClient() {
  const router = useRouter();
  const { getMainCategories, getSubcategories, categoriesMap } =
    useCategories();
  const [categoryTree, setCategoryTree] = useState([]);
  const [descendantMap, setDescendantMap] = useState(new Map());
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsLoadedOnce, setProductsLoadedOnce] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  // Desktop filter sidebar — collapsed by default; grid gains an extra column
  const [showDesktopFilters, setShowDesktopFilters] = useState(false);
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

  // Build a flat top-level-category list (with depth) and an id -> descendant-ids
  // map for the filter sidebar, mirroring CategoryPageClient's logic but rooted
  // at every main category instead of a single one.
  useEffect(() => {
    const mainCats = getMainCategories();
    if (!mainCats.length) return;

    const collectDescendants = (catId, depth) => {
      const results = [];
      const children = getSubcategories(catId);
      children.forEach((child) => {
        results.push({ _id: child._id, name: child.name, depth });
        results.push(...collectDescendants(child._id, depth + 1));
      });
      return results;
    };

    const flat = [];
    mainCats.forEach((cat) => {
      flat.push({ _id: cat._id, name: cat.name, depth: 0 });
      flat.push(...collectDescendants(cat._id, 1));
    });
    setCategoryTree(flat);

    const buildDescendantMap = (rootId) => {
      const map = new Map();
      const processNode = (nodeId) => {
        const children = getSubcategories(nodeId);
        const nodeSet = new Set([String(nodeId)]);
        children.forEach((child) => {
          processNode(child._id);
          (
            map.get(String(child._id)) || new Set([String(child._id)])
          ).forEach((id) => nodeSet.add(id));
        });
        map.set(String(nodeId), nodeSet);
      };
      processNode(rootId);
      return map;
    };

    const fullMap = new Map();
    mainCats.forEach((cat) => {
      buildDescendantMap(cat._id).forEach((set, id) => fullMap.set(id, set));
    });
    setDescendantMap(fullMap);
  }, [getMainCategories, getSubcategories, categoriesMap]);

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

  const paginationControls =
    !loadingProducts && totalPages > 1 ? (
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          className="h-9 px-3 bg-white border border-gray-200 rounded-full text-sm text-[#1F2937] hover:border-[#1D1D1F] hover:text-[#1D1D1F] transition-colors disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-[#1F2937]"
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
                    ? "bg-[#1D1D1F] text-white shadow-sm"
                    : "bg-white border border-gray-200 text-[#1F2937] hover:border-[#1D1D1F] hover:text-[#1D1D1F]"
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
          className="h-9 px-3 bg-white border border-gray-200 rounded-full text-sm text-[#1F2937] hover:border-[#1D1D1F] hover:text-[#1D1D1F] transition-colors disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-[#1F2937]"
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    ) : null;

  return (
    <>
      {/* ── Hero header ── */}
      <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-6 pb-8 relative overflow-hidden">
          {/* decorative blobs */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-gray-200/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/4 w-64 h-64 rounded-full bg-gray-100/40 blur-3xl" />

          {/* Breadcrumb row */}
          <nav className="relative flex items-center flex-wrap gap-1.5 text-sm text-[#6B7280] mb-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-full px-3 py-1 text-xs font-medium text-[#6B7280] hover:text-[#1D1D1F] hover:border-[#1D1D1F] shadow-sm transition-colors mr-2"
            >
              <span className="text-[10px]">‹</span> Back
            </button>
            <Link href="/" className="hover:text-[#1D1D1F] transition-colors">
              Home
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-[#1D1D1F] font-medium">All Products</span>
          </nav>

          {/* Title */}
          <div className="relative text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-5xl text-[#1F2937] tracking-tight work-sans">
              All Products
            </h1>
            <p className="text-[#6B7280] mt-3 text-sm md:text-base leading-relaxed">
              Browse our complete variety of collections
            </p>
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
                  stroke="#1D1D1F"
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
              <div className="h-9 px-3 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center text-xs font-semibold text-[#1D1D1F]">
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
                  className="absolute top-3 right-3 h-8 w-8 bg-[#1D1D1F] text-white rounded-full flex items-center justify-center shadow-sm hover:bg-black transition-colors"
                  aria-label="Close filters panel"
                >
                  ✕
                </button>
                <div className="pt-2">
                  <ProductFilters
                    products={products}
                    subcategories={categoryTree}
                    descendantMap={descendantMap}
                    categoryLabel="Categories"
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
            {/* Filter sidebar — kept mounted (CSS-hidden) so filter state survives collapse */}
            <div
              className={`hidden ${showDesktopFilters ? "lg:block" : ""} col-span-12 lg:col-span-3`}
            >
              <ProductFilters
                products={products}
                subcategories={categoryTree}
                descendantMap={descendantMap}
                categoryLabel="Categories"
                onChange={(f) => {
                  setActiveFilters(f);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Products */}
            <div
              className={`col-span-12 ${showDesktopFilters ? "lg:col-span-9" : "lg:col-span-12"}`}
            >
              {/* Desktop toolbar */}
              <div className="hidden lg:flex items-center justify-between gap-4 bg-white border border-gray-100 rounded-2xl shadow-sm px-5 py-3 mb-5">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setShowDesktopFilters((v) => !v)}
                    aria-expanded={showDesktopFilters}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border shadow-sm transition-colors ${
                      showDesktopFilters
                        ? "bg-[#1D1D1F] text-white border-[#1D1D1F]"
                        : "bg-white text-[#1F2937] border-gray-200 hover:border-[#1D1D1F] hover:text-[#1D1D1F]"
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
                  onChange={(value) => {
                    setSortOption(value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              {!productsLoadedOnce && loadingProducts ? (
                <div
                  className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 ${showDesktopFilters ? "lg:grid-cols-4" : "lg:grid-cols-5"} gap-3 md:gap-4`}
                >
                  {Array(10)
                    .fill(0)
                    .map((_, i) => (
                      <ProductCard key={i} loading={true} />
                    ))}
                </div>
              ) : products.length > 0 ? (
                <>
                  <div
                    className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 ${showDesktopFilters ? "lg:grid-cols-4" : "lg:grid-cols-5"} gap-3 md:gap-4`}
                  >
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
                <div className="mt-10 flex justify-center lg:hidden">
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
