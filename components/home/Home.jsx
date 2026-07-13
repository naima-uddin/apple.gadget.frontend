import React from "react";
import Banner from "./Banner";
import ShopByCategory from "./ShopByCategory";
import FeaturedSections from "./FeaturedSections";
import WhyChooseUs from "./WhyChooseUs";
import CTASection from "./CTASection";
import AdSlot from "@/components/ui/AdSlot";

export default function Home() {
  return (
    <>
      <Banner />
      <ShopByCategory />
      <FeaturedSections />
      <AdSlot page="homepage" className="max-w-7xl mx-auto px-2 py-3" />
      <WhyChooseUs />
      <CTASection />
    </>
  );
}
