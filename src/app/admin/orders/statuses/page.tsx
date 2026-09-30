"use client";

import AdminOrderStatusesPage from "@/app/admin/settings/statuses/page";

/**
 * Canonical route for Orders -> Order Status Pipeline
 * Preserves 100% backward compatibility with /admin/settings/statuses
 */
export default function AdminOrdersStatusesPage() {
  return <AdminOrderStatusesPage />;
}
