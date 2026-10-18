"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  Trophy,
  Zap,
  Boxes,
  Package,
  ShieldCheck,
  Tag,
  Star
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
import { HomepageSection, Product } from "@/types";
import { api } from "@/lib/api";

const ICON_MAP: Record<string, any> = {
  Headphones,
  Keyboard,
  Briefcase,
  Sparkles,
  Watch,
  Layers,
  Flame,
  Trophy,
  Zap,
  Boxes,
  Package,
  ShieldCheck,
  Tag,
  Star,
};

interface HomepageProductSectionProps {
  section: HomepageSection;
}

export function HomepageProductSection({ section }: HomepageProductSectionProps) {
  const tabs = section.tabs || [];
  const hasTabs = section.has_tabs && tabs.length > 0;

  const [activeTabId, setActiveTabId] = useState<string>(
    hasTabs ? tabs[0].id : ""
  );
  const [tabProductsMap, setTabProductsMap] = useState<Record<string, Product[]>>(() => {
    const map: Record<string, Product[]> = {};
    if (hasTabs) {
      tabs.forEach((tab) => {
        if (tab.products && tab.products.length > 0) {
          map[tab.id] = tab.products;
        }
      });
    }
    return map;
  });

  const [loadingTab, setLoadingTab] = useState(false);
  const [apiInstance, setApiInstance] = useState<CarouselApi>();
  const isHoveredRef = useRef(false);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Determine current products to display
  let currentProducts: Product[] = [];
  if (hasTabs) {
    currentProducts = tabProductsMap[activeTabId] || [];
  } else {
    currentProducts = section.products || [];
  }

  // Handle on-demand tab loading if products weren't preloaded
  const handleTabClick = async (tabId: string) => {
    setActiveTabId(tabId);
    if (!tabProductsMap[tabId] || tabProductsMap[tabId].length === 0) {
      try {
        setLoadingTab(true);
        const products = await api.getSectionTabProducts(section.id, tabId);
        setTabProductsMap((prev) => ({
          ...prev,
          [tabId]: products,
        }));
      } catch (err) {
        console.warn("Notice: Tab products fetch fallback:", err);
      } finally {
        setLoadingTab(false);
      }
    }
  };

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

  const Icon = ICON_MAP[section.badge_icon || ""] || Layers;
  const viewAllUrl = section.view_all_url || (section.category?.slug ? `/category/${section.category.slug}` : `/products`);
  const viewAllLabel = section.view_all_label || "View All";

  if (!section.is_active || (currentProducts.length === 0 && !loadingTab)) {
    return null;
  }

  return (
    <section className="space-y-6">
      {/* Section Header & Optional Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          {section.badge_text && (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider mb-2 border border-slate-200/90 bg-slate-100 text-slate-700 shadow-2xs"
            >
              <Icon className="w-3 h-3 text-slate-500" />
              <span>{section.badge_text}</span>
            </div>
          )}

          <h2
            className="text-xl sm:text-2xl font-black tracking-tight"
            style={{ color: "var(--theme-text-heading, #0f172a)" }}
          >
            {section.title}
          </h2>

          {section.subtitle && (
            <p
              className="text-xs max-w-xl mt-1 leading-relaxed line-clamp-1 sm:line-clamp-2"
              style={{ color: "var(--theme-text-body, #64748b)" }}
            >
              {section.subtitle}
            </p>
          )}
        </div>

        {/* Right Controls: Dynamic Tabs */}
        {hasTabs && (
          <div className="flex theme-tab-container rounded-md p-1 border self-start sm:self-auto gap-1 overflow-x-auto no-scrollbar max-w-full">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    handleTabClick(tab.id);
                    resetAutoplay();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? "theme-tab-pill-active"
                      : "theme-tab-pill-inactive"
                  }`}
                >
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Carousel */}
      {loadingTab ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 py-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-white/[0.03] border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
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
              {currentProducts.map((product) => (
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
      )}

      {/* View All Button Below Carousel */}
      {viewAllUrl && (
        <div className="text-center pt-3 pb-2 sm:pt-5 sm:pb-3">
          <Link
            href={viewAllUrl}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md theme-btn-secondary theme-view-all-btn text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:scale-[1.02]"
          >
            <span>{viewAllLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </section>
  );
}
