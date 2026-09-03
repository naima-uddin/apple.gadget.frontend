"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { key: "shipping", label: "Shipping & Delivery", href: "/shipping" },
  { key: "returns", label: "Returns & Replacement", href: "/returns" },
  { key: "faq", label: "FAQ", href: "/faq" },
  { key: "privacy", label: "Privacy Policy", href: "/privacy" },
  { key: "terms", label: "Terms & Conditions", href: "/terms" },
  { key: "contact", label: "Contact Us", href: "/contact" },
  { key: "about", label: "About Us", href: "/about" },
];

// next.config.mjs sets trailingSlash: true, so usePathname() returns paths
// like "/shipping/" — strip the trailing slash before comparing hrefs.
function normalize(path) {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

export default function PolicyTabs() {
  const pathname = normalize(usePathname() || "");

  return (
    <nav
      aria-label="Help sections"
      className="no-scrollbar mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-gray-100 bg-white p-2 shadow-sm"
    >
      {items.map((item) => {
        const active = pathname === normalize(item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-[#1D1D1F] text-white shadow-sm shadow-gray-300"
                : "text-[#6B7280] hover:bg-gray-100 hover:text-[#1D1D1F]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
