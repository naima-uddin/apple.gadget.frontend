"use client";

import React, { useEffect, useRef, useState } from "react";
import { useCart, getItemPrice } from "@/components/context/CartContext";
import { FiShoppingBag } from "react-icons/fi";
import { useLanguage } from "@/components/context/LanguageContext";

export default function CartFloating() {
  const { cartItems, getCartCount, toggleSidebar, isSidebarOpen } = useCart();
  const { t } = useLanguage();
  const count = getCartCount();
  const [bump, setBump] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count !== prevCount.current) {
      prevCount.current = count;
      setBump(true);
      const timer = setTimeout(() => setBump(false), 300);
      return () => clearTimeout(timer);
    }
  }, [count]);

  if (count === 0 || isSidebarOpen) return null;

  const total = cartItems.reduce(
    (sum, item) => sum + getItemPrice(item) * item.quantity,
    0,
  );
  const label = `${t("cart.open_label_prefix")} ${count} ${t("cart.items_label")}, ${t("cart.open_label_total")}${total}`;

  return (
    // Same floating icon on every screen size — mobile and desktop.
    <span className="fixed z-50" style={{ bottom: 104, right: 16 }}>
      {/* ping ring — always active like a map marker */}
      <span className="absolute inset-0 rounded-full bg-[#5B21B6] opacity-30 animate-ping" />
      <button
        onClick={toggleSidebar}
        aria-label={label}
        className={`relative flex items-center justify-center bg-[#5B21B6] text-white rounded-full shadow-lg shadow-violet-300 w-12 h-12 hover:bg-violet-700 active:scale-95 transition-transform ${bump ? "scale-110" : "scale-100"}`}
      >
        <span className="relative">
          <FiShoppingBag className="w-5 h-5" />
          <span className="absolute -top-2.5 -right-2.5 bg-white text-[#5B21B6] text-[10px] font-bold min-w-4.5 h-4.5 rounded-full flex items-center justify-center leading-none px-0.5 border border-violet-100 shadow-sm">
            {count}
          </span>
        </span>
      </button>
    </span>
  );
}
