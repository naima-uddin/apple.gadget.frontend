"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/components/context/UserContext";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

const DEFAULT_BG = "#1D1D1F";
const DEFAULT_BUTTON = "#1D1D1F";
const DEFAULT_TEXT = "#FFFFFF";
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const safeColor = (value, fallback) => (HEX_RE.test(value) ? value : fallback);

const BLANK = {
  highlight: "",
  subtitle: "",
  couponCode: "",
  bgColor: DEFAULT_BG,
  buttonColor: DEFAULT_BUTTON,
  textColor: DEFAULT_TEXT,
  isActive: true,
  // Functional coupon fields
  discountType: "fixed",
  discountValue: 0,
  minOrderAmount: 0,
  maxDiscountAmount: 0,
  isFirstOrderOnly: false,
  isNewUserOnly: false,
  maxUsesTotal: 0,
  maxUsesPerUser: 0,
  stackable: false,
  expiresAt: "",
};

const inp =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400";
const lbl = "block text-sm font-medium text-gray-700 mb-1";

const EDGE_NOTCHES = [8, 26, 44, 62, 80, 98];

function TicketEdge({ side }) {
  return EDGE_NOTCHES.map((top) => (
    <div
      key={`${side}-${top}`}
      className={`absolute w-3.5 h-3.5 bg-white rounded-full z-10 -translate-y-1/2 ${
        side === "left" ? "-left-1.75" : "-right-1.75"
      }`}
      style={{ top: `${top}%` }}
    />
  ));
}

function ColorField({ label, value, onChange, fallback }) {
  const handleTextChange = (raw) => {
    const hex = raw.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    onChange(hex ? `#${hex}` : "");
  };
  return (
    <div>
      <label className={lbl}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={safeColor(value, fallback)}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5 shrink-0"
        />
        <input
          type="text"
          className={`${inp} font-mono uppercase`}
          value={value}
          onChange={(e) => handleTextChange(e.target.value)}
          autoComplete="off"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

function OfferCard({ offer }) {
  const bg = safeColor(offer.bgColor, DEFAULT_BG);
  const buttonColor = safeColor(offer.buttonColor, DEFAULT_BUTTON);
  const textColor = safeColor(offer.textColor, DEFAULT_TEXT);
  return (
    <div
      className="relative flex rounded-2xl overflow-hidden h-44 shadow-lg"
      style={{ backgroundColor: bg }}
    >
      {/* Scalloped tear edges on the two outer short sides */}
      <TicketEdge side="left" />
      <TicketEdge side="right" />

      {/* Ticket-perforation notches on the seam between the stub and the body */}
      <div className="absolute -top-3 left-16 -translate-x-1/2 w-6 h-6 bg-white rounded-full z-10" />
      <div className="absolute -bottom-3 left-16 -translate-x-1/2 w-6 h-6 bg-white rounded-full z-10" />
      <div
        className="absolute left-16 -translate-x-1/2 top-0 bottom-0 w-0.5 border-l-2 border-dashed"
        style={{ borderColor: `${buttonColor}80` }}
      />

      {/* Ticket stub: vertical COUPON label */}
      <div className="w-16 shrink-0 flex items-center justify-center">
        <span
          className="text-[10px] font-bold tracking-[0.3em] uppercase whitespace-nowrap opacity-30"
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            color: textColor,
          }}
        >
          COUPON • COUPON • COUPON
        </span>
      </div>

      {/* Ticket body: title, subtitle, coupon code */}
      <div className="flex-1 min-w-0 flex flex-col justify-center px-5 py-4">
        <h2
          className="text-xl sm:text-2xl font-extrabold uppercase leading-tight"
          style={{ color: textColor }}
        >
          {offer.highlight || "—"}
        </h2>
        {offer.subtitle && (
          <p
            className="text-xs mt-1 truncate opacity-70"
            style={{ color: textColor }}
          >
            {offer.subtitle}
          </p>
        )}
        {offer.couponCode && (
          <span
            className="mt-2 inline-flex items-center gap-1.5 self-start rounded-md px-3 py-1.5 text-[11px] font-bold tracking-wide text-white"
            style={{ backgroundColor: buttonColor }}
          >
            <span className="opacity-80">USE CODE:</span>
            <span className="truncate max-w-[8rem]">{offer.couponCode}</span>
          </span>
        )}
      </div>
    </div>
  );
}

