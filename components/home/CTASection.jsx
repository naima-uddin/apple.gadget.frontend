"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

// Cayenne-style CTA: soft violet text card on the left, image on the right.
// Content comes from the first active Promo Panel (dashboard → Promo Panels Banner).
export default function CTASection() {
  const [panel, setPanel] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/promo-panels`)
      .then((r) => r.json())
      .then((d) => {
        const active = (d.items || []).find((p) => p.isActive && p.title);
        setPanel(active || null);
      })
      .catch(() => setPanel(null));
  }, []);

  if (!panel) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-stretch">
        {/* Text card */}
        <div className="bg-violet-50 rounded-3xl flex flex-col items-center justify-center text-center px-8 py-14 md:py-0 min-h-60">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-[#1F2937] text-balance mb-2">
            {panel.title}
          </h2>
          {panel.subtitle && (
            <p className="text-sm text-[#6B7280] leading-relaxed mb-5 max-w-sm">
              {panel.subtitle}
            </p>
          )}
          {panel.buttonText && panel.buttonLink && (
            <Link
              href={panel.buttonLink}
              className="inline-block bg-[#5B21B6] hover:bg-[#4C1D95] text-white text-xs md:text-sm font-semibold px-7 py-2.5 rounded-full transition"
            >
              {panel.buttonText}
            </Link>
          )}
        </div>

        {/* Image */}
        {panel.image?.url && (
          <div className="relative rounded-3xl overflow-hidden min-h-60 md:min-h-72 bg-[#F5F6F7]">
            <Image
              src={panel.image.url}
              alt={panel.title || "Promo"}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        )}
      </div>
    </section>
  );
}
