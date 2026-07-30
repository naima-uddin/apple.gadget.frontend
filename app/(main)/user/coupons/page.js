"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/components/context/UserContext";
import { useCart } from "@/components/context/CartContext";
import AuthModal from "@/components/auth/AuthModal";
import {
  FaTicketAlt,
  FaCheckCircle,
  FaClock,
  FaUser,
  FaShoppingCart,
  FaLock,
  FaGift,
} from "react-icons/fa";
import { useLanguage } from "@/components/context/LanguageContext";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

// Same ticket layout as OffersToSayYes, but kept strictly monochrome:
// white accents inside the dark ticket, near-black accents on the page chrome.
const BG = "#1D1D1F";
const BUTTON = "#FFFFFF";
const TEXT = "#FFFFFF";

const EDGE_NOTCHES = [8, 26, 44, 62, 80, 98];

function TicketEdge({ side }) {
  return EDGE_NOTCHES.map((top) => (
    <div
      key={`${side}-${top}`}
      className={`absolute w-3.5 h-3.5 bg-white rounded-full z-10 -translate-y-1/2 ${
        side === "left" ? "-left-1.75" : "-right-1.75"
      }`}
      style={{ top: `${top}%` }}
    />
  ));
}

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
      className={`relative flex rounded-2xl overflow-hidden shadow-lg transition ${
        !coupon.eligible ? "opacity-55" : ""
      }`}
      style={{ backgroundColor: BG }}
    >
      {/* Scalloped tear edges on the two outer short sides */}
      <TicketEdge side="left" />
      <TicketEdge side="right" />

      {/* Ticket-perforation notches on the seam between the stub and the body */}
      <div className="absolute -top-3 left-16 -translate-x-1/2 w-6 h-6 bg-white rounded-full z-10" />
      <div className="absolute -bottom-3 left-16 -translate-x-1/2 w-6 h-6 bg-white rounded-full z-10" />
      <div
        className="absolute left-16 -translate-x-1/2 top-0 bottom-0 w-0.5 border-l-2 border-dashed"
        style={{ borderColor: `${BUTTON}80` }}
      />

      {/* Ticket stub: vertical COUPON label */}
      <div className="w-16 shrink-0 flex items-center justify-center">
        <span
          className="text-[10px] font-bold tracking-[0.3em] uppercase whitespace-nowrap opacity-30"
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            color: TEXT,
          }}
        >
          {tr("offers.coupon_label")} • {tr("offers.coupon_label")} •{" "}
          {tr("offers.coupon_label")}
        </span>
      </div>

      {/* Ticket body */}
      <div className="flex-1 min-w-0 flex flex-col justify-center px-5 py-4">
        {ready && (
          <span
            className="self-start mb-1.5 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: BUTTON, color: BG }}
          >
            <FaCheckCircle className="w-2.5 h-2.5" /> {tr("coupons.ready")}
          </span>
        )}

        <p className="text-xs opacity-70" style={{ color: TEXT }}>
          {coupon.spend || `Min. ৳${coupon.minOrderAmount || 0}`}
        </p>
        <h3
          className="text-xl sm:text-2xl font-extrabold uppercase leading-tight"
          style={{ color: TEXT }}
        >
          {coupon.highlight}
          {coupon.highlightSecondary && (
            <span className="block text-lg sm:text-xl">
              {coupon.highlightSecondary}
            </span>
          )}
        </h3>
        <p className="text-xs mt-1 opacity-70" style={{ color: TEXT }}>
          {coupon.title}
        </p>
        {coupon.description && (
          <p className="text-xs mt-0.5 opacity-70" style={{ color: TEXT }}>
            {coupon.description}
          </p>
        )}

        {/* Tags */}
        {(coupon.isNewUserOnly ||
          coupon.isFirstOrderOnly ||
          coupon.stackable ||
          coupon.expiresAt) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {coupon.isNewUserOnly && (
              <span
                className="text-[10px] border px-2 py-0.5 rounded-full flex items-center gap-1 opacity-80"
                style={{ borderColor: `${TEXT}30`, color: TEXT }}
              >
                <FaUser className="w-2.5 h-2.5" /> New Users
              </span>
            )}
            {coupon.isFirstOrderOnly && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ backgroundColor: BUTTON, color: BG }}
              >
                <FaGift className="w-2.5 h-2.5" /> First Order
              </span>
            )}
            {coupon.stackable && (
              <span
                className="text-[10px] border px-2 py-0.5 rounded-full opacity-70"
                style={{ borderColor: `${TEXT}30`, color: TEXT }}
              >
                allowMultiple
              </span>
            )}
            {coupon.expiresAt && (
              <span
                className="text-[10px] border px-2 py-0.5 rounded-full flex items-center gap-1 opacity-60"
                style={{ borderColor: `${TEXT}30`, color: TEXT }}
              >
                <FaClock className="w-2.5 h-2.5" />
                {tr("coupons.expires")}{" "}
                {new Date(coupon.expiresAt).toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        {/* Progress bar (if not yet unlocked) */}
        {coupon.progress && coupon.progress.remaining > 0 && (
          <div className="mt-2.5">
            <div
              className="flex justify-between text-[10px] mb-1 opacity-70"
              style={{ color: TEXT }}
            >
              <span>{coupon.progress.message}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div
              className="w-full rounded-full h-1.5"
              style={{ backgroundColor: `${TEXT}20` }}
            >
              <div
                className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%`, backgroundColor: BUTTON }}
              />
            </div>
          </div>
        )}

        {/* Coupon code / lock state */}
        {!coupon.eligible ? (
          <div
            className="flex items-center gap-2 text-xs mt-2 opacity-70"
            style={{ color: TEXT }}
          >
            <FaLock className="shrink-0 w-3 h-3" />
            <span>{coupon.eligibilityReason}</span>
          </div>
        ) : (
          <>
            <p className="text-xs mt-2 mb-1 opacity-70" style={{ color: TEXT }}>
              {isUnlocked
                ? tr("coupons.use_at_checkout")
                : tr("coupons.add_more")}
            </p>
            <button
              onClick={copy}
              disabled={!isUnlocked}
              style={{ backgroundColor: BUTTON, color: BG }}
              className={`mt-2 inline-flex items-center gap-1.5 self-start rounded-md px-3 py-1.5 text-[11px] font-bold tracking-wide transition ${
                isUnlocked
                  ? "hover:opacity-90 cursor-pointer"
                  : "opacity-40 cursor-not-allowed"
              }`}
            >
              {copied ? (
                <span>{tr("coupons.copied")}</span>
              ) : (
                <>
                  <span className="opacity-80">{tr("offers.use_code")}:</span>
                  <span>{coupon.couponCode}</span>
                </>
              )}
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
          <FaTicketAlt className="text-[#1D1D1F]" />
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
                className="text-[#1D1D1F] underline"
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
            <div className="flex items-center gap-2 border border-gray-200 bg-gray-50 text-[#1D1D1F] px-4 py-2 rounded-lg text-sm">
              <FaUser />
              <span>
                <strong>New User!</strong> You&apos;re eligible for new user
                discounts.
              </span>
            </div>
          )}
          {data.isFirstOrder && (
            <div className="flex items-center gap-2 bg-[#1D1D1F] text-white px-4 py-2 rounded-lg text-sm">
              <FaGift />
              <span>
                <strong>First Order!</strong> Special discounts await you.
              </span>
            </div>
          )}
          {cartSubtotal > 0 && (
            <div className="flex items-center gap-2 border border-gray-100 bg-gray-50 text-[#1F2937] px-4 py-2 rounded-lg text-sm">
              <FaShoppingCart className="text-[#1D1D1F]" />
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
              ? "bg-[#1D1D1F] text-white hover:bg-[#3A3A3C]"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {t("coupons.smart_view")}
        </button>
        <button
          onClick={() => setViewMode("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            viewMode === "all"
              ? "bg-[#1D1D1F] text-white hover:bg-[#3A3A3C]"
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
            <div className="text-center py-20 border-2 border-dashed border-gray-200 bg-gray-50/40 rounded-2xl text-[#6B7280]">
              <FaTicketAlt className="w-12 h-12 mx-auto mb-4 text-[#1D1D1F] opacity-40" />
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
                <FaGift className="text-[#1D1D1F]" />
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
            <div className="text-center py-20 border-2 border-dashed border-gray-200 bg-gray-50/40 rounded-2xl text-[#6B7280]">
              <FaTicketAlt className="w-12 h-12 mx-auto mb-4 text-[#1D1D1F] opacity-40" />
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
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#1D1D1F] text-white rounded-lg hover:bg-[#3A3A3C] font-semibold transition"
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
