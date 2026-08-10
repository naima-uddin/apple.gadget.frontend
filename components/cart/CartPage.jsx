"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useCart,
  getItemPrice,
  getItemCompareAtPrice,
} from "@/components/context/CartContext";
import ProductCard from "@/components/product/ProductCard";
import Image from "next/image";
import {
  FiTrash2,
  FiShare2,
  FiPlus,
  FiEdit2,
  FiArrowLeft,
  FiHome,
  FiMinus,
  FiArrowRight,
} from "react-icons/fi";
import toast from "react-hot-toast";
import VariantEditModal, {
  getVariantColors,
  getVariantSizes,
} from "@/components/cart/VariantEditModal";
import WaitlistModal from "@/components/cart/WaitlistModal";
import { useLanguage } from "@/components/context/LanguageContext";
import EmptyCartAnimation from "@/components/ui/EmptyCartAnimation";

export default function CartPage({ embedded = false }) {
  const router = useRouter();
  const {
    cartItems,
    cartHydrated,
    updateQty,
    removeFromCart,
    updateCartVariant,
    shareCart,
  } = useCart();
  const { t } = useLanguage();
  const [editItem, setEditItem] = useState(null);
  const [editMode, setEditMode] = useState("edit"); // 'edit' or 'add'
  const [waitlistProduct, setWaitlistProduct] = useState(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const url = await shareCart();
      if (navigator.share) {
        await navigator.share({ title: "My AppleBD Cart", url });
      } else {
        await navigator.clipboard?.writeText(url);
        toast.success("Cart link copied to clipboard!");
      }
    } catch (err) {
      if (err?.name !== "AbortError")
        toast.error("Could not share cart. Try again.");
    } finally {
      setSharing(false);
    }
  };

  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [recLoading, setRecLoading] = useState(true);

  // Aggregate frequently bought together products from all cart items
  const fbtProducts = React.useMemo(() => {
    const inCartIds = new Set(
      cartItems.map((i) => String(i.product?._id || i.product?.id)),
    );
    const seen = new Set(inCartIds);
    const results = [];
    for (const item of cartItems) {
      const fbt = item.product?.frequentlyBoughtTogether;
      if (!Array.isArray(fbt)) continue;
      for (const p of fbt) {
        if (!p || !(p._id || p.id)) continue;
        const pid = String(p._id || p.id);
        if (!seen.has(pid)) {
          seen.add(pid);
          results.push(p);
        }
      }
    }
    return results;
  }, [cartItems]);

  // Calculate totals
  const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (sum, item) => sum + getItemPrice(item) * item.quantity,
    0,
  );
  const anyFreeShip = cartItems.some((i) => i.product.freeShipping);
  const originalTotal = cartItems.reduce(
    (sum, item) =>
      sum + (getItemCompareAtPrice(item) || getItemPrice(item)) * item.quantity,
    0,
  );
  const saved = Math.max(0, originalTotal - subtotal);

  // Fetch recommended products — tries popular_pics badge first, falls back to recent
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
    setRecLoading(true);
    fetch(`${API}/api/products?badge=popular_pics&limit=12`)
      .then((r) => r.json())
      .then((json) => {
        const items = json.items || json.products || [];
        if (items.length > 0) {
          setRecommendedProducts(items);
          return;
        }
        // Fallback: fetch any recent products
        return fetch(`${API}/api/products?limit=12&sort=newest`)
          .then((r) => r.json())
          .then((j) => setRecommendedProducts(j.items || j.products || []));
      })
      .catch(() => {})
      .finally(() => setRecLoading(false));
  }, []);

  const handleCheckout = () => {
    router.push("/checkout");
  };

  // Wait for localStorage hydration before deciding cart is empty
  if (!cartHydrated) {
    return (
      <div
        className={
          embedded
            ? "flex items-center justify-center py-8"
            : "min-h-screen bg-gray-50 flex items-center justify-center"
        }
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#1D1D1F] animate-spin" />
          </div>
          <span className="text-sm text-[#6B7280]">{t("cart.loading")}</span>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div
        className={
          embedded
            ? "flex items-center justify-center py-10"
            : "min-h-[75vh] bg-gray-50 flex items-center justify-center px-4"
        }
      >
        <div className="text-center max-w-sm w-full">
          <EmptyCartAnimation className="w-64 h-64 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#1F2937] mb-2">
            {t("cart.cart_empty_title")}
          </h1>
          <p className="text-[#6B7280] mb-8">{t("cart.cart_empty_msg")}</p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-[#1D1D1F] text-white px-8 py-3 rounded-xl font-semibold hover:bg-black active:scale-[0.98] transition shadow-lg shadow-gray-300"
          >
            {t("success.continue_shopping")}
            <FiArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? "" : "min-h-screen bg-gray-50 py-6 md:py-10"}>
      <div className={embedded ? "" : "max-w-7xl mx-auto px-3 md:px-4"}>
        {/* Page header */}
        {!embedded && (
          <div className="flex items-end justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1F2937] flex items-center gap-3">
                {t("cart.my_cart")}
                <span className="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-full bg-gray-100 text-[#1D1D1F] text-sm font-bold">
                  {totalQty}
                </span>
              </h1>
              <p className="text-sm text-[#6B7280] mt-1">
                {totalQty} {t("cart.items_label")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.back()}
                aria-label="Go back"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-[#6B7280] hover:text-[#1D1D1F] hover:border-gray-300 transition"
              >
                <FiArrowLeft className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={() => router.push("/")}
                aria-label="Go home"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-[#6B7280] hover:text-[#1D1D1F] hover:border-gray-300 transition"
              >
                <FiHome className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        )}

        {/* Two-column layout: items + sticky summary */}
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:items-start gap-6">
          {/* ── Cart Items ─────────────────────────────────────────────── */}
          <div className="space-y-3 md:space-y-4">
            {cartItems.map((item) => {
              const {
                product,
                quantity,
                cartKey,
                selectedColor,
                selectedSize,
              } = item;
              const price = getItemPrice(item);
              const compareAt = getItemCompareAtPrice(item) || price;
              const itemSaved = Math.max(0, (compareAt - price) * quantity);
              const image =
                product.images?.[0]?.url || "/assets/placeholder.svg";
              const title = product.title || product.name;
              const allColors = getVariantColors(product);
              const allSizes = getVariantSizes(product);
              const hasVariants =
                allColors.length > 0 ||
                allSizes.length > 0 ||
                product.variants?.length > 0;

              // Find color hex for the selected color
              const selectedColorObj = selectedColor
                ? allColors.find(
                    (c) =>
                      c.name?.toLowerCase() === selectedColor?.toLowerCase(),
                  )
                : null;
              const colorHex = selectedColorObj?.hex || null;

              return (
                <div
                  key={cartKey}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-gray-300 hover:shadow-md transition p-3.5 md:p-5"
                >
                  <div className="flex gap-3.5 md:gap-5">
                    {/* Product Image */}
                    <a
                      href={`/product/${product._id}/`}
                      className="shrink-0 self-start"
                    >
                      <div className="w-22 h-22 md:w-28 md:h-28 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                        <Image
                          src={encodeURI(image)}
                          alt={title}
                          width={112}
                          height={112}
                          className="object-contain w-full h-full p-1.5 hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </a>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <a
                          href={`/product/${product._id}/`}
                          className="block min-w-0"
                        >
                          <h3 className="text-sm md:text-base font-semibold text-[#1F2937] leading-snug line-clamp-2 hover:text-[#1D1D1F] transition-colors">
                            {title}
                          </h3>
                        </a>
                        <button
                          onClick={() => removeFromCart(cartKey)}
                          title={t("cart.remove")}
                          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Variant chips */}
                      {selectedColor || selectedSize ? (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {selectedColor && (
                            <span className="inline-flex items-center gap-1.5 text-xs bg-gray-100 border border-gray-100 text-[#1D1D1F] font-medium px-2 py-1 rounded-full">
                              {colorHex && (
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-white shadow-sm inline-block"
                                  style={{ backgroundColor: colorHex }}
                                />
                              )}
                              {selectedColor}
                            </span>
                          )}
                          {selectedSize && (
                            <span className="inline-flex items-center text-xs bg-gray-100 border border-gray-100 text-[#1D1D1F] font-medium px-2 py-1 rounded-full">
                              {selectedSize}
                            </span>
                          )}
                          {hasVariants && (
                            <button
                              onClick={() => {
                                setEditItem(item);
                                setEditMode("edit");
                              }}
                              title="Edit variant"
                              className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-[#1D1D1F] hover:bg-gray-100 transition"
                            >
                              <FiEdit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ) : (
                        hasVariants && (
                          <button
                            onClick={() => {
                              setEditItem(item);
                              setEditMode("edit");
                            }}
                            className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-[#1D1D1F] bg-gray-100 border border-gray-100 px-2.5 py-1 rounded-full hover:bg-gray-200 transition"
                          >
                            <FiEdit2 className="w-3 h-3" />
                            {t("cart.select_option")}
                          </button>
                        )
                      )}

                      {/* Add another size/color */}
                      {hasVariants && (
                        <button
                          onClick={() => {
                            setEditItem(item);
                            setEditMode("add");
                          }}
                          className="flex items-center gap-1 mt-1.5 text-xs text-[#6B7280] hover:text-[#1D1D1F] transition"
                        >
                          <FiPlus className="w-3 h-3" />
                          {t("cart.add_size_color")}
                        </button>
                      )}

                      {/* Badges */}
                      {product.freeShipping && (
                        <p className="text-xs font-semibold text-green-700 mt-2">
                          {t("home.free_shipping")}
                        </p>
                      )}
                      {product.availability === "out_of_stock" && (
                        <button
                          onClick={() => setWaitlistProduct(product)}
                          className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 hover:bg-amber-100 transition"
                        >
                          {t("cart.out_of_stock_waitlist")}
                        </button>
                      )}

                      {/* Qty + price row */}
                      <div className="flex flex-wrap items-end justify-between gap-3 mt-3">
                        <div className="inline-flex items-center bg-gray-50 border border-gray-200 rounded-full overflow-hidden">
                          <button
                            onClick={() =>
                              updateQty(cartKey, Math.max(1, quantity - 1))
                            }
                            aria-label="Decrease quantity"
                            className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-[#6B7280] hover:text-[#1D1D1F] hover:bg-gray-100 transition"
                          >
                            <FiMinus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-9 md:w-10 text-center text-sm font-bold text-[#1F2937]">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateQty(cartKey, quantity + 1)}
                            aria-label="Increase quantity"
                            className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-[#6B7280] hover:text-[#1D1D1F] hover:bg-gray-100 transition"
                          >
                            <FiPlus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="flex items-baseline justify-end gap-2">
                            {compareAt > price && (
                              <span className="text-xs text-gray-400 line-through">
                                ৳{(compareAt * quantity).toFixed(2)}
                              </span>
                            )}
                            <span className="text-base md:text-lg font-bold text-[#1D1D1F]">
                              ৳{(price * quantity).toFixed(2)}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6B7280] mt-0.5">
                            ৳{price.toFixed(2)} × {quantity}
                            {itemSaved > 0 && (
                              <span className="ml-1.5 text-green-600 font-semibold">
                                {t("cart.saved")} ৳{itemSaved.toFixed(2)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Order Summary (sticky) ─────────────────────────────────── */}
          <aside className="mt-6 lg:mt-0 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-linear-to-r from-[#1D1D1F] via-gray-500 to-gray-300" />
              <div className="p-5 md:p-6">
                <h2 className="text-lg font-bold text-[#1F2937] mb-4">
                  {t("cart.order_summary")}
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">
                      {t("cart.subtotal")} ({totalQty})
                    </span>
                    <span className="font-semibold text-[#1F2937]">
                      ৳{subtotal.toFixed(2)}
                    </span>
                  </div>
                  {saved > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B7280]">{t("cart.saved")}</span>
                      <span className="font-semibold text-green-600">
                        −৳{saved.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {anyFreeShip && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B7280]">
                        {t("cart.shipping")}
                      </span>
                      <span className="text-xs font-semibold text-green-700">
                        {t("cart.free_shipping_badge")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t border-dashed border-gray-200 my-4" />

                <div className="flex items-center justify-between mb-5">
                  <span className="font-bold text-[#1F2937]">
                    {t("cart.total")}
                  </span>
                  <span className="text-2xl font-bold text-[#1D1D1F]">
                    ৳{subtotal.toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full flex items-center justify-center gap-2 bg-[#1D1D1F] text-white py-3 rounded-xl font-semibold hover:bg-black active:scale-[0.99] transition shadow-lg shadow-gray-300"
                >
                  {t("cart.proceed_checkout")}
                  <FiArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleShare}
                  disabled={sharing}
                  title="Share this cart"
                  className="w-full flex items-center justify-center gap-2 mt-3 border border-gray-300 text-[#1D1D1F] bg-gray-100/50 py-2.5 rounded-xl font-medium hover:bg-gray-100 transition disabled:opacity-50"
                >
                  <FiShare2 className="w-4 h-4" />
                  {t("cart.share_cart")}
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="w-full text-center text-sm text-[#6B7280] hover:text-[#1D1D1F] mt-4 transition"
                >
                  {t("cart.continue")}
                </button>
              </div>
            </div>
          </aside>
        </div>

        {/* ── Frequently Bought Together ───────────────────────────────── */}
        {fbtProducts.length > 0 && (
          <div className="mt-10 md:mt-12">
            <div className="flex items-center gap-2.5 mb-1">
              <span className="w-1.5 h-6 rounded-full bg-[#1D1D1F]" />
              <h2 className="text-lg md:text-2xl font-bold text-[#1F2937]">
                {t("cart.fbt_title")}
              </h2>
            </div>
            <p className="text-[#6B7280] text-sm mb-4 ml-4">
              {t("cart.fbt_desc")}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {fbtProducts.slice(0, 6).map((p) => (
                <ProductCard
                  key={p._id || p.id}
                  product={p}
                  imageWidth={250}
                  imageHeight={180}
                  imageQuality={85}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Picked For You (Recommended) ─────────────────────────────── */}
        <div className="mt-10 md:mt-12">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-1.5 h-6 rounded-full bg-[#1D1D1F]" />
            <h2 className="text-lg md:text-2xl font-bold text-[#1F2937]">
              {t("cart.picked_for_you")}
            </h2>
          </div>

          {recLoading ? (
            /* Skeleton cards while loading */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse"
                >
                  <div className="bg-gray-200 h-36 sm:h-44 w-full" />
                  <div className="p-3 space-y-2">
                    <div className="bg-gray-200 h-3 rounded w-3/4" />
                    <div className="bg-gray-200 h-3 rounded w-1/2" />
                    <div className="bg-gray-200 h-7 rounded w-full mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : recommendedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {recommendedProducts.slice(0, 10).map((product) => (
                <ProductCard
                  key={product._id || product.id}
                  product={product}
                  imageWidth={250}
                  imageHeight={180}
                  imageQuality={85}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-6">
              {t("cart.no_recommendations")}
            </p>
          )}
        </div>
      </div>
      {editItem && (
        <VariantEditModal
          item={editItem}
          mode={editMode}
          onClose={() => {
            setEditItem(null);
            setEditMode("edit");
          }}
          onSave={(c, s, v, q) => {
            updateCartVariant(editItem.cartKey, c, s, v, q);
            setEditItem(null);
            setEditMode("edit");
          }}
        />
      )}
      {waitlistProduct && (
        <WaitlistModal
          product={waitlistProduct}
          onClose={() => setWaitlistProduct(null)}
        />
      )}
    </div>
  );
}
