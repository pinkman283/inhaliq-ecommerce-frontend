"use client";

import AdminContentBrandingPage from "@/app/admin/content/branding/page";

/**
 * Backward compatibility alias for /admin/settings/branding -> /admin/content/branding
 * Preserves 100% backward compatibility for existing settings tabs and direct URLs.
 */
export default function AdminSettingsBrandingLegacyPage() {
  return <AdminContentBrandingPage />;
}
