"use client";

import AdminContentThemePage from "@/app/admin/content/theme/page";

/**
 * Backward compatibility alias for /admin/settings/appearance -> /admin/content/theme
 * Preserves 100% backward compatibility for existing settings tabs and direct URLs.
 */
export default function AdminSettingsAppearanceLegacyPage() {
  return <AdminContentThemePage />;
}
