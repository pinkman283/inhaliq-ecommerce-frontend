"use client";

import AdminSalesPage from "@/app/admin/sales/page";

/**
 * Canonical route for Orders -> Sales Invoices & History
 * Preserves 100% backward compatibility with /admin/sales
 */
export default function AdminOrdersSalesInvoicesPage() {
  return <AdminSalesPage />;
}
