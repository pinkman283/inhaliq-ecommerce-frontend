/**
 * Inhaliq Unified Storefront Analytics & Tracking Hub
 *
 * Dispatches standard ecommerce events simultaneously to:
 * 1. Meta (Facebook) Pixel (`window.fbq`)
 * 2. Google Tag Manager (`window.dataLayer`)
 *
 * Implements:
 * - Anti-flood & in-memory deduplication
 * - Purchase single-fire protection via sessionStorage
 * - Dynamic activation driven by backend admin settings
 * - Zero PII leakage
 */

declare global {
  interface Window {
    fbq?: ((...args: any[]) => void) & {
      callMethod?: (...args: any[]) => void;
      queue?: any[];
      loaded?: boolean;
      version?: string;
    };
    _fbq?: any;
    dataLayer?: any[];
  }
}

export interface AnalyticsItem {
  id: string | number;
  name?: string;
  category?: string;
  price?: number;
  quantity?: number;
}

export interface ViewContentEvent {
  id: string | number;
  name: string;
  category?: string;
  price: number;
  currency?: string;
  eventId?: string;
}

export interface SearchEvent {
  searchString: string;
  category?: string;
  eventId?: string;
}

export interface AddToCartEvent {
  id: string | number;
  name: string;
  category?: string;
  price: number;
  quantity?: number;
  currency?: string;
  eventId?: string;
}

export interface InitiateCheckoutEvent {
  items: AnalyticsItem[];
  totalValue: number;
  currency?: string;
  eventId?: string;
}

export interface AddPaymentInfoEvent {
  items?: AnalyticsItem[];
  totalValue: number;
  paymentMethod?: string;
  currency?: string;
  eventId?: string;
}

export interface PurchaseEvent {
  orderNumber: string | number;
  totalValue: number;
  currency?: string;
  items: AnalyticsItem[];
  eventId?: string;
}

/**
 * Deduplication cache to prevent React 19 double-mount / fast re-render event duplicates.
 */
const recentEventKeys = new Set<string>();

function shouldTrack(dedupKey: string, cooldownMs = 2500): boolean {
  if (recentEventKeys.has(dedupKey)) {
    return false;
  }
  recentEventKeys.add(dedupKey);
  setTimeout(() => {
    recentEventKeys.delete(dedupKey);
  }, cooldownMs);
  return true;
}

export function isPixelActive(): boolean {
  return typeof window !== "undefined" && typeof window.fbq === "function";
}

export function isGtmActive(): boolean {
  return typeof window !== "undefined" && Array.isArray(window.dataLayer);
}

/**
 * Safely push to window.dataLayer
 */
function pushGtm(data: Record<string, any>) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(data);
}

/**
 * Track PageView
 */
export function trackPageView(url?: string, options?: { eventId?: string }) {
  if (typeof window === "undefined") return;

  const currentUrl = url || window.location.href;

  // 1. Meta Pixel
  if (isPixelActive()) {
    try {
      if (options?.eventId) {
        window.fbq!("track", "PageView", {}, { eventID: options.eventId });
      } else {
        window.fbq!("track", "PageView");
      }
    } catch (e) {
      console.debug("[Analytics] Meta PageView error:", e);
    }
  }

  // 2. Google Tag Manager
  if (isGtmActive()) {
    try {
      pushGtm({
        event: "page_view",
        page_location: currentUrl,
        page_path: window.location.pathname,
        page_title: typeof document !== "undefined" ? document.title : "",
      });
    } catch (e) {
      console.debug("[Analytics] GTM PageView error:", e);
    }
  }
}

/**
 * Track Product View (ViewContent / view_item)
 */
export function trackViewContent(params: ViewContentEvent) {
  if (typeof window === "undefined" || !params.id) return;

  const dedupKey = `view_item:${params.id}`;
  if (!shouldTrack(dedupKey, 2000)) return;

  const currency = params.currency || "BDT";
  const price = Number(params.price || 0);

  // 1. Meta Pixel
  if (isPixelActive()) {
    try {
      const payload = {
        content_name: params.name,
        content_category: params.category || "General",
        content_ids: [String(params.id)],
        content_type: "product",
        value: price,
        currency: currency,
      };
      if (params.eventId) {
        window.fbq!("track", "ViewContent", payload, { eventID: params.eventId });
      } else {
        window.fbq!("track", "ViewContent", payload);
      }
    } catch (e) {
      console.debug("[Analytics] Meta ViewContent error:", e);
    }
  }

  // 2. Google Tag Manager (GA4 E-commerce Schema)
  if (isGtmActive()) {
    try {
      pushGtm({ ecommerce: null }); // Clear previous ecommerce object
      pushGtm({
        event: "view_item",
        ecommerce: {
          currency: currency,
          value: price,
          items: [
            {
              item_id: String(params.id),
              item_name: params.name,
              item_category: params.category || "General",
              price: price,
              quantity: 1,
            },
          ],
        },
      });
    } catch (e) {
      console.debug("[Analytics] GTM view_item error:", e);
    }
  }
}

