"use client";

import AdminStaffPage from "@/app/admin/staff/page";

/**
 * Canonical route for Customers -> Staff & Roles
 * Preserves 100% backward compatibility with /admin/staff
 */
export default function AdminCustomersStaffPage() {
  return <AdminStaffPage />;
}
