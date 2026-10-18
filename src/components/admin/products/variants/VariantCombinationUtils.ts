import { ProductFormVariant, ProductOption } from "@/types";

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
 * Computes a canonical combination key from attributes or legacy variant fields.
 * Matches backend getCanonicalVariantKey logic exactly:
 * - If attributes map is present and non-empty: sorted lowercased k=v pairs joined by '|'.
 * - Otherwise: color|size or name:lower(name).
 */
export function getCanonicalVariantKey(
  variantOrAttributes:
    | {
        attributes?: Record<string, string> | null;
        color_name?: string | null;
        size?: string | null;
        name?: string | null;
      }
    | Record<string, string>
    | null
    | undefined,
  isDynamic = true
): string {
  if (!variantOrAttributes) return "";

  // Check if direct attributes dictionary was passed
  const isDirectDict =
    typeof variantOrAttributes === "object" &&
    !("color_name" in variantOrAttributes) &&
    !("size" in variantOrAttributes) &&
    !("attributes" in variantOrAttributes);

  const rawAttrs = isDirectDict
    ? (variantOrAttributes as Record<string, string>)
    : (variantOrAttributes as { attributes?: Record<string, string> | null }).attributes;

  if (isDynamic && rawAttrs && typeof rawAttrs === "object" && Object.keys(rawAttrs).length > 0) {
    const pairs: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawAttrs)) {
      const kTrim = String(k || "").trim().toLowerCase();
      const vTrim = String(v || "").trim().toLowerCase();
      if (kTrim) {
        pairs[kTrim] = vTrim;
      }
    }
    const sortedKeys = Object.keys(pairs).sort();
    return sortedKeys.map((k) => `${k}=${pairs[k]}`).join("|");
  }

  // Fallback to legacy fields
  const vObj = variantOrAttributes as {
    color_name?: string | null;
    size?: string | null;
    name?: string | null;
  };

  const color = (vObj.color_name || "").trim().toLowerCase();
  const size = (vObj.size || "").trim().toLowerCase();
  if (color || size) {
    return `${color}|${size}`;
  }

  const name = (vObj.name || "").trim().toLowerCase();
  return name ? `name:${name}` : "";
}

/**
 * Formats a clean display name for a dynamic combination of attributes.
 */
export function buildDynamicVariantDisplayName(
  attributes: Record<string, string>,
  fallback = "Standard Option"
): string {
  const values = Object.values(attributes)
    .map((v) => String(v || "").trim())
    .filter(Boolean);

  if (values.length > 0) {
    return values.join(" / ");
  }
  return fallback;
}

/**
 * Formats a clean display name for a legacy combination.
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
 * Validates dynamic option group structure and value integrity:
 * - Option group names cannot be blank after trim.
 * - Option group names must be unique (case-insensitive after trim).
 * - Each group must contain at least one non-blank value.
 * - Option values within each group must be unique (case-insensitive after trim).
 */
