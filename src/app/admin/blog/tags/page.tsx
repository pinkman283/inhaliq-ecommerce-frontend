"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminContentBlogPage from "@/app/admin/content/blog/page";

/**
 * Legacy route alias for /admin/blog/tags
 * Canonical route: /admin/content/blog?tab=tags
 * Preserves 100% backward compatibility for bookmarks and direct links.
 */
function LegacyTagsRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get("tab") !== "tags") {
      params.set("tab", "tags");
      router.replace(`/admin/content/blog?${params.toString()}`);
    }
  }, [router, searchParams]);

  return <AdminContentBlogPage />;
}

export default function AdminBlogTagsLegacyPage() {
  return (
    <React.Suspense fallback={null}>
      <LegacyTagsRedirect />
    </React.Suspense>
  );
}
