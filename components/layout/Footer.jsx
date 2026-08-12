"use client";
import React, { useState } from "react";
import Link from "next/link";
import AuthModal from "@/components/auth/AuthModal";
import { useUser } from "@/components/context/UserContext";
import { useStoreSettings } from "@/components/context/StoreSettingsContext";
import { useLanguage } from "@/components/context/LanguageContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

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
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState(null); // 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState("");

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 30000);
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        signal: controller.signal,
      });
      clearTimeout(tid);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setStatus("success");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      clearTimeout(tid);
      setStatus("error");
      setErrorMsg(
        err.name === "AbortError" ? t("contact.timeout_error") : err.message,
      );
    }
  };

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
  // Brand column (1.3fr) + N nav columns (0.85fr) + contact form (1.2fr)
  const gridTemplate = `1.3fr ${Array(navCount).fill("0.85fr").join(" ")} 1.2fr`;

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

  return (
    <>
      <footer role="contentinfo" className="bg-[#0A0A0A] text-white">
        <div className="max-w-7xl mx-auto px-5 py-10 md:py-16">
          <div
            style={{ "--footer-cols": gridTemplate }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-y-10 gap-x-8 lg:gap-x-10 lg:grid-cols-(--footer-cols)"
          >
            {/* Brand */}
            <div>
              <div className="flex items-center mb-3 sm:mb-4">
                {displayLogoUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={displayLogoUrl}
                    alt={storeName || "Store logo"}
                    className="h-7 w-auto max-w-[140px] object-contain object-left"
                  />
                )}
              </div>
              <p className="text-sm text-gray-400 leading-relaxed max-w-72 mb-5">
                {t("footer.store_desc")}
              </p>
              <ul className="space-y-2 text-sm text-gray-400 wrap-break-word mb-6">
                {footerInfo?.address && <li>{footerInfo.address}</li>}
                {footerInfo?.email && (
                  <li className="break-all">
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
              {socials.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                    {t("footer.follow_us")}
                  </p>
                  <div className="flex items-center gap-3">
                    {socials.map((s) => (
                      <a
                        key={s.key}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white transition-colors"
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
                  <h4 className="text-sm font-bold mb-4">{col.title}</h4>
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
                  <h4 className="text-sm font-bold mb-4">{t("footer.company")}</h4>
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
                  <h4 className="text-sm font-bold mb-4">{t("footer.product")}</h4>
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

            {/* Contact form */}
            <div>
              <h4 className="text-sm font-bold mb-4">
                {t("footer.contact_title")}
              </h4>
              {status === "success" ? (
                <div className="rounded-sm border border-white/10 bg-white/5 px-4 py-4 text-sm text-gray-300">
                  {t("contact.success_msg")}
                </div>
              ) : (
                <form className="space-y-3" onSubmit={handleFormSubmit}>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    required
                    placeholder={t("footer.contact_name_ph")}
                    className="w-full rounded-sm border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-white/30"
                  />
                  <input
                    type="text"
                    name="email"
                    value={form.email}
                    onChange={handleFormChange}
                    required
                    placeholder={t("footer.contact_email_ph")}
                    className="w-full rounded-sm border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-white/30"
                  />
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleFormChange}
                    required
                    rows={4}
                    placeholder={t("footer.contact_message_ph")}
                    className="w-full rounded-sm border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-white/30 resize-none"
                  />
                  {status === "error" && (
                    <p className="text-sm text-red-400">{errorMsg}</p>
                  )}
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full rounded-sm bg-white px-4 py-2.5 text-sm font-medium text-[#0A0A0A] transition hover:bg-gray-200 disabled:opacity-60"
                  >
                    {status === "loading"
                      ? t("contact.sending")
                      : t("footer.send_message")}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 py-3 sm:py-4 px-4 text-center text-xs text-gray-500 leading-relaxed">
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
