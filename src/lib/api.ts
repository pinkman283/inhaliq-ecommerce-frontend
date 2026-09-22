import axios from "axios";
import { Address, AdminAnalytics, Brand, Category, CouponValidation, HomepageBannersResponse, Order, Product, User } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";

const API_BASE_URL = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api")
  : (process.env.INTERNAL_API_URL || "http://127.0.0.1:8000/api");

const STOREFRONT_PROXY_URL = typeof window !== "undefined"
  ? "/api/storefront"
  : (process.env.INTERNAL_API_URL || "http://127.0.0.1:8000/api");

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 10000,
});

export const storefrontClient = axios.create({
  baseURL: STOREFRONT_PROXY_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 10000,
});

// Attach bearer token dynamically if available in localStorage
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

storefrontClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Global 401 response interceptor: clean up expired or invalid customer session
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      try {
        useAuthStore.getState().logout();
      } catch {
        // Safe fallback
      }
    }
    return Promise.reject(error);
  }
);

storefrontClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      try {
        useAuthStore.getState().logout();
      } catch {
        // Safe fallback
      }
    }
    return Promise.reject(error);
  }
);

let inFlightHomepageBanners: Promise<HomepageBannersResponse> | null = null;
let inFlightCategories: Promise<Category[]> | null = null;
let inFlightFeatured: Promise<{
  featured_products: Product[];
  new_arrivals: Product[];
  best_sellers: Product[];
  featured_categories: Category[];
}> | null = null;

