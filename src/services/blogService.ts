import { adminClient } from "@/lib/adminApi";
import { BlogPost, BlogCategory, BlogTag, BlogComment, BlogSummary } from "@/types";

export interface CreateBlogPostPayload {
  title: string;
  slug?: string;
  excerpt?: string | null;
  content: string;
  featured_image?: string | null;
  featured_image_alt?: string | null;
  category_id?: number | null;
  status?: "published" | "draft" | "archived";
  tag_ids?: number[];
  meta_title?: string | null;
  meta_description?: string | null;
}

export interface UpdateBlogPostPayload {
  title: string;
  slug?: string;
  excerpt?: string | null;
  content: string;
  featured_image?: string | null;
  featured_image_alt?: string | null;
  category_id?: number | null;
  status?: "published" | "draft" | "archived";
  tag_ids?: number[];
  meta_title?: string | null;
  meta_description?: string | null;
}

export interface CreateBlogCategoryPayload {
  name: string;
  slug?: string;
  description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
}

export interface UpdateBlogCategoryPayload {
  name: string;
  slug?: string;
  description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
}

export interface CreateBlogTagPayload {
  name: string;
  slug?: string;
}

export interface UpdateBlogTagPayload {
  name: string;
  slug?: string;
}

/**
 * Dispatch cache revalidation to Next.js storefront for blog content
 */
function triggerStorefrontRevalidation(): void {
  if (typeof window !== "undefined") {
    fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tags: ["blog"],
        pattern: "aether:blog*",
      }),
    }).catch(() => {
      // Non-blocking fire-and-forget
    });
  }
}

export const blogService = {
  // ==========================================
  // METRICS & SUMMARY
  // ==========================================
  async getSummary(): Promise<BlogSummary> {
    const res = await adminClient.get("/admin/blog/summary");
    return res.data;
  },

  // ==========================================
  // ARTICLES / POSTS
  // ==========================================
  async getPosts(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    category_id?: number;
  }): Promise<{
    data: BlogPost[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  }> {
    const res = await adminClient.get("/admin/blog/posts", { params });
    return res.data;
  },

  async getPost(id: number): Promise<BlogPost> {
    const res = await adminClient.get(`/admin/blog/posts/${id}`);
    return res.data;
  },

  async createPost(data: CreateBlogPostPayload): Promise<{ message: string; post: BlogPost }> {
    const res = await adminClient.post("/admin/blog/posts", data);
    triggerStorefrontRevalidation();
    return res.data;
  },

  async updatePost(id: number, data: UpdateBlogPostPayload): Promise<{ message: string; post: BlogPost }> {
    const res = await adminClient.put(`/admin/blog/posts/${id}`, data);
    triggerStorefrontRevalidation();
    return res.data;
  },

  async togglePostStatus(id: number): Promise<{ message: string; post: BlogPost }> {
    const res = await adminClient.patch(`/admin/blog/posts/${id}/status`);
    triggerStorefrontRevalidation();
    return res.data;
  },

  async deletePost(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/blog/posts/${id}`);
    triggerStorefrontRevalidation();
    return res.data;
  },

  // ==========================================
  // CATEGORIES
  // ==========================================
  async getCategories(): Promise<BlogCategory[]> {
    const res = await adminClient.get("/admin/blog/categories");
    return res.data;
  },

  async createCategory(data: CreateBlogCategoryPayload): Promise<{ message: string; category: BlogCategory }> {
    const res = await adminClient.post("/admin/blog/categories", data);
    triggerStorefrontRevalidation();
    return res.data;
  },

  async updateCategory(id: number, data: UpdateBlogCategoryPayload): Promise<{ message: string; category: BlogCategory }> {
    const res = await adminClient.put(`/admin/blog/categories/${id}`, data);
    triggerStorefrontRevalidation();
    return res.data;
  },

  async deleteCategory(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/blog/categories/${id}`);
    triggerStorefrontRevalidation();
    return res.data;
  },

  // ==========================================
  // TAGS
  // ==========================================
  async getTags(): Promise<BlogTag[]> {
    const res = await adminClient.get("/admin/blog/tags");
    return res.data;
  },

  async createTag(data: CreateBlogTagPayload): Promise<{ message: string; tag: BlogTag }> {
    const res = await adminClient.post("/admin/blog/tags", data);
    triggerStorefrontRevalidation();
    return res.data;
  },

  async updateTag(id: number, data: UpdateBlogTagPayload): Promise<{ message: string; tag: BlogTag }> {
    const res = await adminClient.put(`/admin/blog/tags/${id}`, data);
    triggerStorefrontRevalidation();
    return res.data;
  },

  async deleteTag(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/blog/tags/${id}`);
    triggerStorefrontRevalidation();
    return res.data;
  },

  // ==========================================
  // COMMENTS / MODERATION
  // ==========================================
  async getComments(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    is_approved?: boolean;
  }): Promise<{
    data: BlogComment[];
    current_page: number;
    last_page: number;
    total: number;
  }> {
    const res = await adminClient.get("/admin/blog/comments", { params });
    return res.data;
  },

  async toggleCommentApproval(id: number): Promise<{ message: string; comment: BlogComment }> {
    const res = await adminClient.patch(`/admin/blog/comments/${id}/approval`);
    triggerStorefrontRevalidation();
    return res.data;
  },

  async deleteComment(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/blog/comments/${id}`);
    triggerStorefrontRevalidation();
    return res.data;
  },

  // ==========================================
  // IMAGE ASSET UPLOAD
  // ==========================================
  async uploadBlogImage(file: File): Promise<{ message: string; image_url: string; path?: string }> {
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await adminClient.post("/admin/products/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    } catch (err: any) {
      // Fallback to banners image upload endpoint if available
      if (err?.response?.status === 404) {
        const fallbackRes = await adminClient.post("/admin/banners/upload-image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return fallbackRes.data;
      }
      throw err;
    }
  },
};
