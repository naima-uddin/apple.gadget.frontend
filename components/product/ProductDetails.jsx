"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
import ProductInfoTabs from "@/components/product/ProductInfoTabs";
import {
  FaChevronLeft,
  FaChevronRight,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaFacebook,
  FaTwitter,
  FaWhatsapp,
  FaCopy,
  FaTruck,
  FaClock,
  FaTimes,
  FaGift,
  FaCommentDots,
  FaPencilAlt,
  FaChevronDown,
  FaShieldAlt,
} from "react-icons/fa";
import AddToCartSection from "@/components/product/AddToCartSection";
import {
  getVariantColors,
  getVariantSizes,
} from "@/components/cart/VariantEditModal";
import RelatedProducts from "@/components/product/RelatedProducts";
import ProductCard from "@/components/product/ProductCard";
import RecentlyViewed, {
  saveRecentlyViewed,
} from "@/components/product/RecentlyViewed";
import AdSlot from "@/components/ui/AdSlot";
import { getDisplayPrice } from "@/lib/pricing";
import DetailedDescriptionRenderer from "@/components/product/DetailedDescriptionRenderer";

function scrollToReviews() {
  window.dispatchEvent(new Event("openReviews"));
}

function StarDisplay({ value = 0, count = 0 }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (value >= i)
      stars.push(<FaStar key={i} className="text-yellow-400 w-4 h-4" />);
    else if (value >= i - 0.5)
      stars.push(<FaStarHalfAlt key={i} className="text-yellow-400 w-4 h-4" />);
    else stars.push(<FaRegStar key={i} className="text-gray-300 w-4 h-4" />);
  }
  return (
    <div className="flex items-center gap-1.5">
      <span className="flex gap-0.5">{stars}</span>
      <span className="text-sm font-semibold text-gray-700">
        {value > 0 ? value.toFixed(1) : ""}
      </span>
      <button className="text-sm text-gray-500" onClick={scrollToReviews}>
        ({count} review{count !== 1 ? "s" : ""})
      </button>
    </div>
  );
}

function StockBadge({ inventory, availability }) {
  if (availability === "out_of_stock" || inventory === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600">
        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
        Out of Stock
      </span>
    );
  }
  if (availability === "pre_order") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D1D1F]">
        <span className="w-2 h-2 rounded-full bg-[#1D1D1F] inline-block" />
        Pre-Order
      </span>
    );
  }
  if (availability === "upcoming") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D1D1F]">
        <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
        Coming Soon
      </span>
    );
  }
  if (inventory != null && inventory <= 10) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600">
        <span className="w-2 h-2 rounded-full bg-orange-500 inline-block " />
        Only {inventory} left in stock — order soon!
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D1D1F]">
      <span className="w-2 h-2 rounded-full bg-[#1D1D1F] inline-block" />
      Only{inventory != null ? ` ${inventory}` : ""} items left in Stock
    </span>
  );
}

function toPlainText(desc) {
  if (!desc) return "";
  if (typeof desc === "string") return desc;
  if (Array.isArray(desc))
    return desc
      .map((b) =>
        typeof b === "string"
          ? b
          : (b?.content || b?.text || "").replace(/<[^>]+>/g, ""),
      )
      .filter(Boolean)
      .join(" ");
  return "";
}

// COLOR_MAP is static data — defined once at module level, never recreated on render
const COLOR_MAP = {
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#facc15",
  orange: "#f97316",
  purple: "#a855f7",
  pink: "#ec4899",
  black: "#111827",
  white: "#ffffff",
  gray: "#9ca3af",
  grey: "#9ca3af",
  brown: "#92400e",
  navy: "#1e3a5f",
  "navy blue": "#1e3a5f",
  skyblue: "#7dd3fc",
  "sky blue": "#7dd3fc",
  "light blue": "#93c5fd",
  "dark blue": "#1d4ed8",
  teal: "#14b8a6",
  cyan: "#06b6d4",
  indigo: "#6366f1",
  violet: "#7c3aed",
  gold: "#ca8a04",
  silver: "#d1d5db",
  beige: "#e5d3b3",
  cream: "#fef9c3",
  maroon: "#7f1d1d",
  magenta: "#d946ef",
  lime: "#84cc16",
  olive: "#65a30d",
  coral: "#fb7185",
  salmon: "#fda4af",
  turquoise: "#2dd4bf",
  "off white": "#f5f5f5",
  offwhite: "#f5f5f5",
  "light green": "#86efac",
  "dark green": "#15803d",
  "light gray": "#e5e7eb",
  "dark gray": "#4b5563",
  "rose gold": "#d4a5a5",
  charcoal: "#374151",
  mustard: "#ca8a04",
};

