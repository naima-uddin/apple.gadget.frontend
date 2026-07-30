"use client";

import { createContext, useContext, useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

const EMPTY_POLICY = {
  shipping: [],
  return: [],
  faq: [],
  privacy: [],
  terms: [],
};

const EMPTY_FOOTER_LINKS = { quickLinks: [], customerService: [] };
const EMPTY_ABOUT = { hero: {}, features: [], stats: [] };

const StoreSettingsContext = createContext({
  storeName: "",
  logoUrl: "",
  footerLogoUrl: "",
  footerInfo: { phone: "", email: "", address: "" },
  contactInfo: { phone: "", email: "", address: "" },
  socialLinks: {},
  policyContent: EMPTY_POLICY,
  footerLinks: EMPTY_FOOTER_LINKS,
  aboutContent: EMPTY_ABOUT,
});

export function StoreSettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    storeName: "",
    logoUrl: "",
    footerLogoUrl: "",
    footerInfo: { phone: "", email: "", address: "" },
    contactInfo: { phone: "", email: "", address: "" },
    socialLinks: {},
    policyContent: EMPTY_POLICY,
    footerLinks: EMPTY_FOOTER_LINKS,
    aboutContent: EMPTY_ABOUT,
  });

  useEffect(() => {
    fetch(`${API}/api/admin/top-banner`)
      .then((r) => r.json())
      .then((d) =>
        setSettings({
          storeName: d.storeName || "",
          logoUrl: d.websiteLogo?.url || "",
          footerLogoUrl: d.footerLogo?.url || "",
          footerInfo: d.footerInfo || { phone: "", email: "", address: "" },
          contactInfo: d.contactInfo || { phone: "", email: "", address: "" },
          socialLinks: d.socialLinks || {},
          policyContent: d.policyContent || EMPTY_POLICY,
          footerLinks: d.footerLinks || EMPTY_FOOTER_LINKS,
          aboutContent: d.aboutContent || EMPTY_ABOUT,
        }),
      )
      .catch(() => {});
  }, []);

  return (
    <StoreSettingsContext.Provider value={settings}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  return useContext(StoreSettingsContext);
}
