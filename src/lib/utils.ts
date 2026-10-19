import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let appCurrencySymbol = "৳";

export function setAppCurrencySymbol(symbol: string) {
  if (symbol && typeof symbol === "string") {
    appCurrencySymbol = symbol.trim();
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("store_currency_symbol", appCurrencySymbol);
        window.dispatchEvent(new Event("currency_changed"));
      } catch {}
    }
  }
}

export function getAppCurrencySymbol(): string {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("store_currency_symbol");
      if (stored) return stored;
    } catch {}
  }
  return appCurrencySymbol;
}

export function formatPrice(price: number | string | undefined | null, customSymbol?: string): string {
  const num = typeof price === "string" ? parseFloat(price) : price ?? 0;
  if (isNaN(num)) return "0";
  const symbol = customSymbol || getAppCurrencySymbol();
  return `${symbol} ${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateVal: string | Date | undefined | null): string {
  if (!dateVal) return "";
  const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatTime(dateVal: string | Date | undefined | null): string {
  if (!dateVal) return "";
  const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(d);
}

export function formatDateTime(dateVal: string | Date | undefined | null): string {
  if (!dateVal) return "";
  const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
  return `${formatDate(d)}, ${formatTime(d)}`;
}

