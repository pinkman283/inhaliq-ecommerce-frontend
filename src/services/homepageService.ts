import { adminClient } from "@/lib/adminApi";
import { HomepageSection } from "@/types";

export interface ReorderSectionItem {
  id: number;
  sort_order: number;
}

/**
 * Dedicated frontend service abstraction for Homepage showcase sections.
 * Interfaces directly with Laravel /api/admin/homepage/sections endpoints.
 */
export const homepageService = {
  /**
   * Fetch all homepage sections ordered by sort_order.
   */
  async getSections(): Promise<HomepageSection[]> {
    const res = await adminClient.get("/admin/homepage/sections");
    return res.data?.data || [];
  },

  /**
   * Fetch a single section with its preview data.
   */
  async getSection(id: number): Promise<{ data: HomepageSection; preview?: any }> {
    const res = await adminClient.get(`/admin/homepage/sections/${id}`);
    return res.data;
  },

  /**
   * Create a new homepage section.
   */
  async createSection(data: Partial<HomepageSection>): Promise<{ message: string; data: HomepageSection }> {
    const res = await adminClient.post("/admin/homepage/sections", data);
    return res.data;
  },

  /**
   * Update an existing homepage section.
   */
  async updateSection(id: number, data: Partial<HomepageSection>): Promise<{ message: string; data: HomepageSection }> {
    const res = await adminClient.put(`/admin/homepage/sections/${id}`, data);
    return res.data;
  },

  /**
   * Delete a homepage section.
   */
  async deleteSection(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/homepage/sections/${id}`);
    return res.data;
  },

  /**
   * Reorder homepage sections in bulk.
   */
  async reorderSections(sections: ReorderSectionItem[]): Promise<{ message: string; data: HomepageSection[] }> {
    const res = await adminClient.post("/admin/homepage/sections/reorder", { sections });
    return res.data;
  },

  /**
   * Toggle active/inactive state of a homepage section.
   */
  async toggleSection(id: number): Promise<{ message: string; data: HomepageSection }> {
    const res = await adminClient.patch(`/admin/homepage/sections/${id}/toggle`);
    return res.data;
  },

  /**
   * Duplicate a section as an inactive draft.
   */
  async duplicateSection(id: number): Promise<{ message: string; data: HomepageSection }> {
    const res = await adminClient.post(`/admin/homepage/sections/${id}/duplicate`);
    return res.data;
  },
};
