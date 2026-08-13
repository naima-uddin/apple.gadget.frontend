"use client";

import { useState } from "react";

const normalizeBlocks = (value) => {
  if (Array.isArray(value) && value.length > 0) return value;
  if (typeof value === "string" && value.trim())
    return [{ id: "legacy", type: "text", content: value, align: "left" }];
  return [];
};

/* Side-by-side image row: grid on desktop, one-at-a-time carousel on mobile */
function ImageRow({ block, onPreview }) {
  const imgs = (block.images || []).filter((img) => img?.url);
  const [current, setCurrent] = useState(0);

  if (!imgs.length) return null;

  const cols = block.cols || imgs.length;
  const gridClass =
    cols <= 1
      ? "sm:grid-cols-1"
      : cols === 2
        ? "sm:grid-cols-2"
        : cols === 3
          ? "sm:grid-cols-3"
          : "sm:grid-cols-4";

  const total = imgs.length;
  const go = (dir) => setCurrent((prev) => (prev + dir + total) % total);

  return (
    <div className="py-1">
      {/* Desktop / tablet: full grid */}
      <div className={`hidden sm:grid gap-1 ${gridClass}`}>
        {imgs.map((img, idx) => (
          <div
            key={idx}
            className="h-64 overflow-hidden cursor-zoom-in"
            onClick={() => onPreview(img.url)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.alt || ""}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Mobile: one image + arrows */}
      <div className="sm:hidden relative">
        <div
          className="w-full overflow-hidden cursor-zoom-in"
          onClick={() => onPreview(imgs[current].url)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgs[current].url}
            alt={imgs[current].alt || ""}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 text-white text-xl leading-none hover:bg-black/70"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 text-white text-xl leading-none hover:bg-black/70"
            >
              ›
            </button>

            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {imgs.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Go to image ${idx + 1}`}
                  onClick={() => setCurrent(idx)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === current ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function DetailedDescriptionRenderer({ value }) {
  const blocks = normalizeBlocks(value);
  const [previewUrl, setPreviewUrl] = useState(null);

  if (!blocks.length) return null;

  return (
    <>
      <section className="w-full bg-white">
        {blocks.map((block, i) => {
          /* ── Text block ── */
          if (block.type === "text") {
            const align =
              block.align === "center"
                ? "text-center"
                : block.align === "right"
                  ? "text-right"
                  : "text-left";
            return (
              <div key={block.id || i} className="max-w-7xl mx-auto px-4 py-8">
                <div
                  className={`prose prose-base max-w-none text-gray-700 ${align}
                    [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mb-4
                    [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mb-3
                    [&_h3]:text-xl  [&_h3]:font-semibold [&_h3]:text-gray-800 [&_h3]:mb-2
                    [&_p]:mb-3 [&_p]:leading-relaxed
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
                    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1
                    [&_strong]:font-semibold [&_em]:italic
                    [&_a]:text-[#1D1D1F] [&_a]:underline [&_a:hover]:text-black`}
                  dangerouslySetInnerHTML={{ __html: block.content || "" }}
                />
              </div>
            );
          }

          /* ── Full-width image ── */
          if (block.type === "image" && block.url) {
            return (
              <div
                key={block.id || i}
                className="w-full py-1 cursor-zoom-in"
                onClick={() => setPreviewUrl(block.url)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.url}
                  alt={block.alt || ""}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
            );
          }

          /* ── Side-by-side images ── */
          if (block.type === "image-row") {
            return (
              <ImageRow
                key={block.id || i}
                block={block}
                onPreview={setPreviewUrl}
              />
            );
          }

          return null;
        })}
      </section>

      {/* Lightbox */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl leading-none hover:text-gray-300"
            onClick={() => setPreviewUrl(null)}
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt=""
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