export function validateDynamicOptions(options: ProductOption[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const seenGroupNames = new Set<string>();

  for (let i = 0; i < options.length; i++) {
    const group = options[i];
    const rawName = (group.name || "").trim();

    if (!rawName) {
      errors.push(`Option group #${i + 1} must have a name.`);
      continue;
    }

    const lowerName = rawName.toLowerCase();
    if (seenGroupNames.has(lowerName)) {
      errors.push(`Duplicate option group name '${rawName}'. Option group names must be unique.`);
    } else {
      seenGroupNames.add(lowerName);
    }

    const cleanValues = (group.values || [])
      .map((v) => String(v || "").trim())
      .filter(Boolean);

    if (cleanValues.length === 0) {
      errors.push(`Option group '${rawName}' must contain at least one value.`);
      continue;
    }

    const seenValues = new Set<string>();
    for (const val of cleanValues) {
      const lowerVal = val.toLowerCase();
      if (seenValues.has(lowerVal)) {
        errors.push(`Duplicate value '${val}' in option group '${rawName}'. Values within a group must be unique.`);
      } else {
        seenValues.add(lowerVal);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates dynamic variant attribute completeness and uniqueness.
 */
export function validateDynamicVariants(
  options: ProductOption[],
  variants: ProductFormVariant[]
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const activeOptions = options.filter((o) => (o.name || "").trim() && (o.values || []).length > 0);

  if (activeOptions.length === 0) {
    return { valid: true, errors: [] };
  }

  const seenCombinations = new Set<string>();

  for (let idx = 0; idx < variants.length; idx++) {
    const v = variants[idx];
    const vName = v.name || `Variant #${idx + 1}`;
    const attrs = v.attributes || {};

    // 1. Check all declared options are present
    for (const opt of activeOptions) {
      const optName = opt.name.trim();
      const lowerOptName = optName.toLowerCase();

      // Find attribute key case-insensitively
      const matchedKey = Object.keys(attrs).find((k) => k.trim().toLowerCase() === lowerOptName);
      const attrVal = matchedKey ? String(attrs[matchedKey] || "").trim() : "";

      if (!attrVal) {
        errors.push(`Variant '${vName}' is missing required attribute '${optName}'.`);
        continue;
      }

      // Check value is declared
      const isAllowed = opt.values.some((allowed) => allowed.trim().toLowerCase() === attrVal.toLowerCase());
      if (!isAllowed) {
        errors.push(
          `Invalid value '${attrVal}' for option '${optName}' in variant '${vName}'. Allowed values: ${opt.values.join(", ")}.`
        );
      }
    }

    // 2. Check for undeclared attributes
    for (const attrKey of Object.keys(attrs)) {
      const lowerKey = attrKey.trim().toLowerCase();
      const isDeclared = activeOptions.some((o) => o.name.trim().toLowerCase() === lowerKey);
      if (!isDeclared) {
        errors.push(`Unknown attribute '${attrKey}' in variant '${vName}'. Only declared option groups are allowed.`);
      }
    }

    // 3. Check combination uniqueness
    const canonicalKey = getCanonicalVariantKey(attrs, true);
    if (canonicalKey) {
      if (seenCombinations.has(canonicalKey)) {
        errors.push(`Duplicate variant combination '${buildDynamicVariantDisplayName(attrs, vName)}'. Each combination must be unique.`);
      } else {
        seenCombinations.add(canonicalKey);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Checks an array of variants for duplicate combinations (legacy or dynamic).
 */
export function checkDuplicateVariants(variants: ProductFormVariant[]): string | null {
  const seen = new Set<string>();

  for (const v of variants) {
    const key = v.attributes && Object.keys(v.attributes).length > 0
      ? getCanonicalVariantKey(v.attributes, true)
      : normalizeComboKey(v.color_name, v.size);

    if (key) {
      if (seen.has(key)) {
        const display = v.attributes && Object.keys(v.attributes).length > 0
          ? buildDynamicVariantDisplayName(v.attributes, v.name)
          : buildVariantDisplayName(v.color_name, v.size);
        return `Duplicate combination '${display}' found. Each combination must be unique.`;
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
 * Generates Cartesian combinations for arbitrary N-dimensional option groups
 * while strictly preserving existing variant IDs, SKUs, stock quantities,
 * direct prices, price modifiers, cost prices, barcodes, and images.
 */
export function generateDynamicCombinations({
  options,
  existingVariants,
  defaultStock = 20,
  defaultPrice = null,
  defaultPriceModifier = 0,
}: {
  options: ProductOption[];
  existingVariants: ProductFormVariant[];
  defaultStock?: number;
  defaultPrice?: number | null;
  defaultPriceModifier?: number;
}): ProductFormVariant[] {
  // Filter valid options with non-empty name and at least 1 value
  const validOptions = options
    .map((opt) => ({
      name: opt.name.trim(),
      values: opt.values.map((v) => v.trim()).filter(Boolean),
    }))
    .filter((opt) => opt.name && opt.values.length > 0);

  if (validOptions.length === 0) {
    return [];
  }

  // 1. Build lookup maps of existing variants
  const existingByCanonicalKey = new Map<string, ProductFormVariant>();
  const existingByLegacyKey = new Map<string, ProductFormVariant>();
  const existingById = new Map<number, ProductFormVariant>();

  for (const v of existingVariants) {
    if (v.id) {
      existingById.set(v.id, v);
    }

    if (v.attributes && Object.keys(v.attributes).length > 0) {
      const canonicalKey = getCanonicalVariantKey(v.attributes, true);
      if (canonicalKey) {
        existingByCanonicalKey.set(canonicalKey, v);
      }
    }

    const legacyKey = normalizeComboKey(v.color_name, v.size);
    if (legacyKey) {
      existingByLegacyKey.set(legacyKey, v);
    }
  }

  // 2. Cartesian product generation helper
  const cartesian = (arrays: string[][]): string[][] => {
    return arrays.reduce<string[][]>(
      (acc, curr) => acc.flatMap((prev) => curr.map((item) => [...prev, item])),
      [[]]
    );
  };

  const optionNames = validOptions.map((o) => o.name);
  const optionValueArrays = validOptions.map((o) => o.values);
  const rawCombinations = cartesian(optionValueArrays);

  const matchedExistingIds = new Set<number>();
  const generatedVariants: ProductFormVariant[] = [];

  for (const comboValues of rawCombinations) {
    const attributes: Record<string, string> = {};
    let colorName: string | null = null;
    let sizeValue: string | null = null;

    optionNames.forEach((name, idx) => {
      const val = comboValues[idx];
      attributes[name] = val;

      const lowerName = name.toLowerCase();
      if (lowerName === "color" || lowerName === "colour") {
        colorName = val;
      } else if (lowerName === "size") {
        sizeValue = val;
      }
    });

    const canonicalKey = getCanonicalVariantKey(attributes, true);
    const legacyKey = normalizeComboKey(colorName, sizeValue);

    // Try matching existing variant:
    // 1st: by canonical attributes key
    // 2nd: by legacy color/size key
    let existing = existingByCanonicalKey.get(canonicalKey);
    if (!existing && legacyKey) {
      existing = existingByLegacyKey.get(legacyKey);
    }

    const displayName = buildDynamicVariantDisplayName(attributes);

    if (existing) {
      if (existing.id) {
        matchedExistingIds.add(existing.id);
      }

      // PRESERVE IDENTITY AND MANUALLY EDITED VALUES!
      generatedVariants.push({
        ...existing,
        name: existing.name || displayName,
        attributes,
        color_name: colorName || existing.color_name || null,
        color_hex: existing.color_hex || null,
        size: sizeValue || existing.size || null,
        stock_quantity: existing.stock_quantity ?? defaultStock,
        price: existing.price !== undefined ? existing.price : defaultPrice,
        price_modifier: existing.price_modifier ?? defaultPriceModifier,
        cost_price: existing.cost_price ?? null,
        barcode: existing.barcode ?? null,
        sku: existing.sku ?? null,
        image_id: existing.image_id ?? null,
        image_url: existing.image_url ?? null,
        is_active: existing.is_active !== undefined ? existing.is_active : true,
      });
    } else {
      // New Combination
      generatedVariants.push({
        id: undefined,
        name: displayName,
        attributes,
        color_name: colorName,
        color_hex: null,
        size: sizeValue,
        stock_quantity: defaultStock,
        price: defaultPrice,
        price_modifier: defaultPriceModifier,
        cost_price: null,
        barcode: null,
        sku: null,
        image_id: null,
        image_url: null,
        is_active: true,
      });
    }
  }

  return generatedVariants;
}

/**
 * Backward-compatible wrapper for legacy Color × Size generation.
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
  const options: ProductOption[] = [];

  if (selectedColors.length > 0) {
    options.push({
      name: "Color",
      values: selectedColors.map((c) => c.name),
    });
  }

  if (selectedSizes.length > 0) {
    options.push({
      name: "Size",
      values: selectedSizes,
    });
  }

  const generated = generateDynamicCombinations({
    options,
    existingVariants,
    defaultStock,
    defaultPrice: null,
    defaultPriceModifier,
  });

  // Preserve hex codes for matched colors
  return generated.map((v) => {
    if (v.color_name) {
      const matched = selectedColors.find((c) => c.name.toLowerCase() === v.color_name?.toLowerCase());
      if (matched?.hex) {
        return { ...v, color_hex: matched.hex };
      }
    }
    return v;
  });
}

/**
 * Infers dynamic product options from existing variants when options metadata is absent.
 */
export function inferOptionsFromLegacyVariants(
  variants: Array<ProductFormVariant | { color_name?: string | null; size?: string | null; attributes?: Record<string, string> | null }>
): ProductOption[] {
  if (!variants || variants.length === 0) return [];

  // Check if any variant has dynamic attributes
  const hasAttributes = variants.some((v) => v.attributes && Object.keys(v.attributes).length > 0);

  if (hasAttributes) {
    const groupsMap = new Map<string, Set<string>>();

    for (const v of variants) {
      if (v.attributes) {
        for (const [k, val] of Object.entries(v.attributes)) {
          const kTrim = k.trim();
          const valTrim = String(val || "").trim();
          if (kTrim && valTrim) {
            if (!groupsMap.has(kTrim)) {
              groupsMap.set(kTrim, new Set());
            }
            groupsMap.get(kTrim)!.add(valTrim);
          }
        }
      }
    }

    return Array.from(groupsMap.entries()).map(([name, valuesSet]) => ({
      name,
      values: Array.from(valuesSet),
    }));
  }

  // Infer from legacy color_name and size
  const colorSet = new Set<string>();
  const sizeSet = new Set<string>();

  for (const v of variants) {
    if (v.color_name?.trim()) colorSet.add(v.color_name.trim());
    if (v.size?.trim()) sizeSet.add(v.size.trim());
  }

  const options: ProductOption[] = [];
  if (colorSet.size > 0) {
    options.push({ name: "Color", values: Array.from(colorSet) });
  }
  if (sizeSet.size > 0) {
    options.push({ name: "Size", values: Array.from(sizeSet) });
  }

  return options;
}