/**
 * Track Search action
 */
export function trackSearch(params: SearchEvent) {
  if (typeof window === "undefined" || !params.searchString?.trim()) return;

  const cleanQuery = params.searchString.trim().toLowerCase();
  const dedupKey = `search:${cleanQuery}:${params.category || "all"}`;
  if (!shouldTrack(dedupKey, 2000)) return;

  // 1. Meta Pixel
  if (isPixelActive()) {
    try {
      const payload: Record<string, any> = { search_string: params.searchString.trim() };
      if (params.category) payload.content_category = params.category;
      if (params.eventId) {
        window.fbq!("track", "Search", payload, { eventID: params.eventId });
      } else {
        window.fbq!("track", "Search", payload);
      }
    } catch (e) {
      console.debug("[Analytics] Meta Search error:", e);
    }
  }

  // 2. Google Tag Manager
  if (isGtmActive()) {
    try {
      pushGtm({
        event: "search",
        search_term: params.searchString.trim(),
        search_category: params.category || "all",
      });
    } catch (e) {
      console.debug("[Analytics] GTM search error:", e);
    }
  }
}

/**
 * Track Add to Cart (AddToCart / add_to_cart)
 */
export function trackAddToCart(params: AddToCartEvent) {
  if (typeof window === "undefined" || !params.id) return;

  const qty = Math.max(1, params.quantity || 1);
  const price = Number(params.price || 0);
  const totalVal = price * qty;
  const currency = params.currency || "BDT";

  // 1. Meta Pixel
  if (isPixelActive()) {
    try {
      const payload = {
        content_name: params.name,
        content_category: params.category || "General",
        content_ids: [String(params.id)],
        content_type: "product",
        value: totalVal,
        currency: currency,
      };
      if (params.eventId) {
        window.fbq!("track", "AddToCart", payload, { eventID: params.eventId });
      } else {
        window.fbq!("track", "AddToCart", payload);
      }
    } catch (e) {
      console.debug("[Analytics] Meta AddToCart error:", e);
    }
  }

  // 2. Google Tag Manager
  if (isGtmActive()) {
    try {
      pushGtm({ ecommerce: null });
      pushGtm({
        event: "add_to_cart",
        ecommerce: {
          currency: currency,
          value: totalVal,
          items: [
            {
              item_id: String(params.id),
              item_name: params.name,
              item_category: params.category || "General",
              price: price,
              quantity: qty,
            },
          ],
        },
      });
    } catch (e) {
      console.debug("[Analytics] GTM add_to_cart error:", e);
    }
  }
}

/**
 * Track Checkout Initiation (InitiateCheckout / begin_checkout)
 */
export function trackInitiateCheckout(params: InitiateCheckoutEvent) {
  if (typeof window === "undefined" || !params.items || params.items.length === 0) return;

  const dedupKey = `initiate_checkout:${params.totalValue}:${params.items.length}`;
  if (!shouldTrack(dedupKey, 4000)) return;

  const currency = params.currency || "BDT";
  const totalVal = Number(params.totalValue || 0);

  // 1. Meta Pixel
  if (isPixelActive()) {
    try {
      const payload = {
        content_ids: params.items.map((i) => String(i.id)),
        contents: params.items.map((i) => ({
          id: String(i.id),
          quantity: i.quantity || 1,
          item_price: Number(i.price || 0),
        })),
        content_type: "product",
        num_items: params.items.reduce((acc, i) => acc + (i.quantity || 1), 0),
        value: totalVal,
        currency: currency,
      };
      if (params.eventId) {
        window.fbq!("track", "InitiateCheckout", payload, { eventID: params.eventId });
      } else {
        window.fbq!("track", "InitiateCheckout", payload);
      }
    } catch (e) {
      console.debug("[Analytics] Meta InitiateCheckout error:", e);
    }
  }

  // 2. Google Tag Manager
  if (isGtmActive()) {
    try {
      pushGtm({ ecommerce: null });
      pushGtm({
        event: "begin_checkout",
        ecommerce: {
          currency: currency,
          value: totalVal,
          items: params.items.map((i) => ({
            item_id: String(i.id),
            item_name: i.name || "Product",
            item_category: i.category || "General",
            price: Number(i.price || 0),
            quantity: i.quantity || 1,
          })),
        },
      });
    } catch (e) {
      console.debug("[Analytics] GTM begin_checkout error:", e);
    }
  }
}

