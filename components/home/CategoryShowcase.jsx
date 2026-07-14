"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

function Tile({ tile, big = false, className = "" }) {
  if (!tile) return null;
  return (
    <Link
      href={tile.link || "/"}
      className={`group relative bg-[#F5F6F7] overflow-hidden ring-1 ring-black/5 ${
        big ? "max-md:min-h-74" : "max-md:h-46"
      } ${className}`}
    >
      {/* image fills the whole tile */}
      <Image
        src={encodeURI(tile.image?.url || "/assets/placeholder.svg")}
        alt={tile.label || "Category"}
        fill
        sizes={big ? "(max-width: 768px) 100vw, 30vw" : "25vw"}
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110 shadow"
      />
      {/* soft fade towards the bottom so the name stays readable */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-black/60 via-black/25 to-transparent backdrop-blur-[1.5px] mask-[linear-gradient(to_top,black,transparent)] transition-opacity duration-300 group-hover:from-black/75" />
      {/* label + hover hint */}
      <div className="absolute inset-x-0 bottom-0 px-3 pb-2 md:pb-3 text-center">
        <p className="text-white font-semibold text-sm md:text-base drop-shadow truncate transition-transform duration-300 group-hover:-translate-y-1">
          {tile.label}
        </p>
        <span className="block text-[10px] md:text-[11px] font-semibold uppercase tracking-widest text-white/90 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
          Shop Now →
        </span>
      </div>
    </Link>
  );
}

function ShowcasePage({ page }) {
  // slots: 0 = left big, 1–4 = middle small, 5 = right big
  const [leftBig, s1, s2, s3, s4, rightBig] = page.tiles;
  return (
    <div className="w-full shrink-0 px-0.5">
      {page.title && (
        <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-[#1F2937] text-center mb-6 work-sans">
          {page.title}
        </h2>
      )}
      {/* md+: 6 columns — each big tile spans 2 (= the two middle smalls
          combined), two fixed rows so smalls are exactly half a big tile */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-3 md:auto-rows-55 lg:auto-rows-62.5">
        <Tile tile={leftBig} big className="col-span-2 md:row-span-2" />
        <Tile tile={s1} />
        <Tile tile={s2} />
        <Tile
          tile={rightBig}
          big
          className="col-span-2 md:row-span-2 md:col-start-5 md:row-start-1 order-last md:order-0"
        />
        <Tile tile={s3} />
        <Tile tile={s4} />
      </div>
    </div>
  );
}

// SteelSeries-style bento showcase. Multiple pages (dashboard → Marketing &
// Content → Category Showcase) render as a slider with dots underneath.
export default function CategoryShowcase() {
  const [pages, setPages] = useState([]);
  const [current, setCurrent] = useState(0);
  const autoRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/api/category-showcase`)
      .then((r) => r.json())
      .then((d) => setPages(d.pages || []))
      .catch(() => setPages([]));
  }, []);

  const total = pages.length;

  const startAuto = useCallback(() => {
    clearInterval(autoRef.current);
    if (total <= 1) return;
    autoRef.current = setInterval(
      () => setCurrent((p) => (p + 1) % total),
      6000,
    );
  }, [total]);

  useEffect(() => {
    startAuto();
    return () => clearInterval(autoRef.current);
  }, [startAuto]);

  if (total === 0) return null;

  return (
    <section
      className=" "
      onMouseEnter={() => clearInterval(autoRef.current)}
      onMouseLeave={startAuto}
    >
      {/* sliding track — one showcase page per slide */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {pages.map((page, i) => (
            <ShowcasePage key={i} page={page} />
          ))}
        </div>

        {/* dots */}
        {total > 1 && (
          <div className="flex justify-center items-center gap-2.5 mt-3 bg-[#faebfd] py-1.5 px-6 rounded-full w-fit mx-auto">
            {pages.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to showcase ${i + 1}`}
                onClick={() => {
                  setCurrent(i);
                  startAuto();
                }}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-3 h-3 border-2 border-[#1F2937] bg-white ring-2 ring-white"
                    : "w-2 h-2 bg-gray-400 hover:bg-[#5B21B6]"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
