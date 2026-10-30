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
  mapSeniorProduct,
  mapSeniorCategory,
  mapSeniorBrand,
  mapSeniorHomeToBanners,
  mapSeniorNavMenuToNavbarItems,
  mapSeniorOrder,
} from "./mappers";

export class SeniorApiAdapter implements IStorefrontApi {
  readonly provider = "senior" as const;
  private client: AxiosInstance;
  private homepageDataPromise: Promise<StorefrontHomepageData> | null = null;
  private homepageDataCache: { data: StorefrontHomepageData; timestamp: number } | null = null;

  constructor(clientInstance?: AxiosInstance) {
    if (clientInstance) {
      this.client = clientInstance;
    } else {
      // In the browser, route through the Next.js server proxy which attaches X-API-KEY securely.
      // On the server (SSR), call the internal senior base or internal URL.
      const isBrowser = typeof window !== "undefined";
      const baseURL = isBrowser
        ? "/api/storefront"
        : (process.env.SENIOR_API_BASE_URL || process.env.INTERNAL_API_URL || "http://127.0.0.1:8000/api/v1");

      this.client = axios.create({
        baseURL,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: isBrowser ? 15000 : 3000,
      });

      // Interceptor to attach Sanctum token and Facebook CAPI headers
      this.client.interceptors.request.use((config) => {
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("auth_token");
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }

          // CAPI Headers
          config.headers["X-Event-Source-Url"] = window.location.href;

          const getCookie = (name: string) => {
            const val = `; ${document.cookie}`;
            const parts = val.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
            return null;
          };

          const fbp = getCookie("_fbp");
          const fbc = getCookie("_fbc");
          if (fbp) config.headers["X-FBP"] = fbp;
          if (fbc) config.headers["X-FBC"] = fbc;

          let deviceId = localStorage.getItem("store_device_id");
          if (!deviceId) {
            deviceId = typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `dev-${Date.now()}`;
            localStorage.setItem("store_device_id", deviceId);
          }
          config.headers["X-Device-ID"] = deviceId;
        } else {
          // On Server (SSR): Attach server-side secret API Key and Origin
          if (process.env.SENIOR_API_KEY) {
            config.headers["X-API-KEY"] = process.env.SENIOR_API_KEY;
          }
          config.headers["Origin"] = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        }
        return config;
      });
    }
  }

  // ==========================================
  // System & Init Settings
  // ==========================================
  async getInitSettings(): Promise<StorefrontInitSettings> {
    const isBrowser = typeof window !== "undefined";
    const res = await this.client.get("/init-settings", { timeout: isBrowser ? 10000 : 2500 });
    return res.data?.data || res.data;
  }

  // ==========================================
  // Homepage & Banners
  // ==========================================
  async getHomepageData(): Promise<StorefrontHomepageData> {
    const now = Date.now();
    if (this.homepageDataCache && now - this.homepageDataCache.timestamp < 60000) {
      return this.homepageDataCache.data;
    }

    if (this.homepageDataPromise) {
      return this.homepageDataPromise;
    }

    const fetchPromise: Promise<StorefrontHomepageData> = (async () => {
      try {
        const res = await this.client.get("/home");
        const rawData = res.data?.data || res.data || {};
        const banners = mapSeniorHomeToBanners(rawData);

        const flashSales = Array.isArray(rawData.flash_sales)
          ? rawData.flash_sales.map(mapSeniorProduct)
          : [];

        const hotDeals = Array.isArray(rawData.hot_deals)
          ? rawData.hot_deals.map(mapSeniorProduct)
          : [];

        const result: StorefrontHomepageData = {
          banners,
          sliders: rawData.sliders || [],
          flash_sales: flashSales,
          hot_deals: hotDeals,
          popup_banners: rawData.popup_banners || [],
        };

        this.homepageDataCache = {
          data: result,
          timestamp: Date.now(),
        };

        return result;
      } catch (err) {
        console.warn("Notice: SeniorApiAdapter.getHomepageData fallback:", err);
        return {
          banners: {
            primary_banners: [],
            secondary_banners: [],
            middle_banners: [],
            bottom_banners: [],
            top_strip: null,
            grid_banners: [],
            all_active_count: 0,
          },
          sliders: [],
          flash_sales: [],
          hot_deals: [],
          popup_banners: [],
        };
      } finally {
        this.homepageDataPromise = null;
      }
    })();

    this.homepageDataPromise = fetchPromise;
    return fetchPromise;
  }

  async getHomepageBanners(): Promise<HomepageBannersResponse> {
    const homeData = await this.getHomepageData();
    return homeData.banners;
  }

  async trackBannerClick(_id: number): Promise<void> {
    // Non-blocking telemetry
    return Promise.resolve();
  }

  async getHomepageSections(): Promise<HomepageSection[]> {
    // Senior backend drives storefront categories via /categories and /category/{slug}.
    // Return empty array so CategoryShowcase renders real category-specific sections.
    return [];
  }

  async getSectionTabProducts(_sectionId: number, _tabId: string): Promise<Product[]> {
    const res = await this.getProducts({ per_page: 8 });
    return res.data;
  }

  // ==========================================
  // Flash Sales, Hot Deals, Campaigns
  // ==========================================
  async getFlashSales(params?: { page?: number; per_page?: number }): Promise<{ products: Product[]; total?: number }> {
    const res = await this.client.get("/flash-sales", { params });
    const rawData = res.data?.data || res.data;
    const rawList = Array.isArray(rawData?.products?.data)
      ? rawData.products.data
      : Array.isArray(rawData?.products)
      ? rawData.products
      : Array.isArray(rawData?.data)
      ? rawData.data
      : (Array.isArray(rawData) ? rawData : []);
    return {
      products: rawList.map(mapSeniorProduct),
      total: rawData?.products?.total ?? res.data?.total ?? rawList.length,
    };
  }

  async getHotDeals(params?: { page?: number; per_page?: number }): Promise<{ products: Product[]; total?: number }> {
    const res = await this.client.get("/hot-deals", { params });
    const rawData = res.data?.data || res.data;
    const rawList = Array.isArray(rawData?.products?.data)
      ? rawData.products.data
      : Array.isArray(rawData?.products)
      ? rawData.products
      : Array.isArray(rawData?.data)
      ? rawData.data
      : (Array.isArray(rawData) ? rawData : []);
    return {
      products: rawList.map(mapSeniorProduct),
      total: rawData?.products?.total ?? res.data?.total ?? rawList.length,
    };
  }

  async getCampaign(slug: string): Promise<StorefrontCampaign | null> {
    try {
      const res = await this.client.get(`/campaign/${slug}`);
      const data = res.data?.data || res.data;
      if (!data) return null;

      const products = Array.isArray(data.products)
        ? data.products.map(mapSeniorProduct)
        : Array.isArray(data.products?.data)
        ? data.products.data.map(mapSeniorProduct)
        : [];

      const selected = Array.isArray(data.selected_products)
        ? data.selected_products.map(mapSeniorProduct)
        : undefined;

      return {
        id: data.id,
        slug,
        title: data.title || data.name,
        banner: data.banner,
        image_one: data.image_one,
        image_two: data.image_two,
        image_three: data.image_three,
        campaign_popup_banner: data.campaign_popup_banner,
        products,
        selected_products: selected,
        event_id: data.event_id,
      };
    } catch {
      return null;
    }
  }

  // ==========================================
  // Navigation & Categories
  // ==========================================
  private tierLookupMap: Map<string, "category" | "subcategory" | "childcategory"> = new Map();
  private tierLookupPromise: Promise<void> | null = null;

  private async ensureTierLookup(): Promise<void> {
    if (this.tierLookupMap.size > 0) return;
    if (this.tierLookupPromise) return this.tierLookupPromise;

    this.tierLookupPromise = (async () => {
      try {
        const res = await this.client.get("/nav-menu");
        const list: any[] = Array.isArray(res.data?.data)
          ? res.data.data
          : (Array.isArray(res.data) ? res.data : []);

        for (const cat of list) {
          if (cat.slug) this.tierLookupMap.set(String(cat.slug).toLowerCase(), "category");
          const subs = Array.isArray(cat.sub_categories)
            ? cat.sub_categories
            : (Array.isArray(cat.subcategories) ? cat.subcategories : []);
          for (const sub of subs) {
            if (sub.slug) this.tierLookupMap.set(String(sub.slug).toLowerCase(), "subcategory");
            const children = Array.isArray(sub.child_categories)
              ? sub.child_categories
              : (Array.isArray(sub.childcategories) ? sub.childcategories : []);
            for (const child of children) {
              if (child.slug) this.tierLookupMap.set(String(child.slug).toLowerCase(), "childcategory");
            }
          }
        }
      } catch (err) {
        console.warn("Notice: Tier lookup populate fallback:", err);
      } finally {
        this.tierLookupPromise = null;
      }
    })();

    return this.tierLookupPromise;
  }

  async getNavMenu(): Promise<NavbarItem[]> {
    const res = await this.client.get("/nav-menu");
    return mapSeniorNavMenuToNavbarItems(res.data);
  }

  async getCategories(): Promise<Category[]> {
    try {
      const res = await this.client.get("/nav-menu");
      const list = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      if (list.length > 0) {
        // Also populate tier lookup map while we have the tree
        for (const cat of list) {
          if (cat.slug) this.tierLookupMap.set(String(cat.slug).toLowerCase(), "category");
          const subs = Array.isArray(cat.sub_categories)
            ? cat.sub_categories
            : (Array.isArray(cat.subcategories) ? cat.subcategories : []);
          for (const sub of subs) {
            if (sub.slug) this.tierLookupMap.set(String(sub.slug).toLowerCase(), "subcategory");
            const children = Array.isArray(sub.child_categories)
              ? sub.child_categories
              : (Array.isArray(sub.childcategories) ? sub.childcategories : []);
            for (const child of children) {
              if (child.slug) this.tierLookupMap.set(String(child.slug).toLowerCase(), "childcategory");
            }
          }
        }
        return list.map(mapSeniorCategory);
      }
    } catch {}

    const res = await this.client.get("/categories");
    const list = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
    return list.map(mapSeniorCategory);
  }

  async getCategory(slug: string, params?: ProductCatalogParams): Promise<StorefrontCategoryPage> {
    const cleanSlug = slug.trim();
    await this.ensureTierLookup();
    const knownTier = this.tierLookupMap.get(cleanSlug.toLowerCase());

    if (knownTier === "childcategory") {
      return this.getChildCategory(cleanSlug, params);
    }
    if (knownTier === "subcategory") {
      return this.getSubcategory(cleanSlug, params);
    }

    const sort = this.normalizeSortParam(params?.sort);
    const queryParams: Record<string, any> = {
      page: params?.page || 1,
      per_page: params?.per_page || 24,
      ...(sort ? { sort } : {}),
      ...(params?.min_price !== undefined ? { min_price: params.min_price } : {}),
      ...(params?.max_price !== undefined ? { max_price: params.max_price } : {}),
    };

    try {
      const res = await this.client.get(`/category/${cleanSlug}`, { params: queryParams });
      const data = res.data?.data || res.data;

      const rawProducts = Array.isArray(data.products?.data)
        ? data.products.data
        : (Array.isArray(data.products) ? data.products : []);

      const categoryObj = data.category || { id: data.id, name: data.name, slug: data.slug || cleanSlug };

      return {
        category: mapSeniorCategory(categoryObj),
        products: rawProducts.map(mapSeniorProduct),
        min_price: data.min_price,
        max_price: data.max_price,
        total: data.products?.total || rawProducts.length,
        current_page: data.products?.current_page || 1,
        last_page: data.products?.last_page || 1,
        event_id: data.event_id,
      };
    } catch (err: any) {
      // If root category endpoint fails (e.g. 404), fall back to subcategory or child-category
      try {
        return await this.getSubcategory(cleanSlug, params);
      } catch {
        try {
          return await this.getChildCategory(cleanSlug, params);
        } catch {
          throw err;
        }
      }
    }
  }

  async getSubcategory(slug: string, params?: ProductCatalogParams): Promise<StorefrontCategoryPage> {
    const sort = this.normalizeSortParam(params?.sort);
    const queryParams = {
      page: params?.page || 1,
      per_page: params?.per_page || 24,
      ...(sort ? { sort } : {}),
      ...(params?.min_price !== undefined ? { min_price: params.min_price } : {}),
      ...(params?.max_price !== undefined ? { max_price: params.max_price } : {}),
    };
    const res = await this.client.get(`/subcategory/${slug}`, { params: queryParams });
    const data = res.data?.data || res.data;
    const rawProducts = Array.isArray(data.products?.data) ? data.products.data : (Array.isArray(data.products) ? data.products : []);
    const categoryObj = data.subcategory || data.sub_category || data.category || { id: data.id, name: data.name, slug: data.slug || slug };
    return {
      category: mapSeniorCategory(categoryObj),
      products: rawProducts.map(mapSeniorProduct),
      total: data.products?.total || rawProducts.length,
      current_page: data.products?.current_page || 1,
      last_page: data.products?.last_page || 1,
      event_id: data.event_id,
    };
  }

  async getChildCategory(slug: string, params?: ProductCatalogParams): Promise<StorefrontCategoryPage> {
    const sort = this.normalizeSortParam(params?.sort);
    const queryParams = {
      page: params?.page || 1,
      per_page: params?.per_page || 24,
      ...(sort ? { sort } : {}),
      ...(params?.min_price !== undefined ? { min_price: params.min_price } : {}),
      ...(params?.max_price !== undefined ? { max_price: params.max_price } : {}),
    };
    const res = await this.client.get(`/child-category/${slug}`, { params: queryParams });
    const data = res.data?.data || res.data;
    const rawProducts = Array.isArray(data.products?.data) ? data.products.data : (Array.isArray(data.products) ? data.products : []);
    const categoryObj = data.childcategory || data.child_category || data.category || { id: data.id, name: data.name, slug: data.slug || slug };
    return {
      category: mapSeniorCategory(categoryObj),
      products: rawProducts.map(mapSeniorProduct),
      total: data.products?.total || rawProducts.length,
      current_page: data.products?.current_page || 1,
      last_page: data.products?.last_page || 1,
      event_id: data.event_id,
    };
  }

  // ==========================================
  // Brands
  // ==========================================
  async getBrands(params?: { is_featured?: boolean }): Promise<Brand[]> {
    const queryParams = params?.is_featured ? { is_featured: 1 } : {};
    const res = await this.client.get("/brands", { params: queryParams });
    const list = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
    return list.map(mapSeniorBrand);
  }

  async getBrand(slug: string, params?: ProductCatalogParams): Promise<StorefrontBrandPage> {
    const sort = this.normalizeSortParam(params?.sort);
    const queryParams = {
      page: params?.page || 1,
      per_page: params?.per_page || 25,
      ...(sort ? { sort } : {}),
      ...(params?.min_price !== undefined ? { min_price: params.min_price } : {}),
      ...(params?.max_price !== undefined ? { max_price: params.max_price } : {}),
    };
    const res = await this.client.get(`/brand/${slug}`, { params: queryParams });
    const data = res.data?.data || res.data;
    const rawProducts = Array.isArray(data.products?.data) ? data.products.data : (Array.isArray(data.products) ? data.products : []);

    return {
      brand: mapSeniorBrand(data.brand || data),
      products: rawProducts.map(mapSeniorProduct),
      min_price: data.min_price,
      max_price: data.max_price,
      total: data.products?.total || rawProducts.length,
      current_page: data.products?.current_page || 1,
      last_page: data.products?.last_page || 1,
      event_id: data.event_id,
    };
  }

  // ==========================================
  // Products & Search
  // ==========================================
  async getProducts(params?: ProductCatalogParams): Promise<PaginatedProductsResponse> {
    // If search term is present, use Senior /search endpoint
    if (params?.search && params.search.trim()) {
      const cat = typeof params.category === "string" ? params.category : (typeof params.categories === "string" ? params.categories : undefined);
      return this.searchProducts(params.search.trim(), cat, params.page);
    }

    // Support both `category` and `categories` parameters (single or comma-separated)
    const catInput = params?.category || params?.categories;
    const catSlugs = catInput
      ? (Array.isArray(catInput) ? catInput : String(catInput).split(",").map((s) => s.trim()).filter(Boolean))
      : [];

    if (catSlugs.length === 1) {
      try {
        const catRes = await this.getCategory(catSlugs[0], params);
        return {
          data: catRes.products,
          current_page: catRes.current_page || 1,
          last_page: catRes.last_page || 1,
          per_page: params?.per_page || 24,
          total: catRes.total ?? catRes.products.length,
        };
      } catch {
        return {
          data: [],
          current_page: 1,
          last_page: 1,
          per_page: params?.per_page || 24,
          total: 0,
        };
      }
    } else if (catSlugs.length > 1) {
      try {
        const results = await Promise.all(
          catSlugs.map((slug) => this.getCategory(slug, params).catch(() => null))
        );
        const seenIds = new Set<number>();
        const merged: Product[] = [];
        for (const r of results) {
          if (r?.products) {
            for (const p of r.products) {
              if (!seenIds.has(p.id)) {
                seenIds.add(p.id);
                merged.push(p);
              }
            }
          }
        }
        return {
          data: merged,
          current_page: 1,
          last_page: 1,
          per_page: params?.per_page || (merged.length > 0 ? merged.length : 24),
          total: merged.length,
        };
      } catch {
        return {
          data: [],
          current_page: 1,
          last_page: 1,
          per_page: params?.per_page || 24,
          total: 0,
        };
      }
    }

    // Support both `brand` and `brands` parameters (single or comma-separated)
    const brandInput = params?.brand || params?.brands;
    const brandSlugs = brandInput
      ? (Array.isArray(brandInput) ? brandInput : String(brandInput).split(",").map((s) => s.trim()).filter(Boolean))
      : [];

    if (brandSlugs.length === 1) {
      try {
        const brandRes = await this.getBrand(brandSlugs[0], params);
        return {
          data: brandRes.products,
          current_page: brandRes.current_page || 1,
          last_page: brandRes.last_page || 1,
          per_page: params?.per_page || 24,
          total: brandRes.total ?? brandRes.products.length,
        };
      } catch {
        return {
          data: [],
          current_page: 1,
          last_page: 1,
          per_page: params?.per_page || 24,
          total: 0,
        };
      }
    } else if (brandSlugs.length > 1) {
      try {
        const results = await Promise.all(
          brandSlugs.map((slug) => this.getBrand(slug, params).catch(() => null))
        );
        const seenIds = new Set<number>();
        const merged: Product[] = [];
        for (const r of results) {
          if (r?.products) {
            for (const p of r.products) {
              if (!seenIds.has(p.id)) {
                seenIds.add(p.id);
                merged.push(p);
              }
            }
          }
        }
        return {
          data: merged,
          current_page: 1,
          last_page: 1,
          per_page: params?.per_page || (merged.length > 0 ? merged.length : 24),
          total: merged.length,
        };
      } catch {
        return {
          data: [],
          current_page: 1,
          last_page: 1,
          per_page: params?.per_page || 24,
          total: 0,
        };
      }
    }

    const sort = this.normalizeSortParam(params?.sort);
    const queryParams: Record<string, any> = {
      page: params?.page || 1,
      per_page: params?.per_page || 12,
      ...(sort ? { sort } : {}),
      ...(params?.min_price !== undefined ? { min_price: params.min_price } : {}),
      ...(params?.max_price !== undefined ? { max_price: params.max_price } : {}),
    };

    const res = await this.client.get("/shop", { params: queryParams });
    const rawData = res.data?.data || res.data;
    const rawList = Array.isArray(rawData?.products?.data)
      ? rawData.products.data
      : Array.isArray(rawData?.products)
      ? rawData.products
      : Array.isArray(rawData?.data)
      ? rawData.data
      : (Array.isArray(rawData) ? rawData : (Array.isArray(res.data?.products?.data) ? res.data.products.data : []));

    const currentPage = rawData?.products?.current_page || rawData?.current_page || res.data?.current_page || 1;
    const lastPage = rawData?.products?.last_page || rawData?.last_page || res.data?.last_page || 1;
    const total = rawData?.products?.total || rawData?.total || res.data?.total || rawList.length;
    const perPage = rawData?.products?.per_page || rawData?.per_page || res.data?.per_page || 12;

    return {
      data: rawList.map(mapSeniorProduct),
      current_page: currentPage,
      last_page: lastPage,
      total,
      per_page: perPage,
    };
  }

  async getProduct(slug: string): Promise<StorefrontProductDetail> {
    const res = await this.client.get(`/product/${slug}`);
    const data = res.data?.data || res.data;
    const productObj = data.product || data;
    const product = mapSeniorProduct(productObj);

    const rawRelated = Array.isArray(data.related_products)
      ? data.related_products
      : Array.isArray(data.related)
      ? data.related
      : [];

    const related = rawRelated.map(mapSeniorProduct);

    return {
      product,
      related,
      event_id: data.event_id || productObj.event_id,
    };
  }

  async searchProducts(keyword: string, category?: string, page = 1): Promise<PaginatedProductsResponse> {
    const params: Record<string, any> = { keyword, page };
    if (category) params.category = category;

    const res = await this.client.get("/search", { params });
    const rawData = res.data?.data || res.data;
    const rawList = Array.isArray(rawData?.products?.data)
      ? rawData.products.data
      : Array.isArray(rawData?.products)
      ? rawData.products
      : Array.isArray(rawData?.data)
      ? rawData.data
      : (Array.isArray(rawData) ? rawData : []);

    const currentPage = rawData?.products?.current_page || rawData?.current_page || 1;
    const lastPage = rawData?.products?.last_page || rawData?.last_page || 1;
    const total = rawData?.products?.total || rawData?.total || rawList.length;
    const perPage = rawData?.products?.per_page || rawData?.per_page || 12;

    return {
      data: rawList.map(mapSeniorProduct),
      current_page: currentPage,
      last_page: lastPage,
      total,
      per_page: perPage,
    };
  }

  // ==========================================
  // Coupons
  // ==========================================
  async getCoupons(): Promise<any[]> {
    const res = await this.client.get("/coupons");
    return Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
  }

  async validateCoupon(code: string, subtotal: number): Promise<CouponValidation> {
    try {
      const res = await this.client.post("/checkout/apply-coupon", {
        coupon_code: code,
        subtotal,
      });
      const data = res.data?.data || res.data;
      return {
        valid: Boolean(res.data?.success !== false),
        code: code.toUpperCase(),
        discount_amount: Number(data.discount || data.discount_amount || 0),
        discount_type: data.discount_type || "fixed",
        message: res.data?.message || "Coupon applied successfully",
      };
    } catch (err: any) {
      return {
        valid: false,
        code,
        message: err.response?.data?.message || "Invalid or expired coupon",
      };
    }
  }

  // ==========================================
  // Cart & Checkout
  // ==========================================
  async calculateCheckout(payload: CheckoutCalculatePayload): Promise<CheckoutCalculateResult> {
    const items = payload.items.map((item) => ({
      product_id: Number(item.product_id),
      qty: Number(item.qty),
      price: item.price ? Number(item.price) : undefined,
      size_id: item.size_id ? Number(item.size_id) : undefined,
      color_id: item.color_id ? Number(item.color_id) : undefined,
    }));

    // Area ID resolution: numeric fallback
    let areaId = 1;
    if (typeof payload.area_id === "number") {
      areaId = payload.area_id;
    } else if (typeof payload.area_id === "string") {
      if (payload.area_id.toLowerCase().includes("outside")) {
        areaId = 2;
      } else {
        areaId = 1;
      }
    }

    try {
      const res = await this.client.post("/checkout/calculate", {
        area_id: areaId,
        coupon_code: payload.coupon_code || undefined,
        items,
      });

      const data = res.data?.data || res.data;
      return {
        subtotal: Number(data.subtotal || 0),
        shipping_fee: Number(data.shipping_fee || 0),
        discount: Number(data.discount || 0),
        total: Number(data.total || 0),
        is_valid: true,
      };
    } catch (err: any) {
      return {
        subtotal: 0,
        shipping_fee: 0,
        discount: 0,
        total: 0,
        is_valid: false,
        notices: [err.response?.data?.message || "Unable to calculate checkout totals."],
      };
    }
  }

  async saveOrder(payload: OrderSavePayload): Promise<OrderSaveResult> {
    let areaVal = "1";
    if (typeof payload.area === "number" || typeof payload.area === "string") {
      areaVal = String(payload.area);
    }

    const items = payload.items.map((item) => ({
      product_id: Number(item.product_id),
      qty: Number(item.qty),
      size_id: item.size_id ? Number(item.size_id) : undefined,
      color_id: item.color_id ? Number(item.color_id) : undefined,
    }));

    const cleanPhone = payload.phone.replace(/\D/g, "");

    const body: Record<string, any> = {
      name: payload.name,
      phone: cleanPhone,
      address: payload.address,
      area: areaVal,
      note: payload.note || undefined,
      payment_method: payload.payment_method,
      coupon_code: payload.coupon_code || undefined,
      items,
      device_type: payload.device_type || "desktop",
      app_type: payload.app_type || "web",
      ...(payload.utm_source ? { utm_source: payload.utm_source } : {}),
      ...(payload.utm_medium ? { utm_medium: payload.utm_medium } : {}),
      ...(payload.utm_campaign ? { utm_campaign: payload.utm_campaign } : {}),
      ...(payload.referrer ? { referrer: payload.referrer } : {}),
      ...(payload.channel ? { channel: payload.channel } : {}),
      ...(payload.domain ? { domain: payload.domain } : {}),
    };

    const res = await this.client.post("/checkout/order-save", body);
    const data = res.data?.data || res.data;

    // If Senior backend returned a customer auth_token from checkout, persist it
    if (data.auth_token && typeof window !== "undefined") {
      localStorage.setItem("auth_token", data.auth_token);
    }

    const invoiceId = data.invoice_id || data.order_id;
    const orderNumber = `INV-${invoiceId}`;

    return {
      success: true,
      order_id: data.order_id,
      invoice_id: data.invoice_id,
      order_number: orderNumber,
      token: data.token,
      total: Number(data.total || 0),
      payment_url: data.payment_url || null,
      auth_token: data.auth_token || null,
      event_id: data.event_id || null,
      message: res.data?.message || "Order placed successfully",
      order: mapSeniorOrder({
        ...data,
        name: payload.name,
        phone: cleanPhone,
        address: payload.address,
        order_number: orderNumber,
        items: payload.items,
      }),
    };
  }

  async captureLead(payload: any): Promise<{ message: string; lead_id?: number }> {
    try {
      const cleanPhone = String(payload.phone || "").replace(/\D/g, "");
      const res = await this.client.post("/checkout/lead", {
        phone: cleanPhone,
        name: payload.name,
        address: payload.address,
        product_ids: payload.product_ids || (Array.isArray(payload.cart_items) ? payload.cart_items.map((i: any) => i.product_id) : undefined),
        utm_source: payload.utm_source,
        utm_medium: payload.utm_medium,
        utm_campaign: payload.utm_campaign,
      });
      return { message: res.data?.message || "Lead captured", lead_id: res.data?.data?.id };
    } catch {
      return { message: "Ignored" };
    }
  }

  // ==========================================
  // Shipping & Payments
  // ==========================================
  async getShippingCharges(): Promise<ShippingChargeItem[]> {
    const res = await this.client.get("/shipping-charges");
    const rawList = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
    return rawList.map((item: any, idx: number) => ({
      id: Number(item.id || idx + 1),
      name: String(item.name || item.title || "Standard Delivery"),
      amount: Number(item.amount || item.charge || item.cost || 60),
    }));
  }

  async getPaymentGateways(): Promise<PaymentGatewayItem[]> {
    const res = await this.client.get("/payment-gateways");
    const rawList = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
    return rawList.map((gw: any) => ({
      type: gw.type,
      name: gw.type === "bkash" ? "bKash Online Payment" : gw.type,
      discount_type: gw.discount_type,
      discount_amount: gw.discount_amount ? Number(gw.discount_amount) : undefined,
      image: gw.image,
    }));
  }

  // ==========================================
  // Customer Authentication
  // ==========================================
  async login(credentials: { phoneOrEmail: string; password: string }): Promise<AuthResponse> {
    const cleanPhone = credentials.phoneOrEmail.replace(/\D/g, "");
    const res = await this.client.post("/auth/login", {
      phone: cleanPhone || credentials.phoneOrEmail,
      password: credentials.password,
    });
    const data = res.data?.data || res.data;
    const token = data.token || "";
    if (token && typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
    const customer = data.customer || {};
    return {
      message: res.data?.message || "Login successful",
      token,
      user: {
        id: Number(customer.id || 1),
        name: customer.name || "Customer",
        email: customer.email || `${cleanPhone}@customer.store`,
        phone: customer.phone || cleanPhone,
        role: "customer",
        created_at: customer.created_at || new Date().toISOString(),
      },
      customer,
    };
  }

  async register(data: { name: string; phone: string; password: string; password_confirmation: string }): Promise<AuthResponse> {
    const cleanPhone = data.phone.replace(/\D/g, "");
    const res = await this.client.post("/auth/register", {
      name: data.name,
      phone: cleanPhone,
      password: data.password,
      password_confirmation: data.password_confirmation,
    });
    const resData = res.data?.data || res.data;
    const token = resData.token || "";
    if (token && typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
    const customer = resData.customer || {};
    return {
      message: res.data?.message || "Registration successful",
      token,
      user: {
        id: Number(customer.id || 1),
        name: customer.name || data.name,
        email: customer.email || `${cleanPhone}@customer.store`,
        phone: customer.phone || cleanPhone,
        role: "customer",
        created_at: customer.created_at || new Date().toISOString(),
      },
      customer,
    };
  }

  async forgotPassword(phoneOrEmail: string): Promise<{ message: string }> {
    const cleanPhone = phoneOrEmail.replace(/\D/g, "");
    const res = await this.client.post("/auth/forgot-password", { phone: cleanPhone });
    return { message: res.data?.message || "OTP code sent successfully" };
  }

  async verifyOtp(phoneOrEmail: string, otp: string): Promise<AuthResponse> {
    const cleanPhone = phoneOrEmail.replace(/\D/g, "");
    const res = await this.client.post("/auth/verify-otp", { phone: cleanPhone, otp: Number(otp) });
    const data = res.data?.data || res.data;
    const token = data.token || "";
    if (token && typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
    const customer = data.customer || {};
    return {
      message: res.data?.message || "Verification successful",
      token,
      user: {
        id: Number(customer.id || 1),
        name: customer.name || "Customer",
        email: customer.email || `${cleanPhone}@customer.store`,
        phone: customer.phone || cleanPhone,
        role: "customer",
        created_at: customer.created_at || new Date().toISOString(),
      },
      customer,
    };
  }

  async resendOtp(phoneOrEmail: string): Promise<{ message: string }> {
    const cleanPhone = phoneOrEmail.replace(/\D/g, "");
    const res = await this.client.post("/auth/resend-otp", { phone: cleanPhone });
    return { message: res.data?.message || "OTP resent successfully" };
  }

  async resetPassword(data: { phoneOrEmail: string; otp: string; password: string; password_confirmation: string }): Promise<{ message: string }> {
    const cleanPhone = data.phoneOrEmail.replace(/\D/g, "");
    const res = await this.client.post("/auth/reset-password", {
      phone: cleanPhone,
      otp: Number(data.otp),
      password: data.password,
      password_confirmation: data.password_confirmation,
    });
    return { message: res.data?.message || "Password reset successfully" };
  }

  async logout(): Promise<void> {
    try {
      await this.client.post("/customer/logout");
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
      }
    }
  }

  // ==========================================
  // Customer Account
  // ==========================================
  async getProfile(): Promise<{ user: User; total_orders?: number; total_spent?: number }> {
    const res = await this.client.get("/customer/profile");
    const c = res.data?.data || res.data;
    return {
      user: {
        id: Number(c.id || 1),
        name: c.name || "Customer",
        email: c.email || "",
        phone: c.phone || "",
        role: "customer",
        created_at: c.created_at || new Date().toISOString(),
      },
      total_orders: c.orders_count || c.total_orders,
      total_spent: c.total_spent ? Number(c.total_spent) : undefined,
    };
  }

  async updateProfile(data: any): Promise<{ message: string; user: User }> {
    const res = await this.client.post("/customer/profile-update", data);
    const c = res.data?.data || res.data;
    return {
      message: res.data?.message || "Profile updated",
      user: {
        id: Number(c.id || 1),
        name: c.name,
        email: c.email,
        phone: c.phone,
        role: "customer",
        created_at: c.created_at || new Date().toISOString(),
      },
    };
  }

  async updatePassword(data: any): Promise<{ message: string }> {
    const res = await this.client.post("/customer/password-update", {
      old_password: data.old_password || data.current_password,
      new_password: data.new_password || data.password,
      new_password_confirmation: data.new_password_confirmation || data.password_confirmation,
    });
    return { message: res.data?.message || "Password updated" };
  }

  async getMyOrders(params?: any): Promise<{ data: Order[]; total?: number }> {
    const res = await this.client.get("/customer/orders", { params });
    const rawList = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
    return {
      data: rawList.map(mapSeniorOrder),
      total: res.data?.total || rawList.length,
    };
  }

  async getOrder(orderNumberOrInvoice: string): Promise<Order> {
    const invoice = orderNumberOrInvoice.replace(/^INV-/, "");
    const res = await this.client.get(`/customer/order/${invoice}`);
    return mapSeniorOrder(res.data?.data || res.data);
  }

  async trackOrder(query: { orderNumber?: string; phone?: string; invoice_id?: string }): Promise<any> {
    const invoice = query.invoice_id || (query.orderNumber ? query.orderNumber.replace(/^INV-/, "").replace(/^ORD-/, "") : "");
    const params = {
      phone: query.phone || "",
      invoice_id: invoice,
    };
    const res = await this.client.get("/order-track", { params });
    const data = res.data?.data || res.data;
    return {
      order_number: `INV-${invoice}`,
      order_status: data.status || data.order_status || "processing",
      payment_status: data.payment_status || "pending",
      carrier: data.courier || data.carrier || "Standard Courier",
      tracking_code: data.tracking_code || null,
      shipment_status: data.status || "processing",
      items: data.items || [],
      total_amount: data.total || 0,
      created_at: data.created_at || new Date().toISOString(),
    };
  }

  async submitReview(productId: number, data: { rating: number; review: string }): Promise<any> {
    const res = await this.client.post("/customer/review", {
      product_id: productId,
      rating: data.rating,
      review: data.review,
    });
    return res.data;
  }

  // ==========================================
  // Blog & CMS
  // ==========================================
  async getBlogPosts(params?: any): Promise<{ posts: BlogPost[]; banners?: any[]; total?: number; current_page?: number; last_page?: number }> {
    const res = await this.client.get("/blog/posts", { params });
    const rawData = res.data?.data || res.data;
    const rawList = Array.isArray(rawData?.data) ? rawData.data : (Array.isArray(rawData) ? rawData : []);
    const posts: BlogPost[] = rawList.map((p: any) => ({
      id: Number(p.id),
      title: String(p.title),
      slug: String(p.slug),
      excerpt: p.excerpt || null,
      content: String(p.content || ""),
      featured_image: p.featured_image || p.image || null,
      featured_image_alt: p.featured_image_alt || null,
      views_count: Number(p.views || p.views_count || 0),
      status: "published" as const,
      published_at: p.published_at || p.created_at || new Date().toISOString(),
      category: p.category ? { id: p.category.id, name: p.category.name, slug: p.category.slug } : undefined,
      tags: Array.isArray(p.tags) ? p.tags.map((t: any) => ({ id: t.id, name: t.name, slug: t.slug })) : [],
      author: p.author ? { id: p.author.id, name: p.author.name } : undefined,
      comments_count: Array.isArray(p.comments) ? p.comments.length : 0,
    }));

    return {
      posts,
      banners: res.data?.banners || [],
      total: rawData?.total || rawList.length,
      current_page: rawData?.current_page || 1,
      last_page: rawData?.last_page || 1,
    };
  }

  async getBlogPost(slug: string): Promise<{ post: BlogPost; banners?: any[]; comments?: any[] }> {
    const res = await this.client.get(`/blog/post/${slug}`);
    const data = res.data?.data || res.data;
    const rawPost = data.post || data;
    const post: BlogPost = {
      id: Number(rawPost.id),
      title: String(rawPost.title),
      slug: String(rawPost.slug || slug),
      content: String(rawPost.content || ""),
      featured_image: rawPost.featured_image || rawPost.image || null,
      views_count: Number(rawPost.views || rawPost.views_count || 0),
      status: "published" as const,
      published_at: rawPost.created_at || new Date().toISOString(),
      category: rawPost.category,
      tags: rawPost.tags || [],
    };
    return {
      post,
      banners: data.banners || res.data?.banners || [],
      comments: data.comments || [],
    };
  }

  async getBlogCategories(): Promise<{ categories: any[]; banners?: any[] }> {
    const res = await this.client.get("/blog/categories");
    return {
      categories: Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []),
      banners: res.data?.banners || [],
    };
  }

  async getBlogTags(): Promise<any[]> {
    const res = await this.client.get("/blog/tags");
    return Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
  }

  async submitBlogComment(postId: number, data: { comment: string; parent_id?: number }): Promise<any> {
    const res = await this.client.post(`/customer/blog/post/${postId}/comment`, {
      comment: data.comment,
      parent_id: data.parent_id,
    });
    return res.data;
  }

  async getPage(slug: string): Promise<CmsPage> {
    const res = await this.client.get(`/page/${slug}`);
    const data = res.data?.data || res.data;
    return {
      id: Number(data.id || 1),
      title: data.title || data.name || "",
      slug: data.slug || slug,
      content: data.description || data.content || data.body || "",
      meta_title: data.meta_title || data.title,
      meta_description: data.meta_description || "",
      is_active: true,
      sort_order: 1,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
    };
  }

  async submitContact(data: { name: string; phone: string; email: string; subject: string; message: string }): Promise<{ message: string }> {
    const res = await this.client.post("/contact-us", data);
    return { message: res.data?.message || "Message sent successfully" };
  }

  // ==========================================
  // Helper: Normalize Sorting Parameter
  // ==========================================
  private normalizeSortParam(sort?: string | number): number | undefined {
    if (!sort) return undefined;
    if (typeof sort === "number") return sort;
    switch (sort) {
      case "newest":
        return 1;
      case "price_desc":
        return 3;
      case "price_asc":
        return 4;
      default:
        return undefined;
    }
  }
}
