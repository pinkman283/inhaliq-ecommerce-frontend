import { adminClient } from "@/lib/adminApi";

export interface BrandLogoPlacementRecord {
  id: number;
  logo_id: number;
  placement: string;
}

export interface BrandLogo {
  id: number;
  name: string | null;
  image_url: string;
  is_active?: boolean;
  placements: BrandLogoPlacementRecord[];
}

export interface PlacementOption {
  id: string;
  label: string;
  description: string;
  recommended: string;
}

export interface BrandingDataResponse {
  logos: BrandLogo[];
  favicon: string;
  available_placements: PlacementOption[];
}

/**
 * Dedicated service layer for store branding, visual assets, and logo placement.
 * Interfaces with Laravel /api/admin/branding and /api/admin/theme endpoints.
 */
export const brandingService = {
  /**
   * Fetch all brand logos, active placements, and favicon.
   */
  async getBrandingData(): Promise<BrandingDataResponse> {
    const res = await adminClient.get("/admin/branding/logos");
    return res.data;
  },

  /**
   * Create a new brand logo with assigned placements.
   */
  async createLogo(data: {
    name?: string;
    image_url: string;
    placements?: string[];
  }): Promise<{ message: string; logo: BrandLogo }> {
    const res = await adminClient.post("/admin/branding/logos", data);
    this.triggerRevalidation();
    return res.data;
  },

  /**
   * Update an existing brand logo (name, image_url, placements).
   */
  async updateLogo(
    id: number,
    data: { name?: string; image_url: string; placements?: string[] }
  ): Promise<{ message: string; logo: BrandLogo }> {
    const res = await adminClient.put(`/admin/branding/logos/${id}`, data);
    this.triggerRevalidation();
    return res.data;
  },

  /**
   * Batch update surface placements across multiple brand logos.
   */
  async batchUpdatePlacements(
    placements: Array<{ logo_id: number; placements: string[] }>
  ): Promise<{ message: string; logos: BrandLogo[] }> {
    const res = await adminClient.put("/admin/branding/placements", { placements });
    this.triggerRevalidation();
    return res.data;
  },

  /**
   * Delete a brand logo.
   */
  async deleteLogo(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/branding/logos/${id}`);
    this.triggerRevalidation();
    return res.data;
  },

  /**
   * Upload an image file for branding assets (logos or favicon).
   */
  async uploadAsset(file: File): Promise<{ message: string; image_url: string; path: string }> {
    const formData = new FormData();
    formData.append("image", file);
    const res = await adminClient.post("/admin/branding/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /**
   * Update the browser favicon URL.
   */
  async updateFavicon(favicon_url: string): Promise<{ message: string; favicon: string }> {
    const res = await adminClient.put("/admin/branding/favicon", { favicon_url });
    this.triggerRevalidation();
    return res.data;
  },

  /**
   * Remove the browser favicon URL.
   */
  async removeFavicon(): Promise<{ message: string; favicon: string }> {
    const res = await adminClient.delete("/admin/branding/favicon");
    this.triggerRevalidation();
    return res.data;
  },

  /**
   * Synchronize store brand name and tagline via theme settings API.
   */
  async updateStoreIdentity(data: {
    store_brand_name: string;
    store_brand_tagline: string;
  }): Promise<{ message: string; settings: Record<string, any> }> {
    const res = await adminClient.put("/admin/theme", data);
    this.triggerRevalidation();
    return res.data;
  },

  /**
   * Helper to trigger Next.js cache revalidation for storefront components.
   */
  triggerRevalidation() {
    if (typeof window !== "undefined") {
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["theme"] }),
      }).catch(() => {});
    }
  },
};
