import axios from "axios";
import {
  Address,
  AdminAnalytics,
  Brand,
  CartValidationResponse,
  Category,
  CouponValidation,
  HomepageBannersResponse,
  Order,
  PaymentMethodOption,
  Product,
  ProductVariant,
  PromotionEvaluationResult,
  User,
} from "@/types";
import { useAuthStore } from "@/store/useAuthStore";
import { storefrontApi, getStorefrontApi, IStorefrontApi } from "./api/index";

export { storefrontApi, getStorefrontApi };
export type { IStorefrontApi };

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

// Global 401 response interceptor
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

export const api = {
  client: apiClient,
  storefrontClient,
  storefrontApi,

  // ==========================================
  // Homepage & Banners
  // ==========================================
  async getHomepageBanners(): Promise<HomepageBannersResponse> {
    return storefrontApi.getHomepageBanners();
  },

  async trackBannerClick(id: number): Promise<void> {
    return storefrontApi.trackBannerClick(id);
  },

  async getFeatured(): Promise<{
    featured_products: Product[];
    new_arrivals: Product[];
    best_sellers: Product[];
    featured_categories: Category[];
  }> {
    const homeData = await storefrontApi.getHomepageData();
    return {
      featured_products: homeData.featured_products || [],
      new_arrivals: homeData.new_arrivals || [],
      best_sellers: homeData.best_sellers || [],
      featured_categories: homeData.featured_categories || [],
    };
  },

  // ==========================================
  // Catalog & Products
  // ==========================================
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
    return storefrontApi.getProducts(params as any);
  },

  async getProduct(slug: string): Promise<{
    product: Product;
    related: Product[];
  }> {
    return storefrontApi.getProduct(slug);
  },

  async getCategories(): Promise<Category[]> {
    return storefrontApi.getCategories();
  },

  async getCategory(slug: string): Promise<Category> {
    const page = await storefrontApi.getCategory(slug);
    return page.category;
  },

  async getBrands(): Promise<Brand[]> {
    return storefrontApi.getBrands();
  },

  async getBrand(slug: string): Promise<Brand> {
    const page = await storefrontApi.getBrand(slug);
    return page.brand;
  },

  // ==========================================
  // Coupons & Promotions
  // ==========================================
  async validateCoupon(
    code: string,
    subtotal: number,
    items?: Array<{ product_id: number; variant_id?: number | null; quantity: number; price?: number }>
  ): Promise<CouponValidation> {
    return storefrontApi.validateCoupon(code, subtotal, items);
  },

  async validateCart(
    items: { product_id: number; variant_id?: number | null; quantity: number; price?: number }[],
    coupon_code?: string | null,
    claimed_coupon_id?: number | null
  ): Promise<CartValidationResponse> {
    if (storefrontApi.provider === "senior") {
      try {
        const calc = await storefrontApi.calculateCheckout({
          items: items.map((i) => ({
            product_id: i.product_id,
            qty: i.quantity,
            price: i.price,
            variant_id: i.variant_id ?? null,
          })),
          coupon_code: coupon_code || undefined,
        });

        const calcItems = calc.items || [];
        const hasStockError = calcItems.some((it) => it.has_stock_error);
        return {
          is_valid: !hasStockError,
          has_changes: false,
          items: calcItems.map((it) => ({
            product_id: it.product_id,
            variant_id: null,
            status: it.has_stock_error ? ("out_of_stock" as const) : ("valid" as const),
            is_valid: !it.has_stock_error,
            requested_quantity: it.qty,
            normalized_quantity: it.qty,
            available_stock: it.has_stock_error ? 0 : 999,
            unit_price: it.unit_price,
            total_price: it.total_price,
            message: it.stock_message || (it.has_stock_error ? "Item out of stock" : "In stock"),
          })),
          summary: {
            total_items: calcItems.length,
            subtotal: calc.subtotal,
            discount_amount: calc.discount || calc.coupon_discount || 0,
            total: calc.total,
            has_out_of_stock: hasStockError,
            has_inactive_items: false,
            has_price_changes: false,
            notices: calc.coupon_message ? [calc.coupon_message] : [],
          },
        };
      } catch (err: any) {
        // Fallback local response
        const subtotal = items.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);
        return {
          is_valid: true,
          has_changes: false,
          items: items.map((i) => ({
            product_id: i.product_id,
            variant_id: i.variant_id ?? null,
            status: "valid" as const,
            is_valid: true,
            requested_quantity: i.quantity,
            normalized_quantity: i.quantity,
            available_stock: 99,
            unit_price: i.price || 0,
            total_price: (i.price || 0) * i.quantity,
            message: "In stock",
          })),
          summary: {
            total_items: items.length,
            subtotal,
            discount_amount: 0,
            total: subtotal + 60,
            has_out_of_stock: false,
            has_inactive_items: false,
            has_price_changes: false,
            notices: [],
          },
        };
      }
    }

    const res = await apiClient.post("/cart/validate", { items, coupon_code, claimed_coupon_id });
    return res.data;
  },

  // ==========================================
  // Orders & Checkout
  // ==========================================
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
  }, idempotencyKey?: string): Promise<{ message: string; order: Order; payment_url?: string }> {
    if (storefrontApi.provider === "senior") {
      const areaId = Number(data.shipping_method) || (data.shipping_method === "inside_dhaka" ? 1 : 2);
      const res = await storefrontApi.saveOrder({
        name: data.customer_name,
        phone: data.customer_phone || "",
        address: data.shipping_address?.address_line1 || data.shipping_address?.address || "",
        area: data.shipping_address?.city || "",
        area_id: areaId,
        note: data.notes || data.shipping_address?.address_line2 || "",
        payment_method: data.payment_method,
        coupon_code: data.coupon_code,
        items: data.items.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id ?? null,
          qty: i.quantity,
        })),
      }, idempotencyKey);

      const orderModel: Order = {
        id: Number(res.order_id) || 0,
        order_number: String(res.invoice_id || res.order_number || res.order_id),
        customer_name: data.customer_name || "Customer",
        customer_email: data.customer_email || `${data.customer_phone || "customer"}@guest.local`,
        customer_phone: data.customer_phone || null,
        subtotal: res.total,
        tax_amount: 0,
        shipping_amount: 0,
        discount_amount: 0,
        total_amount: res.total,
        order_status: (res.status as any) || "pending",
        payment_status: "pending",
        payment_method: data.payment_method,
        shipping_address: {
          full_name: data.customer_name || "",
          address_line1: data.shipping_address?.address_line1 || data.shipping_address?.address || "",
          address_line2: data.shipping_address?.address_line2 || "",
          city: data.shipping_address?.city || "",
          postal_code: data.shipping_address?.postal_code || "1000",
          country: "Bangladesh",
          phone: data.customer_phone || "",
        },
        billing_address: data.billing_address,
        items: data.items.map((i) => ({
          id: i.product_id,
          order_id: Number(res.order_id) || 0,
          product_id: i.product_id,
          product_name: `Product #${i.product_id}`,
          quantity: i.quantity,
          unit_price: 0,
          total_price: 0,
        })),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return {
        message: res.message || "Order placed successfully",
        order: orderModel,
        payment_url: res.payment_url || undefined,
      };
    }

    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers["X-Idempotency-Key"] = idempotencyKey;
    }
    const res = await apiClient.post("/orders", data, { headers });
    return res.data;
  },

  async getOrder(orderNumber: string): Promise<Order> {
    return storefrontApi.getOrder(orderNumber);
  },

  async trackOrder(orderNumber: string): Promise<any> {
    return storefrontApi.trackOrder({ orderNumber });
  },

  async cancelOrder(orderNumber: string): Promise<{ message: string; order: Order }> {
    const res = await apiClient.post(`/orders/${orderNumber}/cancel`);
    return res.data;
  },

  async requestOrderReturn(orderNumber: string, data: { return_reason: string; notes?: string }): Promise<{ message: string; return: any; order: Order }> {
    const res = await apiClient.post(`/orders/${orderNumber}/return`, data);
    return res.data;
  },

  async getPaymentMethods(): Promise<{
    methods: PaymentMethodOption[];
    default: string;
  }> {
    const gateways = await storefrontApi.getPaymentGateways();
    const methods: PaymentMethodOption[] = gateways.map((g) => ({
      code: g.slug,
      name: g.name,
      description: g.description || (g.type === "cod" ? "Pay in cash upon delivery" : "Pay securely online"),
      available: g.is_active !== false,
      notice: null,
    }));

    const defaultMethod = methods.find((m) => m.code === "cod" || m.code === "cash_on_delivery")?.code
      || methods[0]?.code
      || "cash_on_delivery";

    return {
      methods,
      default: defaultMethod,
    };
  },

  // ==========================================
  // Cart Persistence (Sanctum Authenticated)
  // ==========================================
  async getCustomerCart(): Promise<{
    items: Array<{
      id: number;
      product_id: number;
      variant_id: number | null;
      quantity: number;
      available_stock: number;
      product: Product;
      variant: ProductVariant | null;
    }>;
    summary: {
      total_items: number;
      total_quantity: number;
      subtotal: number;
      notices: string[];
    };
  }> {
    if (storefrontApi.provider === "senior") {
      return {
        items: [],
        summary: { total_items: 0, total_quantity: 0, subtotal: 0, notices: [] },
      };
    }
    const res = await apiClient.get("/customer/cart");
    return res.data;
  },

  async syncCustomerCart(items: Array<{ product_id: number; variant_id?: number | null; quantity: number }>): Promise<{
    items: any[];
    summary: { total_items: number; total_quantity: number; subtotal: number; notices: string[] };
  }> {
    if (storefrontApi.provider === "senior") {
      return {
        items: [],
        summary: { total_items: 0, total_quantity: 0, subtotal: 0, notices: [] },
      };
    }
    const res = await apiClient.post("/customer/cart/sync", { items });
    return res.data;
  },

  async mergeCustomerCart(guestItems: Array<{ product_id: number; variant_id?: number | null; quantity: number }>): Promise<{
    items: any[];
    summary: { total_items: number; total_quantity: number; subtotal: number; notices: string[] };
  }> {
    if (storefrontApi.provider === "senior") {
      return {
        items: [],
        summary: { total_items: 0, total_quantity: 0, subtotal: 0, notices: [] },
      };
    }
    const res = await apiClient.post("/customer/cart/merge", { guest_items: guestItems });
    return res.data;
  },

  async clearCustomerCart(): Promise<{ message: string }> {
    if (storefrontApi.provider === "senior") {
      return { message: "Cart cleared" };
    }
    const res = await apiClient.delete("/customer/cart");
    return res.data;
  },

  // ==========================================
  // Customer Wishlist
  // ==========================================
  async getCustomerWishlist(): Promise<{ products: Product[]; total: number }> {
    try {
      const res = await apiClient.get("/customer/wishlist");
      return res.data;
    } catch {
      return { products: [], total: 0 };
    }
  },

  async toggleCustomerWishlist(productId: number): Promise<{ message: string; in_wishlist: boolean; product_id: number }> {
    try {
      const res = await apiClient.post("/customer/wishlist/toggle", { product_id: productId });
      return res.data;
    } catch {
      return { message: "Updated", in_wishlist: true, product_id: productId };
    }
  },

  async mergeCustomerWishlist(guestProductIds: number[]): Promise<{ products: Product[]; total: number }> {
    try {
      const res = await apiClient.post("/customer/wishlist/merge", { guest_product_ids: guestProductIds });
      return res.data;
    } catch {
      return { products: [], total: 0 };
    }
  },

  async clearCustomerWishlist(): Promise<{ message: string }> {
    try {
      const res = await apiClient.delete("/customer/wishlist");
      return res.data;
    } catch {
      return { message: "Wishlist cleared" };
    }
  },

  // ==========================================
  // Shipping Zones
  // ==========================================
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
    const charges = await storefrontApi.getShippingCharges();
    return {
      zones: charges.map((c) => ({
        id: String(c.id),
        name: c.name,
        rate: c.amount,
        duration: c.description,
        is_active: c.is_active !== false,
      })),
    };
  },

  // ==========================================
  // Addresses
  // ==========================================
  async getAddresses(): Promise<Address[]> {
    try {
      const res = await apiClient.get("/addresses");
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  async addAddress(data: Partial<Address>): Promise<Address> {
    const res = await apiClient.post("/addresses", data);
    return res.data;
  },

  async deleteAddress(id: number): Promise<void> {
    await apiClient.delete(`/addresses/${id}`);
  },

  // ==========================================
  // Reviews
  // ==========================================
  async submitReview(productId: number, data: {
    rating: number;
    title?: string;
    comment?: string;
    user_name?: string;
  }): Promise<any> {
    return storefrontApi.submitReview(productId, {
      rating: data.rating,
      title: data.title,
      review: data.comment || "",
      user_name: data.user_name,
    });
  },

  // ==========================================
  // Customer Auth
  // ==========================================
  async login(credentials: { email: string; password: string; remember?: boolean }): Promise<{
    message: string;
    token: string;
    user: User;
  }> {
    const res = await storefrontApi.login({
      phoneOrEmail: credentials.email,
      password: credentials.password,
      remember: credentials.remember,
    });
    return {
      message: res.message,
      token: res.token || "",
      user: res.user || ({} as User),
    };
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
    const res = await storefrontApi.register({
      name: userData.name,
      phone: userData.phone || userData.email,
      email: userData.email,
      password: userData.password,
      password_confirmation: userData.password,
    });
    return { message: res.message };
  },

  async registerVerify(data: { email: string; otp: string }): Promise<{
    message: string;
    token: string;
    user: User;
  }> {
    const res = await storefrontApi.verifyOtp(data.email, data.otp);
    return {
      message: res.message,
      token: res.token || "",
      user: res.user || ({} as User),
    };
  },

  async forgotPassword(data: { email: string }): Promise<{ message: string }> {
    return storefrontApi.forgotPassword(data.email);
  },

  async verifyResetOtp(data: { email: string; otp: string }): Promise<{ message: string; reset_token: string }> {
    const res = await storefrontApi.verifyOtp(data.email, data.otp);
    return {
      message: res.message,
      reset_token: res.token || "otp_verified",
    };
  },

  async resetPassword(data: { email: string; reset_token: string; password: string; password_confirmation: string }): Promise<{ message: string }> {
    return storefrontApi.resetPassword({
      phoneOrEmail: data.email,
      otp: data.reset_token,
      password: data.password,
      password_confirmation: data.password_confirmation,
    });
  },

  async getProfile(): Promise<{
    user: User;
    total_orders: number;
    total_spent: number;
  }> {
    const res = await storefrontApi.getProfile();
    return {
      user: res.user,
      total_orders: res.total_orders || 0,
      total_spent: res.total_spent || 0,
    };
  },

  async getMyOrders(params?: { per_page?: number; page?: number; all?: boolean }): Promise<{ data: Order[]; total?: number }> {
    return storefrontApi.getMyOrders(params);
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
    return storefrontApi.updateProfile(data);
  },

  async logout(): Promise<void> {
    return storefrontApi.logout();
  },

  // ==========================================
  // Admin Operations (Direct to Laravel)
  // ==========================================
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

  // ==========================================
  // Checkout Lead Capture
  // ==========================================
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
    return storefrontApi.captureLead(data) as any;
  },

  // ==========================================
  // Promotions, Campaigns & Loyalty
  // ==========================================
  async evaluatePromotions(payload: {
    items: Array<{ product_id: number; variant_id?: number | null; quantity: number }>;
    code?: string | null;
    claimed_coupon_id?: number | null;
    shipping_rate?: number;
    payment_method?: string;
    customer_email?: string;
  }): Promise<PromotionEvaluationResult> {
    if (storefrontApi.provider === "senior") {
      try {
        const calc = await storefrontApi.calculateCheckout({
          items: payload.items.map((i) => ({
            product_id: i.product_id,
            qty: i.quantity,
            variant_id: i.variant_id ?? null,
          })),
          coupon_code: payload.code || undefined,
          area_id: payload.shipping_rate && payload.shipping_rate > 60 ? 2 : 1,
        });

        const isDiscounted = calc.discount > 0 || (calc.coupon_discount || 0) > 0;
        const discountAmount = calc.discount || (calc.coupon_discount || 0);
        const shippingRate = calc.shipping_charge ?? calc.shipping_fee ?? 60;
        return {
          valid: isDiscounted || Boolean(calc.is_coupon_valid),
          message: calc.coupon_message || (isDiscounted ? "Coupon applied" : "Coupon checked"),
          error_message: !isDiscounted && !calc.is_coupon_valid ? (calc.coupon_message || "Invalid coupon code") : undefined,
          subtotal: calc.subtotal,
          item_discount: 0,
          order_discount: discountAmount,
          shipping_discount: 0,
          total_discount: discountAmount,
          shipping_amount: shippingRate,
          base_shipping_rate: shippingRate,
          tax_amount: 0,
          grand_total: calc.total,
          applied_promotions: isDiscounted ? [
            {
              promotion_id: 1,
              promotion_name: payload.code || "Coupon Discount",
              code: payload.code || null,
              type: "coupon",
              discount_type: "fixed",
              discount_amount: discountAmount,
            }
          ] : [],
        };
      } catch {
        const rate = payload.shipping_rate || 60;
        return {
          valid: false,
          error_message: "Failed to evaluate promo code.",
          subtotal: 0,
          item_discount: 0,
          order_discount: 0,
          shipping_discount: 0,
          total_discount: 0,
          shipping_amount: rate,
          base_shipping_rate: rate,
          tax_amount: 0,
          grand_total: 0,
          applied_promotions: [],
        };
      }
    }

    const res = await apiClient.post("/promotions/evaluate", payload);
    return res.data;
  },

  async getClaimablePromotions(): Promise<any[]> {
    return storefrontApi.getCoupons();
  },

  async getStorefrontPromotions(placement?: string): Promise<any[]> {
    try {
      const res = await apiClient.get("/promotions/storefront", { params: placement ? { placement } : undefined });
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    } catch {
      return [];
    }
  },

  async getCampaignDetails(slug: string): Promise<{
    found: boolean;
    is_active: boolean;
    promotion?: any;
    products?: Product[];
    message?: string;
  }> {
    const campaign = await storefrontApi.getCampaign(slug);
    if (!campaign) {
      return { found: false, is_active: false };
    }
    return {
      found: true,
      is_active: Boolean(campaign.is_active),
      promotion: {
        id: campaign.id,
        name: campaign.title,
        slug: campaign.slug,
        banner_image: campaign.banner,
        description: campaign.description,
      },
      products: campaign.products,
    };
  },

  async claimPromotion(promotionId: number): Promise<any> {
    try {
      const res = await apiClient.post("/promotions/claim", { promotion_id: promotionId });
      return res.data;
    } catch {
      return { message: "Coupon ready to use" };
    }
  },

  async getMyCoupons(): Promise<{
    claimed: Array<any>;
    available: Array<any>;
    used: Array<any>;
    expired: Array<any>;
  }> {
    try {
      const res = await apiClient.get("/promotions/my-coupons");
      return res.data;
    } catch {
      const available = await storefrontApi.getCoupons();
      return {
        claimed: [],
        available,
        used: [],
        expired: [],
      };
    }
  },

  async getMyStoreCredit(): Promise<{
    balance: number;
    total_credited: number;
    total_debited: number;
    is_frozen: boolean;
    transactions: {
      data: any[];
      current_page: number;
      last_page: number;
      total: number;
    };
  }> {
    try {
      const res = await apiClient.get("/promotions/store-credit");
      return res.data;
    } catch {
      return {
        balance: 0,
        total_credited: 0,
        total_debited: 0,
        is_frozen: false,
        transactions: { data: [], current_page: 1, last_page: 1, total: 0 },
      };
    }
  },

  // ==========================================
  // CMS & Blog
  // ==========================================
  async getPage(slug: string): Promise<import("@/types").CmsPage> {
    return storefrontApi.getPage(slug);
  },

  async getBlogPosts(params?: { page?: number; category?: string; tag?: string }): Promise<{
    data: import("@/types").BlogPost[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  }> {
    const res = await storefrontApi.getBlogPosts(params);
    return {
      data: res.posts,
      current_page: res.current_page || 1,
      last_page: res.last_page || 1,
      total: res.total || res.posts.length,
      per_page: 10,
    };
  },

  async getBlogPost(slug: string): Promise<import("@/types").BlogPost> {
    const res = await storefrontApi.getBlogPost(slug);
    return res.post;
  },

  async getBlogCategories(): Promise<import("@/types").BlogCategory[]> {
    const res = await storefrontApi.getBlogCategories();
    return (res as any)?.categories || (Array.isArray(res) ? res : []);
  },

  async submitBlogComment(postId: number, data: { author_name: string; author_email: string; comment: string }): Promise<{ message: string }> {
    return storefrontApi.submitBlogComment(postId, {
      comment: data.comment,
      author_name: data.author_name,
      author_email: data.author_email,
    });
  },

  async getHomepageSections(): Promise<import("@/types").HomepageSection[]> {
    return storefrontApi.getHomepageSections();
  },

  async getSectionTabProducts(sectionId: number, tabId: string): Promise<import("@/types").Product[]> {
    return storefrontApi.getSectionTabProducts(sectionId, tabId);
  },

  async getHeaderNavigation(): Promise<import("@/types").NavbarItem[]> {
    return storefrontApi.getNavMenu();
  },

  // ==========================================
  // Senior-Specific Features
  // ==========================================
  async getFlashSales(params?: { page?: number; per_page?: number }): Promise<{ products: Product[]; total?: number }> {
    return storefrontApi.getFlashSales(params);
  },

  async getHotDeals(params?: { page?: number; per_page?: number }): Promise<{ products: Product[]; total?: number }> {
    return storefrontApi.getHotDeals(params);
  },

  async getCampaign(slug: string) {
    return storefrontApi.getCampaign(slug);
  },

  async getPaymentGateways() {
    return storefrontApi.getPaymentGateways();
  },

  async getShippingCharges() {
    return storefrontApi.getShippingCharges();
  },

  async calculateCheckout(payload: any) {
    return storefrontApi.calculateCheckout(payload);
  },

  async saveOrder(payload: any, idempotencyKey?: string) {
    return storefrontApi.saveOrder(payload, idempotencyKey);
  },

  async getInitSettings() {
    return storefrontApi.getInitSettings();
  },
};