export const api = {
  client: apiClient,
  storefrontClient,

  // Storefront Homepage Banners (Cached via Redis Proxy & Deduplicated across concurrent callers)
  async getHomepageBanners(): Promise<HomepageBannersResponse> {
    if (inFlightHomepageBanners) {
      return inFlightHomepageBanners;
    }
    inFlightHomepageBanners = storefrontClient
      .get("/homepage/banners")
      .then((res) => res.data)
      .finally(() => {
        setTimeout(() => {
          inFlightHomepageBanners = null;
        }, 2000);
      });
    return inFlightHomepageBanners;
  },

  // Track Banner Click (Live Mutation - Direct to Laravel)
  async trackBannerClick(id: number): Promise<void> {
    try {
      await apiClient.post(`/banners/${id}/click`);
    } catch {
      // Non-blocking tracking
    }
  },

  // Storefront Featured (Cached via Redis Proxy & Deduplicated across concurrent callers)
  async getFeatured(): Promise<{
    featured_products: Product[];
    new_arrivals: Product[];
    best_sellers: Product[];
    featured_categories: Category[];
  }> {
    if (inFlightFeatured) {
      return inFlightFeatured;
    }
    inFlightFeatured = storefrontClient
      .get("/featured")
      .then((res) => {
        const raw = res.data || {};
        const toArray = (val: any) => {
          if (Array.isArray(val)) return val;
          if (val && Array.isArray(val.data)) return val.data;
          if (val && typeof val === "object") {
            return Object.values(val).filter((item: any) => item && typeof item === "object" && "id" in item);
          }
          return [];
        };

        return {
          featured_products: toArray(raw.featured_products),
          new_arrivals: toArray(raw.new_arrivals),
          best_sellers: toArray(raw.best_sellers),
          featured_categories: toArray(raw.featured_categories),
        };
      })
      .finally(() => {
        setTimeout(() => {
          inFlightFeatured = null;
        }, 2000);
      });
    return inFlightFeatured;
  },

  // Products Catalog (Cached via Redis Proxy)
  async getProducts(params?: {
    category?: string | string[];
    categories?: string | string[];
    brand?: string | string[];
    brands?: string | string[];
    search?: string;
    min_price?: number;
    max_price?: number;
    min_rating?: number;
    sort?: string;
    featured?: boolean;
    new_arrivals?: boolean;
    in_stock?: boolean;
    discounted?: boolean;
    discounted_items?: boolean;
    page?: number;
    per_page?: number;
  }): Promise<{
    data: Product[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  }> {
    const res = await storefrontClient.get("/products", { params });
    return res.data;
  },

  // Single Product (Cached via Redis Proxy)
  async getProduct(slug: string): Promise<{
    product: Product;
    related: Product[];
  }> {
    const res = await storefrontClient.get(`/products/${slug}`);
    return res.data;
  },

  // Categories (Cached via Redis Proxy & Deduplicated across concurrent callers)
  async getCategories(): Promise<Category[]> {
    if (inFlightCategories) {
      return inFlightCategories;
    }
    inFlightCategories = storefrontClient
      .get("/categories")
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.data)) return data.data;
        if (data && typeof data === "object") {
          return Object.values(data).filter((item: any) => item && typeof item === "object" && "id" in item);
        }
        return [];
      })
      .finally(() => {
        setTimeout(() => {
          inFlightCategories = null;
        }, 2000);
      });
    return inFlightCategories;
  },

  // Single Category (Cached via Redis Proxy)
  async getCategory(slug: string): Promise<Category> {
    const res = await storefrontClient.get(`/categories/${slug}`);
    return res.data;
  },

  // Brands (Cached via Redis Proxy)
  async getBrands(): Promise<Brand[]> {
    const res = await storefrontClient.get("/brands");
    return res.data;
  },

  async getBrand(slug: string): Promise<Brand> {
    const res = await storefrontClient.get(`/brands/${slug}`);
    return res.data;
  },

  // Coupon (Live Validation - Direct to Laravel)
  async validateCoupon(code: string, subtotal: number): Promise<CouponValidation> {
    const res = await apiClient.post("/coupons/validate", { code, subtotal });
    return res.data;
  },

  // Orders & Checkout (Live Transactional - Direct to Laravel)
  async createOrder(data: {
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    shipping_address: Record<string, string>;
    billing_address?: Record<string, string>;
    payment_method: string;
    shipping_method?: string;
    coupon_code?: string;
    claimed_coupon_id?: number | null;
    use_store_credit?: boolean;
    notes?: string;
    items: { product_id: number; variant_id?: number | null; quantity: number }[];
  }, idempotencyKey?: string): Promise<{ message: string; order: Order }> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers["X-Idempotency-Key"] = idempotencyKey;
    }
    const res = await apiClient.post("/orders", data, { headers });
    return res.data;
  },

  async getOrder(orderNumber: string): Promise<Order> {
    const res = await apiClient.get(`/orders/${orderNumber}`);
    return res.data;
  },

  async trackOrder(orderNumber: string): Promise<any> {
    const res = await apiClient.get(`/orders/track/${orderNumber}`);
    return res.data;
  },

  // Shipping Zones (Cached via Redis Proxy)
  async getShippingZones(): Promise<{
    zones: Array<{
      id: string;
      name: string;
      rate: number;
      duration?: string;
      free_threshold?: number;
      is_active: boolean;
    }>;
  }> {
    const res = await storefrontClient.get("/shipping-zones");
    return res.data;
  },

  // Addresses (Live User PII - Direct to Laravel)
  async getAddresses(): Promise<Address[]> {
    const res = await apiClient.get("/addresses");
    return res.data;
  },

  async addAddress(data: Partial<Address>): Promise<Address> {
    const res = await apiClient.post("/addresses", data);
    return res.data;
  },

  async deleteAddress(id: number): Promise<void> {
    await apiClient.delete(`/addresses/${id}`);
  },

  // Reviews (Live Mutation - Direct to Laravel)
  async submitReview(productId: number, data: {
    rating: number;
    title?: string;
    comment?: string;
    user_name?: string;
  }): Promise<any> {
    const res = await apiClient.post(`/products/${productId}/reviews`, data);
    return res.data;
  },

  // Auth (Live Auth Operations - Direct to Laravel)
  async login(credentials: { email: string; password: string; remember?: boolean }): Promise<{
    message: string;
    token: string;
    user: User;
  }> {
    const res = await apiClient.post("/auth/login", credentials);
    return res.data;
  },

  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ message: string }> {
    return this.registerRequest(userData);
  },

  async registerRequest(userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ message: string }> {
    const res = await apiClient.post("/auth/register/request", userData);
    return res.data;
  },

  async registerVerify(data: { email: string; otp: string }): Promise<{
    message: string;
    token: string;
    user: User;
  }> {
    const res = await apiClient.post("/auth/register/verify", data);
    return res.data;
  },

  async forgotPassword(data: { email: string }): Promise<{ message: string }> {
    const res = await apiClient.post("/auth/password/forgot", data);
    return res.data;
  },

  async verifyResetOtp(data: { email: string; otp: string }): Promise<{ message: string; reset_token: string }> {
    const res = await apiClient.post("/auth/password/verify-reset-otp", data);
    return res.data;
  },

  async resetPassword(data: { email: string; reset_token: string; password: string; password_confirmation: string }): Promise<{ message: string }> {
    const res = await apiClient.post("/auth/password/reset", data);
    return res.data;
  },

  async getProfile(): Promise<{
    user: User;
    total_orders: number;
    total_spent: number;
  }> {
    const res = await apiClient.get("/auth/profile");
    return res.data;
  },

  async getMyOrders(params?: { per_page?: number; page?: number; all?: boolean }): Promise<{ data: Order[]; total?: number }> {
    const res = await apiClient.get("/orders", { params });
    if (Array.isArray(res.data)) {
      return { data: res.data, total: res.data.length };
    }
    return res.data;
  },

  async updateProfile(data: {
    name?: string;
    email?: string;
    phone?: string;
    avatar?: string | null;
    current_password?: string;
    password?: string;
    password_confirmation?: string;
  }): Promise<{ message: string; user: User }> {
    const res = await apiClient.put("/auth/profile", data);
    return res.data;
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  },

  // Admin (Direct to Laravel)
  async getAdminAnalytics(): Promise<AdminAnalytics> {
    const res = await apiClient.get("/admin/analytics");
    return res.data;
  },

  async getAdminOrders(status?: string): Promise<{ data: Order[]; total: number }> {
    const res = await apiClient.get("/admin/orders", { params: { status } });
    return res.data;
  },

  async updateOrderStatus(id: number, data: {
    order_status: string;
    payment_status?: string;
    carrier?: string;
    tracking_code?: string;
  }): Promise<{ message: string; order: Order }> {
    const res = await apiClient.patch(`/admin/orders/${id}/status`, data);
    return res.data;
  },

  async getAdminProducts(search?: string): Promise<{ data: Product[]; total: number }> {
    const res = await apiClient.get("/admin/products", { params: { search } });
    return res.data;
  },

  async createProduct(data: any): Promise<{ message: string; product: Product }> {
    const res = await apiClient.post("/admin/products", data);
    return res.data;
  },

  async updateProduct(id: number, data: any): Promise<{ message: string; product: Product }> {
    const res = await apiClient.put(`/admin/products/${id}`, data);
    return res.data;
  },

  async deleteProduct(id: number): Promise<{ message: string }> {
    const res = await apiClient.delete(`/admin/products/${id}`);
    return res.data;
  },

  // Checkout Lead Capture (Live Mutation - Direct to Laravel)
  async captureLead(data: {
    lead_id?: number | null;
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
    city?: string | null;
    postal_code?: string | null;
    cart_items?: any[];
    total_amount?: number;
  }): Promise<{ message: string; lead_id: number; status: string }> {
    const res = await apiClient.post("/leads/capture", data);
    return res.data;
  },

  // ==========================================
  // Storefront Promotions & Coupons (Live User State - Direct to Laravel)
  // ==========================================
  async evaluatePromotions(payload: {
    items: Array<{ product_id: number; variant_id?: number | null; quantity: number }>;
    code?: string | null;
    claimed_coupon_id?: number | null;
    shipping_rate?: number;
    payment_method?: string;
    customer_email?: string;
  }): Promise<import("@/types").PromotionEvaluationResult> {
    const res = await apiClient.post("/promotions/evaluate", payload);
    return res.data;
  },

  async getClaimablePromotions(): Promise<Array<{
    id: number;
    name: string;
    slug: string;
    description?: string;
    discount_type: string;
    discount_value: number;
    min_order_amount: number;
    max_discount_amount?: number | null;
    claim_validity_days?: number | null;
    expires_at?: string | null;
    claim_deadline?: string | null;
    badge_text?: string | null;
    banner_image?: string | null;
    thumbnail_image?: string | null;
    cta_text?: string | null;
    cta_destination?: string | null;
    is_claimed: boolean;
    claimed_id?: number;
    claim_expires_at?: string | null;
    can_claim: boolean;
  }>> {
    const res = await apiClient.get("/promotions/claimable");
    return res.data;
  },

  async getStorefrontPromotions(placement?: string): Promise<import("@/types").Promotion[]> {
    const res = await apiClient.get("/promotions/storefront", { params: placement ? { placement } : undefined });
    return Array.isArray(res.data) ? res.data : (res.data?.data || []);
  },

  async getCampaignDetails(slug: string): Promise<{
    found: boolean;
    is_active: boolean;
    promotion?: import("@/types").Promotion;
    products?: import("@/types").Product[];
    message?: string;
  }> {
    const res = await apiClient.get(`/promotions/campaign/${slug}`);
    return res.data;
  },

  async claimPromotion(promotionId: number): Promise<{ message: string; claim: import("@/types").PromotionClaim }> {
    const res = await apiClient.post("/promotions/claim", { promotion_id: promotionId });
    return res.data;
  },

  async getMyCoupons(): Promise<{
    claimed: Array<any>;
    available: Array<any>;
    used: Array<any>;
    expired: Array<any>;
  }> {
    const res = await apiClient.get("/promotions/my-coupons");
    return res.data;
  },

  async getMyStoreCredit(): Promise<{
    balance: number;
    total_credited: number;
    total_debited: number;
    is_frozen: boolean;
    transactions: {
      data: import("@/types").StoreCreditTransaction[];
      current_page: number;
      last_page: number;
      total: number;
    };
  }> {
    const res = await apiClient.get("/promotions/store-credit");
    return res.data;
  },

  // Public Storefront CMS Pages (Cached via Redis Proxy)
  async getPage(slug: string): Promise<import("@/types").CmsPage> {
    const res = await storefrontClient.get(`/pages/${slug}`);
    return res.data;
  },

  // Public Storefront Blog Listing (Cached via Redis Proxy)
  async getBlogPosts(params?: { page?: number; category?: string; tag?: string }): Promise<{
    data: import("@/types").BlogPost[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  }> {
    const res = await storefrontClient.get("/blog/posts", { params });
    return res.data;
  },

  // Single Blog Post (Live - Hits Laravel directly so views_count increment runs)
  async getBlogPost(slug: string): Promise<import("@/types").BlogPost> {
    const res = await apiClient.get(`/blog/posts/${slug}`);
    return res.data;
  },

  async submitBlogComment(postId: number, data: { author_name: string; author_email: string; comment: string }): Promise<{ message: string }> {
    const res = await apiClient.post(`/blog/posts/${postId}/comments`, data);
    return res.data;
  },

  // Public Dynamic Homepage Sections (Cached via Redis Proxy)
  async getHomepageSections(): Promise<import("@/types").HomepageSection[]> {
    const res = await storefrontClient.get("/homepage/sections");
    return res.data.data || res.data;
  },

  async getSectionTabProducts(sectionId: number, tabId: string): Promise<import("@/types").Product[]> {
    const res = await storefrontClient.get(`/homepage/sections/${sectionId}/tab-products`, {
      params: { tab_id: tabId }
    });
    return res.data.products || res.data;
  },

  // Public Dynamic Header Navigation (Cached via Redis Proxy)
  async getHeaderNavigation(): Promise<import("@/types").NavbarItem[]> {
    try {
      const res = await storefrontClient.get("/navigation/header");
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    } catch {
      const res = await apiClient.get("/navigation/header");
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    }
  },
};

