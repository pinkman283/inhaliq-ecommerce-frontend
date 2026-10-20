import { HomePageClient } from "@/components/home/HomePageClient";
import { storefrontApi } from "@/lib/api";
import { Banner, Category, HomepageBannersResponse, Product } from "@/types";

export const revalidate = 60; // Revalidate every 60 seconds (ISR)

export default async function HomePage() {
  let featuredProducts: Product[] = [];
  let newArrivals: Product[] = [];
  let bestSellers: Product[] = [];
  let categories: Category[] = [];
  let bottomBanners: Banner[] = [];
  let bannerData: HomepageBannersResponse | null = null;

  try {
    const [homeData, bData, catData] = await Promise.all([
      storefrontApi.getHomepageData().catch(() => null),
      storefrontApi.getHomepageBanners().catch(() => null),
      storefrontApi.getCategories().catch(() => []),
    ]);

    bannerData = bData;
    if (homeData) {
      featuredProducts = homeData.featured_products || [];
      newArrivals = homeData.new_arrivals || [];
      bestSellers = homeData.best_sellers || [];
      const rawCats = (homeData.featured_categories && homeData.featured_categories.length > 0)
        ? homeData.featured_categories
        : catData;
      categories = Array.isArray(rawCats) ? rawCats : [];
    } else {
      categories = Array.isArray(catData) ? catData : [];
    }

    bottomBanners = bData?.bottom_banners || bData?.middle_banners || [];
  } catch (err) {
    console.warn("Server homepage data fetch notice:", err);
  }

  return (
    <HomePageClient
      initialFeaturedProducts={featuredProducts}
      initialNewArrivals={newArrivals}
      initialBestSellers={bestSellers}
      initialCategories={categories}
      initialBottomBanners={bottomBanners}
      initialBannersData={bannerData}
    />
  );
}

