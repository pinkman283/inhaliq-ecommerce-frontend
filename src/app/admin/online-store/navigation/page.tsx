"use client";

import AdminContentNavigationPage from "@/app/admin/content/navigation/page";

/**
 * Legacy route alias for Storefront Navigation Management
 * Canonical route: /admin/content/navigation
 * Preserves 100% backward compatibility with legacy /admin/online-store/navigation
 */
export default function AdminOnlineStoreNavigationPage() {
  return <AdminContentNavigationPage />;
}
