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
    const host = containerRef.current;
    loadYouTubeAPI().then((YT) => {
      if (cancelled || !YT || !host) return;
      // YT.Player REPLACES the element it's given with an <iframe>. It must
      // never be handed the React-rendered div — React still owns that node
      // and crashes with removeChild NotFoundError when this card unmounts
      // (coverflow auto-advance or route change). Hand it a throwaway child
      // instead; React only tracks the host div, which stays untouched.
      const target = document.createElement("div");
      host.appendChild(target);
      playerRef.current = new YT.Player(target, {
        width: "100%",
        height: "100%",
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
      // Clear whatever YT left inside the host (iframe, or the bare target
      // div if the API never finished loading) so nothing leaks between mounts.
      if (host) {
        while (host.firstChild) host.removeChild(host.firstChild);
      }
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

// Facebook's video plugin supports autoplay/mute via query params, so it's
// mounted like the YouTube face: always present (poster/idle frame showing
// even on side cards), driven by the same active/paused/muted props, with
// pointer-events disabled so clicks fall through to our own PlayOverlay and
// the card's select/recenter handler instead of Facebook's own UI.
function FacebookVideoFace({ video, active, paused, muted, onToggleSound }) {
  const playing = active && !paused;
  // Mute stays forced on while idle so re-renders unrelated to this card's
  // own state (e.g. another card's mute toggle) don't churn its src.
  const effectiveMuted = playing ? muted : true;
  const src = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
    video.facebookUrl,
  )}&show_text=false&autoplay=${playing}&mute=${effectiveMuted}`;
  return (
    <>
      <iframe
        key={`${playing}-${effectiveMuted}`}
        src={src}
        title="Facebook video"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ border: 0 }}
        allow="autoplay; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
      />
      {!playing && <PlayOverlay />}
      {active && <SoundButton muted={muted} onClick={onToggleSound} />}
    </>
  );
}

// A bare `/embed` iframe src gets rejected by Instagram's X-Frame-Options
// for unauthenticated third-party embeds (confirmed: it silently redirects
// to instagram.com's login wall, which then refuses to be framed at all).
// The only reliable public route is Instagram's own widget script, which
// converts a <blockquote> permalink into a real embed itself. Loads once and
// re-processes on every mount (new cards scrolling into view each need it).
let igEmbedPromise = null;
function loadInstagramEmbedScript() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.instgrm?.Embeds) return Promise.resolve(window.instgrm);
  if (igEmbedPromise) return igEmbedPromise;
  igEmbedPromise = new Promise((resolve) => {
    if (document.getElementById("instagram-embed-js")) {
      const wait = () => {
        if (window.instgrm?.Embeds) resolve(window.instgrm);
        else setTimeout(wait, 100);
      };
      wait();
      return;
    }
    const tag = document.createElement("script");
    tag.id = "instagram-embed-js";
    tag.src = "https://www.instagram.com/embed.js";
    tag.async = true;
    tag.onload = () => resolve(window.instgrm);
    document.body.appendChild(tag);
  });
  return igEmbedPromise;
}

// Strips a legacy stored "…/embed" suffix (the old, since-removed format) —
// the widget needs the plain post/reel permalink.
function toInstagramPermalink(raw) {
  return String(raw || "").replace(/\/embed\/?$/i, "/");
}

// Instagram's widget has no query-param or postMessage control at all — it's
// a self-contained mini page with its own play/mute controls, so (unlike the
// other faces) it needs real pointer events to be usable. A click on an
// Instagram card won't bubble up to recenter the carousel; swipe/drag and
// the prev/next controls still work around that. Reels commonly render as a
// "view on Instagram" card rather than an inline player — that's a platform
// restriction, not something this embed can force open; the source badge is
// the fallback path to actually watch it.
function InstagramVideoFace({ video }) {
  const permalink = toInstagramPermalink(video.instagramUrl);

  useEffect(() => {
    let cancelled = false;
    loadInstagramEmbedScript().then((ig) => {
      if (!cancelled) ig?.Embeds.process();
    });
    return () => {
      cancelled = true;
    };
  }, [permalink]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-white flex items-center justify-center">
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={permalink}
        data-instgrm-version="14"
        style={{ margin: 0, width: "100%", minWidth: 0 }}
      />
    </div>
  );
}

function VideoFace(props) {
  const { video } = props;
  if (video.youtubeId) return <YouTubeVideoFace {...props} />;
  if (video.facebookUrl) return <FacebookVideoFace {...props} />;
  if (video.instagramUrl) return <InstagramVideoFace {...props} />;
  return <UploadedVideoFace {...props} />;
}

// Small monochrome marks used only inside SourceBadge — not brand assets,
// just enough shape to tell the three platforms apart at 16px.
function PlatformIcon({ type }) {
  if (type === "youtube") {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M21.6 7.2s-.2-1.5-.8-2.2c-.8-.8-1.7-.8-2.1-.9C15.9 4 12 4 12 4s-3.9 0-6.7.1c-.4 0-1.3.1-2.1.9-.6.7-.8 2.2-.8 2.2S2.2 9 2.2 10.7v1.6c0 1.7.2 3.5.2 3.5s.2 1.5.8 2.2c.8.8 1.9.8 2.3.9 1.7.1 7.2.1 7.2.1s3.9 0 6.7-.1c.4 0 1.3-.1 2.1-.9.6-.7.8-2.2.8-2.2s.2-1.8.2-3.5v-1.6c0-1.7-.2-3.5-.2-3.5zM9.9 14.6V8.9l5.4 2.9-5.4 2.8z" />
      </svg>
    );
  }
  if (type === "facebook") {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M13.5 21v-7.9h2.6l.4-3.1h-3v-2c0-.9.2-1.5 1.6-1.5h1.5V3.8C15.5 3.7 14.5 3.6 13.5 3.6c-2.1 0-3.6 1.3-3.6 3.7v2.7H7.4v3.1h2.5V21h3.6z" />
      </svg>
    );
  }
  // instagram
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Top-left link back to the original post — the only visible sign a card is
// an external embed rather than an uploaded video.
function SourceBadge({ href, type }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      aria-label={`Open on ${type}`}
      className="absolute top-2.5 left-2.5 z-10 w-8 h-8 rounded-full bg-black/80 flex items-center justify-center text-white hover:bg-black transition"
    >
      <PlatformIcon type={type} />
    </a>
  );
}

function getSourceLink(video) {
  if (video.youtubeId) return { type: "youtube", href: `https://youtu.be/${video.youtubeId}` };
  if (video.facebookUrl) return { type: "facebook", href: video.facebookUrl };
  if (video.instagramUrl)
    return { type: "instagram", href: video.instagramUrl.replace(/\/embed$/, "") };
  return null;
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
      <span className="w-8 h-8 rounded-full flex items-center justify-center text-[#1F2937] shrink-0 hover:bg-[#1D1D1F] hover:text-white transition">
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
  const [paused, setPaused] = useState(false); // the center card is always playing unless explicitly paused
  const [muted, setMuted] = useState(true);
  const drag = useRef({ startX: 0, active: false });
  const suppressClick = useRef(false);

  const n = videos.length;
  const cardH = Math.round((cardW * 16) / 9) + FOOTER_H;

  // Whatever becomes the new center — by click, swipe, or auto-advance —
  // starts playing immediately instead of sitting frozen on its preview frame.
  const goTo = (i) => {
    setCenter(((i % n) + n) % n);
    setPaused(false);
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

  // Only kicks in once the visitor has explicitly paused the center card —
  // otherwise it's always playing already, so there's nothing to "advance
  // toward". Nudges to the next card (and resumes playing it) after an idle pause.
  useEffect(() => {
    if (paused === false) return; // a video is actively playing, don't advance
    if (n <= 1) return;
    const id = setInterval(() => {
      setCenter((c) => (c + 1) % n);
      setPaused(false);
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
                zIndex: 30 - abs,
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
                  {visible &&
                    (() => {
                      const source = getSourceLink(video);
                      return (
                        source && <SourceBadge href={source.href} type={source.type} />
                      );
                    })()}
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
