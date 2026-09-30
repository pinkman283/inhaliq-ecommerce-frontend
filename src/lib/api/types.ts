import { 
  Product, 
  ProductVariant, 
  ProductImage, 
  Category, 
  Brand, 
  Banner, 
  HomepageBannersResponse, 
  CartItem, 
  CouponValidation, 
  Order, 
  OrderItem, 
  User, 
  Address, 
  PaymentMethodOption, 
  BlogPost, 
  CmsPage,
  HomepageSection,
  NavbarItem
} from "@/types";

// ==========================================
// 1. Unified Storefront Models (Re-exports & Extensions)
// ==========================================

export type {
  Product,
  ProductVariant,
  ProductImage,
  Category,
  Brand,
  Banner,
  HomepageBannersResponse,
  CartItem,
  CouponValidation,
  Order,
  OrderItem,
  User,
  Address,
  PaymentMethodOption,
  BlogPost,
  CmsPage,
  HomepageSection,
  NavbarItem
};

export interface StorefrontVideoMetadata {
  raw?: string;
  type?: "youtube" | "facebook";
  url?: string;
  embed_url?: string;
}

export interface StorefrontInitSettings {
  site_name?: string;
  site_logo?: string | null;
  site_favicon?: string | null;
  currency?: string;
  currency_symbol?: string;
  currency_position?: "left" | "right";
  contact_phone?: string;
  contact_email?: string;
  address?: string;
  social_links?: Record<string, string>;
  main_settings?: {
    primary_color?: string;
    notification_icon?: string;
    checkout_page_order_button_name?: string;
    [key: string]: any;
  };
  general_settings?: {
    name?: string;
    white_logo?: string;
    dark_logo?: string;
    checkout_note?: string;
    [key: string]: any;
  };
  facebook_pixels?: Array<{ pixel_id: string }>;
  google_tag_managers?: Array<{ code: string }>;
  social_media?: Array<{ title: string; icon: string; link: string; color?: string }>;
  shipping_charges?: Array<{ id: number; name: string; amount: number }>;
  external_id?: string;
  [key: string]: any;
}

export interface StorefrontHomepageData {
  banners: HomepageBannersResponse;
  sliders?: any[];
  flash_sales?: Product[];
  hot_deals?: Product[];
  popup_banners?: any[];
  sections?: HomepageSection[];
  featured_categories?: Category[];
  featured_products?: Product[];
  new_arrivals?: Product[];
  best_sellers?: Product[];
  [key: string]: any;
}

export interface StorefrontCampaign {
  id?: number;
  slug: string;
  title?: string;
  description?: string;
  banner?: string;
  image_one?: string;
  image_two?: string;
  image_three?: string;
  campaign_popup_banner?: string;
  is_active?: boolean;
  products: Product[];
  selected_products?: Product[];
  event_id?: string;
}

export interface StorefrontBrandPage {
  brand: Brand;
  products: Product[];
  min_price?: number;
  max_price?: number;
  total?: number;
  current_page?: number;
  last_page?: number;
  event_id?: string;
}

export interface StorefrontCategoryPage {
  category: Category;
  subcategories?: Category[];
  products: Product[];
  min_price?: number;
  max_price?: number;
  total?: number;
  current_page?: number;
  last_page?: number;
  event_id?: string;
}

export interface StorefrontProductDetail {
  product: Product;
  related: Product[];
  event_id?: string;
}

export interface ProductCatalogParams {
  category?: string | string[];
  categories?: string | string[];
  brand?: string | string[];
  brands?: string | string[];
  search?: string;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  sort?: string | number; // 1: Newest, 3: High Price, 4: Low Price or 'popular'
  featured?: boolean;
  new_arrivals?: boolean;
  best_sellers?: boolean;
  in_stock?: boolean;
  discounted?: boolean;
  discounted_items?: boolean;
  page?: number;
  per_page?: number;
}

