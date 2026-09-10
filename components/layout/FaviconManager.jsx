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

    // Remove any existing icon links (build-time and prior runtime ones).
    document
      .querySelectorAll('link[rel~="icon"]')
      .forEach((el) => el.parentNode?.removeChild(el));

    const link = document.createElement("link");
    link.rel = "icon";
    const type = iconTypeFromUrl(faviconUrl);
    if (type) link.type = type;
    link.href = faviconUrl;
    document.head.appendChild(link);
  }, [faviconUrl]);

  return null;
}
