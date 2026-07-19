"use client";

import toast from "react-hot-toast";
import { FaShoppingBag, FaHeart, FaCheck } from "react-icons/fa";

const ACCENTS = {
  violet: { bg: "bg-gray-100", text: "text-[#1D1D1F]", bar: "bg-gray-700" },
  rose: { bg: "bg-rose-100", text: "text-rose-600", bar: "bg-rose-500" },
};

// Eye-catching pill toast for cart/wishlist confirmations — swap out
// toast.success()'s plain text bubble for an icon badge + progress bar.
export function showActionToast({
  message,
  icon = "cart",
  accent = "violet",
  duration = 2600,
}) {
  const theme = ACCENTS[accent] || ACCENTS.violet;
  const Icon = icon === "wishlist" ? FaHeart : FaShoppingBag;

  toast.custom(
    (t) => (
      <div
        className={`relative flex min-w-[260px] max-w-sm items-center gap-3 overflow-hidden rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-black/5 ${
          t.visible ? "animate-toast-pop" : "opacity-0"
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${theme.bg} ${theme.text} animate-toast-icon`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold text-gray-800">{message}</span>
        <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <FaCheck className="h-2.5 w-2.5" />
        </span>
        <span
          className={`absolute bottom-0 left-0 h-0.5 ${theme.bar}`}
          style={{ animation: `toast-progress ${duration}ms linear forwards` }}
        />
      </div>
    ),
    { duration },
  );
}
