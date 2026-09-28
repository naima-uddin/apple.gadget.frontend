"use client";

import React from "react";
import {
  getVariantColors,
  getVariantSizes,
  getVariantExtraGroups,
  getAvailableValues,
  resolveVariantByAttrs,
  resolveVariant,
  resolvePriceForSelection,
} from "@/components/cart/VariantEditModal";

// Inline variant editor for an order line while editing an order. Renders
// Color + Size + every generic group (e.g. Type) as pill buttons, and on any
// change reports the resolved { color, size, attributes, price, variant } back
// so the caller can update the line and its unit price. Used by the thank-you
// and My-Orders order-edit forms and the dashboard order editor.
export default function OrderItemVariantEditor({
  product,
  color = null,
  size = null,
  attributes = null,
  onChange,
  accent = "dark", // "dark" | "orange"
  layout = "pills", // "pills" | "dropdown"
}) {
  if (!product?.variants?.length) return null;

  const colors = getVariantColors(product);
  const sizes = getVariantSizes(product);
  const extraGroups = getVariantExtraGroups(product);
  const attrs = attributes && typeof attributes === "object" ? attributes : {};

  if (!colors.length && !sizes.length && !extraGroups.length) return null;

  const selectedCls =
    accent === "orange"
      ? "bg-orange-500 text-white border-orange-500"
      : "bg-[#1D1D1F] text-white border-[#1D1D1F]";
  const idleCls =
    accent === "orange"
      ? "border-gray-300 text-gray-600 hover:border-orange-400"
      : "border-gray-300 text-gray-600 hover:border-gray-500";
  const disabledCls =
    "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed";

  const emit = (nextColor, nextSize, nextAttrs) => {
    const cleanAttrs = Object.fromEntries(
      Object.entries(nextAttrs || {}).filter(
        ([, v]) => v != null && String(v).trim(),
      ),
    );
    const price = resolvePriceForSelection(
      product,
      nextColor,
      nextSize,
      cleanAttrs,
    );
    const variant =
      resolveVariantByAttrs(product, {
        ...(nextColor ? { Color: nextColor } : {}),
        ...(nextSize ? { Size: nextSize } : {}),
        ...cleanAttrs,
      }) ||
      resolveVariantByAttrs(product, cleanAttrs) ||
      resolveVariant(product, nextColor, nextSize);
    onChange({
      color: nextColor,
      size: nextSize,
      attributes: Object.keys(cleanAttrs).length ? cleanAttrs : null,
      price,
      variant,
    });
  };

  const pickColor = (c) => emit(color === c ? null : c, size, attrs);
  const pickSize = (s) => emit(color, size === s ? null : s, attrs);
  const pickAttr = (group, value) => {
    const next = { ...attrs };
    if (next[group] === value) delete next[group];
    else next[group] = value;
    emit(color, size, next);
  };

  const fullSelection = {
    ...(color ? { Color: color } : {}),
    ...(size ? { Size: size } : {}),
    ...attrs,
  };

  // ── Dropdown layout (compact — manual order create, checkout, dashboard) ──
  if (layout === "dropdown") {
    const setColor = (v) => emit(v || null, size, attrs);
    const setSize = (v) => emit(color, v || null, attrs);
    const setAttr = (group, v) => {
      const next = { ...attrs };
      if (!v) delete next[group];
      else next[group] = v;
      emit(color, size, next);
    };
    const selectCls =
      "text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-gray-500 bg-white max-w-full";

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {colors.length > 0 && (
          <select
            value={color || ""}
            onChange={(e) => setColor(e.target.value)}
            className={selectCls}
          >
            <option value="">Color</option>
            {colors.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        {sizes.length > 0 && (
          <select
            value={size || ""}
            onChange={(e) => setSize(e.target.value)}
            className={selectCls}
          >
            <option value="">Size</option>
            {sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
        {extraGroups.map((group) => {
          const available = getAvailableValues(
            product,
            group.name,
            fullSelection,
          );
          return (
            <select
              key={group.name}
              value={attrs[group.name] || ""}
              onChange={(e) => setAttr(group.name, e.target.value)}
              className={selectCls}
            >
              <option value="">{group.name}</option>
              {group.options.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  disabled={
                    available.size > 0 &&
                    !available.has(opt.value.toLowerCase())
                  }
                >
                  {opt.value}
                </option>
              ))}
            </select>
          );
        })}
      </div>
    );
  }

  const pill = "px-1.5 py-0.5 rounded-full text-xs border transition";

  return (
    <div className="space-y-1.5">
      {colors.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-xs text-gray-400">Color:</span>
          {colors.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => pickColor(c.name)}
              className={`${pill} ${color === c.name ? selectedCls : idleCls}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
      {sizes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-xs text-gray-400">Size:</span>
          {sizes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => pickSize(s)}
              className={`${pill} font-mono ${size === s ? selectedCls : idleCls}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      {extraGroups.map((group) => {
        const available = getAvailableValues(product, group.name, fullSelection);
        return (
          <div key={group.name} className="flex flex-wrap items-center gap-1">
            <span className="text-xs text-gray-400">{group.name}:</span>
            {group.options.map((opt) => {
              const isSel = attrs[group.name] === opt.value;
              const disabled =
                available.size > 0 && !available.has(opt.value.toLowerCase());
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => pickAttr(group.name, opt.value)}
                  className={`${pill} ${
                    isSel ? selectedCls : disabled ? disabledCls : idleCls
                  }`}
                >
                  {opt.value}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
