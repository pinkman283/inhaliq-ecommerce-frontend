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
  CmsPage
} from "./types";

export interface IStorefrontApi {
  // Provider identifier: 'senior' | 'original'
  readonly provider: "senior" | "original";

  // System & Init Settings
  getInitSettings(): Promise<StorefrontInitSettings>;

  // Homepage & Banners
  getHomepageData(): Promise<StorefrontHomepageData>;
  getHomepageBanners(): Promise<HomepageBannersResponse>;
  trackBannerClick(id: number): Promise<void>;
  getHomepageSections(): Promise<HomepageSection[]>;
  getSectionTabProducts(sectionId: number, tabId: string): Promise<Product[]>;

  // Flash Sales, Hot Deals, Campaigns
  getFlashSales(params?: { page?: number; per_page?: number }): Promise<{ products: Product[]; total?: number }>;
  getHotDeals(params?: { page?: number; per_page?: number }): Promise<{ products: Product[]; total?: number }>;
  getCampaign(slug: string): Promise<StorefrontCampaign | null>;

  // Navigation & Categories
  getNavMenu(): Promise<NavbarItem[]>;
  getCategories(): Promise<Category[]>;
  getCategory(slug: string, params?: ProductCatalogParams): Promise<StorefrontCategoryPage>;
  getSubcategory(slug: string, params?: ProductCatalogParams): Promise<StorefrontCategoryPage>;
  getChildCategory(slug: string, params?: ProductCatalogParams): Promise<StorefrontCategoryPage>;

  // Brands
  getBrands(params?: { is_featured?: boolean }): Promise<Brand[]>;
  getBrand(slug: string, params?: ProductCatalogParams): Promise<StorefrontBrandPage>;

  // Products & Search
  getProducts(params?: ProductCatalogParams): Promise<PaginatedProductsResponse>;
  getProduct(slug: string): Promise<StorefrontProductDetail>;
  searchProducts(keyword: string, category?: string, page?: number): Promise<PaginatedProductsResponse>;

  // Coupons
  getCoupons(): Promise<any[]>;
  validateCoupon(code: string, subtotal: number, items?: any[]): Promise<CouponValidation>;

  // Cart & Checkout
  calculateCheckout(payload: CheckoutCalculatePayload): Promise<CheckoutCalculateResult>;
  saveOrder(payload: OrderSavePayload, idempotencyKey?: string): Promise<OrderSaveResult>;
  captureLead(payload: any): Promise<{ message: string; lead_id?: number }>;

  // Shipping & Payments
  getShippingCharges(): Promise<ShippingChargeItem[]>;
  getPaymentGateways(): Promise<PaymentGatewayItem[]>;

  // Customer Authentication
  login(credentials: { phoneOrEmail: string; password: string; remember?: boolean }): Promise<AuthResponse>;
  register(data: { name: string; phone: string; email?: string; password: string; password_confirmation: string }): Promise<AuthResponse>;
  forgotPassword(phoneOrEmail: string): Promise<{ message: string }>;
  verifyOtp(phoneOrEmail: string, otp: string): Promise<AuthResponse>;
  resendOtp(phoneOrEmail: string): Promise<{ message: string }>;
  resetPassword(data: { phoneOrEmail: string; otp: string; password: string; password_confirmation: string }): Promise<{ message: string }>;
  logout(): Promise<void>;

  // Customer Account
  getProfile(): Promise<{ user: User; total_orders?: number; total_spent?: number }>;
  updateProfile(data: any): Promise<{ message: string; user: User }>;
  updatePassword(data: any): Promise<{ message: string }>;
  getMyOrders(params?: any): Promise<{ data: Order[]; total?: number }>;
  getOrder(orderNumberOrInvoice: string): Promise<Order>;
  trackOrder(query: { orderNumber?: string; phone?: string; invoice_id?: string }): Promise<any>;
  submitReview(productId: number, data: { rating: number; review: string; title?: string; user_name?: string }): Promise<any>;

  // Blog & CMS
  getBlogPosts(params?: any): Promise<{ posts: BlogPost[]; banners?: any[]; total?: number; current_page?: number; last_page?: number }>;
  getBlogPost(slug: string): Promise<{ post: BlogPost; banners?: any[]; comments?: any[] }>;
  getBlogCategories(): Promise<{ categories: any[]; banners?: any[] }>;
  getBlogTags(): Promise<any[]>;
  submitBlogComment(postId: number, data: { comment: string; parent_id?: number; author_name?: string; author_email?: string }): Promise<any>;
  getPage(slug: string): Promise<CmsPage>;
  submitContact(data: { name: string; phone: string; email: string; subject: string; message: string }): Promise<{ message: string }>;
}
