"use client";

// ── Online payment (SSLCommerz) is temporarily disabled ──────────────────────
// const ONLINE_METHOD = { value: "online", label: "Online Payment", ... }
// ─────────────────────────────────────────────────────────────────────────────

function BkashLogo() {
  return (
    <svg
      viewBox="0 0 110 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-8 w-auto"
    >
      <path d="M5 30 L16 12 L16 22 Z" fill="white" opacity="0.95" />
      <path d="M16 12 L27 7 L23 22 L16 22 Z" fill="white" opacity="0.85" />
      <path d="M16 22 L23 22 L19 30 L5 30 Z" fill="white" opacity="0.7" />
      <circle cx="16" cy="12" r="2" fill="white" />
      <text
        x="34"
        y="25"
        fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
        fontWeight="900"
        fontSize="15"
        fill="white"
        letterSpacing="0.2"
      >
        bKash
      </text>
    </svg>
  );
}

function NagadLogo() {
  return (
    <svg
      viewBox="0 0 110 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-8 w-auto"
    >
      <path
        d="M14 32 C14 32 4 24 7 14 C8.5 8 12 9.5 12 9.5 C12 9.5 9.5 4 14 2 C14 2 12 10 16.5 13 C17 10 20 11 20.5 14 C21.5 18 17 23 15 24.5 C16 22 20 19 17.5 26 C16.5 29 15 32 14 32 Z"
        fill="white"
        opacity="0.95"
      />
      <path
        d="M14 28 C14 28 9 23 11 17 C12 14 13.5 15 13.5 15 C13.5 15 12.5 12 15 10 C15 10 14 15 16.5 17 C17 15 18.5 16 19 18 C19.5 20.5 17 24 15.5 25 Z"
        fill="#F16821"
        opacity="0.35"
      />
      <text
        x="28"
        y="25"
        fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
        fontWeight="900"
        fontSize="15"
        fill="white"
        letterSpacing="0.2"
      >
        nagad
      </text>
    </svg>
  );
}

function RocketLogo() {
  return (
    <svg
      viewBox="0 0 110 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-8 w-auto"
    >
      <path d="M13 3 L24 19 L13 35 L2 19 Z" fill="white" opacity="0.95" />
      <circle cx="13" cy="19" r="6" fill="#8B2FC9" />
      <circle
        cx="13"
        cy="19"
        r="4"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        opacity="0.9"
      />
      <circle cx="13" cy="19" r="1.5" fill="white" />
      <text
        x="30"
        y="25"
        fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
        fontWeight="900"
        fontSize="15"
        fill="white"
        letterSpacing="0.2"
      >
        Rocket
      </text>
    </svg>
  );
}

const MOBILE_METHODS = [
  {
    value: "bkash",
    label: "bKash",
    brand: "#E2136E",
    activeBg: "#fce8f3",
    Logo: BkashLogo,
  },
  {
    value: "nagad",
    label: "Nagad",
    brand: "#F16821",
    activeBg: "#fef0e7",
    Logo: NagadLogo,
  },
  {
    value: "rocket",
    label: "Rocket",
    brand: "#8B2FC9",
    activeBg: "#f3e8fd",
    Logo: RocketLogo,
  },
];

export default function PaymentSelector({
  value,
  onChange,
  isLoading,
  onSubmit,
}) {
  return (
    <div>
      {/* ── Cash on Delivery ──────────────────────────────────────────────── */}
      <label
        className={`flex items-center gap-3 px-3.5 py-3 border rounded-lg cursor-pointer transition-colors ${
          value === "cash-on-delivery"
            ? "border-violet-400 bg-violet-50/40"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <input
          type="radio"
          name="paymentMethod"
          value="cash-on-delivery"
          checked={value === "cash-on-delivery"}
          onChange={() => onChange("cash-on-delivery")}
          className="w-4 h-4 accent-[#5B21B6] shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1F2937]">
            Cash on Delivery
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Pay when your order arrives
          </p>
        </div>
      </label>

      {/* ── Mobile Banking ──────────────────────────────────────────────────── */}
      <div className="mb-1 hidden">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2">
            Mobile Banking
          </span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {MOBILE_METHODS.map((m) => {
            const isActive = value === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => onChange(m.value)}
                className="relative flex flex-col items-center rounded-xl border-2 overflow-hidden transition-all cursor-pointer"
                style={{
                  borderColor: isActive ? m.brand : "#e5e7eb",
                  backgroundColor: isActive ? m.activeBg : "#fff",
                }}
              >
                {/* Brand color header strip */}
                <div
                  className="w-full flex items-center justify-center py-3 px-2"
                  style={{ backgroundColor: m.brand }}
                >
                  <m.Logo />
                </div>
                {/* Label + radio */}
                <div className="py-2 flex items-center gap-1.5">
                  <div
                    className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0`}
                    style={{ borderColor: isActive ? m.brand : "#d1d5db" }}
                  >
                    {isActive && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: m.brand }}
                      />
                    )}
                  </div>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: isActive ? m.brand : "#6b7280" }}
                  >
                    {m.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Place Order button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={isLoading}
        className="mt-4 w-full bg-[#5B21B6] text-white py-3 rounded-lg font-medium hover:bg-violet-700 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin w-4 h-4"
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
            Placing Order…
          </>
        ) : (
          "Place Order"
        )}
      </button>
    </div>
  );
}
