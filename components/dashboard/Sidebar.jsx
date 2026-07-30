"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/components/context/UserContext";
import { useStoreSettings } from "@/components/context/StoreSettingsContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
const STORAGE_KEY = "Pickob-dashboard-sidebar-collapsed";

import { hasPermission } from "@/lib/permissions";

const SECTION_ICONS = {
  overview: "M3 12h18M3 6h18M3 18h18",
  catalog: "M4 7h16v13H4z M7 3h10v4H7z",
  commerce: "M4 6h16M4 12h16M4 18h16",
  content: "M4 5h16v14H4z M8 9l2 2 3-3 5 5",
  system: "M12 8a4 4 0 100 8 4 4 0 000-8z",
  shipment: "M12 2l3 7h7l-5.5 4.5 2 7L12 16l-5.5 4 2-7L3 9h7z",
};

const SECTIONS = [
  {
    key: "overview",
    label: "Business Overview",
    icon: SECTION_ICONS.overview,
    direct: true,
    permissionKey: "dashboard.view",
    matchPrefixes: ["/dashboard"],
  },
  {
    key: "catalog",
    label: "Products & Stock",
    icon: SECTION_ICONS.catalog,
    permissionKey: "catalog",
    matchPrefixes: [
      "/dashboard/products",
      "/dashboard/product-variants",
      "/dashboard/categories",
      "/dashboard/discounts",
      "/dashboard/tags",
      "/dashboard/barcodes",
      "/dashboard/reviews",
      "/dashboard/rewards",
      "/dashboard/waitlist",
      "/dashboard/inventory",
      "/dashboard/preorders",
      "/dashboard/delivery-charge",
      "/dashboard/packaging-cost",
    ],
    items: [
      {
        key: "products",
        label: "All Products",
        href: "/dashboard/products",
        icon: "M3 7h18v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z",
        permissionKey: "products.view",
      },
      {
        key: "inventory",
        label: "Stock Levels",
        href: "/dashboard/inventory",
        icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
        permissionKey: "products.inventory",
      },
      {
        key: "product-variants",
        label: "Variants & Options",
        href: "/dashboard/product-variants",
        icon: "M4 7h16M4 12h16M4 17h16",
        permissionKey: "products.variants",
      },
      {
        key: "categories",
        label: "Category Tree",
        href: "/dashboard/categories",
        icon: "M3 6h18M3 12h18M3 18h18",
        permissionKey: "products.categories",
      },
      {
        key: "discounts",
        label: "Coupons & Deals",
        href: "/dashboard/discounts",
        icon: "M12 2l4 4-8 8-4-4 8-8z",
        permissionKey: "products.discounts",
      },
      {
        key: "delivery-charge",
        label: "Delivery Charge",
        href: "/dashboard/delivery-charge",
        icon: "M3 3h13v10H3z M16 8h4l3 3v2h-7z M6.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z M18 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
        permissionKey: "products.delivery",
      },
      {
        key: "packaging-cost",
        label: "Packaging Cost",
        href: "/dashboard/packaging-cost",
        icon: "M21 8L12 3 3 8m18 0l-9 5m9-5v9l-9 5m0-9L3 8m9 5v9m-9-9v9l9 5",
        permissionKey: "products.packaging",
      },
      {
        key: "tags",
        label: "Labels & Badges",
        href: "/dashboard/tags",
        icon: "M3 8l7-5 11 8-7 10-11-8z M10 7h.01",
        permissionKey: "products.tags",
      },
      {
        key: "barcodes",
        label: "Barcode Manager",
        href: "/dashboard/barcodes",
        icon: "M3 5h2v14H3z M7 5h1v14H7z M10 5h3v14h-3z M15 5h1v14h-1z M18 5h3v14h-3z",
        permissionKey: "products.barcodes",
      },
      {
        key: "barcode-lookup",
        label: "Quick Lookup",
        href: "/dashboard/barcodes/lookup",
        icon: "M4 7h16v2H4z M4 11h10v2H4z M4 15h16v2H4z",
        permissionKey: "products.barcodes",
      },
      {
        key: "all-reviews",
        label: "Ratings & Reviews",
        href: "/dashboard/reviews",
        icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
        permissionKey: "products.reviews",
      },
      {
        key: "all-rewards",
        label: "Reward Points",
        href: "/dashboard/rewards",
        icon: "M12 2l4 4-8 8-4-4 8-8z",
        permissionKey: "products.rewards",
      },
      {
        key: "all-waitlist",
        label: "Waitlists",
        href: "/dashboard/waitlist",
        icon: "M4 6h16v2H4z M4 12h10v2H4z M4 18h16v2H4z",
        permissionKey: "products.waitlist",
      },
      {
        key: "all-questions",
        label: "Questions & Answers",
        href: "/dashboard/questions/",
        icon: "M4 6h16v2H4z M4 12h10v2H4z M4 18h16v2H4z",
        permissionKey: "products.questions",
      },
      {
        key: "all-preorders",
        label: "All Pre-orders",
        href: "/dashboard/preorders",
        icon: "M12 8v4l3 3 M12 2a10 10 0 100 20 10 10 0 000-20z",
        permissionKey: "products.preorders",
      },
    ],
  },
  {
    key: "orders",
    label: "Sales & Orders",
    icon: SECTION_ICONS.commerce,
    permissionKey: "orders",
    matchPrefixes: ["/dashboard/orders", "/dashboard/orders/order-pick"],
    items: [
      {
        key: "all-orders",
        label: "Order Board",
        href: "/dashboard/orders",
        icon: "M3 3h18v4H3V3z M3 11h18v10H3V11z",
        orderTab: "all-orders",
        permissionKey: "orders.view",
      },
      {
        key: "order-incomplete",
        label: "Incomplete Orders",
        href: "/dashboard/orders?tab=incomplete",
        icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
        orderTab: "incomplete",
        permissionKey: "orders.view",
      },
      {
        key: "order-cancelled",
        label: "Cancelled Orders",
        href: "/dashboard/orders?tab=cancelled",
        icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
        orderTab: "cancelled",
        permissionKey: "orders.view",
      },
      {
        key: "order-returns",
        label: "Refunds & Returns",
        href: "/dashboard/orders?tab=returns",
        icon: "M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6",
        orderTab: "returns",
        permissionKey: "orders.returns",
      },
      {
        key: "order-abandoned-cart",
        label: "Abandoned Carts",
        href: "/dashboard/orders?tab=abandoned-cart",
        icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
        orderTab: "abandoned-cart",
        permissionKey: "orders.abandoned",
      },
      {
        key: "order-abandon-checkout",
        label: "Abandoned Checkouts",
        href: "/dashboard/orders?tab=abandon-checkout",
        icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
        orderTab: "abandon-checkout",
        permissionKey: "orders.abandoned",
      },
      {
        key: "order-wishlist",
        label: "Wishlists",
        href: "/dashboard/orders?tab=all-wishlist",
        icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
        orderTab: "all-wishlist",
        permissionKey: "orders.wishlist",
      },
      {
        key: "order-timeline",
        label: "Activity Timeline",
        href: "/dashboard/orders?tab=timeline",
        icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h4",
        orderTab: "timeline",
        permissionKey: "orders.timeline",
      },
      {
        key: "order-customer-notes",
        label: "Buyer Notes",
        href: "/dashboard/orders?tab=customer-notes",
        icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
        orderTab: "customer-notes",
        permissionKey: "orders.notes",
      },
      {
        key: "order-pick",
        label: "Pick & Pack",
        href: "/dashboard/orders/order-pick",
        icon: "M9 5H7v14h2V5zm4 0h-2v14h2V5zm4 0h-2v14h2V5z",
        permissionKey: "orders.pick",
      },
    ],
  },

  {
    key: "shipment-tracking",
    label: "Delivery & Payments",
    icon: SECTION_ICONS.shipment,
    matchPrefixes: [
      "/dashboard/shipment-tracking",
      "/dashboard/payment-settings",
    ],
    items: [
      {
        key: "shipment-tracking",
        label: "Live Tracking",
        href: "/dashboard/shipment-tracking",
        adminOnly: true,
      },
      {
        key: "shipment-settings",
        label: "Courier Setup",
        href: "/dashboard/shipment-tracking/settings",
        adminOnly: true,
      },
      {
        key: "payment-settings",
        label: "Payment Methods",
        href: "/dashboard/payment-settings",
        icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
        adminOnly: true,
      },
    ],
  },
  {
    key: "customers",
    label: "People",
    icon: SECTION_ICONS.commerce,
    permissionKey: "customers",
    matchPrefixes: ["/dashboard/customers", "/dashboard/customer-tags"],
    items: [
      {
        key: "all-customers",
        label: "Customer List",
        href: "/dashboard/customers",
        icon: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z M4 20c0-2.21 3.58-4 8-4s8 1.79 8 4",
        permissionKey: "customers.view",
      },
      {
        key: "customer-tag",
        label: "Customer Groups",
        href: "/dashboard/customer-tags",
        icon: "M3 8l7-5 11 8-7 10-11-8z M10 7h.01",
        permissionKey: "customers.tags",
      },
    ],
  },
  {
    key: "content",
    label: "Storefront Design",
    icon: SECTION_ICONS.content,
    permissionKey: "content",
    matchPrefixes: [
      "/dashboard/featured",
      "/dashboard/banners",
      "/dashboard/promo-panels",
      "/dashboard/testimonials",
      "/dashboard/category-showcase",
      "/dashboard/deal-of-day",
      "/dashboard/popup",
      "/dashboard/blog",
      "/dashboard/media",
    ],
    items: [
      {
        key: "banners",
        label: "Hero Banners",
        href: "/dashboard/banners",
        icon: "M4 5h16v10H4z M8 18h8",
        permissionKey: "content.banners",
      },
      {
        key: "popup",
        label: "Popup Offers",
        href: "/dashboard/popup",
        icon: "M5 3h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M9 9h6M9 13h4",
        permissionKey: "content.banners",
      },
      {
        key: "promo-panels",
        label: "Promo Blocks",
        href: "/dashboard/promo-panels",
        icon: "M3 3h8v8H3z M13 3h8v4h-8V3z M13 10h8v4h-8v-4z M3 14h8v7H3v-7z",
        permissionKey: "content.promo",
      },
      {
        key: "testimonials",
        label: "Testimonials",
        href: "/dashboard/testimonials",
        icon: "M17 8h2a2 2 0 012 2v4a2 2 0 01-2 2h-1l-3 3v-3H8a2 2 0 01-2-2v-1 M3 3h11v9H9l-3 3v-3H3z",
        permissionKey: "content.promo",
      },
      {
        key: "category-showcase",
        label: "Category Spotlight",
        href: "/dashboard/category-showcase",
        icon: "M3 3h5v18H3V3z M10 3h4v8h-4V3z M16 3h5v18h-5V3z M10 13h4v8h-4v-8z",
        permissionKey: "content.promo",
      },
      {
        key: "deal-of-day",
        label: "Daily Deals",
        href: "/dashboard/deal-of-day",
        icon: "M12 8V4l8 8-8 8v-4H4V8h8z",
        permissionKey: "content.promo",
      },
      {
        key: "featured",
        label: "Featured Rows",
        href: "/dashboard/featured",
        icon: "M3 3h7v7H3V3z M13 3h8v4h-8V3z M13 10h8v4h-8v-4z M13 17h8v4h-8v-4z M3 13h7v8H3v-8z",
        permissionKey: "content.featured",
      },
      {
        key: "blog",
        label: "Blog Posts",
        href: "/dashboard/blog",
        icon: "M4 7h16M4 11h16M8 15h8",
        permissionKey: "content.blog",
      },
      {
        key: "media",
        label: "Media Library",
        href: "/dashboard/media",
        icon: "M4 5h16v14H4z M8 9l2 2 3-3 5 5",
        permissionKey: "content.media",
      },
    ],
  },
  {
    key: "addons",
    label: "Integrations",
    icon: "M12 2a10 10 0 100 20A10 10 0 0012 2zm0 4v4m0 4h.01M8 10h8",
    permissionKey: "addons",
    matchPrefixes: ["/dashboard/addons"],
    items: [
      {
        key: "addons-list",
        label: "All Integrations",
        href: "/dashboard/addons",
        icon: "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z",
        permissionKey: "addons.manage",
      },
      {
        key: "facebook-pixel",
        label: "Facebook Pixel",
        href: "/dashboard/addons/facebook-pixel",
        icon: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z",
        permissionKey: "addons.pixels",
      },
      {
        key: "google-tag-manager",
        label: "Google Tag Manager",
        href: "/dashboard/addons/google-tag-manager",
        icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
        permissionKey: "addons.analytics",
      },
      {
        key: "google-analytics",
        label: "Google Analytics 4",
        href: "/dashboard/addons/google-analytics",
        icon: "M4 20V10l8-8 8 8v10H4z M9 20v-8h6v8",
        permissionKey: "addons.analytics",
      },
      {
        key: "fake-order-protection",
        label: "Fake Order Protection",
        href: "/dashboard/addons/fake-order-protection",
        icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
        permissionKey: "addons.protection",
      },
      {
        key: "tiktok-pixel",
        label: "TikTok Pixel",
        href: "/dashboard/addons/tiktok-pixel",
        icon: "M9 12a4 4 0 100 8 4 4 0 000-8zm0 0V2h4a4 4 0 004 4",
        permissionKey: "addons.pixels",
      },
      {
        key: "google-adsense",
        label: "Google AdSense",
        href: "/dashboard/addons/google-adsense",
        icon: "M12 2a10 10 0 100 20A10 10 0 0012 2zm0 4v12M4 12h16",
        permissionKey: "addons.adsense",
      },
    ],
  },
  {
    key: "profit-margin",
    label: "Insights & Reports",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    matchPrefixes: [
      "/dashboard/profit-margin",
      "/dashboard/most-searched",
      "/dashboard/most-popular",
    ],
    items: [
      {
        key: "profit-margin-link",
        label: "Profit Report",
        href: "/dashboard/profit-margin",
        icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
        permissionKey: "reports.profit",
      },
      {
        key: "most-searched",
        label: "Search Trends",
        href: "/dashboard/most-searched",
        icon: "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z",
        permissionKey: "reports.analytics",
      },
      {
        key: "most-popular",
        label: "Top Products",
        href: "/dashboard/most-popular",
        icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
        permissionKey: "reports.analytics",
      },
    ],
  },
  {
    key: "system",
    label: "Settings & Team",
    icon: SECTION_ICONS.system,
    matchPrefixes: [
      "/dashboard/authorized",
      "/dashboard/settings",
      "/dashboard/policy-pages",
      "/dashboard/code-snippet",
    ],
    items: [
      {
        key: "authorized",
        label: "Team & Roles",
        href: "/dashboard/authorized",
        icon: "M12 8a4 4 0 100 8 4 4 0 000-8z",
        adminOnly: true,
      },
      {
        key: "settings",
        label: "Store Settings",
        href: "/dashboard/settings",
        icon: "M12 8a4 4 0 100 8 4 4 0 000-8z",
        permissionKey: "system.settings",
      },
      {
        key: "policy-pages",
        label: "Policies",
        href: "/dashboard/policy-pages",
        icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
        permissionKey: "system.policies",
      },
      {
        key: "code-snippet",
        label: "Custom Code",
        href: "/dashboard/code-snippet",
        icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
        adminOnly: true,
      },
    ],
  },
];

