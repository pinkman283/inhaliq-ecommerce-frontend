/**
 * Meta (Facebook) Pixel Utility & Event Dispatcher
 *
 * Re-exports and synchronizes with @/lib/analytics for unified dual-dispatch
 * to both Meta Pixel and Google Tag Manager dataLayer.
 */

import {
  trackPageView as unifiedPageView,
  trackViewContent as unifiedViewContent,
  trackSearch as unifiedSearch,
  trackAddToCart as unifiedAddToCart,
  trackInitiateCheckout as unifiedInitiateCheckout,
  trackAddPaymentInfo as unifiedAddPaymentInfo,
  trackPurchase as unifiedPurchase,
  isPixelActive,
  ViewContentEvent,
  SearchEvent,
  AddToCartEvent,
  InitiateCheckoutEvent,
  AddPaymentInfoEvent,
  PurchaseEvent,
} from "./analytics";

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1806216353748383";

export function isPixelInitialized(): boolean {
  return isPixelActive();
}

export type ViewContentParams = ViewContentEvent;
export type SearchParams = SearchEvent;
export type AddToCartParams = AddToCartEvent;
export type InitiateCheckoutParams = InitiateCheckoutEvent;
export type AddPaymentInfoParams = AddPaymentInfoEvent;
export type PurchaseParams = PurchaseEvent;

export function trackPageView(options?: { eventId?: string }) {
  unifiedPageView(undefined, options);
}

export function trackViewContent(params: ViewContentParams) {
  unifiedViewContent(params);
}

export function trackSearch(params: SearchParams) {
  unifiedSearch(params);
}

export function trackAddToCart(params: AddToCartParams) {
  unifiedAddToCart(params);
}

export function trackInitiateCheckout(params: InitiateCheckoutParams) {
  unifiedInitiateCheckout(params);
}

export function trackAddPaymentInfo(params: AddPaymentInfoParams) {
  unifiedAddPaymentInfo(params);
}

export function trackPurchase(params: PurchaseParams) {
  unifiedPurchase(params);
}

export function trackCustom(eventName: string, params?: Record<string, any>, options?: { eventId?: string }) {
  if (typeof window === "undefined" || !window.fbq) return;
  try {
    if (options?.eventId) {
      window.fbq("trackCustom", eventName, params || {}, { eventID: options.eventId });
    } else {
      window.fbq("trackCustom", eventName, params || {});
    }
  } catch (err) {
    console.debug(`[Meta Pixel] Custom event (${eventName}) error:`, err);
  }
}
