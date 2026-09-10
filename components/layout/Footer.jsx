"use client";
import React, { useState } from "react";
import Link from "next/link";
import AuthModal from "@/components/auth/AuthModal";
import { useUser } from "@/components/context/UserContext";
import { useStoreSettings } from "@/components/context/StoreSettingsContext";
import { useLanguage } from "@/components/context/LanguageContext";

// Hosts that are really "us" — an absolute link to any of these should route
// in-app (client-side) instead of triggering a full-page jump to production.
// This also fixes local dev, where the DB stores footer links as absolute
// https://applebd.com/... URLs: without this, clicking one would leave the
// local build and load the live site.
const INTERNAL_HOSTS = ["applebd.com", "www.applebd.com"];

function normalizeHref(href) {
  if (!href) return "/";
  if (href.startsWith("http://") || href.startsWith("https://")) {
    try {
      const url = new URL(href);
      let siteHost = "";
      try {
        siteHost = new URL(process.env.NEXT_PUBLIC_SITE_URL || "").host;
      } catch {}
      if (url.host === siteHost || INTERNAL_HOSTS.includes(url.host)) {
        // Same-site absolute URL → collapse to a relative path for SPA routing.
        return `${url.pathname}${url.search}${url.hash}` || "/";
      }
    } catch {}
    // Genuinely external (social links, etc.) — leave untouched.
    return href;
  }
  if (href.startsWith("/")) return href;
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

/* Premium footer link — subtle color shift + animated underline that grows in. */
function FooterLink({ href, external, children }) {
  const cls =
    "group/link relative inline-flex w-fit items-center text-[#1D1D1F]/70 transition-colors duration-200 hover:text-black";
  const underline = (
    <span
      aria-hidden="true"
      className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-black transition-transform duration-300 ease-out group-hover/link:scale-x-100"
    />
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
        {underline}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
      {underline}
    </Link>
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
    footerBrand,
  } = useStoreSettings();
  const topIcon = faviconUrl || footerLogoUrl || logoUrl;
  const { t } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Admin-controlled brand block + bottom bar, each with a translated fallback.
  const brand = footerBrand || {};
  const headline = brand.headline || "Premium Apple Products";
  const tagline = brand.tagline || t("footer.store_desc");
  const contactTitle = brand.contactTitle || t("footer.contact_title");
  const quickLinksTitle = brand.quickLinksTitle || t("footer.quick_links");
  const followUsLabel = brand.followUsLabel || t("footer.follow_us");
  const primaryCtaLabel = brand.primaryCtaLabel || t("footer.shop");
  const primaryCtaLink = normalizeHref(brand.primaryCtaLink || "/products");
  const accountCtaLabel = brand.accountCtaLabel || t("footer.my_account");
  const accountCtaLink = normalizeHref(brand.accountCtaLink || "/user/profile");
  const loginCtaLabel = brand.loginCtaLabel || t("footer.login_register");
  const copyright = (brand.copyright || "")
    .replace(/\{year\}/g, String(new Date().getFullYear()))
    .trim();
  const bottomLinks = (Array.isArray(brand.bottomLinks) ? brand.bottomLinks : [])
    .filter((l) => l && l.label);
  const legalLinks = bottomLinks.length
    ? bottomLinks
    : [
        { label: t("footer.privacy"), href: "/privacy" },
        { label: t("footer.terms"), href: "/terms" },
      ];

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
      {/* Full-width footer — no max-width container */}
      <footer
        role="contentinfo"
        className="relative mt-16 rounded-t-[2.5rem] bg-[#F0F9FF] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] ring-1 ring-black/5 border border-white"
      >
        {/* Favicon poking out over the top-center edge */}
        {topIcon && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={topIcon}
            alt={storeName || "Store"}
            className="absolute left-1/2 top-0 z-10 h-20 w-20 sm:h-24 sm:w-24 -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-md"
          />
        )}
        <div className="relative w-full text-[#1D1D1F]">
          {/* Subtle flowing-line texture, matching the reference backdrop */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.10]"
            style={{
              backgroundImage:
                "radial-gradient(120% 120% at 15% 0%, #ffffff 0, transparent 45%), radial-gradient(120% 120% at 85% 100%, #ffffff 0, transparent 45%)",
            }}
          />

          <div className="relative mx-auto max-w-360 px-6 pt-12 pb-6 sm:px-10 lg:px-14 lg:pt-14 lg:pb-7">
            {/* ── Contact (left) · Brand (center) · Quick links (right) ── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-start lg:gap-10">
              {/* Contact */}
              <div className="order-2 lg:order-1">
                <h3 className="text-lg font-semibold">
                  {contactTitle}
                </h3>
                <div className="mt-4 grid grid-cols-2 gap-x-10 gap-y-6">
                  {/* Contact details */}
                  <ul className="space-y-2 text-sm text-[#1D1D1F]/70">
                    {footerInfo?.address && <li>{footerInfo.address}</li>}
                    {footerInfo?.phone && (
                      <li>
                        <a
                          href={`tel:${footerInfo.phone}`}
                          className="hover:text-black transition-colors"
                        >
                          {footerInfo.phone}
                        </a>
                      </li>
                    )}
                    {footerInfo?.email && (
                      <li>
                        <a
                          href={`mailto:${footerInfo.email}`}
                          className="underline decoration-black/30 underline-offset-4 hover:text-black hover:decoration-black transition-colors"
                        >
                          {footerInfo.email}
                        </a>
                      </li>
                    )}
                  </ul>

                  {/* Social links as a separate sub-column */}
                  {socials.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#1D1D1F]/50">
                        {followUsLabel}
                      </p>
                      <ul className="space-y-2.5 text-sm">
                        {socials.map((s) => (
                          <li key={s.key}>
                            <FooterLink href={s.url} external>
                              <span className="group inline-flex items-center gap-1.5">
                                {s.label}
                                <ArrowUpRight />
                              </span>
                            </FooterLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Centered brand hero ── */}
              <div className="order-1 flex flex-col items-center text-center lg:order-2 lg:px-6">
                {/* Premium banner headline with red flanking rules */}
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  <span className="h-[3px] w-8 sm:w-12 rounded-full bg-gradient-to-l from-red-600 to-transparent" />
                  <h2 className="text-base sm:text-xl font-semibold uppercase tracking-[0.18em] sm:tracking-[0.28em] text-[#1D1D1F]">
                    {headline}
                  </h2>
                  <span className="h-[3px] w-8 sm:w-12 rounded-full bg-gradient-to-r from-red-600 to-transparent" />
                </div>
                {tagline && (
                  <p className="mt-2 max-w-sm text-sm sm:text-base italic text-[#1D1D1F]/70">
                    {tagline}
                  </p>
                )}

                {/* CTA pills */}
                <div className="mt-4 flex flex-nowrap items-center justify-center gap-2 sm:gap-3">
                  {primaryCtaLabel && (
                    <Link
                      href={primaryCtaLink}
                      className="group inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-[#1D1D1F] px-4 py-2 text-xs sm:px-6 sm:py-3 sm:text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-black hover:shadow-xl hover:shadow-black/20"
                    >
                      {primaryCtaLabel}
                      <ArrowUpRight />
                    </Link>
                  )}
                  {user ? (
                    accountCtaLabel && (
                      <Link
                        href={accountCtaLink}
                        className="group inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-[#1D1D1F]/25 bg-white/40 px-4 py-2 text-xs sm:px-6 sm:py-3 sm:text-sm font-semibold text-[#1D1D1F] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1D1D1F]/50 hover:bg-white/70 hover:shadow-md"
                      >
                        {accountCtaLabel}
                        <ArrowUpRight />
                      </Link>
                    )
                  ) : (
                    loginCtaLabel && (
                      <button
                        onClick={() => setShowAuthModal(true)}
                        className="group inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-[#1D1D1F]/25 bg-white/40 px-4 py-2 text-xs sm:px-6 sm:py-3 sm:text-sm font-semibold text-[#1D1D1F] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1D1D1F]/50 hover:bg-white/70 hover:shadow-md"
                      >
                        {loginCtaLabel}
                        <ArrowUpRight />
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Quick links */}
              <div className="order-3 lg:justify-self-end">
                <h3 className="text-lg font-semibold">
                  {quickLinksTitle}
                </h3>
                {useDynamicColumns ? (
                  <div className="mt-4 grid grid-cols-2 gap-x-10 gap-y-6">
                    {navColumns.map((col, ci) => (
                      <div key={ci}>
                        {col.title && (
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#1D1D1F]/50">
                            {col.title}
                          </p>
                        )}
                        <ul className="space-y-2.5 text-sm">
                          {col.links.map((item, i) => (
                            <li key={i}>
                              <FooterLink href={normalizeHref(item.href)}>
                                {item.label}
                              </FooterLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-x-10 gap-y-2">
                    {quickCols.map((col, ci) => (
                      <ul key={ci} className="space-y-2.5 text-sm">
                        {col.map((item, i) => (
                          <li key={i}>
                            <FooterLink href={normalizeHref(item.href)}>
                              {item.label}
                            </FooterLink>
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
          <div className="relative mx-auto flex max-w-360 flex-col gap-3 border-t border-[#1D1D1F]/15 px-6 py-5 text-xs text-[#1D1D1F]/60 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-14">
            <span>
              {copyright || (
                <>
                  © {new Date().getFullYear()} {storeName || "Our Store"}.{" "}
                  {t("footer.rights")}
                </>
              )}
            </span>
            <span className="flex flex-wrap items-center gap-x-5 gap-y-1">
              {legalLinks.map((item, i) => (
                <FooterLink key={i} href={normalizeHref(item.href)}>
                  {item.label}
                </FooterLink>
              ))}
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
