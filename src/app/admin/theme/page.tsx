"use client";

import AdminContentThemePage from "@/app/admin/content/theme/page";

/**
 * Direct route alias for /admin/theme -> /admin/content/theme
 * Preserves 100% backward compatibility for bookmarks and direct links.
 */
export default function AdminThemeLegacyPage() {
  return <AdminContentThemePage />;
}
