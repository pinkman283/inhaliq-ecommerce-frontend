import { adminClient } from "@/lib/adminApi";
import { CmsPage } from "@/types";

export interface CreateCmsPagePayload {
  title: string;
  slug?: string;
  content: string;
  meta_title?: string | null;
  meta_description?: string | null;
  is_active?: boolean;
}

export interface UpdateCmsPagePayload {
  title: string;
  slug?: string;
  content: string;
  meta_title?: string | null;
  meta_description?: string | null;
  is_active?: boolean;
}

/**
 * Dispatch cache revalidation to Next.js storefront for CMS pages
 */
function triggerStorefrontRevalidation(): void {
  if (typeof window !== "undefined") {
    fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tags: ["pages", "cms"],
        pattern: "aether:pages*",
      }),
    }).catch(() => {
      // Non-blocking fire-and-forget
    });
  }
}

export const pagesService = {
  async getPages(params?: { search?: string; is_active?: boolean }): Promise<CmsPage[]> {
    const res = await adminClient.get("/admin/online-store/pages", { params });
    return res.data;
  },

  async getPage(id: number): Promise<CmsPage> {
    const res = await adminClient.get(`/admin/online-store/pages/${id}`);
    return res.data;
  },

  async createPage(data: CreateCmsPagePayload): Promise<{ message: string; page: CmsPage }> {
    const res = await adminClient.post("/admin/online-store/pages", data);
    triggerStorefrontRevalidation();
    return res.data;
  },

  async updatePage(id: number, data: UpdateCmsPagePayload): Promise<{ message: string; page: CmsPage }> {
    const res = await adminClient.put(`/admin/online-store/pages/${id}`, data);
    triggerStorefrontRevalidation();
    return res.data;
  },

  async togglePageStatus(id: number): Promise<{ message: string; page: CmsPage }> {
    const res = await adminClient.patch(`/admin/online-store/pages/${id}/status`);
    triggerStorefrontRevalidation();
    return res.data;
  },

  async deletePage(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/online-store/pages/${id}`);
    triggerStorefrontRevalidation();
    return res.data;
  },

  async bulkDeletePages(ids: number[]): Promise<{ message: string; deleted_count: number }> {
    const res = await adminClient.post("/admin/online-store/pages/bulk-delete", { ids });
    triggerStorefrontRevalidation();
    return res.data;
  },
};

