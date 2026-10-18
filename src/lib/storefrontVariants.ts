import { Product, ProductVariant, ProductOption } from "@/types";
import {
  getCanonicalVariantKey,
  buildDynamicVariantDisplayName,
  inferOptionsFromLegacyVariants,
} from "@/components/admin/products/variants/VariantCombinationUtils";

/**
 * Resolves the authoritative effective price for a product or selected variant:
 * 1. If direct variant `price` is set (and not null), use direct `price`.
 * 2. If `effective_price` is provided by the backend resource, use `effective_price`.
 * 3. Fall back to base `product.price` + `variant.price_modifier`.
 * 4. For simple products, use base `product.price`.
 */
export function getVariantEffectivePrice(
  product: { price: number | string },
  variant?: (Partial<ProductVariant> & { price?: number | null; effective_price?: number | null; price_modifier?: number | string | null }) | null
): number {
  if (!variant) {
    return Number(product.price || 0);
  }

  // 1. Direct price
  if (variant.price !== undefined && variant.price !== null && !isNaN(Number(variant.price))) {
    return Number(variant.price);
  }

  // 2. Pre-calculated effective price from backend ProductVariantResource
  if (variant.effective_price !== undefined && variant.effective_price !== null && !isNaN(Number(variant.effective_price))) {
    return Number(variant.effective_price);
  }

  // 3. Fallback: base price + price_modifier
  const base = Number(product.price || 0);
  const mod = Number(variant.price_modifier || 0);
  return base + mod;
}

/**
 * Resolves an active variant strictly matching the user's selected attributes.
 *
 * Rules:
 * - Returns null if selection is incomplete (not all declared groups have a selection).
 * - Matches attributes case-insensitively, independent of key ordering.
 * - Falls back to matching legacy color_name and size if attributes map is absent.
 * - Strictly ignores inactive variants (`is_active === false`).
 * - Never constructs or substitutes an arbitrary variant.
 */
export function resolveMatchingVariant(
  variants: ProductVariant[] = [],
  selectedOptions: Record<string, string> = {},
  declaredOptions?: ProductOption[] | null
): ProductVariant | null {
  if (!variants || variants.length === 0) return null;

  // Derive active option groups
  const optionsToMatch =
    declaredOptions && declaredOptions.length > 0
      ? declaredOptions
      : inferOptionsFromLegacyVariants(variants);

  // If no option groups exist, return first active variant or null
  if (optionsToMatch.length === 0) {
    return variants.find((v) => v.is_active !== false) || null;
  }

  // Verify all declared option groups have a non-empty selection
  for (const opt of optionsToMatch) {
    const groupName = opt.name.trim();
    // Case-insensitive lookup in selectedOptions
    const selectedKey = Object.keys(selectedOptions).find(
      (k) => k.trim().toLowerCase() === groupName.toLowerCase()
    );
    const selectedVal = selectedKey ? selectedOptions[selectedKey]?.trim() : "";
    if (!selectedVal) {
      // Incomplete selection: cannot resolve a variant yet
      return null;
    }
  }

  // Normalize user selections
  const normalizedSelections: Record<string, string> = {};
  for (const [k, v] of Object.entries(selectedOptions)) {
    if (v && typeof v === "string") {
      normalizedSelections[k.trim().toLowerCase()] = v.trim().toLowerCase();
    }
  }

  // Find exact matching variant
  for (const v of variants) {
    // Exclude inactive variants
    if (v.is_active === false) continue;

    // Check 1: Match dynamic attributes
    if (v.attributes && typeof v.attributes === "object" && Object.keys(v.attributes).length > 0) {
      const vAttrs: Record<string, string> = {};
      for (const [attrKey, attrVal] of Object.entries(v.attributes)) {
        if (attrVal) {
          vAttrs[attrKey.trim().toLowerCase()] = String(attrVal).trim().toLowerCase();
        }
      }

      let allMatch = true;
      for (const opt of optionsToMatch) {
        const lowerGroup = opt.name.trim().toLowerCase();
        const userVal = normalizedSelections[lowerGroup];
        const variantVal = vAttrs[lowerGroup];
        if (!variantVal || variantVal !== userVal) {
          allMatch = false;
          break;
        }
      }

      if (allMatch) {
        return v;
      }
    }

    // Check 2: Match legacy color_name and size
    const vColor = (v.color_name || "").trim().toLowerCase();
    const vSize = (v.size || "").trim().toLowerCase();
    const userColor = normalizedSelections["color"] || normalizedSelections["colour"] || null;
    const userSize = normalizedSelections["size"] || null;

    if (userColor !== null && userSize !== null) {
      if (vColor === userColor && vSize === userSize) {
        return v;
      }
    } else if (userColor !== null && !userSize) {
      if (vColor === userColor) {
        return v;
      }
    } else if (userSize !== null && !userColor) {
      if (vSize === userSize) {
        return v;
      }
    }
  }

  return null;
}

