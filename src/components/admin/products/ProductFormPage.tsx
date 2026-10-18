"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  DollarSign,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Save,
  Plus,
  Trash2,
  X,
  Tag,
  ExternalLink,
  ShieldCheck,
  FolderTree,
} from "lucide-react";
import {
  Category,
  Brand,
  Product,
  ProductOption,
  ProductFormData,
  ProductFormImage,
  ProductFormVariant,
} from "@/types";
import { adminApi } from "@/lib/adminApi";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

// Subcomponents
import { ProductMediaTab } from "./ProductMediaTab";
import {
  DynamicOptionGroupEditor,
  VariantBulkToolbar,
  VariantMatrixTable,
  generateDynamicCombinations,
  validateDynamicOptions,
  validateDynamicVariants,
  inferOptionsFromLegacyVariants,
  checkDuplicateVariants,
} from "./variants";
import { UnsavedChangesModal } from "./UnsavedChangesModal";
import { ModeSwitchConfirmationModal } from "./ModeSwitchConfirmationModal";

interface ProductFormPageProps {
  mode: "create" | "edit";
  productId?: number;
}

const DEFAULT_FORM_DATA: ProductFormData = {
  name: "",
  category_id: "1",
  subcategory_id: "",
  brand_id: "",
  brand: "AETHER Studio",
  price: "0",
  compare_at_price: "0",
  cost_price: "",
  stock_quantity: "0",
  short_description: "",
  description: "",
  meta_title: "",
  meta_description: "",
  is_featured: false,
  is_new_arrival: true,
  is_best_seller: false,
  is_active: true,
  images: [],
  variants: [],
  options: [],
};

