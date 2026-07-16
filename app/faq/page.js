import PolicySidebar from "@/components/Policy/Sidebar";
import PolicyHeader from "@/components/Policy/PolicyHeader";
import Accordion from "@/components/Policy/Accordion";
import { siteTitle, getStoreName, getPolicyContent } from "@/lib/storeMeta";

const FAQ_ICON =
  "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";

export async function generateMetadata() {
  const [title, storeName] = await Promise.all([
    siteTitle("Frequently Asked Questions"),
    getStoreName(),
  ]);
  return {
    title,
    description: `Get answers to common questions about ordering, shipping, payments, returns, and product authenticity at ${storeName} Bangladesh.`,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "https://pickob.com"}/faq`,
    },
  };
}

export default async function FaqPage() {
  const policyContent = await getPolicyContent();
  const faqs = policyContent?.faq || [];

  const faqSchema = faqs.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      }
    : null;

  return (
    <>
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <main className="max-w-7xl mx-auto px-4 py-10 sm:py-16 grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
        <aside className="md:col-span-1">
          <PolicySidebar />
        </aside>
        <div className="md:col-span-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
          <PolicyHeader
            icon={FAQ_ICON}
            title="সাধারণ জিজ্ঞাসা"
            subtitle="আপনার প্রশ্নের উত্তর এখানে খুঁজুন"
          />
          {faqs.length > 0 ? (
            <Accordion items={faqs} />
          ) : (
            <p className="text-sm text-gray-400">কোনো তথ্য পাওয়া যায়নি।</p>
          )}
        </div>
      </main>
    </>
  );
}
