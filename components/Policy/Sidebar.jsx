"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { key: "shipping", label: "শিপিং ও ডেলিভারি", href: "/shipping" },
  { key: "returns", label: "রিটার্ন ও রিপ্লেসমেন্ট", href: "/returns" },
  { key: "faq", label: "সাধারণ জিজ্ঞাসা", href: "/faq" },
  { key: "privacy", label: "গোপনীয়তা নীতি", href: "/privacy" },
  { key: "terms", label: "শর্তাবলী", href: "/terms" },
  { key: "contact", label: "যোগাযোগ করুন", href: "/contact" },
  { key: "about", label: "আমাদের সম্পর্কে", href: "/about" },
];

export default function PolicyTabs() {
  const pathname = usePathname() || "";

  return (
    <nav
      aria-label="সহায়তা বিভাগ"
      className="no-scrollbar mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-gray-100 bg-white p-2 shadow-sm"
    >
      {items.map((item) => {
        const active = pathname === item.href;
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
