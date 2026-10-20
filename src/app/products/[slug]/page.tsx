import type { Metadata } from "next";
import ProductDetailClient from "./ProductDetailClient";
import { cachedFetch } from "@/lib/redis";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchProductData(slug: string) {
  const apiUrl = process.env.INTERNAL_API_URL || "http://127.0.0.1:8000/api";
  try {
    const data = await cachedFetch<{ product?: any }>(
      `aether:meta:product:${slug}`,
      async () => {
        const res = await fetch(`${apiUrl}/products/${slug}`, {
          signal: AbortSignal.timeout(4000),
          next: { revalidate: 300, tags: [`product:${slug}`, "products"] },
        });
        if (!res.ok) return {};
        return await res.json();
      },
      {
        ttlSeconds: 7200, // 2 hours
        tags: ["products"],
      }
    );
    return data?.product || null;
  } catch (err) {
    console.warn("Product data fetch notice:", err);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inhaliq.com";

  try {
    const product = await fetchProductData(slug);

    if (product) {
      const title = product.meta_title || product.name;
      const rawDesc = product.meta_description || product.short_description || product.description || `Explore ${product.name} specifications, finish variants, and customer reviews.`;
      const description = rawDesc.replace(/<[^>]*>?/gm, "").trim().slice(0, 160);
      const imageUrl = product.primary_image?.image_url || product.images?.[0]?.image_url || `${siteUrl}/favicon.ico`;
      const productUrl = `${siteUrl}/products/${slug}`;
      const imageAlt = product.primary_image?.alt_text || title;

      return {
        title,
        description,
        openGraph: {
          type: "website",
          url: productUrl,
          title,
          description,
          images: [
            {
              url: imageUrl,
              width: 800,
              height: 800,
              alt: imageAlt,
            },
          ],
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
          images: [imageUrl],
        },
      };
    }
  } catch (err) {
    console.warn("Product metadata dynamic fetch notice:", err);
  }

  return {
    title: "Product Details",
    description: "View product specifications, finish variants, and pricing.",
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await fetchProductData(slug);
  return <ProductDetailClient slug={slug} initialProduct={product} />;
}