/**
 * Checks if a specific option value is available (exists and is in stock)
 * given the user's currently selected other options.
 */
export function isOptionValueAvailable(
  variants: ProductVariant[] = [],
  currentSelection: Record<string, string> = {},
  targetGroup: string,
  targetValue: string
): {
  available: boolean;
  inStock: boolean;
  remainingStock: number;
} {
  const normalizedGroup = targetGroup.trim().toLowerCase();
  const normalizedVal = targetValue.trim().toLowerCase();

  // Hypothetical selection with targetValue applied
  const testSelection: Record<string, string> = {};
  for (const [k, v] of Object.entries(currentSelection)) {
    testSelection[k.trim().toLowerCase()] = v.trim().toLowerCase();
  }
  testSelection[normalizedGroup] = normalizedVal;

  let totalMatchingStock = 0;
  let matchingVariantCount = 0;

  for (const v of variants) {
    if (v.is_active === false) continue;

    // Check matching against dynamic attributes or legacy fields
    let matchesTarget = false;
    let matchesOtherSelections = true;

    if (v.attributes && typeof v.attributes === "object" && Object.keys(v.attributes).length > 0) {
      for (const [attrKey, attrVal] of Object.entries(v.attributes)) {
        const lowerKey = attrKey.trim().toLowerCase();
        const lowerVal = String(attrVal).trim().toLowerCase();

        if (lowerKey === normalizedGroup) {
          if (lowerVal === normalizedVal) {
            matchesTarget = true;
          }
        } else if (testSelection[lowerKey]) {
          if (lowerVal !== testSelection[lowerKey]) {
            matchesOtherSelections = false;
          }
        }
      }
    } else {
      // Legacy color/size fallback
      const vColor = (v.color_name || "").trim().toLowerCase();
      const vSize = (v.size || "").trim().toLowerCase();

      if (normalizedGroup === "color" || normalizedGroup === "colour") {
        if (vColor === normalizedVal) matchesTarget = true;
        if (testSelection["size"] && vSize !== testSelection["size"]) {
          matchesOtherSelections = false;
        }
      } else if (normalizedGroup === "size") {
        if (vSize === normalizedVal) matchesTarget = true;
        const colorKey = testSelection["color"] || testSelection["colour"];
        if (colorKey && vColor !== colorKey) {
          matchesOtherSelections = false;
        }
      }
    }

    if (matchesTarget && matchesOtherSelections) {
      matchingVariantCount++;
      totalMatchingStock += Number(v.stock_quantity || 0);
    }
  }

  return {
    available: matchingVariantCount > 0,
    inStock: totalMatchingStock > 0,
    remainingStock: totalMatchingStock,
  };
}

/**
 * Returns color hex code for a color option from variants, or null.
 */
export function getVariantHexColor(variants: ProductVariant[] = [], colorName: string): string | null {
  const lower = colorName.trim().toLowerCase();
  for (const v of variants) {
    if (v.color_name && v.color_name.trim().toLowerCase() === lower && v.color_hex) {
      return v.color_hex;
    }
    if (v.attributes) {
      for (const [k, val] of Object.entries(v.attributes)) {
        if ((k.toLowerCase() === "color" || k.toLowerCase() === "colour") && String(val).trim().toLowerCase() === lower) {
          if (v.color_hex) return v.color_hex;
        }
      }
    }
  }
  return null;
}
