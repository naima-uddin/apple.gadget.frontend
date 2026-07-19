import PolicyTabs from "@/components/Policy/Sidebar";
import PolicyHeader from "@/components/Policy/PolicyHeader";
import { siteTitle, getStoreName, getPolicyContent } from "@/lib/storeMeta";

const PRIVACY_ICON =
  "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z";

export async function generateMetadata() {
  const [title, storeName] = await Promise.all([
    siteTitle("Privacy Policy"),
    getStoreName(),
  ]);
  return {
    title,
    description: `Read ${storeName}'s privacy policy to understand how we collect, use, and protect your personal information when you shop with us in Bangladesh.`,
  };
}

export default async function PrivacyPage() {
  const [storeName, policyContent] = await Promise.all([
    getStoreName(),
    getPolicyContent(),
  ]);
  const sections = policyContent?.privacy || [];

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 sm:py-16">
      <PolicyTabs />
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
        <PolicyHeader
          icon={PRIVACY_ICON}
          title="গোপনীয়তা নীতি"
          subtitle="আপনার তথ্য সুরক্ষায় আমরা প্রতিশ্রুতিবদ্ধ"
        />

        {sections.length > 0 ? (
          <>
            <p className="text-sm text-[#6B7280] mb-6 leading-relaxed">
              {storeName} আপনার ব্যক্তিগত তথ্য সুরক্ষায় প্রতিশ্রুতিবদ্ধ।
            </p>
            <div className="space-y-6">
              {sections.map((sec, i) => (
                <section key={i} className="border-l-4 border-violet-200 pl-4">
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
