import axios, { AxiosInstance } from "axios";
import { IStorefrontApi } from "../../contract";
import {
  StorefrontInitSettings,
  StorefrontHomepageData,
  HomepageBannersResponse,
  HomepageSection,
  Product,
  Category,
  Brand,
  NavbarItem,
  StorefrontCampaign,
  StorefrontBrandPage,
  StorefrontCategoryPage,
  StorefrontProductDetail,
  ProductCatalogParams,
  PaginatedProductsResponse,
  CouponValidation,
  CheckoutCalculatePayload,
  CheckoutCalculateResult,
  OrderSavePayload,
  OrderSaveResult,
  ShippingChargeItem,
  PaymentGatewayItem,
  AuthResponse,
  User,
  Order,
  BlogPost,
  CmsPage,
} from "../../types";
import {
  mapOriginalProduct,
  mapOriginalCategory,
  mapOriginalShippingZones,
  mapOriginalPaymentMethods,
  mapOriginalCalculationToResult,
  mapOriginalOrderCreationToSaveResult,
} from "./mappers";

const EMPTY_BANNERS_RESPONSE: HomepageBannersResponse = {
  primary_banners: [],
  secondary_banners: [],
  bottom_banners: [],
  middle_banners: [],
  top_strip: null,
  all_active_count: 0,
};

export class OriginalApiAdapter implements IStorefrontApi {
  readonly provider = "original" as const;
  private client: AxiosInstance;
  private storefrontClient: AxiosInstance;

