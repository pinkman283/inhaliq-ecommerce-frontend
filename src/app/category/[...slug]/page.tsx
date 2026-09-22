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

  return <ProductCatalogClient overrideCategory={targetCategorySlug} />;
}
