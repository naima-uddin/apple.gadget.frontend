"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCategories } from "@/components/context/CategoryContext";
import { useLanguage } from "@/components/context/LanguageContext";

const PAGE_SIZE = 6;

export default function ShopByCategory() {
  const { categories: rawCategories, loading } = useCategories();
  const { t, lang } = useLanguage();
  const [page, setPage] = useState(0);

  const categories = (rawCategories || []).map((c) => {
    const slug = c.slug || (c.name || "").replace(/\s+/g, "-");
    return {
      _id: c._id,
      name: lang === "bn" ? c.nameBn || c.name : c.name,
      image:
        c.images && c.images[0] && c.images[0].url
          ? c.images[0].url
          : "/assets/placeholder.svg",
      link: `/category/${slug}/`,
    };
  });

  const totalPages = Math.ceil(categories.length / PAGE_SIZE);
  const visible = categories.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // bento pattern: wide card at position 0 (row 1) and 4 (row 2)
  const isWide = (i) => i === 0 || i === 4;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-10 mb-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          {t("home.category")}
        </h2>
        {totalPages > 1 && (
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={page === 0}
              aria-label="Previous categories"
              className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
              disabled={page >= totalPages - 1}
              aria-label="Next categories"
              className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-gray-500 py-10 w-full text-center">
          {t("home.loading_categories")}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-gray-500 py-10 w-full text-center">
          {t("home.no_categories")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {visible.map((cat, i) => (
            <Link
              key={cat._id}
              href={cat.link}
              className={`group relative rounded-2xl overflow-hidden bg-[#EEF0F2] h-52 md:h-60 ${
                isWide(i) ? "sm:col-span-2" : ""
              }`}
            >
              <Image
                src={encodeURI(cat.image)}
                alt={cat.name}
                fill
                sizes={
                  isWide(i)
                    ? "(max-width: 640px) 100vw, 50vw"
                    : "(max-width: 640px) 100vw, 25vw"
                }
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-white/90 via-white/40 to-transparent" />
              <div className="absolute bottom-0 left-0 p-5">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 leading-tight mb-1">
                  {cat.name}
                </h3>
                <span className="inline-block text-[11px] font-semibold tracking-widest uppercase text-gray-700 border-b border-gray-700 pb-0.5 group-hover:text-[#2563EB] group-hover:border-[#2563EB] transition-colors">
                  {lang === "bn" ? "আরও দেখুন" : "View More"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
