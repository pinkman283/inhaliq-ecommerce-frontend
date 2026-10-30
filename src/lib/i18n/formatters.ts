import { Locale } from "@/types/i18n";

/**
 * Maps English digits (0-9) to Bengali digits (০-৯).
 */
const BENGALI_DIGITS: Record<string, string> = {
  "0": "০",
  "1": "১",
  "2": "২",
  "3": "৩",
  "4": "৪",
  "5": "৫",
  "6": "৬",
  "7": "৭",
  "8": "৮",
  "9": "৯",
};

/**
 * Converts numbers or strings containing numbers to Bengali numerals,
 * while safely preserving non-digit characters.
 */
export function toBengaliDigits(value: string | number): string {
  if (value === undefined || value === null) return "";
  return String(value).replace(/[0-9]/g, (digit) => BENGALI_DIGITS[digit] || digit);
}

/**
 * Identifiers that MUST NEVER be converted to Bengali numerals for transactional safety.
 */
export function isProtectedIdentifier(value: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();

  // Bangladeshi phone numbers (e.g., 01712345678, +8801812345678, 8801712345678)
  if (/^(\+?880|0)1[0-9]{9}$/.test(trimmed)) return true;

  // Order numbers / SKU codes / UUIDs (e.g., ORD-2026-001, SKU_A12, 550e8400-...)
  if (/^[A-Za-z0-9_-]{3,}$/.test(trimmed) && /[A-Za-z]/.test(trimmed)) return true;

  // Tracking numbers (must contain letters and digits, min 6 chars)
  if (/^[A-Za-z0-9]{6,32}$/.test(trimmed) && /[A-Za-z]/.test(trimmed) && /[0-9]/.test(trimmed)) return true;

  return false;
}

/**
 * Formats a localized number using standard Intl.NumberFormat.
 */
export function formatNumber(
  value: number,
  locale: Locale = "en",
  options?: Intl.NumberFormatOptions
): string {
  if (typeof value !== "number" || isNaN(value)) return "0";

  try {
    const intlLocale = locale === "bn" ? "bn-BD" : "en-US";
    return new Intl.NumberFormat(intlLocale, options).format(value);
  } catch (err) {
    console.warn("Intl.NumberFormat fallback:", err);
    return locale === "bn" ? toBengaliDigits(value) : String(value);
  }
}

/**
 * Formats a currency amount (BDT / ৳ by default) with standard locale formatting.
 * Does NOT alter transactional math or stored prices.
 */
export function formatCurrency(
  amount: number,
  locale: Locale = "en",
  currencySymbol = "৳"
): string {
  if (typeof amount !== "number" || isNaN(amount)) return `${currencySymbol}0`;

  const formattedNum = formatNumber(amount, locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `${currencySymbol}${formattedNum}`;
}

/**
 * Formats dates into friendly locale strings.
 */
export function formatDate(
  dateInput: string | number | Date,
  locale: Locale = "en",
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return "";

  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);

    const intlLocale = locale === "bn" ? "bn-BD" : "en-US";
    const defaultOptions: Intl.DateTimeFormatOptions = options || {
      year: "numeric",
      month: "short",
      day: "numeric",
    };

    return new Intl.DateTimeFormat(intlLocale, defaultOptions).format(date);
  } catch (err) {
    console.warn("Intl.DateTimeFormat fallback:", err);
    return String(dateInput);
  }
}
