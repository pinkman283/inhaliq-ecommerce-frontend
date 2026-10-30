import axios from "axios";
import { 
  AdminAnalytics, 
  AuditLog,
  AuditLogsResponse,
  BlockedIp,
  Brand,
  Category, 
  CustomerActivityTimelineItem,
  CustomerIpHistoryItem,
  Expense, 
  ExpenseCategory, 
  FinancialSummary, 
  GoodsReceipt, 
  InventoryCostLayer, 
  InventoryMovement, 
  Lead, 
  LeadStats, 
  Order, 
  OrderReturn,
  OrderReturnItem,
  CourierSettlement,
  CourierSettlementItem,
  PosCashMovement, 
  PosReceipt, 
  PosRegister, 
  PosRegisterSession, 
  Product, 
  ImportValidationReport,
  ImportCommitResult,
  ProductProfitabilityItem, 
  ProductValuation, 
  PurchaseOrder, 
  SalesInvoice,
  SalesSummary,
  Shipment,
  User, 
  Vendor, 
  VendorAnalyticsItem, 
  VendorProduct,
  AccountingOverviewResponse,
  AccountingLedgerResponse,
  AccountingReceivablesResponse,
  AccountingPayablesResponse,
  AccountingBankingResponse,
  AccountingReportsResponse,
  ChartOfAccountItem,
  JournalEntryItem,
  CustomerPaymentItem,
  SupplierPaymentItem,
  BankAccountItem,
  Color,
  BlogCategory,
  BlogTag,
  BlogPost,
  BlogComment,
  BlogSummary,
  CmsPage,
  FooterColumn,
  FooterLink,
  SocialLink,
  NavbarItem,
  NavigationOptions,
  ReviewSummary,
  Banner,
  Integration,
  IntegrationStats,
  ExtendedSettingsResponse,
  ReportData,
  DetailedAcquisitionReportData,
  Promotion,
  PromotionCode,
  PromotionClaim,
  PromotionRedemption,
  StoreCreditAccount,
  StoreCreditTransaction,
  PromotionAnalyticsData,
  AdminNotification,
  AdminNotificationsResponse,
} from "@/types";

const API_BASE_URL = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api")
  : (process.env.INTERNAL_API_URL || "http://127.0.0.1:8000/api");

export const adminClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000,
});

// Attach isolated admin token to requests
adminClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("aether_admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor: on 401 or 403 on admin routes
adminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined") {
      if (error.response?.status === 401 || (error.response?.status === 403 && !window.location.pathname.includes("/admin/login"))) {
        localStorage.removeItem("aether_admin_token");
        localStorage.removeItem("aether_admin_user");
        if (window.location.pathname.startsWith("/admin") && !window.location.pathname.includes("/admin/login")) {
          window.location.href = "/admin/login?error=session_expired";
        }
      }
    }
    return Promise.reject(error);
  }
);

export class OptimizationError extends Error {
  status: number;
  code: string;
  upstreamStatus?: number;

  constructor(message: string, status: number, code: string = "OPTIMIZATION_FAILED", upstreamStatus?: number) {
    super(message);
    this.name = "OptimizationError";
    this.status = status;
    this.code = code;
    this.upstreamStatus = upstreamStatus;
  }

  get isAuthError(): boolean {
    return (
      this.status === 401 ||
      this.status === 403 ||
      this.code === "AUTH_REQUIRED" ||
      this.code === "AUTH_INVALID" ||
      this.code === "FORBIDDEN"
    );
  }

  get isServiceUnavailable(): boolean {
    return (
      this.status === 502 ||
      this.status === 503 ||
      this.status === 504 ||
      this.code === "SERVICE_UNCONFIGURED" ||
      this.code === "UPSTREAM_UNAVAILABLE" ||
      this.code === "UPSTREAM_TIMEOUT" ||
      this.code === "AUTH_SERVICE_UNAVAILABLE" ||
      this.code === "NETWORK_ERROR"
    );
  }

  get isPayloadTooLarge(): boolean {
    return this.status === 413 || this.code === "PAYLOAD_TOO_LARGE";
  }
}

export interface OptimizeImageResult {
  file: File;
  reductionPercent?: string;
  originalBytes: number;
  optimizedBytes: number;
  outputFormat: string;
}

