import PolicyTabs from "@/components/Policy/Sidebar";
import { siteTitle, getStoreName, getAboutContent } from "@/lib/storeMeta";

export async function generateMetadata() {
  const [title, storeName] = await Promise.all([
    siteTitle("About Us"),
    getStoreName(),
  ]);
  return {
    title,
    description: `${storeName} brings you curated gadgets and electronics with fast shipping across Bangladesh.`,
    openGraph: {
      title: `About ${storeName} — Online Shopping Bangladesh`,
      description: `Learn about ${storeName} — your one-stop destination for authentic gadgets & electronics in Bangladesh.`,
      type: "website",
    },
  };
}

const FEATURES = [
  {
    title: "Authentic Products",
    desc: "Every product is sourced directly from authorized suppliers — 100% genuine, no exceptions.",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    title: "Fast Delivery",
    desc: "Nationwide shipping with reliable courier partners, so your order reaches you quickly.",
    icon: "M3 9h13v10H3z M16 9l4 0 0 5M16 14l4 0 M5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z M18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  },
  {
    title: "Secure Payment",
    desc: "Multiple safe payment options including cash on delivery, cards, and mobile banking.",
    icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  },
  {
    title: "Dedicated Support",
    desc: "A support team ready to help before and after your purchase, whenever you need it.",
    icon: "M21 10a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7H9v3l-4-4 4-4v3h4a4.5 4.5 0 004.5-4.5V6a4.5 4.5 0 00-4.5-4.5H5",
  },
];

const STATS = [
  { value: "10K+", label: "Happy Customers" },
  { value: "500+", label: "Products Listed" },
  { value: "64", label: "Districts Served" },
  { value: "4.8/5", label: "Average Rating" },
];

function FeatureIcon({ path }) {
  return (
    <svg
      className="h-6 w-6"
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

export default async function AboutPage() {
  const [storeName, aboutContent] = await Promise.all([
    getStoreName(),
    getAboutContent(),
  ]);

  const heroTitle = aboutContent?.hero?.title || `About ${storeName}`;
  const heroDescription =
    aboutContent?.hero?.description ||
    `${storeName} brings you curated gadgets and electronics with fast shipping and reliable customer service. We believe everyone deserves access to quality tech at budget-friendly prices.`;

  const features = aboutContent?.features?.length
    ? aboutContent.features.map((f, i) => ({
        title: f.title,
        desc: f.desc,
        icon: FEATURES[i % FEATURES.length].icon,
      }))
    : FEATURES;

  const stats = aboutContent?.stats?.length ? aboutContent.stats : STATS;

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 sm:py-16">
      <PolicyTabs />

      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#1D1D1F] via-gray-800 to-gray-700 p-8 text-white shadow-lg shadow-gray-300 sm:p-12">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-14 -left-10 h-36 w-36 rounded-full bg-white/10"
            aria-hidden="true"
          />
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-300">
            Our Story
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{heroTitle}</h1>
          <p className="mt-3 max-w-xl text-sm text-gray-100 sm:text-base">
            {heroDescription}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-[#1F2937]">Why Shop With Us</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Founded with a passion for technology, {storeName} is your one-stop
            destination for smartphones, accessories, and smart gadget essentials.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {features.map((f, i) => (
              <div
                key={f.title || i}
                className="flex gap-3 rounded-xl border border-gray-100 p-4 transition hover:border-gray-300 hover:bg-gray-100/40"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-[#1D1D1F]">
                  <FeatureIcon path={f.icon} />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-[#1F2937]">{f.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label || i}
              className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm"
            >
              <p className="text-xl font-bold text-[#1D1D1F] sm:text-2xl">{s.value}</p>
              <p className="mt-1 text-[11px] text-[#6B7280] sm:text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
