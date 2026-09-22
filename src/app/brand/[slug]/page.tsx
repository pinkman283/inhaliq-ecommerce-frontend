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

  return <ProductCatalogClient overrideBrand={resolvedParams.slug} />;
}
