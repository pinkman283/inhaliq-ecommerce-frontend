import type { Metadata } from "next";
import FaqClient, { FAQS } from "./FaqClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inhaliq.com";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Clear answers regarding order dispatch, delivery timelines, product authenticity, and payment methods.",
  alternates: {
    canonical: `${siteUrl}/faq`,
  },
  openGraph: {
    type: "website",
    title: "Frequently Asked Questions",
    description: "Clear answers regarding order dispatch, delivery timelines, product authenticity, and payment methods.",
    url: `${siteUrl}/faq`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Frequently Asked Questions",
    description: "Clear answers regarding order dispatch, delivery timelines, product authenticity, and payment methods.",
  },
};

export default function FAQPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

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
        name: "FAQ",
        item: `${siteUrl}/faq`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <FaqClient />
    </>
  );
}
