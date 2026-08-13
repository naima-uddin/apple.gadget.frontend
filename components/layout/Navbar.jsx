"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import WebsiteLogo from "@/components/ui/WebsiteLogo";
import AuthModal from "@/components/auth/AuthModal";

// Simple profile menu that uses UserContext so UI updates immediately on auth changes
import { useUser } from "@/components/context/UserContext";
import { useCart } from "@/components/context/CartContext";
import { usePathname } from "next/navigation";
import SearchBox from "@/components/ui/SearchBox";
import CategorySidebar from "../home/CategorySidebar";
import { useLanguage } from "@/components/context/LanguageContext";
import { useCategories } from "@/components/context/CategoryContext";

function CountBadge({ count }) {
  if (!count) return null;
  return (
    <span className="ml-auto inline-flex items-center justify-center px-1.5 text-[10px] font-bold leading-none text-white bg-[#1D1D1F] rounded-full min-w-4 h-4">
      {count}
    </span>
  );
}

function ProfileMenu() {
  const { user, setUser, refreshUser } = useUser();
  const { wishlistItems, getCartCount } = useCart();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [counts, setCounts] = useState({
    orders: 0,
    reviews: 0,
    coupons: 0,
    rewards: 0,
  });
  const ref = useRef(null);
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;

    async function loadCounts() {
      try {
        const [ordersRes, reviewsRes, couponsRes, rewardsRes] =
          await Promise.all([
            fetch(`${API}/api/orders/my`, { credentials: "include" }),
            fetch(`${API}/api/products/my-reviews`, {
              credentials: "include",
            }),
            fetch(`${API}/api/coupons?subtotal=0`, { credentials: "include" }),
            fetch(`${API}/api/user/rewards`, { credentials: "include" }),
          ]);
        const [ordersData, reviewsData, couponsData, rewardsData] =
          await Promise.all([
            ordersRes.ok ? ordersRes.json() : null,
            reviewsRes.ok ? reviewsRes.json() : null,
            couponsRes.ok ? couponsRes.json() : null,
            rewardsRes.ok ? rewardsRes.json() : null,
          ]);
        if (cancelled) return;
        setCounts({
          orders: ordersData?.orders?.length || 0,
          reviews: reviewsData?.reviews?.length || 0,
          coupons:
            (couponsData?.eligible?.length || 0) +
            (couponsData?.other?.length || 0),
          rewards: rewardsData?.balance || 0,
        });
      } catch (err) {
        // ignore
      }
    }

    loadCounts();
    return () => {
      cancelled = true;
    };
  }, [open, user, API]);

  async function handleLogout() {
    try {
      await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      // ignore
    }
    sessionStorage.removeItem("ya_access");
    setUser(null);
    setOpen(false);
  }

  const handleProfileClick = () => {
    if (!user) {
      setShowAuthModal(true);
      setOpen(false);
    } else {
      setOpen((s) => !s);
    }
  };

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={handleProfileClick}
          className="flex items-center gap-1.5 p-1 text-gray-800 hover:text-[#1D1D1F] transition-colors"
          aria-label="Profile"
          title="Profile"
        >
          {user &&
          user.image &&
          !imgError &&
          user.image !== "undefined" &&
          user.image !== "null" ? (
            <img
              src={user.image}
              alt={user.name || "User"}
              className="w-6 h-6 rounded-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : user && user.email ? (
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#1D1D1F] text-white text-xs font-semibold">
              {user.email.charAt(0).toUpperCase()}
            </span>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </button>

        {open && user && (
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="text-sm text-[#202020]">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="font-semibold">{user.name || user.email}</div>
                <div className="text-xs text-gray-600">{user.email}</div>
                {Array.isArray(user.tags) && user.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {user.tags.map((tag) => (
                      <span
                        key={tag._id || tag.name || tag}
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                        style={{ backgroundColor: tag.color || "#3B82F6" }}
                      >
                        {tag.name || tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="py-2">
                {/* PROFILE Section */}
                <div className="mb-2">
                  <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("profile.section_profile")}
                  </div>
                  <Link
                    href="/user/profile"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>{t("profile.general_info")}</span>
                  </Link>
                  <Link
                    href="/user/wishlist"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20.8 4.6a5 5 0 0 0-7.1 0L12 6.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21l8.8-9.3a5 5 0 0 0 0-7.1z" />
                    </svg>
                    <span>{t("profile.favourites")}</span>
                    <CountBadge count={wishlistItems.length} />
                  </Link>
                </div>

                {/* ORDERS Section */}
                <div className="mb-2">
                  <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("profile.section_orders")}
                  </div>
                  <Link
                    href="/user/orders"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 2H4a2 2 0 0 0-2 2v5m0 9v3a2 2 0 0 0 2 2h5M15 2h5a2 2 0 0 1 2 2v5m0 9v3a2 2 0 0 1-2 2h-5" />
                    </svg>
                    <span>{t("profile.orders")}</span>
                    <CountBadge count={counts.orders} />
                  </Link>
                  <Link
                    href="/user/address"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{t("profile.my_address")}</span>
                  </Link>
                </div>

                {/* OTHER Section */}
                <div className="mb-2">
                  <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("profile.section_other")}
                  </div>
                  <Link
                    href="/user/reviews"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                    </svg>
                    <span>{t("profile.my_reviews")}</span>
                    <CountBadge count={counts.reviews} />
                  </Link>
                  <Link
                    href="/user/rewards"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span>{t("profile.my_rewards")}</span>
                    <CountBadge count={counts.rewards} />
                  </Link>
                  <Link
                    href="/user/coupons"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 8.5a2.5 2.5 0 0 1 0 5M3 8.5a2.5 2.5 0 0 0 0 5" />
                      <path d="M3 3h18v18H3z" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                    </svg>
                    <span>{t("profile.my_coupons")}</span>
                    <CountBadge count={counts.coupons} />
                  </Link>
                  <Link
                    href="/cart"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="9" cy="20" r="1" />
                      <circle cx="20" cy="20" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                    <span>{t("profile.cart")}</span>
                    <CountBadge count={getCartCount()} />
                  </Link>
                </div>
              </div>

              {/* Logout Button */}
              <div className="border-t border-gray-200 p-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>{t("profile.sign_out")}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}

export default function Navbar() {
  const { getCartCount, toggleSidebar } = useCart();
  const { lang, t } = useLanguage();
  const { categories, subcategories } = useCategories();
  const pathname = usePathname() || "/";
  const [searchOpen, setSearchOpen] = useState(false);
  const [catSidebarOpen, setCatSidebarOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [activeShopCat, setActiveShopCat] = useState(null);
  const searchRef = useRef(null);
  const searchIconRef = useRef(null);

  const openShopMenu = () => {
    setShopOpen(true);
    const firstWithSubs = (categories || []).find(
      (c) => (subcategories[c._id] || []).length > 0,
    );
    setActiveShopCat(firstWithSubs ? firstWithSubs._id : null);
  };

  // close search overlay when clicking outside
  React.useEffect(() => {
    if (!searchOpen) return;
    function handleDocumentClick(e) {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target) &&
        searchIconRef.current &&
        !searchIconRef.current.contains(e.target)
      ) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [searchOpen]);

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/products", label: t("nav.shop"), dropdown: true },
    { href: "/about", label: t("nav.about") },
    { href: "/blog", label: t("nav.blogs") },
    { href: "/contact", label: t("nav.contact") },
  ];

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="relative bg-transparent z-50 work-sans">
      <div className="flex items-center justify-between max-w-7xl md:px-3  lg:px-4 mx-auto h-12 md:h-14">
        {/* Left: hamburger (mobile) + logo */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCatSidebarOpen((v) => !v)}
            className="px-2 text-gray-800 hover:text-[#1D1D1F] lg:hidden"
            aria-label="Categories"
            title="Categories"
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="stroke-current"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <WebsiteLogo />
        </div>

        {/* Center: nav links (desktop) */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) =>
            link.dropdown ? (
              <div
                key={link.href}
                className="relative"
                onMouseEnter={openShopMenu}
                onMouseLeave={() => setShopOpen(false)}
              >
                <Link
                  href={link.href}
                  className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "text-[#1D1D1F]"
                      : "text-gray-800 hover:text-[#1D1D1F]"
                  }`}
                >
                  {link.label}
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${shopOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </Link>

                {/* Shop mega dropdown */}
                {shopOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 z-50">
                    <div className="flex bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
                      {/* Categories column */}
                      <div className="w-56 py-2 border-r border-gray-100 shrink-0">
                        <Link
                          href="/products"
                          onClick={() => setShopOpen(false)}
                          className="block px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 hover:text-[#1D1D1F] transition-colors"
                        >
                          {t("nav.all_products")}
                        </Link>
                        <div className="my-1 border-t border-gray-100" />
                        <div className="max-h-[60vh] overflow-y-auto">
                          {(categories || []).map((c) => {
                            const slug =
                              c.slug || (c.name || "").replace(/\s+/g, "-");
                            const subs = subcategories[c._id] || [];
                            const isActive = activeShopCat === c._id;
                            return (
                              <Link
                                key={c._id}
                                href={`/category/${slug}/`}
                                onClick={() => setShopOpen(false)}
                                onMouseEnter={() => setActiveShopCat(c._id)}
                                className={`flex items-center justify-between gap-2 px-4 py-2 text-sm transition-colors ${
                                  isActive
                                    ? "bg-gray-100 text-[#1D1D1F] font-medium"
                                    : "text-gray-700 hover:bg-gray-100 hover:text-[#1D1D1F]"
                                }`}
                              >
                                <span className="truncate">
                                  {lang === "bn" ? c.nameBn || c.name : c.name}
                                </span>
                                {subs.length > 0 && (
                                  <svg
                                    className="w-3.5 h-3.5 shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      </div>

                      {/* Subcategories panel — name + image */}
                      {activeShopCat &&
                        (subcategories[activeShopCat] || []).length > 0 &&
                        (() => {
                          const activeCat = (categories || []).find(
                            (c) => c._id === activeShopCat,
                          );
                          const activeSlug =
                            activeCat?.slug ||
                            (activeCat?.name || "").replace(/\s+/g, "-");
                          const subs = subcategories[activeShopCat] || [];
                          return (
                            <div className="w-105 max-h-[60vh] overflow-y-auto p-4">
                              <div className="grid grid-cols-3 gap-3">
                                {subs.map((sub) => (
                                  <Link
                                    key={sub._id}
                                    href={`/category/${activeSlug}/${sub.slug}/`}
                                    onClick={() => setShopOpen(false)}
                                    className="flex flex-col items-center gap-1.5 group"
                                  >
                                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 group-hover:border-[#1D1D1F] transition-colors flex items-center justify-center">
                                      {sub.images && sub.images[0]?.url ? (
                                        <Image
                                          src={sub.images[0].url}
                                          alt={sub.name}
                                          fill
                                          className="object-cover"
                                        />
                                      ) : (
                                        <span className="text-2xl">📦</span>
                                      )}
                                    </div>
                                    <span className="text-xs text-center text-gray-700 group-hover:text-[#1D1D1F] transition-colors line-clamp-2">
                                      {lang === "bn"
                                        ? sub.nameBn || sub.name
                                        : sub.name}
                                    </span>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-[#1D1D1F]"
                    : "text-gray-800 hover:text-[#1D1D1F]"
                }`}
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        {/* Right: actions */}
        <div className="flex items-center gap-0 md:gap-0.5">
          {/* Track order */}
          <Link
            href="/track-order"
            className="hidden md:inline-flex p-2 text-gray-800 hover:text-[#1D1D1F] transition-colors"
            title={t("nav.track_order")}
            aria-label={t("nav.track_order")}
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </Link>

          {/* Search icon */}
          <button
            ref={searchIconRef}
            onClick={() => setSearchOpen((v) => !v)}
            className="p-2 text-gray-800 hover:text-[#1D1D1F] transition-colors"
            aria-label="Search"
            title="Search"
          >
            <svg
              className="stroke-current"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {/* Cart */}
          <button
            id="nav-cart-icon"
            onClick={toggleSidebar}
            className="relative p-2 text-gray-800 hover:text-[#1D1D1F] transition-colors"
            aria-label="Cart"
            title="Cart"
          >
            <svg
              className="stroke-current"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="20" r="1" />
              <circle cx="20" cy="20" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {getCartCount() > 0 && (
              <span className="absolute top-0.5 right-0.5 inline-flex items-center justify-center px-1 text-[10px] font-bold leading-none text-white bg-[#1D1D1F] rounded-full min-w-4 h-4">
                {getCartCount()}
              </span>
            )}
          </button>

          {/* Divider */}

          {/* Profile dropdown */}
          <div className="relative">
            <ProfileMenu />
          </div>
        </div>
      </div>

      {/* category sidebar overlay (mobile hamburger) */}
      {catSidebarOpen && (
        <div className="fixed top-14 left-0 md:-left-14 right-0 bottom-0 z-40">
          {/* Backdrop — clicking closes */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setCatSidebarOpen(false)}
          />
          <div className="relative max-w-300 mx-auto h-full px-1">
            {/* Panel — anchored to same container start as hamburger */}
            <div
              className="relative w-[80vw] md:w-68 bg-white shadow-2xl z-10"
              onMouseLeave={() => setCatSidebarOpen(false)}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-2 border-b border-gray-100">
                <button
                  onClick={() => setCatSidebarOpen(false)}
                  className="md:hidden p-1 text-gray-400 hover:text-gray-600"
                  aria-label="Close"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <CategorySidebar onLinkClick={() => setCatSidebarOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* search overlay (all breakpoints) */}
      {searchOpen && (
        <div
          ref={searchRef}
          className="absolute top-full left-0 w-full bg-white p-2 z-50 shadow-md border-t border-gray-100"
        >
          <div className="flex items-center gap-2 max-w-2xl mx-auto">
            <SearchBox
              className="flex-1"
              onClose={() => setSearchOpen(false)}
              autoFocus
            />
            <button
              type="button"
              className="p-2 text-gray-800 hover:text-[#1D1D1F] shrink-0"
              onClick={() => setSearchOpen(false)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