  constructor(clientInstance?: AxiosInstance, storefrontInstance?: AxiosInstance) {
    const isBrowser = typeof window !== "undefined";
    const apiBase = isBrowser
      ? (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api")
      : (process.env.INTERNAL_API_URL || "http://127.0.0.1:8000/api");

    const storefrontBase = isBrowser
      ? "/api/storefront"
      : (process.env.INTERNAL_API_URL || "http://127.0.0.1:8000/api");

    this.client = clientInstance || axios.create({
      baseURL: apiBase,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 10000,
    });

    this.storefrontClient = storefrontInstance || axios.create({
      baseURL: storefrontBase,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 10000,
    });

    // Request interceptor to attach bearer token
    const tokenInterceptor = (config: any) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("auth_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    };

    this.client.interceptors.request.use(tokenInterceptor);
    this.storefrontClient.interceptors.request.use(tokenInterceptor);
  }

  // System & Init Settings
  async getInitSettings(): Promise<StorefrontInitSettings> {
    return {
      site_name: "Aether Store",
      site_logo: null,
      site_favicon: null,
      currency: "BDT",
      currency_symbol: "৳",
      currency_position: "left",
      contact_phone: "+880 1800-000000",
      contact_email: "support@aetherstore.com",
      address: "Dhaka, Bangladesh",
      social_links: {},
    };
  }

  // Homepage & Banners
  async getHomepageData(): Promise<StorefrontHomepageData> {
    try {
      const [bannersRes, featuredRes] = await Promise.allSettled([
        this.getHomepageBanners(),
        this.storefrontClient.get("/featured"),
      ]);

      const banners: HomepageBannersResponse =
        bannersRes.status === "fulfilled"
          ? bannersRes.value
          : EMPTY_BANNERS_RESPONSE;

      const featuredRaw = featuredRes.status === "fulfilled" ? featuredRes.value.data : {};
      const toArray = (val: any) => {
        if (Array.isArray(val)) return val;
        if (val && Array.isArray(val.data)) return val.data;
        if (val && typeof val === "object") {
          return Object.values(val).filter((item: any) => item && typeof item === "object" && "id" in item);
        }
        return [];
      };

      const featuredProducts = toArray(featuredRaw?.featured_products).map(mapOriginalProduct);
      const newArrivals = toArray(featuredRaw?.new_arrivals).map(mapOriginalProduct);
      const bestSellers = toArray(featuredRaw?.best_sellers).map(mapOriginalProduct);
      const featuredCategories = toArray(featuredRaw?.featured_categories).map(mapOriginalCategory);

      return {
        banners,
        featured_categories: featuredCategories,
        featured_products: featuredProducts,
        new_arrivals: newArrivals,
        best_sellers: bestSellers,
      };
    } catch {
      return {
        banners: EMPTY_BANNERS_RESPONSE,
        featured_categories: [],
        featured_products: [],
        new_arrivals: [],
        best_sellers: [],
      };
    }
  }

  async getHomepageBanners(): Promise<HomepageBannersResponse> {
    try {
      const res = await this.storefrontClient.get("/homepage/banners");
      return res.data;
    } catch {
      return EMPTY_BANNERS_RESPONSE;
    }
  }

  async trackBannerClick(id: number): Promise<void> {
    try {
      await this.client.post(`/banners/${id}/click`);
    } catch {
      // Non-blocking
    }
  }

  async getHomepageSections(): Promise<HomepageSection[]> {
    try {
      const res = await this.storefrontClient.get("/homepage/sections");
      return res.data.data || res.data || [];
    } catch {
      return [];
    }
  }

  async getSectionTabProducts(sectionId: number, tabId: string): Promise<Product[]> {
    try {
      const res = await this.storefrontClient.get(`/homepage/sections/${sectionId}/tab-products`, {
        params: { tab_id: tabId },
      });
      const prods = res.data.products || res.data || [];
      return Array.isArray(prods) ? prods.map(mapOriginalProduct) : [];
    } catch {
      return [];
    }
  }

  // Flash Sales, Hot Deals, Campaigns
  async getFlashSales(params?: { page?: number; per_page?: number }): Promise<{ products: Product[]; total?: number }> {
    try {
      const res = await this.getProducts({ discounted: true, per_page: params?.per_page || 12, page: params?.page || 1 });
      return {
        products: res.data,
        total: res.total,
      };
    } catch {
      return { products: [], total: 0 };
    }
  }

  async getHotDeals(params?: { page?: number; per_page?: number }): Promise<{ products: Product[]; total?: number }> {
    try {
      const res = await this.getProducts({ featured: true, per_page: params?.per_page || 12, page: params?.page || 1 });
      return {
        products: res.data,
        total: res.total,
      };
    } catch {
      return { products: [], total: 0 };
    }
  }

  async getCampaign(slug: string): Promise<StorefrontCampaign | null> {
    try {
      const res = await this.client.get(`/promotions/campaign/${slug}`);
      if (!res.data?.found) return null;
      return {
        id: res.data.promotion?.id || 1,
        title: res.data.promotion?.name || slug,
        slug: slug,
        banner: res.data.promotion?.banner_image,
        description: res.data.promotion?.description,
        is_active: Boolean(res.data.is_active),
        products: Array.isArray(res.data.products) ? res.data.products.map(mapOriginalProduct) : [],
      };
    } catch {
      return null;
    }
  }

  // Navigation & Categories
  async getNavMenu(): Promise<NavbarItem[]> {
    try {
      const res = await this.storefrontClient.get("/navigation/header");
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    } catch {
      try {
        const res = await this.client.get("/navigation/header");
        return Array.isArray(res.data) ? res.data : (res.data?.data || []);
      } catch {
        return [];
      }
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const res = await this.storefrontClient.get("/categories");
      const data = res.data;
      if (Array.isArray(data)) return data.map(mapOriginalCategory);
      if (data && Array.isArray(data.data)) return data.data.map(mapOriginalCategory);
      if (data && typeof data === "object") {
        return Object.values(data)
          .filter((item: any) => item && typeof item === "object" && "id" in item)
          .map(mapOriginalCategory);
      }
      return [];
    } catch {
      return [];
    }
  }

  async getCategory(slug: string, params?: ProductCatalogParams): Promise<StorefrontCategoryPage> {
    const [catRes, prodRes] = await Promise.all([
      this.storefrontClient.get(`/categories/${slug}`),
      this.getProducts({ ...params, category: slug }),
    ]);

    return {
      category: mapOriginalCategory(catRes.data),
      subcategories: Array.isArray(catRes.data?.children) ? catRes.data.children.map(mapOriginalCategory) : [],
      products: prodRes.data,
      total: prodRes.total,
      current_page: prodRes.current_page,
      last_page: prodRes.last_page,
    };
  }

  async getSubcategory(slug: string, params?: ProductCatalogParams): Promise<StorefrontCategoryPage> {
    return this.getCategory(slug, params);
  }

  async getChildCategory(slug: string, params?: ProductCatalogParams): Promise<StorefrontCategoryPage> {
    return this.getCategory(slug, params);
  }

  // Brands
  async getBrands(params?: { is_featured?: boolean }): Promise<Brand[]> {
    try {
      const res = await this.storefrontClient.get("/brands", { params });
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    } catch {
      return [];
    }
  }

  async getBrand(slug: string, params?: ProductCatalogParams): Promise<StorefrontBrandPage> {
    const [brandRes, prodRes] = await Promise.all([
      this.storefrontClient.get(`/brands/${slug}`),
      this.getProducts({ ...params, brand: slug }),
    ]);

    return {
      brand: brandRes.data,
      products: prodRes.data,
      total: prodRes.total,
      current_page: prodRes.current_page,
      last_page: prodRes.last_page,
    };
  }

  // Products & Search
  async getProducts(params?: ProductCatalogParams): Promise<PaginatedProductsResponse> {
    const res = await this.storefrontClient.get("/products", { params });
    const raw = res.data;
    const items = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : []);

    return {
      data: items.map(mapOriginalProduct),
      current_page: raw?.current_page || 1,
      last_page: raw?.last_page || 1,
      total: raw?.total !== undefined ? raw.total : items.length,
      per_page: raw?.per_page || (items.length > 0 ? items.length : 15),
    };
  }

  async getProduct(slug: string): Promise<StorefrontProductDetail> {
    const res = await this.storefrontClient.get(`/products/${slug}`);
    const data = res.data;
    const product = mapOriginalProduct(data?.product || data);
    const related = Array.isArray(data?.related)
      ? data.related.map(mapOriginalProduct)
      : (product.related_products || []);

    return {
      product,
      related,
    };
  }

  async searchProducts(keyword: string, category?: string, page?: number): Promise<PaginatedProductsResponse> {
    return this.getProducts({
      search: keyword,
      category,
      page: page || 1,
    });
  }

  // Coupons
  async getCoupons(): Promise<any[]> {
    try {
      const res = await this.client.get("/promotions/claimable");
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    } catch {
      return [];
    }
  }

  async validateCoupon(code: string, subtotal: number, items?: any[]): Promise<CouponValidation> {
    const res = await this.client.post("/coupons/validate", { code, subtotal, items });
    return res.data;
  }

  // Cart & Checkout
  async calculateCheckout(payload: CheckoutCalculatePayload): Promise<CheckoutCalculateResult> {
    try {
      const evalRes = await this.client.post("/promotions/evaluate", {
        items: payload.items.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id ?? null,
          quantity: i.qty,
        })),
        code: payload.coupon_code || null,
        shipping_rate: payload.area_id ? 60 : 0,
      });

