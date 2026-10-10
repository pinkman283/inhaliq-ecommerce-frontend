"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Star, 
  ShoppingBag, 
  Heart, 
  Truck, 
  ChevronRight, 
  Zap, 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { Product, ProductVariant } from "@/types";
import { formatPrice } from "@/lib/utils";
import { ProductGallery } from "@/components/product/ProductGallery";
import { VariantPicker } from "@/components/product/VariantPicker";
import { ReviewSummary } from "@/components/product/ReviewSummary";
import { ProductCard } from "@/components/product/ProductCard";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useThemeStore } from "@/store/useThemeStore";
import { trackViewContent } from "@/lib/metaPixel";
import { toast } from "sonner";

interface ProductDetailClientProps {
  slug: string;
  initialProduct?: Product | null;
}

export default function ProductDetailClient({ slug, initialProduct }: ProductDetailClientProps) {
  const router = useRouter();
  const { theme } = useThemeStore();

  const [product, setProduct] = useState<Product | null>(initialProduct || null);
  const [related, setRelated] = useState<Product[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [hasVariantError, setHasVariantError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState("1");
  const [loading, setLoading] = useState(!initialProduct);

  // Ref for primary action area to trigger sticky mobile CTA only when scrolled past
  const primaryActionsRef = useRef<HTMLDivElement | null>(null);
  const variantPickerRef = useRef<HTMLDivElement | null>(null);
  const [showStickyCta, setShowStickyCta] = useState(false);

  const { addItem } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();

  useEffect(() => {
    async function loadProductData() {
      if (!initialProduct) {
        setLoading(true);
      }
      try {
        const data = await api.getProduct(slug);
        setProduct(data.product);
        setRelated(data.related || []);
        
        // Pre-select first in-stock variant or first variant
        if (data.product.variants && data.product.variants.length > 0) {
          const firstInStock = data.product.variants.find((v) => Number(v.stock_quantity) > 0) || data.product.variants[0];
          setSelectedVariant(firstInStock);
          if (firstInStock.color_name) setSelectedColor(firstInStock.color_name);
          if (firstInStock.size) setSelectedSize(firstInStock.size);
        } else {
          setSelectedVariant(null);
        }

        // Track Meta Pixel ViewContent event
        trackViewContent({
          id: data.product.id,
          name: data.product.name,
          category: data.product.category?.name,
          price: Number(data.product.price || 0),
          currency: "USD",
          eventId: (data as any).event_id,
        });
      } catch (err) {
        console.error("Failed to load product:", err);
        if (initialProduct) {
          trackViewContent({
            id: initialProduct.id,
            name: initialProduct.name,
            category: initialProduct.category?.name,
            price: Number(initialProduct.price || 0),
            currency: "USD",
          });
        }
      } finally {
        setLoading(false);
      }
    }
    loadProductData();
  }, [slug, initialProduct]);

  // Scroll listener / Intersection Observer for sticky mobile CTA
  useEffect(() => {
    const target = primaryActionsRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when the primary CTA is NOT intersecting (scrolled out of view)
        // and user has scrolled below it
        const isBelow = entry.boundingClientRect.top < 0;
        setShowStickyCta(!entry.isIntersecting && isBelow);
      },
      {
        root: null,
        threshold: 0.1,
        rootMargin: "-40px 0px 0px 0px",
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [product, loading]);

  if (loading) {
    return (
      <div className="py-32 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <div 
          className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--theme-primary, #005826)", borderTopColor: "transparent" }}
        />
        <span 
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--theme-text-body, #64748b)" }}
        >
          Loading Product Details...
        </span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-32 text-center space-y-4">
        <h2 
          className="text-2xl font-black tracking-tight"
          style={{ color: "var(--theme-text-heading, #0f172a)" }}
        >
          Product Not Found
        </h2>
        <p 
          className="text-xs"
          style={{ color: "var(--theme-text-body, #64748b)" }}
        >
          The hardware item you are looking for does not exist or has been retired.
        </p>
        <Link 
          href="/products" 
          className="inline-block px-6 py-2.5 rounded-md theme-btn-primary text-xs font-bold"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  const currentPrice = Number(product.price) + (selectedVariant ? Number(selectedVariant.price_modifier) : 0);
  const inWishlist = isInWishlist(product.id);
  const availableStock = (selectedVariant && selectedVariant.stock_quantity !== undefined)
    ? Number(selectedVariant.stock_quantity)
    : (product.stock_quantity !== undefined ? Number(product.stock_quantity) : 9999);
  const isOutOfStock = availableStock <= 0;
  const isStockExceeded = quantity > availableStock;

  // Phase 3H: Variant/Color-aware storefront gallery resolution
  // 1. If a color is selected and images exist for that color -> show color-specific images
  // 2. Fall back to general product images (color_name is null/empty)
  // 3. Fall back to all product images so the gallery is never empty
  const activeColor = selectedColor || selectedVariant?.color_name || null;
  const galleryImages = (() => {
    if (!product.images || product.images.length === 0) {
      return [];
    }
    if (activeColor) {
      const normalizedColor = activeColor.trim().toLowerCase();
      const colorImages = product.images.filter(
        (img) => img.color_name && img.color_name.trim().toLowerCase() === normalizedColor
      );
      if (colorImages.length > 0) {
        return colorImages;
      }
    }
    const generalImages = product.images.filter(
      (img) => !img.color_name || img.color_name.trim() === ""
    );
    if (generalImages.length > 0) {
      return generalImages;
    }
    return product.images;
  })();

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/\D/g, "");
    setQuantityInput(sanitized);
    if (sanitized === "") {
      setQuantity(0);
    } else {
      const parsed = parseInt(sanitized, 10);
      setQuantity(isNaN(parsed) ? 0 : parsed);
    }
  };

  const handleQuantityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End", "Enter"].includes(e.key)) {
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      return;
    }
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleQuantityBlur = () => {
    if (quantityInput === "" || isNaN(parseInt(quantityInput, 10))) {
      setQuantity(1);
      setQuantityInput("1");
    } else {
      const parsed = parseInt(quantityInput, 10);
      setQuantity(parsed);
      setQuantityInput(String(parsed));
    }
  };

  const handleIncreaseQuantity = () => {
    if (quantity < availableStock) {
      const next = quantity + 1;
      setQuantity(next);
      setQuantityInput(String(next));
    }
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 0) {
      const next = quantity - 1;
      setQuantity(next);
      setQuantityInput(String(next));
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error("This product is currently out of stock.");
      return;
    }
    if (quantity <= 0) {
      toast.error("Please specify a quantity of at least 1.");
      return;
    }
    if (isStockExceeded) {
      toast.error(`Not enough stock available. Maximum available is ${availableStock}.`);
      return;
    }
    if (product.variants && product.variants.length > 1 && !selectedVariant) {
      setHasVariantError(true);
      if (variantPickerRef.current) {
        variantPickerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      toast.error("Please select a color finish before adding to cart.");
      return;
    }
    setHasVariantError(false);
    const result = addItem(product, selectedVariant, quantity);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    if (result.message && result.message.includes("maximum available stock")) {
      toast.warning(result.message);
    } else {
      toast.success(`Added ${result.addedQuantity ?? quantity}x ${product.name}${selectedVariant ? ` (${selectedVariant.name})` : ""} to cart`);
    }
  };

  const handleBuyNow = () => {
    if (isOutOfStock) {
      toast.error("This product is currently out of stock.");
      return;
    }
    if (quantity <= 0) {
      toast.error("Please specify a quantity of at least 1.");
      return;
    }
    if (isStockExceeded) {
      toast.error(`Not enough stock available. Maximum available is ${availableStock}.`);
      return;
    }
    if (product.variants && product.variants.length > 1 && !selectedVariant) {
      setHasVariantError(true);
      if (variantPickerRef.current) {
        variantPickerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      toast.error("Please select a color finish before proceeding to checkout.");
      return;
    }
    setHasVariantError(false);
    const result = addItem(product, selectedVariant, quantity);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    router.push("/checkout");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 sm:space-y-10">
      {/* Minimalist Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 overflow-x-auto whitespace-nowrap pb-1">
        <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-40" />
        <Link href="/products" className="hover:text-slate-900 dark:hover:text-white transition-colors">Catalog</Link>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-40" />
            <Link 
              href={`/products?category=${product.category.slug}`} 
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-40" />
        <span 
          className="font-semibold truncate max-w-xs"
          style={{ color: "var(--theme-text-heading, #0f172a)" }}
        >
          {product.name}
        </span>
      </nav>

      {/* Main Product Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-6 max-w-[530px] w-full mx-auto lg:mx-0">
          <ProductGallery key={activeColor || "default"} images={galleryImages} productName={product.name} />
        </div>

        {/* Right Info & Actions Panel */}
        <div className="lg:col-span-6 space-y-4 sm:space-y-5">
          <div className="space-y-2">
            {/* 1. Pill Badge */}
            <div>
              <span 
                className="inline-flex items-center px-2.5 py-1 rounded-md text-[10.5px] font-bold tracking-wider uppercase shadow-2xs"
                style={{
                  backgroundColor: "var(--theme-view-all-color, var(--theme-tab-active-bg, var(--theme-primary, #005826)))",
                  color: "var(--theme-btn-primary-text, #ffffff)"
                }}
              >
                {product.is_new_arrival ? "NEW ARRIVAL" : (product.is_best_seller ? "BEST SELLER" : (product.category?.name || "NEW ARRIVAL"))}
              </span>
            </div>

            {/* 2. Product Title */}
            <h1 
              className="text-2xl sm:text-3xl lg:text-4xl font-normal sm:font-medium tracking-tight text-slate-900 dark:text-white leading-tight"
              style={{ color: "var(--theme-text-heading, #0f172a)" }}
            >
              {product.name}
            </h1>

            {/* 3. Ratings Bar */}
            {theme.reviews_enabled !== false && (
              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs sm:text-sm">
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < Math.round(product.rating_average || 5) ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}`} 
                    />
                  ))}
                  <span className="font-bold text-slate-800 dark:text-slate-200 ml-1.5">
                    ({Number(product.rating_average || 5).toFixed(1)})
                  </span>
                </div>

                {product.review_count !== undefined && product.review_count > 0 && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <a 
                      href="#reviews-section" 
                      className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      {product.review_count} {product.review_count === 1 ? "review" : "reviews"}
                    </a>
                  </>
                )}
              </div>
            )}

            {/* 4. Price Display */}
            <div className="pt-2 pb-1 flex items-baseline gap-3">
              <span 
                className="text-3xl sm:text-4xl font-semibold tracking-tight"
                style={{ color: "var(--theme-text-heading, #0f172a)" }}
              >
                {formatPrice(currentPrice)}
              </span>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span className="text-base text-slate-400 line-through font-normal">
                  {formatPrice(product.compare_at_price)}
                </span>
              )}
            </div>
          </div>

          {/* 5. SELECT COLOR & SELECT SIZE */}
          {product.variants && product.variants.length > 0 && (
            <div ref={variantPickerRef}>
              <VariantPicker
                variants={product.variants}
                selectedVariant={selectedVariant}
                selectedColor={selectedColor}
                onSelectColor={setSelectedColor}
                selectedSize={selectedSize}
                onSelectSize={setSelectedSize}
                availableStock={availableStock}
                hasError={hasVariantError}
                onSelectVariant={(v) => {
                  setSelectedVariant(v);
                  if (v) {
                    if (v.color_name) setSelectedColor(v.color_name);
                    if (v.size) setSelectedSize(v.size);
                  }
                  setHasVariantError(false);
                }}
              />
            </div>
          )}

          {/* 6. Action Row: Quantity + Add to Cart + Wishlist (Observed by Sticky Mobile CTA) */}
          <div ref={primaryActionsRef} className="space-y-3 pt-2">
            <div className="flex items-start gap-2.5">
              {/* Quantity Selector */}
              <div className="flex flex-col items-center">
                <div 
                  className={`flex items-center rounded-md p-1 shrink-0 transition-colors shadow-2xs ${
                    isOutOfStock ? "opacity-50 pointer-events-none" : ""
                  } ${
                    isStockExceeded ? "border border-rose-500 ring-1 ring-rose-500/20" : "border border-gray-200 dark:border-white/10"
                  }`}
                  style={{
                    backgroundColor: "#ffffff",
                  }}
                >
                  <button
                    type="button"
                    disabled={isOutOfStock || quantity <= 0}
                    onClick={handleDecreaseQuantity}
                    className="w-8 h-8 rounded-md border-0 hover:bg-gray-100 font-bold text-sm flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-transparent"
                    style={{ color: "#0f172a" }}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={quantityInput}
                    onChange={handleQuantityInputChange}
                    onKeyDown={handleQuantityKeyDown}
                    onBlur={handleQuantityBlur}
                    disabled={isOutOfStock}
                    aria-label="Product quantity"
                    className="quantity-counter-input w-10 text-center text-xs font-black bg-white select-all appearance-none"
                    style={{ 
                      backgroundColor: "#ffffff",
                      border: "0",
                      borderWidth: "0",
                      outline: "none",
                      boxShadow: "none",
                      color: isStockExceeded ? "#f43f5e" : "#0f172a" 
                    }}
                  />
                  <button
                    type="button"
                    disabled={isOutOfStock || quantity >= availableStock}
                    onClick={handleIncreaseQuantity}
                    className="w-8 h-8 rounded-md border-0 hover:bg-gray-100 font-bold text-sm flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-transparent"
                    style={{ color: "#0f172a" }}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                {isStockExceeded && (
                  <span className="text-[10.5px] font-bold text-rose-500 dark:text-rose-400 mt-1 whitespace-nowrap animate-in fade-in slide-in-from-top-1">
                    not enough stock
                  </span>
                )}
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                disabled={isOutOfStock || quantity <= 0 || isStockExceeded}
                onClick={handleAddToCart}
                className={`flex-1 py-3 px-4 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer border ${
                  isOutOfStock || quantity <= 0 || isStockExceeded
                    ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-white/5 text-slate-400 border-gray-200 dark:border-white/10"
                    : "bg-white hover:bg-gray-50 active:bg-gray-100 text-slate-900 border-gray-300 dark:border-gray-200 shadow-sm active:scale-95"
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-slate-900" /> 
                <span className="text-slate-900 font-extrabold">{isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
              </button>

              {/* Wishlist Heart Button */}
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                className={`p-3 rounded-md border transition-all cursor-pointer flex items-center justify-center ${
                  inWishlist
                    ? "text-white shadow-sm shadow-[#fb2c5c]/25 hover:opacity-90 active:scale-95"
                    : "hover:border-[#fb2c5c] text-slate-400 hover:text-[#fb2c5c]"
                }`}
                style={{
                  backgroundColor: inWishlist ? "#fb2c5c" : "var(--theme-card-bg, #ffffff)",
                  borderColor: inWishlist ? "#fb2c5c" : "var(--theme-card-border, #e5e7eb)"
                }}
                aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className={`w-4 h-4 ${inWishlist ? "fill-white text-white" : ""}`} />
              </button>
            </div>

            {/* Instant Buy Now Button */}
            <button
              type="button"
              disabled={isOutOfStock || quantity <= 0 || isStockExceeded}
              onClick={handleBuyNow}
              className={`w-full py-3 px-6 rounded-md text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
                isOutOfStock || quantity <= 0 || isStockExceeded
                  ? "opacity-50 cursor-not-allowed bg-gray-200 dark:bg-white/5 text-slate-400"
                  : "theme-btn-primary hover:opacity-95 hover:scale-[1.005] active:scale-95"
              }`}
            >
              <Zap className="w-4 h-4" /> 
              <span>{isOutOfStock ? "Out of Stock" : "Instant Checkout"}</span>
            </button>
          </div>

          {/* Delivery & Shipping Information Card */}
          <div 
            className="p-4 rounded-2xl border space-y-3 shadow-2xs"
            style={{
              backgroundColor: "var(--theme-card-bg, #ffffff)",
              borderColor: "var(--theme-card-border, #e5e7eb)"
            }}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 dark:border-white/5">
              <span 
                className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                style={{ color: "var(--theme-text-heading, #0f172a)" }}
              >
                <Truck 
                  className="w-4 h-4" 
                  style={{ color: "var(--theme-view-all-color, var(--theme-tab-active-bg, var(--theme-primary, #005826)))" }} 
                /> 
                Delivery Options
              </span>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                Cash on Delivery (COD)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 flex items-center justify-between">
                <div>
                  <span 
                    className="font-bold block"
                    style={{ color: "var(--theme-text-heading, #0f172a)" }}
                  >
                    Inside Dhaka
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    24 – 48 Hours Express
                  </span>
                </div>
                <span 
                  className="font-black font-mono"
                  style={{ color: "var(--theme-primary, #005826)" }}
                >
                  {formatPrice(theme.shipping_inside_dhaka_rate || 60)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 flex items-center justify-between">
                <div>
                  <span 
                    className="font-bold block"
                    style={{ color: "var(--theme-text-heading, #0f172a)" }}
                  >
                    Outside Dhaka
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    2 – 3 Working Days
                  </span>
                </div>
                <span 
                  className="font-black font-mono"
                  style={{ color: "var(--theme-primary, #005826)" }}
                >
                  {formatPrice(theme.shipping_outside_dhaka_rate || 120)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Technical Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 border-t border-gray-200 dark:border-white/10">
        
        {/* Left: Product Description */}
        <div className="lg:col-span-7 space-y-3">
          <h2 
            className="text-lg sm:text-xl font-black tracking-tight"
            style={{ color: "var(--theme-text-heading, #0f172a)" }}
          >
            Product Description
          </h2>
          <div 
            className="text-xs sm:text-sm leading-relaxed space-y-3 whitespace-pre-line"
            style={{ color: "var(--theme-text-body, #475569)" }}
          >
            <p>{product.description}</p>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-4">
              {product.tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-lg text-[10.5px] font-semibold border"
                  style={{
                    backgroundColor: "var(--theme-card-bg, #ffffff)",
                    borderColor: "var(--theme-card-border, #e5e7eb)",
                    color: "var(--theme-text-body, #475569)"
                  }}
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: Technical Specifications */}
        <div className="lg:col-span-5 space-y-3">
          <h2 
            className="text-lg sm:text-xl font-black tracking-tight"
            style={{ color: "var(--theme-text-heading, #0f172a)" }}
          >
            Technical Specifications
          </h2>
          <div 
            className="rounded-2xl border overflow-hidden divide-y divide-gray-100 dark:divide-white/5 text-xs shadow-2xs"
            style={{
              backgroundColor: "var(--theme-card-bg, #ffffff)",
              borderColor: "var(--theme-card-border, #e5e7eb)"
            }}
          >
            <div className="flex justify-between p-3.5">
              <span className="text-slate-500 dark:text-slate-400">SKU</span>
              <span 
                className="font-mono font-bold"
                style={{ color: "var(--theme-text-heading, #0f172a)" }}
              >
                {product.sku || "N/A"}
              </span>
            </div>
            <div className="flex justify-between p-3.5">
              <span className="text-slate-500 dark:text-slate-400">Brand</span>
              <span 
                className="font-bold"
                style={{ color: "var(--theme-text-heading, #0f172a)" }}
              >
                {product.brand || theme.store_brand_name || "AETHER"}
              </span>
            </div>
            {product.specifications &&
              Object.entries(product.specifications).map(([key, val]) => (
                <div key={key} className="flex justify-between p-3.5">
                  <span className="text-slate-500 dark:text-slate-400">{key}</span>
                  <span 
                    className="font-medium text-right"
                    style={{ color: "var(--theme-text-heading, #0f172a)" }}
                  >
                    {val}
                  </span>
                </div>
              ))}
          </div>
        </div>

      </div>

      {/* Product Video Demonstration (Senior Capability) */}
      {(() => {
        const videoUrl = typeof product.video === "string"
          ? product.video
          : (product.video?.embed_url || product.video?.url || product.video?.raw || "");
        if (!videoUrl) return null;

        const isYouTube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
        const embedSrc = isYouTube
          ? (videoUrl.includes("embed")
              ? videoUrl
              : `https://www.youtube.com/embed/${
                  videoUrl.match(/(?:youtu\.be\/|watch\?v=)([\w-]+)/)?.[1] || ""
                }`)
          : videoUrl;

        return (
          <div className="pt-8 border-t border-gray-200 dark:border-white/10 space-y-4">
            <div>
              <span 
                className="text-xs font-black uppercase tracking-widest block mb-1"
                style={{ color: "var(--theme-view-all-color, var(--theme-tab-active-bg, var(--theme-primary, #005826)))" }}
              >
                Visual Showcase
              </span>
              <h2 
                className="text-lg sm:text-xl font-black tracking-tight"
                style={{ color: "var(--theme-text-heading, #0f172a)" }}
              >
                Product Demonstration Video
              </h2>
            </div>
            <div className="aspect-video w-full max-w-3xl rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 bg-black/5 shadow-md">
              {isYouTube ? (
                <iframe
                  src={embedSrc}
                  title={`${product.name} Video Demonstration`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        );
      })()}

      {/* Reviews Section */}
      {theme.reviews_enabled !== false && (
        <div id="reviews-section">
          <ReviewSummary
            productId={product.id}
            ratingAverage={product.rating_average}
            reviewCount={product.review_count}
            reviews={product.reviews}
          />
        </div>
      )}

      {/* Frequently Paired Gear Grid */}
      {related.length > 0 && (
        <div className="pt-10 border-t border-gray-200 dark:border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <h2 
              className="text-xl sm:text-2xl font-black tracking-tight"
              style={{ color: "var(--theme-text-heading, #0f172a)" }}
            >
              Frequently Paired Gear
            </h2>
            <Link 
              href="/products" 
              className="text-xs font-bold theme-view-all-text hover:underline transition-colors"
            >
              View Entire Collection →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Mobile Sticky Add-to-Cart Action Bar (Only shows when scrolled past primary CTA) */}
      <AnimatePresence>
        {showStickyCta && (
          <motion.div 
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="lg:hidden fixed bottom-14 sm:bottom-0 inset-x-0 z-40 p-2.5 sm:p-3 border-t flex items-center justify-between gap-2 shadow-2xl backdrop-blur-xl"
            style={{
              backgroundColor: "var(--theme-card-bg, #ffffff)",
              borderColor: "var(--theme-card-border, #e5e7eb)"
            }}
          >
            <div className="min-w-0 flex-1">
              <span 
                className="text-[10px] block truncate font-medium"
                style={{ color: "var(--theme-text-body, #64748b)" }}
              >
                {product.name}
              </span>
              <span 
                className="text-sm font-black"
                style={{ color: "var(--theme-primary, #005826)" }}
              >
                {formatPrice(currentPrice)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={isOutOfStock || quantity <= 0 || isStockExceeded}
                onClick={handleAddToCart}
                className={`px-3 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 border ${
                  isOutOfStock || quantity <= 0 || isStockExceeded
                    ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-white/5 text-slate-400 border-gray-200 dark:border-white/10"
                    : "bg-white hover:bg-gray-50 active:bg-gray-100 text-slate-900 border-gray-300 dark:border-gray-200 shadow-xs cursor-pointer active:scale-95"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-slate-900" /> 
                <span className="text-slate-900 font-extrabold">Cart</span>
              </button>
              <button
                type="button"
                disabled={isOutOfStock || quantity <= 0 || isStockExceeded}
                onClick={handleBuyNow}
                className={`px-3.5 py-2 rounded-md text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                  isOutOfStock || quantity <= 0 || isStockExceeded
                    ? "opacity-50 cursor-not-allowed bg-gray-200 dark:bg-white/5 text-slate-400"
                    : "theme-btn-primary cursor-pointer shadow-md active:scale-95"
                }`}
              >
                <Zap className="w-3.5 h-3.5" /> Buy Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* JSON-LD Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            image: product.images?.map((i) => i.image_url) || [],
            description: product.short_description || product.description,
            sku: product.sku || `AETH-${product.id}`,
            brand: {
              "@type": "Brand",
              name: product.brand || theme.store_brand_name || "AETHER",
            },
            offers: {
              "@type": "Offer",
              priceCurrency: "USD",
              price: product.price,
              availability: isOutOfStock
                ? "https://schema.org/OutOfStock"
                : "https://schema.org/InStock",
            },
            ...(theme.reviews_enabled !== false && product.rating_average && product.review_count
              ? {
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: product.rating_average,
                    reviewCount: product.review_count,
                  },
                }
              : {}),
          }),
        }}
      />
    </div>
  );
}
