import type { Metadata } from "next";
import ProductCatalogClient from "@/app/products/ProductCatalogClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const rawSlug = resolvedParams.slug[resolvedParams.slug.length - 1] || "catalog";
  const titleFormatted = rawSlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: `${titleFormatted} Collection | Store Catalog`,
    description: `Explore our premium selection of ${titleFormatted} products with fast worldwide shipping.`,
    alternates: {
      canonical: `/category/${resolvedParams.slug.join("/")}`,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const resolvedParams = await params;
  // If nested category e.g. ["audio", "headphones"], the target category filter is the leaf slug
  const targetCategorySlug = resolvedParams.slug[resolvedParams.slug.length - 1];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inhaliq.com";
  const slugSegments = resolvedParams.slug || [];

  const rawSlug = targetCategorySlug || "catalog";
  const titleFormatted = rawSlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const breadcrumbItems = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: `${siteUrl}/`,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Categories",
      item: `${siteUrl}/products`,
    },
  ];

  let currentPath = `${siteUrl}/category`;
  slugSegments.forEach((segment, idx) => {
    currentPath += `/${segment}`;
    const name = segment
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    breadcrumbItems.push({
      "@type": "ListItem",
      position: idx + 3,
      name,
      item: currentPath,
    });
  });

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <h1 className="sr-only">{titleFormatted} Category Collection</h1>
      <ProductCatalogClient overrideCategory={targetCategorySlug} />
    </>
  );
}
