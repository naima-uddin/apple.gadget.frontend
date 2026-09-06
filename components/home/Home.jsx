"use client";

import React, { useState, useEffect } from "react";
import Banner from "./Banner";
import ShopByCategory from "./ShopByCategory";
import FeaturedSections from "./FeaturedSections";
import FeaturedRow from "./FeaturedRow";
import CategoryShowcase from "./CategoryShowcase";
import WhyChooseUs from "./WhyChooseUs";
import DealsOfDay from "./DealsOfDay";
import CTASection from "./CTASection";
import Testimonials from "./Testimonials";
import AdSlot from "@/components/ui/AdSlot";
import OffersToSayYes from "./OffersToSayYes";
import ShoppableVideoSection from "./ShoppableVideoSection";
import PromoBanner from "./PromoBanner";
import CategoryBanner from "./CategoryBanner";
import TypographicHero from "./TypographicHero";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

// Fallback order used only as the initial render (before the live layout
// arrives) and if the layout API is entirely unreachable — the old
// pre-feature static layout, with all product carousels grouped together
// (rather than showing nothing).
const FALLBACK_ORDER = [
  "banner",
  "storeHero",
  "shopByCategory",
  "categoryBanner",
  "featuredSections",
  "adSlot",
  "categoryShowcase",
  "whyChooseUs",
  "dealsOfDay",
  "ctaSection",
  "offersToSayYes",
  "testimonials",
  "shoppableVideo",
].map((key, i) => ({ type: "fixed", key, order: i }));

export default function Home() {
  // Fetch the layout at runtime (client-side) so admin reordering in the
  // dashboard reflects on the live homepage immediately on the next visit —
  // even when the storefront is deployed as a static export, where a
  // build-time fetch would freeze the order until the next rebuild.
  const [layout, setLayout] = useState(FALLBACK_ORDER);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/api/homepage-layout`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && Array.isArray(d.items) && d.items.length) {
          setLayout(d.items);
        }
      })
      .catch(() => {
        // keep the degraded fallback already in state
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const FIXED_MAP = {
    banner: <Banner />,
    // The old Store Hero (mini category-icon row) was retired — this slot now
    // renders a thin, admin-controlled promotional strip instead.
    storeHero: (
      <PromoBanner className="max-w-7xl mx-auto px-4 sm:px-6 mt-2 sm:mt-3 mb-1" />
    ),
    shopByCategory: <ShopByCategory />,
    categoryBanner: <CategoryBanner />,
    adSlot: (
      <AdSlot page="homepage" className="max-w-7xl mx-auto px-2 py-3" />
    ),
    categoryShowcase: <CategoryShowcase />,
    whyChooseUs: (
      <>
        <TypographicHero />
        <WhyChooseUs />
      </>
    ),
    dealsOfDay: <DealsOfDay />,
    ctaSection: <CTASection />,
    offersToSayYes: <OffersToSayYes />,
    testimonials: <Testimonials />,
    // shoppable video carousel — all video-type rows stay grouped here
    shoppableVideo: <ShoppableVideoSection />,
    // only reachable via FALLBACK_ORDER (total API failure) — the live path
    // renders each product carousel individually via FeaturedRow instead
    featuredSections: <FeaturedSections />,
  };

  return (
    <>
      {layout.map((item) =>
        item.type === "featuredRow" ? (
          <FeaturedRow key={item.featuredSectionId} sectionId={item.featuredSectionId} />
        ) : FIXED_MAP[item.key] ? (
          <React.Fragment key={item.key}>{FIXED_MAP[item.key]}</React.Fragment>
        ) : null,
      )}
    </>
  );
}