const BLANK_SECTION_TITLE = {
  highlight: "",
  rest: "",
  highlightBn: "",
  restBn: "",
};

export default function DiscountsManager() {
  const { user } = useUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = closed, 'new' or item._id
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [showFunctional, setShowFunctional] = useState(false);
  const [sectionTitle, setSectionTitle] = useState(BLANK_SECTION_TITLE);
  const [sectionTitleSaving, setSectionTitleSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/discounts`, {
        credentials: "include",
      });
      const d = await r.json();
      setItems(d.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadSectionTitle = async () => {
    try {
      const r = await fetch(`${API}/api/admin/settings`, {
        credentials: "include",
      });
      const d = await r.json();
      if (d.settings?.offersTitle) {
        setSectionTitle({ ...BLANK_SECTION_TITLE, ...d.settings.offersTitle });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
    loadSectionTitle();
  }, []);

  const saveSectionTitle = async () => {
    setSectionTitleSaving(true);
    try {
      const r = await fetch(`${API}/api/admin/settings`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offersTitle: sectionTitle }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Save failed");
    } catch (e) {
      alert(e.message);
    } finally {
      setSectionTitleSaving(false);
    }
  };

  const openNew = () => {
    setForm(BLANK);
    setEditing("new");
    setShowFunctional(false);
  };
  const openEdit = (item) => {
    setForm({
      ...item,
      expiresAt: item.expiresAt
        ? new Date(item.expiresAt).toISOString().slice(0, 16)
        : "",
    });
    setEditing(item._id);
    setShowFunctional(!!item.couponCode);
  };
  const closeForm = () => {
    setEditing(null);
    setForm(BLANK);
  };

  const handleSave = async () => {
    if (!form.highlight.trim()) {
      alert("Title is required.");
      return;
    }
    setSaving(true);
    try {
      const isNew = editing === "new";
      const url = isNew
        ? `${API}/api/admin/discounts`
        : `${API}/api/admin/discounts/${editing}`;

      const payload = {
        ...form,
        bgColor: safeColor(form.bgColor, DEFAULT_BG),
        buttonColor: safeColor(form.buttonColor, DEFAULT_BUTTON),
        textColor: safeColor(form.textColor, DEFAULT_TEXT),
      };
      if (payload.expiresAt) {
        payload.expiresAt = new Date(payload.expiresAt).toISOString();
      } else {
        payload.expiresAt = null;
      }

      const r = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Save failed");
      await load();
      closeForm();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this offer?")) return;
    try {
      await fetch(`${API}/api/admin/discounts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setItems((p) => p.filter((i) => i._id !== id));
    } catch (e) {
      alert("Delete failed");
    }
  };

  const toggleActive = async (item) => {
    try {
      const r = await fetch(`${API}/api/admin/discounts/${item._id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      const d = await r.json();
      if (d.ok)
        setItems((p) => p.map((i) => (i._id === item._id ? d.item : i)));
    } catch (e) {
      console.error(e);
    }
  };

  const move = async (index, dir) => {
    const next = [...items];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    const reordered = next.map((it, i) => ({ ...it, order: i }));
    setItems(reordered);
    try {
      await fetch(`${API}/api/admin/discounts-reorder`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          reordered.map(({ _id, order }) => ({ _id, order })),
        ),
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F2937] work-sans">
            Discounts & Coupons
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage offer cards and functional coupon codes. Coupons with codes
            can be applied at checkout.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-[#1D1D1F] text-sm font-medium shrink-0"
        >
          <span className="text-lg leading-none">+</span> Add Offer/Coupon
        </button>
      </div>

      {/* Homepage section title */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Section Title
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Shown above the offer cards on the homepage, e.g. "OFFERS! You
            Can't Miss!!".
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Highlighted Word (English)</label>
            <input
              className={inp}
              value={sectionTitle.highlight}
              onChange={(e) =>
                setSectionTitle((p) => ({ ...p, highlight: e.target.value }))
              }
              placeholder="e.g. OFFERS!"
            />
          </div>
          <div>
            <label className={lbl}>Rest of Title (English)</label>
            <input
              className={inp}
              value={sectionTitle.rest}
              onChange={(e) =>
                setSectionTitle((p) => ({ ...p, rest: e.target.value }))
              }
              placeholder="e.g. You Can't Miss!!"
            />
          </div>
          <div>
            <label className={lbl}>Highlighted Word (Bangla)</label>
            <input
              className={inp}
              value={sectionTitle.highlightBn}
              onChange={(e) =>
                setSectionTitle((p) => ({
                  ...p,
                  highlightBn: e.target.value,
                }))
              }
              placeholder="e.g. অফার!"
            />
          </div>
          <div>
            <label className={lbl}>Rest of Title (Bangla)</label>
            <input
              className={inp}
              value={sectionTitle.restBn}
              onChange={(e) =>
                setSectionTitle((p) => ({ ...p, restBn: e.target.value }))
              }
              placeholder="e.g. মিস করবেন না!!"
            />
          </div>
        </div>
        <button
          onClick={saveSectionTitle}
          disabled={sectionTitleSaving}
          className="px-5 py-2 bg-gray-800 text-white rounded-lg hover:bg-[#1D1D1F] text-sm font-medium disabled:opacity-60"
        >
          {sectionTitleSaving ? "Saving…" : "Save Title"}
        </button>
      </div>

      {/* Inline form */}
      {editing !== null && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-800">
            {editing === "new" ? "New Offer/Coupon" : "Edit Offer/Coupon"}
          </h2>

          {/* Display fields */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Display Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  className={inp}
                  value={form.highlight}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, highlight: e.target.value }))
                  }
                  placeholder="e.g. Get Extra 15% Off"
                />
              </div>
              <div>
                <label className={lbl}>Subtitle</label>
                <input
                  className={inp}
                  value={form.subtitle}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, subtitle: e.target.value }))
                  }
                  placeholder="e.g. On purchase of 2+ styles"
                />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Card Colors
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ColorField
                  label="Card Background"
                  value={form.bgColor}
                  fallback={DEFAULT_BG}
                  onChange={(v) =>
                    setForm((p) => ({ ...p, bgColor: v }))
                  }
                />
                <ColorField
                  label="Button Color"
                  value={form.buttonColor}
                  fallback={DEFAULT_BUTTON}
                  onChange={(v) =>
                    setForm((p) => ({ ...p, buttonColor: v }))
                  }
                />
                <ColorField
                  label="Text Color"
                  value={form.textColor}
                  fallback={DEFAULT_TEXT}
                  onChange={(v) =>
                    setForm((p) => ({ ...p, textColor: v }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Coupon Code */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wide">
              Coupon Code
            </h3>
            <div>
              <label className={lbl}>
                Coupon Code{" "}
                <span className="text-xs text-gray-400">
                  (enter a code to make this a functional coupon)
                </span>
              </label>
              <input
                className={`${inp} uppercase font-mono`}
                value={form.couponCode}
                onChange={(e) => {
                  const code = e.target.value.toUpperCase();
                  setForm((p) => ({ ...p, couponCode: code }));
                  if (code) setShowFunctional(true);
                }}
                placeholder="e.g. SAVE150, NEWUSER26"
              />
            </div>

            {form.couponCode && (
              <button
                type="button"
                onClick={() => setShowFunctional(!showFunctional)}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {showFunctional
                  ? "Hide functional settings"
                  : "Show functional settings"}
              </button>
            )}
          </div>

          {/* Functional coupon fields */}
          {form.couponCode && showFunctional && (
            <div className="bg-green-50 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-semibold text-green-800 uppercase tracking-wide">
                Coupon Functional Settings
              </h3>
              <p className="text-xs text-green-700">
                These settings control how the coupon actually works when
                applied at checkout.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={lbl}>Discount Type</label>
                  <select
                    className={inp}
                    value={form.discountType}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, discountType: e.target.value }))
                    }
                  >
                    <option value="fixed">Fixed Amount (৳)</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>

                {form.discountType !== "free_shipping" && (
                  <div>
                    <label className={lbl}>
                      Discount Value{" "}
                      {form.discountType === "percentage" ? "(%)" : "(৳)"}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={inp}
                      value={form.discountValue === 0 ? "" : form.discountValue}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, "");
                        setForm((p) => ({
                          ...p,
                          discountValue: val === "" ? 0 : parseFloat(val) || 0,
                        }));
                      }}
                      placeholder={
                        form.discountType === "percentage"
                          ? "e.g. 10"
                          : "e.g. 150"
                      }
                    />
                  </div>
                )}

                <div>
                  <label className={lbl}>Minimum Order Amount (৳)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={inp}
                    value={form.minOrderAmount === 0 ? "" : form.minOrderAmount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, "");
                      setForm((p) => ({
                        ...p,
                        minOrderAmount: val === "" ? 0 : parseFloat(val) || 0,
                      }));
                    }}
                    placeholder="e.g. 800"
                  />
                </div>

                {form.discountType === "percentage" && (
                  <div>
                    <label className={lbl}>
                      Max Discount Cap (৳){" "}
                      <span className="text-xs text-gray-400">
                        (0 = no cap)
                      </span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={inp}
                      value={
                        form.maxDiscountAmount === 0
                          ? ""
                          : form.maxDiscountAmount
                      }
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, "");
                        setForm((p) => ({
                          ...p,
                          maxDiscountAmount:
                            val === "" ? 0 : parseFloat(val) || 0,
                        }));
                      }}
                      placeholder="e.g. 200"
                    />
                  </div>
                )}

                <div>
                  <label className={lbl}>
                    Max Total Uses{" "}
                    <span className="text-xs text-gray-400">
                      (0 = unlimited)
                    </span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={inp}
                    value={form.maxUsesTotal === 0 ? "" : form.maxUsesTotal}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setForm((p) => ({
                        ...p,
                        maxUsesTotal: val === "" ? 0 : parseInt(val) || 0,
                      }));
                    }}
                    placeholder="e.g. 100"
                  />
                </div>

                <div>
                  <label className={lbl}>
                    Max Uses Per User{" "}
                    <span className="text-xs text-gray-400">
                      (0 = unlimited)
                    </span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={inp}
                    value={form.maxUsesPerUser === 0 ? "" : form.maxUsesPerUser}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setForm((p) => ({
                        ...p,
                        maxUsesPerUser: val === "" ? 0 : parseInt(val) || 0,
                      }));
                    }}
                    placeholder="e.g. 1"
                  />
                </div>

                <div>
                  <label className={lbl}>
                    Expires At{" "}
                    <span className="text-xs text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    className={inp}
                    value={form.expiresAt}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, expiresAt: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isNewUserOnly}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        isNewUserOnly: e.target.checked,
                      }))
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">
                    New users only (registered &lt; 30 days)
                  </span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFirstOrderOnly}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        isFirstOrderOnly: e.target.checked,
                      }))
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">
                    First order only
                  </span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.stackable}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, stackable: e.target.checked }))
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">
                    allowMultiple (can combine with other coupons)
                  </span>
                </label>
              </div>

              {form.usageCount > 0 && (
                <p className="text-xs text-gray-500">
                  This coupon has been used {form.usageCount} time(s).
                </p>
              )}
            </div>
          )}

          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm((p) => ({ ...p, isActive: e.target.checked }))
              }
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">
              Active (visible on homepage & usable at checkout)
            </span>
          </label>

          {/* Live preview */}
          <div>
            <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">
              Live Preview
            </p>
            <div className="max-w-sm">
              <OfferCard offer={form} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-gray-800 text-white rounded-lg hover:bg-[#1D1D1F] text-sm font-medium disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={closeForm}
              className="px-5 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Offers list */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
          No offers yet. Click <strong>+ Add Offer/Coupon</strong> to create
          one.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={item._id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start"
            >
              {/* Reorder */}
              <div className="flex md:flex-col gap-1 shrink-0">
                <button
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-500"
                >
                  ▲
                </button>
                <button
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-500"
                >
                  ▼
                </button>
              </div>

              {/* Card preview */}
              <div className="flex-1 min-w-0">
                <OfferCard offer={item} />
                {item.couponCode && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-lg">
                      {item.discountType === "free_shipping"
                        ? "Free Shipping"
                        : item.discountType === "percentage"
                          ? `${item.discountValue}% off`
                          : `৳${item.discountValue} off`}
                    </span>
                    {item.minOrderAmount > 0 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg">
                        Min: ৳{item.minOrderAmount}
                      </span>
                    )}
                    {item.isNewUserOnly && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-lg">
                        New Users
                      </span>
                    )}
                    {item.isFirstOrderOnly && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-lg">
                        First Order
                      </span>
                    )}
                    {item.stackable && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-lg">
                        allowMultiple
                      </span>
                    )}
                    {item.usageCount > 0 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg">
                        Used: {item.usageCount}x
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex md:flex-col gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(item)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    item.isActive
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {item.isActive ? "Active" : "Inactive"}
                </button>
                <button
                  onClick={() => openEdit(item)}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium"
                >
                  Edit
                </button>
                {user?.role === "admin" && (
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
