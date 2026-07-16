"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  useCart,
  getItemPrice,
  getItemCompareAtPrice,
} from "@/components/context/CartContext";
import {
  FiX,
  FiShoppingBag,
  FiTrash2,
  FiEdit2,
  FiShare2,
  FiPlus,
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

export default function CartSidebar() {
  const router = useRouter();
  const {
    cartItems,
    isSidebarOpen,
    toggleSidebar,
    updateQty,
    removeFromCart,
    updateCartVariant,
    shareCart,
  } = useCart();

  const { t } = useLanguage();
  const [editItem, setEditItem] = useState(null);
  const [editMode, setEditMode] = useState("edit");
  const [waitlistProduct, setWaitlistProduct] = useState(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const url = await shareCart();
      if (navigator.share) {
        await navigator.share({ title: "My Pickob Cart", url });
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

  // lock body scroll when sidebar is open
  React.useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const total = cartItems.reduce(
    (sum, item) => sum + getItemPrice(item) * item.quantity,
    0,
  );
  const saved = cartItems.reduce((sum, item) => {
    const price = getItemPrice(item);
    const mrp = getItemCompareAtPrice(item);
    return sum + (mrp > price ? (mrp - price) * item.quantity : 0);
  }, 0);

  return (
    <>
      {/* backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 transition-opacity"
          onClick={toggleSidebar}
        />
      )}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`fixed top-0 right-0 h-full w-full max-w-xs sm:w-88 md:w-96 bg-gray-50 shadow-2xl transform transition-transform duration-300 z-50 ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        } flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center">
              <FiShoppingBag className="w-4 h-4 text-[#5B21B6]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1F2937] leading-tight">
                {t("cart.my_cart")}
              </h2>
              <p className="text-xs text-[#6B7280]">
                {totalQty} {t("cart.items_label")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {cartItems.length > 0 && (
              <button
                onClick={handleShare}
                disabled={sharing}
                title="Share cart"
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#6B7280] hover:text-[#5B21B6] hover:bg-violet-50 transition disabled:opacity-50"
              >
                <FiShare2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={toggleSidebar}
              aria-label="Close cart"
              className="w-8 h-8 flex items-center justify-center rounded-full text-[#6B7280] hover:text-red-600 hover:bg-red-50 transition"
            >
              <FiX className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="p-3.5 grow overflow-y-auto">
          {cartItems.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="relative w-20 h-20 mb-4">
                <div className="absolute inset-0 rounded-full bg-violet-100" />
                <div className="absolute inset-2.5 rounded-full bg-violet-50 flex items-center justify-center">
                  <FiShoppingBag className="w-7 h-7 text-[#5B21B6]" />
                </div>
              </div>
              <p className="font-semibold text-[#1F2937] mb-1">
                {t("cart.cart_empty_title")}
              </p>
              <p className="text-sm text-[#6B7280] mb-5">
                {t("cart.cart_empty_msg")}
              </p>
              <button
                onClick={() => {
                  toggleSidebar();
                  router.push("/");
                }}
                className="inline-flex items-center gap-2 bg-[#5B21B6] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-violet-700 transition"
              >
                {t("success.continue_shopping")}
                <FiArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {cartItems.map((item) => {
            const { product, quantity, cartKey, selectedColor, selectedSize } =
              item;
            const price = getItemPrice(item);
            const mrp = getItemCompareAtPrice(item);
            const itemSaved = mrp > price ? (mrp - price) * quantity : 0;
            const thumb = product.images?.[0]?.url;
            const allColors = getVariantColors(product);
            const allSizes = getVariantSizes(product);
            const hasVariants =
              allColors.length > 0 ||
              allSizes.length > 0 ||
              product.variants?.length > 0;

            const selectedColorObj = selectedColor
              ? allColors.find(
                  (c) => c.name?.toLowerCase() === selectedColor?.toLowerCase(),
                )
              : null;
            const colorHex = selectedColorObj?.hex || null;

            return (
              <div
                key={cartKey}
                className="bg-white rounded-xl border border-gray-100 p-3 mb-3 last:mb-0"
              >
                <div className="flex gap-2.5">
                  {thumb && (
                    <a
                      href={`/product/${product._id}/`}
                      onClick={toggleSidebar}
                      className="shrink-0"
                    >
                      <div className="w-16 h-16 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                        <Image
                          src={encodeURI(thumb)}
                          alt={product.title || product.name}
                          width={64}
                          height={64}
                          className="object-contain w-full h-full p-1 hover:opacity-80 transition-opacity"
                        />
                      </div>
                    </a>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1.5">
                      <a
                        href={`/product/${product._id}/`}
                        onClick={toggleSidebar}
                        className="font-semibold text-sm text-[#1F2937] hover:text-[#5B21B6] transition-colors line-clamp-2 leading-snug"
                      >
                        {product.title || product.name}
                      </a>
                      <button
                        onClick={() => removeFromCart(cartKey)}
                        title="Remove item"
                        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {selectedColor || selectedSize ? (
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {selectedColor && (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-violet-50 text-[#5B21B6] font-medium px-1.5 py-0.5 rounded-full">
                            {colorHex && (
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-white shadow-sm inline-block"
                                style={{ backgroundColor: colorHex }}
                              />
                            )}
                            {selectedColor}
                          </span>
                        )}
                        {selectedSize && (
                          <span className="text-[11px] bg-violet-50 text-[#5B21B6] font-medium px-1.5 py-0.5 rounded-full">
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
                            className="text-gray-400 hover:text-[#5B21B6] p-0.5"
                          >
                            <FiEdit2 className="w-2.5 h-2.5" />
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
                          className="flex items-center gap-1 mt-1.5 text-[11px] text-[#5B21B6] font-medium hover:underline"
                        >
                          <FiEdit2 className="w-2.5 h-2.5" />
                          {t("cart.select_option")}
                        </button>
                      )
                    )}

                    {hasVariants && (
                      <button
                        onClick={() => {
                          setEditItem(item);
                          setEditMode("add");
                        }}
                        className="mt-1 flex items-center gap-1 text-[11px] text-[#6B7280] hover:text-[#5B21B6] transition"
                      >
                        <FiPlus className="w-2.5 h-2.5" />
                        {t("cart.add_size_color")}
                      </button>
                    )}

                    {product.freeShipping && (
                      <p className="text-[11px] font-semibold text-green-700 mt-1">
                        {t("cart.free_shipping_badge")}
                      </p>
                    )}
                    {product.availability === "out_of_stock" && (
                      <button
                        onClick={() => setWaitlistProduct(product)}
                        className="mt-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 hover:bg-amber-100 transition"
                      >
                        {t("cart.out_of_stock_waitlist")}
                      </button>
                    )}

                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center bg-gray-50 border border-gray-200 rounded-full overflow-hidden">
                        <button
                          onClick={() =>
                            updateQty(cartKey, Math.max(1, quantity - 1))
                          }
                          aria-label="Decrease quantity"
                          className="w-6.5 h-6.5 flex items-center justify-center text-[#6B7280] hover:text-[#5B21B6] hover:bg-violet-50 transition"
                        >
                          <FiMinus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-[#1F2937]">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQty(cartKey, quantity + 1)}
                          aria-label="Increase quantity"
                          className="w-6.5 h-6.5 flex items-center justify-center text-[#6B7280] hover:text-[#5B21B6] hover:bg-violet-50 transition"
                        >
                          <FiPlus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#5B21B6]">
                          ৳{(price * quantity).toFixed(2)}
                        </p>
                        {itemSaved > 0 && (
                          <p className="text-[10px] text-green-600 font-medium">
                            {t("cart.saved")} ৳{Math.round(itemSaved)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="p-4 bg-white border-t border-gray-100 shrink-0 mt-auto">
            {saved > 0 && (
              <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-lg px-3 py-1.5 mb-3">
                <span className="text-sm">🎉</span>
                <span className="text-xs font-medium text-green-700">
                  {t("checkout.you_saving_prefix")}{" "}
                  <span className="font-extrabold">৳{Math.round(saved)}</span>{" "}
                  {t("checkout.you_saving_suffix")}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#6B7280]">
                {t("checkout.total")}
              </span>
              <span className="text-xl font-bold text-[#1F2937]">
                ৳{Math.round(total)}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  toggleSidebar();
                  router.push("/cart");
                }}
                className="flex-1 border border-gray-200 text-[#374151] text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition"
              >
                {t("cart.view_cart")}
              </button>
              <button
                onClick={() => {
                  toggleSidebar();
                  router.push("/checkout");
                }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#5B21B6] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-violet-700 transition"
              >
                {t("cart.proceed_checkout")}
                <FiArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
      {waitlistProduct && (
        <WaitlistModal
          product={waitlistProduct}
          onClose={() => setWaitlistProduct(null)}
        />
      )}
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
    </>
  );
}
