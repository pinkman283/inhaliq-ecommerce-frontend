"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ExternalLink } from "lucide-react";
import { NavbarItem } from "@/types";

interface CascadingNavDropdownProps {
  items: NavbarItem[];
  isOpen: boolean;
  onClose: () => void;
  align?: "left" | "right";
}

interface CascadingMenuTierProps {
  items: NavbarItem[];
  depth?: number;
  onClose: () => void;
  parentOpenLeft?: boolean;
}

function CascadingMenuTier({
  items,
  depth = 0,
  onClose,
  parentOpenLeft = false,
}: CascadingMenuTierProps) {
  const router = useRouter();
  const [activeChildId, setActiveChildId] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [openLeft, setOpenLeft] = useState(parentOpenLeft);
  const tierRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLAnchorElement | HTMLDivElement | null)[]>([]);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter out any items marked invalid by the backend
  const validItems = items.filter((item) => item.is_valid !== false);

  // Viewport boundary collision detection
  useEffect(() => {
    if (tierRef.current) {
      const rect = tierRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const expectedSubmenuWidth = 250;

      if (parentOpenLeft || rect.right + expectedSubmenuWidth > viewportWidth - 16) {
        setOpenLeft(true);
      } else {
        setOpenLeft(false);
      }
    }
  }, [depth, parentOpenLeft]);

  const handleMouseEnter = (itemId: number, hasChildren: boolean, index: number) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setFocusedIndex(index);
    if (hasChildren) {
      setActiveChildId(itemId);
    } else if (activeChildId !== null) {
      // Gracefully delay closing active child when cursor sweeps across sibling leaf item
      hoverTimeoutRef.current = setTimeout(() => {
        setActiveChildId(null);
      }, 120);
    } else {
      setActiveChildId(null);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    // Smooth 160ms transition so diagonal cursor movement doesn't close submenu
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveChildId(null);
    }, 160);
  };

  const handleKeyDown = (e: React.KeyboardEvent, item: NavbarItem, index: number) => {
    const hasChildren = Boolean(item.children && item.children.length > 0);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = (index + 1) % validItems.length;
      setFocusedIndex(nextIdx);
      itemRefs.current[nextIdx]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIdx = (index - 1 + validItems.length) % validItems.length;
      setFocusedIndex(prevIdx);
      itemRefs.current[prevIdx]?.focus();
    } else if (e.key === "ArrowRight") {
      if (hasChildren) {
        e.preventDefault();
        setActiveChildId(item.id);
      }
    } else if (e.key === "ArrowLeft") {
      if (depth > 0) {
        e.preventDefault();
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "Enter" || e.key === " ") {
      if (!hasChildren) {
        const targetUrl = item.computed_url || item.url;
        if (targetUrl) {
          e.preventDefault();
          onClose();
          router.push(targetUrl);
        }
      } else {
        e.preventDefault();
        setActiveChildId(activeChildId === item.id ? null : item.id);
      }
    }
  };

  if (validItems.length === 0) return null;

  return (
    <div
      ref={tierRef}
      onMouseLeave={handleMouseLeave}
      className="w-56 sm:w-60 min-w-[220px] max-w-[280px] py-1 bg-white dark:bg-[#0c101d] rounded-xl border border-gray-100 dark:border-white/[0.09] shadow-[0_10px_35px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_45px_rgba(0,0,0,0.65)] backdrop-blur-xl text-left select-none"
      role="menu"
    >
      {validItems.map((item, index) => {
        const hasChildren = Boolean(item.children && item.children.length > 0);
        const isActiveOrHovered = activeChildId === item.id;
        const targetUrl = item.computed_url || item.url;
        const isGroupHeader = item.type === "dropdown_group";

        return (
          <div
            key={item.id}
            onMouseEnter={() => handleMouseEnter(item.id, hasChildren, index)}
            className="relative px-1 border-b border-gray-100/80 dark:border-white/[0.05] last:border-b-0 py-0.5"
          >
            {isGroupHeader ? (
              /* Group Header (Non-clickable Section Separator) */
              <div
                className={`flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider select-none ${
                  isActiveOrHovered
                    ? "text-[#005826] dark:text-cyan-400 bg-emerald-50/70 dark:bg-white/5"
                    : "text-slate-400 dark:text-slate-400"
                }`}
              >
                <span className="truncate">{item.title}</span>
                {hasChildren && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />
                )}
              </div>
            ) : targetUrl ? (
              /* Clickable Navigation Link */
              <Link
                ref={(el) => { itemRefs.current[index] = el; }}
                href={targetUrl}
                target={item.open_in_new_tab ? "_blank" : undefined}
                rel={item.open_in_new_tab ? "noopener noreferrer" : undefined}
                onClick={(e) => {
                  if (hasChildren) {
                    // Prevent accidental navigation when clicking item with children
                    if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
                      e.preventDefault();
                      setActiveChildId((prev) => (prev === item.id ? null : item.id));
                    }
                  } else {
                    onClose();
                  }
                }}
                onKeyDown={(e) => handleKeyDown(e, item, index)}
                tabIndex={0}
                role="menuitem"
                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-[12.5px] tracking-tight transition-all duration-120 group outline-none ${
                  isActiveOrHovered
                    ? "text-[#005826] dark:text-cyan-300 bg-emerald-50/80 dark:bg-white/10 font-semibold shadow-2xs"
                    : "text-slate-700 dark:text-slate-200 hover:text-[#005826] dark:hover:text-white hover:bg-gray-50/90 dark:hover:bg-white/5 font-medium"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="truncate">{item.title}</span>
                  {item.badge && (
                    <span
                      className="text-[9px] px-1.5 py-0.2 rounded font-black tracking-wide text-white uppercase shrink-0 shadow-2xs"
                      style={{ backgroundColor: item.badge_color || "#EF4444" }}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.open_in_new_tab && (
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>

                {/* Right chevron indicator for items containing children */}
                {hasChildren && (
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform duration-120 shrink-0 ml-1.5 ${
                      isActiveOrHovered
                        ? "text-[#005826] dark:text-cyan-400 translate-x-0.5"
                        : "text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5"
                    }`}
                  />
                )}
              </Link>
            ) : (
              /* Non-linked Container with Submenu */
              <div
                ref={(el) => { itemRefs.current[index] = el; }}
                tabIndex={0}
                role="menuitem"
                onKeyDown={(e) => handleKeyDown(e, item, index)}
                onClick={() => hasChildren && setActiveChildId(activeChildId === item.id ? null : item.id)}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-[12.5px] tracking-tight transition-all duration-120 cursor-pointer outline-none ${
                  isActiveOrHovered
                    ? "text-[#005826] dark:text-cyan-300 bg-emerald-50/80 dark:bg-white/10 font-semibold"
                    : "text-slate-700 dark:text-slate-200 hover:bg-gray-50/90 dark:hover:bg-white/5 font-medium"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="truncate">{item.title}</span>
                  {item.badge && (
                    <span
                      className="text-[9px] px-1.5 py-0.2 rounded font-black tracking-wide text-white uppercase shrink-0 shadow-2xs"
                      style={{ backgroundColor: item.badge_color || "#EF4444" }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                {hasChildren && (
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform duration-120 shrink-0 ml-1.5 ${
                      isActiveOrHovered
                        ? "text-[#005826] dark:text-cyan-400 translate-x-0.5"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  />
                )}
              </div>
            )}

            {/* Adjacent Submenu Panel (Tier N + 1) with Invisible Hover Bridge */}
            <AnimatePresence>
              {hasChildren && isActiveOrHovered && (
                <div
                  key={`submenu-${item.id}`}
                  onMouseEnter={() => {
                    if (hoverTimeoutRef.current) {
                      clearTimeout(hoverTimeoutRef.current);
                      hoverTimeoutRef.current = null;
                    }
                  }}
                  className={`absolute top-0 z-50 ${
                    openLeft
                      ? "right-full pr-1.5 -mr-0.5"
                      : "left-full pl-1.5 -ml-0.5"
                  }`}
                  style={{ top: "-3px" }}
                >
                  <motion.div
                    initial={{ opacity: 0, x: openLeft ? 4 : -4, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: openLeft ? 4 : -4, scale: 0.98 }}
                    transition={{ duration: 0.12, ease: "easeOut" }}
                  >
                    <CascadingMenuTier
                      items={item.children!}
                      depth={depth + 1}
                      onClose={onClose}
                      parentOpenLeft={openLeft}
                    />
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export function CascadingNavDropdown({
  items,
  isOpen,
  onClose,
  align = "left",
}: CascadingNavDropdownProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close on escape
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !items || items.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={`absolute top-full mt-1.5 z-50 before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 before:content-[''] ${
        align === "right" ? "right-0" : "left-0"
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: 4, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.98 }}
        transition={{ duration: 0.13, ease: "easeOut" }}
      >
        <CascadingMenuTier
          items={items}
          depth={0}
          onClose={onClose}
          parentOpenLeft={align === "right"}
        />
      </motion.div>
    </div>
  );
}