export default function Sidebar({
  mobileOpen,
  onClose,
  collapsed,
  setCollapsed,
}) {
  const pathname = usePathname() || "/dashboard";
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUser } = useUser();
  const { storeName, logoUrl } = useStoreSettings();

  const [query, setQuery] = useState("");

  const isSectionActive = (section) =>
    section.matchPrefixes.some((prefix) =>
      prefix === "/dashboard"
        ? pathname === "/dashboard"
        : pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

  // Open the group that owns the current route by default
  const [openSections, setOpenSections] = useState(() => {
    const initial = {};
    for (const section of SECTIONS) {
      initial[section.key] = isSectionActive(section);
    }
    return initial;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore storage errors
    }
  }, [collapsed]);

  // When navigating, make sure the group that owns the new route is open
  // (state adjustment during render — avoids a cascading effect re-render)
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    const next = { ...openSections };
    for (const section of SECTIONS) {
      if (isSectionActive(section)) next[section.key] = true;
    }
    setOpenSections(next);
  }

  const handleSignOut = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      // ignore
    }
    await refreshUser();
    router.push("/");
  };

  const isActivePath = (href) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(`${href}/`);

  const toggleSection = (sectionKey) => {
    if (collapsed) {
      setCollapsed(false);
    }
    setOpenSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }));
  };

  const canSee = (item) =>
    (!item.adminOnly || user?.role === "admin") &&
    (!item.permissionKey || hasPermission(user, item.permissionKey));

  const q = query.trim().toLowerCase();
  const searchResults = q
    ? SECTIONS.flatMap((section) => {
        if (
          section.permissionKey &&
          !hasPermission(user, section.permissionKey)
        )
          return [];
        const items = (section.items || []).filter(
          (item) => canSee(item) && item.label.toLowerCase().includes(q),
        );
        // Direct sections (no submenu) are searchable by their own label
        if (
          section.direct &&
          section.matchPrefixes?.[0] &&
          section.label.toLowerCase().includes(q)
        ) {
          items.unshift({
            key: section.key,
            label: section.label,
            href: section.matchPrefixes[0],
            icon: section.icon,
          });
        }
        return items;
      })
    : null;

  const renderLeafLink = (item) => {
    if (!canSee(item)) return null;

    let active;
    if (item.orderTab !== undefined) {
      const currentTab = searchParams?.get("tab") || "all-orders";
      active = pathname === "/dashboard/orders" && currentTab === item.orderTab;
    } else {
      active = isActivePath(item.href);
    }

    return (
      <Link
        key={item.key}
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
          active
            ? "bg-gray-100 font-semibold text-[#1D1D1F]"
            : "text-gray-600 hover:bg-gray-50 hover:text-[#1D1D1F]"
        }`}
      >
        {active && (
          <span
            className="absolute -left-[14px] top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[#1D1D1F]"
            aria-hidden="true"
          />
        )}
        {item.icon ? (
          <svg
            className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-[#1D1D1F]" : "text-gray-400 group-hover:text-[#1D1D1F]"}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d={item.icon} />
          </svg>
        ) : (
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? "bg-[#1D1D1F]" : "bg-gray-300 group-hover:bg-[#1D1D1F]"}`}
            aria-hidden="true"
          />
        )}
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  const renderSection = (section) => {
    if (section.permissionKey && !hasPermission(user, section.permissionKey)) {
      return null;
    }

    const visibleItems = (section.items || []).filter(canSee);
    if (!section.direct && !visibleItems.length) return null;

    const sectionActive = isSectionActive(section);
    const sectionOpen = openSections[section.key];
    const directHref = section.direct
      ? visibleItems[0]?.href || section.matchPrefixes?.[0] || "/dashboard"
      : null;

    // Collapsed rail: one icon tile per group
    if (collapsed) {
      const tileClass = `mx-auto flex h-10 w-10 items-center justify-center rounded-xl transition ${
        sectionActive
          ? "bg-[#1D1D1F] text-white shadow-md shadow-gray-300"
          : "bg-gray-100 text-[#1D1D1F] hover:bg-gray-200"
      }`;
      const tileIcon = (
        <svg
          className="h-4.5 w-4.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d={section.icon} />
        </svg>
      );
      if (directHref) {
        return (
          <Link
            key={section.key}
            href={directHref}
            title={section.label}
            className={tileClass}
          >
            {tileIcon}
          </Link>
        );
      }
      return (
        <button
          key={section.key}
          type="button"
          onClick={() => toggleSection(section.key)}
          title={section.label}
          className={tileClass}
        >
          {tileIcon}
        </button>
      );
    }

    // Direct link: no group/dropdown, the row itself navigates
    if (directHref) {
      return (
        <Link
          key={section.key}
          href={directHref}
          className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 transition ${
            sectionActive ? "bg-gray-100" : "hover:bg-gray-50"
          }`}
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
              sectionActive
                ? "bg-[#1D1D1F] text-white shadow-sm shadow-gray-300"
                : "bg-gray-100 text-[#1D1D1F]"
            }`}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={section.icon} />
            </svg>
          </span>
          <span
            className={`min-w-0 flex-1 truncate text-sm font-semibold ${sectionActive ? "text-[#1D1D1F]" : "text-[#1F2937]"}`}
          >
            {section.label}
          </span>
        </Link>
      );
    }

    return (
      <div key={section.key}>
        <button
          type="button"
          onClick={() => toggleSection(section.key)}
          aria-expanded={sectionOpen}
          className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-gray-50"
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
              sectionActive
                ? "bg-[#1D1D1F] text-white shadow-sm shadow-gray-300"
                : "bg-gray-100 text-[#1D1D1F]"
            }`}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={section.icon} />
            </svg>
          </span>
          <span
            className={`min-w-0 flex-1 truncate text-sm font-semibold ${sectionActive ? "text-[#1D1D1F]" : "text-[#1F2937]"}`}
          >
            {section.label}
          </span>
          <svg
            className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${sectionOpen ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {sectionOpen && (
          <div className="mb-2 ml-6 mt-1 space-y-0.5 border-l-2 border-gray-200 pl-3">
            {visibleItems.map((item) => renderLeafLink(item))}
          </div>
        )}
      </div>
    );
  };

  const initials = (user?.name || user?.email || "A")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity md:hidden ${mobileOpen ? "block" : "hidden"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-65 sm:w-72 transform flex-col border-r border-gray-200 bg-white transition-all duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0 md:w-full ${collapsed ? "md:max-w-19" : "md:max-w-76"} ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Hero card: brand + user */}
        {collapsed ? (
          <div className="flex flex-col items-center gap-2 py-3">
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logoUrl}
                alt={storeName || "Store"}
                className="h-10 w-10 rounded-xl border border-gray-200 bg-white object-contain p-1"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1D1D1F] text-sm font-bold text-white">
                {storeName
                  ? storeName.replace(/\s+/g, "").slice(0, 2).toUpperCase()
                  : "SB"}
              </span>
            )}
            <button
              type="button"
              className="hidden rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-[#1D1D1F] md:inline-flex"
              onClick={() => setCollapsed(false)}
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M7.707 14.707a1 1 0 01-1.414-1.414L8.586 11H3a1 1 0 110-2h5.586L6.293 6.707a1 1 0 011.414-1.414l4.5 4.5a1 1 0 010 1.414l-4.5 4.5z" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="m-3 rounded-2xl bg-linear-to-br from-[#1D1D1F] via-gray-800 to-black p-4 text-white shadow-lg shadow-gray-300">
            <div className="flex items-start justify-between gap-2">
              <Link href="/" className="flex min-w-0 items-center gap-3">
                {logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={logoUrl}
                    alt={storeName || "Store"}
                    className="h-11 w-11 shrink-0 rounded-xl bg-white object-contain p-1"
                  />
                ) : (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 text-base font-bold text-white">
                    {storeName
                      ? storeName.replace(/\s+/g, "").slice(0, 2).toUpperCase()
                      : "SB"}
                  </span>
                )}
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-base font-bold text-white">
                    {storeName || "My Store"}
                  </span>
                  <span className="block text-xs font-medium text-gray-300">
                    Control Center
                  </span>
                </span>
              </Link>
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  className="hidden rounded-lg p-1.5 text-gray-300 transition hover:bg-white/15 hover:text-white md:inline-flex"
                  onClick={() => setCollapsed(true)}
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M12.293 14.707a1 1 0 001.414-1.414L11.414 11H17a1 1 0 100-2h-5.586l2.293-2.293a1 1 0 00-1.414-1.414l-4.5 4.5a1 1 0 000 1.414l4.5 4.5z" />
                  </svg>
                </button>
                <button
                  className="rounded-lg p-1.5 text-gray-300 transition hover:bg-white/15 hover:text-white md:hidden"
                  onClick={onClose}
                  aria-label="Close menu"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-white/15 p-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/25 text-sm font-bold text-white">
                {initials}
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-sm font-semibold text-white">
                  {user?.name || user?.email || "Admin"}
                </span>
                <span className="block truncate text-[11px] capitalize text-gray-300">
                  {user?.role || "admin"}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Menu search */}
        {!collapsed && (
          <div className="mb-2 px-3">
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a menu…"
                className="w-full rounded-full bg-[#d6d5d6] py-2.5 pl-10 pr-9 text-sm text-gray-900 placeholder-gray-600 outline-none transition focus:bg-white focus:ring-2 focus:ring-[#1D1D1F]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1D1D1F]"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav
          className={`no-scrollbar flex-1 overflow-y-auto pb-3 ${collapsed ? "space-y-2 px-2 pt-1" : "space-y-0.5 px-3"}`}
        >
          {searchResults ? (
            <div className="space-y-0.5">
              {searchResults.length ? (
                searchResults.map((item) => renderLeafLink(item))
              ) : (
                <p className="px-3 py-6 text-center text-sm text-gray-500">
                  No menu found for “{query}”
                </p>
              )}
            </div>
          ) : (
            SECTIONS.map(renderSection)
          )}
        </nav>

        {/* Footer actions */}
        <div
          className={`border-t border-gray-100 p-3 ${collapsed ? "flex flex-col items-center gap-2" : "flex items-center gap-2"}`}
        >
          <Link
            href="/"
            title="Visit store"
            className={
              collapsed
                ? "flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-[#1D1D1F] transition hover:bg-gray-200"
                : "flex flex-1 items-center justify-center gap-2 rounded-full border border-gray-300 py-2 text-sm font-medium text-[#1D1D1F] transition hover:border-[#1D1D1F] hover:bg-gray-100"
            }
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 12l9-9 9 9" />
              <path d="M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
            </svg>
            {!collapsed && <span>Visit Store</span>}
          </Link>
          <button
            onClick={handleSignOut}
            title="Sign out"
            aria-label="Sign out"
            className={
              collapsed
                ? "flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100"
                : "flex shrink-0 items-center justify-center rounded-full border border-red-200 p-2.5 text-red-500 transition hover:bg-red-50"
            }
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
              <path d="M13 5v-2a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-2" />
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
}
