"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/components/context/LanguageContext";
import SectionHeader from "./SectionHeader";
import { FeaturedSlider } from "./FeaturedSections";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
const PRODUCTS_LIMIT = 15;

// Carousel preview of the full catalog, shown above CategoryWiseProducts.
// "See more" links through to the full filterable /products page.
export default function AllProductsSection() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/products?limit=${PRODUCTS_LIMIT}&sort=newest`)
      .then((r) => r.json())
      .then((d) => setProducts(d.items || []))
      .catch(() => setProducts([]))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || products.length === 0) return null;

  return (
    <div className="w-full bg-[#f7f5ff] py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-2">
        <SectionHeader
          title={t("home.all_products")}
          seeMoreHref="/products"
          seeMoreLabel={t("home.see_more")}
        />
        <FeaturedSlider products={products} />
      </div>
    </div>
  );
}
