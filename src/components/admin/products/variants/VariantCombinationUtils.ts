import { ProductFormVariant } from "@/types";

/**
 * Normalizes a combination of color and size by trimming whitespace and lowercasing.
 * Returns empty string if both are empty (generic variant).
 */
export function normalizeComboKey(color?: string | null, size?: string | null): string {
  const c = (color || "").trim().toLowerCase();
  const s = (size || "").trim().toLowerCase();
  if (!c && !s) return "";
  return `${c}|${s}`;
}

/**
 * Formats a clean display name for a combination.
 */
export function buildVariantDisplayName(
  colorName?: string | null,
  sizeValue?: string | null,
  fallback?: string
): string {
  const c = (colorName || "").trim();
  const s = (sizeValue || "").trim();
  if (c && s) return `${c} / ${s}`;
  if (c) return c;
  if (s) return s;
  return fallback || "Standard Option";
}

/**
 * Checks an array of variants for duplicate combinations.
 * Returns an error string if a duplicate is found, or null if all valid.
 */
export function checkDuplicateVariants(variants: ProductFormVariant[]): string | null {
  const seen = new Set<string>();

  for (const v of variants) {
    const key = normalizeComboKey(v.color_name, v.size);
    if (key) {
      if (seen.has(key)) {
        const display = buildVariantDisplayName(v.color_name, v.size);
        return `Duplicate combination '${display}' found. Each color and size option must be unique.`;
      }
      seen.add(key);
    }
  }

  return null;
}

export interface SelectedColorOption {
  name: string;
  hex?: string | null;
}

/**
 * Generates Cartesian combinations (Colors × Sizes) while strictly preserving
 * existing variant IDs, SKUs, stock quantities, price modifiers, cost prices,
 * and barcodes for any combination that already exists.
 *
 * Also preserves any existing generic variants (where color and size are null).
 */
export function generateCartesianCombinations({
  selectedColors,
  selectedSizes,
  existingVariants,
  defaultStock = 20,
  defaultPriceModifier = 0,
}: {
  selectedColors: SelectedColorOption[];
  selectedSizes: string[];
  existingVariants: ProductFormVariant[];
  defaultStock?: number;
  defaultPriceModifier?: number;
}): ProductFormVariant[] {
  // 1. Build a lookup map of existing combinations by normalized key
  const existingMap = new Map<string, ProductFormVariant>();
  const genericExistingVariants: ProductFormVariant[] = [];

  for (const v of existingVariants) {
    const key = normalizeComboKey(v.color_name, v.size);
    if (key) {
      existingMap.set(key, v);
    } else {
      // Retain generic variants (e.g. switch types without color/size)
      genericExistingVariants.push(v);
    }
  }

  const generatedCombos: ProductFormVariant[] = [];
  const processedKeys = new Set<string>();

  const processCombo = (color: SelectedColorOption | null, size: string | null) => {
    const colorName = color ? color.name.trim() : null;
    const colorHex = color ? (color.hex || null) : null;
    const sizeVal = size ? size.trim() : null;

    const key = normalizeComboKey(colorName, sizeVal);
    if (!key || processedKeys.has(key)) return;
    processedKeys.add(key);

    const existing = existingMap.get(key);
    if (existing) {
      // PRESERVE existing variant identity and attributes!
      generatedCombos.push({
        ...existing,
        name: existing.name || buildVariantDisplayName(colorName, sizeVal),
        color_name: colorName,
        color_hex: colorHex || existing.color_hex,
        size: sizeVal,
      });
    } else {
      // Create new combination
      generatedCombos.push({
        id: undefined,
        name: buildVariantDisplayName(colorName, sizeVal),
        color_name: colorName,
        color_hex: colorHex,
        size: sizeVal,
        stock_quantity: defaultStock,
        price_modifier: defaultPriceModifier,
        cost_price: null,
        barcode: null,
        sku: null,
      });
    }
  };

  // Case A: Both Colors and Sizes selected -> Cartesian Product (C × S)
  if (selectedColors.length > 0 && selectedSizes.length > 0) {
    for (const color of selectedColors) {
      for (const size of selectedSizes) {
        processCombo(color, size);
      }
    }
  }
  // Case B: Only Colors selected (Size = null)
  else if (selectedColors.length > 0) {
    for (const color of selectedColors) {
      processCombo(color, null);
    }
  }
  // Case C: Only Sizes selected (Color = null)
  else if (selectedSizes.length > 0) {
    for (const size of selectedSizes) {
      processCombo(null, size);
    }
  }

  // Preserve all existing generic variants that have neither color nor size
  return [...genericExistingVariants, ...generatedCombos];
}
