"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

// Compute the remaining time (days/hours/min/sec) until `endsAt`, or null when
// there's no valid future target left.
function getRemaining(endsAt) {
  if (!endsAt) return null;
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(end)) return null;
  const diff = end - Date.now();
  if (diff <= 0) return null;
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

const pad = (n) => String(n).padStart(2, "0");

// Countdown unit: compact dark tile with the padded number (no unit label).
function TimePill({ value }) {
  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-[5px] bg-[#1D1D1F] px-1 py-0.5 text-[10px] font-bold leading-none tabular-nums text-white shadow-sm ring-1 ring-white/10">
      {pad(value)}
    </span>
  );
}

function Sep() {
  return <span className="text-[10px] font-bold text-[#D1D5DB]">:</span>;
}

// A thin countdown row shown ABOVE the banner image (right-aligned).
function Countdown({ endsAt }) {
  const [remaining, setRemaining] = useState(() => getRemaining(endsAt));

  useEffect(() => {
    const tick = () => setRemaining(getRemaining(endsAt));
    const id = setInterval(tick, 1000);
    tick();
    return () => clearInterval(id);
  }, [endsAt]);

  if (!remaining) return null;

  return (
    <div className="mb-1.5 flex items-center justify-end gap-1">
      <svg
        className="mr-0.5 h-3 w-3 text-[#9CA3AF]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
      <span className="mr-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#9CA3AF]">
        Ends in
      </span>
      {remaining.days > 0 && (
        <>
          <TimePill value={remaining.days} />
          <Sep />
        </>
      )}
      <TimePill value={remaining.hours} />
      <Sep />
      <TimePill value={remaining.minutes} />
      <Sep />
      <TimePill value={remaining.seconds} />
    </div>
  );
}

// Thin, very-small-height promotional strip shown in the homepage slot that
// previously held Store Hero. Fully admin-controlled — dashboard → Promo Banner:
// a wide/short banner image (optional separate mobile image), a click-through
// link, the desktop strip height and an optional flash-sale countdown timer
// (rendered as a thin row directly above the banner). Renders nothing when
// disabled/unset.
export default function PromoBanner({ className = "" }) {
  const [banner, setBanner] = useState(undefined); // undefined = loading

  useEffect(() => {
    fetch(`${API}/api/promo-banner`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setBanner(d.banner || null))
      .catch(() => setBanner(null));
  }, []);

  if (!banner) return null; // loading (undefined) or nothing configured (null)

  const height = Number(banner.height) || 64;
  // On phones the same wide strip would crop too aggressively at full desktop
  // height, so scale it down (admin `mobileHeight` wins when provided).
  const mobileHeight = Number(banner.mobileHeight) || Math.max(40, Math.round(height * 0.7));
  const hasMobile = !!banner.mobileImage?.url;

  const imageBox = hasMobile ? (
    <>
      {/* Mobile: dedicated banner shown in full at its natural aspect ratio
          (no cropping) so a purpose-made mobile creative displays completely. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={banner.mobileImage.url}
        alt="Promotion"
        className="block w-full h-auto border border-white sm:hidden"
        loading="lazy"
      />
      {/* Desktop: thin fixed-height strip. */}
      <div
        className="relative hidden w-full overflow-hidden sm:block h-[var(--promo-h)]"
        style={{ "--promo-h": `${height}px` }}
      >
        <Image
          src={banner.image.url}
          alt="Promotion"
          fill
          sizes="(max-width: 1280px) 100vw, 1280px"
          priority={false}
          className="object-cover object-center"
        />
      </div>
    </>
  ) : (
    // No dedicated mobile image: one wide strip, scaled shorter on phones.
    <div
      className="relative w-full overflow-hidden h-[var(--promo-h-m)] sm:h-[var(--promo-h)]"
      style={{ "--promo-h": `${height}px`, "--promo-h-m": `${mobileHeight}px` }}
    >
      <Image
        src={banner.image.url}
        alt="Promotion"
        fill
        sizes="(max-width: 1280px) 100vw, 1280px"
        priority={false}
        className="object-cover object-center"
      />
    </div>
  );

  return (
    <section className={className}>
      {banner.timerEnabled && <Countdown endsAt={banner.timerEndsAt} />}
      {banner.link ? (
        <Link href={banner.link} aria-label="Promotion" className="block">
          {imageBox}
        </Link>
      ) : (
        imageBox
      )}
    </section>
  );
}
