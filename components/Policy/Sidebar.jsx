"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONS = {
  shipping:
    "M3 9h13v10H3z M16 9l4 0 0 5M16 14l4 0 M5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z M18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  returns:
    "M3 3v5h5 M21 21v-5h-5 M4 10a9 9 0 0116 0 M20 14a9 9 0 01-16 0",
  faq: "M8 10h.01M12 16h.01M16 10h.01M12 4a9 9 0 100 18 9 9 0 000-18z",
  privacy:
    "M12 11c0-3.866-3.582-7-8-7v14c4.418 0 8-3.134 8-7z M12 11c0 3.866 3.582 7 8 7V4c-4.418 0-8 3.134-8 7z",
  terms:
    "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v13a2 2 0 01-2 2z M14 3v5h5",
  contact:
    "M21 10a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7H9v3l-4-4 4-4v3h4a4.5 4.5 0 004.5-4.5V6a4.5 4.5 0 00-4.5-4.5H5",
  about: "M12 22a10 10 0 100-20 10 10 0 000 20z M12 16v-4 M12 8h.01",
};

function NavIcon({ path, className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

const items = [
  { key: "shipping", label: "শিপিং ও ডেলিভারি", href: "/shipping" },
  { key: "returns", label: "রিটার্ন ও রিপ্লেসমেন্ট", href: "/returns" },
  { key: "faq", label: "সাধারণ জিজ্ঞাসা", href: "/faq" },
  { key: "privacy", label: "গোপনীয়তা নীতি", href: "/privacy" },
  { key: "terms", label: "শর্তাবলী", href: "/terms" },
  { key: "contact", label: "যোগাযোগ করুন", href: "/contact" },
  { key: "about", label: "আমাদের সম্পর্কে", href: "/about" },
];

export default function PolicySidebar() {
  const pathname = usePathname() || "";

  return (
    <aside className="rounded-2xl border border-gray-100 bg-white shadow-sm lg:sticky lg:top-24">
      <div className="relative overflow-hidden rounded-t-2xl bg-linear-to-br from-[#5B21B6] via-violet-700 to-purple-600 p-5 text-white">
        <div
          className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-8 -left-6 h-20 w-20 rounded-full bg-white/10"
          aria-hidden="true"
        />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-200">
          সহায়তা কেন্দ্র
        </p>
        <h2 className="mt-1 text-lg font-bold">আপনাকে কীভাবে সাহায্য করতে পারি?</h2>
      </div>

      <nav className="no-scrollbar flex gap-1.5 overflow-x-auto p-3 lg:block lg:space-y-1 lg:overflow-visible">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`group relative flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors lg:w-full ${
                active
                  ? "bg-violet-50 font-semibold text-[#5B21B6]"
                  : "text-[#6B7280] hover:bg-gray-50 hover:text-[#5B21B6]"
              }`}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 hidden h-5 w-0.75 -translate-y-1/2 rounded-full bg-[#5B21B6] lg:block"
                  aria-hidden="true"
                />
              )}
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                  active
                    ? "bg-[#5B21B6] text-white shadow-sm shadow-violet-200"
                    : "bg-violet-50 text-[#5B21B6] group-hover:bg-violet-100"
                }`}
              >
                <NavIcon path={ICONS[item.key]} />
              </span>
              <span className="whitespace-nowrap lg:whitespace-normal">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