/**
 * Track Payment Info Submission (AddPaymentInfo / add_payment_info)
 */
export function trackAddPaymentInfo(params: AddPaymentInfoEvent) {
  if (typeof window === "undefined") return;

  const dedupKey = `add_payment_info:${params.totalValue}:${params.paymentMethod || "cod"}`;
  if (!shouldTrack(dedupKey, 3000)) return;

  const currency = params.currency || "BDT";
  const totalVal = Number(params.totalValue || 0);

  // 1. Meta Pixel
  if (isPixelActive()) {
    try {
      const payload: Record<string, any> = {
        content_type: "product",
        value: totalVal,
        currency: currency,
        payment_method: params.paymentMethod || "cod",
      };
      if (params.items && params.items.length > 0) {
        payload.content_ids = params.items.map((i) => String(i.id));
      }
      if (params.eventId) {
        window.fbq!("track", "AddPaymentInfo", payload, { eventID: params.eventId });
      } else {
        window.fbq!("track", "AddPaymentInfo", payload);
      }
    } catch (e) {
      console.debug("[Analytics] Meta AddPaymentInfo error:", e);
    }
  }

  // 2. Google Tag Manager
  if (isGtmActive()) {
    try {
      pushGtm({ ecommerce: null });
      pushGtm({
        event: "add_payment_info",
        ecommerce: {
          currency: currency,
          value: totalVal,
          payment_type: params.paymentMethod || "cod",
          items: (params.items || []).map((i) => ({
            item_id: String(i.id),
            item_name: i.name || "Product",
            price: Number(i.price || 0),
            quantity: i.quantity || 1,
          })),
        },
      });
    } catch (e) {
      console.debug("[Analytics] GTM add_payment_info error:", e);
    }
  }
}

/**
 * Track Successful Purchase (Purchase / purchase)
 * Guarded against duplicate calls across refreshes via sessionStorage.
 */
export function trackPurchase(params: PurchaseEvent) {
  if (typeof window === "undefined" || !params.orderNumber) return;

  const orderKey = String(params.orderNumber);

  // Check persistent session storage so 1 Purchase event fires per order
  try {
    const storageKey = `analytics_purchased_${orderKey}`;
    if (sessionStorage.getItem(storageKey) === "true") {
      return;
    }
    sessionStorage.setItem(storageKey, "true");
  } catch {
    // fallback if storage access restricted
  }

  const currency = params.currency || "BDT";
  const totalVal = Number(params.totalValue || 0);
  const eventId = params.eventId || `purchase_${orderKey}`;

  // 1. Meta Pixel
  if (isPixelActive()) {
    try {
      const payload = {
        content_ids: params.items.map((i) => String(i.id)),
        contents: params.items.map((i) => ({
          id: String(i.id),
          quantity: i.quantity || 1,
          item_price: Number(i.price || 0),
        })),
        content_type: "product",
        num_items: params.items.reduce((acc, i) => acc + (i.quantity || 1), 0),
        value: totalVal,
        currency: currency,
        order_id: orderKey,
      };
      window.fbq!("track", "Purchase", payload, { eventID: eventId });
    } catch (e) {
      console.debug("[Analytics] Meta Purchase error:", e);
    }
  }

  // 2. Google Tag Manager
  if (isGtmActive()) {
    try {
      pushGtm({ ecommerce: null });
      pushGtm({
        event: "purchase",
        ecommerce: {
          transaction_id: orderKey,
          value: totalVal,
          currency: currency,
          items: params.items.map((i) => ({
            item_id: String(i.id),
            item_name: i.name || "Product",
            item_category: i.category || "General",
            price: Number(i.price || 0),
            quantity: i.quantity || 1,
          })),
        },
      });
    } catch (e) {
      console.debug("[Analytics] GTM purchase error:", e);
    }
  }
}
