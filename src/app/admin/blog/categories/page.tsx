"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminContentBlogPage from "@/app/admin/content/blog/page";

/**
 * Legacy route alias for /admin/blog/categories
 * Canonical route: /admin/content/blog?tab=categories
 * Preserves 100% backward compatibility for bookmarks and direct links.
 */
function LegacyCategoriesRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get("tab") !== "categories") {
      params.set("tab", "categories");
      router.replace(`/admin/content/blog?${params.toString()}`);
    }
  }, [router, searchParams]);

  return <AdminContentBlogPage />;
}

export default function AdminBlogCategoriesLegacyPage() {
  return (
    <React.Suspense fallback={null}>
      <LegacyCategoriesRedirect />
    </React.Suspense>
  );
}
