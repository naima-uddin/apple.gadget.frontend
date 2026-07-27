import React from "react";
import Banner from "./Banner";
import ShopByCategory from "./ShopByCategory";
import FeaturedSections from "./FeaturedSections";
import CategoryShowcase from "./CategoryShowcase";
import WhyChooseUs from "./WhyChooseUs";
import DealsOfDay from "./DealsOfDay";
import CTASection from "./CTASection";
import Newsletter from "@/components/layout/Newsletter";
import AdSlot from "@/components/ui/AdSlot";
import OffersToSayYes from "./OffersToSayYes";
import DiscountsManager from "../dashboard/Discount/DiscountsManager";
import ShoppableVideoSection from "./ShoppableVideoSection";

export default function Home() {
  return (
    <>
      <Banner />
      <ShopByCategory />
      <FeaturedSections />
      <AdSlot page="homepage" className="max-w-7xl mx-auto px-2 py-3" />
      <CategoryShowcase />
      <WhyChooseUs />
      <DealsOfDay />
      <CTASection />
      <OffersToSayYes />
      {/* shoppable video carousel — sits right above the footer */}
      <Newsletter />
      <ShoppableVideoSection />
    </>
  );
}
