"use client";

import AdminPromotionsPage from "@/app/admin/promotions/page";

/**
 * Canonical route for Marketing -> Campaigns
 * Preserves 100% backward compatibility with /admin/promotions
 */
export default function AdminMarketingCampaignsPage() {
  return <AdminPromotionsPage />;
}
