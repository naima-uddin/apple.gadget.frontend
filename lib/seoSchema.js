// Structured-data (JSON-LD schema.org) builders for SEO rich results.
//
// These are consumed by server components at build time and baked into the
// static HTML (output: "export" / out folder). Nothing here runs on the
// client or at request time, so it is fully compatible with static hosting.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://applebd.com";

export function stripHtml(s = "") {
  return String(s)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// product.availability enum → schema.org availability URL
const AVAILABILITY_MAP = {
  in_stock: "https://schema.org/InStock",
  pre_order: "https://schema.org/PreOrder",
  upcoming: "https://schema.org/PreOrder",
  out_of_stock: "https://schema.org/OutOfStock",
};

// Product rich result: price, availability, brand, ratings & reviews.
export function productJsonLd(product, { url, storeName } = {}) {
  if (!product) return null;

  const images = (product.images || []).map((i) => i?.url).filter(Boolean);
  const price =
    product.price ??
    (product.variants || []).find((v) => v?.price)?.price ??
    undefined;
  const brand = product.specs?.brand || product.department || undefined;
  const availability =
    AVAILABILITY_MAP[product.availability] || "https://schema.org/InStock";

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description:
      stripHtml(product.seo?.description || product.description || "").slice(
        0,
        300,
      ) || product.title,
    image: images.length ? images : [`${SITE_URL}/mainLogo.png`],
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.barcode ? { gtin: product.barcode } : {}),
    ...(brand ? { brand: { "@type": "Brand", name: brand } } : {}),
  };

  if (price != null) {
    schema.offers = {
      "@type": "Offer",
      url,
      priceCurrency: "BDT",
      price: Number(price),
      availability,
      ...(storeName
        ? { seller: { "@type": "Organization", name: storeName } }
        : {}),
      ...(product.flashSaleEndsAt
        ? {
            priceValidUntil: new Date(product.flashSaleEndsAt)
              .toISOString()
              .slice(0, 10),
          }
        : {}),
    };
  }

  if (product.reviewCount > 0 && product.averageRating > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.averageRating,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const reviews = (product.reviews || [])
    .filter((r) => r?.rating)
    .slice(0, 5)
    .map((r) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      author: { "@type": "Person", name: r.authorName || "Verified Buyer" },
      ...(r.body ? { reviewBody: stripHtml(r.body).slice(0, 500) } : {}),
      ...(r.createdAt
        ? { datePublished: new Date(r.createdAt).toISOString().slice(0, 10) }
        : {}),
    }));
  if (reviews.length) schema.review = reviews;

  return schema;
}

// Breadcrumb trail — items: [{ name, url }]
export function breadcrumbJsonLd(items = []) {
  const clean = items.filter((it) => it && it.name);
  if (!clean.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: clean.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      ...(it.url ? { item: it.url } : {}),
    })),
  };
}

// Category / collection landing page.
export function collectionJsonLd({ name, description, url } = {}) {
  if (!name) return null;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    ...(description ? { description: stripHtml(description).slice(0, 300) } : {}),
    ...(url ? { url } : {}),
  };
}

// Blog article rich result.
export function articleJsonLd(post, { url, storeName } = {}) {
  if (!post) return null;
  const image =
    post.featuredImage?.url || post.thumbnail || `${SITE_URL}/mainLogo.png`;
  const published = post.publishedAt || post.publishDate;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.seo?.title || post.title,
    description: stripHtml(post.seo?.description || post.excerpt || "").slice(
      0,
      300,
    ),
    image: [image],
    ...(url ? { mainEntityOfPage: { "@type": "WebPage", "@id": url } } : {}),
    author: { "@type": "Organization", name: storeName || "AppleBD" },
    publisher: {
      "@type": "Organization",
      name: storeName || "AppleBD",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/mainLogo.png` },
    },
    ...(published ? { datePublished: new Date(published).toISOString() } : {}),
    ...(post.updatedAt
      ? { dateModified: new Date(post.updatedAt).toISOString() }
      : {}),
  };
}
