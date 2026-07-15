"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

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

function MuteIcon({ muted }) {
  return muted ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M3 9v6h4l5 5V4L7 9H3z" />
      <path
        d="M16 8l6 8M22 8l-6 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M3 9v6h4l5 5V4L7 9H3z" />
      <path
        d="M16 8a5 5 0 010 8M18.5 5.5a9 9 0 010 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function VideoPlayer({ video, muted, onToggleMute }) {
  if (video.youtubeId) {
    const params = new URLSearchParams({
      autoplay: "1",
      mute: muted ? "1" : "0",
      loop: "1",
      playlist: video.youtubeId, // required for loop=1 to work
      controls: "0",
      playsinline: "1",
      rel: "0",
      modestbranding: "1",
    });
    return (
      <div className="relative w-full h-full">
        <iframe
          key={muted ? "m" : "u"} // remount to apply mute change
          src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?${params}`}
          title="video"
          allow="autoplay; encrypted-media"
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
        <button
          onClick={onToggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
        >
          <MuteIcon muted={muted} />
        </button>
      </div>
    );
  }
  return (
    <div className="relative w-full h-full">
      <video
        src={video.url}
        autoPlay
        muted={muted}
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <button
        onClick={onToggleMute}
        aria-label={muted ? "Unmute" : "Mute"}
        className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
      >
        <MuteIcon muted={muted} />
      </button>
    </div>
  );
}

export default function ShoppableVideoCarousel({ section, lang = "en" }) {
  const videos = section.videos || [];
  const visibleCount = useVisibleCount();
  const [currentIndex, setCurrentIndex] = useState(0);
  // index of the single card allowed to play sound; -1 = all muted
  const [unmutedIdx, setUnmutedIdx] = useState(-1);

  const maxIndex = Math.max(0, videos.length - visibleCount);
  const pct = 100 / visibleCount;
  const centerOffset = Math.floor(visibleCount / 2);

  const go = (dir) => {
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
        {/* Header — small tagline + big title, centered */}
        <div className="text-center mb-6 md:mb-10">
          {subtitle && (
            <p className="text-xs md:text-sm tracking-[0.2em] uppercase text-[#6B7280] mb-2">
              {subtitle}
            </p>
          )}
          <h2 className="text-2xl md:text-3xl font-semibold text-[#1F2937] work-sans">
            {title}
          </h2>
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
          <div className="overflow-hidden py-6">
            <div
              className="flex items-center transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * pct}%)` }}
            >
              {videos.map((video, i) => {
                const isCenter = i === currentIndex + centerOffset;
                return (
                  <div
                    key={i}
                    className="shrink-0 px-2"
                    style={{ width: `${pct}%` }}
                  >
                    <div
                      className={`bg-white border border-gray-100 rounded-xl overflow-hidden transition-all duration-500 ${
                        isCenter
                          ? "scale-105 md:scale-110 shadow-xl z-10 relative"
                          : "shadow-sm"
                      }`}
                    >
                      {/* Portrait video */}
                      <div className="relative w-full aspect-[9/16] bg-black">
                        <VideoPlayer
                          video={video}
                          muted={unmutedIdx !== i}
                          onToggleMute={() =>
                            setUnmutedIdx((prev) => (prev === i ? -1 : i))
                          }
                        />
                      </div>

                      {/* Product footer */}
                      {video.product && (
                        <Link
                          href={`/product/${video.product._id}/`}
                          className="flex items-center gap-3 p-3 hover:bg-violet-50/50 transition"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              video.product.images?.[0]?.url ||
                              "/assets/placeholder.svg"
                            }
                            alt={video.product.title}
                            className="w-10 h-10 object-cover rounded border shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = "/assets/placeholder.svg";
                            }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#1F2937] truncate">
                              {video.product.title}
                            </p>
                            <p className="text-sm text-[#6B7280] mt-0.5">
                              ৳
                              {video.product.price ??
                                video.product.variants?.[0]?.price ??
                                0}
                            </p>
                          </div>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
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
