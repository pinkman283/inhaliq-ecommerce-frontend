import type { Metadata } from "next";
import ProductCatalogClient from "./ProductCatalogClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inhaliq.com";

export const metadata: Metadata = {
  title: "All Products & Catalog",
  description: "Browse our entire collection of authentic disposable vapes, pod systems, replacement coils, and premium e-liquids.",
  alternates: {
    canonical: `${siteUrl}/products`,
  },
  openGraph: {
    type: "website",
    title: "All Products & Catalog",
    description: "Browse our entire collection of authentic disposable vapes, pod systems, replacement coils, and premium e-liquids.",
    url: `${siteUrl}/products`,
  },
  twitter: {
    card: "summary_large_image",
    title: "All Products & Catalog",
    description: "Browse our entire collection of authentic disposable vapes, pod systems, replacement coils, and premium e-liquids.",
  },
};

export default function ProductsPage() {
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
        name: "Products",
        item: `${siteUrl}/products`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <h1 className="sr-only">Complete Product Catalog &amp; Collection</h1>
      <ProductCatalogClient />
    </>
  );
}
