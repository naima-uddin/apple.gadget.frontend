"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useCart,
  makeCartKey,
  getItemPrice,
  getItemCompareAtPrice,
} from "@/components/context/CartContext";
import { useUser } from "@/components/context/UserContext";
import AuthModal from "@/components/auth/AuthModal";
import Image from "next/image";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaTimes,
  FaTicketAlt,
  FaGift,
} from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import PaymentSelector from "@/components/checkout/PaymentSelector";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/components/context/LanguageContext";

export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { cartItems, clearCart, cartHydrated } = useCart();
  const { user } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  // All financial values come from the server quote — never calculated client-side
  const [quote, setQuote] = useState({
    items: [],
    subtotal: 0,
    baseShipping: 0,
    shipping: 0,
    autoDiscount: 0,
    couponDiscount: 0,
    discount: 0,
    total: 0,
    freeShippingFromCoupon: false,
    appliedCouponCode: null,
    couponHeadline: null,
    appliedCoupons: [],
    couponErrors: [],
    insideDhaka: null,
    rewardPointsEarned: 0,
    availablePoints: 0,
    pointsRedeemed: 0,
    pointsDiscount: 0,
    pointsPerTk: 100,
  });
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [useRewardPoints, setUseRewardPoints] = useState(false);
  const pointsToRedeemRef = useRef(0);
  const [appliedCoupons, setAppliedCoupons] = useState([]); // array of coupon codes
  const appliedCouponsRef = useRef([]); // ref so effect always reads latest value
  const [couponMsg, setCouponMsg] = useState(null); // { type: 'success'|'error', text }
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const orderPlaced = useRef(false);
  const [previousAddresses, setPreviousAddresses] = useState([]);

  // Progress indicators state
  const [progressItems, setProgressItems] = useState([]);

  // Order items scroll indicator
  const itemsScrollRef = useRef(null);
  const [itemsScrollPct, setItemsScrollPct] = useState(0);
  const handleItemsScroll = () => {
    const el = itemsScrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setItemsScrollPct(max > 0 ? el.scrollTop / max : 0);
  };

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    zone: "",
    area: "",
    address: "",
    note: "",
    paymentMethod: "cash-on-delivery",
    coupon: "",
  });

  // Custom input states
  const [customCity, setCustomCity] = useState("");
  const [customZone, setCustomZone] = useState("");
  const [customArea, setCustomArea] = useState("");

  // Location data fetched from API
  const [locationData, setLocationData] = useState({});
  const [cities, setCities] = useState([]);
  const [zones, setZones] = useState([]);
  const [areas, setAreas] = useState([]);
  const hasResolvedCity = Boolean(
    (formData.city === "other" ? customCity : formData.city)?.trim(),
  );

  // ── Calculate totals (removed — all values come from server quote) ───────

  // ── Abandoned checkout tracking ─────────────────────────────────────────────
  // Record a checkout session on mount; store the sessionId so we can update
  // it with billing info as the guest fills in the form.
  const checkoutSessionId = useRef(null);
  const sessionPatchTimer = useRef(null);

  useEffect(() => {
    if (cartItems.length === 0) return;
    const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
    fetch(`${API}/api/checkout-sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        items: cartItems.map((item) => ({
          productId: item.product?._id || item.product?.id || "",
          title: item.product?.title || "",
          price: getItemPrice(item),
          quantity: item.quantity,
          image: item.product?.images?.[0] || null,
        })),
        total: 0,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.sessionId) checkoutSessionId.current = data.sessionId;
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced update: as guest fills name/phone/email, patch the session so
  // abandoned checkout records show real contact info even for guest users.
  // The null check is INSIDE the timeout so it still works if POST response
  // is still pending when the user starts typing.
  useEffect(() => {
    const { name, phone, email } = formData;
    if (!name && !phone && !email) return;
    clearTimeout(sessionPatchTimer.current);
    sessionPatchTimer.current = setTimeout(() => {
      if (!checkoutSessionId.current) return;
      const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
      fetch(`${API}/api/checkout-sessions/${checkoutSessionId.current}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userName: name || undefined,
          userPhone: phone || undefined,
          userEmail: email || undefined,
        }),
      }).catch(() => {});
    }, 2000);
    return () => clearTimeout(sessionPatchTimer.current);
  }, [formData.name, formData.phone, formData.email]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect if cart is empty — but NOT before hydration or after a successful order
  useEffect(() => {
    if (!cartHydrated) return;
    if (cartItems.length === 0 && !orderPlaced.current) {
      router.push("/");
    }
  }, [cartItems.length, cartHydrated, router]);

  // ── Server quote ────────────────────────────────────────────────────────────
  // Re-fetch whenever cartItems OR city/zone/area changes (keep any active coupons via ref)
  const currentCityRef = useRef("");
  const currentZoneRef = useRef("");
  const currentAreaRef = useRef("");

  const fetchQuote = useCallback(
    (couponCodes, pointsToRedeem = 0) => {
      if (!cartItems.length) return;
      const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
      const city = currentCityRef.current?.trim() || null;
      const zone = currentZoneRef.current?.trim() || null;
      const area = currentAreaRef.current?.trim() || null;
      return fetch(`${API}/api/orders/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.product._id || item.product.id,
            quantity: item.quantity,
            color: item.selectedColor || null,
            size: item.selectedSize || null,
          })),
          couponCodes: couponCodes?.length ? couponCodes : null,
          city,
          zone,
          area,
          pointsToRedeem: pointsToRedeem > 0 ? pointsToRedeem : null,
        }),
      }).then((r) => r.json());
    },
    [cartItems],
  );

  // Fetch progress indicators
  const fetchProgress = useCallback(async (subtotal) => {
    const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
    try {
      const resp = await fetch(
        `${API}/api/coupons/progress?subtotal=${subtotal}`,
        {
          credentials: "include",
        },
      );
      const data = await resp.json();
      setProgressItems(data.progressItems || []);
    } catch (err) {
      console.error("Progress fetch failed:", err);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setPreviousAddresses([]);
      return;
    }

    const fetchPreviousAddresses = async () => {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
        const resp = await fetch(`${API}/api/orders/my`, {
          credentials: "include",
        });
        const data = await resp.json();
        const seen = new Set();
        const addresses = (data.orders || [])
          .map((order) => order.billingDetails || {})
          .filter((billing) => billing.address && billing.city)
          .filter((billing) => {
            const key = [
              billing.name,
              billing.phone,
              billing.email,
              billing.city,
              billing.zone,
              billing.area,
              billing.address,
            ]
              .map((value) =>
                String(value || "")
                  .trim()
                  .toLowerCase(),
              )
              .join("|");
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .slice(0, 4);
        setPreviousAddresses(addresses);
      } catch (err) {
        console.error("Failed to load previous checkout addresses:", err);
      }
    };

    fetchPreviousAddresses();
  }, [user]);

  useEffect(() => {
    if (!cartItems.length) return;
    const currentCoupons = appliedCouponsRef.current;
    setQuoteLoading(true);
    fetchQuote(currentCoupons, pointsToRedeemRef.current)
      .then((data) => {
        if (data.error && currentCoupons?.length) {
          appliedCouponsRef.current = [];
          setAppliedCoupons([]);
          setCouponMsg({ type: "error", text: data.error });
          setFormData((prev) => ({ ...prev, coupon: "" }));
          return fetchQuote(null, pointsToRedeemRef.current).then(setQuote);
        }
        setQuote(data);
        if (data.appliedCoupons?.length) {
          setAppliedCoupons(data.appliedCoupons.map((c) => c.code));
          appliedCouponsRef.current = data.appliedCoupons.map((c) => c.code);
        }
        // Fetch progress indicators
        fetchProgress(data.subtotal || 0);
      })
      .catch((err) => console.error("Quote fetch failed:", err))
      .finally(() => setQuoteLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems]);

  // Re-fetch when city/zone/area selection changes so shipping reflects
  // inside/outside Dhaka, and any zone/area-specific override
  useEffect(() => {
    const resolvedCity = formData.city === "other" ? customCity : formData.city;
    const resolvedZone = formData.zone === "other" ? customZone : formData.zone;
    const resolvedArea = formData.area === "other" ? customArea : formData.area;
    if (!resolvedCity) {
      currentCityRef.current = "";
      currentZoneRef.current = "";
      currentAreaRef.current = "";
      return;
    }
    currentCityRef.current = resolvedCity;
    currentZoneRef.current = resolvedZone || "";
    currentAreaRef.current = resolvedArea || "";
    if (!cartItems.length) return;
    setQuoteLoading(true);
    fetchQuote(appliedCouponsRef.current, pointsToRedeemRef.current)
      .then((data) => {
        if (!data.error) setQuote(data);
      })
      .catch((err) => console.error("Quote (city) fetch failed:", err))
      .finally(() => setQuoteLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.city,
    customCity,
    formData.zone,
    customZone,
    formData.area,
    customArea,
  ]);

  const refetchQuoteWithPoints = (points) => {
    pointsToRedeemRef.current = points;
    setQuoteLoading(true);
    fetchQuote(appliedCouponsRef.current, points)
      .then((data) => {
        if (!data.error) setQuote(data);
      })
      .finally(() => setQuoteLoading(false));
  };

  const handleToggleRewardPoints = (checked) => {
    setUseRewardPoints(checked);
    const pts = checked ? quote.availablePoints || 0 : 0;
    refetchQuoteWithPoints(pts);
  };

  // fetch location data once
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        // Trailing slash matches next.config `trailingSlash: true`;
        // without it the request 308-redirects and the fetch can come back
        // empty on static/cPanel hosting, leaving the city list blank.
        const resp = await fetch("/api/locations/");
        const json = await resp.json();
        setLocationData(json.locationData || {});
        const cityList = json.locationData
          ? Object.keys(json.locationData)
          : [];
        setCities(cityList);
      } catch (err) {
        console.error("Failed to load location data", err);
      }
    };
    fetchLocations();
  }, []);

  // Update zones when city changes
  useEffect(() => {
    if (formData.city && locationData[formData.city]) {
      const availableZones = Object.keys(
        locationData[formData.city].zones || {},
      );
      setZones(availableZones);
      setFormData((prev) => {
        const keepZone = availableZones.includes(prev.zone);
        return {
          ...prev,
          zone: keepZone ? prev.zone : "",
          area: keepZone ? prev.area : "",
        };
      });
      setAreas([]);
    }
  }, [formData.city, locationData]);

  // Update areas when zone changes
  useEffect(() => {
    if (formData.city && formData.zone && locationData[formData.city]) {
      const availableAreas =
        locationData[formData.city].zones[formData.zone] || [];
      setAreas(availableAreas);
      setFormData((prev) => ({
        ...prev,
        area: availableAreas.includes(prev.area) ? prev.area : "",
      }));
    }
  }, [formData.city, formData.zone, locationData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "coupon") setCouponMsg(null); // clear coupon msg on input change
    // Reset custom inputs when switching back from "Other"
    if (name === "city" && value !== "other") setCustomCity("");
    if (name === "zone" && value !== "other") setCustomZone("");
    if (name === "area" && value !== "other") setCustomArea("");
  };

  const applyPreviousAddress = (billing) => {
    setCustomCity("");
    setCustomZone("");
    setCustomArea("");
    currentCityRef.current = billing.city || "";
    setFormData((prev) => ({
      ...prev,
      name: billing.name || prev.name,
      phone: billing.phone || prev.phone,
      email: billing.email || prev.email,
      city: billing.city || "",
      zone: billing.zone || "",
      area: billing.area || "",
      address: billing.address || "",
      note: billing.note || prev.note,
    }));
  };

  const handleApplyCoupon = async () => {
    const code = formData.coupon.trim();
    if (!code) {
      setCouponMsg({ type: "error", text: "Please enter a coupon code." });
      return;
    }

    // Check if already applied
    if (appliedCoupons.includes(code)) {
      setCouponMsg({ type: "error", text: "This coupon is already applied." });
      return;
    }

    // Check max 2 coupons
    if (appliedCoupons.length >= 2) {
      setCouponMsg({
        type: "error",
        text: "Maximum 2 coupons can be applied.",
      });
      return;
    }

    setCouponMsg(null);
    setQuoteLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
      const newCoupons = [...appliedCoupons, code];
      const resp = await fetch(`${API}/api/orders/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.product._id || item.product.id,
            quantity: item.quantity,
            color: item.selectedColor || null,
            size: item.selectedSize || null,
          })),
          couponCodes: newCoupons,
          city: currentCityRef.current || null,
          pointsToRedeem:
            pointsToRedeemRef.current > 0 ? pointsToRedeemRef.current : null,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setCouponMsg({ type: "error", text: data.error });
        return;
      }

      // Check if the new coupon was actually applied
      if (data.couponErrors?.some((e) => e.code === code)) {
        const error = data.couponErrors.find((e) => e.code === code);
        setCouponMsg({ type: "error", text: error.error });
        return;
      }

      const appliedCodes = data.appliedCoupons?.map((c) => c.code) || [];
      appliedCouponsRef.current = appliedCodes;
      setAppliedCoupons(appliedCodes);
      setQuote(data);
      setFormData((prev) => ({ ...prev, coupon: "" }));

      const lastApplied = data.appliedCoupons?.[data.appliedCoupons.length - 1];
      setCouponMsg({
        type: "success",
        text: `"${code}" applied!${lastApplied?.title ? ` ${lastApplied.title}` : ""}`,
      });

      // Refresh progress
      fetchProgress(data.subtotal || 0);
    } catch {
      setCouponMsg({
        type: "error",
        text: "Failed to validate coupon. Please try again.",
      });
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleRemoveCoupon = async (codeToRemove) => {
    const newCoupons = appliedCoupons.filter((c) => c !== codeToRemove);
    appliedCouponsRef.current = newCoupons;
    setAppliedCoupons(newCoupons);
    setCouponMsg(null);
    setQuoteLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
      const resp = await fetch(`${API}/api/orders/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.product._id || item.product.id,
            quantity: item.quantity,
            color: item.selectedColor || null,
            size: item.selectedSize || null,
          })),
          couponCodes: newCoupons.length ? newCoupons : null,
          city: currentCityRef.current || null,
          pointsToRedeem:
            pointsToRedeemRef.current > 0 ? pointsToRedeemRef.current : null,
        }),
      });
      const data = await resp.json();
      if (!data.error) {
        setQuote(data);
        fetchProgress(data.subtotal || 0);
      }
    } catch (err) {
      console.error("Failed to refresh quote:", err);
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleRemoveAllCoupons = async () => {
    appliedCouponsRef.current = [];
    setAppliedCoupons([]);
    setCouponMsg(null);
    setFormData((prev) => ({ ...prev, coupon: "" }));
    setQuoteLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
      const resp = await fetch(`${API}/api/orders/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.product._id || item.product.id,
            quantity: item.quantity,
            color: item.selectedColor || null,
            size: item.selectedSize || null,
          })),
          couponCodes: null,
          city: currentCityRef.current || null,
          pointsToRedeem:
            pointsToRedeemRef.current > 0 ? pointsToRedeemRef.current : null,
        }),
      });
      const data = await resp.json();
      if (!data.error) {
        setQuote(data);
        fetchProgress(data.subtotal || 0);
      }
    } catch (err) {
      console.error("Failed to refresh quote:", err);
    } finally {
      setQuoteLoading(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    // Get final location values (use custom input if "other" is selected)
    const finalCity = formData.city === "other" ? customCity : formData.city;
    const finalZone = formData.zone === "other" ? customZone : formData.zone;
    const finalArea = formData.area === "other" ? customArea : formData.area;

    // Validate required fields — show a field-specific message for the first one missing
    const requiredFields = [
      { value: formData.name, message: t("checkout.please_fill_name") },
      { value: formData.phone, message: t("checkout.please_fill_phone") },
      { value: finalCity, message: t("checkout.please_fill_city") },
      { value: finalZone, message: t("checkout.please_fill_zone") },
      { value: formData.address, message: t("checkout.please_fill_address") },
    ];

    const firstMissing = requiredFields.find(
      (f) => !f.value?.toString().trim(),
    );
    if (firstMissing) {
      toast.error(firstMissing.message);
      return;
    }

    // Bangladeshi mobile number — "+880"/"880" country code is optional, but
    // once stripped the number must start with 01 and be 11 digits total.
    const bdPhoneRegex = /^(?:\+?880|0)1[3-9]\d{8}$/;
    if (!bdPhoneRegex.test(formData.phone.trim())) {
      toast.error(t("checkout.invalid_phone"));
      return;
    }

    setIsPlacingOrder(true);

    // Device fingerprint — persisted in localStorage so the same browser is
    // recognised across sessions without any invasive tracking.
    let deviceId = "";
    try {
      deviceId = localStorage.getItem("_yh_did") || "";
      if (!deviceId) {
        deviceId =
          "dev-" +
          Math.random().toString(36).slice(2) +
          Date.now().toString(36);
        localStorage.setItem("_yh_did", deviceId);
      }
    } catch (_) {}

    const orderData = {
      userEmail: user?.email || formData.email,
      // Only product IDs, quantities, and variant selectors — NO prices, totals, or other
      // financial figures. The server re-fetches and recalculates everything.
      items: cartItems.map((item) => ({
        productId: item.product._id || item.product.id,
        quantity: item.quantity,
        color: item.selectedColor || null,
        size: item.selectedSize || null,
      })),
      billingDetails: {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        city: finalCity,
        zone: finalZone,
        area: finalArea,
        address: formData.address,
        note: formData.note,
      },
      paymentMethod: formData.paymentMethod,
      couponCodes: appliedCoupons.length ? appliedCoupons : null,
      pointsToRedeem:
        useRewardPoints &&
        (quote.pointsRedeemed || pointsToRedeemRef.current) > 0
          ? quote.pointsRedeemed || pointsToRedeemRef.current
          : null,
      deviceId,
    };

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";
      const response = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to place order");
      }

      if (result.method === "cod") {
        // Cash on Delivery — set flag BEFORE clearing cart to suppress redirect
        orderPlaced.current = true;
        clearCart();
        router.push(`/thankyou/success?orderId=${result.orderId}&method=cod`);
      } else if (["bkash", "nagad", "rocket"].includes(result.method)) {
        // Mobile banking — redirect to payment page with merchant info
        orderPlaced.current = true;
        clearCart();
        const params = new URLSearchParams({
          orderId: result.orderId,
          method: result.method,
          amount: result.amount,
          merchant: result.merchantNumber || "",
        });
        router.push(`/checkout/payment?${params.toString()}`);
      } else if (result.method === "online" && result.url) {
        // Navigate the current tab to SSLCommerz (same window, no popup/iframe).
        // Cart is cleared on the success page after payment completes.
        window.location.href = result.url;
        return; // stop spinner reset — we're navigating away
      } else {
        throw new Error(result.error || "Unexpected response from server");
      }
    } catch (error) {
      console.error("Order error:", error);
      toast.error(error.message || "Failed to place order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleViewRewards = () => {
    setShowRewardsModal(true);
  };

  if (cartItems.length === 0) {
    return null;
  }

  // After order is placed (COD) the cart is empty but we are navigating away — render nothing.
  // Exception: SSL popup is pending (online payment in progress) — keep the page alive.
  if (orderPlaced.current) return null;

  // Build a Map of server-verified unit prices keyed by productId+color+size
  const quoteItemMap = {};
  (quote.items || []).forEach((qi) => {
    quoteItemMap[makeCartKey(qi.productId?.toString(), qi.color, qi.size)] =
      qi.price;
  });
  const displayShipping = hasResolvedCity ? (quote.shipping ?? 0) : 0;
  const displayBaseShipping = hasResolvedCity ? (quote.baseShipping ?? 0) : 0;
  const displayTotal = hasResolvedCity
    ? (quote.total ?? 0)
    : Math.max(0, (quote.total ?? 0) - (quote.shipping ?? 0));

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-10">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#1F2937] transition mb-3 sm:mb-5"
        >
          <FiArrowLeft className="w-4 h-4" />
          {t("cart.continue")}
        </button>
        <h1 className="text-xl sm:text-3xl font-semibold text-[#1F2937] tracking-tight mb-5 sm:mb-8">
          {t("checkout.title")}
        </h1>

        {/* Guest login nudge */}
        {!user && (
          <div className="mb-5 pb-4 sm:mb-8 sm:pb-6 border-b border-gray-100 text-sm text-gray-500">
            Sign in for faster checkout, reward points & saved addresses —{" "}
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="font-medium text-[#1D1D1F] hover:underline"
            >
              Sign in
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 sm:gap-8 lg:gap-14 items-start">
          {/* ── Left — form ──────────────────────────────────────────────── */}
          <form onSubmit={handlePlaceOrder} className="space-y-6 sm:space-y-10">
            {/* Contact Information */}
            <section>
              <h2 className="text-base font-semibold text-[#1F2937] pb-2.5 mb-4 sm:pb-3 sm:mb-5 border-b border-gray-100">
                Contact Information
              </h2>

              {previousAddresses.length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    {t("checkout.use_prev_address")}
                  </label>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value === "") return;
                      applyPreviousAddress(previousAddresses[e.target.value]);
                      e.target.value = "";
                    }}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition"
                  >
                    <option value="" disabled>
                      {t("checkout.saved_address")}
                    </option>
                    {previousAddresses.map((billing, idx) => (
                      <option key={`${billing.address}-${idx}`} value={idx}>
                        {billing.name ? `${billing.name} — ` : ""}
                        {[billing.address, billing.area, billing.city]
                          .filter(Boolean)
                          .join(", ")}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    {t("checkout.name")}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    {t("checkout.phone")}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    {t("checkout.email")}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition"
                  />
                </div>
              </div>
            </section>

            {/* Delivery Address */}
            <section>
              <h2 className="text-base font-semibold text-[#1F2937] pb-2.5 mb-4 sm:pb-3 sm:mb-5 border-b border-gray-100">
                Delivery Address
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 mb-4 sm:mb-5">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    {t("checkout.city")}
                  </label>
                  <SearchableSelect
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    options={cities}
                    placeholder={t("checkout.city_ph")}
                    required
                  />
                  {formData.city === "other" && (
                    <input
                      type="text"
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      placeholder={t("checkout.enter_city")}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition mt-2"
                      required
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    {t("checkout.zone")}
                  </label>
                  <SearchableSelect
                    name="zone"
                    value={formData.zone}
                    onChange={handleInputChange}
                    options={zones}
                    placeholder={t("checkout.zone_ph")}
                    required
                    disabled={!formData.city || formData.city === "other"}
                  />
                  {(formData.zone === "other" || formData.city === "other") && (
                    <input
                      type="text"
                      value={customZone}
                      onChange={(e) => setCustomZone(e.target.value)}
                      placeholder={t("checkout.enter_zone")}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition mt-2"
                      required
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    {t("checkout.area")}
                  </label>
                  <SearchableSelect
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    options={areas}
                    placeholder={t("checkout.area_ph")}
                    disabled={
                      !formData.zone ||
                      formData.zone === "other" ||
                      formData.city === "other"
                    }
                  />
                  {(formData.area === "other" ||
                    formData.zone === "other" ||
                    formData.city === "other") && (
                    <input
                      type="text"
                      value={customArea}
                      onChange={(e) => setCustomArea(e.target.value)}
                      placeholder={t("checkout.enter_area")}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition mt-2"
                    />
                  )}
                </div>
              </div>

              <div className="mb-4 sm:mb-5">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  {t("checkout.address")}
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder={t("checkout.address_ph")}
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  {t("checkout.note")}
                </label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  placeholder={t("checkout.note_ph")}
                  rows={1}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition resize-none"
                />
              </div>
            </section>
          </form>

          {/* ── Right — sticky summary ───────────────────────────────────── */}
          <aside className="lg:sticky lg:top-8 space-y-6">
            <div className="border border-gray-200 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base font-semibold text-[#1F2937]">
                  {t("checkout.order_summary")}
                </h2>
                {progressItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleViewRewards}
                    className="flex items-center gap-1 text-xs font-medium text-[#1D1D1F] hover:underline"
                  >
                    <FaGift className="w-3 h-3" />
                    {t("checkout.unlock_rewards")}
                  </button>
                )}
              </div>

              {/* Order items — compact list */}
              <div className="relative mb-3 pb-3 sm:mb-4 sm:pb-4 border-b border-gray-100">
                {cartItems.length > 2 && (
                  <div className="absolute right-0 top-0 bottom-4 w-1 rounded-full bg-gray-300 overflow-hidden">
                    <div
                      className="absolute left-0 right-0 top-0 rounded-full bg-gray-400 transition-all duration-100"
                      style={{
                        height: `${itemsScrollPct * 100}%`,
                        width: "100%",
                      }}
                    />
                  </div>
                )}
                <div
                  ref={itemsScrollRef}
                  onScroll={handleItemsScroll}
                  className="space-y-2.5 sm:space-y-3 overflow-y-auto no-scrollbar pr-2 max-h-20 md:max-h-25"
                >
                  {cartItems.map((item) => {
                    const { product, quantity, selectedColor, selectedSize } =
                      item;
                    const id = product._id || product.id;
                    const image =
                      product.images?.[0]?.url || "/assets/placeholder.svg";
                    const title = product.title || product.name;
                    const price =
                      quoteItemMap[
                        makeCartKey(id, selectedColor, selectedSize)
                      ] ?? 0;
                    return (
                      <div key={id} className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div className="w-11 h-11 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                            <Image
                              src={encodeURI(image)}
                              alt={title}
                              width={44}
                              height={44}
                              className="object-contain w-full h-full p-1"
                            />
                          </div>
                          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gray-500 text-white text-[9px] font-bold flex items-center justify-center">
                            {quantity}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#1F2937] truncate">
                            {title}
                          </p>
                          {(selectedColor || selectedSize) && (
                            <p className="text-[11px] text-gray-400 truncate">
                              {[selectedColor, selectedSize]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-600 shrink-0">
                          ৳{(price * quantity).toFixed(0)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 relative">
                {quoteLoading && (
                  <div className="absolute inset-0 bg-white/75 flex items-center justify-center rounded z-10">
                    <svg
                      className="animate-spin w-5 h-5 text-[#1D1D1F]"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{t("cart.subtotal")}</span>
                  <span className="text-gray-700">
                    ৳{(quote.subtotal ?? 0).toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{t("orders.shipping")}</span>
                  <span
                    className={
                      displayShipping === 0 ? "text-green-600" : "text-gray-700"
                    }
                  >
                    {displayShipping === 0
                      ? t("checkout.free")
                      : `৳${displayShipping.toFixed(0)}`}
                  </span>
                </div>

                {/* Applied coupons */}
                {quote.appliedCoupons?.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {quote.appliedCoupons.map((coupon, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-xs text-green-600"
                      >
                        <span className="flex items-center gap-1.5">
                          <FaTicketAlt className="shrink-0 opacity-60 w-3 h-3" />
                          <span className="font-medium uppercase">
                            {coupon.code}
                          </span>
                          <span className="text-gray-400">
                            {coupon.givesFreeShipping
                              ? t("checkout.free_shipping_coupon")
                              : `(-৳${coupon.discountValue ?? 0})`}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCoupon(coupon.code)}
                          className="text-gray-300 hover:text-red-500"
                        >
                          <FaTimes className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {(quote.couponDiscount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{t("checkout.coupon_discount")}</span>
                    <span>-৳{(quote.couponDiscount ?? 0).toFixed(0)}</span>
                  </div>
                )}
                {(quote.pointsDiscount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Points ({quote.pointsRedeemed} pts)</span>
                    <span>-৳{(quote.pointsDiscount ?? 0).toFixed(0)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-1 md:pt-2  border-t border-gray-100">
                  <span className="text-sm font-semibold text-[#1F2937]">
                    {t("checkout.total")}
                  </span>
                  <span className="text-lg font-semibold text-[#1F2937]">
                    ৳{displayTotal.toFixed(0)}
                  </span>
                </div>

                {/* Savings line */}
                {(() => {
                  // Use shared cart utilities — same logic as CartSidebar
                  const mrpSavings = cartItems.reduce((sum, item) => {
                    const { quantity, selectedColor, selectedSize, product } =
                      item;
                    const id = product._id || product.id;
                    const selling =
                      quoteItemMap[
                        makeCartKey(id, selectedColor, selectedSize)
                      ] ?? getItemPrice(item);
                    const mrp = getItemCompareAtPrice(item);
                    return (
                      sum + (mrp > selling ? (mrp - selling) * quantity : 0)
                    );
                  }, 0);

                  const totalSaved =
                    mrpSavings +
                    (quote.couponDiscount ?? 0) +
                    (quote.pointsDiscount ?? 0) +
                    (quote.freeShippingFromCoupon
                      ? (quote.baseShipping ?? 0)
                      : 0);

                  return totalSaved > 0 ? (
                    <p className="text-xs text-green-600 pt-1">
                      {t("checkout.you_saving_prefix")}{" "}
                      <span className="font-semibold">
                        ৳{Math.round(totalSaved)}
                      </span>{" "}
                      {t("checkout.you_saving_suffix")}
                    </p>
                  ) : null;
                })()}
              </div>

              {/* Coupon code — always visible, one line */}
              <div className="pt-3 mt-3 sm:pt-4 sm:mt-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="coupon"
                    value={formData.coupon}
                    onChange={handleInputChange}
                    placeholder={t("checkout.coupon_label")}
                    disabled={appliedCoupons.length >= 2}
                    className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 disabled:bg-gray-50 transition"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={
                      appliedCoupons.length >= 2 || !formData.coupon.trim()
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    {t("checkout.apply")}
                  </button>
                </div>

                {couponMsg && (
                  <p
                    className={`mt-1.5 text-xs flex items-center gap-1 ${couponMsg.type === "success" ? "text-green-600" : "text-red-500"}`}
                  >
                    {couponMsg.type === "success" ? (
                      <FaCheckCircle className="shrink-0" />
                    ) : (
                      <FaTimesCircle className="shrink-0" />
                    )}
                    {couponMsg.text}
                  </p>
                )}

                {appliedCoupons.length > 0 ? (
                  <button
                    type="button"
                    onClick={handleRemoveAllCoupons}
                    className="mt-1.5 text-xs text-gray-400 hover:text-red-500 transition"
                  >
                    {t("checkout.remove_all_coupons")}
                  </button>
                ) : (
                  <Link
                    href="/user/coupons"
                    className="mt-1.5 text-xs text-[#1D1D1F] hover:underline inline-block"
                  >
                    {t("checkout.browse_coupons")}
                  </Link>
                )}
              </div>

              {/* Reward points — simple toggle row, only when relevant */}
              {user &&
                (quote.availablePoints ?? 0) >= (quote.pointsPerTk || 100) && (
                  <div className="flex items-center justify-between gap-3 pt-3 mt-3 sm:pt-4 sm:mt-4 border-t border-gray-100">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-700">
                        {t("checkout.reward_points")}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {quote.availablePoints} pts = ৳
                        {Math.floor(
                          (quote.availablePoints || 0) /
                            (quote.pointsPerTk || 100),
                        )}{" "}
                        off
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleRewardPoints(!useRewardPoints)}
                      aria-pressed={useRewardPoints}
                      className={`relative w-9 h-5 rounded-full shrink-0 transition-colors duration-200 ${
                        useRewardPoints ? "bg-[#1D1D1F]" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                          useRewardPoints
                            ? "translate-x-4.5"
                            : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                )}

              {/* Earn points hint */}
              {user && (quote.rewardPointsEarned ?? 0) > 0 && (
                <p className="text-xs text-gray-400 pt-3">
                  You&apos;ll earn{" "}
                  <span className="text-gray-600 font-medium">
                    {quote.rewardPointsEarned} pts
                  </span>{" "}
                  on delivery
                </p>
              )}

              {/* Payment Method */}
              <div className="pt-3 mt-3 sm:pt-4 sm:mt-4 border-t border-gray-100">
                <h2 className="text-sm font-semibold text-[#1F2937] mb-3">
                  {t("checkout.payment")}
                </h2>
                <PaymentSelector
                  value={formData.paymentMethod}
                  onChange={(method) =>
                    setFormData((prev) => ({ ...prev, paymentMethod: method }))
                  }
                  isLoading={isPlacingOrder}
                  onSubmit={handlePlaceOrder}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* Rewards Modal */}
      {showRewardsModal && (
        <div className="fixed inset-0 bg-black/30 bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-[#1F2937] flex items-center gap-2">
                <FaGift className="text-[#1D1D1F] w-4 h-4" />
                {t("checkout.available_rewards")}
              </h3>
              <button
                onClick={() => setShowRewardsModal(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {progressItems.length > 0 ? (
                <div className="space-y-4">
                  {progressItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-xl p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-[#1F2937] text-sm">
                            {item.message}
                          </p>
                          {item.couponCode && (
                            <div className="mt-2">
                              <span className="text-xs font-mono bg-gray-50 border border-gray-200 px-2 py-1 rounded text-[#1D1D1F]">
                                {item.couponCode}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">Progress</span>
                          <span className="font-medium text-gray-600">
                            ৳{quote.subtotal} / ৳{item.minOrderAmount}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-[#1D1D1F] h-1.5 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, (quote.subtotal / item.minOrderAmount) * 100)}%`,
                            }}
                          />
                        </div>
                        {quote.subtotal >= item.minOrderAmount && (
                          <div className="mt-2 text-green-600 text-xs flex items-center gap-1">
                            <FaCheckCircle className="w-3 h-3" />
                            <span>Eligible! Use the coupon code above.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No rewards available at the moment.
                </p>
              )}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-3">
              <button
                onClick={() => {
                  setShowRewardsModal(false);
                  router.push("/user/coupons");
                }}
                className="w-full bg-[#1D1D1F] text-white py-2.5 rounded-lg hover:bg-black transition font-medium text-sm"
              >
                {t("checkout.explore_coupons")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