export function ProductFormPage({ mode, productId }: ProductFormPageProps) {
  const router = useRouter();

  // Core Data States
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [product, setProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState<ProductFormData>(DEFAULT_FORM_DATA);
  const [initialSnapshot, setInitialSnapshot] = useState<string>(JSON.stringify(DEFAULT_FORM_DATA));

  // Dynamic Options state
  const [options, setOptions] = useState<ProductOption[]>([]);

  // Mode: Has variants toggle & safe mode switch confirmation
  const [hasVariants, setHasVariants] = useState<boolean>(false);
  const [showModeSwitchModal, setShowModeSwitchModal] = useState<boolean>(false);
  const stashedVariantsRef = useRef<ProductFormVariant[]>([]);

  const handleToggleHasVariants = (checked: boolean) => {
    if (!checked) {
      // If product has existing or configured variants, warn user before deactivation
      const hasConfiguredVariants =
        (formData.variants && formData.variants.length > 0) ||
        (product?.variants && product.variants.length > 0);

      if (hasConfiguredVariants) {
        setShowModeSwitchModal(true);
        return;
      }

      setHasVariants(false);
      setOptions([]);
    } else {
      setHasVariants(true);
      if ((!formData.variants || formData.variants.length === 0) && stashedVariantsRef.current.length > 0) {
        updateField("variants", stashedVariantsRef.current);
      }
    }
  };

  const handleConfirmModeSwitchToSimple = () => {
    if (formData.variants && formData.variants.length > 0) {
      stashedVariantsRef.current = formData.variants;
    }
    setHasVariants(false);
    setOptions([]);
    updateField("variants", []);
    updateField("options", []);
    setShowModeSwitchModal(false);
    toast.info("Switched to Simple Product mode. Existing variants will be safely deactivated upon save.");
  };

  // Specifications Key-Value rows
  const [specsList, setSpecsList] = useState<Array<{ key: string; value: string }>>([]);

  // Tags list
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Validation & Error Tracking
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiErrorBanner, setApiErrorBanner] = useState<string | null>(null);

  // Unsaved Changes Modal State
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [pendingNavigationHref, setPendingNavigationHref] = useState<string | null>(null);

  // Quick Category / Brand Modal States
  const [isQuickCategoryOpen, setIsQuickCategoryOpen] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState("");
  const [quickCategoryDescription, setQuickCategoryDescription] = useState("");
  const [quickCategorySaving, setQuickCategorySaving] = useState(false);

  const [isQuickBrandOpen, setIsQuickBrandOpen] = useState(false);
  const [quickBrandName, setQuickBrandName] = useState("");
  const [quickBrandWebsite, setQuickBrandWebsite] = useState("");
  const [quickBrandDescription, setQuickBrandDescription] = useState("");
  const [quickBrandSaving, setQuickBrandSaving] = useState(false);

  // Session uploaded image tracking for cleanup on discard
  const sessionUploadedUrlsRef = useRef<string[]>([]);

  // DOM element refs for auto-scrolling to errors
  const nameInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const mediaSectionRef = useRef<HTMLDivElement>(null);

  // Load initial data
  useEffect(() => {
    let ignore = false;

    async function initialize() {
      try {
        const [catsRes, brandsRes] = await Promise.all([
          adminApi.getCategories(),
          adminApi.getBrands(),
        ]);

        if (ignore) return;
        setCategories(catsRes || []);
        setBrands(brandsRes || []);

        if (mode === "edit" && productId) {
          const prodRes = await adminApi.getProduct(productId);
          if (ignore) return;

          setProduct(prodRes);

          // Map existing images
          let initialImages: ProductFormImage[] = [];
          if (prodRes.images && prodRes.images.length > 0) {
            initialImages = prodRes.images.map((img) => ({
              id: img.id,
              image_url: img.image_url,
              is_primary: Boolean(img.is_primary),
              alt_text: img.alt_text || undefined,
              color_name: img.color_name || undefined,
              display_order: img.display_order,
              source: "url",
            }));
          } else if (prodRes.primary_image) {
            initialImages = [
              {
                id: prodRes.primary_image.id,
                image_url: prodRes.primary_image.image_url,
                is_primary: true,
                alt_text: prodRes.primary_image.alt_text || undefined,
                color_name: prodRes.primary_image.color_name || undefined,
                display_order: 0,
                source: "url",
              },
            ];
          }

          // Map options (or infer from legacy variants)
          let initialOptions: ProductOption[] = [];
          if (prodRes.options && Array.isArray(prodRes.options) && prodRes.options.length > 0) {
            initialOptions = prodRes.options;
          } else if (prodRes.variants && prodRes.variants.length > 0) {
            initialOptions = inferOptionsFromLegacyVariants(prodRes.variants);
          }
          setOptions(initialOptions);

          // Map existing variants
          let initialVariants: ProductFormVariant[] = [];
          if (prodRes.variants && prodRes.variants.length > 0) {
            initialVariants = prodRes.variants.map((v) => ({
              id: v.id,
              name: v.name,
              size: v.size || null,
              color_name: v.color_name || (v.color_hex ? v.name : null),
              color_hex: v.color_hex || null,
              stock_quantity: v.stock_quantity ?? 0,
              price_modifier: Number(v.price_modifier || 0),
              price: v.price !== null && v.price !== undefined ? Number(v.price) : null,
              cost_price: v.cost_price ? Number(v.cost_price) : null,
              barcode: v.barcode || null,
              sku: v.sku || null,
              attributes: v.attributes || (v.color_name || v.size ? { ...(v.color_name ? { Color: v.color_name } : {}), ...(v.size ? { Size: v.size } : {}) } : null),
              image_id: v.image_id ? Number(v.image_id) : null,
              image_url: v.image_url || null,
              is_active: v.is_active !== undefined ? Boolean(v.is_active) : true,
            }));
          }

          const hasVars = initialVariants.length > 0;
          setHasVariants(hasVars);

          // Map specs
          if (prodRes.specifications && typeof prodRes.specifications === "object") {
            const parsedSpecs = Object.entries(prodRes.specifications).map(([key, val]) => ({
              key,
              value: String(val),
            }));
            setSpecsList(parsedSpecs);
          }

          // Map tags
          if (Array.isArray(prodRes.tags)) {
            setTagsList(prodRes.tags);
          }

          const loadedData: ProductFormData = {
            name: prodRes.name || "",
            category_id:
              prodRes.category?.id?.toString() ||
              prodRes.category_id?.toString() ||
              catsRes[0]?.id?.toString() ||
              "1",
            subcategory_id: prodRes.subcategory_id?.toString() || "",
            brand_id:
              prodRes.brand_id?.toString() ||
              brandsRes.find((b) => b.name.toLowerCase() === (prodRes.brand || "").toLowerCase())?.id?.toString() ||
              "",
            brand: prodRes.brand || "AETHER Studio",
            price: prodRes.price?.toString() || "0",
            compare_at_price: prodRes.compare_at_price ? prodRes.compare_at_price.toString() : "0",
            cost_price: prodRes.cost_price ? prodRes.cost_price.toString() : "",
            stock_quantity: prodRes.stock_quantity?.toString() || "0",
            short_description: prodRes.short_description || "",
            description: prodRes.description || "",
            meta_title: prodRes.meta_title || "",
            meta_description: prodRes.meta_description || "",
            is_featured: Boolean(prodRes.is_featured),
            is_new_arrival: Boolean(prodRes.is_new_arrival),
            is_best_seller: Boolean(prodRes.is_best_seller),
            is_active: prodRes.is_active !== undefined ? Boolean(prodRes.is_active) : true,
            images: initialImages,
            variants: initialVariants,
            options: initialOptions,
          };

          setFormData(loadedData);
          setInitialSnapshot(JSON.stringify(loadedData));
        } else {
          // Initialize Create Mode defaults
          const defaultData: ProductFormData = {
            ...DEFAULT_FORM_DATA,
            category_id: catsRes[0]?.id?.toString() || "1",
            brand_id: brandsRes[0]?.id?.toString() || "",
            brand: brandsRes[0]?.name || "AETHER Studio",
          };
          setFormData(defaultData);
          setInitialSnapshot(JSON.stringify(defaultData));
        }
      } catch (err) {
        console.error("Failed to load product form dependencies:", err);
        toast.error("Failed to load product data. Please check your network connection.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    initialize();
    return () => {
      ignore = true;
    };
  }, [mode, productId]);

  // Is Form Dirty?
  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== initialSnapshot;
  }, [formData, initialSnapshot]);

  // Native beforeunload protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Form Field Updater
  const updateField = <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Available Colors for Media Association
  const availableColors = useMemo(() => {
    const set = new Set<string>();
    (formData.variants || []).forEach((v) => {
      if (v.color_name?.trim()) set.add(v.color_name.trim());
    });
    return Array.from(set);
  }, [formData.variants]);

  // Financial Calculations
  const priceNum = parseFloat(formData.price || "0");
  const costNum = parseFloat(formData.cost_price || "0");
  const compareNum = parseFloat(formData.compare_at_price || "0");
  const profitPerUnit = priceNum > 0 && costNum > 0 ? priceNum - costNum : null;
  const grossMargin = priceNum > 0 && costNum > 0 ? ((priceNum - costNum) / priceNum) * 100 : null;
  const discountPercent = compareNum > priceNum && priceNum > 0
    ? Math.round(((compareNum - priceNum) / compareNum) * 100)
    : null;

  // Variant inventory summation
  const variantStockSum = useMemo(() => {
    if (!formData.variants || formData.variants.length === 0) return 0;
    return formData.variants.reduce((acc, v) => acc + (Number(v.stock_quantity) || 0), 0);
  }, [formData.variants]);

  // Tag Handlers
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagInput.trim().replace(/^,+|,+$/g, "");
      if (val && !tagsList.includes(val)) {
        setTagsList([...tagsList, val]);
        setTagInput("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTagsList(tagsList.filter((t) => t !== tagToRemove));
  };

  // Specs Handlers
  const handleAddSpecRow = () => {
    setSpecsList([...specsList, { key: "", value: "" }]);
  };

  const handleUpdateSpecRow = (idx: number, keyOrVal: "key" | "value", text: string) => {
    const next = [...specsList];
    next[idx][keyOrVal] = text;
    setSpecsList(next);
  };

  const handleRemoveSpecRow = (idx: number) => {
    setSpecsList(specsList.filter((_, i) => i !== idx));
  };

  // Discard & Navigation Handling
  const handleAttemptNavigation = (targetHref: string) => {
    if (isDirty) {
      setPendingNavigationHref(targetHref);
      setShowDiscardModal(true);
    } else {
      router.push(targetHref);
    }
  };

  const handleConfirmDiscard = () => {
    // Purge session uncommitted images
    if (sessionUploadedUrlsRef.current.length > 0) {
      sessionUploadedUrlsRef.current.forEach((url) => {
        adminApi.deleteUncommittedImage({ image_url: url }).catch(() => {});
      });
      sessionUploadedUrlsRef.current = [];
    }
    setShowDiscardModal(false);
    const dest = pendingNavigationHref || "/admin/products";
    router.push(dest);
  };

  // Quick Category creation
  const handleSaveQuickCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCategoryName.trim()) {
      toast.error("Category name is required.");
      return;
    }
    setQuickCategorySaving(true);
    try {
      const res = await adminApi.createCategory({
        name: quickCategoryName.trim(),
        description: quickCategoryDescription.trim() || undefined,
        icon: "Sparkles",
        is_featured: true,
      });
      const newCat = res.category;
      setCategories((prev) => [...prev, newCat]);
      updateField("category_id", newCat.id.toString());
      updateField("subcategory_id", "");
      setIsQuickCategoryOpen(false);
      setQuickCategoryName("");
      setQuickCategoryDescription("");
      toast.success(`Category '${newCat.name}' created.`);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj.response?.data?.message || "Failed to create category.");
    } finally {
      setQuickCategorySaving(false);
    }
  };

  // Quick Brand creation
  const handleSaveQuickBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBrandName.trim()) {
      toast.error("Brand name is required.");
      return;
    }
    setQuickBrandSaving(true);
    try {
      const res = await adminApi.createBrand({
        name: quickBrandName.trim(),
        website: quickBrandWebsite.trim() || undefined,
        description: quickBrandDescription.trim() || undefined,
        is_featured: true,
      });
      const newBrand = res.brand;
      setBrands((prev) => [...prev, newBrand]);
      updateField("brand_id", newBrand.id.toString());
      updateField("brand", newBrand.name);
      setIsQuickBrandOpen(false);
      setQuickBrandName("");
      setQuickBrandWebsite("");
      setQuickBrandDescription("");
      toast.success(`Brand '${newBrand.name}' created.`);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj.response?.data?.message || "Failed to create brand.");
    } finally {
      setQuickBrandSaving(false);
    }
  };

  // Variant Matrix Synchronization Handler
  const handleSyncMatrix = () => {
    const nextVariants = generateDynamicCombinations({
      options,
      existingVariants: formData.variants,
      defaultStock: 20,
      defaultPrice: Number(formData.price) || null,
      defaultPriceModifier: 0,
    });

    const dupError = checkDuplicateVariants(nextVariants);
    if (dupError) {
      toast.error(dupError);
      return;
    }

    updateField("variants", nextVariants);
    const sum = nextVariants
      .filter((v) => v.is_active !== false)
      .reduce((acc, v) => acc + (Number(v.stock_quantity) || 0), 0);
    updateField("stock_quantity", sum.toString());
    toast.success(`Generated matrix with ${nextVariants.length} option combination(s).`);
  };

  // Variant Inline Editing Handlers
  const handleUpdateVariant = (index: number, updated: Partial<ProductFormVariant>) => {
    const next = formData.variants.map((v, idx) => (idx === index ? { ...v, ...updated } : v));
    updateField("variants", next);
    const sum = next
      .filter((v) => v.is_active !== false)
      .reduce((acc, v) => acc + (Number(v.stock_quantity) || 0), 0);
    updateField("stock_quantity", sum.toString());
  };

  const handleRemoveVariant = (index: number) => {
    const removed = formData.variants[index];
    const next = formData.variants.filter((_, idx) => idx !== index);
    updateField("variants", next);
    const sum = next
      .filter((v) => v.is_active !== false)
      .reduce((acc, v) => acc + (Number(v.stock_quantity) || 0), 0);
    updateField("stock_quantity", sum.toString());
    toast.info(`Removed option '${removed?.name || "variant"}'.`);
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiErrorBanner(null);

    // 1. Client-Side Validations
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Product title is mandatory.";
    }

    if (isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      errors.price = "A valid non-negative selling price is required.";
    }

    if (formData.images.length === 0) {
      errors.images = "At least 1 product image is required in the Media section.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.name) {
        nameInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        nameInputRef.current?.focus();
      } else if (errors.price) {
        priceInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        priceInputRef.current?.focus();
      } else if (errors.images) {
        mediaSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      toast.error("Please resolve the required fields marked in red.");
      return;
    }

    // 2. Validate Dynamic Options & Variants if Variable Mode
    if (hasVariants) {
      const optValidation = validateDynamicOptions(options);
      if (!optValidation.valid) {
        toast.error(`Options validation: ${optValidation.errors[0]}`);
        setApiErrorBanner(optValidation.errors.join(". "));
        return;
      }

      if (formData.variants.length === 0) {
        toast.error("Please generate at least 1 variant combination or switch to Simple Product.");
        return;
      }

      const varValidation = validateDynamicVariants(options, formData.variants);
      if (!varValidation.valid) {
        toast.error(`Variant validation: ${varValidation.errors[0]}`);
        setApiErrorBanner(varValidation.errors.join(". "));
        return;
      }
    }

    setSaving(true);

    // Clean Specs Object
    const specificationsObj: Record<string, string> = {};
    specsList.forEach((spec) => {
      if (spec.key.trim() && spec.value.trim()) {
        specificationsObj[spec.key.trim()] = spec.value.trim();
      }
    });

    // Clean Images
    const sanitizedImages = formData.images.map((img, idx) => ({
      id: img.id,
      image_url: img.image_url,
      is_primary: img.is_primary,
      display_order: idx,
      alt_text: img.alt_text || formData.name.trim(),
      color_name: img.color_name || null,
    }));

    if (!sanitizedImages.some((img) => img.is_primary)) {
      sanitizedImages[0].is_primary = true;
    }

    const primaryUrl =
      sanitizedImages.find((img) => img.is_primary)?.image_url || sanitizedImages[0].image_url;

    // Clean Variants: If hasVariants is false, submit empty variants array
    const activeVariantsPayload = hasVariants
      ? formData.variants.map((v) => ({
          id: v.id,
          name: v.name,
          attributes: v.attributes || null,
          color_name: v.color_name || (v.attributes?.Color || v.attributes?.color || null),
          color_hex: v.color_hex || null,
          size: v.size || (v.attributes?.Size || v.attributes?.size || null),
          stock_quantity: Number(v.stock_quantity || 0),
          price_modifier: Number(v.price_modifier || 0),
          price: v.price !== null && v.price !== undefined && !isNaN(Number(v.price)) ? Number(v.price) : null,
          cost_price: v.cost_price !== null && v.cost_price !== undefined && !isNaN(Number(v.cost_price)) ? Number(v.cost_price) : null,
          barcode: v.barcode ? String(v.barcode).trim() : null,
          image_id: v.image_id ? Number(v.image_id) : null,
          is_active: v.is_active !== undefined ? Boolean(v.is_active) : true,
        }))
      : [];

    const calculatedStock = hasVariants
      ? variantStockSum
      : Math.max(0, parseInt(formData.stock_quantity || "0", 10));

    const sanitizedOptions =
      hasVariants && options.length > 0
        ? options.map((opt) => ({
            name: opt.name.trim(),
            values: opt.values.map((v) => v.trim()).filter(Boolean),
          }))
        : null;

    const payload = {
      name: formData.name.trim(),
      category_id: Number(formData.category_id),
      subcategory_id: formData.subcategory_id ? Number(formData.subcategory_id) : null,
      brand_id: formData.brand_id ? Number(formData.brand_id) : null,
      brand: formData.brand || undefined,
      price: Number(formData.price),
      compare_at_price: formData.compare_at_price ? Number(formData.compare_at_price) : null,
      cost_price: formData.cost_price ? Number(formData.cost_price) : null,
      stock_quantity: calculatedStock,
      short_description: formData.short_description.trim() || null,
      description: formData.description.trim() || "High performance studio hardware.",
      images: sanitizedImages,
      image_url: primaryUrl,
      is_featured: formData.is_featured,
      is_new_arrival: formData.is_new_arrival,
      is_best_seller: formData.is_best_seller,
      is_active: formData.is_active,
      options: sanitizedOptions,
      variants: activeVariantsPayload,
      meta_title: formData.meta_title.trim() || null,
      meta_description: formData.meta_description.trim() || null,
      tags: tagsList,
      specifications: Object.keys(specificationsObj).length > 0 ? specificationsObj : null,
    };

    try {
      if (mode === "edit" && productId) {
        const res = await adminApi.updateProduct(productId, payload);
        toast.success(`Product '${res.product.name}' updated successfully.`);
        setInitialSnapshot(JSON.stringify(formData));
        sessionUploadedUrlsRef.current = [];
        router.push("/admin/products");
      } else {
        const res = await adminApi.createProduct(payload);
        toast.success(`Product '${res.product.name}' created successfully.`);
        setInitialSnapshot(JSON.stringify(formData));
        sessionUploadedUrlsRef.current = [];
        router.push("/admin/products");
      }
    } catch (err: unknown) {
      console.error("Save product failed:", err);
      const errorObj = err as {
        response?: {
          data?: {
            message?: string;
            errors?: Record<string, string[]>;
          };
        };
      };

      const serverMsg = errorObj.response?.data?.message || "Failed to save product.";
      const serverErrors = errorObj.response?.data?.errors;

      if (serverErrors) {
        const flatErrors = Object.values(serverErrors).flat().join(" ");
        setApiErrorBanner(`${serverMsg} ${flatErrors}`);
      } else {
        setApiErrorBanner(serverMsg);
      }

      toast.error(serverMsg);
    } finally {
      setSaving(false);
    }
  };

  // Subcategories filtered by category
  const rootCategories = categories.filter((c) => !c.parent_id);
  const activeRootList = rootCategories.length > 0 ? rootCategories : categories;
  const subcategories = categories.filter(
    (c) => c.parent_id === Number(formData.category_id)
  );

  // Loading State
  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#A78BFA] animate-spin" />
        <p className="text-xs text-slate-400 font-mono tracking-wide">Loading product workspace…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* 1. TOP STICKY HEADER & BREADCRUMBS */}
      <div className="sticky top-0 z-30 bg-[#090B10]/90 backdrop-blur-md border-b border-white/[0.08] -mx-4 sm:-mx-6 px-4 sm:px-6 py-3.5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => handleAttemptNavigation("/admin/products")}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 border border-white/5 transition cursor-pointer shrink-0"
            title="Back to Products Catalog"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-500">
                Products / {mode === "edit" ? `#${productId}` : "Create"}
              </span>
              {isDirty && (
                <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Unsaved Changes
                </span>
              )}
            </div>
            <h1 className="text-base font-bold text-white tracking-tight truncate">
              {mode === "edit"
                ? `Edit: ${formData.name || "Untitled Product"}`
                : "Create Hardware Product"}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {mode === "edit" && product?.slug && (
            <Link
              href={`/products/${product.slug}`}
              target="_blank"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-medium transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Storefront View</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => handleAttemptNavigation("/admin/products")}
            className="px-3.5 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 border border-white/5 transition cursor-pointer"
          >
            Discard
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] text-xs font-bold transition cursor-pointer disabled:opacity-50 shadow-sm shadow-purple-500/20 active:scale-95"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? "Saving..." : mode === "edit" ? "Save Changes" : "Publish Product"}</span>
          </button>
        </div>
      </div>

      {/* API Error Alert Banner */}
      {apiErrorBanner && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs animate-in fade-in duration-150">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-white">Save Operation Failed</h4>
            <p className="text-rose-200/90 leading-relaxed">{apiErrorBanner}</p>
          </div>
        </div>
      )}

      {/* 2. MAIN 2-COLUMN RESPONSIVE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Main Form Elements (70% width) */}
        <div className="lg:col-span-8 space-y-6">
          {/* CARD 1: GENERAL INFORMATION */}
          <div className="rounded-lg border border-white/[0.08] bg-[#0c101d] p-5 space-y-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA]">
                  <Package className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Product Details
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">* Required fields</span>
            </div>

            {/* Product Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 block">
                Product Title <span className="text-rose-400">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                required
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g. AeroPack Pro 24L Modular Travel Pack"
                className={`w-full bg-white/[0.03] hover:bg-white/[0.05] border rounded-md px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 transition-all outline-none ${
                  fieldErrors.name
                    ? "border-rose-500 focus:border-rose-400 bg-rose-500/[0.02]"
                    : "border-white/10 focus:border-[#A78BFA]/60"
                }`}
              />
              {fieldErrors.name && (
                <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Slug / Permalink Preview */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/[0.02] border border-white/5 text-[11px] font-mono text-slate-400">
              <span className="text-slate-500">Permalink:</span>
              <span className="text-slate-300 truncate">
                inhaliq.com/products/
                <span className="text-[#A78BFA] font-semibold">
                  {product?.slug || (formData.name ? formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "auto-generated")}
                </span>
              </span>
            </div>

            {/* Short Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">
                Summary / Short Description
              </label>
              <input
                type="text"
                value={formData.short_description}
                onChange={(e) => updateField("short_description", e.target.value)}
                placeholder="High performance studio hardware with carbon-composite finish."
                className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#A78BFA]/50 rounded-md px-3.5 py-2 text-xs text-white placeholder:text-slate-500 transition outline-none"
              />
              <p className="text-[10px] text-slate-500">Shown in product card badges, search results, and quick-views.</p>
            </div>

            {/* Full Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 block">
                Full Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={5}
                required
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe features, build materials, technical specifications, and what is inside the box..."
                className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#A78BFA]/60 rounded-md p-3.5 text-xs text-white placeholder:text-slate-500 transition-all outline-none resize-y"
              />
            </div>

            {/* Tags Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#A78BFA]" />
                Catalog Tags
              </label>
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white/[0.02] border border-white/10 rounded-md min-h-[38px]">
                {tagsList.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-slate-200 font-mono"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-400 hover:text-rose-400 transition cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Type tag & press Enter..."
                  className="bg-transparent border-none text-xs text-white placeholder:text-slate-500 outline-none flex-1 min-w-[140px] px-1"
                />
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 block">
                  Technical Specifications
                </label>
                <button
                  type="button"
                  onClick={handleAddSpecRow}
                  className="text-[11px] font-medium text-[#A78BFA] hover:text-[#B9A3FF] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Spec
                </button>
              </div>

              {specsList.length > 0 ? (
                <div className="space-y-2">
                  {specsList.map((spec, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Spec Name (e.g. Weight)"
                        value={spec.key}
                        onChange={(e) => handleUpdateSpecRow(i, "key", e.target.value)}
                        className="w-1/3 bg-white/[0.03] border border-white/10 rounded-md px-3 py-1.5 text-xs text-white outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. 1.2 kg / Aluminum)"
                        value={spec.value}
                        onChange={(e) => handleUpdateSpecRow(i, "value", e.target.value)}
                        className="flex-1 bg-white/[0.03] border border-white/10 rounded-md px-3 py-1.5 text-xs text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecRow(i)}
                        className="p-1.5 rounded-md text-slate-500 hover:text-rose-400 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic">No custom technical specs configured.</p>
              )}
            </div>
          </div>

          {/* CARD 2: MEDIA MANAGEMENT */}
          <div
            ref={mediaSectionRef}
            className={`rounded-lg border bg-[#0c101d] p-5 space-y-4 shadow-xs ${
              fieldErrors.images ? "border-rose-500/80" : "border-white/[0.08]"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ImageIcon className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Product Media & Images
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {formData.images.length}/5 uploaded
              </span>
            </div>

            {fieldErrors.images && (
              <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{fieldErrors.images}</span>
              </div>
            )}

            {/* Embedded Media Pipeline */}
            <ProductMediaTab
              images={formData.images}
              onImagesChange={(imgs) => updateField("images", imgs)}
              productName={formData.name}
              availableColors={availableColors}
              onImageUploaded={(url) => {
                sessionUploadedUrlsRef.current.push(url);
              }}
              onImageDeleted={(img) => {
                sessionUploadedUrlsRef.current = sessionUploadedUrlsRef.current.filter((u) => u !== img.image_url);
              }}
            />
          </div>

          {/* CARD 3: PRICING & FINANCIAL COGS */}
          <div className="rounded-lg border border-white/[0.08] bg-[#0c101d] p-5 space-y-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA]">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Pricing & Profit Margins
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Currency: USD / BDT</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Selling Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 block">
                  {hasVariants ? "Base Catalog Price" : "Selling Price"} <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">$</span>
                  <input
                    ref={priceInputRef}
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => updateField("price", e.target.value)}
                    placeholder="0.00"
                    className={`w-full bg-white/[0.03] hover:bg-white/[0.05] border rounded-md pl-8 pr-3.5 py-2.5 text-xs text-white font-mono transition-all outline-none ${
                      fieldErrors.price
                        ? "border-rose-500 focus:border-rose-400 bg-rose-500/[0.02]"
                        : "border-white/10 focus:border-[#A78BFA]/60"
                    }`}
                  />
                </div>
                {fieldErrors.price ? (
                  <p className="text-[11px] text-rose-400 font-medium">{fieldErrors.price}</p>
                ) : (
                  <p className="text-[10.5px] text-slate-500">
                    {hasVariants
                      ? "Base price. Variant final prices are computed as base + variant modifier."
                      : "Retail price charged to customer."}
                  </p>
                )}
              </div>

              {/* Compare-At Price */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300 block">Compare-At Price</label>
                  <span className="text-[10px] text-slate-500 font-mono">Optional</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.compare_at_price}
                    onChange={(e) => updateField("compare_at_price", e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#A78BFA]/50 rounded-md pl-8 pr-3.5 py-2.5 text-xs text-white font-mono transition outline-none"
                  />
                </div>
                <p className="text-[10.5px] text-slate-500">
                  {discountPercent ? (
                    <span className="text-emerald-400 font-semibold">{discountPercent}% Discount badge</span>
                  ) : (
                    "Shows strikethrough original price"
                  )}
                </p>
              </div>

              {/* Cost Price */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300 block">Cost Price (COGS)</label>
                  <span className="text-[10px] text-slate-500 font-mono">Internal only</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_price}
                    onChange={(e) => updateField("cost_price", e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#A78BFA]/50 rounded-md pl-8 pr-3.5 py-2.5 text-xs text-white font-mono transition outline-none"
                  />
                </div>
                <p className="text-[10.5px] text-slate-500">Inventory valuation and profit analytics.</p>
              </div>
            </div>

            {/* Profit & Margin Calculator Banner */}
            {grossMargin !== null && profitPerUnit !== null && (
              <div className="p-3 rounded-md bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300 font-medium">Estimated Gross Margin:</span>
                  <span
                    className={`font-mono font-bold ${
                      grossMargin >= 30
                        ? "text-emerald-400"
                        : grossMargin > 0
                        ? "text-amber-400"
                        : "text-rose-400"
                    }`}
                  >
                    {grossMargin.toFixed(1)}%
                  </span>
                </div>
                <div className="font-mono text-slate-300">
                  Gross Profit:{" "}
                  <span className="text-emerald-400 font-bold">
                    ${profitPerUnit.toFixed(2)} / unit
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* CARD 4: INVENTORY & OPTIONS (SIMPLE VS VARIANTS) */}
          <div className="rounded-lg border border-white/[0.08] bg-[#0c101d] p-5 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Inventory & Options
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Configure simple standalone products or multi-option combination matrices.
                  </p>
                </div>
              </div>

              {/* Mode Toggle Switch */}
              <div className="flex items-center gap-2 p-1.5 rounded-md bg-white/[0.03] border border-white/10 self-start sm:self-auto">
                <Switch
                  checked={hasVariants}
                  onCheckedChange={handleToggleHasVariants}
                />
                <span className="text-xs font-medium text-slate-200">
                  {hasVariants ? "Has Multiple Options" : "Simple Product"}
                </span>
              </div>
            </div>

            {/* Case A: Simple Product (No Variants) */}
            {!hasVariants && (
              <div className="space-y-4">
                {product?.variants && product.variants.length > 0 && (
                  <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-300">Existing Variants Warning</p>
                      <p className="text-[11px] text-amber-200/80 mt-0.5">
                        This product currently has {product.variants.length} saved variant(s) in the catalog. Saving in Simple Product mode will remove existing variants upon submission. Switch back to &quot;Has Multiple Options&quot; to preserve them.
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-3.5 rounded-md bg-white/[0.02] border border-white/5 space-y-1">
                  <p className="text-xs font-semibold text-white">Simple Product Inventory</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    This product has no selectable variants. Physical warehouse stock is tracked directly under this product.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Stock Quantity */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-200 block">
                      Warehouse Stock <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.stock_quantity}
                      onChange={(e) => updateField("stock_quantity", e.target.value)}
                      placeholder="0"
                      className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-cyan-400/60 rounded-md px-3.5 py-2.5 text-xs text-white font-mono transition outline-none"
                    />
                    <p className="text-[10px] text-slate-500">Units available for immediate fulfillment.</p>
                  </div>

                  {/* SKU */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 block">Master SKU</label>
                    <input
                      type="text"
                      disabled
                      value={product?.sku || "Auto-generated upon save"}
                      className="w-full bg-white/[0.02] border border-white/5 text-slate-400 font-mono rounded-md px-3.5 py-2.5 text-xs cursor-not-allowed"
                    />
                    <p className="text-[10px] text-slate-500">Persistent unique inventory SKU.</p>
                  </div>

                  {/* Barcode */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 block">Barcode / UPC / EAN</label>
                    <input
                      type="text"
                      placeholder="880912345678"
                      disabled
                      className="w-full bg-white/[0.02] border border-white/5 text-slate-400 font-mono rounded-md px-3.5 py-2.5 text-xs cursor-not-allowed"
                      title="Variant-level barcodes are managed in the matrix view."
                    />
                    <p className="text-[10px] text-slate-500">Scannable barcode identifier.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Case B: Multi-Option / Variants View */}
            {hasVariants && (
              <div className="space-y-5">
                <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
                  <span>
                    Stock Synchronized: Total inventory is <strong>{variantStockSum} units</strong> across{" "}
                    <strong>{formData.variants.length} options</strong>.
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-200">
                    Auto-summed
                  </span>
                </div>

                {/* Dynamic Option Group Editor */}
                <DynamicOptionGroupEditor
                  options={options}
                  onOptionsChange={(nextOpts) => {
                    setOptions(nextOpts);
                    updateField("options", nextOpts);
                  }}
                  onSyncMatrix={handleSyncMatrix}
                  disabled={saving}
                />

                {/* Bulk Toolbar */}
                {formData.variants.length > 0 && (
                  <VariantBulkToolbar
                    onBulkSetStock={(stock) => {
                      const next = formData.variants.map((v) => ({ ...v, stock_quantity: stock }));
                      updateField("variants", next);
                      const sum = next.filter((v) => v.is_active !== false).reduce((acc, v) => acc + (Number(v.stock_quantity) || 0), 0);
                      updateField("stock_quantity", sum.toString());
                    }}
                    onBulkSetDirectPrice={(price) => {
                      const next = formData.variants.map((v) => ({ ...v, price }));
                      updateField("variants", next);
                    }}
                    onBulkSetPriceModifier={(mod) => {
                      const next = formData.variants.map((v) => ({ ...v, price_modifier: mod }));
                      updateField("variants", next);
                    }}
                    onBulkSetCostPrice={(cost) => {
                      const next = formData.variants.map((v) => ({ ...v, cost_price: cost }));
                      updateField("variants", next);
                    }}
                    onBulkSetActive={(isActive) => {
                      const next = formData.variants.map((v) => ({ ...v, is_active: isActive }));
                      updateField("variants", next);
                      const sum = next.filter((v) => v.is_active !== false).reduce((acc, v) => acc + (Number(v.stock_quantity) || 0), 0);
                      updateField("stock_quantity", sum.toString());
                    }}
                    onClearMatrix={() => {
                      updateField("variants", []);
                      updateField("stock_quantity", "0");
                    }}
                    totalVariantsCount={formData.variants.length}
                  />
                )}

                {/* Matrix Table */}
                <VariantMatrixTable
                  variants={formData.variants}
                  onUpdateVariant={handleUpdateVariant}
                  onRemoveVariant={handleRemoveVariant}
                  basePrice={Number(formData.price) || 0}
                  availableImages={formData.images}
                />
              </div>
            )}
          </div>

          {/* CARD 5: SEARCH ENGINE OPTIMIZATION (SEO) */}
          <div className="rounded-lg border border-white/[0.08] bg-[#0c101d] p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA]">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Search Engine Optimization (SEO)
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">SERP Metadata</span>
            </div>

            {/* Meta Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200">Meta Title</label>
                <span className="text-[10px] text-slate-500 font-mono">
                  {formData.meta_title.length}/60 chars
                </span>
              </div>
              <input
                type="text"
                value={formData.meta_title}
                onChange={(e) => updateField("meta_title", e.target.value)}
                placeholder={formData.name || "Custom meta title for Google search results"}
                className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#A78BFA]/50 rounded-md px-3.5 py-2 text-xs text-white placeholder:text-slate-500 transition outline-none"
              />
            </div>

            {/* Meta Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200">Meta Description</label>
                <span className="text-[10px] text-slate-500 font-mono">
                  {formData.meta_description.length}/160 chars
                </span>
              </div>
              <textarea
                rows={2}
                value={formData.meta_description}
                onChange={(e) => updateField("meta_description", e.target.value)}
                placeholder="Brief summary appearing under the page title in search engine result pages..."
                className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#A78BFA]/50 rounded-md p-3 text-xs text-white placeholder:text-slate-500 transition outline-none resize-none"
              />
            </div>

            {/* Google SERP Preview */}
            <div className="p-4 rounded-md bg-white/[0.02] border border-white/5 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                Google Search Result Preview
              </p>
              <p className="text-[11px] text-emerald-400 font-mono truncate">
                https://inhaliq.com/products/{product?.slug || "your-product-slug"}
              </p>
              <h4 className="text-sm font-semibold text-sky-400 hover:underline cursor-pointer truncate">
                {formData.meta_title || formData.name || "Product Title Preview | Inhaliq Hardware"}
              </h4>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {formData.meta_description ||
                  formData.short_description ||
                  formData.description ||
                  "Discover premium studio hardware, mechanical engineering, and accessories with global express shipping."}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar Controls (30% width) */}
        <div className="lg:col-span-4 space-y-6">
          {/* SIDEBAR CARD 1: PUBLISHING & VISIBILITY */}
          <div className="rounded-lg border border-white/[0.08] bg-[#0c101d] p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-white/[0.06] flex items-center justify-between">
              <span>Publishing Status</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  formData.is_active
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}
              >
                {formData.is_active ? "Active" : "Draft"}
              </span>
            </h3>

            {/* Active Switch */}
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-xs font-semibold text-white">Active Catalog Product</p>
                <p className="text-[11px] text-slate-400">Available on public storefront</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => updateField("is_active", checked)}
              />
            </div>

            {/* Featured Switch */}
            <div className="flex items-center justify-between py-1 border-t border-white/[0.04] pt-2.5">
              <div>
                <p className="text-xs font-medium text-slate-200">Featured Showcase</p>
                <p className="text-[10.5px] text-slate-400">Display on homepage curated highlights</p>
              </div>
              <Switch
                checked={formData.is_featured}
                onCheckedChange={(checked) => updateField("is_featured", checked)}
              />
            </div>

            {/* New Arrival Switch */}
            <div className="flex items-center justify-between py-1 border-t border-white/[0.04] pt-2.5">
              <div>
                <p className="text-xs font-medium text-slate-200">New Arrival Badge</p>
                <p className="text-[10.5px] text-slate-400">Display &apos;New&apos; tag across collection</p>
              </div>
              <Switch
                checked={formData.is_new_arrival}
                onCheckedChange={(checked) => updateField("is_new_arrival", checked)}
              />
            </div>

            {/* Best Seller Switch */}
            <div className="flex items-center justify-between py-1 border-t border-white/[0.04] pt-2.5">
              <div>
                <p className="text-xs font-medium text-slate-200">Best Seller Badge</p>
                <p className="text-[10.5px] text-slate-400">Highlight popularity in search filters</p>
              </div>
              <Switch
                checked={formData.is_best_seller}
                onCheckedChange={(checked) => updateField("is_best_seller", checked)}
              />
            </div>
          </div>

          {/* SIDEBAR CARD 2: ORGANIZATION & CLASSIFICATION */}
          <div className="rounded-lg border border-white/[0.08] bg-[#0c101d] p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-white/[0.06] flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span>Classification</span>
            </h3>

            {/* Category */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200">
                  Category (Root) <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsQuickCategoryOpen(true)}
                  className="text-[11px] font-medium text-[#A78BFA] hover:text-[#B9A3FF] transition flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> New
                </button>
              </div>
              <select
                value={formData.category_id}
                onChange={(e) => {
                  updateField("category_id", e.target.value);
                  updateField("subcategory_id", "");
                }}
                className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#A78BFA]/50 rounded-md px-3 py-2 text-xs text-white appearance-none outline-none cursor-pointer"
              >
                {activeRootList.map((c) => (
                  <option key={c.id} value={c.id.toString()} className="bg-[#0e121e]">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">Subcategory</label>
                <span className="text-[10px] text-slate-500 font-mono">Optional</span>
              </div>
              <select
                value={formData.subcategory_id}
                onChange={(e) => updateField("subcategory_id", e.target.value)}
                className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#A78BFA]/50 rounded-md px-3 py-2 text-xs text-white appearance-none outline-none cursor-pointer"
              >
                <option value="" className="bg-[#0e121e]">-- No Subcategory --</option>
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id.toString()} className="bg-[#0e121e]">
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200">Brand</label>
                <button
                  type="button"
                  onClick={() => setIsQuickBrandOpen(true)}
                  className="text-[11px] font-medium text-[#A78BFA] hover:text-[#B9A3FF] transition flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> New
                </button>
              </div>
              <select
                value={formData.brand_id || formData.brand}
                onChange={(e) => {
                  const val = e.target.value;
                  const matchedBrand = brands.find((b) => b.id.toString() === val || b.name === val);
                  if (matchedBrand) {
                    updateField("brand_id", matchedBrand.id.toString());
                    updateField("brand", matchedBrand.name);
                  } else {
                    updateField("brand", val);
                  }
                }}
                className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#A78BFA]/50 rounded-md px-3 py-2 text-xs text-white appearance-none outline-none cursor-pointer"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id.toString()} className="bg-[#0e121e]">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SIDEBAR CARD 3: HEALTH & COMPLETION CHECKLIST */}
          <div className="rounded-lg border border-white/[0.08] bg-[#0c101d] p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-white/[0.06] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Catalog Readiness</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Product Title:</span>
                {formData.name.trim() ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ready
                  </span>
                ) : (
                  <span className="text-rose-400 font-mono text-[11px]">Required</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">Selling Price:</span>
                {priceNum > 0 ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> ${priceNum.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-rose-400 font-mono text-[11px]">Required</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">Catalog Media:</span>
                {formData.images.length > 0 ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {formData.images.length} photo(s)
                  </span>
                ) : (
                  <span className="text-rose-400 font-mono text-[11px]">Min 1 image</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">Stock Setup:</span>
                {hasVariants ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {formData.variants.length} options ({variantStockSum} pcs)
                  </span>
                ) : parseInt(formData.stock_quantity || "0", 10) > 0 ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {formData.stock_quantity} units
                  </span>
                ) : (
                  <span className="text-amber-400 font-mono text-[11px]">0 units (OOS)</span>
                )}
              </div>
            </div>
          </div>

          {/* SIDEBAR CARD 4: INTERNAL AUDIT METADATA (EDIT MODE) */}
          {mode === "edit" && product && (
            <div className="rounded-lg border border-white/[0.08] bg-[#0c101d] p-5 space-y-2.5 text-xs text-slate-400 shadow-xs font-mono">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-white/[0.06] font-sans">
                Internal Audit Info
              </h3>
              <div className="flex justify-between">
                <span>Database ID:</span>
                <span className="text-slate-200">#{product.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Master SKU:</span>
                <span className="text-slate-200">{product.sku || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span>Created At:</span>
                <span className="text-slate-200">{product.created_at ? new Date(product.created_at).toLocaleDateString() : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className="text-slate-200">{product.updated_at ? new Date(product.updated_at).toLocaleDateString() : "—"}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* UNSAVED CHANGES MODAL */}
      <UnsavedChangesModal
        isOpen={showDiscardModal}
        onConfirmDiscard={handleConfirmDiscard}
        onCancel={() => {
          setShowDiscardModal(false);
          setPendingNavigationHref(null);
        }}
      />

      {/* MODE SWITCH CONFIRMATION MODAL */}
      <ModeSwitchConfirmationModal
        isOpen={showModeSwitchModal}
        variantsCount={formData.variants?.length || product?.variants?.length || 0}
        onConfirm={handleConfirmModeSwitchToSimple}
        onCancel={() => setShowModeSwitchModal(false)}
      />

      {/* QUICK CATEGORY MODAL */}
      {isQuickCategoryOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c101d] border border-white/10 rounded-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-sm font-semibold text-white">Create Category</h3>
              <button
                type="button"
                onClick={() => setIsQuickCategoryOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveQuickCategory} className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">
                  Category Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quickCategoryName}
                  onChange={(e) => setQuickCategoryName(e.target.value)}
                  placeholder="e.g. Mechanical Keyboards"
                  className="w-full bg-white/[0.03] border border-white/10 focus:border-[#A78BFA]/50 rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Description</label>
                <textarea
                  rows={2}
                  value={quickCategoryDescription}
                  onChange={(e) => setQuickCategoryDescription(e.target.value)}
                  placeholder="Optional category description..."
                  className="w-full bg-white/[0.03] border border-white/10 focus:border-[#A78BFA]/50 rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsQuickCategoryOpen(false)}
                  className="px-3.5 py-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 font-medium text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickCategorySaving}
                  className="px-4 py-1.5 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  {quickCategorySaving ? "Creating..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK BRAND MODAL */}
      {isQuickBrandOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c101d] border border-white/10 rounded-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-sm font-semibold text-white">Create Brand</h3>
              <button
                type="button"
                onClick={() => setIsQuickBrandOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveQuickBrand} className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">
                  Brand Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quickBrandName}
                  onChange={(e) => setQuickBrandName(e.target.value)}
                  placeholder="e.g. Apex Hardware"
                  className="w-full bg-white/[0.03] border border-white/10 focus:border-[#A78BFA]/50 rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Website</label>
                <input
                  type="url"
                  value={quickBrandWebsite}
                  onChange={(e) => setQuickBrandWebsite(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-white/[0.03] border border-white/10 focus:border-[#A78BFA]/50 rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsQuickBrandOpen(false)}
                  className="px-3.5 py-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 font-medium text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickBrandSaving}
                  className="px-4 py-1.5 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  {quickBrandSaving ? "Creating..." : "Create Brand"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
