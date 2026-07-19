"use client";

import React, { useRef } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ProductCard from "@/components/product/ProductCard";
import SectionHeader from "@/components/home/SectionHeader";

export default function RelatedProducts({ products = [] }) {
  const scrollRef = useRef(null);

  if (products.length === 0) return null;

  return (
    <div className="mt-10 relative px-2">
      <SectionHeader
        title={
          <>
            Related <span className="text-[#1D1D1F]">Products</span>
          </>
        }
      />
      {/* carousel container needs relative positioning for absolute arrows */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide  md:mr-3 md:ml-3"
        >
          {products.map((p) => (
            <div key={p._id || p.id} className="shrink-0 w-46">
              <ProductCard
                product={p}
                imageHeight={120}
                imageWidth={200}
                showDiscount={true}
                maxTags={2}
              />
            </div>
          ))}
        </div>

        {/* left arrow positioned over carousel */}
        <button
          onClick={() => {
            if (scrollRef.current)
              scrollRef.current.scrollBy({
                left: -scrollRef.current.offsetWidth,
                behavior: "smooth",
              });
          }}
          className="absolute top-1/2 -left-4 transform -translate-y-1/2 p-1 md:p-2 rounded-full border border-gray-200 bg-white text-[#1D1D1F] shadow-md hover:bg-[#1D1D1F] hover:text-white hover:border-[#1D1D1F] transition-colors z-10"
          aria-label="Scroll related products left"
        >
          <FaChevronLeft className="w-4 h-4" />
        </button>

        {/* right arrow positioned over carousel */}
        <button
          onClick={() => {
            if (scrollRef.current)
              scrollRef.current.scrollBy({
                left: scrollRef.current.offsetWidth,
                behavior: "smooth",
              });
          }}
          className="absolute top-1/2 -right-4 transform -translate-y-1/2 p-1 md:p-2 rounded-full border border-gray-200 bg-white text-[#1D1D1F] shadow-md hover:bg-[#1D1D1F] hover:text-white hover:border-[#1D1D1F] transition-colors z-10"
          aria-label="Scroll related products right"
        >
          <FaChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
