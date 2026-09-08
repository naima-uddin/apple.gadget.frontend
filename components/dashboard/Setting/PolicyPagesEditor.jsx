"use client";

import React, { useEffect, useState } from "react";
import MediaPicker from "@/components/dashboard/MediaPicker";
import { uploadAdminImage } from "@/lib/uploadImage";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

const TABS = [
  { key: "shipping", label: "Shipping", type: "qa", icon: "🚚" },
  { key: "return", label: "Return", type: "qa", icon: "↩️" },
  { key: "faq", label: "FAQ", type: "qa", icon: "❓" },
  { key: "privacy", label: "Privacy", type: "section", icon: "🔒" },
  { key: "terms", label: "Terms", type: "section", icon: "📄" },
  { key: "footer", label: "Footer", type: "footer", icon: "🦶" },
  { key: "contact", label: "Contact", type: "contact", icon: "📞" },
  { key: "about", label: "About Us", type: "about", icon: "ℹ️" },
];

const POLICY_KEYS = ["shipping", "return", "faq", "privacy", "terms"];

const EMPTY_FOOTER_INFO = { phone: "", email: "", address: "" };
const EMPTY_FOOTER_LOGO = {};
const EMPTY_CONTACT_INFO = { phone: "", email: "", address: "" };
const EMPTY_FOOTER_LINKS = { quickLinks: [], customerService: [] };
const EMPTY_ABOUT = {
  hero: { title: "", description: "" },
  features: [],
  stats: [],
};

const SOCIAL_PLATFORMS = [
  { key: "facebook", label: "Facebook", color: "#1877F2", placeholder: "https://facebook.com/yourpage" },
  { key: "instagram", label: "Instagram", color: "#E1306C", placeholder: "https://instagram.com/yourprofile" },
  { key: "twitter", label: "Twitter / X", color: "#000000", placeholder: "https://twitter.com/yourhandle" },
  { key: "tiktok", label: "TikTok", color: "#010101", placeholder: "https://tiktok.com/@yourprofile" },
  { key: "youtube", label: "YouTube", color: "#FF0000", placeholder: "https://youtube.com/@yourchannel" },
];

