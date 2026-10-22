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
        alternates: {
          canonical: productUrl,
        },
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inhaliq.com";

  let productSchema: any = null;
  let breadcrumbSchema: any = null;

  if (product) {
    const title = product.meta_title || product.name;
    const rawDesc = product.meta_description || product.short_description || product.description || `Explore ${product.name} specifications, finish variants, and customer reviews.`;
    const cleanDescription = rawDesc.replace(/<[^>]*>?/gm, "").trim();
    const productUrl = `${siteUrl}/products/${slug}`;
    const images: string[] = [];
    if (product.primary_image?.image_url) images.push(product.primary_image.image_url);
    if (Array.isArray(product.images)) {
      product.images.forEach((img: any) => {
        if (img?.image_url && !images.includes(img.image_url)) {
          images.push(img.image_url);
        }
      });
    }
    if (images.length === 0) images.push(`${siteUrl}/favicon.ico`);

    const isOutOfStock = product.stock_quantity === 0 || product.in_stock === false;
    const currency = product.currency || "BDT";
    const brandName = typeof product.brand === "string" ? product.brand : product.brand?.name || "INHALIQ";

    productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      image: images,
      description: cleanDescription,
      sku: product.sku || `PRD-${product.id || slug}`,
      mpn: product.sku || `MPN-${product.id || slug}`,
      brand: {
        "@type": "Brand",
        name: brandName,
      },
      offers: {
        "@type": "Offer",
        url: productUrl,
        priceCurrency: currency,
        price: Number(product.price) || 0,
        priceValidUntil: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
        itemCondition: "https://schema.org/NewCondition",
        availability: isOutOfStock
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
        seller: {
          "@type": "Organization",
          name: brandName,
        },
      },
      ...(product.rating_average && product.review_count
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: Number(product.rating_average),
              reviewCount: Number(product.review_count),
              bestRating: 5,
              worstRating: 1,
            },
          }
        : {}),
    };

    const categoryItem = product.category || (Array.isArray(product.categories) ? product.categories[0] : null);
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
        name: "Products",
        item: `${siteUrl}/products`,
      },
    ];

    if (categoryItem && categoryItem.slug) {
      breadcrumbItems.push({
        "@type": "ListItem",
        position: 3,
        name: categoryItem.name || categoryItem.slug,
        item: `${siteUrl}/category/${categoryItem.slug}`,
      });
      breadcrumbItems.push({
        "@type": "ListItem",
        position: 4,
        name: product.name,
        item: productUrl,
      });
    } else {
      breadcrumbItems.push({
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: productUrl,
      });
    }

    breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems,
    };
  }

  return (
    <>
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <ProductDetailClient slug={slug} initialProduct={product} />
    </>
  );
}
