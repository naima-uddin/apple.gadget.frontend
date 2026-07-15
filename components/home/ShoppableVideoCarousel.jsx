"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getDisplayPrice } from "@/lib/pricing";

// How many video cards fit at the current viewport width
function useVisibleCount() {
  const [count, setCount] = useState(2);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1280) setCount(5);
      else if (w >= 1024) setCount(4);
      else if (w >= 768) setCount(3);
      else setCount(2);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return count;
}

function PlayOverlay() {
  return (
    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <span className="w-14 h-14 rounded-full bg-black/80 flex items-center justify-center shadow-lg">
        <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6 ml-0.5">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </span>
  );
}

// One video card: paused by default (thumbnail / first frame + play button),
// click to play with sound, click again to pause.
function VideoPlayer({ video, playing, onToggle }) {
  const videoRef = useRef(null);

  // drive the native <video> element from the `playing` prop
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (playing) {
      el.muted = false;
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [playing]);

  if (video.youtubeId) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-label={playing ? "Pause video" : "Play video"}
        className="absolute inset-0 w-full h-full"
      >
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&mute=0&controls=0&playsinline=1&rel=0&modestbranding=1&loop=1&playlist=${video.youtubeId}`}
            title="video"
            allow="autoplay; encrypted-media"
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <PlayOverlay />
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={playing ? "Pause video" : "Play video"}
      className="absolute inset-0 w-full h-full"
    >
      <video
        ref={videoRef}
        src={video.url}
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {!playing && <PlayOverlay />}
    </button>
  );
}

function ProductMiniCard({ product }) {
  const { price, compareAtPrice: compareAt } = getDisplayPrice(product);
  return (
    <Link
      href={`/product/${product._id}/`}
      className="mt-3 flex items-center gap-3 bg-white border border-gray-100 rounded-xl shadow-sm p-3 hover:shadow-md hover:border-violet-200 transition"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.images?.[0]?.url || "/assets/placeholder.svg"}
        alt={product.title}
        className="w-11 h-11 object-cover rounded-lg border bg-gray-50 shrink-0"
        onError={(e) => {
          e.currentTarget.src = "/assets/placeholder.svg";
        }}
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#1F2937] leading-snug line-clamp-2">
          {product.title}
        </p>
        <p className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-sm font-bold text-[#5B21B6] whitespace-nowrap">
            ৳{price?.toLocaleString()}
          </span>
          {compareAt && compareAt > price && (
            <span className="text-xs text-gray-400 line-through whitespace-nowrap">
              ৳{compareAt?.toLocaleString()}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}

export default function ShoppableVideoCarousel({ section, lang = "en" }) {
  const videos = section.videos || [];
  const visibleCount = useVisibleCount();
  const [currentIndex, setCurrentIndex] = useState(0);
  // index of the single card currently playing; -1 = all paused
  const [playingIdx, setPlayingIdx] = useState(-1);

  const maxIndex = Math.max(0, videos.length - visibleCount);
  const pct = 100 / visibleCount;

  const go = (dir) => {
    setPlayingIdx(-1); // pause when sliding
    setCurrentIndex((prev) => {
      const next = prev + dir;
      if (next < 0) return maxIndex;
      if (next > maxIndex) return 0;
      return next;
    });
  };

  const subtitle =
    lang === "bn" ? section.subtitleBn || section.subtitle : section.subtitle;
  const title = lang === "bn" ? section.titleBn || section.title : section.title;

  if (videos.length === 0) return null;

  return (
    <div className="w-full bg-white py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-2">
        {/* Header — big tagline, smaller title beneath */}
        <div className="text-center mb-6 md:mb-8">
          {subtitle && (
            <p className="text-2xl md:text-3xl font-semibold text-[#1F2937] work-sans">
              {subtitle}
            </p>
          )}
          <h2 className="text-sm md:text-base text-[#6B7280] mt-2">{title}</h2>
        </div>

        <div className="relative">
          {/* Left arrow */}
          {maxIndex > 0 && (
            <button
              onClick={() => go(-1)}
              aria-label="Previous"
              className="absolute left-1 sm:left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white shadow-md rounded-full flex items-center justify-center text-gray-600 hover:bg-[#5B21B6] hover:text-white transition sm:-translate-x-4"
            >
              ‹
            </button>
          )}

          {/* Track */}
          <div className="overflow-hidden">
            <div
              className="flex items-start transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * pct}%)` }}
            >
              {videos.map((video, i) => (
                <div
                  key={i}
                  className="shrink-0 px-2"
                  style={{ width: `${pct}%` }}
                >
                  {/* Portrait video */}
                  <div className="relative w-full aspect-9/16 bg-black rounded-xl overflow-hidden shadow-sm">
                    <VideoPlayer
                      video={video}
                      playing={playingIdx === i}
                      onToggle={() =>
                        setPlayingIdx((prev) => (prev === i ? -1 : i))
                      }
                    />
                  </div>

                  {/* Linked product — separate card below the video */}
                  {video.product && <ProductMiniCard product={video.product} />}
                </div>
              ))}
            </div>
          </div>

          {/* Right arrow */}
          {maxIndex > 0 && (
            <button
              onClick={() => go(1)}
              aria-label="Next"
              className="absolute right-1 sm:right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white shadow-md rounded-full flex items-center justify-center text-gray-600 hover:bg-[#5B21B6] hover:text-white transition sm:translate-x-4"
            >
              ›
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
