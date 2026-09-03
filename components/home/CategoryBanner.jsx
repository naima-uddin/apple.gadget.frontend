"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

// Mini-height promotional banner shown right below "Shop by Category" on the
// homepage. Fully admin-controlled — dashboard → Storefront Design → Category
// Banner: enable toggle, label, heading + accent word, subheading, CTA button,
// discount badge, colors, product photos and a brand-logo row. Renders nothing
// when disabled/unset (API returns { banner: null }).
export default function CategoryBanner() {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/category-banner`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setBanner(d.banner || null))
      .catch(() => setBanner(null));
  }, []);

  if (!banner) return null;

  // Direct-image mode: the whole banner is a single uploaded image.
  if (banner.image?.url) {
    const { image, mobileImage, link } = banner;
    const img = (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt=""
          className={`w-full h-auto object-contain rounded-2xl ${
            mobileImage?.url ? "hidden sm:block" : ""
          }`}
        />
        {mobileImage?.url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={mobileImage.url}
            alt=""
            className="w-full h-auto object-contain rounded-2xl sm:hidden"
          />
        )}
      </>
    );
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-3 md:py-4">
        {link ? (
          <Link href={link} className="block">
            {img}
          </Link>
        ) : (
          img
        )}
      </section>
    );
  }

  const {
    label,
    heading,
    headingAccent,
    subheading,
    buttonText,
    buttonLink,
    badgePrefix,
    badgeValue,
    bgColor,
    accentColor,
    products = [],
    brands = [],
  } = banner;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-3 md:py-4">
      <div
        className="relative overflow-hidden rounded-2xl px-5 py-5 sm:px-8 sm:py-6"
        style={{ backgroundColor: bgColor || "#111114" }}
      >
        <div className="flex items-center gap-4 sm:gap-8">
          {/* ── Left: copy + CTA ── */}
          <div className="shrink-0 max-w-[46%] sm:max-w-none">
            {label && (
              <span
                className="inline-block text-[10px] sm:text-xs font-semibold tracking-wide uppercase"
                style={{ color: accentColor || "#F97316" }}
              >
                {label}
              </span>
            )}
            {(heading || headingAccent) && (
              <h2 className="mt-1 text-lg sm:text-2xl lg:text-3xl font-bold leading-tight text-white">
                {heading}{" "}
                {headingAccent && (
                  <span style={{ color: accentColor || "#F97316" }}>
                    {headingAccent}
                  </span>
                )}
              </h2>
            )}
            {subheading && (
              <p className="mt-1 text-xs sm:text-sm text-white/70 max-w-xs">
                {subheading}
              </p>
            )}
            {buttonText && (
              <Link
                href={buttonLink || "/"}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.03]"
                style={{ backgroundColor: accentColor || "#F97316" }}
              >
                {buttonText}
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            )}
          </div>

          {/* ── Center: product photos ── */}
          {products.length > 0 && (
            <div className="flex-1 flex items-center justify-center gap-1 sm:gap-3 min-w-0 overflow-hidden">
              {products.map((p, i) => (
                <div
                  key={i}
                  className="relative h-16 sm:h-24 lg:h-28 w-12 sm:w-20 lg:w-24 shrink-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image.url}
                    alt=""
                    className="h-full w-full object-contain drop-shadow-lg"
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── Right: discount badge ── */}
          {(badgePrefix || badgeValue) && (
            <div className="shrink-0 ml-auto">
              <div
                className="flex flex-col items-center justify-center rounded-full text-center h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24"
                style={{ backgroundColor: accentColor || "#F97316" }}
              >
                {badgePrefix && (
                  <span className="text-[8px] sm:text-[10px] font-semibold uppercase tracking-wide text-white/90 leading-none">
                    {badgePrefix}
                  </span>
                )}
                {badgeValue && (
                  <span className="text-sm sm:text-lg lg:text-xl font-extrabold text-white leading-tight px-1">
                    {badgeValue}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Brand logos row ── */}
        {brands.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center flex-wrap gap-x-8 gap-y-3 sm:gap-x-14">
            {brands.map((b, i) => {
              const logo = (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={b.image.url}
                  alt=""
                  className="h-5 sm:h-6 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
                />
              );
              return b.link ? (
                <Link key={i} href={b.link} className="shrink-0">
                  {logo}
                </Link>
              ) : (
                <span key={i} className="shrink-0">
                  {logo}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
