"use client";

import React from "react";
import { Building2, Award, Boxes } from "lucide-react";

interface BrandsKpiCardsProps {
  totalBrands: number;
  featuredBrandsCount: number;
  totalProductsLinked: number;
}

export function BrandsKpiCards({
  totalBrands,
  featuredBrandsCount,
  totalProductsLinked,
}: BrandsKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="p-4 rounded-md bg-white/[0.03] border border-white/10 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
            Total Brands
          </span>
          <span className="text-lg font-black text-white">{totalBrands}</span>
        </div>
      </div>

      <div className="p-4 rounded-md bg-white/[0.03] border border-white/10 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-md bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA] shrink-0">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
            Featured Brands
          </span>
          <span className="text-lg font-black text-[#A78BFA]">{featuredBrandsCount}</span>
        </div>
      </div>

      <div className="p-4 rounded-md bg-white/[0.03] border border-white/10 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
          <Boxes className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
            Hardware Catalog Linked
          </span>
          <span className="text-lg font-black text-emerald-300">{totalProductsLinked} units</span>
        </div>
      </div>
    </div>
  );
}
