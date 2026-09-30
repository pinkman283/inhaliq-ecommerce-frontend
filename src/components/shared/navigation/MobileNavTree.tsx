"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ExternalLink } from "lucide-react";
import { NavbarItem } from "@/types";

interface MobileNavTreeProps {
  items: NavbarItem[];
  onItemClick?: () => void;
  depth?: number;
}

export function MobileNavTree({ items, onItemClick, depth = 0 }: MobileNavTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const validItems = items.filter((item) => item.is_valid !== false);

  if (validItems.length === 0) return null;

  return (
    <div className={`space-y-1 ${depth > 0 ? "pl-3 border-l border-gray-200 dark:border-white/10 ml-2.5 my-1" : ""}`}>
      {validItems.map((item) => {
        const hasChildren = Boolean(item.children && item.children.length > 0);
        const isExpanded = Boolean(expandedIds[item.id]);
        const targetUrl = item.computed_url || item.url;
        const isGroupHeader = item.type === "dropdown_group";

        return (
          <div key={item.id} className="space-y-0.5">
            <div className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
              {isGroupHeader ? (
                <div
                  onClick={() => hasChildren && toggleExpand(item.id)}
                  className="flex items-center gap-2 flex-1 py-1 cursor-pointer select-none text-[11px] font-bold uppercase tracking-wider text-slate-400"
                >
                  <span className="truncate">{item.title}</span>
                </div>
              ) : targetUrl ? (
                <Link
                  href={targetUrl}
                  target={item.open_in_new_tab ? "_blank" : undefined}
                  rel={item.open_in_new_tab ? "noopener noreferrer" : undefined}
                  onClick={onItemClick}
                  className="flex items-center gap-2 flex-1 py-1 text-sm font-medium text-slate-800 dark:text-slate-200 hover:text-[#005826] dark:hover:text-cyan-400 transition-colors"
                >
                  <span className="truncate">{item.title}</span>
                  {item.badge && (
                    <span
                      className="text-[9px] px-1.5 py-0.2 rounded font-black tracking-wide text-white uppercase shrink-0"
                      style={{ backgroundColor: item.badge_color || "#EF4444" }}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.open_in_new_tab && (
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400 opacity-60 shrink-0" />
                  )}
                </Link>
              ) : (
                <div
                  onClick={() => hasChildren && toggleExpand(item.id)}
                  className="flex items-center gap-2 flex-1 py-1 cursor-pointer select-none text-sm font-medium text-slate-800 dark:text-slate-200"
                >
                  <span className="truncate">{item.title}</span>
                  {item.badge && (
                    <span
                      className="text-[9px] px-1.5 py-0.2 rounded font-black tracking-wide text-white uppercase shrink-0"
                      style={{ backgroundColor: item.badge_color || "#EF4444" }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              {/* Expand/Collapse Toggle Button for child tiers */}
              {hasChildren && (
                <button
                  type="button"
                  onClick={() => toggleExpand(item.id)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-md transition-transform"
                  aria-label={isExpanded ? "Collapse section" : "Expand section"}
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isExpanded ? "rotate-180 text-[#005826] dark:text-cyan-400" : ""
                    }`}
                  />
                </button>
              )}
            </div>

            {/* Recursive Subtree Accordion */}
            <AnimatePresence>
              {hasChildren && isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <MobileNavTree
                    items={item.children!}
                    onItemClick={onItemClick}
                    depth={depth + 1}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