/* ───────────── Default content ───────────── */
const DEFAULT_CONTENT = {
  shipping: [
    {
      question: "Is free shipping available?",
      answer:
        "Yes! On purchases of ৳1599 or more, you get completely free delivery nationwide.",
    },
    {
      question: "What is the delivery charge?",
      answer:
        "For any order under ৳1599, a flat ৳69 delivery charge applies — both inside and outside Dhaka.",
    },
    {
      question: "How long does delivery take in Dhaka?",
      answer:
        "Within Dhaka and Chattogram, delivery is usually made within 1–2 working days.",
    },
    {
      question: "How long does delivery take outside Dhaka?",
      answer:
        "Delivery is made nationwide within 3–5 working days. Slight delays may occur during strikes or natural disasters.",
    },
    {
      question: "Can I pay with bKash / Nagad / Rocket?",
      answer:
        "Yes! We support all mobile banking services including bKash, Nagad and Rocket. You can also pay with credit/debit cards.",
    },
    {
      question: "Is Cash on Delivery (COD) available?",
      answer:
        "Yes! You have the option to pay after receiving the product. With COD, inspect the product and pay once you're satisfied.",
    },
    {
      question: "How do I track my delivery?",
      answer:
        "Once your order ships, a tracking number is sent to your phone via SMS and email. You can track your parcel with it.",
    },
    {
      question: "Can I change the delivery address?",
      answer:
        "Yes, but you must contact customer care within 2 hours of placing the order. Once the shipment is dispatched, the address cannot be changed.",
    },
    {
      question: "What happens if a delivery is missed?",
      answer:
        "Our delivery agent will call you. If we can't reach you, delivery will be reattempted the next working day. After 3 consecutive misses, the order will be cancelled and the refund process started.",
    },
    {
      question: "Can I collect products from a Pickup Point?",
      answer:
        "Yes! If you choose the 'Click & Collect' option while ordering, you can collect the product from our point without any delivery charge.",
    },
    {
      question: "Do you offer international delivery?",
      answer: "No, we currently deliver only within Bangladesh.",
    },
    {
      question: "How are products packed?",
      answer:
        "Every product is packed in a sturdy cardboard box along with an invoice. Fragile items are protected with extra bubble wrap.",
    },
  ],
  return: [
    {
      question: "Within how many days can a product be returned?",
      answer:
        "You must apply for a return within 3 days (72 hours) of receiving the product. Returns will not be accepted after that.",
    },
    {
      question: "In which cases can a product be returned?",
      answer:
        "A product can be returned for the following reasons:\n• Defective or damaged product\n• Wrong product delivered\n• Damaged packaging\n• Product does not match the advertisement",
    },
    {
      question: "Which products cannot be returned?",
      answer:
        "The following products cannot be returned:\n• Used or seal-broken products\n• Digital products and software\n• Customized products\n• Innerwear and hygiene products\n• Food items",
    },
    {
      question: "How do I make a return?",
      answer:
        "To make a return:\n1. Call our customer care\n2. Report the issue with photos or a video of the product\n3. Our team will contact you within 24 hours",
    },
    {
      question: "Is there a pick-up facility in Dhaka?",
      answer:
        "Yes! For defective products within Dhaka, our agent will pick up from your home free of charge. From outside Dhaka, you'll need to send it by courier.",
    },
    {
      question: "Is the product checked after a return?",
      answer:
        "Yes, our QC team verifies the product after receiving it. If a defect is confirmed, a replacement or full refund will be provided.",
    },
    {
      question: "How long until I get my refund?",
      answer:
        "After the product is verified, the refund is issued within 7–10 working days — to bKash, Nagad or the card you paid with.",
    },
    {
      question: "What is the return charge?",
      answer:
        "For defective products the return charge is completely free. For returns due to a customer mistake (wrong size, change of mind), the customer bears the courier charge.",
    },
    {
      question: "What should I do if I find a problem right after delivery?",
      answer:
        "Record a video while opening the package. As soon as you notice a problem, report it to our customer care within 3 days with photos/video.",
    },
  ],
  faq: [
    {
      question: "How do I track my order?",
      answer:
        "When your order ships, a tracking number is sent to your phone via SMS and email. You can also see the real-time status from 'My Orders'.",
    },
    {
      question: "Can I cancel an order?",
      answer:
        "An order can be cancelled within 1 hour of placing it. After processing begins, cancellation is not possible. Contact customer care to cancel.",
    },
    {
      question: "Are the products genuine and good quality?",
      answer:
        "Yes. We source products only from authorized distributors and verified suppliers. Every product passes a quality control check.",
    },
    {
      question: "Is there a warranty?",
      answer:
        "Selected products carry the brand's official warranty. Warranty details are provided on the product page.",
    },
    {
      question: "Where can I find discount or coupon codes?",
      answer:
        "We regularly post offers on our Facebook page and website promo banners. Subscribe to the newsletter for exclusive deals.",
    },
    {
      question: "Can I order without creating an account?",
      answer:
        "Yes, you can order as a guest. However, creating an account makes order tracking, returns and future orders much easier.",
    },
    {
      question: "Is payment secure?",
      answer:
        "Yes, all our payments are processed securely with SSL encryption. Your card or mobile banking details are never stored on our servers.",
    },
    {
      question: "What should I do if a product is out of stock?",
      answer:
        "Click the 'Notify Me' button — you'll be notified by SMS/email as soon as it's back in stock.",
    },
    {
      question: "What are the customer care hours?",
      answer:
        "Our customer care is available from 10 AM to 8 PM (except Fridays), 6 days a week.",
    },
  ],
  privacy: [
    {
      heading: "What information we collect",
      content:
        "When you create an account or place an order, we collect your name, phone number, email, delivery address and order history. We also collect usage data (page visits, clicks) to improve the site.",
    },
    {
      heading: "How your information is used",
      content:
        "Your information is used to process orders, ensure delivery and provide customer support. We never sell your personal information to third parties.",
    },
    {
      heading: "Cookies policy",
      content:
        "We use essential cookies to store login sessions and preferences. Analytics cookies are used only with your consent.",
    },
    {
      heading: "Data security",
      content:
        "All your information is protected with SSL encryption technology. Our servers undergo regular security audits. Payment information is never stored on our servers.",
    },
    {
      heading: "Your rights",
      content:
        "You can contact our support team at any time to request to view, correct or delete your personal information.",
    },
    {
      heading: "Notice of changes",
      content:
        "If any changes are made to this privacy policy, you will be notified on the website and via your registered email.",
    },
  ],
  terms: [
    {
      heading: "Terms of site use",
      content:
        "To use AppleBD BD you must be at least 18 years old. You agree not to access or misuse the site in any unauthorized manner.",
    },
    {
      heading: "Orders and pricing",
      content:
        "All prices are set in Bangladeshi Taka (BDT). In case of a pricing error or unusual circumstances, we reserve the right to cancel any order. The final price is fixed after order confirmation.",
    },
    {
      heading: "Payment policy",
      content:
        "We accept bKash, Nagad, Rocket, credit/debit cards and Cash on Delivery (COD). All payments are processed through secure encryption.",
    },
    {
      heading: "Delivery and returns",
      content:
        "Details about delivery and returns are provided on our Shipping Policy and Return Policy pages. Those policies are considered part of these terms.",
    },
    {
      heading: "Intellectual property",
      content:
        "All content on this site — logos, images, text — is owned by AppleBD BD. Reproduction or commercial use without written permission is prohibited.",
    },
    {
      heading: "Limitation of liability",
      content:
        "AppleBD BD is not liable for any indirect or incidental damages arising from use of the site or products purchased. We are not responsible for delivery delays caused by third-party courier services.",
    },
    {
      heading: "Changes to terms",
      content:
        "We reserve the right to change these terms at any time. If you continue to use the site after changes, you are deemed to have accepted the new terms.",
    },
  ],
};
/* ─────────────────────────────────────────────────── */