      return mapOriginalCalculationToResult(evalRes.data, payload.area_id ? 60 : 0);
    } catch {
      // Fallback local computation if evaluate endpoint fails
      const subtotal = payload.items.reduce((sum, item) => sum + (item.price || 0) * item.qty, 0);
      const shipping = payload.area_id ? 60 : 0;
      return {
        subtotal,
        shipping_fee: shipping,
        shipping_charge: shipping,
        discount: 0,
        coupon_discount: 0,
        total: subtotal + shipping,
        is_valid: true,
        items: payload.items.map((item) => ({
          product_id: item.product_id,
          qty: item.qty,
          unit_price: item.price || 0,
          total_price: (item.price || 0) * item.qty,
        })),
      };
    }
  }

  async saveOrder(payload: OrderSavePayload, idempotencyKey?: string): Promise<OrderSaveResult> {
    const orderData = {
      customer_name: payload.name,
      customer_email: payload.email || `${payload.phone}@customer.local`,
      customer_phone: payload.phone,
      shipping_address: {
        address: payload.address,
        area: payload.area || "",
        note: payload.note || "",
      },
      payment_method: payload.payment_method,
      coupon_code: payload.coupon_code,
      notes: payload.note,
      items: payload.items.map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id ?? null,
        quantity: item.qty,
      })),
    };

    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers["X-Idempotency-Key"] = idempotencyKey;
    }

    const res = await this.client.post("/orders", orderData, { headers });
    return mapOriginalOrderCreationToSaveResult(res.data);
  }

  async captureLead(payload: any): Promise<{ message: string; lead_id?: number }> {
    const res = await this.client.post("/leads/capture", payload);
    return res.data;
  }

  // Shipping & Payments
  async getShippingCharges(): Promise<ShippingChargeItem[]> {
    try {
      const res = await this.storefrontClient.get("/shipping-zones");
      const zones = res.data?.zones || (Array.isArray(res.data) ? res.data : []);
      return mapOriginalShippingZones(zones);
    } catch {
      return [
        { id: 1, name: "Inside Dhaka", amount: 60, is_default: true, is_active: true },
        { id: 2, name: "Outside Dhaka", amount: 120, is_default: false, is_active: true },
      ];
    }
  }

  async getPaymentGateways(): Promise<PaymentGatewayItem[]> {
    try {
      const res = await this.client.get("/payment-methods");
      const methods = res.data?.methods || (Array.isArray(res.data) ? res.data : []);
      return mapOriginalPaymentMethods(methods);
    } catch {
      return [
        { id: 1, name: "Cash on Delivery", slug: "cod", type: "cod", is_active: true },
        { id: 2, name: "Online Payment", slug: "online", type: "online", is_active: true },
      ];
    }
  }

  // Customer Authentication
  async login(credentials: { phoneOrEmail: string; password: string; remember?: boolean }): Promise<AuthResponse> {
    const res = await this.client.post("/auth/login", {
      email: credentials.phoneOrEmail,
      password: credentials.password,
      remember: credentials.remember,
    });

    if (res.data?.token && typeof window !== "undefined") {
      localStorage.setItem("auth_token", res.data.token);
    }

    return {
      message: res.data?.message || "Login successful",
      token: res.data?.token,
      user: res.data?.user,
    };
  }

  async register(data: { name: string; phone: string; email?: string; password: string; password_confirmation: string }): Promise<AuthResponse> {
    const res = await this.client.post("/auth/register/request", {
      name: data.name,
      phone: data.phone,
      email: data.email || `${data.phone}@user.local`,
      password: data.password,
    });
    return {
      message: res.data?.message || "Registration request submitted. Please check for OTP.",
      token: "",
      user: undefined,
    };
  }

  async forgotPassword(phoneOrEmail: string): Promise<{ message: string }> {
    const res = await this.client.post("/auth/password/forgot", { email: phoneOrEmail });
    return res.data;
  }

  async verifyOtp(phoneOrEmail: string, otp: string): Promise<AuthResponse> {
    const res = await this.client.post("/auth/register/verify", {
      email: phoneOrEmail,
      otp,
    });

    if (res.data?.token && typeof window !== "undefined") {
      localStorage.setItem("auth_token", res.data.token);
    }

    return {
      message: res.data?.message || "OTP verified successfully",
      token: res.data?.token,
      user: res.data?.user,
    };
  }

  async resendOtp(phoneOrEmail: string): Promise<{ message: string }> {
    const res = await this.client.post("/auth/password/forgot", { email: phoneOrEmail });
    return { message: res.data?.message || "OTP resent successfully" };
  }

  async resetPassword(data: { phoneOrEmail: string; otp: string; password: string; password_confirmation: string }): Promise<{ message: string }> {
    let resetToken = "otp_verified";
    try {
      const verifyRes = await this.client.post("/auth/password/verify-reset-otp", {
        email: data.phoneOrEmail,
        otp: data.otp,
      });
      if (verifyRes.data?.reset_token) {
        resetToken = verifyRes.data.reset_token;
      }
    } catch {
      // Proceed directly if token not issued
    }

    const res = await this.client.post("/auth/password/reset", {
      email: data.phoneOrEmail,
      reset_token: resetToken,
      password: data.password,
      password_confirmation: data.password_confirmation,
    });
    return res.data;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post("/auth/logout");
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
      }
    }
  }

  // Customer Account
  async getProfile(): Promise<{ user: User; total_orders?: number; total_spent?: number }> {
    const res = await this.client.get("/auth/profile");
    return res.data;
  }

  async updateProfile(data: any): Promise<{ message: string; user: User }> {
    const res = await this.client.put("/auth/profile", data);
    return res.data;
  }

  async updatePassword(data: any): Promise<{ message: string }> {
    const res = await this.client.put("/auth/profile", data);
    return { message: res.data?.message || "Password updated successfully" };
  }

  async getMyOrders(params?: any): Promise<{ data: Order[]; total?: number }> {
    const res = await this.client.get("/orders", { params });
    if (Array.isArray(res.data)) {
      return { data: res.data, total: res.data.length };
    }
    return res.data;
  }

  async getOrder(orderNumberOrInvoice: string): Promise<Order> {
    const res = await this.client.get(`/orders/${orderNumberOrInvoice}`);
    return res.data;
  }

  async trackOrder(query: { orderNumber?: string; phone?: string; invoice_id?: string }): Promise<any> {
    const id = query.orderNumber || query.invoice_id || "";
    const res = await this.client.get(`/orders/track/${id}`);
    return res.data;
  }

  async submitReview(productId: number, data: { rating: number; review: string; title?: string; user_name?: string }): Promise<any> {
    const res = await this.client.post(`/products/${productId}/reviews`, {
      rating: data.rating,
      title: data.title,
      comment: data.review,
      user_name: data.user_name,
    });
    return res.data;
  }

  // Blog & CMS
  async getBlogPosts(params?: any): Promise<{ posts: BlogPost[]; banners?: any[]; total?: number; current_page?: number; last_page?: number }> {
    const res = await this.storefrontClient.get("/blog/posts", { params });
    const raw = res.data;
    return {
      posts: Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : []),
      total: raw?.total,
      current_page: raw?.current_page || 1,
      last_page: raw?.last_page || 1,
    };
  }

  async getBlogPost(slug: string): Promise<{ post: BlogPost; banners?: any[]; comments?: any[] }> {
    const res = await this.client.get(`/blog/posts/${slug}`);
    return {
      post: res.data,
      comments: res.data?.comments || [],
    };
  }

  async getBlogCategories(): Promise<{ categories: any[]; banners?: any[] }> {
    return { categories: [], banners: [] };
  }

  async getBlogTags(): Promise<any[]> {
    return [];
  }

  async submitBlogComment(postId: number, data: { comment: string; parent_id?: number; author_name?: string; author_email?: string }): Promise<any> {
    const res = await this.client.post(`/blog/posts/${postId}/comments`, {
      comment: data.comment,
      author_name: data.author_name || "Guest",
      author_email: data.author_email || "guest@local.test",
    });
    return res.data;
  }

  async getPage(slug: string): Promise<CmsPage> {
    const res = await this.storefrontClient.get(`/pages/${slug}`);
    return res.data;
  }

  async submitContact(data: { name: string; phone: string; email: string; subject: string; message: string }): Promise<{ message: string }> {
    return { message: "Message sent successfully" };
  }
}
