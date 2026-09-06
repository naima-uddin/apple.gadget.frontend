"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCategories } from "@/components/context/CategoryContext";
import { useLanguage } from "@/components/context/LanguageContext";
import SectionHeader from "./SectionHeader";

const INITIAL_COUNT = 4;

export default function ShopByCategory() {
  const { categories: rawCategories, loading } = useCategories();
  const { t, lang } = useLanguage();
  const [expanded, setExpanded] = useState(false);

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

  const hasMore = categories.length > INITIAL_COUNT;
  const visible = expanded ? categories : categories.slice(0, INITIAL_COUNT);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-20 mb-10">
      <SectionHeader
        title={t("home.category")}
        onSeeMore={hasMore ? () => setExpanded((v) => !v) : undefined}
        seeMoreLabel={expanded ? t("home.see_less") : t("home.see_more")}
      />

      {loading ? (
        <div className="text-[#6B7280] py-10 w-full text-center">
          {t("home.loading_categories")}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-[#6B7280] py-10 w-full text-center">
          {t("home.no_categories")}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-7">
          {visible.map((cat) => (
            <Link key={cat._id} href={cat.link} className="group block">
              <div className="relative rounded-[28px] overflow-hidden h-44 sm:h-52 md:h-60 border border-[#ececf0] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-all duration-500 ease-out group-hover:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.22)] group-hover:-translate-y-1.5 group-hover:border-[#d8d8de]">
                {/* soft ambient backdrop */}
                <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,#ffffff_0%,#f6f6f8_45%,#ececf0_100%)]" />
                {/* subtle top sheen */}
                <div className="absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-white/70 to-transparent opacity-80" />

                <Image
                  src={encodeURI(cat.image)}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="relative object-contain p-6 drop-shadow-[0_10px_18px_rgba(0,0,0,0.10)] transition-transform duration-[600ms] ease-out group-hover:scale-[1.08]"
                />

                {/* glass label bar inside the card */}
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-4 py-2.5 backdrop-blur-md shadow-sm transition-colors duration-500 group-hover:bg-white/90">
                  <span className="text-sm md:text-[15px] font-semibold text-[#1D1D1F] truncate font-georgia">
                    {cat.name}
                  </span>
                  <span className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1D1D1F] text-white transition-transform duration-500 ease-out group-hover:translate-x-0.5 group-hover:bg-black">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
