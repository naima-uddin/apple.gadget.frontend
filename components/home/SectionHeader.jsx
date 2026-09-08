"use client";

import React from "react";
import Link from "next/link";

/**
 * Cayenne-style section header: centered title with thin divider lines on
 * both sides and an optional rounded "See More" pill on the right end.
 * `title` may be a string or a JSX node (e.g. with a highlighted word).
 * Pass `onSeeMore` for a button, or `seeMoreHref` for a link.
 */
export default function SectionHeader({
  title,
  seeMoreHref,
  onSeeMore,
  seeMoreLabel = "See More",
  className = "",
}) {
  const pillClass =
    "group shrink-0 inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium text-[#6B7280] hover:text-[#1D1D1F] hover:border-[#1D1D1F] active:scale-95 transition-all shadow-sm whitespace-nowrap";

  return (
    <div className={`flex items-center gap-2 sm:gap-3 md:gap-4 mb-3 ${className}`}>
      <h2 className="min-w-0 truncate text-base sm:text-xl md:text-2xl font-semibold tracking-tight text-[#1F2937] text-left font-georgia">
        {title}
      </h2>
      <div className="flex-1 h-px bg-linear-to-r from-gray-200 to-transparent" />
      {seeMoreHref ? (
        <Link href={seeMoreHref} className={pillClass}>
          {seeMoreLabel}
        </Link>
      ) : onSeeMore ? (
        <button type="button" onClick={onSeeMore} className={pillClass}>
          {seeMoreLabel}
        </button>
      ) : null}
    </div>
  );
}
