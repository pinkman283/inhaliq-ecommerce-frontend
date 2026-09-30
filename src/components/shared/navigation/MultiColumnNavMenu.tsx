"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { NavbarItem } from "@/types";

interface MultiColumnNavMenuProps {
  item: NavbarItem;
  isOpen: boolean;
  onClose: () => void;
  align?: "left" | "right";
}

export function MultiColumnNavMenu({
  item,
  isOpen,
  onClose,
  align = "left",
}: MultiColumnNavMenuProps) {
  if (!isOpen) return null;

  const validChildren = (item.children || []).filter((child) => child.is_valid !== false);
  const targetUrl = item.computed_url || item.url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={{ duration: 0.14, ease: "easeOut" }}
      className={`absolute top-full mt-1.5 z-50 bg-white dark:bg-[#0c101c] rounded-2xl border border-gray-200/90 dark:border-white/10 shadow-[0_14px_45px_rgba(0,0,0,0.14)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.7)] overflow-hidden transition-all text-left w-[520px] max-w-[calc(100vw-32px)] ${
        align === "right" ? "right-0" : "left-0"
      }`}
    >
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                  className="p-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-[#006B45] dark:hover:text-cyan-400 transition-colors flex items-center justify-between group"
                >
                  <span className="truncate">{child.title}</span>
                  {child.badge && (
                    <span
                      className="text-[9px] px-1.5 py-0.2 rounded font-black tracking-wide text-white uppercase shrink-0"
                      style={{ backgroundColor: child.badge_color || "#EF4444" }}
                    >
                      {child.badge}
                    </span>
                  )}
                </Link>
              );
            })
          ) : item.subcategories && item.subcategories.length > 0 ? (
            item.subcategories.map((sub) => (
              <Link
                key={sub.id}
                href={sub.url}
                onClick={onClose}
                className="p-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-[#006B45] dark:hover:text-cyan-400 transition-colors truncate"
              >
                {sub.name}
              </Link>
            ))
          ) : (
            <div className="col-span-full py-4 text-center text-xs text-slate-400">
              No items configured under this section
            </div>
          )}
        </div>

        {targetUrl && (
          <div className="pt-2.5 border-t border-gray-100 dark:border-white/10 text-right">
            <Link
              href={targetUrl}
              onClick={onClose}
              className="text-xs font-semibold text-[#006B45] dark:text-cyan-400 hover:underline inline-flex items-center gap-1"
            >
              Browse all {item.title} →
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}
