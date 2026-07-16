"use client";

import { useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
const CACHE_KEY = "custom_code_cfg";
const CACHE_TTL = 5 * 60 * 1000;

let injected = false;

function injectHTML(html, container) {
  if (!html?.trim() || !container) return;
  const tmp = document.createElement("template");
  tmp.innerHTML = html;
  Array.from(tmp.content.childNodes).forEach((node) => {
    let el;
    if (node.nodeName === "SCRIPT") {
      el = document.createElement("script");
      Array.from(node.attributes).forEach((a) => el.setAttribute(a.name, a.value));
      el.textContent = node.textContent;
    } else {
      el = node.cloneNode(true);
    }
    container.appendChild(el);
  });
}

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // storage unavailable
  }
}

// Body-code/footer-code must land inside these two React-owned marker divs
// (rendered in app/layout.js), never appended straight onto document.body —
// Next.js's whole page tree also lives directly under <body>, so a raw
// insertBefore/appendChild there desyncs React's child bookkeeping from the
// real DOM and throws "Failed to execute 'removeChild'" on the next route
// change. document.head isn't part of that reconciled subtree, so it's safe
// to keep injecting header code straight into it (also needed for real
// <meta>/<link> tags to have any effect).
function injectAll(data) {
  injectHTML(data.headerCode, document.head);
  injectHTML(data.bodyCode, document.getElementById("tracking-body-start"));
  injectHTML(data.footerCode, document.getElementById("tracking-body-end"));
}

export default function TrackingCodeInjector() {
  useEffect(() => {
    if (injected) return;
    injected = true;

    const cached = readCache();
    if (cached) {
      injectAll(cached);
      return;
    }

    fetch(`${API}/api/admin/custom-code`)
      .then((r) => r.json())
      .then((data) => {
        writeCache(data);
        injectAll(data);
      })
      .catch(() => {});
  }, []);

  return null;
}
