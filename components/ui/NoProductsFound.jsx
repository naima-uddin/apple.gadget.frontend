import Image from "next/image";

// Shared empty state for product lists. The illustration already carries the
// "Sorry, No Products found!" text; pass `message` for extra context
// (e.g. the search query) and `compact` for tighter spots like dashboard tables.
export default function NoProductsFound({
  message = null,
  compact = false,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "py-8" : "py-16"
      } ${className}`}
    >
      <Image
        src="/no-product.png"
        alt="No products found"
        width={480}
        height={240}
        className={`h-auto object-contain ${compact ? "w-52" : "w-64 md:w-80"}`}
      />
      {message && (
        <p className="mt-3 text-sm md:text-base text-[#6B7280]">{message}</p>
      )}
    </div>
  );
}
