// Human-readable variant line for an item, e.g. "Black / XL / Type: 8 Pin".
// Accepts both cart-item shapes (selectedColor/selectedSize/selectedAttributes)
// and order/DB-item shapes (color/size/attributes + legacy attrGroup/attrValue).
// The `attributes` value may be a plain object or a Mongoose Map (from an API
// response it is a plain object). Returns "" when there is nothing to show.
export function variantLabel(src = {}) {
  const color = src.color ?? src.selectedColor ?? null;
  const size = src.size ?? src.selectedSize ?? null;
  const parts = [color, size].filter(Boolean);

  const attrs = src.attributes ?? src.selectedAttributes ?? null;
  const entries =
    attrs instanceof Map
      ? [...attrs.entries()]
      : attrs && typeof attrs === "object"
        ? Object.entries(attrs)
        : [];
  const clean = entries.filter(([, v]) => v != null && String(v).trim());

  if (clean.length) {
    clean.forEach(([g, v]) => parts.push(`${g}: ${v}`));
  } else if (src.attrGroup && src.attrValue) {
    parts.push(`${src.attrGroup}: ${src.attrValue}`);
  }
  return parts.join(" / ");
}
