"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/components/context/LanguageContext";
import ShoppableVideoCarousel from "./ShoppableVideoCarousel";

// Fetches the same admin-managed "featured" list as FeaturedSections, but
// only renders the video-type entries — placed near the footer instead of
// among the product carousels.
export default function ShoppableVideoSection() {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
  const { lang } = useLanguage();
  const [sections, setSections] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/featured`)
      .then((r) => r.json())
      .then((b) =>
        setSections(
          (b.items || []).filter(
            (s) => s.type === "video" && s.videos && s.videos.length > 0,
          ),
        ),
      )
      .catch(() => setSections([]))
      .finally(() => setLoaded(true));
  }, [API]);

  if (!loaded || sections.length === 0) return null;

  return (
    <section className="w-full space-y-6 md:space-y-8 bg-white">
      {sections.map((sec) => (
        <ShoppableVideoCarousel key={sec._id} section={sec} lang={lang} />
      ))}
    </section>
  );
}
