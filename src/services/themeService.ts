import { adminClient, adminApi } from "@/lib/adminApi";
import { ThemeSettings } from "@/store/useThemeStore";

export interface ThemeResponse {
  settings: Record<string, any>;
  defaults: Record<string, any>;
}

/**
 * Dedicated frontend service abstraction for Storefront Theme & UI customizations.
 * Interfaces directly with Laravel /api/admin/theme endpoints.
 */
export const themeService = {
  /**
   * Fetch current theme configuration & defaults from backend.
   */
  async getTheme(): Promise<ThemeResponse> {
    const res = await adminClient.get("/admin/theme");
    return res.data;
  },

  /**
   * Update theme and storefront messaging settings.
   */
  async updateTheme(data: Record<string, any>): Promise<{ message: string; settings: Record<string, any> }> {
    const res = await adminClient.put("/admin/theme", data);
    if (typeof window !== "undefined") {
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["theme"] }),
      }).catch(() => {});
    }
    return res.data;
  },

  /**
   * Reset theme configuration to factory defaults.
   */
  async resetDefaults(): Promise<{ message: string; settings: Record<string, any> }> {
    const res = await adminClient.post("/admin/theme/reset");
    if (typeof window !== "undefined") {
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["theme"] }),
      }).catch(() => {});
    }
    return res.data;
  },

  /**
   * Upload image asset (e.g. split reveal splash image, customer auth background).
   */
  async uploadAsset(file: File): Promise<{ message: string; image_url: string; path?: string }> {
    return adminApi.uploadBrandingAsset(file);
  },
};
