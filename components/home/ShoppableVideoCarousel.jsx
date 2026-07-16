"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getDisplayPrice } from "@/lib/pricing";
import SectionHeader from "./SectionHeader";

const FOOTER_H = 72; // product footer height inside each card

// Coverflow layout numbers per viewport width:
// cardW = center card width, gap = distance between adjacent card centers,
// maxSide = how many cards are visible on each side of the center.
function useLayout() {
  const [layout, setLayout] = useState({ cardW: 185, gap: 105, maxSide: 1 });
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1280) setLayout({ cardW: 260, gap: 165, maxSide: 3 });
      else if (w >= 1024) setLayout({ cardW: 240, gap: 155, maxSide: 3 });
      else if (w >= 768) setLayout({ cardW: 220, gap: 140, maxSide: 2 });
      else setLayout({ cardW: 185, gap: 105, maxSide: 1 });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return layout;
}

function PlayOverlay() {
  return (
    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <span className="w-12 h-12 rounded-full bg-black/80 flex items-center justify-center shadow-lg">
        <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 ml-0.5">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </span>
  );
}

// Loads the YouTube IFrame Player API once and shares the same promise
// across every card on the page.
let ytApiPromise = null;
function loadYouTubeAPI() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevReady?.();
      resolve(window.YT);
    };
    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  });
  return ytApiPromise;
}

function SoundButton({ muted, onClick }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={muted ? "Unmute" : "Mute"}
      className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-black/80 flex items-center justify-center text-white hover:bg-black transition"
    >
      {muted ? (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M3 10v4h4l5 5V5L7 10H3zm13.6 2 2.7 2.7-1.4 1.4-2.7-2.7-2.7 2.7-1.4-1.4 2.7-2.7-2.7-2.7 1.4-1.4 2.7 2.7 2.7-2.7 1.4 1.4-2.7 2.7z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" />
        </svg>
      )}
    </button>
  );
}

