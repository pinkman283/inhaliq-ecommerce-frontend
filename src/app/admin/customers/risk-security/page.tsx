"use client";

import AdminBlockedIpsPage from "@/app/admin/blocked-ips/page";

/**
 * Canonical route for Customers -> Risk & Abuse Security
 * Preserves 100% backward compatibility with /admin/blocked-ips
 */
export default function AdminCustomersRiskSecurityPage() {
  return <AdminBlockedIpsPage />;
}
