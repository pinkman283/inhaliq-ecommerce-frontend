"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FolderTree, Building2, ChevronRight, ArrowRight } from "lucide-react";
import { NavbarItem } from "@/types";

interface CategoryBrandGridMenuProps {
  item: NavbarItem;
  isOpen: boolean;
  onClose: () => void;
  align?: "left" | "right";
}

export function CategoryBrandGridMenu({
  item,
  isOpen,
  onClose,
  align = "left",
}: CategoryBrandGridMenuProps) {
  if (!isOpen) return null;

  const validChildren = (item.children || []).filter((child) => child.is_valid !== false);
  const targetUrl = item.computed_url || item.url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={{ duration: 0.14, ease: "easeOut" }}
      className={`absolute top-full mt-1.5 z-50 bg-white dark:bg-[#0c101c] rounded-2xl border border-gray-200/90 dark:border-white/10 shadow-[0_14px_45px_rgba(0,0,0,0.14)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.7)] overflow-hidden transition-all text-left w-[680px] sm:w-[740px] max-w-[calc(100vw-32px)] ${
        align === "right" ? "right-0" : "left-0"
      }`}
    >
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Left Column: Subcategories / Child items */}
          <div className="space-y-2 border-r border-gray-100 dark:border-white/[0.08] pr-4">
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-white/[0.06]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-[#005826] dark:text-cyan-400" />
                Subcategories & Series
              </span>
            </div>

            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {validChildren.length > 0 ? (
                validChildren.map((child) => {
                  const childUrl = child.computed_url || child.url;
                  if (!childUrl) return null;

                  return (
                    <Link
                      key={child.id}
                      href={childUrl}
                      target={child.open_in_new_tab ? "_blank" : undefined}
                      rel={child.open_in_new_tab ? "noopener noreferrer" : undefined}
                      onClick={onClose}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-white hover:bg-cyan-600/10 dark:hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="group-hover:text-[#005826] dark:group-hover:text-cyan-400 transition-colors truncate">
                          {child.title}
                        </span>
                        {child.badge && (
                          <span
                            className="text-[9px] px-1.5 py-0.2 rounded font-black tracking-wide text-white uppercase shrink-0"
                            style={{ backgroundColor: child.badge_color || "#EF4444" }}
                          >
                            {child.badge}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#005826] dark:group-hover:text-cyan-400 transition-colors shrink-0" />
                    </Link>
                  );
                })
              ) : item.subcategories && item.subcategories.length > 0 ? (
                item.subcategories.map((sub) => (
                  <Link
                    key={sub.id}
                    href={sub.url}
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-white hover:bg-cyan-600/10 dark:hover:bg-white/5 transition-colors group"
                  >
                    <span className="group-hover:text-[#005826] dark:group-hover:text-cyan-400 transition-colors truncate">
                      {sub.name}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#005826] dark:group-hover:text-cyan-400 transition-colors shrink-0" />
                  </Link>
                ))
              ) : (
                <div className="text-[11px] text-slate-400 py-4 text-center">
                  Explore full range in this section
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Authorized Brands Matrix */}
          <div className="space-y-2 pl-1">
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-white/[0.06]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                Featured Brands
              </span>
              <Link
                href="/brands"
                onClick={onClose}
                className="text-[10px] text-[#005826] dark:text-cyan-400 hover:underline"
              >
                All Brands →
              </Link>
            </div>

            {item.brands && item.brands.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {item.brands.map((brand) => (
                  <Link
                    key={brand.id}
                    href={`/brand/${brand.slug}`}
                    onClick={onClose}
                    className="p-2.5 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02] hover:bg-purple-500/10 hover:border-purple-500/30 transition-all flex items-center gap-2.5 group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-purple-400 group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                      {brand.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="w-full h-full object-contain p-0.5"
                        />
                      ) : (
                        brand.name.charAt(0)
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-purple-300 truncate">
                      {brand.name}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                <Building2 className="w-5 h-5 mx-auto mb-1.5 text-slate-500 opacity-60" />
                No brands linked yet
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        {targetUrl && (
          <div className="pt-3 border-t border-gray-100 dark:border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">
              Discover verified items under {item.title}
            </span>
            <Link
              href={targetUrl}
              onClick={onClose}
              className="font-semibold text-[#005826] dark:text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>View All {item.title}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}
