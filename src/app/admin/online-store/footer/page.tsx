"use client";

import AdminContentFooterPage from "@/app/admin/content/footer/page";

/**
 * Legacy route alias for Storefront Footer Management
 * Canonical route: /admin/content/footer
 * Preserves 100% backward compatibility with legacy /admin/online-store/footer
 */
export default function AdminOnlineStoreFooterPage() {
  return <AdminContentFooterPage />;
}