export interface PaginatedProductsResponse {
  data: Product[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export interface CheckoutCalculatePayload {
  area_id?: number | string;
  coupon_code?: string | null;
  items: Array<{
    product_id: number;
    qty: number;
    price?: number;
    size_id?: number | null;
    color_id?: number | null;
    variant_id?: number | null;
  }>;
}

export interface CheckoutCalculateResult {
  subtotal: number;
  shipping_fee: number;
  shipping_charge?: number;
  discount: number;
  coupon_discount?: number;
  total: number;
  is_valid: boolean;
  is_coupon_valid?: boolean;
  coupon_message?: string;
  notices?: string[];
  items?: Array<{
    product_id: number;
    name?: string;
    qty: number;
    unit_price: number;
    total_price: number;
    has_stock_error?: boolean;
    stock_message?: string;
  }>;
  coupon?: {
    valid: boolean;
    code?: string;
    discount_amount: number;
    message?: string;
  } | null;
}

export interface OrderSavePayload {
  name: string;
  phone: string;
  address: string;
  area?: string | number;
  area_id?: number;
  note?: string;
  payment_method: string;
  coupon_code?: string | null;
  email?: string;
  shipping_method?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
  device_type?: "mobile" | "tablet" | "desktop";
  channel?: string;
  domain?: string;
  app_type?: string;
  items: Array<{
    product_id: number;
    qty: number;
    size_id?: number | null;
    color_id?: number | null;
    variant_id?: number | null;
    price?: number;
  }>;
}

export interface OrderSaveResult {
  success?: boolean;
  order_id: number;
  invoice_id: string;
  order_number?: string;
  token?: string;
  total: number;
  status?: string;
  payment_url?: string | null;
  auth_token?: string | null;
  event_id?: string | null;
  message: string;
  order?: Order;
}

export interface AuthResponse {
  message: string;
  token?: string;
  user?: User;
  customer?: any;
}

export interface ShippingChargeItem {
  id: number;
  name: string;
  amount: number;
  description?: string;
  is_default?: boolean;
  is_active?: boolean;
}

export interface PaymentGatewayItem {
  id?: number;
  slug: string;
  type: string;
  name: string;
  description?: string;
  logo?: string | null;
  image?: string | null;
  discount_type?: string;
  discount_amount?: number;
  is_active?: boolean;
}

// ==========================================
// 2. Senior API Raw Response Types (Documented)
// ==========================================

export interface SeniorRawInitSettingsResponse {
  success: boolean;
  data: StorefrontInitSettings;
}

export interface SeniorRawHomeResponse {
  success?: boolean;
  data?: {
    banners?: any[];
    sliders?: any[];
    flash_sales?: any[];
    hot_deals?: any[];
    popup_banners?: any[];
    [key: string]: any;
  };
  banners?: any[];
  sliders?: any[];
  flash_sales?: any[];
  hot_deals?: any[];
  popup_banners?: any[];
}

export interface SeniorRawProduct {
  id: number;
  name: string;
  slug: string;
  sku?: string;
  price: number | string;
  compare_at_price?: number | string | null;
  old_price?: number | string | null;
  stock?: number;
  stock_quantity?: number;
  description?: string;
  short_description?: string;
  image?: string;
  cover_image?: string;
  images?: Array<string | { id?: number; image_url?: string; url?: string; image?: string; is_primary?: boolean }>;
  gallery?: Array<string | { id?: number; image_url?: string; url?: string; image?: string }>;
  sizes?: Array<{ id: number; name: string }>;
  size_variants?: Array<{ id: number; name: string; size?: string; stock?: number; price?: number }>;
  colors?: Array<{ id: number; name: string; code?: string; color_code?: string; color_hex?: string }>;
  color_variants?: Array<{ id: number; name: string; code?: string; stock?: number; price?: number }>;
  video?: StorefrontVideoMetadata;
  video_link?: string;
  related?: SeniorRawProduct[];
  related_products?: SeniorRawProduct[];
  event_id?: string;
  rating_average?: number;
  review_count?: number;
  reviews_count?: number;
  category?: any;
  brand?: any;
}

export interface SeniorRawCheckoutCalculateResponse {
  success: boolean;
  data: {
    subtotal: number;
    shipping_fee: number;
    discount: number;
    total: number;
  };
}

export interface SeniorRawOrderSaveResponse {
  success: boolean;
  data: {
    order_id: number;
    invoice_id: number;
    token: string;
    total: number;
    payment_url?: string | null;
    auth_token?: string | null;
    event_id?: string | null;
  };
  message?: string;
}