const INPUT =
  "w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-300";

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function ImageAssetField({
  label,
  desc,
  value,
  uploading,
  status,
  onUpload,
  onPickFromMedia,
  onDelete,
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-600 mb-2">{label}</p>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-28 h-14 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
          {value?.url ? (
            <img
              src={value.url}
              alt={label}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <span className="text-xs text-gray-300">Empty</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="px-3 py-1.5 border border-gray-200 text-gray-700 rounded-xl text-xs cursor-pointer bg-white hover:bg-gray-50 transition-colors">
            {uploading ? "Uploading…" : "Upload"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
                e.target.value = "";
              }}
            />
          </label>
          <button
            type="button"
            onClick={onPickFromMedia}
            className="px-3 py-1.5 border border-gray-200 text-gray-700 rounded-xl text-xs bg-white hover:bg-gray-50 transition-colors"
          >
            From Media
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="px-3 py-1.5 border border-red-200 rounded-lg text-xs text-red-600 bg-white hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-gray-400">
        {status === "saving" && <span className="text-blue-500">Saving…</span>}
        {status === "saved" && <span className="text-green-600">Saved!</span>}
        {status && status !== "saving" && status !== "saved" && (
          <span className="text-red-500">Error: {status}</span>
        )}
        {!status && (desc || "Changes apply to the website immediately after saving.")}
      </p>
    </div>
  );
}

function QAEditor({ items, onChange }) {
  const add = () => onChange([...items, { question: "", answer: "" }]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i, field, value) =>
    onChange(
      items.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)),
    );

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div
          key={i}
          className="border border-gray-200 rounded-xl p-4 bg-gray-50 relative"
        >
          <span className="absolute top-3 left-3 text-xs text-gray-400 font-mono">
            #{i + 1}
          </span>
          <button
            type="button"
            onClick={() => remove(i)}
            className="absolute top-3 right-3 text-red-400 hover:text-red-600 text-xs"
          >
            ✕ Delete
          </button>
          <div className="mt-4 space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Question
              </label>
              <input
                value={item.question}
                onChange={(e) => update(i, "question", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                placeholder="Write a question…"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Answer
              </label>
              <textarea
                value={item.answer}
                onChange={(e) => update(i, "answer", e.target.value)}
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-y"
                placeholder="Write an answer…"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-800 rounded-xl py-3 text-sm transition"
      >
        + Add new question
      </button>
    </div>
  );
}

function SectionEditor({ items, onChange }) {
  const add = () => onChange([...items, { heading: "", content: "" }]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i, field, value) =>
    onChange(
      items.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)),
    );

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div
          key={i}
          className="border border-gray-200 rounded-xl p-4 bg-gray-50 relative"
        >
          <span className="absolute top-3 left-3 text-xs text-gray-400 font-mono">
            #{i + 1}
          </span>
          <button
            type="button"
            onClick={() => remove(i)}
            className="absolute top-3 right-3 text-red-400 hover:text-red-600 text-xs"
          >
            ✕ Delete
          </button>
          <div className="mt-4 space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Heading
              </label>
              <input
                value={item.heading}
                onChange={(e) => update(i, "heading", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                placeholder="Write the section heading…"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Content
              </label>
              <textarea
                value={item.content}
                onChange={(e) => update(i, "content", e.target.value)}
                rows={5}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-y"
                placeholder="Write the content…"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-800 rounded-xl py-3 text-sm transition"
      >
        + Add new section
      </button>
    </div>
  );
}

const DEFAULT_FOOTER_COLUMNS = [
  {
    title: "Company",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Product",
    links: [
      { label: "My Account", href: "/user/profile" },
      { label: "Cart", href: "/cart" },
      { label: "Wishlist", href: "/user/wishlist" },
      { label: "Shop", href: "/products" },
    ],
  },
];

