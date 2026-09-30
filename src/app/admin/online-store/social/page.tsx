"use client";

import AdminContentFooterPage from "@/app/admin/content/footer/page";

/**
 * Legacy route alias for Social Profiles Management
 * Canonical route: /admin/content/footer?tab=social
 * Preserves 100% backward compatibility with legacy /admin/online-store/social
 */
export default function AdminOnlineStoreSocialPage() {
  return <AdminContentFooterPage />;
}
