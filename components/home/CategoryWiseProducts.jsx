"use client";

import React, { useState, useEffect } from "react";
import { useCategories } from "@/components/context/CategoryContext";
import { useLanguage } from "@/components/context/LanguageContext";
import SectionHeader from "./SectionHeader";
import { FeaturedSlider } from "./FeaturedSections";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
const PRODUCTS_PER_ROW = 15;

// One carousel row per top-level category, with "best_seller"-badged
// products (same convention as CategoryPageClient's best-selling strip)
// pinned to the front, topped up with the rest of the category's products.
// Subcategory products count under their main category.
function CategoryRow({ category }) {
  const { t, lang } = useLanguage();
  const { getSubcategories } = useCategories();
  const [products, setProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const collectIds = (id) => {
      const ids = [id];
      getSubcategories(id).forEach((child) => ids.push(...collectIds(child._id)));
      return ids;
    };
    const categoryIds = collectIds(category._id).join(",");

    const load = async () => {
      try {
        const [bestJson, restJson] = await Promise.all([
          fetch(
            `${API}/api/products?categoryId=${categoryIds}&badge=best_seller&limit=${PRODUCTS_PER_ROW}`,
          ).then((r) => r.json()),
          fetch(
            `${API}/api/products?categoryId=${categoryIds}&limit=${PRODUCTS_PER_ROW}`,
          ).then((r) => r.json()),
        ]);
        const best = bestJson.items || [];
        const bestIds = new Set(best.map((p) => p._id));
        const rest = (restJson.items || []).filter((p) => !bestIds.has(p._id));
        setProducts([...best, ...rest].slice(0, PRODUCTS_PER_ROW));
      } catch {
        setProducts([]);
      } finally {
        setLoaded(true);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category._id]);

  if (!loaded || products.length === 0) return null;

  const slug = category.slug || (category.name || "").replace(/\s+/g, "-");
  const name = lang === "bn" ? category.nameBn || category.name : category.name;

  return (
    <div className="w-full bg-[#f7f5ff] py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-2">
        <SectionHeader
          title={name}
          seeMoreHref={`/category/${slug}/`}
          seeMoreLabel={t("home.see_more")}
        />
        <FeaturedSlider products={products} />
      </div>
    </div>
  );
}

// Auto-generated below AllProductsSection: every active top-level category
// with products gets its own best-selling-first carousel row.
export default function CategoryWiseProducts() {
  const { getMainCategories, loading } = useCategories();
  const categories = getMainCategories();

  if (loading || categories.length === 0) return null;

  return (
    <section className="w-full py-4 space-y-6 md:space-y-8 bg-white">
      {categories.map((cat) => (
        <CategoryRow key={cat._id} category={cat} />
      ))}
    </section>
  );
}