// Uploaded/direct video card. Sits paused on its admin-chosen preview frame
// by default; clicking the (center) card plays it from 0:00.
function UploadedVideoFace({
  video,
  active,
  paused,
  muted,
  onToggleSound,
  onEnded,
}) {
  const videoRef = useRef(null);
  const previewTime = Number(video.previewTime) || 0;
  const playing = active && !paused;

  // Start/stop playback. Runs only when `playing` flips so that toggling
  // mute (below) doesn't restart the video from the beginning.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (playing) {
      el.currentTime = 0; // always start from the beginning, not the preview frame
      el.muted = muted;
      el.play().catch(() => {});
    } else {
      el.pause();
      // park paused cards on the admin-chosen preview frame
      try {
        el.currentTime = previewTime;
      } catch {
        /* metadata not ready yet — onLoadedMetadata handles it */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  // Keep the live mute setting in sync without touching currentTime/play state.
  useEffect(() => {
    const el = videoRef.current;
    if (el && playing) el.muted = muted;
  }, [muted, playing]);

  return (
    <>
      <video
        ref={videoRef}
        src={video.url}
        playsInline
        preload="metadata"
        onEnded={onEnded}
        onLoadedMetadata={(e) => {
          if (!playing) {
            try {
              e.currentTarget.currentTime = previewTime;
            } catch {}
          }
        }}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {!playing && <PlayOverlay />}
      {active && <SoundButton muted={muted} onClick={onToggleSound} />}
    </>
  );
}

// YouTube card, driven by the real IFrame Player API (not a static thumbnail)
// so it can freeze on the admin-chosen preview second while paused, and
// resume playback from 0:00 when the card is turned on.
function YouTubeVideoFace({
  video,
  active,
  paused,
  muted,
  onToggleSound,
  onEnded,
}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const previewTime = Number(video.previewTime) || 0;
  const playing = active && !paused;

  const latest = useRef({ playing, muted, previewTime, onEnded });
  useEffect(() => {
    latest.current = { playing, muted, previewTime, onEnded };
  });

  // Create the player once, destroy it on unmount (i.e. when this card
  // scrolls out of the visible coverflow window).
  useEffect(() => {
    let cancelled = false;
    loadYouTubeAPI().then((YT) => {
      if (cancelled || !YT || !containerRef.current) return;
      playerRef.current = new YT.Player(containerRef.current, {
        videoId: video.youtubeId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          start: Math.floor(latest.current.previewTime) || 0,
        },
        events: {
          onReady: (e) => {
            if (latest.current.playing) {
              e.target.seekTo(0, true);
              latest.current.muted ? e.target.mute() : e.target.unMute();
              e.target.playVideo();
            }
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING && !latest.current.playing) {
              // freeze on the preview frame instead of actually playing
              e.target.pauseVideo();
            } else if (e.data === YT.PlayerState.ENDED) {
              latest.current.onEnded?.();
            }
          },
        },
      });
    });
    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {}
      playerRef.current = null;
    };
  }, [video.youtubeId]);

  // React to play/pause toggles.
  useEffect(() => {
    const p = playerRef.current;
    if (!p || typeof p.playVideo !== "function") return;
    if (playing) {
      p.seekTo(0, true);
      muted ? p.mute() : p.unMute();
      p.playVideo();
    } else {
      p.pauseVideo();
      p.seekTo(previewTime, true);
      p.mute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  // Keep the live mute setting in sync without restarting playback.
  useEffect(() => {
    const p = playerRef.current;
    if (p && playing && typeof p.mute === "function") {
      muted ? p.mute() : p.unMute();
    }
  }, [muted, playing]);

  return (
    <>
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      {!playing && <PlayOverlay />}
      {active && <SoundButton muted={muted} onClick={onToggleSound} />}
    </>
  );
}

function VideoFace(props) {
  return props.video.youtubeId ? (
    <YouTubeVideoFace {...props} />
  ) : (
    <UploadedVideoFace {...props} />
  );
}

// White footer strip inside the card: thumb · category/price · arrow.
function ProductFooter({ product }) {
  if (!product)
    return <div style={{ height: FOOTER_H }} className="bg-white" />;
  const { price, compareAtPrice: compareAt } = getDisplayPrice(product);
  const label =
    product.category && product.category !== "general"
      ? product.category.replace(/\b\w/g, (c) => c.toUpperCase())
      : product.title;
  return (
    <Link
      href={`/product/${product._id}/`}
      onClick={(e) => e.stopPropagation()}
      style={{ height: FOOTER_H }}
      className="flex items-center gap-2.5 bg-white px-3 hover:bg-gray-50 transition"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.images?.[0]?.url || "/assets/placeholder.svg"}
        alt={product.title}
        className="w-9 h-9 object-cover rounded-lg border bg-gray-50 shrink-0"
        onError={(e) => {
          e.currentTarget.src = "/assets/placeholder.svg";
        }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#6B7280] truncate">{label}</p>
        <p className="flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-[#1F2937] whitespace-nowrap">
            ৳{price?.toLocaleString()}
          </span>
          {compareAt && compareAt > price && (
            <span className="text-xs text-gray-400 line-through whitespace-nowrap">
              ৳{compareAt?.toLocaleString()}
            </span>
          )}
        </p>
      </div>
      <span className="w-8 h-8 rounded-full flex items-center justify-center text-[#1F2937] shrink-0 hover:bg-[#5B21B6] hover:text-white transition">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </Link>
  );
}

const AUTOPLAY_MS = 4000;

export default function ShoppableVideoCarousel({ section, lang = "en" }) {
  const videos = section.videos || [];
  const { cardW, gap, maxSide } = useLayout();
  const [center, setCenter] = useState(0);
  const [paused, setPaused] = useState(true); // center card starts paused on its preview frame
  const [muted, setMuted] = useState(true);
  const drag = useRef({ startX: 0, active: false });
  const suppressClick = useRef(false);

  const n = videos.length;
  const cardH = Math.round((cardW * 16) / 9) + FOOTER_H;

  const goTo = (i, keepPlaying = false) => {
    setCenter(((i % n) + n) % n);
    if (!keepPlaying) setPaused(true);
  };

  // Click-and-drag with the mouse, or swipe with a finger — both handled the
  // same way via Pointer Events. A drag past the threshold slides to the
  // next/previous card; anything smaller is treated as a tap on the card.
  const DRAG_THRESHOLD = 40;
  const handlePointerDown = (e) => {
    drag.current = { startX: e.clientX, active: true };
  };
  const endDrag = (e) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > DRAG_THRESHOLD) {
      suppressClick.current = true; // don't also fire the tap handler below
      goTo(center + (dx < 0 ? 1 : -1));
    }
  };

  // Auto-advance like a slider every 4s — but not while the center card is
  // actively playing, so it doesn't yank the video away from someone watching.
  useEffect(() => {
    if (paused === false) return; // a video is actively playing, don't advance
    if (n <= 1) return;
    const id = setInterval(() => {
      setCenter((c) => (c + 1) % n);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, n, center]);

  const heading =
    lang === "bn" ? section.subtitleBn || section.subtitle : section.subtitle;

  if (n === 0) return null;

  return (
    <div className="w-full bg-white py-3 md:py-6 overflow-hidden">
      <div className="max-w-7xl mx-auto px-2">
        {heading && <SectionHeader title={heading} />}
      </div>

      {/* Coverflow stage — drag/swipe with mouse or touch via Pointer Events */}
      <div
        className="relative select-none cursor-grab active:cursor-grabbing touch-pan-y"
        style={{ height: cardH + 24 }}
        onPointerDown={handlePointerDown}
        onPointerUp={endDrag}
        onPointerCancel={() => {
          drag.current.active = false;
        }}
        onDragStart={(e) => e.preventDefault()}
      >
        {videos.map((video, i) => {
          // signed circular distance from the center card
          let off = (((i - center) % n) + n) % n;
          if (off > n / 2) off -= n;
          const abs = Math.abs(off);
          const visible = abs <= maxSide;
          const isCenter = off === 0;

          return (
            <div
              key={i}
              onClick={() => {
                if (suppressClick.current) {
                  suppressClick.current = false;
                  return;
                }
                isCenter ? setPaused((p) => !p) : visible && goTo(i);
              }}
              className="absolute top-1/2 left-1/2 cursor-pointer"
              style={{
                width: cardW,
                transform: `translate(-50%, -50%) translateX(${off * gap}px) scale(${
                  1 - abs * 0.09
                })`,
                zIndex: 50 - abs,
                opacity: visible ? 1 : 0,
                pointerEvents: visible ? "auto" : "none",
                transition:
                  "transform 500ms cubic-bezier(0.33,1,0.68,1), opacity 400ms ease",
              }}
            >
              <div
                className={`bg-white rounded-2xl overflow-hidden ${
                  isCenter
                    ? "shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
                    : "shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
                }`}
              >
                <div className="relative aspect-9/16 bg-black">
                  {/* Only mount players for cards actually in view — avoids
                      spinning up a YouTube/video player for every off-screen card */}
                  {visible && (
                    <VideoFace
                      video={video}
                      active={isCenter}
                      paused={paused}
                      muted={muted}
                      onToggleSound={() => setMuted((m) => !m)}
                      onEnded={() => goTo(center + 1)}
                    />
                  )}
                </div>
                <ProductFooter product={video.product} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
