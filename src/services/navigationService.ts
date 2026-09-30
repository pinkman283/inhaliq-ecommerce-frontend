import { adminClient } from "@/lib/adminApi";
import { NavbarItem, NavigationOptions } from "@/types";

export interface ReorderNavbarItemPayload {
  id: number;
  display_order: number;
  parent_id?: number | null;
}

export interface CategoryBrandsResponse {
  category: { id: number; name: string; slug: string };
  linked_brands: Array<{
    id: number;
    name: string;
    slug: string;
    display_order?: number;
    is_in_navbar?: boolean;
    is_featured?: boolean;
  }>;
  all_brands: Array<{ id: number; name: string; slug: string; logo?: string | null }>;
}

export interface CategoryBrandUpdateItem {
  brand_id: number;
  display_order?: number;
  is_in_navbar?: boolean;
  is_featured?: boolean;
}

/**
 * Dispatch cache revalidation to Next.js storefront for navigation
 */
function triggerStorefrontRevalidation(): void {
  if (typeof window !== "undefined") {
    fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: ["navigation"] }),
    }).catch(() => {
      // Non-blocking fire-and-forget
    });
  }
}

/**
 * Dedicated frontend service abstraction for storefront navigation & menu hierarchy management.
 * Interfaces directly with Laravel /api/admin/navigation endpoints.
 */
export const navigationService = {
  /**
   * Fetch all navigation items as a flat list ordered by parent and display_order.
   */
  async getNavbarItems(): Promise<NavbarItem[]> {
    const res = await adminClient.get("/admin/navigation");
    return res.data || [];
  },

  /**
   * Fetch complete hierarchical navigation tree with nested children.
   */
  async getNavbarTree(): Promise<NavbarItem[]> {
    const res = await adminClient.get("/admin/navigation/tree");
    return res.data || [];
  },

  /**
   * Fetch options for dropdown selectors (categories, subcategories, brands, pages, potential parents).
   */
  async getNavigationOptions(): Promise<NavigationOptions> {
    const res = await adminClient.get("/admin/navigation/options");
    return res.data || {
      root_categories: [],
      subcategories: [],
      brands: [],
      pages: [],
      potential_parents: [],
    };
  },

  /**
   * Fetch a single navigation item by ID with related catalog items and children.
   */
  async getNavbarItem(id: number): Promise<NavbarItem> {
    const res = await adminClient.get(`/admin/navigation/${id}`);
    return res.data;
  },

  /**
   * Create a new navigation item.
   */
  async createNavbarItem(data: Partial<NavbarItem>): Promise<{ message: string; item: NavbarItem }> {
    const res = await adminClient.post("/admin/navigation", data);
    triggerStorefrontRevalidation();
    return res.data;
  },

  /**
   * Update an existing navigation item.
   */
  async updateNavbarItem(id: number, data: Partial<NavbarItem>): Promise<{ message: string; item: NavbarItem }> {
    const res = await adminClient.put(`/admin/navigation/${id}`, data);
    triggerStorefrontRevalidation();
    return res.data;
  },

  /**
   * Toggle the active status of a navigation item.
   */
  async toggleActive(id: number, currentStatus: boolean): Promise<{ message: string; item: NavbarItem }> {
    const res = await adminClient.put(`/admin/navigation/${id}`, { is_active: !currentStatus });
    triggerStorefrontRevalidation();
    return res.data;
  },

  /**
   * Delete a navigation item and its descendants.
   */
  async deleteNavbarItem(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/navigation/${id}`);
    triggerStorefrontRevalidation();
    return res.data;
  },

  /**
   * Duplicate a navigation item and its complete nested subtree.
   */
  async duplicateNavbarItem(id: number): Promise<{ message: string; item: NavbarItem }> {
    const res = await adminClient.post(`/admin/navigation/${id}/duplicate`);
    triggerStorefrontRevalidation();
    return res.data;
  },

  /**
   * Atomically reorder navigation items across hierarchy and siblings.
   */
  async reorderNavbarItems(items: ReorderNavbarItemPayload[]): Promise<{ message: string }> {
    const res = await adminClient.post("/admin/navigation/reorder", { items });
    triggerStorefrontRevalidation();
    return res.data;
  },

  /**
   * Fetch brands linked to a specific category for mega-menu display.
   */
  async getCategoryBrands(categoryId: number): Promise<CategoryBrandsResponse> {
    const res = await adminClient.get(`/admin/navigation/category-brands/${categoryId}`);
    return res.data;
  },

  /**
   * Update linked brands for a category's mega-menu.
   */
  async updateCategoryBrands(
    categoryId: number,
    brands: CategoryBrandUpdateItem[]
  ): Promise<{ message: string }> {
    const res = await adminClient.post(`/admin/navigation/category-brands/${categoryId}`, { brands });
    triggerStorefrontRevalidation();
    return res.data;
  },
};
