"use client";

import Accordion from './Accordion';
import PolicyHeader from './PolicyHeader';
import { useStoreSettings } from '@/components/context/StoreSettingsContext';

const SHIPPING_ICON =
  "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 .001M13 16l2 .001M13 16H9m4 0h2m0 0h2a1 1 0 001-1v-5l-3-4H9";

export default function ShippingAccordion() {
  const { policyContent } = useStoreSettings();
  const items = policyContent?.shipping || [];

  return (
    <div>
      <PolicyHeader
        icon={SHIPPING_ICON}
        title="শিপিং ও ডেলিভারি"
        subtitle="সারাবাংলাদেশে দ্রুত ও নিরাপদ ডেলিভারি"
      />
      {items.length > 0 ? (
        <Accordion items={items} />
      ) : (
        <p className="text-sm text-gray-400">কোনো তথ্য পাওয়া যায়নি।</p>
      )}
    </div>
  );
}
