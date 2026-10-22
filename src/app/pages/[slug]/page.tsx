import type { Metadata } from "next";
import PublicCmsPageClient from "./PublicCmsPageClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inhaliq.com";
  const apiUrl = process.env.INTERNAL_API_URL || "http://127.0.0.1:8000/api";

  try {
    const res = await fetch(`${apiUrl}/pages/${slug}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const page = await res.json();
      if (page) {
        const title = page.title;
        const description = (page.content ? page.content.replace(/<[^>]*>?/gm, "") : `Read ${page.title} information.`).trim().slice(0, 160);
        const pageUrl = `${siteUrl}/pages/${slug}`;

        return {
          title,
          description,
          alternates: {
            canonical: pageUrl,
          },
          openGraph: {
            type: "website",
            url: pageUrl,
            title,
            description,
          },
          twitter: {
            card: "summary_large_image",
            title,
            description,
          },
        };
      }
    }
  } catch (err) {
    console.warn("CMS page metadata fetch notice:", err);
  }

  return {
    title: "Information Page",
    description: "Official store documentation and guidelines.",
  };
}

export default async function PublicCmsPage({ params }: PageProps) {
  const { slug } = await params;
  return <PublicCmsPageClient slug={slug} />;
}
