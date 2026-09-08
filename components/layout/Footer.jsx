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

/* Small diagonal-arrow used next to social links, mirroring the reference. */
function ArrowUpRight() {
  return (
    <svg
      className="shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

export default function Footer() {
  const { user } = useUser();
  const {
    storeName,
    logoUrl,
    footerLogoUrl,
    faviconUrl,
    footerInfo,
    socialLinks,
    footerLinks,
    footerColumns,
  } = useStoreSettings();
  const brandMark = faviconUrl || footerLogoUrl || logoUrl;
  const { t } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const quickLinks = footerLinks?.customerService?.length
    ? footerLinks.customerService
    : [
        { label: t("footer.about"), href: "/about" },
        { label: t("footer.shop"), href: "/products" },
        { label: t("footer.faq"), href: "/faq" },
        { label: t("footer.contact"), href: "/contact" },
        { label: t("footer.shipping_returns"), href: "/shipping" },
        { label: t("footer.return_policy"), href: "/returns" },
      ];

  // Admin-configured navigation columns fully replace the default quick links.
  const navColumns = (Array.isArray(footerColumns) ? footerColumns : [])
    .map((col) => ({
      title: col?.title || "",
      links: (Array.isArray(col?.links) ? col.links : []).filter(
        (l) => l && l.label,
      ),
    }))
    .filter((col) => col.title || col.links.length);
  const useDynamicColumns = navColumns.length > 0;

  // Flatten the fallback quick links into two balanced sub-columns like the ref.
  const half = Math.ceil(quickLinks.length / 2);
  const quickCols = [quickLinks.slice(0, half), quickLinks.slice(half)];

  const socials = [
    {
      key: "facebook",
      label: "Facebook",
      url:
        socialLinks?.facebook?.enabled !== false && socialLinks?.facebook?.url,
    },
    {
      key: "instagram",
      label: "Instagram",
      url:
        socialLinks?.instagram?.enabled !== false &&
        socialLinks?.instagram?.url,
    },
    {
      key: "twitter",
      label: "Twitter / X",
      url: socialLinks?.twitter?.enabled !== false && socialLinks?.twitter?.url,
    },
    {
      key: "youtube",
      label: "YouTube",
      url: socialLinks?.youtube?.enabled !== false && socialLinks?.youtube?.url,
    },
    {
      key: "tiktok",
      label: "TikTok",
      url: socialLinks?.tiktok?.enabled !== false && socialLinks?.tiktok?.url,
    },
  ].filter((s) => s.url);

  return (
    <>
      {/* Full-width dark footer — no max-width container */}
      <footer role="contentinfo" className="bg-[#161616]">
        <div className="relative w-full overflow-hidden text-white">
          {/* Subtle flowing-line texture, matching the reference backdrop */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "radial-gradient(120% 120% at 15% 0%, #ffffff 0, transparent 45%), radial-gradient(120% 120% at 85% 100%, #ffffff 0, transparent 45%)",
            }}
          />

          <div className="relative px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
            {/* ── Contact (left) · Brand (center) · Quick links (right) ── */}
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_auto_1fr] lg:items-start lg:gap-10">
              {/* Contact */}
              <div className="order-2 lg:order-1">
                <h3 className="text-lg font-semibold">
                  {t("footer.contact_title")}
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-white/60">
                  {footerInfo?.address && <li>{footerInfo.address}</li>}
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
                  {footerInfo?.email && (
                    <li>
                      <a
                        href={`mailto:${footerInfo.email}`}
                        className="underline decoration-white/30 underline-offset-4 hover:text-white hover:decoration-white transition-colors"
                      >
                        {footerInfo.email}
                      </a>
                    </li>
                  )}
                </ul>

                {socials.length > 0 && (
                  <ul className="mt-5 space-y-2 text-sm text-white/70">
                    {socials.map((s) => (
                      <li key={s.key}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-1.5 hover:text-white transition-colors"
                        >
                          {s.label}
                          <ArrowUpRight />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* ── Centered brand hero ── */}
              <div className="order-1 flex flex-col items-center text-center lg:order-2 lg:px-6">
                {brandMark && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={brandMark}
                    alt={storeName || "Store"}
                    className="h-28 w-28 sm:h-36 sm:w-36 object-contain"
                  />
                )}
                <p className="mt-1 max-w-sm text-sm sm:text-base italic text-white/60">
                  {t("footer.store_desc")}
                </p>

                {/* CTA pills */}
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/products"
                    className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#161616] transition-colors hover:bg-white/85"
                  >
                    {t("footer.shop")}
                    <ArrowUpRight />
                  </Link>
                  {user ? (
                    <Link
                      href="/user/profile"
                      className="group inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                    >
                      {t("footer.my_account")}
                      <ArrowUpRight />
                    </Link>
                  ) : (
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="group inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                    >
                      {t("footer.login_register")}
                      <ArrowUpRight />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick links */}
              <div className="order-3 lg:justify-self-end">
                <h3 className="text-lg font-semibold">
                  {t("footer.quick_links")}
                </h3>
                {useDynamicColumns ? (
                  <div className="mt-4 grid grid-cols-2 gap-x-10 gap-y-6">
                    {navColumns.map((col, ci) => (
                      <div key={ci}>
                        {col.title && (
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                            {col.title}
                          </p>
                        )}
                        <ul className="space-y-2 text-sm text-white/60">
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
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-x-10 gap-y-2">
                    {quickCols.map((col, ci) => (
                      <ul key={ci} className="space-y-2 text-sm text-white/60">
                        {col.map((item, i) => (
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
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="relative flex flex-col gap-3 border-t border-white/10 px-6 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-14">
            <span>
              © {new Date().getFullYear()} {storeName || "Our Store"}.{" "}
              {t("footer.rights")}
            </span>
            <span className="flex flex-wrap items-center gap-x-5 gap-y-1">
              <Link href="/privacy" className="hover:text-white transition-colors">
                {t("footer.privacy")}
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                {t("footer.terms")}
              </Link>
            </span>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
