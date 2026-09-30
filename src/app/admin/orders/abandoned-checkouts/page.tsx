"use client";

import AdminLeadsPage from "@/app/admin/leads/page";

/**
 * Canonical route for Orders -> Abandoned Checkouts / Leads
 * Preserves 100% backward compatibility with /admin/leads
 */
export default function AdminOrdersAbandonedCheckoutsPage() {
  return <AdminLeadsPage />;
}
