/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import {
  X,
  Edit,
  Globe,
  ExternalLink,
  Layers,
  Package,
  Award,
  ArrowUpRight,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Brand } from "@/types";

interface BrandPreviewDrawerProps {
  brand: Brand | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (brand: Brand) => void;
}

export function BrandPreviewDrawer({
  brand,
  isOpen,
  onClose,
  onEdit,
}: BrandPreviewDrawerProps) {
  if (!brand) return null;

  const websiteUrl = brand.website
    ? brand.website.startsWith("http")
      ? brand.website
      : `https://${brand.website}`
    : null;

  const storefrontUrl = `/brand/${brand.slug}`;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:w-[480px] md:w-[520px] sm:!max-w-[520px] max-w-full bg-[#0b0e17] border-l border-white/[0.08] p-0 flex flex-col justify-between shadow-2xl text-slate-100 overflow-hidden"
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="h-12 px-6 border-b border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0 pr-3">
              <SheetTitle className="text-xs font-semibold text-white tracking-wide shrink-0">
                Brand Profile
              </SheetTitle>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded shrink-0">
                #{brand.id}
              </span>
              <span className="text-slate-600 text-xs shrink-0">·</span>
              <span className="text-xs text-slate-400 truncate max-w-[200px]">
                {brand.name}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs">
            {/* Identity Card */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-white/5">
              <div className="w-14 h-14 rounded-md bg-slate-900 border border-white/10 flex items-center justify-center text-cyan-400 font-black text-base shrink-0 overflow-hidden shadow-inner">
                {brand.logo ? (
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="w-full h-full object-contain p-1.5"
                  />
                ) : (
                  <span>{brand.name.substring(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-base font-bold text-white truncate">{brand.name}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded">
                    slug: {brand.slug}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Order: {brand.display_order ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-md bg-white/[0.02] border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Package className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Catalog</span>
                </div>
                <p className="text-sm font-bold text-cyan-400">
                  {brand.products_count ?? 0}
                  <span className="text-[10px] font-normal text-slate-400 ml-1">items</span>
                </p>
              </div>

              <div className="p-3 rounded-md bg-white/[0.02] border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Categories</span>
                </div>
                <p className="text-sm font-bold text-emerald-400">
                  {brand.categories_count ?? 0}
                  <span className="text-[10px] font-normal text-slate-400 ml-1">linked</span>
                </p>
              </div>

              <div className="p-3 rounded-md bg-white/[0.02] border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Award className="w-3.5 h-3.5 text-[#A78BFA]" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Tier</span>
                </div>
                <p className="text-sm font-bold text-[#A78BFA]">
                  {brand.is_featured ? "Featured" : "Standard"}
                </p>
              </div>
            </div>

            {/* View Storefront Link */}
            <div className="p-3 rounded-md bg-gradient-to-r from-cyan-500/10 via-white/[0.02] to-transparent border border-cyan-500/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                  Public Storefront
                </span>
                <span className="text-xs text-slate-300 font-mono">{storefrontUrl}</span>
              </div>
              <a
                href={storefrontUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-7 px-3 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 font-bold text-[11px] transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>View Storefront</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>

            {/* External Website */}
            {websiteUrl && (
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Manufacturer Website
                </span>
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 font-mono text-xs flex items-center gap-1.5 p-2 rounded-md bg-white/[0.02] border border-white/5"
                >
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate flex-1">{brand.website}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            )}

            {/* Description */}
            {brand.description && (
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Brand Overview
                </span>
                <p className="text-slate-300 leading-relaxed text-xs p-3 rounded-md bg-white/[0.02] border border-white/5">
                  {brand.description}
                </p>
              </div>
            )}

            {/* Associated Products Preview */}
            {brand.products && brand.products.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Associated Hardware Products
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Showing top {brand.products.length}
                  </span>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {brand.products.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 rounded-md bg-white/[0.02] border border-white/5 text-slate-200"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {p.primary_image?.image_url && (
                          <img
                            src={p.primary_image.image_url}
                            alt=""
                            className="w-7 h-7 rounded-md object-cover bg-slate-900 border border-white/10 shrink-0"
                          />
                        )}
                        <span className="font-medium truncate text-xs">{p.name}</span>
                      </div>
                      <span className="text-cyan-400 font-bold shrink-0 font-mono text-xs ml-2">
                        ${Number(p.price).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="h-12 px-6 border-t border-white/[0.06] bg-[#0b0e17] flex items-center justify-end shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(brand);
              }}
              className="h-8 px-4 rounded-md bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Brand</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
