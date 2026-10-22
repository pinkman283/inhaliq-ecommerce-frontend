import { adminClient } from "@/lib/adminApi";
import { Banner } from "@/types";

export interface BannerFilters {
  placement?: string;
  status?: string;
  is_active?: boolean;
  search?: string;
}

export interface BannerImageUploadResponse {
  message: string;
  image_url: string;
  path?: string;
  filename?: string;
}

/**
 * Dedicated frontend service abstraction for storefront banner & ad management.
 * Interfaces directly with Laravel /api/admin/banners endpoints.
 */
export const bannerService = {
  /**
   * Fetch banners with optional placement, status, or search query.
   */
  async getBanners(params?: BannerFilters): Promise<Banner[]> {
    const res = await adminClient.get("/admin/banners", { params });
    return res.data || [];
  },

  /**
   * Fetch single banner by ID.
   */
  async getBanner(id: number): Promise<Banner> {
    const res = await adminClient.get(`/admin/banners/${id}`);
    return res.data;
  },

  /**
   * Create a new storefront banner.
   */
  async createBanner(data: Partial<Banner>): Promise<{ message: string; banner: Banner }> {
    const res = await adminClient.post("/admin/banners", data);
    return res.data;
  },

  /**
   * Update an existing banner.
   */
  async updateBanner(id: number, data: Partial<Banner>): Promise<{ message: string; banner: Banner }> {
    const res = await adminClient.put(`/admin/banners/${id}`, data);
    return res.data;
  },

  /**
   * Toggle banner is_active state.
   */
  async toggleStatus(id: number): Promise<{ message: string; banner: Banner }> {
    const res = await adminClient.patch(`/admin/banners/${id}/status`);
    return res.data;
  },

  /**
   * Delete a banner.
   */
  async deleteBanner(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/banners/${id}`);
    return res.data;
  },

  /**
   * Bulk delete banners.
   */
  async bulkDeleteBanners(ids: number[]): Promise<{ message: string; deleted_count: number }> {
    const res = await adminClient.post("/admin/banners/bulk-delete", { ids });
    return res.data;
  },


  /**
   * Upload desktop or mobile creative image file (JPEG, PNG, WebP, GIF up to 10MB).
   */
  async uploadImage(file: File): Promise<BannerImageUploadResponse> {
    const formData = new FormData();
    formData.append("image", file);
    const res = await adminClient.post("/admin/banners/upload-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /**
   * Reorder banners sequence in bulk.
   */
  async reorderBanners(items: { id: number; sort_order: number }[]): Promise<{ message: string }> {
    const res = await adminClient.post("/admin/banners/reorder", { items });
    return res.data;
  },
};