export const adminApi = {
  client: adminClient,

  // ==========================================
  // AUTHENTICATION
  // ==========================================
  async login(credentials: { email: string; password: string }): Promise<{
    message: string;
    token: string;
    user: User;
  }> {
    const res = await adminClient.post("/admin/auth/login", credentials);
    return res.data;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await adminClient.get("/admin/auth/me");
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
    const res = await adminClient.put("/admin/auth/profile", data);
    return res.data;
  },

  async inviteAdmin(data: { email: string; role: string; name?: string }): Promise<{ message: string }> {
    const res = await adminClient.post("/admin/auth/invite", data);
    return res.data;
  },

  async activateAdmin(data: { token: string; email: string; password: string; password_confirmation: string }): Promise<{ message: string }> {
    const res = await adminClient.post("/admin/auth/activate", data);
    return res.data;
  },

  async logout(): Promise<void> {
    try {
      await adminClient.post("/admin/auth/logout");
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("aether_admin_token");
        localStorage.removeItem("aether_admin_user");
      }
    }
  },

  async updateAdminTheme(theme: "dark" | "light"): Promise<{ message: string; theme: "dark" | "light" }> {
    const res = await adminClient.put("/admin/auth/theme", { theme });
    return res.data;
  },

  // ==========================================
  // ANALYTICS & DASHBOARD
  // ==========================================
  async getAnalytics(): Promise<AdminAnalytics> {
    const res = await adminClient.get("/admin/analytics");
    return res.data;
  },

  // ==========================================
  // OPERATIONAL NOTIFICATIONS
  // ==========================================
  async getNotifications(params?: {
    category?: string;
    unread_only?: boolean;
    page?: number;
    per_page?: number;
  }): Promise<AdminNotificationsResponse> {
    const res = await adminClient.get("/admin/notifications", { params });
    return res.data;
  },

  async getNotificationUnreadCount(): Promise<{ unread_count: number }> {
    const res = await adminClient.get("/admin/notifications/unread-count");
    return res.data;
  },

  async markNotificationRead(id: number): Promise<{ message: string; unread_count: number }> {
    const res = await adminClient.post(`/admin/notifications/${id}/read`);
    return res.data;
  },

  async markAllNotificationsRead(): Promise<{ message: string; unread_count: number }> {
    const res = await adminClient.post("/admin/notifications/mark-all-read");
    return res.data;
  },

  async deleteNotification(id: number): Promise<{ message: string; unread_count: number }> {
    const res = await adminClient.delete(`/admin/notifications/${id}`);
    return res.data;
  },

  // ==========================================
  // PRODUCT CATALOG
  // ==========================================
  async getProducts(params?: {
    search?: string;
    category_id?: number | string;
    subcategory_id?: number | string;
    child_category_id?: number | string;
    brand_id?: number | string;
    stock_status?: string;
    media_filter?: "all" | "has_images" | "no_images";
    sort?: string;
    is_active?: boolean;
    has_variants?: boolean;
    page?: number;
    per_page?: number;
  }): Promise<{
    data: Product[];
    total: number;
    current_page: number;
    last_page: number;
    from?: number;
    to?: number;
    stats?: {
      total_products: number;
      total_warehouse_units: number;
      total_categories: number;
      low_stock_count: number;
      out_of_stock_count: number;
      products_without_images_count?: number;
    };
  }> {
    const res = await adminClient.get("/admin/products", { params });
    return res.data;
  },

  async getProduct(id: number): Promise<Product> {
    const res = await adminClient.get(`/admin/products/${id}`);
    return res.data;
  },

  async optimizeImage(
    file: File,
    options: {
      profile?: "product" | "thumbnail" | "banner" | "brand" | "lossless";
      outputFormat?: "auto" | "webp" | "jpeg" | "png" | "preserve";
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
    } = {}
  ): Promise<OptimizeImageResult> {
    const token = typeof window !== "undefined" ? localStorage.getItem("aether_admin_token") : null;
    const formData = new FormData();
    formData.append("file", file);
    if (options.profile) formData.append("profile", options.profile);
    if (options.outputFormat) formData.append("output_format", options.outputFormat);
    if (options.quality) formData.append("quality", String(options.quality));
    if (options.maxWidth) formData.append("max_width", String(options.maxWidth));
    if (options.maxHeight) formData.append("max_height", String(options.maxHeight));

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch("/api/admin/optimize", {
        method: "POST",
        headers,
        body: formData,
      });
    } catch (networkErr: unknown) {
      const msg = networkErr instanceof Error ? networkErr.message : "Network error contacting optimization proxy";
      throw new OptimizationError(`Optimization service unreachable: ${msg}`, 502, "NETWORK_ERROR");
    }

    if (!response.ok) {
      let errorMsg = `Optimization failed with status ${response.status}`;
      let errorCode = "OPTIMIZATION_FAILED";
      let upstreamStatus: number | undefined;
      try {
        const errorData = await response.json();
        if (errorData.error) errorMsg = errorData.error;
        if (errorData.code) errorCode = errorData.code;
        if (errorData.upstreamStatus) upstreamStatus = errorData.upstreamStatus;
      } catch {
        // use fallback message
      }
      throw new OptimizationError(errorMsg, response.status, errorCode, upstreamStatus);
    }

    const contentType = response.headers.get("content-type") || "image/webp";
    const reductionPercent = response.headers.get("x-image-reduction-percent") || undefined;
    const originalBytes = Number(response.headers.get("x-image-original-bytes")) || file.size;
    const blob = await response.blob();
    const optimizedBytes = Number(response.headers.get("x-image-optimized-bytes")) || blob.size;
    const outputFormat = response.headers.get("x-image-output-format") || "webp";

    const baseName = file.name.replace(/\.[^/.]+$/, "");
    let ext = "webp";
    if (contentType.includes("png") || outputFormat.toLowerCase() === "png") ext = "png";
    else if (contentType.includes("jpeg") || outputFormat.toLowerCase() === "jpeg") ext = "jpg";
    else if (contentType.includes("svg") || outputFormat.toLowerCase() === "svg") ext = "svg";
    else if (contentType.includes("icon") || outputFormat.toLowerCase() === "ico") ext = "ico";

    const optimizedFile = new File([blob], `${baseName}.${ext}`, {
      type: contentType,
      lastModified: Date.now(),
    });

    return {
      file: optimizedFile,
      reductionPercent,
      originalBytes,
      optimizedBytes,
      outputFormat,
    };
  },

  async uploadProductImage(file: File): Promise<{ message: string; image_url: string; path: string }> {
    const formData = new FormData();
    formData.append("image", file);
    const res = await adminClient.post("/admin/products/upload-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async deleteUncommittedImage(payload: { path?: string; image_url?: string }): Promise<{ message: string; path?: string }> {
    const res = await adminClient.post("/admin/products/delete-uncommitted-image", payload);
    return res.data;
  },

  async createProduct(data: any): Promise<{ message: string; product: Product }> {
    const res = await adminClient.post("/admin/products", data);
    return res.data;
  },

  async updateProduct(id: number, data: any): Promise<{ message: string; product: Product }> {
    const res = await adminClient.put(`/admin/products/${id}`, data);
    return res.data;
  },

  async deleteProduct(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/products/${id}`);
    return res.data;
  },

  async bulkDeleteProducts(ids: number[]): Promise<{
    message: string;
    deleted_count: number;
    blocked_count?: number;
    blocked?: Array<{ id: number; name: string; sku?: string; conflicts: any }>;
  }> {
    const res = await adminClient.post("/admin/products/bulk-delete", { ids });
    return res.data;
  },

  async bulkUpdateProducts(payload: {
    product_ids: number[];
    operation: "activate" | "deactivate" | "category" | "brand" | "price" | "stock";
    category_id?: number;
    brand_id?: number;
    adjustment_type?: "percentage" | "fixed";
    value?: number;
    rounding?: "none" | "round" | "ceil" | "floor" | "round_99";
    stock_mode?: "set" | "increase" | "decrease";
    stock_quantity?: number;
  }): Promise<{
    message: string;
    operation: string;
    affected_count: number;
    product_ids: number[];
  }> {
    const res = await adminClient.post("/admin/products/bulk-update", payload);
    return res.data;
  },

  async bulkQuickSaveProducts(payload: {
    products?: Array<{
      id: number;
      cost_price?: number | null;
      compare_at_price?: number | null;
      price?: number;
      stock_quantity?: number;
      is_featured?: boolean;
      is_best_seller?: boolean;
      is_active?: boolean;
    }>;
    variants?: Array<{
      id: number;
      cost_price?: number | null;
      price?: number;
      stock_quantity?: number;
      is_active?: boolean;
    }>;
  }): Promise<{
    success: boolean;
    message: string;
    products_updated: number;
    variants_updated: number;
  }> {
    const res = await adminClient.post("/admin/products/bulk-quick-save", payload);
    return res.data;
  },

  async exportProducts(params?: {
    search?: string;
    category_id?: number | string;
    brand_id?: number | string;
    stock_status?: string;
    media_filter?: "all" | "has_images" | "no_images";
    badge?: string;
    is_active?: boolean | string;
    status?: string;
    sort?: string;
  }): Promise<{ blob: Blob; filename: string }> {
    try {
      const res = await adminClient.get("/admin/products/export", {
        params,
        responseType: "blob",
      });

      let filename = `products-export-${new Date().toISOString().slice(0, 10)}.csv`;
      const disposition = res.headers?.["content-disposition"];
      if (disposition && typeof disposition === "string") {
        const match = disposition.match(/filename="?([^";]+)"?/i);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      return { blob: res.data as Blob, filename };
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown }; message?: string };
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed && (parsed.message || parsed.error)) {
            err.message = parsed.message || parsed.error;
          }
        } catch {
          // ignore parsing error
        }
      }
      throw error;
    }
  },

  async downloadProductImportTemplate(): Promise<{ blob: Blob; filename: string }> {
    const res = await adminClient.get("/admin/products/import/template", {
      responseType: "blob",
    });
    return {
      blob: res.data,
      filename: "product_bulk_import_template.csv",
    };
  },

  async validateProductImport(file: File): Promise<ImportValidationReport> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await adminClient.post("/admin/products/import/validate", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    });
    return res.data;
  },

  async commitProductImport(importToken: string): Promise<ImportCommitResult> {
    const res = await adminClient.post(
      "/admin/products/import/commit",
      { import_token: importToken },
      { timeout: 60000 }
    );
    return res.data;
  },

  // ==========================================
  // CATEGORIES
  // ==========================================
  async getCategories(): Promise<Category[]> {
    const res = await adminClient.get("/admin/categories");
    return res.data;
  },

  async createCategory(data: any): Promise<{ message: string; category: Category }> {
    const res = await adminClient.post("/admin/categories", data);
    return res.data;
  },

  async updateCategory(id: number, data: any): Promise<{ message: string; category: Category }> {
    const res = await adminClient.put(`/admin/categories/${id}`, data);
    return res.data;
  },

  async deleteCategory(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/categories/${id}`);
    return res.data;
  },

  async uploadCategoryImage(file: File): Promise<{ message: string; image_url: string; path: string; filename: string }> {
    const formData = new FormData();
    formData.append("image", file);
    const res = await adminClient.post("/admin/categories/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  async bulkDeleteCategories(ids: number[]): Promise<{ message: string; deleted_count: number; skipped_count?: number }> {
    const res = await adminClient.post("/admin/categories/bulk-delete", { ids });
    return res.data;
  },

  // ==========================================
  // BRANDS
  // ==========================================
  async getBrands(): Promise<Brand[]> {
    const res = await adminClient.get("/admin/brands");
    return res.data;
  },

  async getBrand(id: number): Promise<Brand> {
    const res = await adminClient.get(`/admin/brands/${id}`);
    return res.data;
  },

  async createBrand(data: any): Promise<{ message: string; brand: Brand }> {
    const res = await adminClient.post("/admin/brands", data);
    return res.data;
  },

  async updateBrand(id: number, data: any): Promise<{ message: string; brand: Brand }> {
    const res = await adminClient.put(`/admin/brands/${id}`, data);
    return res.data;
  },

  async deleteBrand(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/brands/${id}`);
    return res.data;
  },

  async bulkDeleteBrands(ids: number[]): Promise<{ message: string; deleted_count: number; skipped_count?: number }> {
    const res = await adminClient.post("/admin/brands/bulk-delete", { ids });
    return res.data;
  },

  async uploadBrandLogo(file: File): Promise<{ message: string; logo_url: string; image_url: string; path: string; filename: string }> {
    const formData = new FormData();
    formData.append("logo", file);
    const res = await adminClient.post("/admin/brands/upload-logo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  // ==========================================
  // ORDERS
  // ==========================================
  async getOrderCounts(): Promise<{
    all: number;
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    refunded: number;
    payment_pending: number;
    payment_paid: number;
  }> {
    const res = await adminClient.get("/admin/orders/counts");
    return res.data;
  },

  async getOrders(params?: {
    search?: string;
    status?: string;
    payment_status?: string;
    payment_method?: string;
    source?: string;
    carrier?: string;
    date_from?: string;
    date_to?: string;
    min_total?: string;
    max_total?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ data: Order[]; total: number; current_page: number; last_page: number }> {
    const res = await adminClient.get("/admin/orders", { params });
    return res.data;
  },

  async getOrder(id: number): Promise<Order> {
    const res = await adminClient.get(`/admin/orders/${id}`);
    return res.data;
  },

  async createOrder(data: any): Promise<{ message: string; order: Order }> {
    const res = await adminClient.post("/admin/orders", data);
    return res.data;
  },

  async updateOrder(id: number, data: any): Promise<{ message: string; order: Order }> {
    const res = await adminClient.put(`/admin/orders/${id}`, data);
    return res.data;
  },

  async deleteOrder(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/orders/${id}`);
    return res.data;
  },

  async bulkDeleteOrders(ids: number[]): Promise<{ message: string; deleted_count: number }> {
    const res = await adminClient.post("/admin/orders/bulk-delete", { ids });
    return res.data;
  },

  async updateOrderStatus(id: number, data: {
    order_status: string;
    payment_status?: string;
    carrier?: string;
    tracking_code?: string;
    notes?: string;
  }): Promise<{ message: string; order: Order }> {
    const res = await adminClient.patch(`/admin/orders/${id}/status`, data);
    return res.data;
  },

  async recordOrderPayment(id: number, data?: { amount?: number; notes?: string }): Promise<{
    message: string;
    payment: any;
    order: Order;
  }> {
    const res = await adminClient.post(`/admin/orders/${id}/payments`, data || {});
    return res.data;
  },

  async refundOrder(id: number, data: { reason: string; restock?: boolean }): Promise<{ message: string; order: Order }> {
    const res = await adminClient.post(`/admin/orders/${id}/refund`, data);
    return res.data;
  },

  // ==========================================
  // COURIER & SHIPMENT FULFILLMENT
  // ==========================================
  async getCourierOptions(orderId: number): Promise<{
    order_id: number;
    order_number: string;
    customer_name: string;
    customer_phone?: string;
    shipping_address: any;
    payment_status: string;
    suggested_cod_amount: number;
    suggested_weight: number;
    default_provider: string;
    providers: Array<{
      provider: string;
      name: string;
      is_enabled: boolean;
      is_test_mode: boolean;
      test_status?: string;
      test_message?: string;
      stores?: Array<{ store_id: number; store_name: string; store_address: string }>;
    }>;
    active_shipment?: Shipment | null;
  }> {
    const res = await adminClient.get(`/admin/orders/${orderId}/courier-options`);
    return res.data;
  },

  async bookShipment(orderId: number, data: {
    provider: string;
    weight?: number;
    cod_amount?: number;
    pickup_store_id?: string;
    notes?: string;
    delivery_area?: string;
    recipient_city_id?: number;
    recipient_zone_id?: number;
    recipient_area_id?: number;
  }): Promise<{ message: string; shipment: Shipment; order: Order }> {
    const res = await adminClient.post(`/admin/orders/${orderId}/shipments`, data);
    return res.data;
  },

  async getOrderTimeline(orderId: number): Promise<{
    order_id: number;
    order_number: string;
    timeline: Array<{
      id?: number;
      event_type: string;
      title: string;
      description?: string;
      actor_type?: string;
      actor_name?: string;
      occurred_at: string;
      metadata?: any;
    }>;
  }> {
    const res = await adminClient.get(`/admin/orders/${orderId}/timeline`);
    return res.data;
  },

  async getPathaoCities(): Promise<{ cities: Array<{ city_id: number; city_name: string }> }> {
    const res = await adminClient.get("/admin/orders/courier/pathao/cities");
    return res.data;
  },

  async getPathaoZones(cityId: number): Promise<{ zones: Array<{ zone_id: number; zone_name: string }> }> {
    const res = await adminClient.get(`/admin/orders/courier/pathao/zones/${cityId}`);
    return res.data;
  },

  async getPathaoAreas(zoneId: number): Promise<{ areas: Array<{ area_id: number; area_name: string }> }> {
    const res = await adminClient.get(`/admin/orders/courier/pathao/areas/${zoneId}`);
    return res.data;
  },

  async calculateCourierPrice(orderId: number, data: {
    provider: string;
    recipient_city_id: number;
    recipient_zone_id: number;
    recipient_area_id?: number;
    weight: number;
    pickup_store_id?: string;
    delivery_type?: number;
  }): Promise<{
    success: boolean;
    order_id: number;
    order_number: string;
    pricing: {
      success: boolean;
      price: number;
      delivery_charge: number;
      additional_charge: number;
      cod_charge: number;
      total_charge: number;
      plan: string;
      message?: string;
    };
  }> {
    const res = await adminClient.post(`/admin/orders/${orderId}/courier/calculate-price`, data);
    return res.data;
  },

  async trackShipment(orderId: number, shipmentId: number): Promise<{
    message: string;
    shipment: Shipment;
    order: Order;
  }> {
    const res = await adminClient.get(`/admin/orders/${orderId}/shipments/${shipmentId}/track`);
    return res.data;
  },

  async cancelShipment(orderId: number, shipmentId: number): Promise<{
    message: string;
    shipment: Shipment;
    order: Order;
  }> {
    const res = await adminClient.post(`/admin/orders/${orderId}/shipments/${shipmentId}/cancel`);
    return res.data;
  },

  async getShippingLabel(orderId: number, shipmentId: number): Promise<{ label: any }> {
    const res = await adminClient.get(`/admin/orders/${orderId}/shipments/${shipmentId}/label`);
    return res.data;
  },

  async bulkBookCourier(
    target: number[] | {
      order_ids?: number[];
      provider?: string;
      pickup_store_id?: string;
      orders?: Array<{
        id: number;
        recipient_city_id?: number | null;
        recipient_zone_id?: number | null;
        recipient_area_id?: number | null;
        recipient_address?: string;
        recipient_phone?: string;
        cod_amount?: number;
        weight?: number;
        notes?: string;
      }>;
    },
    providerFallback = "steadfast"
  ): Promise<{
    success: boolean;
    message: string;
    success_count: number;
    failed_count: number;
    details: string[];
    results: Array<{
      order_id: number;
      order_number: string;
      success: boolean;
      consignment_id?: string;
      tracking_code?: string;
      tracking_url?: string;
      provider?: string;
      status?: string;
      cod_amount?: number;
      message?: string;
    }>;
  }> {
    const payload = Array.isArray(target)
      ? { order_ids: target, provider: providerFallback }
      : target;

    const res = await adminClient.post("/admin/orders/bulk-book-courier", payload);
    return res.data;
  },

  async getBulkShippingLabels(orderIds: number[]): Promise<{
    labels: any[];
    count: number;
  }> {
    const res = await adminClient.post("/admin/orders/bulk-labels", {
      order_ids: orderIds,
    });
    return res.data;
  },

  // ==========================================
  // RETURNS & RTO MANAGEMENT
  // ==========================================
  async getReturns(params?: {
    tab?: string;
    search?: string;
    status?: string;
    return_type?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
  }): Promise<{
    status: string;
    data: OrderReturn[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
    stats: {
      all_count: number;
      rto_count: number;
      customer_returns_count: number;
      awaiting_inspection_count: number;
      refunded_count: number;
      total_refunded_amount: number;
    };
  }> {
    const res = await adminClient.get("/admin/returns", { params });
    return res.data;
  },

  async getReturn(id: number | string): Promise<{ status: string; data: OrderReturn }> {
    const res = await adminClient.get(`/admin/returns/${id}`);
    return res.data;
  },

  async createReturn(data: {
    order_id: number;
    return_type: string;
    return_reason?: string;
    amount_collected_courier?: number;
    courier_delivery_fee?: number;
    courier_rto_fee?: number;
    courier_tracking_code?: string;
    notes?: string;
    items?: Array<{
      order_item_id?: number;
      quantity_returned: number;
      return_reason?: string;
      condition?: string;
    }>;
  }): Promise<{ status: string; message: string; data: OrderReturn }> {
    const res = await adminClient.post("/admin/returns", data);
    return res.data;
  },

  async receiveReturn(id: number, data?: { notes?: string; courier_tracking_code?: string }): Promise<{
    status: string;
    message: string;
    data: OrderReturn;
  }> {
    const res = await adminClient.post(`/admin/returns/${id}/receive`, data || {});
    return res.data;
  },

  async submitReturnQc(id: number, data: {
    items: Array<{
      id: number;
      disposition: string;
      restocked_quantity?: number;
      damaged_quantity?: number;
      writeoff_quantity?: number;
      refund_unit_price?: number;
      condition?: string;
      qc_notes?: string;
    }>;
  }): Promise<{ status: string; message: string; data: OrderReturn }> {
    const res = await adminClient.post(`/admin/returns/${id}/qc`, data);
    return res.data;
  },

  async processReturnRefund(id: number, data: {
    refund_amount: number;
    refund_method: string;
    notes?: string;
  }): Promise<{ status: string; message: string; data: OrderReturn }> {
    const res = await adminClient.post(`/admin/returns/${id}/refund`, data);
    return res.data;
  },

  async deleteReturn(id: number | string): Promise<{ status: string; message: string }> {
    const res = await adminClient.delete(`/admin/returns/${id}`);
    return res.data;
  },

  async bulkDeleteReturns(ids: number[]): Promise<{ status: string; message: string; deleted_count: number }> {
    const res = await adminClient.post("/admin/returns/bulk-delete", { ids });
    return res.data;
  },

  // ==========================================
  // LEADS & ABANDONED CARTS
  // ==========================================
  async getLeads(params?: {
    search?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
  }): Promise<{
    leads: { data: Lead[]; total: number; current_page: number; last_page: number; per_page: number };
    stats: LeadStats;
  }> {
    const res = await adminClient.get("/admin/leads", { params });
    return res.data;
  },

  async getLead(id: number): Promise<Lead> {
    const res = await adminClient.get(`/admin/leads/${id}`);
    return res.data;
  },

  async updateLead(id: number, data: Partial<Lead>): Promise<{ message: string; lead: Lead }> {
    const res = await adminClient.put(`/admin/leads/${id}`, data);
    return res.data;
  },

  async deleteLead(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/leads/${id}`);
    return res.data;
  },

  async bulkDeleteLeads(ids: number[]): Promise<{ message: string }> {
    const res = await adminClient.post("/admin/leads/bulk-delete", { ids });
    return res.data;
  },

  async convertLeadToOrder(id: number, data?: {
    payment_method?: string;
    payment_status?: string;
    order_status?: string;
    shipping_amount?: number;
    discount_amount?: number;
    notes?: string;
  }): Promise<{ message: string; order: Order; lead: Lead }> {
    const res = await adminClient.post(`/admin/leads/${id}/convert-to-order`, data || {});
    return res.data;
  },

  async sendLeadWhatsAppRecovery(id: number, data?: { discount_code?: string; custom_message?: string }): Promise<{ success: boolean; message: string; message_id?: string }> {
    const res = await adminClient.post(`/admin/leads/${id}/send-whatsapp-recovery`, data || {});
    return res.data;
  },

  // ==========================================
  // VENDORS & SUPPLIER MANAGEMENT
  // ==========================================
  async getVendors(params?: {
    search?: string;
    status?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ vendors: { data: Vendor[]; total: number; current_page: number; last_page: number }; stats: { total_vendors: number; active_vendors: number } }> {
    const res = await adminClient.get("/admin/vendors", { params });
    return res.data;
  },

  async getVendor(id: number): Promise<{ vendor: Vendor; analytics: any }> {
    const res = await adminClient.get(`/admin/vendors/${id}`);
    return res.data;
  },

  async createVendor(data: Partial<Vendor>): Promise<{ message: string; vendor: Vendor }> {
    const res = await adminClient.post("/admin/vendors", data);
    return res.data;
  },

  async updateVendor(id: number, data: Partial<Vendor>): Promise<{ message: string; vendor: Vendor }> {
    const res = await adminClient.put(`/admin/vendors/${id}`, data);
    return res.data;
  },

  async deleteVendor(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/vendors/${id}`);
    return res.data;
  },

  async bulkDeleteVendors(ids: number[]): Promise<{ message: string; deleted_count: number }> {
    const res = await adminClient.post("/admin/vendors/bulk-delete", { ids });
    return res.data;
  },


  async getVendorProducts(params?: { vendor_id?: number; product_id?: number; page?: number }): Promise<{ data: VendorProduct[]; total: number }> {
    const res = await adminClient.get("/admin/vendor-products", { params });
    return res.data;
  },

  async createVendorProduct(data: {
    vendor_id: number;
    product_id: number;
    variant_id?: number | null;
    vendor_sku?: string;
    purchase_price: number;
    min_order_quantity?: number;
    lead_time_days?: number;
    is_primary?: boolean;
    notes?: string;
  }): Promise<{ message: string; vendor_product: VendorProduct }> {
    const res = await adminClient.post("/admin/vendor-products", data);
    return res.data;
  },

  async updateVendorProduct(id: number, data: Partial<VendorProduct>): Promise<{ message: string; vendor_product: VendorProduct }> {
    const res = await adminClient.put(`/admin/vendor-products/${id}`, data);
    return res.data;
  },

  async deleteVendorProduct(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/vendor-products/${id}`);
    return res.data;
  },

  // ==========================================
  // PURCHASE ORDERS (PROCUREMENT)
  // ==========================================
  async getPurchaseOrders(params?: {
    search?: string;
    status?: string;
    vendor_id?: number;
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ purchase_orders: { data: PurchaseOrder[]; total: number; current_page: number; last_page: number }; stats: any }> {
    const res = await adminClient.get("/admin/purchase-orders", { params });
    return res.data;
  },

  async getPurchaseOrder(id: number): Promise<PurchaseOrder> {
    const res = await adminClient.get(`/admin/purchase-orders/${id}`);
    return res.data;
  },

  async createPurchaseOrder(data: {
    vendor_id: number;
    order_date: string;
    expected_delivery_date?: string;
    shipping_cost?: number;
    tax_amount?: number;
    other_costs?: number;
    notes?: string;
    items: {
      product_id: number;
      variant_id?: number | null;
      unit_cost: number;
      quantity_ordered: number;
    }[];
  }): Promise<{ message: string; purchase_order: PurchaseOrder }> {
    const res = await adminClient.post("/admin/purchase-orders", data);
    return res.data;
  },

  async submitPurchaseOrder(id: number): Promise<{ message: string; purchase_order: PurchaseOrder }> {
    const res = await adminClient.post(`/admin/purchase-orders/${id}/submit`);
    return res.data;
  },

  async approvePurchaseOrder(id: number): Promise<{ message: string; purchase_order: PurchaseOrder }> {
    const res = await adminClient.post(`/admin/purchase-orders/${id}/approve`);
    return res.data;
  },

  async cancelPurchaseOrder(id: number, reason: string): Promise<{ message: string; purchase_order: PurchaseOrder }> {
    const res = await adminClient.post(`/admin/purchase-orders/${id}/cancel`, { reason });
    return res.data;
  },

  // ==========================================
  // GOODS RECEIPTS (GRN)
  // ==========================================
  async getGoodsReceipts(params?: { search?: string; date_from?: string; date_to?: string; page?: number }): Promise<{ data: GoodsReceipt[]; total: number }> {
    const res = await adminClient.get("/admin/goods-receipts", { params });
    return res.data;
  },

  async getGoodsReceipt(id: number): Promise<GoodsReceipt> {
    const res = await adminClient.get(`/admin/goods-receipts/${id}`);
    return res.data;
  },

  async createGoodsReceipt(data: {
    purchase_order_id: number;
    received_date: string;
    notes?: string;
    items: {
      purchase_order_item_id: number;
      quantity_received: number;
      quantity_damaged?: number;
      quantity_rejected?: number;
    }[];
  }): Promise<{ message: string; goods_receipt: GoodsReceipt; purchase_order_status: string }> {
    const res = await adminClient.post("/admin/goods-receipts", data);
    return res.data;
  },

  // ==========================================
  // INVENTORY COSTING, VALUATION & LEDGER
  // ==========================================
  async getInventoryValuation(params?: { search?: string; category_id?: string | number }): Promise<{
    summary: {
      total_units: number;
      total_asset_valuation: number;
      total_potential_retail_value: number;
      low_stock_count: number;
      out_of_stock_count: number;
    };
    products: ProductValuation[];
    category_breakdown: { id: number; name: string; units: number; valuation: number }[];
  }> {
    const res = await adminClient.get("/admin/inventory-valuation", { params });
    return res.data;
  },

  async adjustInventoryValuation(data: {
    product_id: number;
    variant_id?: number | null;
    adjustment_quantity: number;
    reason: string;
    unit_cost?: number;
  }): Promise<{ message: string; movement: InventoryMovement; new_stock_quantity: number }> {
    const res = await adminClient.post("/admin/inventory-valuation/adjust", data);
    return res.data;
  },

  async getInventoryLedger(params?: {
    search?: string;
    movement_type?: string;
    product_id?: number;
    date_from?: string;
    date_to?: string;
    page?: number;
  }): Promise<{ data: InventoryMovement[]; total: number; current_page: number; last_page: number }> {
    const res = await adminClient.get("/admin/inventory-ledger", { params });
    return res.data;
  },

  // ==========================================
  // POS (POINT OF SALE) & REGISTERS
  // ==========================================
  async getPosRegisters(): Promise<PosRegister[]> {
    const res = await adminClient.get("/admin/pos/registers");
    return res.data;
  },

  async getCurrentPosSession(): Promise<{ session: PosRegisterSession | null }> {
    const res = await adminClient.get("/admin/pos/registers/current-session");
    return res.data;
  },

  async openPosSession(registerId: number, openingBalance: number): Promise<{ message: string; session: PosRegisterSession }> {
    const res = await adminClient.post(`/admin/pos/registers/${registerId}/open-session`, { opening_balance: openingBalance });
    return res.data;
  },

  async closePosSession(sessionId: number, actualClosingCash: number, closingNotes?: string): Promise<{ message: string; session: PosRegisterSession }> {
    const res = await adminClient.post(`/admin/pos/registers/${sessionId}/close-session`, {
      actual_closing_cash: actualClosingCash,
      closing_notes: closingNotes,
    });
    return res.data;
  },

  async recordPosCashMovement(sessionId: number, data: { type: 'cash_in' | 'cash_out' | 'drop'; amount: number; reason: string }): Promise<{ message: string; expected_cash_balance: number }> {
    const res = await adminClient.post(`/admin/pos/registers/${sessionId}/cash-movement`, data);
    return res.data;
  },

  async getPosProducts(params?: { search?: string; category_id?: string | number; page?: number }): Promise<{ data: Product[]; total: number; last_page: number }> {
    const res = await adminClient.get("/admin/pos/products", { params });
    return res.data;
  },

  async checkoutPosSale(data: {
    pos_register_session_id?: number | null;
    customer_id?: number | null;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    delivery_address?: string;
    delivery_zone?: string;
    shipping_amount?: number;
    payment_method?: string;
    payment_status?: string;
    order_status?: string;
    cash_received?: number;
    discount_amount?: number;
    tax_amount?: number;
    notes?: string;
    customer_note?: string;
    admin_note?: string;
    coupon_code?: string;
    lead_id?: number | null;
    items: {
      product_id: number;
      variant_id?: number | null;
      unit_price: number;
      quantity: number;
      discount_amount?: number;
    }[];
  }): Promise<{ message: string; order: Order; receipt: PosReceipt }> {
    const res = await adminClient.post("/admin/pos/checkout", data);
    return res.data;
  },

  // ==========================================
  // OPERATING EXPENSES
  // ==========================================
  async getExpenses(params?: {
    search?: string;
    category_id?: string | number;
    status?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
  }): Promise<{ expenses: { data: Expense[]; total: number; current_page: number; last_page: number }; stats: any }> {
    const res = await adminClient.get("/admin/expenses", { params });
    return res.data;
  },

  async createExpense(data: Partial<Expense>): Promise<{ message: string; expense: Expense }> {
    const res = await adminClient.post("/admin/expenses", data);
    return res.data;
  },

  async updateExpense(id: number, data: Partial<Expense>): Promise<{ message: string; expense: Expense }> {
    const res = await adminClient.put(`/admin/expenses/${id}`, data);
    return res.data;
  },

  async deleteExpense(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/expenses/${id}`);
    return res.data;
  },

  async bulkDeleteExpenses(ids: number[]): Promise<{ message: string; deleted_count: number }> {
    const res = await adminClient.post("/admin/expenses/bulk-delete", { ids });
    return res.data;
  },


  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    const res = await adminClient.get("/admin/expense-categories");
    return res.data;
  },

  async createExpenseCategory(data: { name: string; code: string; description?: string }): Promise<{ message: string; category: ExpenseCategory }> {
    const res = await adminClient.post("/admin/expense-categories", data);
    return res.data;
  },

  // ==========================================
  // FINANCIAL ENGINE & P&L PROFITABILITY
  // ==========================================
  async getFinanceSummary(params?: { period?: string; date_from?: string; date_to?: string }): Promise<FinancialSummary> {
    const res = await adminClient.get("/admin/finance/summary", { params });
    return res.data;
  },

  async getProductProfitability(params?: { period?: string; date_from?: string; date_to?: string }): Promise<ProductProfitabilityItem[]> {
    const res = await adminClient.get("/admin/finance/product-profitability", { params });
    return res.data;
  },

  async getVendorAnalytics(params?: { period?: string }): Promise<VendorAnalyticsItem[]> {
    const res = await adminClient.get("/admin/finance/vendor-analytics", { params });
    return res.data;
  },

  async getFinanceDrilldown(params: { metric: string; period?: string; date_from?: string; date_to?: string; page?: number }): Promise<{ type: string; data: any }> {
    const res = await adminClient.get("/admin/finance/drilldown", { params });
    return res.data;
  },



  // ==========================================
  // COUPONS
  // ==========================================
  async getCoupons(params?: {
    search?: string;
    type?: string;
    is_active?: boolean;
    page?: number;
  }): Promise<{ data: any[]; total: number; current_page: number; last_page: number }> {
    const res = await adminClient.get("/admin/coupons", { params });
    return res.data;
  },

  async createCoupon(data: any): Promise<{ message: string; coupon: any }> {
    const res = await adminClient.post("/admin/coupons", data);
    return res.data;
  },

  async updateCoupon(id: number, data: any): Promise<{ message: string; coupon: any }> {
    const res = await adminClient.put(`/admin/coupons/${id}`, data);
    return res.data;
  },

  async deleteCoupon(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/coupons/${id}`);
    return res.data;
  },

  async bulkDeleteCoupons(ids: number[]): Promise<{ message: string; deleted_count: number }> {
    const res = await adminClient.post("/admin/coupons/bulk-delete", { ids });
    return res.data;
  },

  // ==========================================
  // INVENTORY
  // ==========================================
  async getInventory(params?: {
    search?: string;
    filter?: string;
    category_id?: string | number;
    sort_by?: string;
    page?: number;
    per_page?: number;
  }): Promise<{
    summary: { total_skus: number; total_units: number; low_stock_count: number; out_of_stock_count: number };
    inventory: {
      data: Product[];
      total: number;
      current_page: number;
      last_page: number;
      per_page: number;
      from: number;
      to: number;
    };
  }> {
    const res = await adminClient.get("/admin/inventory", { params });
    return res.data;
  },

  async adjustStock(
    id: number,
    data: { adjustment: number; reason: string; variant_id?: number; unit_cost?: number }
  ): Promise<{ message: string; product: Product; movement?: any }> {
    const res = await adminClient.post(`/admin/inventory/${id}/adjust`, data);
    return res.data;
  },

  // ==========================================
  // REVIEWS MODERATION
  // ==========================================
  async getReviews(params?: {
    search?: string;
    status?: "all" | "approved" | "pending";
    rating?: number;
    page?: number;
    per_page?: number;
  }): Promise<{ data: any[]; total: number; current_page: number; last_page: number }> {
    const res = await adminClient.get("/admin/reviews", { params });
    return res.data;
  },

  async toggleReviewApproval(id: number): Promise<{ message: string; review: any }> {
    const res = await adminClient.patch(`/admin/reviews/${id}/approval`);
    return res.data;
  },

  async deleteReview(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/reviews/${id}`);
    return res.data;
  },

  async bulkDeleteReviews(ids: number[]): Promise<{ message: string; deleted_count: number }> {
    const res = await adminClient.post("/admin/reviews/bulk-delete", { ids });
    return res.data;
  },

  async toggleReviewsVisibility(enabled: boolean): Promise<{ success: boolean; reviews_enabled: boolean; message: string }> {
    const res = await adminClient.patch("/admin/reviews/visibility", { enabled });
    return res.data;
  },

  // ==========================================
  // STAFF & RBAC
  // ==========================================
  async getStaff(): Promise<User[]> {
    const res = await adminClient.get("/admin/staff");
    return res.data;
  },

  async createStaff(data: any): Promise<{ message: string; staff: User }> {
    const res = await adminClient.post("/admin/staff", data);
    return res.data;
  },

  async updateStaff(id: number, data: any): Promise<{ message: string; staff: User }> {
    const res = await adminClient.put(`/admin/staff/${id}`, data);
    return res.data;
  },

  async deleteStaff(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/staff/${id}`);
    return res.data;
  },

  async bulkDeleteStaff(ids: number[]): Promise<{ message: string; deleted_count: number; skipped_count?: number }> {
    const res = await adminClient.post("/admin/staff/bulk-delete", { ids });
    return res.data;
  },

  async suspendStaff(id: number, data: {
    duration_type: "indefinite" | "24h" | "3d" | "7d" | "30d" | "custom";
    suspended_until?: string;
    reason?: string;
  }): Promise<{ message: string; staff: User }> {
    const res = await adminClient.post(`/admin/staff/${id}/suspend`, data);
    return res.data;
  },

  async reactivateStaff(id: number): Promise<{ message: string; staff: User }> {
    const res = await adminClient.post(`/admin/staff/${id}/reactivate`);
    return res.data;
  },

  async promoteStaff(id: number): Promise<{ message: string; staff: User }> {
    const res = await adminClient.post(`/admin/staff/${id}/promote`);
    return res.data;
  },

  async demoteStaff(id: number): Promise<{ message: string; staff: User }> {
    const res = await adminClient.post(`/admin/staff/${id}/demote`);
    return res.data;
  },

  // ==========================================
  // AUDIT LOGS
  // ==========================================
  async getAuditLogs(params?: {
    search?: string;
    module?: string;
    action?: string;
    entity_type?: string;
    user_id?: string | number;
    user_role?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
  }): Promise<AuditLogsResponse> {
    const res = await adminClient.get("/admin/audit-logs", { params });
    return res.data;
  },

  async bulkDeleteAuditLogs(ids: number[]): Promise<{ message: string; deleted_count: number }> {
    const res = await adminClient.post("/admin/audit-logs/bulk-delete", { ids });
    return res.data;
  },

  // ==========================================
  // SALES & INVOICES
  // ==========================================
  async getSales(params?: {
    search?: string;
    source?: string;
    payment_status?: string;
    payment_method?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ sales: { data: Order[]; total: number; current_page: number; last_page: number }; summary: SalesSummary }> {
    const res = await adminClient.get("/admin/sales", { params });
    return res.data;
  },

  async getSalesInvoice(orderId: number): Promise<SalesInvoice> {
    const res = await adminClient.get(`/admin/sales/invoice/${orderId}`);
    return res.data;
  },

  // ==========================================
  // CUSTOMER RELATIONS & RISK INTELLIGENCE
  // ==========================================
  async getCustomers(params?: {
    search?: string;
    status?: string;
    customer_type?: string;
    risk_level?: string;
    rfm_segment?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ data: User[]; total: number; current_page: number; last_page: number }> {
    const res = await adminClient.get("/admin/customers", { params });
    return res.data;
  },

  async getCustomer(id: number): Promise<User> {
    const res = await adminClient.get(`/admin/customers/${id}`);
    return res.data;
  },

  async getCustomerTimeline(id: number): Promise<CustomerActivityTimelineItem[]> {
    const res = await adminClient.get(`/admin/customers/${id}/timeline`);
    return res.data;
  },

  async getCustomerIpHistory(id: number): Promise<CustomerIpHistoryItem[]> {
    const res = await adminClient.get(`/admin/customers/${id}/ip-history`);
    return res.data;
  },

  async createCustomer(data: any): Promise<{ message: string; customer: User }> {
    const res = await adminClient.post("/admin/customers", data);
    return res.data;
  },

  async updateCustomer(id: number, data: any): Promise<{ message: string; customer: User }> {
    const res = await adminClient.put(`/admin/customers/${id}`, data);
    return res.data;
  },

  async deleteCustomer(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/customers/${id}`);
    return res.data;
  },

  async bulkDeleteCustomers(ids: number[]): Promise<{ message: string; deleted_count: number }> {
    const res = await adminClient.post("/admin/customers/bulk-delete", { ids });
    return res.data;
  },

  async toggleCustomerStatus(id: number): Promise<{ message: string; customer: User }> {
    const res = await adminClient.patch(`/admin/customers/${id}/status`);
    return res.data;
  },

  async suspendCustomer(id: number, data: any): Promise<{ message: string; customer: User }> {
    const res = await adminClient.post(`/admin/customers/${id}/suspend`, data);
    return res.data;
  },

  async reactivateCustomer(id: number): Promise<{ message: string; customer: User }> {
    const res = await adminClient.post(`/admin/customers/${id}/reactivate`);
    return res.data;
  },

  async blockCustomer(id: number, reason: string): Promise<{ message: string; customer: User }> {
    const res = await adminClient.post(`/admin/customers/${id}/block`, { reason });
    return res.data;
  },

  async unblockCustomer(id: number): Promise<{ message: string; customer: User }> {
    const res = await adminClient.post(`/admin/customers/${id}/unblock`);
    return res.data;
  },

  async setCustomerReview(id: number): Promise<{ message: string; customer: User }> {
    const res = await adminClient.post(`/admin/customers/${id}/review`);
    return res.data;
  },

  async updateCustomerNotes(id: number, notes: string): Promise<{ message: string; customer: User }> {
    const res = await adminClient.put(`/admin/customers/${id}/notes`, { internal_notes: notes });
    return res.data;
  },

  // ==========================================
  // SECURITY & BLOCKED IPS REGISTRY
  // ==========================================
  async getBlockedIps(params?: {
    search?: string;
    status?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ data: BlockedIp[]; total: number; current_page: number; last_page: number }> {
    const res = await adminClient.get("/admin/blocked-ips", { params });
    return res.data;
  },

  async getBlockedIp(id: number): Promise<BlockedIp & { related_orders: Order[]; related_customers: User[] }> {
    const res = await adminClient.get(`/admin/blocked-ips/${id}`);
    return res.data;
  },

  async getBlockedIpRelated(id: number): Promise<{ blocked_ip: BlockedIp; orders: Order[]; customers: User[] }> {
    const res = await adminClient.get(`/admin/blocked-ips/${id}/related`);
    return res.data;
  },

  async blockIp(data: {
    ip_address: string;
    reason: string;
    notes?: string;
    duration: '1_hour' | '24_hours' | '7_days' | '30_days' | 'permanent' | 'custom';
    custom_expires_at?: string;
  }): Promise<{ message: string; blocked_ip: BlockedIp; co_tenant_warning?: string | null }> {
    const res = await adminClient.post("/admin/blocked-ips", data);
    return res.data;
  },

  async unblockIp(id: number, reason?: string): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/blocked-ips/${id}`, { data: { reason } });
    return res.data;
  },

  async bulkUnblockIps(ids: number[], reason?: string): Promise<{ message: string; unblocked_count: number }> {
    const res = await adminClient.post("/admin/blocked-ips/bulk-delete", { ids, reason });
    return res.data;
  },


  // ==========================================
  // SETTINGS
  // ==========================================
  async getSettings(): Promise<Record<string, any>> {
    const res = await adminClient.get("/admin/settings");
    return res.data;
  },

  async updateSettings(settings: Record<string, any>): Promise<{ message: string; settings: Record<string, any> }> {
    const res = await adminClient.put("/admin/settings", { settings });
    return res.data;
  },

  async getThemeSettings(): Promise<{ settings: Record<string, any>; defaults: Record<string, any> }> {
    const res = await adminClient.get("/admin/theme");
    return res.data;
  },

  async updateThemeSettings(themeData: Record<string, any>): Promise<{ message: string; settings: Record<string, any> }> {
    const res = await adminClient.put("/admin/theme", themeData);
    if (typeof window !== "undefined") {
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["theme"] }),
      }).catch(() => {});
    }
    return res.data;
  },

  async resetThemeSettings(): Promise<{ message: string; settings: Record<string, any> }> {
    const res = await adminClient.post("/admin/theme/reset");
    if (typeof window !== "undefined") {
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["theme"] }),
      }).catch(() => {});
    }
    return res.data;
  },

  // ==========================================
  // BRAND LOGOS & FAVICON MANAGEMENT
  // ==========================================
  async getBrandLogos(): Promise<{
    logos: Array<{
      id: number;
      name: string | null;
      image_url: string;
      is_active: boolean;
      placements: Array<{ id: number; logo_id: number; placement: string }>;
    }>;
    favicon: string;
    available_placements: Array<{ id: string; label: string; description: string; recommended: string }>;
  }> {
    try {
      const res = await adminClient.get("/admin/branding/logos");
      return res.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        try {
          const themeRes = await adminClient.get("/admin/theme");
          const s = themeRes.data?.settings || {};
          const fallbackLogos = s.store_brand_logo ? [{
            id: 1,
            name: "Primary Store Logo",
            image_url: s.store_brand_logo,
            is_active: true,
            placements: [
              { id: 1, logo_id: 1, placement: "navbar" },
              { id: 2, logo_id: 1, placement: "footer" },
              { id: 3, logo_id: 1, placement: "split_reveal" },
            ],
          }] : [];
          return {
            logos: fallbackLogos,
            favicon: s.store_favicon || "",
            available_placements: [
              { id: "navbar", label: "Desktop Navbar", description: "Primary horizontal navigation header", recommended: "180 × 40 px · 9:2" },
              { id: "mobile_navbar", label: "Mobile Navbar", description: "Compact header on mobile viewports", recommended: "140 × 35 px · 4:1" },
              { id: "footer", label: "Footer", description: "Large prominent footer brand mark", recommended: "200 × 50 px · 4:1" },
              { id: "auth", label: "Customer Auth", description: "Centered branding above customer sign-in", recommended: "200 × 50 px · 4:1" },
              { id: "invoice", label: "Invoices & Receipts", description: "High-contrast monochrome print mark", recommended: "190 × 45 px · 4:1" },
              { id: "split_reveal", label: "Splash / Split Screen", description: "Ultra-high resolution cinematic launch mark", recommended: "600 × 150 px · 4:1" },
            ],
          };
        } catch (e) {
          return { logos: [], favicon: "", available_placements: [] };
        }
      }
      throw err;
    }
  },

  async createBrandLogo(data: { name?: string; image_url: string; placements?: string[] }): Promise<{ message: string; logo: any }> {
    try {
      const res = await adminClient.post("/admin/branding/logos", data);
      return res.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        await adminClient.put("/admin/theme", {
          store_brand_logo: data.image_url,
          ...(data.placements?.includes("split_reveal") ? { split_reveal_image: data.image_url } : {}),
        });
        return {
          message: "Brand logo saved to theme settings.",
          logo: {
            id: Date.now(),
            name: data.name || "Main Brand Logo",
            image_url: data.image_url,
            is_active: true,
            placements: (data.placements || []).map((p, idx) => ({ id: idx + 1, logo_id: Date.now(), placement: p })),
          },
        };
      }
      throw err;
    }
  },

  async updateBrandLogo(id: number, data: { name?: string; image_url: string; placements?: string[] }): Promise<{ message: string; logo: any }> {
    try {
      const res = await adminClient.put(`/admin/branding/logos/${id}`, data);
      return res.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        await adminClient.put("/admin/theme", {
          store_brand_logo: data.image_url,
          ...(data.placements?.includes("split_reveal") ? { split_reveal_image: data.image_url } : {}),
        });
        return {
          message: "Brand logo updated in theme settings.",
          logo: {
            id,
            name: data.name || "Brand Logo",
            image_url: data.image_url,
            is_active: true,
            placements: (data.placements || []).map((p, idx) => ({ id: idx + 1, logo_id: id, placement: p })),
          },
        };
      }
      throw err;
    }
  },

  async updateAllBrandPlacements(
    placements: Array<{ logo_id: number; placements: string[]; image_url?: string; name?: string | null }>
  ): Promise<{ message: string; logos?: any[] }> {
    try {
      const res = await adminClient.put("/admin/branding/placements", {
        placements: placements.map((p) => ({
          logo_id: p.logo_id,
          placements: p.placements,
        })),
      });
      return res.data;
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.response?.status === 422) {
        // Fallback for environment running older backend or unseeded IDs
        for (const item of placements) {
          if (item.image_url) {
            try {
              await adminClient.put(`/admin/branding/logos/${item.logo_id}`, {
                name: item.name || undefined,
                image_url: item.image_url,
                placements: item.placements,
              });
            } catch {
              // Individual logo endpoint not available or 404 on older backend
            }
          }
        }

        // Always ensure active logo placements are synced directly to theme settings
        const navbarLogo = placements.find((p) => p.placements?.includes("navbar")) || placements[0];
        const splitLogo = placements.find((p) => p.placements?.includes("split_reveal"));
        const themeFallback: Record<string, string> = {};
        if (navbarLogo?.image_url) {
          themeFallback.store_brand_logo = navbarLogo.image_url;
        }
        if (splitLogo?.image_url) {
          themeFallback.split_reveal_logo = splitLogo.image_url;
        }

        if (Object.keys(themeFallback).length > 0) {
          try {
            await adminClient.put("/admin/theme", themeFallback);
          } catch {
            // Theme settings fallback completed
          }
        }

        return { message: "Placements updated successfully." };
      }
      throw err;
    }
  },

  async deleteBrandLogo(id: number): Promise<{ message: string }> {
    try {
      const res = await adminClient.delete(`/admin/branding/logos/${id}`);
      return res.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        return { message: "Brand logo deleted." };
      }
      throw err;
    }
  },

  async uploadBrandingAsset(file: File): Promise<{ message: string; image_url: string; path: string }> {
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await adminClient.post("/admin/branding/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        // Fallback to active banner/image upload endpoint on Railway
        const fallbackRes = await adminClient.post("/admin/banners/upload-image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return fallbackRes.data;
      }
      throw err;
    }
  },

  async updateFavicon(favicon_url: string): Promise<{ message: string; favicon: string }> {
    try {
      const res = await adminClient.put("/admin/branding/favicon", { favicon_url });
      return res.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        await adminClient.put("/admin/theme", { store_favicon: favicon_url });
        return { message: "Favicon updated in theme settings.", favicon: favicon_url };
      }
      throw err;
    }
  },

  async removeFavicon(): Promise<{ message: string; favicon: string }> {
    try {
      const res = await adminClient.delete("/admin/branding/favicon");
      return res.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        await adminClient.put("/admin/theme", { store_favicon: "" });
        return { message: "Favicon reset to default.", favicon: "" };
      }
      throw err;
    }
  },

  // ==========================================
  // ACCOUNTING & GENERAL LEDGER
  // ==========================================
  async getAccountingOverview(params?: { period?: string; date_from?: string; date_to?: string }): Promise<AccountingOverviewResponse> {
    const res = await adminClient.get("/admin/accounting/overview", { params });
    return res.data;
  },

  async getChartOfAccounts(params?: { account_type?: string; is_active?: boolean }): Promise<{ success: boolean; accounts: ChartOfAccountItem[] }> {
    const res = await adminClient.get("/admin/accounting/accounts", { params });
    return res.data;
  },

  async createChartOfAccount(data: {
    account_code: string;
    account_name: string;
    account_type: string;
    parent_id?: number | null;
    description?: string;
  }): Promise<{ success: boolean; message: string; account: ChartOfAccountItem }> {
    const res = await adminClient.post("/admin/accounting/accounts", data);
    return res.data;
  },

  async getAccountingLedger(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    chart_of_account_id?: number;
    account_code?: string;
    date_from?: string;
    date_to?: string;
    status?: string;
  }): Promise<AccountingLedgerResponse> {
    const res = await adminClient.get("/admin/accounting/ledger", { params });
    return res.data;
  },

  async createJournalEntry(data: {
    entry_date: string;
    narration: string;
    reference_number?: string;
    lines: {
      chart_of_account_id?: number;
      account_code?: string;
      debit: number;
      credit: number;
      memo?: string;
    }[];
  }): Promise<{ success: boolean; message: string; entry: JournalEntryItem }> {
    const res = await adminClient.post("/admin/accounting/ledger/journal-entry", data);
    return res.data;
  },

  async getAccountingReceivables(): Promise<AccountingReceivablesResponse> {
    const res = await adminClient.get("/admin/accounting/receivables");
    return res.data;
  },

  async recordCustomerPayment(data: {
    order_id: number;
    amount: number;
    payment_method: string;
    bank_account_id?: number | null;
    payment_date: string;
    reference_number?: string;
    notes?: string;
  }): Promise<{ success: boolean; message: string; payment: CustomerPaymentItem }> {
    const res = await adminClient.post("/admin/accounting/receivables/payment", data);
    return res.data;
  },

  async getAccountingPayables(): Promise<AccountingPayablesResponse> {
    const res = await adminClient.get("/admin/accounting/payables");
    return res.data;
  },

  async recordSupplierPayment(data: {
    vendor_id: number;
    purchase_order_id?: number | null;
    amount: number;
    payment_method: string;
    bank_account_id?: number | null;
    payment_date: string;
    reference_number?: string;
    notes?: string;
  }): Promise<{ success: boolean; message: string; payment: SupplierPaymentItem }> {
    const res = await adminClient.post("/admin/accounting/payables/payment", data);
    return res.data;
  },

  async getAccountingBanking(): Promise<AccountingBankingResponse> {
    const res = await adminClient.get("/admin/accounting/banking");
    return res.data;
  },

  async createBankTransfer(data: {
    from_bank_account_id: number;
    to_bank_account_id: number;
    amount: number;
    reference_number?: string;
    notes?: string;
  }): Promise<{ success: boolean; message: string; journal_entry: JournalEntryItem }> {
    const res = await adminClient.post("/admin/accounting/banking/transfer", data);
    return res.data;
  },

  async getAccountingReports(params?: { period?: string; date_from?: string; date_to?: string }): Promise<AccountingReportsResponse> {
    const res = await adminClient.get("/admin/accounting/reports", { params });
    return res.data;
  },

  getAccountingExportUrl(type: string): string {
    const baseUrl = adminClient.defaults.baseURL || "http://127.0.0.1:8000/api";
    const token = typeof window !== "undefined" ? localStorage.getItem("aether_admin_token") : "";
    return `${baseUrl}/admin/accounting/export?type=${type}&api_token=${token}`;
  },

  // ==========================================
  // COURIER SETTLEMENTS & RECONCILIATION
  // ==========================================
  async getSettlements(params?: {
    provider?: string;
    status?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
  }): Promise<{
    status: string;
    data: CourierSettlement[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
    stats: {
      total_settlements: number;
      pending_count: number;
      reconciled_count: number;
      total_cod_collected: number;
      total_delivery_fees: number;
      total_actual_payout: number;
      total_variance: number;
    };
  }> {
    const res = await adminClient.get("/admin/accounting/settlements", { params });
    return res.data;
  },

  async getSettlement(id: number): Promise<{ status: string; data: CourierSettlement }> {
    const res = await adminClient.get(`/admin/accounting/settlements/${id}`);
    return res.data;
  },

  async createSettlement(data: {
    provider: string;
    settlement_date: string;
    settlement_number?: string;
    bank_account_id?: number;
    notes?: string;
    actual_payout?: number;
    items: Array<{
      consignment_id?: string;
      tracking_code?: string;
      cod_collected: number;
      delivery_fee?: number;
      rto_fee?: number;
      cod_fee?: number;
      other_fee?: number;
      notes?: string;
    }>;
  }): Promise<{ status: string; message: string; data: CourierSettlement }> {
    const res = await adminClient.post("/admin/accounting/settlements", data);
    return res.data;
  },

  async reconcileSettlement(id: number, data: {
    bank_account_id: number;
    actual_payout?: number;
    notes?: string;
  }): Promise<{ status: string; message: string; data: CourierSettlement }> {
    const res = await adminClient.post(`/admin/accounting/settlements/${id}/reconcile`, data);
    return res.data;
  },

  // ==========================================
  // Phase 1: Color Swatch Management
  // ==========================================
  async getColors(params?: { search?: string; status?: string }): Promise<Color[]> {
    const res = await adminClient.get("/admin/colors", { params });
    return res.data;
  },

  async getColor(id: number): Promise<Color> {
    const res = await adminClient.get(`/admin/colors/${id}`);
    return res.data;
  },

  async createColor(data: { name: string; hex_code: string; status?: 'active' | 'inactive' }): Promise<{ message: string; color: Color }> {
    const res = await adminClient.post("/admin/colors", data);
    return res.data;
  },

  async updateColor(id: number, data: { name: string; hex_code: string; status?: 'active' | 'inactive' }): Promise<{ message: string; color: Color }> {
    const res = await adminClient.put(`/admin/colors/${id}`, data);
    return res.data;
  },

  async toggleColorStatus(id: number): Promise<{ message: string; color: Color }> {
    const res = await adminClient.patch(`/admin/colors/${id}/status`);
    return res.data;
  },

  async deleteColor(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/colors/${id}`);
    return res.data;
  },

  // ==========================================
  // Phase 1: Blog & Editorial Publishing
  // ==========================================
  async getBlogSummary(): Promise<BlogSummary> {
    const res = await adminClient.get("/admin/blog/summary");
    return res.data;
  },

  async getBlogPosts(params?: { page?: number; per_page?: number; search?: string; status?: string; category_id?: number }): Promise<{
    data: BlogPost[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  }> {
    const res = await adminClient.get("/admin/blog/posts", { params });
    return res.data;
  },

  async getBlogPost(id: number): Promise<BlogPost> {
    const res = await adminClient.get(`/admin/blog/posts/${id}`);
    return res.data;
  },

  async createBlogPost(data: {
    title: string;
    slug?: string;
    excerpt?: string;
    content: string;
    featured_image?: string;
    category_id?: number | null;
    status?: 'published' | 'draft' | 'archived';
    tag_ids?: number[];
    meta_title?: string | null;
    meta_description?: string | null;
    featured_image_alt?: string | null;
  }): Promise<{ message: string; post: BlogPost }> {
    const res = await adminClient.post("/admin/blog/posts", data);
    return res.data;
  },

  async updateBlogPost(id: number, data: {
    title: string;
    slug?: string;
    excerpt?: string;
    content: string;
    featured_image?: string;
    category_id?: number | null;
    status?: 'published' | 'draft' | 'archived';
    tag_ids?: number[];
    meta_title?: string | null;
    meta_description?: string | null;
    featured_image_alt?: string | null;
  }): Promise<{ message: string; post: BlogPost }> {
    const res = await adminClient.put(`/admin/blog/posts/${id}`, data);
    return res.data;
  },

  async toggleBlogPostStatus(id: number): Promise<{ message: string; post: BlogPost }> {
    const res = await adminClient.patch(`/admin/blog/posts/${id}/status`);
    return res.data;
  },

  async deleteBlogPost(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/blog/posts/${id}`);
    return res.data;
  },

  async getBlogCategories(): Promise<BlogCategory[]> {
    const res = await adminClient.get("/admin/blog/categories");
    return res.data;
  },

  async createBlogCategory(data: { name: string; slug?: string; description?: string; meta_title?: string | null; meta_description?: string | null }): Promise<{ message: string; category: BlogCategory }> {
    const res = await adminClient.post("/admin/blog/categories", data);
    return res.data;
  },

  async updateBlogCategory(id: number, data: { name: string; slug?: string; description?: string; meta_title?: string | null; meta_description?: string | null }): Promise<{ message: string; category: BlogCategory }> {
    const res = await adminClient.put(`/admin/blog/categories/${id}`, data);
    return res.data;
  },

  async deleteBlogCategory(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/blog/categories/${id}`);
    return res.data;
  },

  async getBlogTags(): Promise<BlogTag[]> {
    const res = await adminClient.get("/admin/blog/tags");
    return res.data;
  },

  async createBlogTag(data: { name: string; slug?: string }): Promise<{ message: string; tag: BlogTag }> {
    const res = await adminClient.post("/admin/blog/tags", data);
    return res.data;
  },

  async updateBlogTag(id: number, data: { name: string; slug?: string }): Promise<{ message: string; tag: BlogTag }> {
    const res = await adminClient.put(`/admin/blog/tags/${id}`, data);
    return res.data;
  },

  async deleteBlogTag(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/blog/tags/${id}`);
    return res.data;
  },

  async getBlogComments(params?: { page?: number; per_page?: number; search?: string; is_approved?: boolean }): Promise<{
    data: BlogComment[];
    current_page: number;
    last_page: number;
    total: number;
  }> {
    const res = await adminClient.get("/admin/blog/comments", { params });
    return res.data;
  },

  async toggleBlogCommentApproval(id: number): Promise<{ message: string; comment: BlogComment }> {
    const res = await adminClient.patch(`/admin/blog/comments/${id}/approval`);
    return res.data;
  },

  async deleteBlogComment(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/blog/comments/${id}`);
    return res.data;
  },

  // ==========================================
  // Phase 1: Online Store CMS & Navigation
  // ==========================================
  async getCmsPages(params?: { search?: string; is_active?: boolean }): Promise<CmsPage[]> {
    const res = await adminClient.get("/admin/online-store/pages", { params });
    return res.data;
  },

  async getCmsPage(id: number): Promise<CmsPage> {
    const res = await adminClient.get(`/admin/online-store/pages/${id}`);
    return res.data;
  },

  async createCmsPage(data: {
    title: string;
    slug?: string;
    content: string;
    meta_title?: string;
    meta_description?: string;
    is_active?: boolean;
  }): Promise<{ message: string; page: CmsPage }> {
    const res = await adminClient.post("/admin/online-store/pages", data);
    return res.data;
  },

  async updateCmsPage(id: number, data: {
    title: string;
    slug?: string;
    content: string;
    meta_title?: string;
    meta_description?: string;
    is_active?: boolean;
  }): Promise<{ message: string; page: CmsPage }> {
    const res = await adminClient.put(`/admin/online-store/pages/${id}`, data);
    return res.data;
  },

  async toggleCmsPageStatus(id: number): Promise<{ message: string; page: CmsPage }> {
    const res = await adminClient.patch(`/admin/online-store/pages/${id}/status`);
    return res.data;
  },

  async deleteCmsPage(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/online-store/pages/${id}`);
    return res.data;
  },

  // ==========================================
  // FOOTER COLUMNS & LINKS
  // ==========================================

  async getFooterColumns(): Promise<FooterColumn[]> {
    const res = await adminClient.get("/admin/online-store/footer-columns");
    return res.data;
  },

  async createFooterColumn(data: {
    title: string;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<{ message: string; footer_column: FooterColumn }> {
    const res = await adminClient.post("/admin/online-store/footer-columns", data);
    if (typeof window !== "undefined") {
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["footer", "navigation"] }),
      }).catch(() => {});
    }
    return res.data;
  },

  async updateFooterColumn(id: number, data: {
    title: string;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<{ message: string; footer_column: FooterColumn }> {
    const res = await adminClient.put(`/admin/online-store/footer-columns/${id}`, data);
    if (typeof window !== "undefined") {
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["footer", "navigation"] }),
      }).catch(() => {});
    }
    return res.data;
  },

  async deleteFooterColumn(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/online-store/footer-columns/${id}`);
    if (typeof window !== "undefined") {
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["footer", "navigation"] }),
      }).catch(() => {});
    }
    return res.data;
  },

  async reorderFooterColumns(column_ids: number[]): Promise<{ message: string }> {
    const res = await adminClient.post("/admin/online-store/footer-columns/reorder", { column_ids });
    if (typeof window !== "undefined") {
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["footer", "navigation"] }),
      }).catch(() => {});
    }
    return res.data;
  },

  async getFooterLinks(): Promise<FooterLink[]> {
    const res = await adminClient.get("/admin/online-store/footer-links");
    return res.data;
  },

  async createFooterLink(data: {
    footer_column_id?: number | null;
    column_group?: string;
    title: string;
    url: string;
    is_external?: boolean;
    open_in_new_tab?: boolean;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<{ message: string; footer_link: FooterLink }> {
    const res = await adminClient.post("/admin/online-store/footer-links", data);
    if (typeof window !== "undefined") {
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["footer", "navigation"] }),
      }).catch(() => {});
    }
    return res.data;
  },

  async updateFooterLink(id: number, data: {
    footer_column_id?: number | null;
    column_group?: string;
    title: string;
    url: string;
    is_external?: boolean;
    open_in_new_tab?: boolean;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<{ message: string; footer_link: FooterLink }> {
    const res = await adminClient.put(`/admin/online-store/footer-links/${id}`, data);
    if (typeof window !== "undefined") {
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["footer", "navigation"] }),
      }).catch(() => {});
    }
    return res.data;
  },

  async deleteFooterLink(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/online-store/footer-links/${id}`);
    if (typeof window !== "undefined") {
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["footer", "navigation"] }),
      }).catch(() => {});
    }
    return res.data;
  },

  async reorderFooterLinks(link_ids: number[], footer_column_id?: number | null): Promise<{ message: string }> {
    const res = await adminClient.post("/admin/online-store/footer-links/reorder", {
      link_ids,
      footer_column_id: footer_column_id || undefined,
    });
    if (typeof window !== "undefined") {
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["footer", "navigation"] }),
      }).catch(() => {});
    }
    return res.data;
  },

  async getSocialLinks(): Promise<SocialLink[]> {
    const res = await adminClient.get("/admin/online-store/social-links");
    return res.data;
  },

  async createSocialLink(data: {
    platform: string;
    url: string;
    icon?: string;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<{ message: string; social_link: SocialLink }> {
    const res = await adminClient.post("/admin/online-store/social-links", data);
    return res.data;
  },

  async updateSocialLink(id: number, data: {
    platform: string;
    url: string;
    icon?: string;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<{ message: string; social_link: SocialLink }> {
    const res = await adminClient.put(`/admin/online-store/social-links/${id}`, data);
    return res.data;
  },

  async deleteSocialLink(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/online-store/social-links/${id}`);
    return res.data;
  },

  // ==========================================
  // Dynamic Header Navigation Management
  // ==========================================

  async getNavbarItems(): Promise<NavbarItem[]> {
    const res = await adminClient.get("/admin/navigation");
    return res.data;
  },

  async getNavbarTree(): Promise<NavbarItem[]> {
    const res = await adminClient.get("/admin/navigation/tree");
    return res.data;
  },

  async getNavigationOptions(): Promise<NavigationOptions> {
    const res = await adminClient.get("/admin/navigation/options");
    return res.data;
  },

  async createNavbarItem(data: Partial<NavbarItem>): Promise<{ message: string; item: NavbarItem }> {
    const res = await adminClient.post("/admin/navigation", data);
    if (typeof window !== "undefined") {
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["navigation"] }),
      }).catch(() => {});
    }
    return res.data;
  },

  async updateNavbarItem(id: number, data: Partial<NavbarItem>): Promise<{ message: string; item: NavbarItem }> {
    const res = await adminClient.put(`/admin/navigation/${id}`, data);
    if (typeof window !== "undefined") {
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["navigation"] }),
      }).catch(() => {});
    }
    return res.data;
  },

  async deleteNavbarItem(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/navigation/${id}`);
    if (typeof window !== "undefined") {
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["navigation"] }),
      }).catch(() => {});
    }
    return res.data;
  },

  async reorderNavbarItems(items: Array<{ id: number; display_order: number; parent_id?: number | null }>): Promise<{ message: string }> {
    const res = await adminClient.post("/admin/navigation/reorder", { items });
    if (typeof window !== "undefined") {
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["navigation"] }),
      }).catch(() => {});
    }
    return res.data;
  },

  async duplicateNavbarItem(id: number): Promise<{ message: string; item: NavbarItem }> {
    const res = await adminClient.post(`/admin/navigation/${id}/duplicate`);
    if (typeof window !== "undefined") {
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["navigation"] }),
      }).catch(() => {});
    }
    return res.data;
  },

  async getCategoryBrands(categoryId: number): Promise<{ category: any; linked_brands: any[]; all_brands: any[] }> {
    const res = await adminClient.get(`/admin/navigation/category-brands/${categoryId}`);
    return res.data;
  },

  async updateCategoryBrands(
    categoryId: number,
    brands: Array<{ brand_id: number; display_order?: number; is_in_navbar?: boolean; is_featured?: boolean }>
  ): Promise<{ message: string }> {
    const res = await adminClient.post(`/admin/navigation/category-brands/${categoryId}`, { brands });
    if (typeof window !== "undefined") {
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["navigation"] }),
      }).catch(() => {});
    }
    return res.data;
  },

  // ==========================================
  // Phase 2: Enhanced Reviews Management
  // ==========================================

  async getReviewSummary(): Promise<ReviewSummary> {
    const res = await adminClient.get("/admin/reviews/summary");
    return res.data;
  },

  async createReview(data: {
    product_id: number;
    user_name: string;
    rating: number;
    title?: string;
    comment: string;
    is_verified_purchase?: boolean;
    is_approved?: boolean;
  }): Promise<{ message: string; review: any }> {
    const res = await adminClient.post("/admin/reviews", data);
    return res.data;
  },

  async updateReview(
    id: number,
    data: {
      user_name: string;
      rating: number;
      title?: string;
      comment: string;
      is_verified_purchase?: boolean;
      is_approved?: boolean;
    }
  ): Promise<{ message: string; review: any }> {
    const res = await adminClient.put(`/admin/reviews/${id}`, data);
    return res.data;
  },

  async bulkApproveReviews(ids: number[]): Promise<{ message: string }> {
    const res = await adminClient.post("/admin/reviews/bulk-approve", { ids });
    return res.data;
  },

  async bulkRejectReviews(ids: number[]): Promise<{ message: string }> {
    const res = await adminClient.post("/admin/reviews/bulk-reject", { ids });
    return res.data;
  },

  // ==========================================
  // Phase 2: Banners & Marketing Campaigns
  // ==========================================
  async getBanners(params?: { placement?: string; is_active?: boolean; search?: string }): Promise<Banner[]> {
    const res = await adminClient.get("/admin/banners", { params });
    return res.data;
  },

  async getBanner(id: number): Promise<Banner> {
    const res = await adminClient.get(`/admin/banners/${id}`);
    return res.data;
  },

  async createBanner(data: Partial<Banner>): Promise<{ message: string; banner: Banner }> {
    const res = await adminClient.post("/admin/banners", data);
    return res.data;
  },

  async updateBanner(id: number, data: Partial<Banner>): Promise<{ message: string; banner: Banner }> {
    const res = await adminClient.put(`/admin/banners/${id}`, data);
    return res.data;
  },

  async toggleBannerStatus(id: number): Promise<{ message: string; banner: Banner }> {
    const res = await adminClient.patch(`/admin/banners/${id}/status`);
    return res.data;
  },

  async deleteBanner(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/banners/${id}`);
    return res.data;
  },

  async uploadBannerImage(file: File): Promise<{ message: string; image_url: string; path: string }> {
    const formData = new FormData();
    formData.append("image", file);
    const res = await adminClient.post("/admin/banners/upload-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async reorderBanners(items: { id: number; sort_order: number }[]): Promise<{ message: string }> {
    const res = await adminClient.post("/admin/banners/reorder", { items });
    return res.data;
  },

  // ==========================================
  // Phase 3: Integrations & Extended Settings
  // ==========================================

  async getIntegrations(): Promise<{ integrations: Integration[]; stats: IntegrationStats }> {
    const res = await adminClient.get("/admin/integrations");
    return res.data;
  },

  async getIntegration(provider: string): Promise<{ integration: Integration }> {
    const res = await adminClient.get(`/admin/integrations/${provider}`);
    return res.data;
  },

  async updateIntegration(provider: string, data: any): Promise<{ message: string; integration: Integration }> {
    const res = await adminClient.put(`/admin/integrations/${provider}`, data);
    return res.data;
  },

  async toggleIntegration(provider: string): Promise<{ message: string; is_enabled: boolean }> {
    const res = await adminClient.post(`/admin/integrations/${provider}/toggle`);
    return res.data;
  },

  async testIntegration(provider: string, data?: { credentials?: Record<string, any>; settings?: Record<string, any> }): Promise<{ success: boolean; message: string; latency_ms: number; last_tested_at: string; test_status: string }> {
    const res = await adminClient.post(`/admin/integrations/${provider}/test`, data || {});
    return res.data;
  },

  async rotateIntegrationKey(provider: string): Promise<{ message: string; primary_api_key: string; secondary_api_key: string | null; last_rotated_at: string }> {
    const res = await adminClient.post(`/admin/integrations/${provider}/rotate-key`);
    return res.data;
  },

  async sendTestWhatsApp(param: string | { phone?: string; phone_number?: string; message?: string }, message?: string): Promise<{ success: boolean; message: string; message_id?: string }> {
    const phoneNumber = typeof param === "string" ? param : (param.phone_number || param.phone || "");
    const msg = typeof param === "string" ? message : (param.message || message);
    const res = await adminClient.post("/admin/integrations/whatsapp/send-test", {
      phone_number: phoneNumber,
      message: msg,
    });
    return res.data;
  },

  async getExtendedSettings(): Promise<ExtendedSettingsResponse> {
    const res = await adminClient.get("/admin/settings/extended");
    return res.data;
  },

  async updateSettingsGroup(group: string, data: any): Promise<{ message: string; data: any }> {
    const res = await adminClient.put(`/admin/settings/group/${group}`, { data });
    return res.data;
  },

  async clearSystemCache(type: string = "all"): Promise<{ success: boolean; message: string; cleared_components: string[]; timestamp: string }> {
    const res = await adminClient.post("/admin/system/cache-clear", { type });
    return res.data;
  },

  async generateSitemap(): Promise<{ success: boolean; total_urls: number; sitemap_url: string; generated_at: string; entries_sample: any[] }> {
    const res = await adminClient.post("/admin/system/sitemap/generate");
    return res.data;
  },

  async listBackups(): Promise<{
    backups: Array<{
      filename: string;
      size_bytes: number;
      size_human: string;
      created_at: string;
      download_url: string;
    }>;
    stats: {
      database: string;
      total_users: number;
      total_orders: number;
      total_products: number;
      total_invoices: number;
      backup_count: number;
      last_backup: string;
    };
  }> {
    const res = await adminClient.get("/admin/system/backups");
    return res.data;
  },

  async createBackup(): Promise<{
    success: boolean;
    message: string;
    backup: {
      filename: string;
      size_bytes: number;
      size_human: string;
      tables_count: number;
      created_at: string;
      download_url: string;
    };
  }> {
    const res = await adminClient.post("/admin/system/backups/create");
    return res.data;
  },

  async deleteBackup(filename: string): Promise<{ success: boolean; message: string }> {
    const res = await adminClient.delete(`/admin/system/backups/${filename}`);
    return res.data;
  },

  // ==========================================
  // Phase 4: 14-Report Analytics & Intelligence
  // ==========================================

  async getReport(type: string, params?: { start_date?: string; end_date?: string }): Promise<ReportData> {
    const res = await adminClient.get(`/admin/reports/${type}`, { params });
    return res.data;
  },

  getExportReportUrl(type: string, params?: { start_date?: string; end_date?: string }): string {
    const query = new URLSearchParams();
    if (params?.start_date) query.set("start_date", params.start_date);
    if (params?.end_date) query.set("end_date", params.end_date);
    return `${API_BASE_URL}/admin/reports/${type}/export?${query.toString()}`;
  },

  async getDetailedAcquisitionReport(params?: {
    start_date?: string;
    end_date?: string;
    order_status?: string;
  }): Promise<DetailedAcquisitionReportData> {
    const res = await adminClient.get("/admin/reports/acquisition/detailed", { params });
    return res.data;
  },

  getExportAcquisitionChannelsUrl(params?: {
    start_date?: string;
    end_date?: string;
    order_status?: string;
  }): string {
    const query = new URLSearchParams();
    if (params?.start_date) query.set("start_date", params.start_date);
    if (params?.end_date) query.set("end_date", params.end_date);
    if (params?.order_status) query.set("order_status", params.order_status);
    return `${API_BASE_URL}/admin/reports/acquisition/export-channels?${query.toString()}`;
  },

  getExportAcquisitionPageViewsUrl(params?: {
    start_date?: string;
    end_date?: string;
    order_status?: string;
  }): string {
    const query = new URLSearchParams();
    if (params?.start_date) query.set("start_date", params.start_date);
    if (params?.end_date) query.set("end_date", params.end_date);
    if (params?.order_status) query.set("order_status", params.order_status);
    return `${API_BASE_URL}/admin/reports/acquisition/export-pageviews?${query.toString()}`;
  },

  // ==========================================
  // ENTERPRISE PROMOTIONS & DISCOUNTS SYSTEM
  // ==========================================

  async getPromotions(params?: {
    search?: string;
    type?: string;
    status?: string;
    discount_type?: string;
    show_on_storefront?: boolean;
    storefront_placement?: string;
    page?: number;
    per_page?: number;
  }): Promise<{
    data: Promotion[];
    current_page: number;
    last_page: number;
    total: number;
    stats?: {
      total: number;
      active: number;
      draft: number;
      expired: number;
      total_discount_volume: number;
      total_redemptions: number;
    };
  }> {
    const res = await adminClient.get("/admin/promotions", { params });
    return res.data;
  },

  async getPromotion(id: number): Promise<Promotion> {
    const res = await adminClient.get(`/admin/promotions/${id}`);
    return res.data?.promotion || res.data;
  },

  async createPromotion(data: Partial<Promotion> & {
    target_product_ids?: number[];
    target_category_ids?: number[];
    target_brand_ids?: number[];
    excluded_product_ids?: number[];
    customer_ids?: number[];
    codes?: Array<{ code: string; usage_limit?: number | null }>;
  }): Promise<{ message: string; promotion: Promotion }> {
    const res = await adminClient.post("/admin/promotions", data);
    return res.data;
  },

  async updatePromotion(id: number, data: Partial<Promotion> & {
    target_product_ids?: number[];
    target_category_ids?: number[];
    target_brand_ids?: number[];
    excluded_product_ids?: number[];
    customer_ids?: number[];
  }): Promise<{ message: string; promotion: Promotion }> {
    const res = await adminClient.put(`/admin/promotions/${id}`, data);
    return res.data;
  },

  async deletePromotion(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/promotions/${id}`);
    return res.data;
  },

  async togglePromotionStatus(id: number): Promise<{ message: string; is_active: boolean; status: string }> {
    const res = await adminClient.patch(`/admin/promotions/${id}/status`);
    return res.data;
  },

  async uploadPromotionImage(file: File): Promise<{ message: string; image_url: string; path: string; filename: string }> {
    const formData = new FormData();
    formData.append("image", file);
    const res = await adminClient.post("/admin/promotions/upload-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async generatePromotionCodes(id: number, data: {
    count: number;
    prefix?: string;
    usage_limit_per_code?: number | null;
  }): Promise<{ message: string; codes: PromotionCode[] }> {
    const res = await adminClient.post(`/admin/promotions/${id}/generate-codes`, data);
    return res.data;
  },

  async getPromotionCodes(params?: {
    search?: string;
    promotion_id?: number;
    is_active?: boolean;
    page?: number;
    per_page?: number;
  }): Promise<{
    data: PromotionCode[];
    current_page: number;
    last_page: number;
    total: number;
  }> {
    const res = await adminClient.get("/admin/promotions/codes", { params });
    return res.data;
  },

  async getPromotionClaims(params?: {
    search?: string;
    promotion_id?: number;
    status?: string;
    page?: number;
    per_page?: number;
  }): Promise<{
    data: PromotionClaim[];
    current_page: number;
    last_page: number;
    total: number;
  }> {
    const res = await adminClient.get("/admin/promotions/claims", { params });
    return res.data;
  },

  async getPromotionRedemptions(params?: {
    search?: string;
    promotion_id?: number;
    user_id?: number;
    order_id?: number;
    page?: number;
    per_page?: number;
  }): Promise<{
    data: PromotionRedemption[];
    current_page: number;
    last_page: number;
    total: number;
  }> {
    const res = await adminClient.get("/admin/promotions/redemptions", { params });
    return res.data;
  },

  async issueCustomerReward(data: {
    user_id: number;
    name: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
    min_order_amount?: number;
    max_discount_amount?: number;
    days_valid?: number;
  }): Promise<{ message: string; promotion: Promotion; claim: PromotionClaim }> {
    const res = await adminClient.post("/admin/promotions/customer-rewards", data);
    return res.data;
  },

  async getStoreCreditAccounts(params?: {
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<{
    data: StoreCreditAccount[];
    current_page: number;
    last_page: number;
    total: number;
  }> {
    const res = await adminClient.get("/admin/promotions/store-credit/accounts", { params });
    return res.data;
  },

  async adjustStoreCredit(data: {
    user_id: number;
    amount: number;
    type: 'credit' | 'debit';
    reason: string;
  }): Promise<{ message: string; account: StoreCreditAccount; transaction: StoreCreditTransaction }> {
    const res = await adminClient.post("/admin/promotions/store-credit/adjust", data);
    return res.data;
  },

  async getStoreCreditLedger(params?: {
    user_id?: number;
    search?: string;
    type?: string;
    page?: number;
    per_page?: number;
  }): Promise<{
    data: StoreCreditTransaction[];
    current_page: number;
    last_page: number;
    total: number;
  }> {
    const res = await adminClient.get("/admin/promotions/store-credit/ledger", { params });
    return res.data;
  },

  async getPromotionAnalytics(params?: {
    date_from?: string;
    date_to?: string;
  }): Promise<PromotionAnalyticsData> {
    const res = await adminClient.get("/admin/promotions/analytics", { params });
    return res.data;
  },

  // ==========================================
  // HOMEPAGE SECTIONS BUILDER
  // ==========================================
  async getHomepageSections(): Promise<{ data: import("@/types").HomepageSection[] }> {
    const res = await adminClient.get("/admin/homepage/sections");
    return res.data;
  },

  async getHomepageSection(id: number): Promise<{
    data: import("@/types").HomepageSection;
    preview: any;
  }> {
    const res = await adminClient.get(`/admin/homepage/sections/${id}`);
    return res.data;
  },

  async createHomepageSection(data: Partial<import("@/types").HomepageSection>): Promise<{
    message: string;
    data: import("@/types").HomepageSection;
  }> {
    const res = await adminClient.post("/admin/homepage/sections", data);
    return res.data;
  },

  async updateHomepageSection(id: number, data: Partial<import("@/types").HomepageSection>): Promise<{
    message: string;
    data: import("@/types").HomepageSection;
  }> {
    const res = await adminClient.put(`/admin/homepage/sections/${id}`, data);
    return res.data;
  },

  async deleteHomepageSection(id: number): Promise<{ message: string }> {
    const res = await adminClient.delete(`/admin/homepage/sections/${id}`);
    return res.data;
  },

  async reorderHomepageSections(sections: { id: number; sort_order: number }[]): Promise<{
    message: string;
    data: import("@/types").HomepageSection[];
  }> {
    const res = await adminClient.post("/admin/homepage/sections/reorder", { sections });
    return res.data;
  },

  async toggleHomepageSection(id: number): Promise<{
    message: string;
    data: import("@/types").HomepageSection;
  }> {
    const res = await adminClient.patch(`/admin/homepage/sections/${id}/toggle`);
    return res.data;
  },

  async duplicateHomepageSection(id: number): Promise<{
    message: string;
    data: import("@/types").HomepageSection;
  }> {
    const res = await adminClient.post(`/admin/homepage/sections/${id}/duplicate`);
    return res.data;
  },
};

export interface PermissionItem {
  id: string;
  name: string;
  description: string;
}

export interface PermissionModule {
  name: string;
  description: string;
  permissions: PermissionItem[];
}

export const ADMIN_PERMISSION_MODULES: PermissionModule[] = [
  {
    name: "Point of Sale (POS)",
    description: "Physical retail terminal, fast cashier checkout, and register cash sessions",
    permissions: [
      { id: "pos.access", name: "Access POS Terminal", description: "Open register and process walk-in customer sales" },
      { id: "pos.create_sale", name: "Execute POS Sales", description: "Ring up orders, accept multi-payments, print receipts" },
      { id: "pos.register_manage", name: "Manage Cash Registers", description: "Open/close sessions, record cash drops, reconcile float" },
    ],
  },
  {
    name: "Vendors & Procurement",
    description: "Supplier relationships, purchase orders, and goods receiving notes (GRN)",
    permissions: [
      { id: "vendors.view", name: "View Vendors", description: "Inspect supplier profiles and supplied catalog" },
      { id: "vendors.manage", name: "Manage Vendors", description: "Create and edit suppliers and contract pricing" },
      { id: "purchase_orders.view", name: "View Purchase Orders", description: "Read procurement orders and delivery tracking" },
      { id: "purchase_orders.create", name: "Create & Submit POs", description: "Draft and submit purchase orders to suppliers" },
      { id: "purchase_orders.approve", name: "Approve Purchase Orders", description: "Authorize purchase order fulfillment and spending" },
      { id: "goods_receipts.manage", name: "Process Goods Receipts", description: "Inspect and receive physical shipments into FIFO inventory" },
    ],
  },
  {
    name: "Inventory Costing & Valuation",
    description: "FIFO cost layers, auditable stock ledger, and manual write-offs",
    permissions: [
      { id: "inventory.valuation", name: "View Inventory Valuation", description: "Inspect FIFO layer asset values and movement ledger" },
      { id: "inventory.adjust", name: "Adjust Stock & Write-offs", description: "Record manual stock inflows, damage, and adjustments" },
    ],
  },
  {
    name: "Financial & Expense Engine",
    description: "Operating expense ledger, executive P&L, product profitability, and report exports",
    permissions: [
      { id: "expenses.view", name: "View Expenses", description: "Inspect operating expenditure and cost categories" },
      { id: "expenses.manage", name: "Manage Expenses", description: "Record, categorize, and approve business operating expenses" },
      { id: "finance.reports_view", name: "View Financial Reports & P&L", description: "Access real-time Net Profit, COGS, and margin analytics" },
      { id: "finance.drilldown", name: "Financial Metric Drill-down", description: "Inspect individual orders and cost layers behind revenue and COGS" },
    ],
  },
  {
    name: "Accounting & General Ledger",
    description: "Double-entry general ledger, chart of accounts, A/R customer dues, A/P supplier payables, bank accounts, and formal financial statements",
    permissions: [
      { id: "accounting.view", name: "View Accounting & Ledger", description: "Inspect general ledger, accounts receivable/payable, and financial reports" },
      { id: "accounting.manage", name: "Manage Accounting", description: "Create journal entries, record payments, manage COA and banking transfers" },
    ],
  },
  {
    name: "Products & Catalog",
    description: "Manage physical hardware catalog, specs, and categories",
    permissions: [
      { id: "products.view", name: "View Products", description: "Read catalog items and stock levels" },
      { id: "products.manage", name: "Manage Products", description: "Create, edit, and delete products" },
      { id: "categories.manage", name: "Manage Categories", description: "Create and edit product categories" },
    ],
  },
  {
    name: "Warehouse & Inventory",
    description: "Control stock levels, batch restocking, and write-offs",
    permissions: [
      { id: "inventory.manage", name: "Manage Inventory", description: "Perform stock additions and deductions" },
    ],
  },
  {
    name: "Orders & Fulfillment",
    description: "Handle incoming customer orders, logistics, and manual orders",
    permissions: [
      { id: "orders.view", name: "View Orders", description: "Inspect customer shipments and invoices" },
      { id: "orders.manage", name: "Manage Orders", description: "Create orders, update tracking, and issue refunds" },
    ],
  },
  {
    name: "Lead & Checkout Recovery",
    description: "Manage abandoned checkout leads, direct customer outreach, and order conversion",
    permissions: [
      { id: "leads.view", name: "View Leads", description: "Inspect abandoned checkouts, customer contacts, and pipeline" },
      { id: "leads.manage", name: "Manage & Contact Leads", description: "Update lead status, internal notes, and customer info" },
      { id: "leads.convert", name: "Convert Leads to Orders", description: "1-Click convert abandoned leads into official orders" },
      { id: "leads.delete", name: "Delete Leads", description: "Remove single or multiple lead records" },
    ],
  },
  {
    name: "Customer Relations & Risk Control",
    description: "Customer accounts, risk scoring, account suspensions, and block enforcement",
    permissions: [
      { id: "customers.view", name: "View Customers & Risk", description: "Access customer profiles, order history, and risk analysis" },
      { id: "customers.manage", name: "Manage Customers", description: "Create, edit, flag for review, and update internal notes" },
      { id: "customers.suspend", name: "Suspend Customer Accounts", description: "Temporarily suspend or reactivate customer accounts" },
      { id: "customers.block", name: "Block Customer Accounts", description: "Permanently block abusive customer identities" },
      { id: "customers.delete", name: "Delete Customers", description: "Permanently delete single or multiple customer records" },
    ],
  },
  {
    name: "Discounts & Reviews",
    description: "Promotional campaigns and customer review moderation",
    permissions: [
      { id: "coupons.manage", name: "Manage Coupons", description: "Create and configure discount vouchers" },
      { id: "reviews.manage", name: "Moderate Reviews", description: "Approve or reject customer product reviews" },
    ],
  },
  {
    name: "Theme & UI Customization",
    description: "Storefront branding, visual colors, hero section copy, announcement bar, and design tokens",
    permissions: [
      { id: "theme.manage", name: "Manage Theme & UI", description: "Customize storefront colors, hero copy, announcement bar, and layout tokens" },
    ],
  },
  {
    name: "Administration & Security",
    description: "Staff access control, IP blocking registry, audit logs, and system settings",
    permissions: [
      { id: "staff.view", name: "View Staff & RBAC", description: "Inspect staff roles and assigned permissions" },
      { id: "staff.manage", name: "Manage Staff & RBAC", description: "Create staff, modify access, and suspend staff" },
      { id: "security.ip_block", name: "IP Blocking & Abuse Defense", description: "Block, unblock, and manage IP abuse registry rules" },
      { id: "audit_logs.view", name: "View Audit Trail", description: "Inspect cryptographic immutable audit logs" },
      { id: "analytics.view", name: "View Executive Analytics", description: "View revenue, conversion, and sales charts" },
      { id: "settings.manage", name: "Manage System Settings", description: "Modify store configuration and defaults" },
    ],
  },
];

