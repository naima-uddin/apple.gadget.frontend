import PolicyTabs from "@/components/Policy/Sidebar";
import ShippingAccordion from "@/components/Policy/ShippingAccordion";

import { siteTitle, getStoreName } from "@/lib/storeMeta";

export async function generateMetadata() {
  const [title, storeName] = await Promise.all([
    siteTitle("Shipping Policy"),
    getStoreName(),
  ]);
  return {
    title,
    description: `Learn about ${storeName}'s delivery times, shipping charges, and areas we serve across Bangladesh.`,
  };
}

export default function ShippingPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10 sm:py-16">
      <PolicyTabs />
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
        <ShippingAccordion />
      </div>
    </main>
  );
}
