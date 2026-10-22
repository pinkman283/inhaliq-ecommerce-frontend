import type { Metadata } from "next";
import ContactClient from "./ContactClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inhaliq.com";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Inheliq customer care for fast WhatsApp support, order inquiries, and product guidance.",
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
  openGraph: {
    type: "website",
    title: "Contact Us | Inheliq",
    description: "Get in touch with Inheliq customer care for fast WhatsApp support, order inquiries, and product guidance.",
    url: `${siteUrl}/contact`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | Inheliq",
    description: "Get in touch with Inheliq customer care for fast WhatsApp support, order inquiries, and product guidance.",
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
