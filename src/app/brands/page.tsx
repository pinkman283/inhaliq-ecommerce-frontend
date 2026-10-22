import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import { Brand } from "@/types";
import { Building2, ArrowRight, Sparkles } from "lucide-react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inhaliq.com";

export const metadata: Metadata = {
  title: "Featured Brands & Manufacturers | Authorized Directory",
  description: "Explore our verified partner brands and curated manufacturers with official warranties.",
  alternates: {
    canonical: `${siteUrl}/brands`,
  },
};

export default async function BrandsDirectoryPage() {
  let brands: Brand[] = [];
  try {
    brands = await api.getBrands();
  } catch (err) {
    brands = [];
  }

  return (
    <div className="min-h-screen bg-[#070911] text-slate-100 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono">
          <Building2 className="w-3.5 h-3.5" />
          Verified Brand Partners
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Authorized Manufacturers & Brands
        </h1>
        <p className="text-sm text-slate-400">
          Discover certified hardware partners, audio pioneers, and bespoke manufacturers.
        </p>
      </div>

      {/* Brands Grid */}
      {brands.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-white/[0.02] border border-white/5 rounded-2xl p-8">
          <Building2 className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No Brands Listed</h3>
          <p className="text-xs text-slate-400">Brands will appear here as they are added to the store catalog.</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors"
          >
            Browse All Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brand/${brand.slug}`}
              className="group p-5 rounded-2xl bg-[#0e121e]/80 hover:bg-[#131828] border border-white/[0.06] hover:border-cyan-500/30 transition-all duration-200 shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center font-bold text-lg text-cyan-400 group-hover:scale-105 transition-transform overflow-hidden">
                  {brand.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    brand.name.charAt(0)
                  )}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {brand.name}
                  </h2>
                  {brand.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {brand.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-white/[0.04] flex items-center justify-between text-xs text-cyan-400 font-medium">
                <span>View Products</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
