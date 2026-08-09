import React from "react";
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
import StoreHero from "./StoreHero";
import AllProductsSection from "./AllProductsSection";
import CategoryWiseProducts from "./CategoryWiseProducts";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

// Fallback order used only if the layout API is entirely unreachable — the old
// pre-feature static layout, with all product carousels grouped together
// (rather than showing nothing).
const FALLBACK_ORDER = [
  "banner",
  "storeHero",
  "shopByCategory",
  "featuredSections",
  "adSlot",
  "categoryShowcase",
  "allProducts",
  "categoryWiseProducts",
  "whyChooseUs",
  "dealsOfDay",
  "ctaSection",
  "offersToSayYes",
  "testimonials",
  "shoppableVideo",
].map((key, i) => ({ type: "fixed", key, order: i }));

async function getHomepageLayout() {
  try {
    const r = await fetch(`${API}/api/homepage-layout`, {
      next: { revalidate: 60 },
    });
    const d = await r.json();
    if (Array.isArray(d.items)) return d.items;
  } catch {
    // fall through to the degraded fallback below
  }
  return FALLBACK_ORDER;
}

export default async function Home() {
  const layout = await getHomepageLayout();

  const FIXED_MAP = {
    banner: <Banner />,
    storeHero: (
      <StoreHero className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 sm:mt-10" />
    ),
    shopByCategory: <ShopByCategory />,
    adSlot: (
      <AdSlot page="homepage" className="max-w-7xl mx-auto px-2 py-3" />
    ),
    categoryShowcase: <CategoryShowcase />,
    allProducts: <AllProductsSection />,
    categoryWiseProducts: <CategoryWiseProducts />,
    whyChooseUs: <WhyChooseUs />,
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
