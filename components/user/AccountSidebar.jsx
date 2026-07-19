"use client";

import React from "react";
import Image from "next/image";
import { useLanguage } from "@/components/context/LanguageContext";

// Icon paths (24x24, stroke)
const ICONS = {
  profile:
    "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  wishlist:
    "M20.8 4.6a5 5 0 0 0-7.1 0L12 6.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21l8.8-9.3a5 5 0 0 0 0-7.1z",
  cart: "M9 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2z M20 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2z M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6",
  orders:
    "M9 2H4a2 2 0 0 0-2 2v5m0 9v3a2 2 0 0 0 2 2h5M15 2h5a2 2 0 0 1 2 2v5m0 9v3a2 2 0 0 1-2 2h-5",
  address:
    "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  reviews:
    "M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3",
  rewards:
    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  loyalty:
    "M8 21h8M12 17v4M6.5 3h11l-1 6.5a5 5 0 0 1-9 0L6.5 3z M6.5 5H3.5a1 1 0 0 0-1 1.2l.6 2.4A3 3 0 0 0 6 11 M17.5 5h3a1 1 0 0 1 1 1.2l-.6 2.4A3 3 0 0 1 18 11",
  coupons:
    "M21 8.5a2.5 2.5 0 0 1 0 5M3 8.5a2.5 2.5 0 0 0 0 5 M3 3h18v18H3z M9 9l6 6M15 9l-9 6",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
};

function NavIcon({ path, className = "h-4 w-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

export default function AccountSidebar({
  user,
  avatarUrl,
  section,
  open,
  onClose,
  onNavigate,
  onLogout,
}) {
  const { t } = useLanguage();

  const groups = [
    {
      key: "profile",
      title: t("profile.section_profile"),
      items: [
        {
          key: "profile",
          label: t("profile.general_info"),
          icon: ICONS.profile,
        },
        {
          key: "wishlist",
          label: t("profile.favourites"),
          icon: ICONS.wishlist,
        },
        { key: "cart", label: t("profile.cart"), icon: ICONS.cart },
      ],
    },
    {
      key: "orders",
      title: t("profile.section_orders"),
      items: [
        { key: "orders", label: t("user.orders"), icon: ICONS.orders },
        { key: "address", label: t("profile.my_address"), icon: ICONS.address },
      ],
    },
    {
      key: "other",
      title: t("profile.section_other"),
      items: [
        { key: "reviews", label: t("profile.my_reviews"), icon: ICONS.reviews },
        { key: "rewards", label: t("profile.my_rewards"), icon: ICONS.rewards },
        { key: "loyalty", label: "Loyalty Tier", icon: ICONS.loyalty },
        { key: "coupons", label: t("profile.my_coupons"), icon: ICONS.coupons },
      ],
    },
  ];

  const initials = (user?.name || user?.email || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  const renderItem = (item) => {
    const active = section === item.key;
    return (
      <button
        key={item.key}
        type="button"
        onClick={() => onNavigate(item.key)}
        className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
          active
            ? "bg-gray-100 font-semibold text-[#1D1D1F]"
            : "text-[#6B7280] hover:bg-gray-50 hover:text-[#1D1D1F]"
        }`}
      >
        {active && (
          <span
            className="absolute left-0 top-1/2 h-5 w-0.75 -translate-y-1/2 rounded-full bg-[#1D1D1F]"
            aria-hidden="true"
          />
        )}
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
            active
              ? "bg-[#1D1D1F] text-white shadow-sm shadow-gray-300"
              : "bg-gray-100 text-[#1D1D1F] group-hover:bg-gray-200"
          }`}
        >
          <NavIcon path={item.icon} />
        </span>
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        <svg
          className={`h-4 w-4 shrink-0 transition ${
            active
              ? "text-[#1D1D1F]"
              : "text-gray-300 opacity-0 group-hover:opacity-100"
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-label="Close account menu"
        />
      )}

      <aside
        className={`${
          open
            ? "fixed inset-y-0 left-0 z-50 flex h-full w-[85%] max-w-85 flex-col rounded-r-2xl lg:h-fit lg:rounded-2xl"
            : "hidden rounded-2xl lg:flex lg:sticky lg:top-24 lg:h-fit lg:w-80 lg:flex-col"
        } max-h-screen border border-gray-100 bg-white shadow-sm lg:max-h-[calc(100vh-7rem)]`}
      >
        {/* Profile hero */}
        <div className="relative m-3 overflow-hidden rounded-2xl bg-linear-to-br from-[#1D1D1F] via-gray-800 to-black p-4 text-white shadow-lg shadow-gray-300">
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-white/10"
            aria-hidden="true"
          />

          <button
            type="button"
            onClick={onClose}
            className="absolute right-2 top-2 rounded-lg p-1.5 text-gray-300 transition hover:bg-white/15 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={user?.name || "User"}
                width={56}
                height={56}
                className="h-14 w-14 shrink-0 rounded-2xl border-2 border-white/40 bg-white object-cover"
              />
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-white/40 bg-white/20 text-xl font-bold text-white">
                {initials}
              </span>
            )}
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-base font-bold text-white">
                {user?.name || "User"}
              </p>
              <p className="truncate text-xs text-gray-300">{user?.email}</p>
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-emerald-300"
                  aria-hidden="true"
                />
                {t("user.profile")}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-3 pb-3">
          {groups.map((group) => (
            <div key={group.key}>
              <h4 className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {group.title}
              </h4>
              <div className="space-y-0.5">{group.items.map(renderItem)}</div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-100 p-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-red-200 py-2.5 text-sm font-medium text-red-500 transition hover:border-red-400 hover:bg-red-50"
          >
            <NavIcon path={ICONS.logout} />
            <span>{t("user.logout")}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
