"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

// Compact "⋯" overflow menu for table row actions — keeps a busy actions
// column down to one primary button + one trigger instead of a button grid.
export default function RowActionsMenu({ items = [] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (
        menuRef.current?.contains(e.target) ||
        btnRef.current?.contains(e.target)
      )
        return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const btn = btnRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setPos({
        top: rect.bottom + 4,
        left: Math.min(Math.max(8, rect.right - 176), window.innerWidth - 184),
      });
    }
    setOpen(true);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        title="More actions"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-[#1D1D1F]"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="19" cy="12" r="1.75" />
        </svg>
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-100"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div
              ref={menuRef}
              role="menu"
              style={
                pos ? { position: "fixed", top: pos.top, left: pos.left } : undefined
              }
              className="z-101 min-w-44 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 text-sm shadow-xl"
            >
              {items.map((item, idx) =>
                item.divider ? (
                  <div key={`div-${idx}`} className="my-1 border-t border-gray-100" />
                ) : item.href ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 transition-colors ${
                      item.danger
                        ? "text-red-600 hover:bg-red-50"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    disabled={item.disabled}
                    onClick={() => {
                      setOpen(false);
                      item.onClick?.();
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left transition-colors disabled:opacity-40 ${
                      item.danger
                        ? "text-red-600 hover:bg-red-50"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ),
              )}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
