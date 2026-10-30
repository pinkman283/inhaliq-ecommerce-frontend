"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { Locale, TranslationDictionary } from "@/types/i18n";
import { en } from "@/locales/en";
import { bn } from "@/locales/bn";
import {
  formatCurrency,
  formatNumber,
  toBengaliDigits,
  formatDate,
  isProtectedIdentifier,
} from "@/lib/i18n/formatters";

const DICTIONARIES: Record<Locale, TranslationDictionary> = {
  en,
  bn,
};

const COOKIE_NAME = "app_language";

export interface LanguageContextType {
  locale: Locale;
  isBangla: boolean;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string, params?: Record<string, string | number>, fallback?: string) => string;
  formatPrice: (amount: number, currencySymbol?: string) => string;
  formatNum: (val: number, options?: Intl.NumberFormatOptions) => string;
  toLocalDigits: (val: string | number) => string;
  formatDt: (date: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function setLanguageCookie(locale: Locale) {
  if (typeof document === "undefined") return;
  const maxAge = 365 * 24 * 60 * 60; // 1 year
  document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function getLanguageCookie(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  const val = match ? match[2].trim() : null;
  return val === "bn" || val === "en" ? val : null;
}

interface LanguageProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export function LanguageProvider({ children, initialLocale = "en" }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // 1. Check URL search param first (?lang=bn or ?lang=en)
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get("lang");
    if (urlLang === "bn" || urlLang === "en") {
      setLocaleState(urlLang);
      setLanguageCookie(urlLang);
      document.documentElement.lang = urlLang;
      return;
    }

    // 2. Check cookie preference
    const cookieLang = getLanguageCookie();
    if (cookieLang && cookieLang !== locale) {
      setLocaleState(cookieLang);
      document.documentElement.lang = cookieLang;
    } else {
      document.documentElement.lang = locale;
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setLanguageCookie(newLocale);
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLocale;
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const next = prev === "en" ? "bn" : "en";
      setLanguageCookie(next);
      if (typeof document !== "undefined") {
        document.documentElement.lang = next;
      }
      return next;
    });
  }, []);

  /**
   * Resolves a dot-notation key (e.g., "nav.allProducts" or "cart.subtotal").
   * Falls back to English if key is missing in active locale.
   * Warns in development if key is missing completely.
   */
  const t = useCallback(
    (key: string, params?: Record<string, string | number>, fallback?: string): string => {
      const getVal = (dict: any, path: string): string | undefined => {
        const parts = path.split(".");
        let current = dict;
        for (const part of parts) {
          if (!current || typeof current !== "object") return undefined;
          current = current[part];
        }
        return typeof current === "string" ? current : undefined;
      };

      let result = getVal(DICTIONARIES[locale], key);

      // Fallback to English dictionary if missing in current locale
      if (result === undefined && locale !== "en") {
        result = getVal(DICTIONARIES.en, key);
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[i18n] Missing translation for key "${key}" in locale "${locale}". Falling back to English.`);
        }
      }

      // Final fallback if missing in both
      if (result === undefined) {
        if (fallback !== undefined) {
          result = fallback;
        } else {
          if (process.env.NODE_ENV !== "production") {
            console.error(`[i18n] Key "${key}" does not exist in any translation dictionary.`);
          }
          result = key;
        }
      }

      // Parameter interpolation (e.g. {count}, {query})
      if (params && typeof result === "string") {
        for (const [pKey, pVal] of Object.entries(params)) {
          const formattedPVal =
            locale === "bn" && typeof pVal === "number" ? toBengaliDigits(pVal) : String(pVal);
          result = result.replace(new RegExp(`\\{${pKey}\\}`, "g"), formattedPVal);
        }
      }

      return result;
    },
    [locale]
  );

  const formatPrice = useCallback(
    (amount: number, currencySymbol = "৳") => {
      return formatCurrency(amount, locale, currencySymbol);
    },
    [locale]
  );

  const formatNum = useCallback(
    (val: number, options?: Intl.NumberFormatOptions) => {
      return formatNumber(val, locale, options);
    },
    [locale]
  );

  const toLocalDigits = useCallback(
    (val: string | number) => {
      if (locale !== "bn") return String(val);
      if (typeof val === "string" && isProtectedIdentifier(val)) {
        return val; // Never convert SKU, phone numbers, tracking numbers, or order IDs
      }
      return toBengaliDigits(val);
    },
    [locale]
  );

  const formatDt = useCallback(
    (date: string | number | Date, options?: Intl.DateTimeFormatOptions) => {
      return formatDate(date, locale, options);
    },
    [locale]
  );

  const isBangla = locale === "bn";

  const contextValue = useMemo(
    () => ({
      locale,
      isBangla,
      setLocale,
      toggleLocale,
      t,
      formatPrice,
      formatNum,
      toLocalDigits,
      formatDt,
    }),
    [locale, isBangla, setLocale, toggleLocale, t, formatPrice, formatNum, toLocalDigits, formatDt]
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a <LanguageProvider>");
  }
  return context;
}

