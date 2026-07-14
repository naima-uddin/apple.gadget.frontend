"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/context/LanguageContext";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

function Tile({ tile, big = false, className = "" }) {
  if (!tile) return null;
  return (
    <Link
      href={tile.href || "/"}
      className={`group relative bg-[#F5F6F7]  overflow-hidden ${
        big ? "min-h-64 sm:min-h-80 md:min-h-100" : "h-32 sm:h-40 md:h-48"
      } ${className}`}
    >
      {/* image fills the whole tile */}
      <Image
        src={encodeURI(tile.image || "/assets/placeholder.svg")}
        alt={tile.name || "Category"}
        fill
        sizes={big ? "(max-width: 768px) 100vw, 30vw" : "25vw"}
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {/* soft fade towards the bottom so the name stays readable */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-black/60 via-black/25 to-transparent backdrop-blur-[1.5px] mask-[linear-gradient(to_top,black,transparent)]" />
      {tile.name && (
        <p className="absolute inset-x-0 bottom-3 md:bottom-4 px-2 text-center text-white font-semibold text-sm md:text-base drop-shadow truncate">
          {tile.name}
        </p>
      )}
    </Link>
  );
}

// SteelSeries-style bento showcase: big tile left, 2×2 small tiles in the
// middle, big tile right. Managed in dashboard → Marketing & Content →
// Category Showcase (custom image + label + link per tile, live preview).
export default function CategoryShowcase() {
  const { lang } = useLanguage();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/category-showcase`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  // custom admin tiles first; legacy category slots as fallback
  const tiles = data?.tiles?.length
    ? data.tiles.map((t) => ({
        image: t.image?.url || "",
        name: t.label || "",
        href: t.link || "/",
      }))
    : (data?.categories || []).map((c) => ({
        image: (c.images && c.images[0] && c.images[0].url) || "",
        name: lang === "bn" ? c.nameBn || c.name : c.name,
        href: `/category/${c.slug || (c.name || "").replace(/\s+/g, "-")}/`,
      }));

  if (tiles.length === 0) return null;

  // slots: 0 = left big, 1–4 = middle small, 5 = right big
  const [leftBig, s1, s2, s3, s4, rightBig] = tiles;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {data.title && (
        <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-[#1F2937] text-center mb-8">
          {data.title}
        </h2>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <Tile
          tile={leftBig}
          big
          className="col-span-2 md:col-span-1 md:row-span-2"
        />
        <Tile tile={s1} />
        <Tile tile={s2} />
        <Tile
          tile={rightBig}
          big
          className="col-span-2 md:col-span-1 md:row-span-2 md:col-start-4 md:row-start-1 order-last md:order-0"
        />
        <Tile tile={s3} />
        <Tile tile={s4} />
      </div>
    </section>
  );
}
