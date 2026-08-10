"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

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
  const [overflowing, setOverflowing] = useState(false);
  const [rowH, setRowH] = useState(0);
  const rowRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/api/store-hero`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ items: [] }));
  }, []);

  // Measure the height of a single row and whether the items overflow past it,
  // so exactly one row shows when collapsed and "See More" only appears when
  // there's a second row. Recomputes on resize (row count is width-dependent).
  useLayoutEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const measure = () => {
      const first = el.firstElementChild;
      const h = first ? first.offsetHeight : 0;
      setRowH(h);
      // scrollHeight reflects full content even while clipped by max-height.
      setOverflowing(h > 0 && el.scrollHeight > h + 8);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [data]);

  if (!data) return null;
  const { heading, subheading, items = [] } = data;
  if (!heading && !subheading && items.length === 0) return null;

  const collapsed = !expanded && overflowing;

  return (
    <section className={className}>
      {(heading || subheading || overflowing) && (
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
          {overflowing && (
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
        <div className={heading || subheading || overflowing ? "mt-6" : ""}>
          <div
            ref={rowRef}
            className="flex flex-wrap justify-start gap-x-8 sm:gap-x-10 gap-y-8 overflow-hidden"
            style={collapsed && rowH ? { maxHeight: rowH } : undefined}
          >
            {items.map((item, i) => (
              <Link
                key={i}
                href={item.link || "/"}
                className="group flex flex-col items-center gap-4 shrink-0"
              >
                <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
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
