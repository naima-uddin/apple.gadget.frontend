"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/components/context/LanguageContext";
import SectionHeader from "./SectionHeader";
import { FeaturedSlider } from "./FeaturedSections";

// Renders a single, individually-placed Featured Row (product carousel) at
// whatever position it's been given in the homepage layout order.
export default function FeaturedRow({ sectionId }) {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
  const { t, lang } = useLanguage();
  const [section, setSection] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/featured/${sectionId}`)
      .then((r) => r.json())
      .then((b) => setSection(b.section || null))
      .catch(() => setSection(null))
      .finally(() => setLoaded(true));
  }, [API, sectionId]);

  if (!loaded || !section || !section.products?.length) return null;

  return (
    <div className="w-full bg-[#f7f5ff] py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-2">
        <SectionHeader
          title={lang === "bn" ? section.titleBn || section.title : section.title}
          seeMoreHref={
            section.viewAllLink && section.viewAllLink !== "/"
              ? section.viewAllLink
              : undefined
          }
          seeMoreLabel={t("home.see_more")}
        />
        <FeaturedSlider products={section.products} />
      </div>
    </div>
  );
}
