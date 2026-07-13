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
  const { storeName, footerInfo, socialLinks, footerLinks } =
    useStoreSettings();
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

  const socials = [
    {
      key: "facebook",
      label: "Facebook",
      url: socialLinks?.facebook?.enabled !== false && socialLinks?.facebook?.url,
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
        socialLinks?.instagram?.enabled !== false && socialLinks?.instagram?.url,
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
          <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#0A0A0A" />
        </svg>
      ),
    },
  ].filter((s) => s.url);

  return (
    <>
      <footer role="contentinfo" className="bg-[#0A0A0A] text-white">
        <div className="max-w-7xl mx-auto px-5 py-10 md:py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-[1.5fr_1.2fr_1fr_1fr] gap-8 md:gap-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-2xl font-extrabold tracking-tight mb-3">
                {storeName || "Our Store"}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed md:max-w-60 mb-4">
                {t("footer.store_desc")}
              </p>
              {socials.length > 0 && (
                <div className="flex items-center gap-4">
                  {socials.map((s) => (
                    <a
                      key={s.key}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Support */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4">
                {t("footer.support")}
              </h4>
              <ul className="space-y-3 text-sm text-gray-400">
                {footerInfo?.address && <li>{footerInfo.address}</li>}
                {footerInfo?.email && (
                  <li>
                    <a
                      href={`mailto:${footerInfo.email}`}
                      className="hover:text-white transition-colors"
                    >
                      {footerInfo.email}
                    </a>
                  </li>
                )}
                {footerInfo?.phone && (
                  <li>
                    <a
                      href={`tel:${footerInfo.phone}`}
                      className="hover:text-white transition-colors"
                    >
                      {footerInfo.phone}
                    </a>
                  </li>
                )}
              </ul>
            </div>

            {/* Account */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4">
                {t("footer.account")}
              </h4>
              <ul className="space-y-3 text-sm text-gray-400">
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

            {/* Quick Link */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4">
                {t("footer.quick_links")}
              </h4>
              <ul className="space-y-3 text-sm text-gray-400">
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
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 py-4 px-4 text-center text-xs text-gray-500">
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
