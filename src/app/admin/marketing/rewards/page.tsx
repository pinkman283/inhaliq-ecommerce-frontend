"use client";

import AdminStoreCreditPage from "@/app/admin/promotions/store-credit/page";

/**
 * Canonical route for Marketing -> Customer Rewards & Store Credit
 * Preserves 100% backward compatibility with /admin/promotions/store-credit
 */
export default function AdminMarketingRewardsPage() {
  return <AdminStoreCreditPage />;
}
