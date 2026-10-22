import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://inhaliq.com").replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/dashboard",
          "/dashboard/*",
          "/api",
          "/api/*",
          "/checkout",
          "/checkout/*",
          "/order-confirmed",
          "/order-confirmed/*",
          "/login",
          "/register",
          "/signup",
          "/track",
        ],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/", "/products/*", "/storage/*", "/images/*"],
        disallow: ["/admin/*", "/dashboard/*"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
