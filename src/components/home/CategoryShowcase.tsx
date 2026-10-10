"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Headphones, 
  Keyboard, 
  Briefcase, 
  Sparkles, 
  Watch,
  Layers,
  Flame,
  Trophy
} from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious,
  type CarouselApi
} from "@/components/ui/carousel";
import { Banner, Category, Product, HomepageSection } from "@/types";
import { api } from "@/lib/api";
import { STOREFRONT_CONFIG } from "@/config/storefrontConfig";
import { BottomBannerCarousel } from "./BottomBannerCarousel";
import { HomepageProductSection } from "./HomepageProductSection";

const ICON_MAP: Record<string, any> = {
  "disposable": Sparkles,
  "disposable-1": Sparkles,
  "devices": Layers,
  "devices-1": Layers,
  "nicsalt-juice": Flame,
  "nicsalt-juice-1": Flame,
  "freebase-juice": Trophy,
};

interface CategorySectionData {
  category: Category;
  products: Product[];
}

interface CategoryShowcaseProps {
  categories?: Category[];
  bottomBanners?: Banner[];
}

type FilterTab = "featured" | "new" | "bestsellers";

function SingleCategoryRow({ section }: { section: CategorySectionData }) {
  const [activeTab, setActiveTab] = useState<FilterTab>("featured");
  const [apiInstance, setApiInstance] = useState<CarouselApi>();
  const isHoveredRef = useRef(false);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoplay = useCallback(() => {
    if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    autoplayTimerRef.current = setInterval(() => {
      if (!isHoveredRef.current && apiInstance) {
        if (apiInstance.canScrollNext()) {
          apiInstance.scrollNext();
        } else {
          apiInstance.scrollTo(0);
        }
      }
    }, 5500);
  }, [apiInstance]);

  const resetAutoplay = useCallback(() => {
    startAutoplay();
  }, [startAutoplay]);

  useEffect(() => {
    if (!apiInstance) return;
    startAutoplay();
    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, [apiInstance, startAutoplay]);

  const handleMouseEnter = () => {
    isHoveredRef.current = true;
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    resetAutoplay();
  };

  // Filter products based on selected tab and limit to max 14 products
  let displayProducts = section.products;
  if (activeTab === "new") {
    const filtered = section.products.filter((p) => p.is_new_arrival);
    if (filtered.length > 0) displayProducts = filtered;
  } else if (activeTab === "bestsellers") {
    const filtered = section.products.filter((p) => p.is_best_seller);
    if (filtered.length > 0) displayProducts = filtered;
  } else {
    const filtered = section.products.filter((p) => p.is_featured);
    if (filtered.length > 0) displayProducts = filtered;
  }

  const limitedProducts = displayProducts.slice(0, 14);

  const Icon = ICON_MAP[section.category.slug] || Layers;

  if (!section.products || section.products.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      {/* Category Section Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider mb-1.5 border"
            style={{
              backgroundColor: "color-mix(in srgb, var(--theme-primary, #006B45) 12%, transparent)",
              borderColor: "color-mix(in srgb, var(--theme-primary, #006B45) 30%, transparent)",
              color: "var(--theme-primary, #006B45)",
            }}
          >
            <Icon className="w-3 h-3" style={{ color: "var(--theme-primary, #006B45)" }} />
            <span>{section.category.badge || section.category.name}</span>
          </div>

          <h2
            className="text-xl sm:text-2xl font-black tracking-tight"
            style={{ color: "var(--theme-text-heading, #0f172a)" }}
          >
            {section.category.name}
          </h2>

          {section.category.description && (
            <p
              className="text-xs max-w-xl mt-1 leading-relaxed line-clamp-1 sm:line-clamp-2"
              style={{ color: "var(--theme-text-body, #64748b)" }}
            >
              {section.category.description}
            </p>
          )}
        </div>

        {/* Right Controls: Filter Pills */}
        <div className="flex theme-tab-container rounded-md p-1 border self-start sm:self-auto gap-1">
          <button
            onClick={() => {
              setActiveTab("featured");
              resetAutoplay();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === "featured"
                ? "theme-tab-pill-active"
                : "theme-tab-pill-inactive"
            }`}
          >
            <Sparkles className="w-3 h-3" /> Featured
          </button>

          <button
            onClick={() => {
              setActiveTab("new");
              resetAutoplay();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === "new"
                ? "theme-tab-pill-active"
                : "theme-tab-pill-inactive"
            }`}
          >
            <Flame className="w-3 h-3" /> New Arrivals
          </button>

          <button
            onClick={() => {
              setActiveTab("bestsellers");
              resetAutoplay();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === "bestsellers"
                ? "theme-tab-pill-active"
                : "theme-tab-pill-inactive"
            }`}
          >
            <Trophy className="w-3 h-3" /> Best Sellers
          </button>
        </div>
      </div>

      {/* Product Carousel with Pause on Hover */}
      <Carousel
        setApi={setApiInstance}
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full relative group/carousel"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative">
          <CarouselContent className="-ml-3 sm:-ml-3.5">
            {limitedProducts.map((product) => (
              <CarouselItem
                key={product.id}
                className="pl-3 sm:pl-3.5 basis-[160px] min-[380px]:basis-[180px] sm:basis-[220px] md:basis-[230px] lg:basis-[240px]"
              >
                <ProductCard product={product} />
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Left Navigation Button */}
          <CarouselPrevious
            onClick={resetAutoplay}
            className="-left-3 sm:-left-5 w-10 h-10"
          />

          {/* Right Navigation Button */}
          <CarouselNext
            onClick={resetAutoplay}
            className="-right-3 sm:-right-5 w-10 h-10"
          />
        </div>
      </Carousel>

      {/* Compact View All Button Below Carousel */}
      <div className="text-center pt-3 pb-2 sm:pt-5 sm:pb-3">
        <Link
          href={`/category/${section.category.slug}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md theme-btn-secondary theme-view-all-btn text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:scale-[1.02]"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}

export function CategoryShowcase({ categories = [], bottomBanners = [] }: CategoryShowcaseProps) {
  const [dynamicSections, setDynamicSections] = useState<HomepageSection[]>([]);
  const [fallbackSections, setFallbackSections] = useState<CategorySectionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSections() {
      try {
        setLoading(true);
        // 1. Try to fetch dynamic homepage sections from database/API
        const sectionsData = await api.getHomepageSections().catch(() => []);

        if (isMounted && sectionsData && sectionsData.length > 0) {
          setDynamicSections(sectionsData);
          setLoading(false);
          return;
        }

        // 2. Fallback to category list if no dynamic sections configured yet
        let catList = categories;
        if (!catList || (Array.isArray(catList) && catList.length === 0)) {
          catList = await api.getCategories();
        }

        const safeCategoryList: Category[] = Array.isArray(catList)
          ? catList
          : catList && typeof catList === "object"
            ? Array.isArray((catList as any).data)
              ? (catList as any).data
              : Object.values(catList).filter((item): item is Category => Boolean(item && typeof item === "object" && "id" in item))
            : [];

        const validCatList = safeCategoryList.filter(
          (c) => c && c.slug && !c.slug.includes("test")
        );

        const sectionPromises = validCatList.map(async (cat) => {
          try {
            const res = await api.getProducts({ 
              category: cat.slug,
              per_page: 14 
            });
            return {
              category: cat,
              products: res.data || [],
            };
          } catch {
            return {
              category: cat,
              products: [],
            };
          }
        });

        const results = await Promise.all(sectionPromises);
        if (isMounted) {
          setFallbackSections(results.filter((s) => s.products.length > 0));
        }
      } catch (err) {
        console.warn("Notice: Category sections fetch fallback:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSections();

    return () => {
      isMounted = false;
    };
  }, [categories]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 py-4">
        {[1, 2].map((i) => (
          <div key={i} className="space-y-4">
            <div className="space-y-2">
              <div className="w-28 h-4 rounded-md bg-white/10 animate-pulse" />
              <div className="w-64 h-6 rounded-md bg-white/10 animate-pulse" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="h-64 rounded-lg bg-white/[0.02] border border-white/5 animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Render Dynamic Sections (Database-backed)
  if (dynamicSections.length > 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {dynamicSections.map((section, idx) => {
          const isTarget = STOREFRONT_CONFIG.SHOW_BOTTOM_PROMOTION && idx === Math.min(2, dynamicSections.length - 1);

          return (
            <div key={section.id} className="space-y-16">
              {isTarget && bottomBanners.length > 0 && (
                <BottomBannerCarousel banners={bottomBanners} />
              )}
              <HomepageProductSection section={section} />
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback to static category sections if dynamic sections not available
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      {fallbackSections.map((section, idx) => {
        const isTarget = STOREFRONT_CONFIG.SHOW_BOTTOM_PROMOTION && idx === Math.min(2, fallbackSections.length - 1);

        return (
          <div key={section.category.id} className="space-y-16">
            {isTarget && bottomBanners.length > 0 && (
              <BottomBannerCarousel banners={bottomBanners} />
            )}
            <SingleCategoryRow section={section} />
          </div>
        );
      })}
    </div>
  );
}
