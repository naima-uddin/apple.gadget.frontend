"use client";
import React, { useState } from "react";
import Link from "next/link";
import AuthModal from "@/components/auth/AuthModal";
import { useUser } from "@/components/context/UserContext";
import { useStoreSettings } from "@/components/context/StoreSettingsContext";
import { useLanguage } from "@/components/context/LanguageContext";

function normalizeHref(href) {
  if (!href) return "/";
  if (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("/")
  )
    return href;
  return `/${href}`;
}

export default function Footer() {
  const { user } = useUser();
  const { storeName, logoUrl, footerLogoUrl, footerInfo, socialLinks, footerLinks, footerColumns } =
    useStoreSettings();
  const displayLogoUrl = footerLogoUrl || logoUrl;
  const { t } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const quickLinks = footerLinks?.customerService?.length
    ? footerLinks.customerService
    : [
        { label: t("footer.privacy"), href: "/privacy" },
        { label: t("footer.terms"), href: "/terms" },
        { label: t("footer.faq"), href: "/faq" },
        { label: t("footer.contact"), href: "/contact" },
      ];

  // Admin-configured navigation columns (title + links). When present these
  // fully replace the default Company/Product columns below.
  const navColumns = (Array.isArray(footerColumns) ? footerColumns : [])
    .map((col) => ({
      title: col?.title || "",
      links: (Array.isArray(col?.links) ? col.links : []).filter(
        (l) => l && l.label,
      ),
    }))
    .filter((col) => col.title || col.links.length);
  const useDynamicColumns = navColumns.length > 0;
  const navCount = useDynamicColumns ? navColumns.length : 2;

  const socials = [
    {
      key: "facebook",
      label: "Facebook",
      url:
        socialLinks?.facebook?.enabled !== false && socialLinks?.facebook?.url,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 2h-3a4 4 0 0 0-4 4v3H8v4h3v8h4v-8h3l1-4h-4V6a1 1 0 0 1 1-1h3z" />
        </svg>
      ),
    },
    {
      key: "twitter",
      label: "Twitter / X",
      url: socialLinks?.twitter?.enabled !== false && socialLinks?.twitter?.url,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L2.1 2.25h6.877l4.254 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      key: "instagram",
      label: "Instagram",
      url:
        socialLinks?.instagram?.enabled !== false &&
        socialLinks?.instagram?.url,
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line
            x1="17.5"
            y1="6.5"
            x2="17.51"
            y2="6.5"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      key: "tiktok",
      label: "TikTok",
      url: socialLinks?.tiktok?.enabled !== false && socialLinks?.tiktok?.url,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-6.33 6.33 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.05a8.23 8.23 0 0 0 4.82 1.55V7.16a4.85 4.85 0 0 1-1.05-.47z" />
        </svg>
      ),
    },
    {
      key: "youtube",
      label: "YouTube",
      url: socialLinks?.youtube?.enabled !== false && socialLinks?.youtube?.url,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
          <polygon
            points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"
            fill="#0A0A0A"
          />
        </svg>
      ),
    },
  ].filter((s) => s.url);

  // Brand column (1.5fr) + N nav columns (1fr). Socials now render as an
  // icon row inside the brand column, so they no longer consume a grid column.
  const gridTemplate = `1.5fr ${Array(navCount).fill("1fr").join(" ")}`;

  return (
    <>
      <footer role="contentinfo" className="relative bg-[#0A0A0A] text-white overflow-hidden">
        {/* Oversized brand watermark — absolute so it adds no height */}
        {displayLogoUrl && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-8 max-w-7xl mx-auto px-5 overflow-hidden flex justify-center"
            aria-hidden="true"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayLogoUrl}
              alt=""
              className="w-auto max-w-full h-16 sm:h-24 lg:h-32 object-contain object-center opacity-[0.05] grayscale select-none"
            />
          </div>
        )}
        <div className="relative max-w-7xl mx-auto px-5 py-10 md:py-12">
          <div
            style={{ "--footer-cols": gridTemplate }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-y-10 gap-x-8 lg:gap-x-12 lg:grid-cols-(--footer-cols)"
          >
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center mb-4 -mt-4">
                {displayLogoUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={displayLogoUrl}
                    alt={storeName || "Store logo"}
                    className="h-14 w-auto max-w-[150px] object-contain object-left"
                  />
                )}
              </div>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xs mb-6">
                {storeName ? `${storeName} ` : ""}
                {t("footer.store_desc")}
              </p>
              <ul className="space-y-3 text-sm text-gray-400 wrap-break-word">
                {footerInfo?.address && (
                  <li className="flex items-start gap-2.5">
                    <svg
                      className="mt-0.5 shrink-0 text-gray-500"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{footerInfo.address}</span>
                  </li>
                )}
                {footerInfo?.email && (
                  <li className="flex items-start gap-2.5 break-all">
                    <svg
                      className="mt-0.5 shrink-0 text-gray-500"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-10 6L2 7" />
                    </svg>
                    <a
                      href={`mailto:${footerInfo.email}`}
                      className="hover:text-white transition-colors"
                    >
                      {footerInfo.email}
                    </a>
                  </li>
                )}
                {footerInfo?.phone && (
                  <li className="flex items-start gap-2.5">
                    <svg
                      className="mt-0.5 shrink-0 text-gray-500"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <a
                      href={`tel:${footerInfo.phone}`}
                      className="hover:text-white transition-colors"
                    >
                      {footerInfo.phone}
                    </a>
                  </li>
                )}
              </ul>

              {/* Social icons */}
              {socials.length > 0 && (
                <div className="mt-7">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                    {t("footer.follow_us")}
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    {socials.map((s) => (
                      <a
                        key={s.key}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label}
                        title={s.label}
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:bg-white hover:text-[#0A0A0A] hover:border-white transition-colors"
                      >
                        {s.icon}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {useDynamicColumns ? (
              /* Admin-configured navigation columns */
              navColumns.map((col, ci) => (
                <div key={ci}>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">
                    {col.title}
                  </h4>
                  <ul className="space-y-2.5 sm:space-y-3 text-sm text-gray-400">
                    {col.links.map((item, i) => (
                      <li key={i}>
                        <Link
                          href={normalizeHref(item.href)}
                          className="hover:text-white transition-colors"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <>
                {/* Company */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">
                    {t("footer.company")}
                  </h4>
                  <ul className="space-y-2.5 sm:space-y-3 text-sm text-gray-400">
                    {quickLinks.map((item, i) => (
                      <li key={i}>
                        <Link
                          href={normalizeHref(item.href)}
                          className="hover:text-white transition-colors"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Product */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">
                    {t("footer.product")}
                  </h4>
                  <ul className="space-y-2.5 sm:space-y-3 text-sm text-gray-400">
                    <li>
                      <Link
                        href="/user/profile"
                        className="hover:text-white transition-colors"
                      >
                        {t("footer.my_account")}
                      </Link>
                    </li>
                    {!user && (
                      <li>
                        <button
                          onClick={() => setShowAuthModal(true)}
                          className="hover:text-white transition-colors"
                        >
                          {t("footer.login_register")}
                        </button>
                      </li>
                    )}
                    <li>
                      <Link
                        href="/cart"
                        className="hover:text-white transition-colors"
                      >
                        {t("profile.cart")}
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/user/wishlist"
                        className="hover:text-white transition-colors"
                      >
                        {t("footer.wishlist")}
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/products"
                        className="hover:text-white transition-colors"
                      >
                        {t("footer.shop")}
                      </Link>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="relative border-t border-white/10 py-4 px-4 text-center text-xs text-gray-500 leading-relaxed">
          © {new Date().getFullYear()} {storeName || "Our Store"}.{" "}
          {t("footer.rights")}
        </div>
      </footer>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