// Flat, monochrome badge styling — every badge shares the same look, only the
// label differs. Keeps the product image free of rainbow gradients.
const BADGE_STYLE =
  "bg-[#1D1D1F]/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded";

function badgeLabel(badge) {
  const labels = {
    free_shipping: "🚚 Free Shipping",
    best_seller: "⭐ Best Seller",
    hot: "🔥 Hot",
    new_arrival: "🎀 New Arrival",
    trending: "📈 Trending",
    limited: "🔒 Limited",
    popular_pics: "🎉 Popular",
    deals_of_the_day: "🏷️ Deal of the Day",
    flash_sale: "⚡ Flash Sale",
    featured: "🏅 Featured",
    clearance: "🏷️ Clearance",
    coupon: "🎫 Coupon",
  };
  return (
    labels[badge] ||
    badge.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export default function ProductDetails({ product, relatedProducts = [] }) {
  const router = useRouter();
  const images = (product?.images || []).map((i) => i.url);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [descOpen, setDescOpen] = useState(false); // expand truncated description
  // hover magnifier state (desktop only)
  const [magnify, setMagnify] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imgBoxRef = React.useRef(null);
  // touch swipe state for zoom modal
  const touchStartX = React.useRef(null);
  const currentImage = images[currentIndex] || "/assets/placeholder.svg";

  const handleMagnifyMove = (e) => {
    const rect = imgBoxRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  // keyboard navigation in zoom modal
  useEffect(() => {
    if (!zoomOpen || images.length <= 1) return;
    const handler = (e) => {
      if (e.key === "ArrowLeft")
        setCurrentIndex((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight")
        setCurrentIndex((i) => (i + 1) % images.length);
      if (e.key === "Escape") setZoomOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [zoomOpen, images.length]);

  useEffect(() => {
    const updateViewport = () => setIsDesktop(window.innerWidth >= 1024);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (product) saveRecentlyViewed(product);
  }, [product]);

  useEffect(() => {
    if (product?._id) {
      fetch(`${API}/api/analytics/view/${product._id}`, {
        method: "POST",
      }).catch(() => {});
    }
  }, [product?._id]);

  // Inject Product JSON-LD schema for SEO
  useEffect(() => {
    if (!product) return;
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://applebd.com";
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      description:
        typeof product.description === "string"
          ? product.description
          : Array.isArray(product.description)
            ? product.description
                .map((b) => (typeof b === "string" ? b : b?.text || ""))
                .join(" ")
            : "",
      image: (product.images || []).map((i) => i.url).filter(Boolean),
      sku: product.sku || undefined,
      brand: product.department
        ? { "@type": "Brand", name: product.department }
        : undefined,
      offers: {
        "@type": "Offer",
        url: `${SITE_URL}/product/${product._id}`,
        priceCurrency: "BDT",
        price: product.price,
        availability:
          product.availability === "out_of_stock"
            ? "https://schema.org/OutOfStock"
            : "https://schema.org/InStock",
        seller: { "@type": "Organization", name: "AppleBD" },
      },
      ...(product.averageRating > 0 && product.reviewCount > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: product.averageRating.toFixed(1),
              reviewCount: product.reviewCount,
              bestRating: 5,
              worstRating: 1,
            },
          }
        : {}),
    };
    const existing = document.getElementById("product-jsonld");
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.id = "product-jsonld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [product]);

  // Update document title, meta tags, and canonical link client-side.
  // For __placeholder__ pages (new products added after build), this ensures
  // Google sees real metadata on its JS-rendering pass.
  useEffect(() => {
    if (!product) return;

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://applebd.com";

    const seoTitle = product.seo?.title || product.title;
    const seoDesc =
      product.seo?.description ||
      (typeof product.description === "string"
        ? product.description.replace(/<[^>]*>/g, "").slice(0, 160)
        : `Buy ${product.title} at AppleBD. Best price, fast delivery across Bangladesh.`);
    const seoKeywords = (product.seo?.keywords || []).join(", ");
    const seoImage = product.images?.[0]?.url || `${SITE_URL}/mainLogo.png`;
    const productUrl = `${SITE_URL}/product/${product._id}`;

    const prevTitle = document.title;
    document.title = `${seoTitle} | AppleBD`;

    const setMeta = (selector, attr, value) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement("meta");
        const [attrName, attrVal] =
          selector.match(/\[([^=]+)="([^"]+)"\]/)?.slice(1) || [];
        if (attrName) el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', "content", seoDesc);
    if (seoKeywords) setMeta('meta[name="keywords"]', "content", seoKeywords);
    setMeta('meta[property="og:title"]', "content", `${seoTitle} | AppleBD`);
    setMeta('meta[property="og:description"]', "content", seoDesc);
    setMeta('meta[property="og:image"]', "content", seoImage);
    setMeta('meta[property="og:url"]', "content", productUrl);
    setMeta('meta[property="og:type"]', "content", "website");
    setMeta('meta[name="twitter:title"]', "content", `${seoTitle} | AppleBD`);
    setMeta('meta[name="twitter:description"]', "content", seoDesc);
    setMeta('meta[name="twitter:image"]', "content", seoImage);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", productUrl);

    return () => {
      document.title = prevTitle;
    };
  }, [product]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const handleCopy = () => {
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const prevImage = () => {
    if (images.length)
      setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  };
  const nextImage = () => {
    if (images.length) setCurrentIndex((i) => (i + 1) % images.length);
  };

  if (!product)
    return (
      <div className="py-24 text-center text-gray-500">Loading product...</div>
    );

  const {
    title,
    description,
    inventory,
    availability,
    averageRating = 0,
    reviewCount = 0,
    category,
  } = product;
  // Get all colors and sizes from variants (unfiltered)
  const allColors = getVariantColors(product);
  const allSizes = getVariantSizes(product);

  // Get filtered colors/sizes based on current selection
  // When a size is selected, show only colors available for that size
  // When a color is selected, show only sizes available for that color
  const productColors = selectedSize
    ? getVariantColors(product, selectedSize)
    : allColors;
  const productSizes = selectedColor
    ? getVariantSizes(product, selectedColor)
    : allSizes;
  const selectedVariant =
    Array.isArray(product.variants) && product.variants.length
      ? product.variants.find((variant) => {
          const variantColor = String(
            variant?.color?.name ||
              variant?.attributes?.Color ||
              variant?.attributes?.color ||
              "",
          )
            .trim()
            .toLowerCase();
          const variantSize = String(
            variant?.size ||
              variant?.attributes?.Size ||
              variant?.attributes?.size ||
              "",
          )
            .trim()
            .toLowerCase();
          const color = String(selectedColor?.name || "")
            .trim()
            .toLowerCase();
          const size = String(selectedSize || "")
            .trim()
            .toLowerCase();
          if (!color && !size) return false;
          return (
            (!variantColor || !color || variantColor === color) &&
            (!variantSize || !size || variantSize === size) &&
            ((variantColor && color && variantColor === color) ||
              (variantSize && size && variantSize === size))
          );
        }) || null
      : null;
  const { price, compareAtPrice, discountPct } = selectedVariant
    ? getDisplayPrice(product, selectedVariant)
    : {
        price: Number(product.price) || 0,
        compareAtPrice: Number(product.compareAtPrice) || null,
        discountPct:
          product.compareAtPrice && product.compareAtPrice > product.price
            ? Math.round(
                ((product.compareAtPrice - product.price) /
                  product.compareAtPrice) *
                  100,
              )
            : null,
      };

  const tabProduct = { ...product, description };
  const topBadges = [
    ...(product.freeShipping ? ["free_shipping"] : []),
    ...(product.flashSale ? ["flash_sale"] : []),
    ...(product.featured ? ["featured"] : []),
    ...(product.clearance ? ["clearance"] : []),
    ...(product.coupon ? ["coupon"] : []),
    ...(product.badges || []).filter((b) => b !== "free_shipping"),
  ].slice(0, 3);

  const resolveColor = (col) => {
    // 1. Use hex if provided — ensure it starts with #
    if (col.hex && col.hex.trim()) {
      const h = col.hex.trim();
      return h.startsWith("#") ? h : `#${h}`;
    }
    // 2. Look up name in map (exact, then partial)
    const key = (col.name || "").toLowerCase().trim();
    if (COLOR_MAP[key]) return COLOR_MAP[key];
    // partial match — e.g. "Dark Navy Blue" → try "navy blue", "blue"
    for (const mapKey of Object.keys(COLOR_MAP)) {
      if (key.includes(mapKey)) return COLOR_MAP[mapKey];
    }
    // 3. Return as-is (valid CSS color names like "red", "blue" still work)
    return col.name || "#cccccc";
  };

  return (
    <div
      key={product?._id || product?.id}
      className="max-w-7xl mx-auto py-6 px-3 sm:px-4 lg:px-8"
    >
      {/* Breadcrumb row */}
      <nav className="flex items-center flex-wrap gap-1.5 text-sm text-[#6B7280] mb-5">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-full px-3 py-1 text-xs font-medium text-[#6B7280] hover:text-[#1D1D1F] hover:border-[#1D1D1F] shadow-sm transition-colors mr-2"
        >
          <FaChevronLeft className="w-2.5 h-2.5" /> Back
        </button>
        <Link href="/" className="hover:text-[#1D1D1F] transition-colors">
          Home
        </Link>
        {category && (
          <>
            <span className="text-gray-300">/</span>
            {typeof category === "object" && category.slug ? (
              <Link
                href={`/category/${category.slug}/`}
                className="hover:text-[#1D1D1F] transition-colors"
              >
                {category.name}
              </Link>
            ) : (
              <span>
                {typeof category === "object" ? category.name : category}
              </span>
            )}
          </>
        )}
        <span className="text-gray-300">/</span>
        <span className="text-[#1D1D1F] font-medium truncate max-w-[200px] sm:max-w-xs">
          {title}
        </span>
      </nav>

      {/* ── Main product section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* ── LEFT: image gallery (wider, sticky) ── */}
        <div className="lg:col-span-7">
          <div className="lg:sticky lg:top-24 flex flex-col-reverse sm:flex-row gap-3">
            {/* Vertical thumbnail rail (horizontal on mobile) */}
            {images.length > 1 && (
              <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-x-visible sm:overflow-y-auto sm:max-h-[560px] sm:w-[74px] shrink-0 pb-1 sm:pb-0 sm:pr-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    onMouseEnter={() => isDesktop && setCurrentIndex(idx)}
                    className={`w-14 h-14 sm:w-[70px] sm:h-[70px] shrink-0 rounded-xl border-2 overflow-hidden transition bg-white ${
                      currentIndex === idx
                        ? "border-[#1D1D1F] ring-2 ring-gray-100 shadow-md"
                        : "border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    <Image
                      src={encodeURI(img)}
                      alt={`${title} ${idx + 1}`}
                      width={70}
                      height={70}
                      className="object-contain w-full h-full p-0.5"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main image + magnifier panel wrapper */}
            <div className="relative flex-1 min-w-0">
              <div
                ref={imgBoxRef}
                id="pdp-main-image"
                onMouseEnter={() => isDesktop && setMagnify(true)}
                onMouseLeave={() => setMagnify(false)}
                onMouseMove={handleMagnifyMove}
                className="relative bg-white border border-gray-100 w-full aspect-square flex items-center justify-center overflow-hidden rounded-2xl shadow-sm"
              >
                {images.length > 1 && (
                  <button
                    onClick={prevImage}
                    className="absolute left-1 md:left-2 z-20 p-2 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-[#1D1D1F] hover:text-white text-gray-600 transition-colors"
                  >
                    <FaChevronLeft className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => setZoomOpen(true)}
                  className="w-full h-full cursor-zoom-in flex items-center justify-center"
                  title="Click to zoom"
                >
                  <Image
                    src={encodeURI(currentImage)}
                    alt={title}
                    width={700}
                    height={700}
                    className="w-full h-full object-contain p-2 md:p-6"
                  />
                </button>
                {/* Magnifier lens — highlights the area being zoomed */}
                {magnify && isDesktop && (
                  <span
                    className="absolute z-10 pointer-events-none rounded-lg border-2 border-[#1D1D1F]/50 bg-gray-500/10 hidden lg:block"
                    style={{
                      width: "40%",
                      height: "40%",
                      left: `${zoomPos.x * 0.6}%`,
                      top: `${zoomPos.y * 0.6}%`,
                    }}
                  />
                )}
                {images.length > 1 && (
                  <button
                    onClick={nextImage}
                    className="absolute right-1 md:right-2 z-20 p-2 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-[#1D1D1F] hover:text-white text-gray-600 transition-colors"
                  >
                    <FaChevronRight className="w-3 h-3" />
                  </button>
                )}
                {/* Image counter */}
                {images.length > 1 && (
                  <span className="absolute bottom-3 right-3 z-10 bg-black/45 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {currentIndex + 1} / {images.length}
                  </span>
                )}
                {discountPct && (
                  <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                    -{discountPct}%
                  </span>
                )}
                {/* Product badges — top right, flat monochrome pills */}
                {topBadges.length > 0 && (
                  <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                    {topBadges.map((badge) => (
                      <span key={badge} className={BADGE_STYLE}>
                        {badgeLabel(badge)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Magnifier result panel — floats to the right (desktop, extra-wide screens only) */}
              {magnify && isDesktop && (
                <div
                  className="hidden xl:block absolute top-0 left-full ml-4 z-30 h-full w-[420px] rounded-2xl border border-gray-100 bg-white shadow-2xl pointer-events-none bg-no-repeat"
                  style={{
                    backgroundImage: `url("${encodeURI(currentImage)}")`,
                    backgroundSize: "250%",
                    backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: sticky buy box ── */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24 flex flex-col gap-4">
            {/* Title */}
            <h1 className="text-xl md:text-2xl text-[#1F2937] leading-tight font-georgia">
              {title}
            </h1>

            {/* Stars + review link */}
            <div className="flex items-center gap-2 -mt-2">
              <StarDisplay value={averageRating} count={reviewCount} />
              <span className="text-gray-300">|</span>
              <button
                onClick={scrollToReviews}
                className="text-xs text-[#6B7280] hover:text-[#1D1D1F] underline underline-offset-3 transition-colors"
              >
                Write a review
              </button>
            </div>

            {/* Price */}
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-2xl md:text-3xl font-bold text-[#1D1D1F]">
                  ৳{price?.toLocaleString()}
                </span>
                {compareAtPrice && compareAtPrice > price && (
                  <span className="text-sm text-gray-400 line-through font-normal">
                    ৳{compareAtPrice?.toLocaleString()}
                  </span>
                )}
                {discountPct && (
                  <span className="bg-gray-50 text-[#1D1D1F] text-xs font-bold px-2.5 py-1 rounded-full border border-gray-200">
                    Save {discountPct}%
                  </span>
                )}
              </div>
              {product.freeShipping && (
                <p className="inline-flex items-center gap-1.5 w-fit text-sm font-semibold text-green-700 bg-green-50 border border-green-100 rounded-full px-3 py-1 mt-2.5">
                  <FaTruck className="w-3.5 h-3.5" /> Free Shipping
                </p>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* Description */}
            {toPlainText(description) && (
              <div>
                <p
                  className={`text-[#6B7280] text-sm leading-relaxed ${
                    descOpen ? "" : "line-clamp-4"
                  }`}
                >
                  {toPlainText(description)}
                </p>
                {toPlainText(description).length > 180 && (
                  <button
                    type="button"
                    onClick={() => setDescOpen((v) => !v)}
                    aria-expanded={descOpen}
                    className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-[#1D1D1F] hover:text-black transition-colors"
                  >
                    {descOpen ? "Less" : "More"}
                    <FaChevronDown
                      className={`w-2.5 h-2.5 transition-transform ${
                        descOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                )}
              </div>
            )}

            {/* Stock */}
            <StockBadge inventory={inventory} availability={availability} />

            {/* Color swatches */}
            {productColors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-800">
                    Color:
                  </span>
                  {selectedColor && (
                    <span className="text-sm text-gray-600 font-medium px-2 py-0.5 bg-gray-100 rounded">
                      {selectedColor.name}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {productColors.map((col, idx) => {
                    const isSelected = selectedColor?.name === col.name;
                    const color = resolveColor(col);
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedColor(isSelected ? null : col)}
                        title={col.name}
                        className="flex flex-col items-center gap-1.5 transition-all group"
                      >
                        <span
                          className={`w-12 h-12 rounded-full block transition-all relative ${
                            isSelected
                              ? "scale-110 ring-2 ring-offset-2 ring-[#1D1D1F]"
                              : "hover:scale-105"
                          }`}
                          style={{
                            backgroundColor: color,
                            border: "2px solid #e5e7eb",
                            boxShadow: isSelected
                              ? `0 4px 12px ${color}50`
                              : "0 2px 4px rgba(0,0,0,.1)",
                          }}
                        >
                          {isSelected && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <svg
                                className="w-5 h-5 text-white drop-shadow-md"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          )}
                        </span>
                        <span
                          className={`text-xs text-center max-w-[50px] truncate transition-colors ${
                            isSelected
                              ? "font-bold text-[#1D1D1F]"
                              : "text-gray-500 group-hover:text-gray-700"
                          }`}
                        >
                          {col.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size selector — box style */}
            {productSizes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-gray-800">
                    Size:
                  </span>
                  {selectedSize && (
                    <span className="text-sm text-gray-600 font-medium px-2 py-0.5 bg-gray-100 rounded">
                      {selectedSize}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {productSizes.map((size, idx) => (
                    <button
                      key={idx}
                      onClick={() =>
                        setSelectedSize(selectedSize === size ? null : size)
                      }
                      className={`min-w-[48px] h-11 px-4 text-sm font-semibold rounded-xl border-2 transition-all ${
                        selectedSize === size
                          ? "bg-[#1D1D1F] text-white border-[#1D1D1F] shadow-md scale-105"
                          : "bg-white text-gray-700 border-gray-200 hover:border-[#1D1D1F] hover:bg-gray-50"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add cart */}
            <AddToCartSection
              product={product}
              selectedColor={selectedColor?.name ?? null}
              selectedSize={selectedSize ?? null}
            />

            <hr className="border-gray-100" />

            {/* Trust & offers strip — flat, monochrome, no cards-within-cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
              <div className="flex items-start gap-2.5">
                <FaGift className="text-[#1D1D1F] w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#1F2937] font-georgia">
                    Earn Points
                  </p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    {product.rewardPoints > 0
                      ? `${product.rewardPoints} points on this order`
                      : "Credited after delivery"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <FaTruck className="text-[#1D1D1F] w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#1F2937] font-georgia">
                    3–5 Working Days
                  </p>
                  <a
                    href="/shipping"
                    className="text-[11px] underline underline-offset-2 text-[#1D1D1F] hover:text-black transition-colors"
                  >
                    Shipping &amp; Return
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <FaShieldAlt className="text-[#1D1D1F] w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#1F2937] font-georgia">
                    Safe Checkout
                  </p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    100% guaranteed
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const el = document.getElementById("reviews-tab");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                  window.dispatchEvent(new Event("openQuestions"));
                }}
                className="flex items-start gap-2.5 text-left"
              >
                <FaCommentDots className="text-[#1D1D1F] w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#1F2937] font-georgia">
                    Have a Question?
                  </p>
                  <p className="text-[11px] text-[#1D1D1F] underline underline-offset-2 mt-0.5">
                    Ask about this product
                  </p>
                </div>
              </button>
            </div>

            {/* SKU / Category / Share */}
            <div className="flex flex-col gap-2 text-sm">
              {category && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 w-20 flex-shrink-0">
                    Category:
                  </span>
                  <span className="text-gray-600">
                    {typeof category === "object" ? category.name : category}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-20 flex-shrink-0">Share:</span>
                <div className="flex items-center gap-3">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-blue-600 transition"
                  >
                    <FaFacebook className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-sky-500 transition"
                  >
                    <FaTwitter className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(title + " " + shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-green-600 transition"
                  >
                    <FaWhatsapp className="w-4 h-4" />
                  </a>
                  <button
                    onClick={handleCopy}
                    title="Copy link"
                    className="text-gray-500 hover:text-gray-800 transition"
                  >
                    <FaCopy className="w-4 h-4" />
                  </button>
                  {copied && (
                    <span className="text-xs text-green-600">Copied!</span>
                  )}
                </div>
              </div>
            </div>

            <AdSlot page="productPage" format="rectangle" className="w-full" />
          </div>
        </div>
      </div>

      {/* product info tabs */}
      <div id="reviews-tab" className="mt-10">
        <ProductInfoTabs product={tabProduct} />
      </div>

      {/* ad above related products */}
      <AdSlot page="productPage" className="max-w-6xl mx-auto px-4 mt-10" />

      {/* related products */}
      <RelatedProducts products={relatedProducts} />

      {/* detailed description blocks */}
      {product?.detailedDescription && (
        <DetailedDescriptionRenderer value={product.detailedDescription} />
      )}

      {/* recently viewed — always at the very bottom */}
      <RecentlyViewed
        currentProductId={product?._id}
        mobilePerRow={3}
        desktopPerRow={6}
        rows={1}
      />

      {/* ── Image Zoom Modal ── */}
      {zoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setZoomOpen(false)}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null || images.length <= 1) return;
            const diff = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(diff) > 50) {
              if (diff < 0) setCurrentIndex((i) => (i + 1) % images.length);
              else
                setCurrentIndex((i) => (i - 1 + images.length) % images.length);
            }
            touchStartX.current = null;
          }}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setZoomOpen(false)}
              className="absolute top-2 right-2 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md transition"
            >
              <FaTimes className="w-3.5 h-3.5 text-gray-700" />
            </button>

            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-xs font-semibold px-3 py-1 rounded-full">
                {currentIndex + 1} / {images.length}
              </div>
            )}

            {/* Prev / Next */}
            {images.length > 1 && (
              <button
                onClick={() =>
                  setCurrentIndex(
                    (i) => (i - 1 + images.length) % images.length,
                  )
                }
                className="absolute left-2 z-10 p-2.5 bg-white/90 rounded-full shadow-md hover:bg-white hover:scale-110 transition-all"
              >
                <FaChevronLeft className="w-4 h-4 text-gray-700" />
              </button>
            )}
            {images.length > 1 && (
              <button
                onClick={() => setCurrentIndex((i) => (i + 1) % images.length)}
                className="absolute right-2 z-10 p-2.5 bg-white/90 rounded-full shadow-md hover:bg-white hover:scale-110 transition-all"
              >
                <FaChevronRight className="w-4 h-4 text-gray-700" />
              </button>
            )}

            {/* Zoomed image */}
            <div
              className="bg-white rounded-2xl overflow-hidden flex items-center justify-center shadow-2xl"
              style={{
                maxWidth: "720px",
                maxHeight: "80vh",
                width: "100%",
                height: "100%",
              }}
            >
              <Image
                src={encodeURI(currentImage)}
                alt={title}
                width={900}
                height={900}
                className="w-full h-full object-contain p-4"
              />
            </div>

            {/* Keyboard hint */}
            {images.length > 1 && (
              <p className="absolute bottom-16 left-1/2 -translate-x-1/2 text-white/40 text-[10px] whitespace-nowrap hidden md:block">
                ← → keys to navigate · ESC to close
              </p>
            )}

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 overflow-x-auto max-w-[90vw] pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-12 h-12 shrink-0 rounded-lg border-2 overflow-hidden bg-white transition-all ${
                      currentIndex === idx
                        ? "border-white scale-110 shadow-lg"
                        : "border-white/30 hover:border-white/70 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={encodeURI(img)}
                      alt={`thumb-${idx}`}
                      width={48}
                      height={48}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
