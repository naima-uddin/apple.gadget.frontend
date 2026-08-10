"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

const INITIAL_COUNT = 6;

const pillClass =
  "shrink-0 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-xs font-medium text-[#6B7280] hover:text-[#1D1D1F] hover:border-[#1D1D1F] transition-colors shadow-sm whitespace-nowrap";

// Heading + scrollable row of category icons, shown below the breadcrumb on
// category pages (components/category/CategoryPageClient.jsx) and the "All
// Products" page (components/category/AllProductsClient.jsx), as a quick
// category switcher. Fully admin-controlled — dashboard → Storefront Design
// → Store Hero: heading text, subheading text, each icon's image/label/link.
export default function StoreHero({ className = "" }) {
  const [data, setData] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/store-hero`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ items: [] }));
  }, []);

  if (!data) return null;
  const { heading, subheading, items = [] } = data;
  if (!heading && !subheading && items.length === 0) return null;

  const hasMore = items.length > INITIAL_COUNT;
  const visible = expanded ? items : items.slice(0, INITIAL_COUNT);

  return (
    <section className={className}>
      {(heading || subheading || hasMore) && (
        <div className="flex items-center gap-3 md:gap-4">
          {(heading || subheading) && (
            <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight leading-tight">
              {heading && <span className="text-[#1D1D1F]">{heading} </span>}
              {subheading && (
                <span className="text-[#6B7280]">{subheading}</span>
              )}
            </h1>
          )}
          <div className="flex-1" />
          {hasMore && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className={pillClass}
            >
              {expanded ? "See Less" : "See More"}
            </button>
          )}
        </div>
      )}

      {items.length > 0 && (
        <div
          className={`${heading || subheading || hasMore ? "mt-6" : ""} -mx-4 sm:mx-0 overflow-x-auto scrollbar-hide`}
        >
          <div className="flex gap-8 sm:gap-10 px-4 sm:px-0 min-w-max sm:min-w-0 sm:flex-wrap">
            {visible.map((item, i) => (
              <Link
                key={i}
                href={item.link || "/"}
                className="group flex flex-col items-center gap-4 shrink-0"
              >
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                  {item.image?.url ? (
                    <Image
                      src={item.image.url}
                      alt={item.label || "Category"}
                      fill
                      sizes="80px"
                      className="object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <span className="text-[10px] sm:text-xs font-semibold text-[#1D1D1F] group-hover:text-black transition-colors -mt-2">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
