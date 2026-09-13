"use client";

import { useEffect } from "react";
import { useStoreSettings } from "@/components/context/StoreSettingsContext";

// The browser-tab favicon <link> is emitted by generateMetadata() at BUILD
// time, so a favicon uploaded later from dashboard/settings never appears on
// the live (statically exported) site until a rebuild. This component reads
// the live faviconUrl from StoreSettingsContext and rewrites the <link rel="icon">
// at runtime so the uploaded favicon shows up immediately.
function iconTypeFromUrl(url) {
  const clean = url.split("?")[0].toLowerCase();
  if (clean.endsWith(".svg")) return "image/svg+xml";
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".ico")) return "image/x-icon";
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
  if (clean.endsWith(".gif")) return "image/gif";
  return undefined;
}

export default function FaviconManager() {
  const { faviconUrl } = useStoreSettings();

  useEffect(() => {
    if (!faviconUrl) return;

    // IMPORTANT: never removeChild() the build-time <link rel="icon"> that
    // generateMetadata() emitted. In React 19 / App Router that node is adopted
    // as a React-managed hoistable, and Next reconciles <head> on every client
    // navigation. Pulling it out with raw DOM leaves React holding a detached
    // node, so the next reconcile runs `parentNode.removeChild()` on a node
    // whose parent is now null → "Cannot read properties of null (reading
    // 'removeChild')" in commitDeletionEffectsOnFiber on every route change.
    //
    // Instead we manage a single link we own (tagged data-favicon-manager) and
    // append it LAST so the browser prefers it over the build-time icon.
    let link = document.querySelector("link[data-favicon-manager]");
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("data-favicon-manager", "");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    const type = iconTypeFromUrl(faviconUrl);
    if (type) link.type = type;
    link.href = faviconUrl;
  }, [faviconUrl]);

  return null;
}
