import type { Metadata } from "next";
import ProductCatalogClient from "@/app/products/ProductCatalogClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const brandSlug = resolvedParams.slug;
  const titleFormatted = brandSlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: `${titleFormatted} Official Store | Brand Catalog`,
    description: `Shop authentic ${titleFormatted} products with manufacturer warranty and direct dispatch.`,
    alternates: {
      canonical: `/brand/${brandSlug}`,
    },
  };
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inhaliq.com";
  const brandSlug = resolvedParams.slug;
  const titleFormatted = brandSlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${siteUrl}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Brands",
        item: `${siteUrl}/brands`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: titleFormatted,
        item: `${siteUrl}/brand/${brandSlug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <h1 className="sr-only">{titleFormatted} Official Brand Products</h1>
      <ProductCatalogClient overrideBrand={resolvedParams.slug} />
    </>
  );
}
