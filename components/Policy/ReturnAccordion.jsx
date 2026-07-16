"use client";

import Accordion from './Accordion';
import PolicyHeader from './PolicyHeader';
import { useStoreSettings } from '@/components/context/StoreSettingsContext';

const RETURN_ICON = "M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6";

export default function ReturnAccordion() {
  const { policyContent } = useStoreSettings();
  const items = policyContent?.return || [];

  return (
    <div>
      <PolicyHeader
        icon={RETURN_ICON}
        title="রিটার্ন ও রিফান্ড"
        subtitle="সহজ রিটার্ন প্রক্রিয়া ও দ্রুত রিফান্ড"
      />
      {items.length > 0 ? (
        <Accordion items={items} />
      ) : (
        <p className="text-sm text-gray-400">কোনো তথ্য পাওয়া যায়নি।</p>
      )}
    </div>
  );
}
