"use client";

import AdminPromotionCodesPage from "@/app/admin/promotions/codes/page";

/**
 * Canonical route for Marketing -> Coupons & Promo Codes
 * Preserves 100% backward compatibility with /admin/promotions/codes and /admin/coupons
 */
export default function AdminMarketingCouponsPage() {
  return <AdminPromotionCodesPage />;
}
