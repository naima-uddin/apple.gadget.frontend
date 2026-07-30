"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import ProductFilters from "@/components/product/ProductFilters";
import SortDropdown from "@/components/product/SortDropdown";
import Link from "next/link";
import { useUser } from "@/components/context/UserContext";
import { useCategories } from "@/components/context/CategoryContext";
import { getDisplayPrice } from "@/lib/pricing";
import AdSlot from "@/components/ui/AdSlot";
import NoProductsFound from "@/components/ui/NoProductsFound";
import SectionHeader from "@/components/home/SectionHeader";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
const PRODUCTS_PER_PAGE = 10;

export default function CategoryPageClient({ slug, parentSlug = null }) {
  const router = useRouter();
  const {
    getCategoryBySlug,
    getCategoryBySlugAndParentSlug,
    categoriesMap,
    getSubcategories,
  } = useCategories();
  const [category, setCategory] = useState(null);
  const [parentCategory, setParentCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [descendantMap, setDescendantMap] = useState(new Map());
  const [isSubcategoryPage, setIsSubcategoryPage] = useState(false);
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryIdsParam, setCategoryIdsParam] = useState("");
  const [bestSelling, setBestSelling] = useState([]);
  const [loadingBestSelling, setLoadingBestSelling] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsLoadedOnce, setProductsLoadedOnce] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  // Desktop filter sidebar — collapsed by default; grid gains an extra column
  const [showDesktopFilters, setShowDesktopFilters] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [bestSellingStartIndex, setBestSellingStartIndex] = useState(0);
  const [bestSellingPerView, setBestSellingPerView] = useState(1);
  const [sortOption, setSortOption] = useState("position");
  const [activeFilters, setActiveFilters] = useState({
    priceRange: [0, 0],
    expandedSubIds: new Set(),
    brands: new Set(),
    minRating: null,
  });

  useEffect(() => {
    const updateResponsiveState = () => {
      const width = window.innerWidth;
      setIsMobileView(width < 640);

      if (width >= 1280) setBestSellingPerView(5);
      else if (width >= 1024) setBestSellingPerView(4);
      else if (width >= 768) setBestSellingPerView(3);
      else setBestSellingPerView(2);
    };

    updateResponsiveState();
    window.addEventListener("resize", updateResponsiveState);
    return () => window.removeEventListener("resize", updateResponsiveState);
  }, []);

  // fetch products using category from context
  useEffect(() => {
    if (!slug) return;
    // when navigating to a new category reset sorting and filters/shows
    setSortOption("position");
    setCurrentPage(1);
    setTotalProducts(0);
    setCategoryIdsParam("");
    setShowMobileFilters(false);
    setBestSellingStartIndex(0);
    setActiveFilters({
      priceRange: [0, 0],
      expandedSubIds: new Set(),
      brands: new Set(),
      minRating: null,
    });
    setLoadingBestSelling(true);
    setLoadingProducts(true);
    setProductsLoadedOnce(false);
    (async () => {
      let shouldLoadProducts = false;
      try {
        // Get category from context instead of fetching
        let match = parentSlug
          ? getCategoryBySlugAndParentSlug(slug, parentSlug)
          : getCategoryBySlug(slug);

        if (!match) {
          setCategory({ name: slug, description: "" });
          setSubcategories([]);
          setDescendantMap(new Map());
          setProducts([]);
          setBestSelling([]);
          setCategoryIdsParam("");
          setIsSubcategoryPage(false);
          setLoadingBestSelling(false);
          setLoadingProducts(false);
          return;
        }

        setCategory(match);

        // Build flat descendant list with depth for filter sidebar
        const collectAllDescendants = (catId, depth = 0) => {
          const results = [];
          const children = getSubcategories(catId);
          children.forEach((child) => {
            results.push({ _id: child._id, name: child.name, depth });
            results.push(...collectAllDescendants(child._id, depth + 1));
          });
          return results;
        };
        setSubcategories(collectAllDescendants(match._id));

        // Build descendant map: id → Set<all descendant ids + self>
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
        setDescendantMap(buildDescendantMap(match._id));

        // determine if this category has a parent
        setIsSubcategoryPage(Boolean(match.parent));
        if (match.parent && categoriesMap[match.parent]) {
          setParentCategory(categoriesMap[match.parent]);
        } else {
          setParentCategory(null);
        }

        // gather all descendant category ids (include self)
        const collectIds = (catId) => {
          let ids = [String(catId)];
          const children = getSubcategories(catId);
          children.forEach((c) => (ids = ids.concat(collectIds(c._id))));
          return ids;
        };
        const ids = collectIds(match._id);
        const param = ids.join(",");
        setCategoryIdsParam(param);
        shouldLoadProducts = true;

        // Best-selling strip — try category-specific first, fall back to global
        const bestResp = await fetch(
          `${API}/api/products?categoryId=${encodeURIComponent(param)}&badge=best_seller&page=1&limit=50`,
        );
        const bestJson = await bestResp.json();
        const catBest = bestJson.items || [];
        if (catBest.length > 0) {
          setBestSelling(catBest);
        } else {
          // fallback: show all best-sellers site-wide (badge only, no category filter)
          const globalResp = await fetch(
            `${API}/api/products?badge=best_seller&page=1&limit=50`,
          ).catch(() => null);
          const globalJson = globalResp
            ? await globalResp.json().catch(() => ({}))
            : {};
          setBestSelling(globalJson.items || []);
        }
        setLoadingBestSelling(false);
      } catch (err) {
        console.error(err);
        setProducts([]);
        setBestSelling([]);
        setLoadingBestSelling(false);
        setLoadingProducts(false);
      } finally {
        if (!shouldLoadProducts) {
          setLoadingProducts(false);
        }
      }
    })();
  }, [
    slug,
    parentSlug,
    getCategoryBySlug,
    getCategoryBySlugAndParentSlug,
    categoriesMap,
    getSubcategories,
  ]);

  // Update document title, meta description, canonical link, and inject
  // BreadcrumbList JSON-LD client-side — the static export ships a generic
  // placeholder shell, so we patch in the real category values once loaded.
  useEffect(() => {
    if (!category?.name) return;
    const prevTitle = document.title;
    document.title = `${category.name} | Pickob`;

    const descContent =
      category.description ||
      `Browse ${category.name} at Pickob — gadgets and electronics with best prices and fast delivery across Bangladesh.`;
    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute("content");
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", descContent);

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://applebd.com";
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    const categoryPath = parentSlug ? `${parentSlug}/${slug}` : slug;
    canonical.setAttribute("href", `${SITE_URL}/category/${categoryPath}`);

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        ...(parentCategory
          ? [
              {
                "@type": "ListItem",
                position: 2,
                name: parentCategory.name,
                item: `${SITE_URL}/category/${parentCategory.slug || (parentCategory.name || "").toLowerCase().replace(/\s+/g, "-")}`,
              },
            ]
          : []),
        {
          "@type": "ListItem",
          position: parentCategory ? 3 : 2,
          name: category.name,
          item: `${SITE_URL}/category/${parentSlug ? `${parentSlug}/${slug}` : slug}`,
        },
      ],
    };
    const existing = document.getElementById("category-jsonld");
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.id = "category-jsonld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(breadcrumbSchema);
    document.head.appendChild(script);

    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc !== undefined)
        metaDesc.setAttribute("content", prevDesc || "");
      script.remove();
    };
  }, [category, parentCategory, slug]);

  useEffect(() => {
    if (!categoryIdsParam) return;

    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(currentPage));
        params.set("limit", String(PRODUCTS_PER_PAGE));
        params.set("sort", sortOption);

        const selectedCategoryIds =
          activeFilters.expandedSubIds && activeFilters.expandedSubIds.size > 0
            ? Array.from(activeFilters.expandedSubIds).join(",")
            : categoryIdsParam;
        params.set("categoryId", selectedCategoryIds);

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

    loadProducts();
  }, [categoryIdsParam, currentPage, sortOption, activeFilters]);

  const { user } = useUser();
  const totalPages = Math.max(1, Math.ceil(totalProducts / PRODUCTS_PER_PAGE));
  const maxBestSellingStart = Math.max(
    0,
    bestSelling.length - bestSellingPerView,
  );
  const canSlideBestSelling = bestSelling.length > bestSellingPerView;
  const visibleBestSelling = bestSelling.slice(
    bestSellingStartIndex,
    bestSellingStartIndex + bestSellingPerView,
  );

  useEffect(() => {
    setBestSellingStartIndex((prev) => Math.min(prev, maxBestSellingStart));
  }, [maxBestSellingStart]);

  // Rendered next to the sort dropdown on desktop and below the grid on mobile
  const paginationControls =
    !loadingProducts && totalPages > 1 ? (
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          className="h-9 px-3 bg-white border border-gray-200 rounded-full text-sm text-[#1F2937] hover:border-[#1D1D1F] hover:text-[#1D1D1F] transition-colors disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-[#1F2937]"
          aria-label="Previous page"
        >
          ‹
        </button>

        {Array.from({ length: totalPages }, (_, index) => index + 1)
          .filter(
            (page) =>
              page === 1 ||
              page === totalPages ||
              Math.abs(page - currentPage) <= 1,
          )
          .map((page, index, arr) => (
            <React.Fragment key={page}>
              {index > 0 && arr[index - 1] !== page - 1 ? (
                <span className="px-1 text-gray-400">…</span>
              ) : null}
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
            {category && category.name ? (
              <>
                <span className="text-gray-300">/</span>
                {parentCategory ? (
                  <>
                    <Link
                      href={`/category/${parentCategory.slug || (parentCategory.name || "").toLowerCase().replace(/\s+/g, "-")}/`}
                      className="hover:text-[#1D1D1F] transition-colors"
                    >
                      {parentCategory.name}
                    </Link>
                    <span className="text-gray-300">/</span>
                    <span className="text-[#1D1D1F] font-medium">
                      {category.name}
                    </span>
                  </>
                ) : (
                  <span className="text-[#1D1D1F] font-medium">
                    {category.name}
                  </span>
                )}
              </>
            ) : null}
          </nav>

          {/* Title */}
          <div className="relative text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-5xl text-[#1F2937] tracking-tight work-sans">
              {category?.name || slug}
            </h1>
            <p className="text-[#6B7280] mt-3 text-sm md:text-base leading-relaxed">
              {category?.description ||
                `Products for ${category?.name || slug}.`}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 py-2">
        <AdSlot page="categoryPage" className="w-full" />
      </div>

      {/* ── Listing area ── */}
      <div className="bg-[#FAFAFB] w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-8">
          {/* Mobile sticky filter/sort bar */}
          <div className="lg:hidden sticky top-16 z-30 -mx-3 px-3 py-2 mb-4 bg-[#FAFAFB]/95 backdrop-blur border-b border-gray-100">
            <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
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
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
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
                    key={`${parentSlug || ""}/${slug}`}
                    products={products}
                    subcategories={subcategories}
                    descendantMap={descendantMap}
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
                key={`${parentSlug || ""}/${slug}`}
                products={products}
                subcategories={subcategories}
                descendantMap={descendantMap}
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

      {/* ── Best Selling — below All Products ── */}
      {(loadingBestSelling || bestSelling.length > 0) && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-10">
          <SectionHeader
            title={
              <>
                Best <span className="text-[#1D1D1F]">Selling</span>
              </>
            }
            seeMoreHref="/tag/best-seller"
            seeMoreLabel="See More"
          />

          {loadingBestSelling ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <ProductCard key={i} loading={true} />
                ))}
            </div>
          ) : (
            <div className="relative">
              {canSlideBestSelling && (
                <div className="flex items-center justify-end gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() =>
                      setBestSellingStartIndex((i) => Math.max(0, i - 1))
                    }
                    disabled={bestSellingStartIndex === 0}
                    className="h-8 w-8 rounded-full bg-white border border-gray-200 text-[#1D1D1F] shadow-sm hover:bg-[#1D1D1F] hover:text-white hover:border-[#1D1D1F] transition-colors disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#1D1D1F] disabled:hover:border-gray-200"
                    aria-label="Previous best selling products"
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setBestSellingStartIndex((i) =>
                        Math.min(maxBestSellingStart, i + 1),
                      )
                    }
                    disabled={bestSellingStartIndex >= maxBestSellingStart}
                    className="h-8 w-8 rounded-full bg-white border border-gray-200 text-[#1D1D1F] shadow-sm hover:bg-[#1D1D1F] hover:text-white hover:border-[#1D1D1F] transition-colors disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#1D1D1F] disabled:hover:border-gray-200"
                    aria-label="Next best selling products"
                  >
                    ›
                  </button>
                </div>
              )}

              <div className="min-w-0 grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {visibleBestSelling.map((p) => (
                  <ProductCard
                    key={p._id}
                    product={p}
                    imageWidth={360}
                    imageHeight={160}
                    showDiscount={true}
                    maxTags={2}
                    showActionsOnHover={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
