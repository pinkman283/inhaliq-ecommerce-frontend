"use client";

import React, { useEffect, useState } from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { ExploreCategoriesSection } from "@/components/home/ExploreCategoriesSection";
import { TrustRibbon } from "@/components/home/TrustRibbon";
import { FlashSaleSection } from "@/components/home/FlashSaleSection";
import { FeaturedGrid } from "@/components/home/FeaturedGrid";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { api } from "@/lib/api";
import { Banner, Category, HomepageBannersResponse, Product } from "@/types";

interface HomePageClientProps {
  initialFeaturedProducts?: Product[];
  initialNewArrivals?: Product[];
  initialBestSellers?: Product[];
  initialCategories?: Category[];
  initialBottomBanners?: Banner[];
  initialBannersData?: HomepageBannersResponse | null;
}

export function HomePageClient({
  initialFeaturedProducts = [],
  initialNewArrivals = [],
  initialBestSellers = [],
  initialCategories = [],
  initialBottomBanners = [],
  initialBannersData = null,
}: HomePageClientProps) {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(initialFeaturedProducts);
  const [newArrivals, setNewArrivals] = useState<Product[]>(initialNewArrivals);
  const [bestSellers, setBestSellers] = useState<Product[]>(initialBestSellers);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [bottomBanners, setBottomBanners] = useState<Banner[]>(initialBottomBanners);

  // If initial server data was empty (e.g. backend temporarily unreachable during build/SSR),
  // fallback to client-side fetch so page is always resilient
  useEffect(() => {
    if (featuredProducts.length > 0 && categories.length > 0) return;

    async function loadStoreData() {
      try {
        const [data, bannerData, catData] = await Promise.all([
          api.getFeatured(),
          api.getHomepageBanners().catch(() => null),
          api.getCategories().catch(() => []),
        ]);
        if (Array.isArray(data?.featured_products) && data.featured_products.length > 0) {
          setFeaturedProducts(data.featured_products);
        }
        if (Array.isArray(data?.new_arrivals) && data.new_arrivals.length > 0) {
          setNewArrivals(data.new_arrivals);
        }
        if (Array.isArray(data?.best_sellers) && data.best_sellers.length > 0) {
          setBestSellers(data.best_sellers);
        }

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
        if (safeCats.length > 0) {
          setCategories(safeCats as Category[]);
        }

        const bBanners = bannerData?.bottom_banners || bannerData?.middle_banners || [];
        if (Array.isArray(bBanners) && bBanners.length > 0) {
          setBottomBanners(bBanners);
        }
      } catch (err) {
        console.warn("Notice: Storefront client fallback fetch:", err);
      }
    }

    loadStoreData();
  }, [featuredProducts.length, categories.length]);

  return (
    <div className="space-y-10 sm:space-y-14 lg:space-y-16 pb-8 sm:pb-12 lg:pb-16">
      {/* 1. Hero Section (Compact Carousel + Secondary Promo + Top Strip) */}
      <HeroSection initialData={initialBannersData} />

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
