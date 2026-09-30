"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Headphones, 
  Flame, 
  Layers, 
  Cpu, 
  Zap 
} from "lucide-react";
import { HeroSection } from "@/components/home/HeroSection";
import { ExploreCategoriesSection } from "@/components/home/ExploreCategoriesSection";
import { TrustRibbon } from "@/components/home/TrustRibbon";
import { FlashSaleSection } from "@/components/home/FlashSaleSection";
import { FeaturedGrid } from "@/components/home/FeaturedGrid";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { api } from "@/lib/api";
import { Banner, Category, Product } from "@/types";
import { formatPrice } from "@/lib/utils";

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bottomBanners, setBottomBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStoreData() {
      try {
        const [data, bannerData, catData] = await Promise.all([
          api.getFeatured(),
          api.getHomepageBanners().catch(() => null),
          api.getCategories().catch(() => []),
        ]);
        setFeaturedProducts(Array.isArray(data?.featured_products) ? data.featured_products : []);
        setNewArrivals(Array.isArray(data?.new_arrivals) ? data.new_arrivals : []);
        setBestSellers(Array.isArray(data?.best_sellers) ? data.best_sellers : []);

        const rawCats = (data?.featured_categories && (data.featured_categories as any[]).length > 0)
          ? data.featured_categories
          : (Array.isArray(catData) && catData.length > 0)
          ? catData
          : (data as any)?.categories;

        const safeCats = Array.isArray(rawCats)
          ? rawCats
          : rawCats && typeof rawCats === "object"
            ? Array.isArray((rawCats as any).data)
              ? (rawCats as any).data
              : Object.values(rawCats).filter((c: any) => c && typeof c === "object" && "id" in c)
            : [];
        setCategories(safeCats as Category[]);

        const bBanners = bannerData?.bottom_banners || bannerData?.middle_banners || [];
        setBottomBanners(Array.isArray(bBanners) ? bBanners : []);
      } catch (err) {
        console.warn("Notice: Storefront data fetch fallback:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStoreData();
  }, []);

  return (
    <div className="space-y-10 sm:space-y-14 lg:space-y-16 pb-8 sm:pb-12 lg:pb-16">
      {/* 1. Hero Section (Compact Carousel + Secondary Promo + Top Strip) */}
      <HeroSection />

      {/* 2. LuLu Inspired Explore Categories Minimalist Section */}
      <ExploreCategoriesSection categories={categories} />

      {/* 3. Value & Reassurance Trust Ribbon */}
      <TrustRibbon />

      {/* 4. High-Conversion Flash Deals Countdown Section */}
      {featuredProducts.length > 0 && (
        <FlashSaleSection products={featuredProducts} />
      )}

      {/* 5. Featured / New / Best Sellers Grid */}
      <FeaturedGrid
        featuredProducts={featuredProducts}
        newArrivals={newArrivals}
        bestSellers={bestSellers}
      />

      {/* 6. Category-Wise Showcase Section (With Bottom Banner Carousel above Smart Living) */}
      <CategoryShowcase categories={categories} bottomBanners={bottomBanners} />
    </div>
  );
}

