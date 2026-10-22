import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const apiUrl = process.env.INTERNAL_API_URL || "http://127.0.0.1:8000/api";
  let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inhaliq.com";

  try {
    const themeRes = await fetch(`${apiUrl}/theme-settings`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(3000),
    });
    if (themeRes.ok) {
      const themeData = await themeRes.json();
      if (themeData?.seo_meta?.canonical_base_url) {
        baseUrl = themeData.seo_meta.canonical_base_url.replace(/\/+$/, "");
      }
    }
  } catch (e) {
    // Fallback to default baseUrl
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/brands`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/promotions`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/shipping-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  // Dynamically fetch products
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${apiUrl}/products?per_page=500`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      const products = Array.isArray(data) ? data : (data?.data || []);
      productRoutes = products
        .filter((p: any) => p && p.slug)
        .map((p: any) => ({
          url: `${baseUrl}/products/${p.slug}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
          changeFrequency: "daily" as const,
          priority: 0.9,
        }));
    }
  } catch (err) {
    console.warn("Sitemap products fetch notice:", err);
  }

  // Dynamically fetch categories
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${apiUrl}/categories`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      const categories = Array.isArray(data) ? data : (data?.data || []);
      
      const flattenCategories = (cats: any[]): any[] => {
        let result: any[] = [];
        cats.forEach((cat) => {
          if (cat && cat.slug) {
            result.push(cat);
            if (cat.children && Array.isArray(cat.children)) {
              result = result.concat(flattenCategories(cat.children));
            }
          }
        });
        return result;
      };

      const allCats = flattenCategories(categories);
      categoryRoutes = allCats.map((c: any) => ({
        url: `${baseUrl}/category/${c.slug}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }
  } catch (err) {
    console.warn("Sitemap categories fetch notice:", err);
  }

  // Dynamically fetch brands
  let brandRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${apiUrl}/brands`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      const brands = Array.isArray(data) ? data : (data?.data || []);
      brandRoutes = brands
        .filter((b: any) => b && b.slug)
        .map((b: any) => ({
          url: `${baseUrl}/brand/${b.slug}`,
          lastModified: b.updated_at ? new Date(b.updated_at) : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }));
    }
  } catch (err) {
    console.warn("Sitemap brands fetch notice:", err);
  }

  // Dynamically fetch blog posts
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${apiUrl}/blog/posts?per_page=100`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      const posts = Array.isArray(data) ? data : (data?.data || []);
      blogRoutes = posts
        .filter((post: any) => post && post.slug)
        .map((post: any) => ({
          url: `${baseUrl}/blog/${post.slug}`,
          lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }));
    }
  } catch (err) {
    console.warn("Sitemap blog fetch notice:", err);
  }

  return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...brandRoutes, ...blogRoutes];
}
