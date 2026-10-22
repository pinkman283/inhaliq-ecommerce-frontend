import type { Metadata } from "next";
import AboutClient from "./AboutClient";

export async function generateMetadata(): Promise<Metadata> {
  const apiUrl = process.env.INTERNAL_API_URL || "http://127.0.0.1:8000/api";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inhaliq.com";

  try {
    const res = await fetch(`${apiUrl}/pages/about-us`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const page = await res.json();
      if (page) {
        return {
          title: page.meta_title || page.title || "About Us",
          description: page.meta_description || "Learn about our brand philosophy, authentic products, and customer commitment.",
          alternates: {
            canonical: `${siteUrl}/about`,
          },
        };
      }
    }
  } catch {}

  return {
    title: "About Us | Authentic Vaping Hardware & E-Liquids",
    description: "Learn about our brand philosophy, verified authentic products, and customer commitment.",
    alternates: {
      canonical: `${siteUrl}/about`,
    },
  };
}

export default function AboutPage() {
  return <AboutClient />;
}
