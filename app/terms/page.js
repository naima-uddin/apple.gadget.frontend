import PolicyTabs from "@/components/Policy/Sidebar";
import PolicyHeader from "@/components/Policy/PolicyHeader";
import { siteTitle, getStoreName, getPolicyContent } from "@/lib/storeMeta";

const TERMS_ICON =
  "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";

export async function generateMetadata() {
  const [title, storeName] = await Promise.all([
    siteTitle("Terms & Conditions"),
    getStoreName(),
  ]);
  return {
    title,
    description: `Read ${storeName}'s terms and conditions governing the use of our online store, purchases, and services in Bangladesh.`,
  };
}

export default async function TermsPage() {
  const [storeName, policyContent] = await Promise.all([
    getStoreName(),
    getPolicyContent(),
  ]);
  const sections = policyContent?.terms || [];

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 sm:py-16">
      <PolicyTabs />
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
        <PolicyHeader
          icon={TERMS_ICON}
          title="শর্তাবলী"
          subtitle="সাইট ব্যবহারের আগে অনুগ্রহ করে পড়ুন"
        />

        {sections.length > 0 ? (
          <>
            <p className="text-sm text-[#6B7280] mb-6 leading-relaxed">
              {storeName} ব্যবহার করে আপনি এই শর্তাবলীতে সম্মত হচ্ছেন।
            </p>
            <div className="space-y-6">
              {sections.map((sec, i) => (
                <section key={i} className="border-l-4 border-gray-300 pl-4">
                  <h2 className="text-base font-semibold text-[#1F2937] mb-2">{sec.heading}</h2>
                  <p className="text-sm text-[#6B7280] leading-relaxed whitespace-pre-line">{sec.content}</p>
                </section>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400">কোনো তথ্য পাওয়া যায়নি।</p>
        )}
      </div>
    </main>
  );
}
