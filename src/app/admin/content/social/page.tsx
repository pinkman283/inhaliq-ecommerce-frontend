"use client";

import AdminContentFooterPage from "@/app/admin/content/footer/page";

/**
 * Route alias for Content / CMS -> Social Media
 * Canonical route: /admin/content/footer?tab=social
 * Preserves 100% backward compatibility
 */
export default function AdminContentSocialPage() {
  return <AdminContentFooterPage />;
}
