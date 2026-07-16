import PolicySidebar from "@/components/Policy/Sidebar";
import ReturnAccordion from "@/components/Policy/ReturnAccordion";

import { siteTitle, getStoreName } from "@/lib/storeMeta";

export async function generateMetadata() {
  const [title, storeName] = await Promise.all([
    siteTitle("Return & Replacement Policy"),
    getStoreName(),
  ]);
  return {
    title,
    description: `${storeName}'s hassle-free return and replacement policy. Learn how to return products, get refunds, and replacement timelines for your orders in Bangladesh.`,
  };
}

export default function ReturnsPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-10 sm:py-16 grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
      <aside className="md:col-span-1">
        <PolicySidebar />
      </aside>
      <div className="md:col-span-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
        <ReturnAccordion />
      </div>
    </main>
  );
}
