// Renders one or more schema.org JSON-LD blocks into the document.
// Server component — the markup is baked into the static HTML at build time,
// so it works with the `out` folder static export (no client JS involved).
export default function JsonLd({ data }) {
  const items = (Array.isArray(data) ? data : [data]).filter(Boolean);
  if (!items.length) return null;
  return (
    <>
      {items.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }}
        />
      ))}
    </>
  );
}
