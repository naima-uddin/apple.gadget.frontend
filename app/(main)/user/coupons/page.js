"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/components/context/UserContext";
import { useCart } from "@/components/context/CartContext";
import AuthModal from "@/components/auth/AuthModal";
import {
  FaTicketAlt,
  FaCheckCircle,
  FaCopy,
  FaClock,
  FaUser,
  FaShoppingCart,
  FaLock,
  FaGift,
} from "react-icons/fa";
import { useLanguage } from "@/components/context/LanguageContext";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

function CouponCard({ coupon, cartSubtotal = 0 }) {
  const [copied, setCopied] = useState(false);
  const { t: tr } = useLanguage();

  const copy = () => {
    navigator.clipboard.writeText(coupon.couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUnlocked = !coupon.progress || coupon.progress.remaining <= 0;
  const progressPercent = coupon.progress?.percentage || 100;
  const ready = coupon.canApply;

  return (
    <div
      className={`relative rounded-2xl border overflow-hidden bg-white shadow-sm transition ${
        ready
          ? "border-[#5B21B6]/30 bg-gradient-to-br from-violet-50/60 to-white"
          : "border-gray-100"
      } ${!coupon.eligible ? "opacity-60" : ""}`}
    >
      {/* Top notch */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#FAFAFC] border border-gray-100 rounded-full z-10" />

      {/* Eligibility badge */}
      {ready && (
        <div className="absolute top-2 right-2 z-10">
          <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <FaCheckCircle className="w-3 h-3" /> {tr("coupons.ready")}
          </span>
        </div>
      )}

      {/* Offer details */}
      <div className="px-5 pt-6 pb-4">
        <p className="text-xs text-[#6B7280] mb-1">
          {coupon.spend || `Min. ৳${coupon.minOrderAmount || 0}`}
        </p>
        <div className="text-4xl font-extrabold text-[#5B21B6] leading-tight mb-1">
          {coupon.highlight}
          {coupon.highlightSecondary && (
            <span className="block text-3xl">{coupon.highlightSecondary}</span>
          )}
        </div>
        <p className="text-sm font-semibold text-[#1F2937] mt-1">
          {coupon.title}
        </p>
        {coupon.description && (
          <p className="text-xs text-[#6B7280] mt-0.5">{coupon.description}</p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {coupon.isNewUserOnly && (
            <span className="text-xs border border-violet-200 bg-violet-50 text-[#5B21B6] px-2 py-0.5 rounded-full flex items-center gap-1">
              <FaUser className="w-2.5 h-2.5" /> New Users
            </span>
          )}
          {coupon.isFirstOrderOnly && (
            <span className="text-xs bg-[#5B21B6] text-white px-2 py-0.5 rounded-full flex items-center gap-1">
              <FaGift className="w-2.5 h-2.5" /> First Order
            </span>
          )}
          {coupon.stackable && (
            <span className="text-xs bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full">
              allowMultiple
            </span>
          )}
          {coupon.expiresAt && (
            <span className="text-xs bg-gray-50 text-[#6B7280] border border-gray-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <FaClock className="w-2.5 h-2.5" />
              {tr("coupons.expires")}{" "}
              {new Date(coupon.expiresAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar (if not yet unlocked) */}
      {coupon.progress && coupon.progress.remaining > 0 && (
        <div className="px-5 pb-3">
          <div className="flex justify-between text-xs text-[#6B7280] mb-1">
            <span>{coupon.progress.message}</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-[#5B21B6] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Dashed separator */}
      <div className="border-t-2 border-dashed border-violet-200 mx-0" />

      {/* Bottom notch */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#FAFAFC] border border-gray-100 rounded-full z-10" />

      {/* Coupon code section */}
      <div className="px-5 py-4">
        {!coupon.eligible ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <FaLock className="shrink-0" />
            <span>{coupon.eligibilityReason}</span>
          </div>
        ) : (
          <>
            <p className="text-xs text-[#6B7280] mb-2">
              {isUnlocked
                ? tr("coupons.use_at_checkout")
                : tr("coupons.add_more")}
            </p>
            <button
              onClick={copy}
              disabled={!isUnlocked}
              className={`w-full flex items-center justify-between gap-3 border-2 border-dashed border-violet-300 bg-violet-50 rounded-lg px-4 py-2.5 transition ${isUnlocked ? "hover:bg-violet-100 cursor-pointer" : "cursor-not-allowed opacity-70"}`}
            >
              <span className="text-lg font-mono font-extrabold tracking-widest text-[#5B21B6]">
                {coupon.couponCode}
              </span>
              <span className="text-xs font-semibold shrink-0 px-2 py-1 rounded-md bg-white border border-violet-200 text-[#5B21B6] transition flex items-center gap-1">
                {copied ? (
                  <>
                    <FaCheckCircle className="w-3 h-3" /> {tr("coupons.copied")}
                  </>
                ) : (
                  <>
                    <FaCopy className="w-3 h-3" /> {tr("coupons.copy")}
                  </>
                )}
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function CouponsPage() {
  const { user } = useUser();
  const { cartItems } = useCart();
  const { t } = useLanguage();
  const [data, setData] = useState({
    eligible: [],
    other: [],
    almostUnlocked: [],
  });
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Calculate cart subtotal
  const cartSubtotal = cartItems.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const resp = await fetch(
          `${API}/api/coupons?subtotal=${cartSubtotal}`,
          {
            credentials: "include",
          },
        );
        const result = await resp.json();
        setData(result);
      } catch (err) {
        console.error("Failed to fetch coupons:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
  }, [cartSubtotal]);

  const readyToUse = data.eligible?.filter((c) => c.canApply) || [];
  const almostUnlocked = data.almostUnlocked || [];
  const otherEligible =
    data.eligible?.filter(
      (c) => !c.canApply && !almostUnlocked.some((a) => a._id === c._id),
    ) || [];

  // All coupons combined for the "All Coupons" section
  const allCoupons = [...(data.eligible || []), ...(data.other || [])];

  // View mode state
  const [viewMode, setViewMode] = useState("smart"); // 'smart' or 'all'

  return (
    <div className="w-full max-w-6xl mx-auto px-2 md:px-4 lg:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1F2937] flex items-center gap-3">
          <FaTicketAlt className="text-[#5B21B6]" />
          <span>{t("coupons.title")}</span>
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          {user ? (
            <>{t("coupons.desc")}</>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="text-[#5B21B6] underline"
              >
                {t("nav.login")}
              </button>{" "}
              {t("coupons.login_msg")}
            </>
          )}
        </p>
      </div>

      {/* User status banner */}
      {user && (
        <div className="mb-6 flex flex-wrap gap-3">
          {data.isNewUser && (
            <div className="flex items-center gap-2 border border-violet-100 bg-violet-50 text-[#5B21B6] px-4 py-2 rounded-lg text-sm">
              <FaUser />
              <span>
                <strong>New User!</strong> You&apos;re eligible for new user
                discounts.
              </span>
            </div>
          )}
          {data.isFirstOrder && (
            <div className="flex items-center gap-2 bg-[#5B21B6] text-white px-4 py-2 rounded-lg text-sm">
              <FaGift />
              <span>
                <strong>First Order!</strong> Special discounts await you.
              </span>
            </div>
          )}
          {cartSubtotal > 0 && (
            <div className="flex items-center gap-2 border border-gray-100 bg-gray-50 text-[#1F2937] px-4 py-2 rounded-lg text-sm">
              <FaShoppingCart className="text-[#5B21B6]" />
              <span>
                {t("coupons.cart_subtotal")}{" "}
                <strong>৳{cartSubtotal.toFixed(0)}</strong>
              </span>
            </div>
          )}
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-sm text-[#6B7280]">View:</span>
        <button
          onClick={() => setViewMode("smart")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            viewMode === "smart"
              ? "bg-[#5B21B6] text-white hover:bg-[#4C1D95]"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {t("coupons.smart_view")}
        </button>
        <button
          onClick={() => setViewMode("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            viewMode === "all"
              ? "bg-[#5B21B6] text-white hover:bg-[#4C1D95]"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {t("coupons.all_coupons")} ({allCoupons.length})
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : viewMode === "all" ? (
        /* All Coupons View */
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-[#1F2937]">
            {t("coupons.all_coupons")}
          </h2>
          {allCoupons.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-violet-200 bg-violet-50/40 rounded-2xl text-[#6B7280]">
              <FaTicketAlt className="w-12 h-12 mx-auto mb-4 text-[#5B21B6] opacity-40" />
              <p className="text-lg font-medium text-[#1F2937]">{t("coupons.no_coupons")}</p>
              <p className="text-sm mt-1">{t("coupons.check_back")}</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allCoupons.map((coupon) => (
                <CouponCard
                  key={coupon._id}
                  coupon={coupon}
                  cartSubtotal={cartSubtotal}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Smart View - categorized sections */
        <div className="space-y-10">
          {/* Ready to Use */}
          {readyToUse.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-[#1F2937] mb-4 flex items-center gap-2">
                <FaCheckCircle className="text-emerald-500" />
                {t("coupons.ready_to_use")}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {readyToUse.map((coupon) => (
                  <CouponCard
                    key={coupon._id}
                    coupon={coupon}
                    cartSubtotal={cartSubtotal}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Almost Unlocked */}
          {almostUnlocked.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-[#1F2937] mb-4 flex items-center gap-2">
                <FaGift className="text-[#5B21B6]" />
                {t("coupons.almost_unlocked")}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {almostUnlocked.map((coupon) => (
                  <CouponCard
                    key={coupon._id}
                    coupon={coupon}
                    cartSubtotal={cartSubtotal}
                  />
                ))}
              </div>
            </section>
          )}

          {/* More Coupons */}
          {otherEligible.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-[#1F2937] mb-4">
                {t("coupons.more_for_you")}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherEligible.map((coupon) => (
                  <CouponCard
                    key={coupon._id}
                    coupon={coupon}
                    cartSubtotal={cartSubtotal}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Unavailable Coupons */}
          {data.other?.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-[#6B7280] mb-4">
                {t("coupons.other_coupons")}
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                {t("coupons.requirements_msg")}
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.other.map((coupon) => (
                  <CouponCard
                    key={coupon._id}
                    coupon={coupon}
                    cartSubtotal={cartSubtotal}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty state for smart view */}
          {data.eligible?.length === 0 && data.other?.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-violet-200 bg-violet-50/40 rounded-2xl text-[#6B7280]">
              <FaTicketAlt className="w-12 h-12 mx-auto mb-4 text-[#5B21B6] opacity-40" />
              <p className="text-lg font-medium text-[#1F2937]">{t("coupons.no_coupons")}</p>
              <p className="text-sm mt-1">{t("coupons.check_back")}</p>
            </div>
          )}
        </div>
      )}

      {/* CTA to checkout */}
      {cartItems.length > 0 && readyToUse.length > 0 && (
        <div className="mt-10 text-center">
          <Link
            href="/checkout"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#5B21B6] text-white rounded-lg hover:bg-[#4C1D95] font-semibold transition"
          >
            <FaShoppingCart />
            {t("coupons.apply_checkout")}
          </Link>
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
