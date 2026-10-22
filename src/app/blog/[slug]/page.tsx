import type { Metadata } from "next";
import BlogPostClient from "./BlogPostClient";
import { cachedFetch } from "@/lib/redis";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchBlogPostData(slug: string) {
  const apiUrl = process.env.INTERNAL_API_URL || "http://127.0.0.1:8000/api";
  try {
    return await cachedFetch<any>(
      `aether:meta:blog:${slug}`,
      async () => {
        const res = await fetch(`${apiUrl}/blog/posts/${slug}`, {
          signal: AbortSignal.timeout(4000),
          next: { revalidate: 3600, tags: [`blog:${slug}`, "blog"] },
        });
        if (!res.ok) return null;
        return await res.json();
      },
      {
        ttlSeconds: 21600, // 6 hours
        tags: ["blog"],
      }
    );
  } catch (err) {
    console.warn("Blog post fetch notice:", err);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inhaliq.com";

  try {
    const post = await fetchBlogPostData(slug);

    if (post) {
      const title = post.meta_title || post.title;
      const description = post.meta_description || (post.excerpt || post.content ? (post.excerpt || post.content).replace(/<[^>]*>?/gm, "") : `Read ${post.title} on the official newsroom.`).trim().slice(0, 160);
      const imageUrl = post.featured_image || `${siteUrl}/favicon.ico`;
      const imageAlt = post.featured_image_alt || title;
      const canonicalUrl = `${siteUrl}/blog/${slug}`;

      return {
        title,
        description,
        alternates: {
          canonical: canonicalUrl,
        },
        openGraph: {
          type: "article",
          url: canonicalUrl,
          title,
          description,
          images: [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
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
    console.warn("Blog post metadata fetch notice:", err);
  }

  return {
    title: "Article Details",
    description: "Read technical guides, engineering notes, and acoustic reviews.",
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inhaliq.com";
  const post = await fetchBlogPostData(slug);

  let blogSchema: any = null;
  let breadcrumbSchema: any = null;

  if (post) {
    const title = post.meta_title || post.title;
    const description = (post.meta_description || post.excerpt || post.content || "").replace(/<[^>]*>?/gm, "").trim().slice(0, 160);
    const postUrl = `${siteUrl}/blog/${slug}`;
    const imageUrl = post.featured_image || `${siteUrl}/branding/logo.png`;

    blogSchema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: title,
      description,
      image: [imageUrl],
      datePublished: post.published_at || post.created_at || new Date().toISOString(),
      dateModified: post.updated_at || post.published_at || post.created_at || new Date().toISOString(),
      author: {
        "@type": "Person",
        name: post.author?.name || "Editorial Team",
      },
      publisher: {
        "@type": "Organization",
        name: "INHALIQ",
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/branding/logo.png`,
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": postUrl,
      },
    };

    breadcrumbSchema = {
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
          name: "Blog",
          item: `${siteUrl}/blog`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: title,
          item: postUrl,
        },
      ],
    };
  }

  return (
    <>
      {blogSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <BlogPostClient slug={slug} />
    </>
  );
}
