"use client";

import AdminShippingPage from "@/app/admin/settings/shipping/page";

/**
 * Canonical route for Orders -> Shipping & Delivery Zones
 * Preserves 100% backward compatibility with /admin/settings/shipping
 */
export default function AdminOrdersShippingPage() {
  return <AdminShippingPage />;
}
