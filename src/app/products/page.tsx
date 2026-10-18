import type { Metadata } from "next";
import ProductCatalogClient from "./ProductCatalogClient";

export const metadata: Metadata = {
  title: "All Products & Catalog",
  description: "Browse our entire collection of authentic disposable vapes, pod systems, replacement coils, and premium e-liquids.",
  openGraph: {
    type: "website",
    title: "All Products & Catalog",
    description: "Browse our entire collection of authentic disposable vapes, pod systems, replacement coils, and premium e-liquids.",
  },
  twitter: {
    card: "summary_large_image",
    title: "All Products & Catalog",
    description: "Browse our entire collection of authentic disposable vapes, pod systems, replacement coils, and premium e-liquids.",
  },
};

export default function ProductsPage() {
  return <ProductCatalogClient />;
}
