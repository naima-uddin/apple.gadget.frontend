"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";
import {
  FaShoppingCart,
  FaHeart,
  FaBell,
  FaStar,
  FaBalanceScale,
} from "react-icons/fa";
import { useCart } from "@/components/context/CartContext";
import { useUser } from "@/components/context/UserContext";
import AuthModal from "@/components/auth/AuthModal";
import WaitlistModal from "@/components/cart/WaitlistModal";
import {
  getVariantColors,
  getColorImageMap,
} from "@/components/cart/VariantEditModal";
import { getDisplayPrice } from "@/lib/pricing";
import { useCompare } from "@/components/context/CompareContext";
import { useLanguage } from "@/components/context/LanguageContext";
import Skeleton from "@/components/ui/Skeleton";
import { flyToCart } from "@/lib/flyToCart";

export default function ProductCard({
  product,
  imageWidth = 400,
  imageHeight = 250,
  imageQuality = 100,
  showActionsOnHover = true,
  showDiscount = true,
  maxTags = 3,
  loading = false,
  imageFit = "cover",
}) {
  const router = useRouter();
  const { addToCart, addToWishlist } = useCart();
  const { user } = useUser();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const { t } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [selectedColor, setSelectedColor] = React.useState(null);
  const [hovered, setHovered] = React.useState(false);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [pendingWishlist, setPendingWishlist] = React.useState(null);
  const [waitlistProduct, setWaitlistProduct] = React.useState(null);
  const imageRef = React.useRef(null);

  React.useEffect(() => {
    if (user && pendingWishlist) {
      addToWishlist(pendingWishlist);
      setPendingWishlist(null);
    }
  }, [user, pendingWishlist, addToWishlist]);

  if (loading || !product) {
    // simple skeleton card placeholder
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col h-full">
        <Skeleton className="w-full h-[200px]" />
        <div className="p-3 flex flex-col grow">
          <Skeleton className="h-4 mb-2 w-3/4" />
          <Skeleton className="h-4 mb-2 w-full" />
          <Skeleton className="h-6 w-1/2 mt-auto" />
        </div>
      </div>
    );
  }
  const {
    price,
    compareAtPrice: compareAt,
    discountPct: resolvedDiscount,
  } = getDisplayPrice(product);
  const discountPct = showDiscount ? resolvedDiscount : null;

  // badge config — priority order determines which show first
  const BADGE_PRIORITY = [
    "free_shipping",
    "flash_sale",
    "hot",
    "best_seller",
    "new_arrival",
    "trending",
    "limited",
    "popular_pics",
    "deals_of_the_day",
    "featured",
    "clearance",
    "coupon",
  ];
  // Premium monochrome badge system — two tiers only, no rainbow fills:
  //  • SOLID  = high-emphasis status (solid #1D1D1F pill, white text)
  //  • CHIP   = informational (frosted white chip, dark text, hairline ring)
  const SOLID = "bg-[#1D1D1F] text-white shadow-sm";
  const CHIP =
    "bg-white/85 text-[#1D1D1F] ring-1 ring-black/10 backdrop-blur-sm shadow-sm";
  const BADGE_MAP = {
    best_seller: { label: "Best Seller", cls: SOLID },
    hot: { label: "Hot", cls: SOLID },
    new_arrival: { label: "New", cls: CHIP },
    trending: { label: "Trending", cls: SOLID },
    limited: { label: "Limited", cls: CHIP },
    popular_pics: { label: "Popular", cls: CHIP },
    deals_of_the_day: { label: "Deal", cls: SOLID },
    free_shipping: { label: "Free Ship", cls: CHIP },
    flash_sale: { label: "Flash Sale", cls: SOLID },
    featured: { label: "Featured", cls: SOLID },
    clearance: { label: "Clearance", cls: CHIP },
    coupon: { label: "Coupon", cls: CHIP },
  };

  // collect active flag-based pseudo-badges
  const flagBadges = [
    product.freeShipping && "free_shipping",
    product.flashSale && "flash_sale",
    product.featured && "featured",
    product.clearance && "clearance",
    product.coupon && "coupon",
  ].filter(Boolean);

  // priority-sorted standard badges + flag badges
  const prioritySorted = BADGE_PRIORITY.filter(
    (b) => (product.badges || []).includes(b) || flagBadges.includes(b),
  );
  // append any custom badges not in BADGE_PRIORITY
  const customBadges = (product.badges || []).filter(
    (b) => !BADGE_PRIORITY.includes(b),
  );
  const visibleTags = [...prioritySorted, ...customBadges].slice(0, maxTags);

  // handle image navigation
  const images =
    product.images && product.images.length
      ? product.images.map((i) => i.url)
      : ["/assets/placeholder.svg"];

  const currentImage = () => {
    // When a color is selected, lock the image to that color's mapped image —
    // don't swap to the next image on hover. Hover-swap only applies when no
    // color is selected.
    if (!selectedColor && hovered && images[currentImageIndex + 1]) {
      return images[currentImageIndex + 1];
    }
    return images[currentImageIndex];
  };
  const image = encodeURI(currentImage());
  // Always fly the resting/main image to the cart — never the hover-preview image
  const mainImage = encodeURI(images[currentImageIndex]);

  const id = product._id || product.id;
  const isOutOfStock =
    product.availability === "out_of_stock" || product.inventory === 0;
  const href = `/product/${id}/`;

  return (
    <>
      <div
        className="relative bg-white border border-gray-200 ring-1 ring-black/[0.02] rounded-[20px] shadow-premium group hover:shadow-premium-hover hover:-translate-y-1.5 hover:border-gray-300 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col cursor-pointer h-full overflow-hidden"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Stretched link — full-card click target. Buttons below sit above it
            (higher z-index) so they stay clickable without being nested in <a>. */}
        <Link
          href={href}
          aria-label={product.title || product.slug}
          className="absolute inset-0 z-[1]"
        >
          <span className="sr-only">{product.title || product.slug}</span>
        </Link>
        <div
          className="relative surface-product rounded-t-2xl overflow-hidden border-b border-gray-100"
          style={{ height: imageHeight }}
        >
          <div className="absolute inset-0  flex items-center justify-center overflow-hidden">
            <Image
              ref={imageRef}
              src={image}
              alt={product.title || product.slug}
              width={imageWidth}
              height={imageHeight}
              quality={imageQuality}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/assets/placeholder.svg";
              }}
              className={`w-full h-full ${imageFit === "contain" ? "object-contain p-1" : "object-cover"} group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer`}
            />
          </div>

          {/* Image indicators - only show if more than 1 image */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    idx === currentImageIndex
                      ? "bg-[#1D1D1F] w-4"
                      : "bg-gray-300 w-1.5 hover:bg-[#1D1D1F]"
                  }`}
                  aria-label={`View image ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Overlay: discount LEFT, tags RIGHT — hidden on hover to show action buttons */}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-1.5 pointer-events-none group-hover:opacity-0 transition-opacity duration-200">
            {/* Discount badge — top left */}
            <div>
              {discountPct && (
                <span className="bg-[#1D1D1F]/90 text-white text-[10px] font-bold px-2 py-1 rounded-full leading-none shadow-sm backdrop-blur-sm ring-1 ring-white/10">
                  -{discountPct}%
                </span>
              )}
            </div>
            {/* Tags — top right, stacked */}
            <div className="flex flex-col items-end gap-0.5">
              {product.availability === "pre_order" && (
                <span className={`${CHIP} text-[9px] font-semibold tracking-wide px-2 py-0.5 rounded-full leading-none`}>
                  Pre-Order
                </span>
              )}
              {visibleTags.map((b) => {
                const badge = BADGE_MAP[b] || {
                  label: b
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase()),
                  cls: SOLID,
                };
                return (
                  <span
                    key={b}
                    className={`${badge.cls} text-[9px] font-semibold tracking-wide px-2 py-0.5 rounded-full leading-none`}
                  >
                    {badge.label}
                  </span>
                );
              })}
            </div>
          </div>

          <div
            className={`absolute top-2 right-2 z-30 flex flex-col items-center gap-2.5 transition-opacity duration-300 pointer-events-none ${showActionsOnHover ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!user) {
                  setPendingWishlist(product);
                  setShowAuthModal(true);
                } else {
                  addToWishlist(product);
                }
              }}
              className="pointer-events-auto w-9 h-9 bg-white/95 backdrop-blur-sm ring-1 ring-black/5 rounded-full flex items-center justify-center shadow-md hover:bg-[#1D1D1F] hover:text-white hover:scale-105 transition-all"
              title="Add to wishlist"
            >
              <FaHeart className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isInCompare(product._id)) removeFromCompare(product._id);
                else addToCompare(product);
              }}
              className={`pointer-events-auto w-9 h-9 rounded-full flex items-center justify-center shadow-md ring-1 ring-black/5 backdrop-blur-sm hover:scale-105 transition-all ${
                isInCompare(product._id)
                  ? "bg-[#1D1D1F] text-white"
                  : "bg-white/95 hover:bg-[#1D1D1F] hover:text-white"
              }`}
              title={
                isInCompare(product._id)
                  ? "Remove from compare"
                  : "Compare Product"
              }
            >
              <FaBalanceScale className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-2 pt-2 sm:p-3 sm:pt-2.5 flex flex-col grow">
          <h3 className="text-xs sm:text-[13px] font-semibold text-[#1F2937] leading-snug truncate">
            {product.title || product.slug}
          </h3>
          {product.description && (
            <p className="text-xs text-[#6B7280] mb-1 truncate">
              {product.description}
            </p>
          )}

          {/* Price + swatches on one tight row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-[15px] sm:text-[17px] font-bold text-[#1D1D1F] tracking-tight whitespace-nowrap">
                ৳{price?.toLocaleString()}
              </span>
              {compareAt && compareAt > price && (
                <span className="text-xs text-gray-400 line-through whitespace-nowrap">
                  ৳{compareAt?.toLocaleString()}
                </span>
              )}
            </div>
            {/* Color swatches - extracted from variants. Clicking a swatch
                switches the card image to the image mapped to that color. */}
            {(() => {
              const variantColors = getVariantColors(product);
              if (variantColors.length === 0) return null;
              const colorImageMap = getColorImageMap(product);
              return (
                <div className="relative z-[2] flex items-center gap-1 shrink-0">
                  {variantColors.slice(0, 4).map((c, i) => {
                    const hex = c.hex?.trim()
                      ? c.hex.startsWith("#")
                        ? c.hex
                        : `#${c.hex}`
                      : "#cccccc";
                    const key = c.name?.trim()?.toLowerCase();
                    const mappedUrl = key ? colorImageMap[key] : null;
                    const isSelected = selectedColor === key;
                    return (
                      <button
                        key={i}
                        type="button"
                        title={c.name}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedColor(key);
                          if (mappedUrl) {
                            const idx = images.findIndex(
                              (img) => img === mappedUrl,
                            );
                            if (idx >= 0) setCurrentImageIndex(idx);
                          }
                        }}
                        className={`pointer-events-auto w-3.5 h-3.5 rounded-full inline-block border transition-all ${
                          isSelected
                            ? "ring-2 ring-offset-1 ring-[#1D1D1F] border-white"
                            : "border-gray-200 hover:scale-110"
                        }`}
                        style={{ backgroundColor: hex }}
                        aria-label={`Show ${c.name}`}
                      />
                    );
                  })}
                  {variantColors.length > 4 && (
                    <span className="text-[10px] text-gray-400 leading-4">
                      +{variantColors.length - 4}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
          <div className="flex items-center gap-2">
            {product.freeShipping && (
              <p className="text-[11px] font-semibold text-[#1D1D1F]">
                {t("home.free_shipping")}
              </p>
            )}
            {Number(product.rewardPoints) > 0 && (
              <span className="inline-flex items-center gap-1 bg-[#1D1D1F]/5 text-[#1D1D1F] ring-1 ring-black/10 text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                <FaStar className="w-2 h-2 text-[#1D1D1F]" />
                {product.rewardPoints} points
              </span>
            )}
          </div>

          {isOutOfStock ? (
            <div className="relative z-2 mt-auto pt-2.5 flex gap-1.5">
              <button
                disabled
                className="bg-gray-100 text-gray-500 py-2 px-2 rounded-full text-[10px] font-medium cursor-not-allowed whitespace-nowrap"
              >
                {t("home.out_of_stock")}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setWaitlistProduct(product);
                }}
                className="flex-1 flex items-center justify-center border border-gray-300 text-[#1D1D1F] gap-0.5 py-2 rounded-full text-[8px] md:text-[8px] font-semibold hover:bg-[#F5F5F7] hover:border-gray-400 transition"
              >
                <FaBell className="w-2 h-2 hidden md:block -mr-0.5" /> Join
                Waitlist
              </button>
            </div>
          ) : (
            <div className="relative z-2 mt-auto pt-1.5 flex gap-1.5">
              {/* Buy Now — light gray, straight to checkout */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  flyToCart(imageRef.current, mainImage);
                  addToCart(product, 1, { silent: true });
                  router.push("/checkout");
                }}
                className="flex-1 bg-[#F5F5F7] border border-gray-200/80 text-[#1D1D1F] py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold hover:bg-[#E8E8ED] hover:border-gray-300 active:scale-[0.98] transition-all cursor-pointer"
              >
                {t("product.buy_now")}
              </button>
              {/* Add cart — icon-only black button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  flyToCart(imageRef.current, mainImage);
                  addToCart(product, 1);
                }}
                className="shrink-0 flex items-center justify-center bg-[#1D1D1F] text-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full hover:bg-black active:scale-95 shadow-sm transition-all cursor-pointer"
                title={t("home.add_to_cart")}
                aria-label={t("home.add_to_cart")}
              >
                <FaShoppingCart className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      {waitlistProduct && (
        <WaitlistModal
          product={waitlistProduct}
          onClose={() => setWaitlistProduct(null)}
        />
      )}
    </>
  );
}
