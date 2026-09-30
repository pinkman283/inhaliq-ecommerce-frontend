"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminContentBlogPage from "@/app/admin/content/blog/page";

/**
 * Legacy route alias for /admin/blog/comments
 * Canonical route: /admin/content/blog?tab=comments
 * Preserves 100% backward compatibility for bookmarks and direct links.
 */
function LegacyCommentsRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get("tab") !== "comments") {
      params.set("tab", "comments");
      router.replace(`/admin/content/blog?${params.toString()}`);
    }
  }, [router, searchParams]);

  return <AdminContentBlogPage />;
}

export default function AdminBlogCommentsLegacyPage() {
  return (
    <React.Suspense fallback={null}>
      <LegacyCommentsRedirect />
    </React.Suspense>
  );
}
