import type { Metadata } from "next";
import BlogCatalogClient from "./BlogCatalogClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inhaliq.com";

export const metadata: Metadata = {
  title: "Blog & Guides | INHALIQ Journal",
  description: "Explore in-depth product guides, device care tips, authentic reviews, and official announcements from the INHALIQ team.",
  alternates: {
    canonical: `${siteUrl}/blog`,
  },
  openGraph: {
    type: "website",
    title: "Blog & Guides | INHALIQ Journal",
    description: "Explore in-depth product guides, device care tips, authentic reviews, and official announcements from the INHALIQ team.",
    url: `${siteUrl}/blog`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog & Guides | INHALIQ Journal",
    description: "Explore in-depth product guides, device care tips, authentic reviews, and official announcements from the INHALIQ team.",
  },
};

export default function BlogPage() {
  return <BlogCatalogClient />;
}
