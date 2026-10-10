/**
 * Meta (Facebook) Pixel Utility & Event Dispatcher
 *
 * Implements standard ecommerce tracking events compliant with Meta Pixel specifications:
 * - PageView
 * - ViewContent
 * - Search
 * - AddToCart
 * - InitiateCheckout
 * - AddPaymentInfo
 * - Purchase
 *
 * Includes built-in deduplication guards to prevent duplicate events on React re-renders,
 * support for shared eventID for CAPI deduplication, and zero PII leakage.
 */

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1806216353748383";

// Declare global window with fbq
declare global {
  interface Window {
    fbq?: ((...args: any[]) => void) & {
      callMethod?: (...args: any[]) => void;
      queue?: any[];
      loaded?: boolean;
      version?: string;
    };
    _fbq?: any;
  }
}

/**
 * Checks if the Meta Pixel library is ready in the browser.
 */
export function isPixelInitialized(): boolean {
  return typeof window !== "undefined" && typeof window.fbq === "function";
}

/**
 * In-memory deduplication set to avoid re-firing identical events during rapid re-renders.
 */
const recentEventKeys = new Set<string>();

function shouldTrackEvent(dedupKey: string, cooldownMs = 2500): boolean {
  if (recentEventKeys.has(dedupKey)) {
    return false;
  }
  recentEventKeys.add(dedupKey);
  setTimeout(() => {
    recentEventKeys.delete(dedupKey);
  }, cooldownMs);
  return true;
}

// ==========================================
// Event Types & Payloads
// ==========================================

export interface ViewContentParams {
  id: string | number;
  name: string;
  category?: string;
  price: number;
  currency?: string;
  eventId?: string;
}

export interface SearchParams {
  searchString: string;
  category?: string;
  eventId?: string;
}

export interface AddToCartParams {
  id: string | number;
  name: string;
  category?: string;
  price: number;
  quantity?: number;
  currency?: string;
  eventId?: string;
}

export interface InitiateCheckoutParams {
  items: Array<{
    id: string | number;
    name?: string;
    price: number;
    quantity: number;
  }>;
  totalValue: number;
  numItems?: number;
  currency?: string;
  eventId?: string;
}

export interface AddPaymentInfoParams {
  items?: Array<{
    id: string | number;
    quantity: number;
  }>;
  totalValue: number;
  paymentMethod?: string;
  currency?: string;
  eventId?: string;
}

export interface PurchaseParams {
  orderNumber: string | number;
  totalValue: number;
  currency?: string;
  items: Array<{
    id: string | number;
    name?: string;
    price: number;
    quantity: number;
  }>;
  eventId?: string;
}

// ==========================================
// Meta Pixel Tracking Functions
// ==========================================

/**
 * Track standard PageView.
 */
export function trackPageView(options?: { eventId?: string }) {
  if (!isPixelInitialized()) return;
  try {
    if (options?.eventId) {
      window.fbq!("track", "PageView", {}, { eventID: options.eventId });
    } else {
      window.fbq!("track", "PageView");
    }
  } catch (err) {
    console.debug("[Meta Pixel] PageView tracking error:", err);
  }
}

/**
 * Track product detail view (ViewContent).
 */
export function trackViewContent(params: ViewContentParams) {
  if (!isPixelInitialized() || !params.id) return;

  const dedupKey = `ViewContent:${params.id}`;
  if (!shouldTrackEvent(dedupKey, 2000)) return;

  try {
    const payload = {
      content_name: params.name,
      content_category: params.category || "General",
      content_ids: [String(params.id)],
      content_type: "product",
      value: Number(params.price || 0),
      currency: params.currency || "USD",
    };

    if (params.eventId) {
      window.fbq!("track", "ViewContent", payload, { eventID: params.eventId });
    } else {
      window.fbq!("track", "ViewContent", payload);
    }
  } catch (err) {
    console.debug("[Meta Pixel] ViewContent tracking error:", err);
  }
}

/**
 * Track search action (Search).
 */
export function trackSearch(params: SearchParams) {
  if (!isPixelInitialized() || !params.searchString?.trim()) return;

  const cleanQuery = params.searchString.trim().toLowerCase();
  const dedupKey = `Search:${cleanQuery}:${params.category || "all"}`;
  if (!shouldTrackEvent(dedupKey, 2000)) return;

  try {
    const payload: Record<string, any> = {
      search_string: params.searchString.trim(),
    };
    if (params.category) {
      payload.content_category = params.category;
    }

    if (params.eventId) {
      window.fbq!("track", "Search", payload, { eventID: params.eventId });
    } else {
      window.fbq!("track", "Search", payload);
    }
  } catch (err) {
    console.debug("[Meta Pixel] Search tracking error:", err);
  }
}

/**
 * Track product addition to cart (AddToCart).
 */
