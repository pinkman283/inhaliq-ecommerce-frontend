"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight, LucideIcon } from "lucide-react";

export interface NavChildItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  permission?: string;
  badge?: string | number;
}

export interface SidebarNavGroupProps {
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  items: NavChildItem[];
  sidebarCollapsed: boolean;
  pathname: string;
  hasItemAccess: (permission?: string) => boolean;
  onNavigate?: () => void;
}

export const SidebarNavGroup: React.FC<SidebarNavGroupProps> = ({
  label,
  icon: GroupIcon,
  badge,
  items,
  sidebarCollapsed,
  pathname,
  hasItemAccess,
  onNavigate,
}) => {
  const searchParams = useSearchParams();

  // Filter visible items according to permissions
  const visibleItems = items.filter((item) => hasItemAccess(item.permission));

  // Query-aware active matching for items with or without query strings
  const checkItemActive = useCallback(
    (itemHref: string) => {
      // 1. If link has query parameters (e.g. /admin/integrations?category=fraud)
      if (itemHref.includes("?")) {
        const [targetPath, targetQuery] = itemHref.split("?");
        if (pathname !== targetPath) return false;
        const targetParams = new URLSearchParams(targetQuery);
        for (const [key, val] of targetParams.entries()) {
          if (searchParams.get(key) !== val) return false;
        }
        return true;
      }

      // 2. If link has NO query parameters (e.g. /admin/integrations)
      if (pathname === itemHref) {
        // If any visible sibling has query parameters matching the current searchParams,
        // then the root link is NOT active (e.g. /admin/integrations?category=fraud should highlight Fraud, not All)
        const siblingMatches = visibleItems.some((sib) => {
          if (!sib.href.includes("?")) return false;
          const [sibPath, sibQuery] = sib.href.split("?");
          if (sibPath !== pathname) return false;
          const sibParams = new URLSearchParams(sibQuery);
          return Array.from(sibParams.entries()).every(
            ([k, v]) => searchParams.get(k) === v
          );
        });
        return !siblingMatches;
      }

      // 3. For nested sub-routes (e.g. /admin/products/new matching /admin/products)
      if (itemHref !== "/admin" && pathname.startsWith(itemHref) && !itemHref.includes("?")) {
        return true;
      }

      return false;
    },
    [pathname, searchParams, visibleItems]
  );

  // Determine if any child is currently active
  const hasActiveChild = visibleItems.some((item) => checkItemActive(item.href));

  // Accordion state: open by default if active child is present
  const [isOpen, setIsOpen] = useState(hasActiveChild);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const flyoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-expand if navigating to an active child
  useEffect(() => {
    if (hasActiveChild) {
      setIsOpen(true);
    }
  }, [hasActiveChild, pathname, searchParams]);

  // If no visible items, hide entire group
  if (visibleItems.length === 0) return null;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen((prev) => !prev);
  };

  // Handlers for flyout menu in collapsed mode
  const handleMouseEnter = () => {
    if (flyoutTimerRef.current) clearTimeout(flyoutTimerRef.current);
    setFlyoutOpen(true);
  };

  const handleMouseLeave = () => {
    flyoutTimerRef.current = setTimeout(() => {
      setFlyoutOpen(false);
    }, 150);
  };

  // -------------------------------------------------------------
  // COLLAPSED SIDEBAR (ICON-ONLY MODE with Anchored Flyout)
  // -------------------------------------------------------------
  if (sidebarCollapsed) {
    return (
      <div
        className="relative group my-0.5 w-full flex justify-center"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          type="button"
          onClick={() => setFlyoutOpen((prev) => !prev)}
          className={`flex h-9 w-full items-center justify-center rounded-md transition-colors duration-150 cursor-pointer ${
            hasActiveChild
              ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30 shadow-xs"
              : "text-[#929BAD] hover:text-[#E5E7EB] hover:bg-white/5 border border-transparent"
          }`}
          title={label}
        >
          <div className="w-4 h-4 flex items-center justify-center shrink-0">
            <GroupIcon
              className={`w-4 h-4 transition-colors ${
                hasActiveChild ? "text-[#A78BFA]" : "text-[#929BAD] group-hover:text-[#E5E7EB]"
              }`}
            />
          </div>
          {hasActiveChild && (
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#A78BFA] shadow-[0_0_6px_rgba(167,139,250,0.6)]" />
          )}
        </button>

        {/* Anchored Popover / Flyout for Collapsed Sidebar */}
        {flyoutOpen && (
          <div
            className="absolute left-full top-0 ml-2 z-50 w-56 rounded-md border border-[#272B35] bg-[#171B26] p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="flex items-center gap-2 border-b border-[#272B35] px-2.5 pb-2 pt-1 mb-1.5">
              <GroupIcon className="w-4 h-4 text-[#A78BFA] shrink-0" />
              <span className="text-xs font-bold text-[#E5E7EB] uppercase tracking-wide truncate">
                {label}
              </span>
              {badge && (
                <span className="ml-auto rounded bg-white/10 px-1.5 py-0.2 text-[10px] font-mono text-[#929BAD]">
                  {badge}
                </span>
              )}
            </div>

            <div className="space-y-0.5 max-h-72 overflow-y-auto no-scrollbar">
              {visibleItems.map((item) => {
                const ItemIcon = item.icon;
                const isItemActive = checkItemActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setFlyoutOpen(false);
                      if (onNavigate) onNavigate();
                    }}
                    className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                      isItemActive
                        ? "bg-[#211B32] text-[#A78BFA] font-semibold border border-[#A78BFA]/30"
                        : "text-[#929BAD] hover:text-[#E5E7EB] hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    {ItemIcon && (
                      <ItemIcon
                        className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                          isItemActive ? "text-[#A78BFA]" : "text-[#626B7B] group-hover:text-[#929BAD]"
                        }`}
                      />
                    )}
                    <span className="truncate">{item.label}</span>
                    {isItemActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#A78BFA] shadow-[0_0_6px_rgba(167,139,250,0.6)]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // EXPANDED SIDEBAR: Contained Full-Width Accordion Panel
  // -------------------------------------------------------------
  return (
    <div
      className={`w-full rounded-md transition-all duration-200 overflow-hidden my-0.5 ${
        isOpen
          ? "border border-[#272B35] bg-[#11141D] shadow-sm"
          : "border border-transparent bg-transparent hover:border-[#272B35]/60"
      }`}
    >
      {/* Parent Navigation Item (Header Button) */}
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full flex items-center justify-between px-3 h-9 text-xs font-medium transition-all duration-150 cursor-pointer ${
          isOpen
            ? "bg-[#171B26] text-[#E5E7EB] font-semibold"
            : hasActiveChild
            ? "bg-[#211B32] text-[#A78BFA] font-semibold hover:bg-[#211B32]/90"
            : "text-[#929BAD] hover:text-[#E5E7EB] hover:bg-white/[0.04]"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <GroupIcon
            className={`w-4 h-4 shrink-0 transition-colors ${
              hasActiveChild || isOpen ? "text-[#A78BFA]" : "text-[#929BAD]"
            }`}
          />
          <span className="truncate tracking-tight whitespace-nowrap">{label}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {hasActiveChild && !isOpen && (
            <span className="h-1.5 w-1.5 rounded-full bg-[#A78BFA] shadow-[0_0_6px_rgba(167,139,250,0.6)]" />
          )}
          {badge && (
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9.5px] font-mono text-[#929BAD]">
              {badge}
            </span>
          )}
          <ChevronRight
            className={`w-3.5 h-3.5 text-[#929BAD] transition-transform duration-200 ${
              isOpen ? "rotate-90 text-[#E5E7EB]" : "rotate-0"
            }`}
          />
        </div>
      </button>

      {/* Submenu: Contained full-width panel immediately underneath parent */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
          <div className="w-full bg-[#090B10] border-t border-[#272B35] p-1.5 space-y-0.5">
            {visibleItems.map((item) => {
              const ItemIcon = item.icon;
              const isItemActive = checkItemActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs transition-colors duration-150 group relative ${
                    isItemActive
                      ? "bg-[#211B32] text-[#A78BFA] font-semibold border border-[#A78BFA]/30 shadow-xs"
                      : "text-[#929BAD] hover:text-[#E5E7EB] hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  {ItemIcon ? (
                    <ItemIcon
                      className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                        isItemActive
                          ? "text-[#A78BFA]"
                          : "text-[#626B7B] group-hover:text-[#929BAD]"
                      }`}
                    />
                  ) : (
                    <span
                      className={`h-1.5 w-1.5 rounded-full shrink-0 transition-colors ${
                        isItemActive ? "bg-[#A78BFA]" : "bg-[#626B7B] group-hover:bg-[#929BAD]"
                      }`}
                    />
                  )}

                  <span className="truncate">{item.label}</span>

                  {isItemActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#A78BFA] shadow-[0_0_6px_rgba(167,139,250,0.6)]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export interface SidebarNavLinkProps {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  sidebarCollapsed: boolean;
  pathname: string;
  onNavigate?: () => void;
}

export const SidebarNavLink: React.FC<SidebarNavLinkProps> = ({
  label,
  href,
  icon: Icon,
  badge,
  sidebarCollapsed,
  pathname,
  onNavigate,
}) => {
  const isActive = pathname === href;

  return (
    <div className="relative group/navlink my-0.5 w-full">
      <Link
        href={href}
        onClick={onNavigate}
        className={`flex items-center h-9 w-full rounded-md text-xs font-medium transition-colors duration-150 ${
          sidebarCollapsed ? "justify-center px-0" : "px-3 justify-between"
        } ${
          isActive
            ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30 font-semibold shadow-xs"
            : "text-[#929BAD] hover:text-[#E5E7EB] hover:bg-white/[0.04] border border-transparent"
        }`}
        title={sidebarCollapsed ? label : undefined}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-4 h-4 flex items-center justify-center shrink-0">
            <Icon
              className={`w-4 h-4 shrink-0 transition-colors ${
                isActive ? "text-[#A78BFA]" : "text-[#929BAD] group-hover/navlink:text-[#E5E7EB]"
              }`}
            />
          </div>
          {!sidebarCollapsed && (
            <span className="truncate tracking-tight whitespace-nowrap animate-in fade-in duration-150">
              {label}
            </span>
          )}
        </div>
        {badge && !sidebarCollapsed && (
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9.5px] font-mono text-[#929BAD] ml-2 shrink-0">
            {badge}
          </span>
        )}
      </Link>

      {sidebarCollapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 rounded bg-[#171B26] border border-[#272B35] text-[11px] font-semibold text-[#E5E7EB] shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover/navlink:opacity-100 transition-opacity z-50">
          {label}
        </div>
      )}
    </div>
  );
};
