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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {visible.map((cat) => (
            <Link key={cat._id} href={cat.link} className="group block">
              <div className="relative rounded-3xl overflow-hidden bg-[#F5F6F7] h-36 sm:h-44 md:h-52 shadow-sm">
                <Image
                  src={encodeURI(cat.image)}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <p className="mt-3 text-center text-sm md:text-base font-semibold text-[#1D1D1F] group-hover:text-black transition-colors truncate">
                {cat.name}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