export function trackAddToCart(params: AddToCartParams) {
  if (!isPixelInitialized() || !params.id) return;

  const qty = Math.max(1, params.quantity || 1);
  const totalItemVal = Number(params.price || 0) * qty;

  try {
    const payload = {
      content_name: params.name,
      content_category: params.category,
      content_ids: [String(params.id)],
      content_type: "product",
      value: totalItemVal,
      currency: params.currency || "USD",
    };

    if (params.eventId) {
      window.fbq!("track", "AddToCart", payload, { eventID: params.eventId });
    } else {
      window.fbq!("track", "AddToCart", payload);
    }
  } catch (err) {
    console.debug("[Meta Pixel] AddToCart tracking error:", err);
  }
}

/**
 * Track checkout initiation (InitiateCheckout).
 */
export function trackInitiateCheckout(params: InitiateCheckoutParams) {
  if (!isPixelInitialized()) return;

  const dedupKey = `InitiateCheckout:${params.totalValue}:${params.items.length}`;
  if (!shouldTrackEvent(dedupKey, 4000)) return;

  try {
    const numItems = params.numItems || params.items.reduce((sum, i) => sum + (i.quantity || 1), 0);
    const payload = {
      content_ids: params.items.map((i) => String(i.id)),
      contents: params.items.map((i) => ({
        id: String(i.id),
        quantity: i.quantity || 1,
        item_price: Number(i.price || 0),
      })),
      content_type: "product",
      num_items: numItems,
      value: Number(params.totalValue || 0),
      currency: params.currency || "USD",
    };

    if (params.eventId) {
      window.fbq!("track", "InitiateCheckout", payload, { eventID: params.eventId });
    } else {
      window.fbq!("track", "InitiateCheckout", payload);
    }
  } catch (err) {
    console.debug("[Meta Pixel] InitiateCheckout tracking error:", err);
  }
}

/**
 * Track payment information submission (AddPaymentInfo).
 */
export function trackAddPaymentInfo(params: AddPaymentInfoParams) {
  if (!isPixelInitialized()) return;

  const dedupKey = `AddPaymentInfo:${params.totalValue}:${params.paymentMethod || "cod"}`;
  if (!shouldTrackEvent(dedupKey, 3000)) return;

  try {
    const payload: Record<string, any> = {
      content_type: "product",
      value: Number(params.totalValue || 0),
      currency: params.currency || "USD",
    };

    if (params.items && params.items.length > 0) {
      payload.content_ids = params.items.map((i) => String(i.id));
      payload.contents = params.items.map((i) => ({
        id: String(i.id),
        quantity: i.quantity,
      }));
    }

    if (params.paymentMethod) {
      payload.payment_method = params.paymentMethod;
    }

    if (params.eventId) {
      window.fbq!("track", "AddPaymentInfo", payload, { eventID: params.eventId });
    } else {
      window.fbq!("track", "AddPaymentInfo", payload);
    }
  } catch (err) {
    console.debug("[Meta Pixel] AddPaymentInfo tracking error:", err);
  }
}

/**
 * Track successful purchase (Purchase).
 * Guarded against duplicate calls across page refreshes via sessionStorage.
 */
export function trackPurchase(params: PurchaseParams) {
  if (!isPixelInitialized() || !params.orderNumber) return;

  const orderKey = String(params.orderNumber);

  // Check persistent session storage to ensure 1 Purchase event per order
  if (typeof window !== "undefined") {
    try {
      const storageKey = `meta_pixel_purchased_${orderKey}`;
      if (sessionStorage.getItem(storageKey) === "true") {
        return;
      }
      sessionStorage.setItem(storageKey, "true");
    } catch {
      // safe fallback if storage is restricted
    }
  }

  try {
    const numItems = params.items.reduce((sum, i) => sum + (i.quantity || 1), 0);
    const payload = {
      content_ids: params.items.map((i) => String(i.id)),
      contents: params.items.map((i) => ({
        id: String(i.id),
        quantity: i.quantity || 1,
        item_price: Number(i.price || 0),
      })),
      content_type: "product",
      num_items: numItems,
      value: Number(params.totalValue || 0),
      currency: params.currency || "USD",
      order_id: orderKey,
    };

    const eventId = params.eventId || `purchase_${orderKey}`;
    window.fbq!("track", "Purchase", payload, { eventID: eventId });
  } catch (err) {
    console.debug("[Meta Pixel] Purchase tracking error:", err);
  }
}

/**
 * Track custom events.
 */
export function trackCustom(eventName: string, params?: Record<string, any>, options?: { eventId?: string }) {
  if (!isPixelInitialized() || !eventName) return;
  try {
    if (options?.eventId) {
      window.fbq!("trackCustom", eventName, params || {}, { eventID: options.eventId });
    } else {
      window.fbq!("trackCustom", eventName, params || {});
    }
  } catch (err) {
    console.debug(`[Meta Pixel] Custom event (${eventName}) error:`, err);
  }
}
