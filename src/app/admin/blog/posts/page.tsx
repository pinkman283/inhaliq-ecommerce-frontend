"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminContentBlogPage from "@/app/admin/content/blog/page";

/**
 * Legacy route alias for /admin/blog/posts
 * Canonical route: /admin/content/blog?tab=posts
 * Preserves 100% backward compatibility for bookmarks and direct links.
 */
function LegacyPostsRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get("tab") !== "posts") {
      params.set("tab", "posts");
      router.replace(`/admin/content/blog?${params.toString()}`);
    }
  }, [router, searchParams]);

  return <AdminContentBlogPage />;
}

export default function AdminBlogPostsLegacyPage() {
  return (
    <React.Suspense fallback={null}>
      <LegacyPostsRedirect />
    </React.Suspense>
  );
}
