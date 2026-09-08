/**
 * Consistent order ID shown across storefront and dashboard.
 *
 * Prefers the human-friendly sequential order number ("apl1001"). Accepts
 * either a full order object (recommended — reads `orderNumber`/`orderId`) or a
 * raw id string. Falls back to the legacy 8-char hash suffix (#A1B2C3D4) only
 * for any pre-migration order that has no number yet.
 */
export function formatOrderId(input, { hash = true } = {}) {
  if (input && typeof input === "object") {
    if (input.orderNumber) return input.orderNumber;
    if (typeof input.orderId === "string" && /^apl/i.test(input.orderId)) {
      return input.orderId;
    }
    input = input._id;
  }
  if (typeof input === "string" && /^apl/i.test(input)) return input;
  if (!input) return hash ? "#--------" : "--------";
  const suffix = String(input).slice(-8).toUpperCase();
  return hash ? `#${suffix}` : suffix;
}