function FooterEditor({
  footerInfo,
  socialLinks,
  footerLinks,
  footerColumns,
  footerBrand,
  footerLogo,
  logoUploading,
  logoStatus,
  onLogoUpload,
  onPickLogo,
  onDeleteLogo,
  onChange,
}) {
  const setInfo = (key, val) =>
    onChange({ footerInfo: { ...footerInfo, [key]: val } });

  const brand = footerBrand || {};
  const setBrand = (key, val) =>
    onChange({ footerBrand: { ...brand, [key]: val } });

  const bottomLinks = Array.isArray(brand.bottomLinks) ? brand.bottomLinks : [];
  const setBottomLinks = (next) =>
    onChange({ footerBrand: { ...brand, bottomLinks: next } });

  const setSocial = (platform, field, val) =>
    onChange({
      socialLinks: {
        ...socialLinks,
        [platform]: { ...(socialLinks?.[platform] || {}), [field]: val },
      },
    });

  const columns = Array.isArray(footerColumns) ? footerColumns : [];
  const setColumns = (updater) =>
    onChange({
      footerColumns:
        typeof updater === "function" ? updater(columns) : updater,
    });
  // Update a single link inside a column
  const setColLink = (ci, li, patch) =>
    setColumns((prev) =>
      prev.map((col, i) =>
        i === ci
          ? {
              ...col,
              links: (col.links || []).map((l, j) =>
                j === li ? { ...l, ...patch } : l,
              ),
            }
          : col,
      ),
    );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Footer Brand Block (centered)</p>
        <p className="text-[11px] text-gray-400 mb-3">
          The centered headline, tagline and call-to-action buttons. Leave a field
          empty to use the site's built-in default; empty a button label to hide it.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Headline">
            <input
              value={brand.headline || ""}
              onChange={(e) => setBrand("headline", e.target.value)}
              className={INPUT}
              placeholder="Premium Apple Products"
            />
          </Field>
          <Field label="Tagline">
            <input
              value={brand.tagline || ""}
              onChange={(e) => setBrand("tagline", e.target.value)}
              className={INPUT}
              placeholder="Short description under the headline"
            />
          </Field>
          <Field label="Primary button — label">
            <input
              value={brand.primaryCtaLabel || ""}
              onChange={(e) => setBrand("primaryCtaLabel", e.target.value)}
              className={INPUT}
              placeholder="Shop Now"
            />
          </Field>
          <Field label="Primary button — link">
            <input
              value={brand.primaryCtaLink || ""}
              onChange={(e) => setBrand("primaryCtaLink", e.target.value)}
              className={INPUT}
              placeholder="/products"
            />
          </Field>
          <Field label="Account button — label (logged-in users)">
            <input
              value={brand.accountCtaLabel || ""}
              onChange={(e) => setBrand("accountCtaLabel", e.target.value)}
              className={INPUT}
              placeholder="My Account"
            />
          </Field>
          <Field label="Account button — link">
            <input
              value={brand.accountCtaLink || ""}
              onChange={(e) => setBrand("accountCtaLink", e.target.value)}
              className={INPUT}
              placeholder="/user/profile"
            />
          </Field>
          <Field label="Login button — label (logged-out users)">
            <input
              value={brand.loginCtaLabel || ""}
              onChange={(e) => setBrand("loginCtaLabel", e.target.value)}
              className={INPUT}
              placeholder="Login / Register"
            />
          </Field>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Section Headings</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Contact column title">
            <input
              value={brand.contactTitle || ""}
              onChange={(e) => setBrand("contactTitle", e.target.value)}
              className={INPUT}
              placeholder="Contact"
            />
          </Field>
          <Field label="Quick-links column title">
            <input
              value={brand.quickLinksTitle || ""}
              onChange={(e) => setBrand("quickLinksTitle", e.target.value)}
              className={INPUT}
              placeholder="Quick Links"
            />
          </Field>
          <Field label="Social links label">
            <input
              value={brand.followUsLabel || ""}
              onChange={(e) => setBrand("followUsLabel", e.target.value)}
              className={INPUT}
              placeholder="Follow Us"
            />
          </Field>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Bottom Bar</p>
        <Field label="Copyright text — use {year} for the current year">
          <input
            value={brand.copyright || ""}
            onChange={(e) => setBrand("copyright", e.target.value)}
            className={INPUT}
            placeholder="© {year} AppleBD. All rights reserved."
          />
        </Field>
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-600">Bottom legal links</p>
            <button
              type="button"
              onClick={() => setBottomLinks([...bottomLinks, { label: "", href: "" }])}
              className="flex items-center gap-1 text-xs px-2.5 py-1 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add link
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mb-2">
            If empty, the site shows the default Privacy Policy and Terms links.
          </p>
          <div className="space-y-1.5">
            {bottomLinks.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <input
                  value={item.label || ""}
                  onChange={(e) =>
                    setBottomLinks(
                      bottomLinks.map((l, j) => (j === i ? { ...l, label: e.target.value } : l)),
                    )
                  }
                  placeholder="Label"
                  className="w-32 border border-gray-200 px-2 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-100 bg-white"
                />
                <input
                  value={item.href || ""}
                  onChange={(e) =>
                    setBottomLinks(
                      bottomLinks.map((l, j) => (j === i ? { ...l, href: e.target.value } : l)),
                    )
                  }
                  placeholder="/privacy"
                  className="flex-1 border border-gray-200 px-2 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-100 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setBottomLinks(bottomLinks.filter((_, j) => j !== i))}
                  className="p-1.5 text-red-400 hover:text-red-600 border border-red-100 rounded-lg hover:bg-red-50 bg-white"
                  title="Delete link"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Footer Logo</p>
        <ImageAssetField
          label="Footer Logo"
          desc="If you don't set a separate logo, the website's main logo will be shown in the footer."
          value={footerLogo}
          uploading={logoUploading}
          status={logoStatus}
          onUpload={onLogoUpload}
          onPickFromMedia={onPickLogo}
          onDelete={onDeleteLogo}
        />
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Footer — Contact Information</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone Number">
            <input
              value={footerInfo?.phone || ""}
              onChange={(e) => setInfo("phone", e.target.value)}
              className={INPUT}
              placeholder="+880 1700-000000"
            />
          </Field>
          <Field label="Email">
            <input
              value={footerInfo?.email || ""}
              onChange={(e) => setInfo("email", e.target.value)}
              className={INPUT}
              placeholder="info@example.com"
            />
          </Field>
          <Field label="Address">
            <input
              value={footerInfo?.address || ""}
              onChange={(e) => setInfo("address", e.target.value)}
              className={`${INPUT} sm:col-span-2`}
              placeholder="Mirpur, Dhaka-1216, Bangladesh"
            />
          </Field>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Social Media Links</p>
        <div className="space-y-2">
          {SOCIAL_PLATFORMS.map(({ key, label, color, placeholder }) => {
            const link = socialLinks?.[key] || {};
            return (
              <div
                key={key}
                className="flex items-center gap-3 px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50"
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs font-medium text-gray-700 w-20 shrink-0">
                  {label}
                </span>
                <input
                  type="url"
                  value={link.url || ""}
                  onChange={(e) => setSocial(key, "url", e.target.value)}
                  className="flex-1 border border-gray-200 px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-300 bg-white"
                  placeholder={placeholder}
                />
                <label className="flex items-center gap-1.5 text-xs cursor-pointer shrink-0 text-gray-600">
                  <input
                    type="checkbox"
                    checked={link.enabled !== false}
                    onChange={(e) => setSocial(key, "enabled", e.target.checked)}
                    className="w-3.5 h-3.5 accent-gray-800"
                  />
                  Show
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold text-gray-700">Footer Navigation Columns</p>
          <button
            type="button"
            onClick={() =>
              setColumns((prev) => [...prev, { title: "", links: [{ label: "", href: "" }] }])
            }
            className="flex items-center gap-1 text-xs px-2.5 py-1 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add column
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mb-3">
          Set each column's title (e.g. Company, Product) and the links under it here.
          If there are no columns, the website shows the default Company / Product columns.
        </p>

        {columns.length === 0 ? (
          <div className="py-6 text-center border border-dashed border-gray-200 rounded-lg">
            <p className="text-[11px] text-gray-400 italic mb-2">No custom columns</p>
            <button
              type="button"
              onClick={() => setColumns(DEFAULT_FOOTER_COLUMNS)}
              className="text-xs px-3 py-1.5 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Start with default columns
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {columns.map((col, ci) => {
              const links = col?.links || [];
              return (
                <div key={ci} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <input
                      value={col?.title || ""}
                      onChange={(e) =>
                        setColumns((prev) =>
                          prev.map((c, i) => (i === ci ? { ...c, title: e.target.value } : c)),
                        )
                      }
                      placeholder="Column title"
                      className="flex-1 border border-gray-300 px-2 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-gray-100 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setColumns((prev) => prev.filter((_, i) => i !== ci))}
                      className="p-1.5 text-red-400 hover:text-red-600 border border-red-100 rounded-lg hover:bg-red-50 bg-white"
                      title="Delete column"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {links.map((item, li) => (
                      <div key={li} className="flex items-center gap-1.5">
                        <input
                          value={item.label}
                          onChange={(e) => setColLink(ci, li, { label: e.target.value })}
                          placeholder="Label"
                          className="w-24 border border-gray-200 px-2 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-100 bg-white"
                        />
                        <input
                          value={item.href}
                          onChange={(e) => setColLink(ci, li, { href: e.target.value })}
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (val && !val.startsWith("/") && !val.startsWith("http://") && !val.startsWith("https://")) {
                              setColLink(ci, li, { href: `/${val}` });
                            }
                          }}
                          placeholder="/path"
                          className="flex-1 border border-gray-200 px-2 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-100 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setColumns((prev) =>
                              prev.map((c, i) =>
                                i === ci
                                  ? { ...c, links: (c.links || []).filter((_, j) => j !== li) }
                                  : c,
                              ),
                            )
                          }
                          className="p-1.5 text-red-400 hover:text-red-600 border border-red-100 rounded-lg hover:bg-red-50 bg-white"
                          title="Delete link"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4h6v2" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setColumns((prev) =>
                        prev.map((c, i) =>
                          i === ci
                            ? { ...c, links: [...(c.links || []), { label: "", href: "" }] }
                            : c,
                        ),
                      )
                    }
                    className="mt-2 flex items-center gap-1 text-xs px-2.5 py-1 bg-white text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add link
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ContactEditor({ contactInfo, onChange }) {
  const setInfo = (key, val) =>
    onChange({ contactInfo: { ...contactInfo, [key]: val } });

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-2">
        Contact information shown on the Contact Us page
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Phone Number">
          <input
            value={contactInfo?.phone || ""}
            onChange={(e) => setInfo("phone", e.target.value)}
            className={INPUT}
            placeholder="+880 1700-000000"
          />
        </Field>
        <Field label="Email">
          <input
            value={contactInfo?.email || ""}
            onChange={(e) => setInfo("email", e.target.value)}
            className={INPUT}
            placeholder="support@example.com"
          />
        </Field>
        <Field label="Address">
          <input
            value={contactInfo?.address || ""}
            onChange={(e) => setInfo("address", e.target.value)}
            className={`${INPUT} sm:col-span-2`}
            placeholder="Mirpur, Dhaka-1216, Bangladesh"
          />
        </Field>
      </div>
    </div>
  );
}

function AboutEditor({ aboutContent, onChange }) {
  const hero = aboutContent?.hero || {};
  const features = aboutContent?.features?.length
    ? aboutContent.features
    : [{ title: "", desc: "" }, { title: "", desc: "" }, { title: "", desc: "" }, { title: "", desc: "" }];
  const stats = aboutContent?.stats?.length
    ? aboutContent.stats
    : [{ value: "", label: "" }, { value: "", label: "" }, { value: "", label: "" }, { value: "", label: "" }];

  const setHero = (key, val) =>
    onChange({ aboutContent: { ...aboutContent, hero: { ...hero, [key]: val } } });

  const setFeature = (i, key, val) =>
    onChange({
      aboutContent: {
        ...aboutContent,
        features: features.map((f, idx) => (idx === i ? { ...f, [key]: val } : f)),
      },
    });

  const setStat = (i, key, val) =>
    onChange({
      aboutContent: {
        ...aboutContent,
        stats: stats.map((s, idx) => (idx === i ? { ...s, [key]: val } : s)),
      },
    });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Hero Section</p>
        <div className="space-y-3">
          <Field label="Title">
            <input
              value={hero.title || ""}
              onChange={(e) => setHero("title", e.target.value)}
              className={INPUT}
              placeholder="About Our Store"
            />
          </Field>
          <Field label="Description">
            <textarea
              value={hero.description || ""}
              onChange={(e) => setHero("description", e.target.value)}
              rows={3}
              className={`${INPUT} resize-y`}
              placeholder="Write a short description about our store…"
            />
          </Field>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">
          Why Shop With Us — 4 features
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map((f, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-3 bg-gray-50">
              <p className="text-[11px] font-mono text-gray-400 mb-1.5">#{i + 1}</p>
              <input
                value={f.title || ""}
                onChange={(e) => setFeature(i, "title", e.target.value)}
                className={`${INPUT} mb-2`}
                placeholder="Feature title"
              />
              <textarea
                value={f.desc || ""}
                onChange={(e) => setFeature(i, "desc", e.target.value)}
                rows={2}
                className={`${INPUT} resize-y`}
                placeholder="Feature description"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Statistics — 4 numbers</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-3 bg-gray-50">
              <p className="text-[11px] font-mono text-gray-400 mb-1.5">#{i + 1}</p>
              <input
                value={s.value || ""}
                onChange={(e) => setStat(i, "value", e.target.value)}
                className={`${INPUT} mb-2`}
                placeholder="10K+"
              />
              <input
                value={s.label || ""}
                onChange={(e) => setStat(i, "label", e.target.value)}
                className={INPUT}
                placeholder="Happy Customers"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PolicyPagesEditor() {
  const [activeTab, setActiveTab] = useState("shipping");
  const [policyContent, setPolicyContent] = useState({
    shipping: [],
    return: [],
    faq: [],
    privacy: [],
    terms: [],
  });
  const [footerInfo, setFooterInfo] = useState(EMPTY_FOOTER_INFO);
  const [contactInfo, setContactInfo] = useState(EMPTY_CONTACT_INFO);
  const [socialLinks, setSocialLinks] = useState({});
  const [footerLinks, setFooterLinks] = useState(EMPTY_FOOTER_LINKS);
  const [footerColumns, setFooterColumns] = useState([]);
  const [footerBrand, setFooterBrand] = useState({});
  const [footerLogo, setFooterLogo] = useState(EMPTY_FOOTER_LOGO);
  const [aboutContent, setAboutContent] = useState(EMPTY_ABOUT);

  const [logoUploading, setLogoUploading] = useState(false);
  const [showLogoPicker, setShowLogoPicker] = useState(false);
  const [logoStatus, setLogoStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch(`${API}/api/admin/settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => {
        const s = b.settings || {};
        const pc = s.policyContent || {};
        setPolicyContent({
          shipping: pc.shipping || [],
          return: pc.return || [],
          faq: pc.faq || [],
          privacy: pc.privacy || [],
          terms: pc.terms || [],
        });
        setFooterInfo(s.footerInfo || EMPTY_FOOTER_INFO);
        setContactInfo(s.contactInfo || EMPTY_CONTACT_INFO);
        setSocialLinks(s.socialLinks || {});
        setFooterLinks(s.footerLinks || EMPTY_FOOTER_LINKS);
        setFooterColumns(Array.isArray(s.footerColumns) ? s.footerColumns : []);
        setFooterBrand(s.footerBrand || {});
        setFooterLogo(s.footerLogo || EMPTY_FOOTER_LOGO);
        setAboutContent(s.aboutContent || EMPTY_ABOUT);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const putPolicy = async (payload) => {
    setSaving(true);
    try {
      const resp = await fetch(`${API}/api/admin/settings/policy`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error((await resp.json()).error || "Save failed");
      showToast("✅ Saved!");
    } catch (err) {
      alert(err.message || "There was a problem saving");
    } finally {
      setSaving(false);
    }
  };

  const saveFooterLogo = async (logo, setStatus) => {
    setStatus("saving");
    try {
      const resp = await fetch(`${API}/api/admin/settings/policy`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ footerLogo: logo }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || "Save failed");
      }
      setStatus("saved");
      setTimeout(() => setStatus(""), 2500);
    } catch (err) {
      setStatus(err.message || "error");
    }
  };

  const handleLogoUpload = async (file) => {
    if (!file) return;
    setLogoUploading(true);
    try {
      const b = await uploadAdminImage(file, "applebd/settings");
      const asset = b.asset || {};
      setFooterLogo(asset);
      await saveFooterLogo(asset, setLogoStatus);
    } catch (err) {
      alert(err.message || "Upload failed");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleDeleteLogo = async () => {
    setFooterLogo({});
    await saveFooterLogo({}, setLogoStatus);
  };

  const handleQuickSetup = async () => {
    if (
      !confirm(
        "Default content will be added to all tabs and saved. Existing content will be erased. Are you sure?",
      )
    )
      return;
    setPolicyContent(DEFAULT_CONTENT);
    await putPolicy({ policyContent: DEFAULT_CONTENT });
  };

  const handleSave = () => {
    if (activeTab === "footer") {
      return putPolicy({ footerInfo, socialLinks, footerLinks, footerColumns, footerBrand, footerLogo });
    }
    if (activeTab === "contact") {
      return putPolicy({ contactInfo });
    }
    if (activeTab === "about") {
      return putPolicy({ aboutContent });
    }
    return putPolicy({ policyContent });
  };

  const handleChange = (key, value) =>
    setPolicyContent((prev) => ({ ...prev, [key]: value }));

  const handleLoadTabDefault = () => {
    if (
      !confirm(
        `Default content will be loaded into the "${TABS.find((t) => t.key === activeTab)?.label}" tab. Are you sure?`,
      )
    )
      return;
    setPolicyContent((prev) => ({
      ...prev,
      [activeTab]: DEFAULT_CONTENT[activeTab],
    }));
    showToast("Default content loaded — please save");
  };

  if (loading)
    return (
      <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
    );

  const activeTabConfig = TABS.find((t) => t.key === activeTab);
  const totalItems = POLICY_KEYS.reduce(
    (s, k) => s + (policyContent[k]?.length || 0),
    0,
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Quick Setup banner — shown when DB is empty */}
      {totalItems === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-amber-800">
              No content added yet
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Clicking the button below will save default content to all policy
              pages at once.
            </p>
          </div>
          <button
            onClick={handleQuickSetup}
            disabled={saving}
            className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
          >
            {saving ? "Saving…" : "⚡ Quick Setup — Add all content"}
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Policy Pages Editor
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Edit all the site's policy and content pages from the Dashboard
            </p>
          </div>
          <div className="flex items-center gap-3">
            {toast && (
              <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                {toast}
              </span>
            )}
            {POLICY_KEYS.includes(activeTab) && (
              <button
                onClick={handleQuickSetup}
                disabled={saving}
                className="px-3 py-1.5 text-xs border border-amber-300 text-amber-700 hover:bg-amber-50 rounded-lg transition disabled:opacity-60"
              >
                ⚡ Quick Setup
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-gray-800 hover:bg-[#1D1D1F] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 border-b border-gray-100 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition border-b-2 ${
                activeTab === tab.key
                  ? "border-gray-500 text-[#1D1D1F] bg-gray-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.icon} {tab.label}
              {POLICY_KEYS.includes(tab.key) && (
                <span className="ml-1.5 text-xs text-gray-400">
                  ({(policyContent[tab.key] || []).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Editor body */}
        <div className="p-6">
          {POLICY_KEYS.includes(activeTab) && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {activeTabConfig?.icon} {activeTabConfig?.label} page
                </span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">
                  /
                  {activeTab === "faq"
                    ? "faq"
                    : activeTab === "shipping"
                      ? "shipping"
                      : activeTab === "return"
                        ? "returns"
                        : activeTab}
                </span>
              </div>
              <button
                onClick={handleLoadTabDefault}
                className="text-xs text-gray-800 hover:text-[#1D1D1F] border border-gray-300 hover:bg-gray-50 px-3 py-1 rounded-lg transition"
              >
                Load default content into this tab
              </button>
            </div>
          )}

          {activeTabConfig?.type === "qa" && (
            <QAEditor
              items={policyContent[activeTab] || []}
              onChange={(val) => handleChange(activeTab, val)}
            />
          )}
          {activeTabConfig?.type === "section" && (
            <SectionEditor
              items={policyContent[activeTab] || []}
              onChange={(val) => handleChange(activeTab, val)}
            />
          )}
          {activeTabConfig?.type === "footer" && (
            <FooterEditor
              footerInfo={footerInfo}
              socialLinks={socialLinks}
              footerLinks={footerLinks}
              footerColumns={footerColumns}
              footerBrand={footerBrand}
              footerLogo={footerLogo}
              logoUploading={logoUploading}
              logoStatus={logoStatus}
              onLogoUpload={handleLogoUpload}
              onPickLogo={() => setShowLogoPicker(true)}
              onDeleteLogo={handleDeleteLogo}
              onChange={(patch) => {
                if (patch.footerInfo) setFooterInfo(patch.footerInfo);
                if (patch.socialLinks) setSocialLinks(patch.socialLinks);
                if (patch.footerLinks) setFooterLinks(patch.footerLinks);
                if (patch.footerColumns) setFooterColumns(patch.footerColumns);
                if (patch.footerBrand) setFooterBrand(patch.footerBrand);
              }}
            />
          )}
          {activeTabConfig?.type === "contact" && (
            <ContactEditor
              contactInfo={contactInfo}
              onChange={(patch) => {
                if (patch.contactInfo) setContactInfo(patch.contactInfo);
              }}
            />
          )}
          {activeTabConfig?.type === "about" && (
            <AboutEditor
              aboutContent={aboutContent}
              onChange={(patch) => {
                if (patch.aboutContent) setAboutContent(patch.aboutContent);
              }}
            />
          )}
        </div>

        <div className="border-t border-gray-100 px-6 py-3 bg-gray-50 flex justify-between items-center">
          {POLICY_KEYS.includes(activeTab) ? (
            <button
              onClick={() => {
                handleChange(activeTab, []);
                showToast("Tab cleared");
              }}
              className="text-xs text-gray-400 hover:text-red-500 transition"
            >
              Reset this tab
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-gray-800 hover:bg-[#1D1D1F] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <MediaPicker
        open={showLogoPicker}
        onSelect={async (asset) => {
          const logo = asset || {};
          setFooterLogo(logo);
          setShowLogoPicker(false);
          await saveFooterLogo(logo, setLogoStatus);
        }}
        onClose={() => setShowLogoPicker(false)}
      />
    </div>
  );
}
