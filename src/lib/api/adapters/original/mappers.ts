import {
  Product,
  Category,
  Order,
  PaymentMethodOption,
  CartValidationResponse,
  PromotionEvaluationResult
} from "@/types";
import {
  ShippingChargeItem,
  PaymentGatewayItem,
  CheckoutCalculateResult,
  OrderSaveResult
} from "../../types";

/**
 * Normalizes an original Laravel Product to ensure standard storefront schema compliance
 */
export function mapOriginalProduct(raw: any): Product {
  if (!raw) return {} as Product;
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug || String(raw.id),
    sku: raw.sku || `SKU-${raw.id}`,
    price: Number(raw.price) || 0,
    sale_price: raw.sale_price !== null && raw.sale_price !== undefined ? Number(raw.sale_price) : null,
    discount_percentage: raw.discount_percentage ? Number(raw.discount_percentage) : undefined,
    stock_quantity: raw.stock_quantity !== undefined ? Number(raw.stock_quantity) : (raw.stock !== undefined ? Number(raw.stock) : 0),
    in_stock: raw.in_stock !== undefined ? Boolean(raw.in_stock) : Number(raw.stock_quantity || raw.stock || 0) > 0,
    is_featured: Boolean(raw.is_featured),
    is_new_arrival: Boolean(raw.is_new_arrival),
    is_best_seller: Boolean(raw.is_best_seller),
    is_flash_deal: Boolean(raw.is_flash_deal),
    is_active: raw.is_active !== undefined ? Boolean(raw.is_active) : true,
    rating_average: Number(raw.rating_average || raw.rating || 5),
    review_count: Number(raw.review_count || raw.reviews_count || 0),
    images: Array.isArray(raw.images) ? raw.images : (raw.image ? [{ id: 1, product_id: raw.id, image_url: raw.image, is_primary: true, display_order: 1 }] : []),
    description: raw.description || "",
    short_description: raw.short_description || "",
    category_id: raw.category_id,
    category: raw.category,
    brand_id: raw.brand_id,
    brand: raw.brand,
    variants: Array.isArray(raw.variants) ? raw.variants : [],
    has_variants: Boolean(raw.has_variants || (raw.variants && raw.variants.length > 0)),
    reviews: Array.isArray(raw.reviews) ? raw.reviews : [],
    video: raw.video || null,
    related_products: Array.isArray(raw.related_products) ? raw.related_products.map(mapOriginalProduct) : [],
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
  };
}

/**
 * Normalizes original Category
 */
export function mapOriginalCategory(raw: any): Category {
  if (!raw) return {} as Category;
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug || String(raw.id),
    description: raw.description || null,
    image: raw.image || null,
    icon: raw.icon || null,
    parent_id: raw.parent_id || null,
    children: Array.isArray(raw.children) ? raw.children.map(mapOriginalCategory) : [],
    products_count: raw.products_count !== undefined ? Number(raw.products_count) : undefined,
    is_featured: Boolean(raw.is_featured),
    display_order: raw.display_order || 0,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

/**
 * Normalizes original Shipping Zones to unified ShippingChargeItem[]
 */
export function mapOriginalShippingZones(zones: Array<{
  id: string;
  name: string;
  rate: number;
  duration?: string;
  free_threshold?: number;
  is_active: boolean;
}>): ShippingChargeItem[] {
  if (!Array.isArray(zones)) return [];
  return zones
    .filter((z) => z.is_active !== false)
    .map((z, idx) => ({
      id: Number(z.id) || idx + 1,
      name: z.name,
      amount: Number(z.rate) || 0,
      description: z.duration || "",
      is_default: idx === 0,
      is_active: true,
    }));
}

/**
 * Normalizes original Payment Methods to unified PaymentGatewayItem[]
 */
export function mapOriginalPaymentMethods(methods: PaymentMethodOption[]): PaymentGatewayItem[] {
  if (!Array.isArray(methods)) return [];
  return methods
    .filter((m) => m.available !== false)
    .map((m, idx) => {
      const isCod = m.code === "cod" || m.code === "cash_on_delivery" || m.name.toLowerCase().includes("cash on delivery");
      return {
        id: idx + 1,
        name: m.name,
        slug: m.code,
        type: isCod ? "cod" : "online",
        logo: null,
        description: m.description,
        is_active: true,
      };
    });
}

/**
 * Maps CartValidation / PromotionEvaluation to CheckoutCalculateResult
 */
export function mapOriginalCalculationToResult(
  calc: Partial<PromotionEvaluationResult & CartValidationResponse>,
  defaultShipping: number = 0
): CheckoutCalculateResult {
  const subtotal = Number(calc?.subtotal ?? 0);
  const discount = Number((calc as any)?.discount ?? (calc as any)?.total_discount ?? 0);
  const shipping = Number((calc as any)?.shipping_amount ?? (calc as any)?.base_shipping_rate ?? defaultShipping);
  const total = Number((calc as any)?.grand_total ?? (calc as any)?.total ?? Math.max(0, subtotal - discount + shipping));

  return {
    subtotal,
    shipping_fee: shipping,
    shipping_charge: shipping,
    discount,
    coupon_discount: discount,
    total,
    is_valid: Boolean((calc as any)?.valid ?? (calc as any)?.is_valid ?? true),
    is_coupon_valid: Boolean((calc as any)?.valid || discount > 0),
    coupon_message: (calc as any)?.message || (discount > 0 ? "Coupon applied" : undefined),
    items: ((calc as any)?.items || []).map((it: any) => ({
      product_id: it.product_id,
      name: it.product?.name || `Product #${it.product_id}`,
      qty: it.quantity || it.requested_quantity || 1,
      unit_price: Number(it.unit_price ?? it.price ?? 0),
      total_price: Number(it.total_price ?? (Number(it.unit_price ?? it.price ?? 0) * (it.quantity || 1))),
      has_stock_error: it.is_valid === false,
      stock_message: it.message || undefined,
    })),
  };
}

/**
 * Maps original Order creation response to OrderSaveResult
 */
export function mapOriginalOrderCreationToSaveResult(
  res: { message: string; order: Order }
): OrderSaveResult {
  const order = res.order;
  return {
    success: true,
    order_id: order.id,
    invoice_id: order.order_number,
    token: `ord_token_${order.id}_${Date.now()}`,
    total: Number(order.total_amount) || 0,
    status: order.order_status || "pending",
    message: res.message || "Order placed successfully",
    order,
  };
}
