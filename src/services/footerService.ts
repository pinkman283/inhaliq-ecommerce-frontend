import { adminClient } from "@/lib/adminApi";
import { FooterColumn, FooterLink, SocialLink } from "@/types";

export interface CreateFooterColumnPayload {
  title: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateFooterColumnPayload {
  title: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface CreateFooterLinkPayload {
  footer_column_id?: number | null;
  column_group?: string;
  title: string;
  url: string;
  is_external?: boolean;
  open_in_new_tab?: boolean;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateFooterLinkPayload {
  footer_column_id?: number | null;
  column_group?: string;
  title: string;
  url: string;
  is_external?: boolean;
  open_in_new_tab?: boolean;
  sort_order?: number;
  is_active?: boolean;
}

export interface CreateSocialLinkPayload {
  platform: string;
  url: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
  whatsapp_number?: string;
  whatsapp_message?: string;
}

export interface UpdateSocialLinkPayload {
  platform: string;
  url: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
  whatsapp_number?: string;
  whatsapp_message?: string;
}

/**
 * Dispatch cache revalidation to Next.js storefront for footer and store-navigation
 */
function triggerStorefrontRevalidation(): void {
  if (typeof window !== "undefined") {
    fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: ["footer", "navigation"] }),
    }).catch(() => {
      // Non-blocking fire-and-forget
    });
  }
}

/**
 * Dedicated frontend service abstraction for storefront footer columns, footer links, and social channels.
 * Interfaces directly with Laravel /api/admin/online-store/* endpoints.
 */
export const footerService = {
  // ==========================================
  // FOOTER COLUMNS
  // ==========================================

  async getFooterColumns(): Promise<FooterColumn[]> {
    const res = await adminClient.get("/admin/online-store/footer-columns");
    return res.data || [];
  },

  async createFooterColumn(data: CreateFooterColumnPayload): Promise<{ message: string; footer_column: FooterColumn }> {
    const res = await adminClient.post("/admin/online-store/footer-columns", data);
    triggerStorefrontRevalidation();
    return res.data;
  },

  async updateFooterColumn(id: number, data: UpdateFooterColumnPayload): Promise<{ message: string; footer_column: FooterColumn }> {
    const res = await adminClient.put(`/admin/online-store/footer-columns/${id}`, data);
    triggerStorefrontRevalidation();
    return res.data;
  },

  async deleteFooterColumn(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/online-store/footer-columns/${id}`);
    triggerStorefrontRevalidation();
    return res.data;
  },

  async reorderFooterColumns(column_ids: number[]): Promise<{ message: string }> {
    const res = await adminClient.post("/admin/online-store/footer-columns/reorder", { column_ids });
    triggerStorefrontRevalidation();
    return res.data;
  },

  // ==========================================
  // FOOTER LINKS
  // ==========================================

  async getFooterLinks(): Promise<FooterLink[]> {
    const res = await adminClient.get("/admin/online-store/footer-links");
    return res.data || [];
  },

  async createFooterLink(data: CreateFooterLinkPayload): Promise<{ message: string; footer_link: FooterLink }> {
    const res = await adminClient.post("/admin/online-store/footer-links", data);
    triggerStorefrontRevalidation();
    return res.data;
  },

  async updateFooterLink(id: number, data: UpdateFooterLinkPayload): Promise<{ message: string; footer_link: FooterLink }> {
    const res = await adminClient.put(`/admin/online-store/footer-links/${id}`, data);
    triggerStorefrontRevalidation();
    return res.data;
  },

  async deleteFooterLink(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/online-store/footer-links/${id}`);
    triggerStorefrontRevalidation();
    return res.data;
  },

  async reorderFooterLinks(link_ids: number[], footer_column_id?: number | null): Promise<{ message: string }> {
    const res = await adminClient.post("/admin/online-store/footer-links/reorder", {
      link_ids,
      footer_column_id: footer_column_id || undefined,
    });
    triggerStorefrontRevalidation();
    return res.data;
  },

  // ==========================================
  // SOCIAL LINKS
  // ==========================================

  async getSocialLinks(): Promise<SocialLink[]> {
    const res = await adminClient.get("/admin/online-store/social-links");
    return res.data || [];
  },

  async createSocialLink(data: CreateSocialLinkPayload): Promise<{ message: string; social_link: SocialLink }> {
    const res = await adminClient.post("/admin/online-store/social-links", data);
    triggerStorefrontRevalidation();
    return res.data;
  },

  async updateSocialLink(id: number, data: UpdateSocialLinkPayload): Promise<{ message: string; social_link: SocialLink }> {
    const res = await adminClient.put(`/admin/online-store/social-links/${id}`, data);
    triggerStorefrontRevalidation();
    return res.data;
  },

  async deleteSocialLink(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/online-store/social-links/${id}`);
    triggerStorefrontRevalidation();
    return res.data;
  },
};
