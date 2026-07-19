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
    "shrink-0 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-xs font-medium text-[#6B7280] hover:text-[#1D1D1F] hover:border-[#1D1D1F] transition-colors shadow-sm whitespace-nowrap";

  return (
    <div className={`flex items-center gap-3 md:gap-4 mb-6 ${className}`}>
      <h2 className="shrink-0 text-lg sm:text-xl md:text-2xl  tracking-tight text-[#1F2937] text-left work-sans">
        {title}
      </h2>
      <div className="flex-1 h-px bg-gray-200" />
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
