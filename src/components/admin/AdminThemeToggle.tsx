"use client";

import React from "react";
import { Sun, Moon, Loader2 } from "lucide-react";
import { useAdminThemeStore, getOriginFromEvent } from "@/store/useAdminThemeStore";
import { cn } from "@/lib/utils";

interface AdminThemeToggleProps {
  className?: string;
}

export const AdminThemeToggle: React.FC<AdminThemeToggleProps> = ({ className = "" }) => {
  const { theme, setTheme, isSaving } = useAdminThemeStore();
  const isDark = theme === "dark";

  const handleToggle = (targetMode: "dark" | "light", e?: React.MouseEvent) => {
    if (theme === targetMode) return;
    const origin = getOriginFromEvent(e);
    setTheme(targetMode, origin);
  };

  return (
    <div
      role="group"
      aria-label="Admin theme mode"
      className={cn(
        "admin-theme-toggle-group relative inline-flex items-center p-0.5 rounded-md border border-[#272B35] bg-[#171B26] shadow-2xs select-none transition-colors duration-240 ease-[cubic-bezier(0.16,1,0.3,1)]",
        className
      )}
    >
      {/* Sliding Active Pill Background (Matching Bricky fluid deceleration motion) */}
      <div
        className={cn(
          "absolute top-0.5 bottom-0.5 left-0.5 w-7 rounded bg-[#090B10] border border-white/5 shadow-xs pointer-events-none transition-transform duration-240 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isDark ? "translate-x-0" : "translate-x-7 bg-white border-slate-200/90 shadow-sm"
        )}
      />

      {/* Dark Theme Button */}
      <button
        type="button"
        onClick={(e) => handleToggle("dark", e)}
        disabled={isSaving}
        aria-pressed={isDark}
        aria-label="Switch to dark theme"
        title="Switch to dark theme"
        className={cn(
          "relative z-10 w-7 h-7 flex items-center justify-center rounded text-[11px] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A78BFA] disabled:opacity-50 transition-colors duration-200",
          isDark
            ? "text-[#A78BFA]"
            : "text-[#929BAD] hover:text-[#E5E7EB]"
        )}
      >
        {isSaving && isDark ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#A78BFA]" aria-hidden="true" />
        ) : (
          <Moon
            className={cn(
              "w-3.5 h-3.5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
              isDark
                ? "text-[#A78BFA] fill-[#A78BFA]/20 scale-105 rotate-0"
                : "text-[#929BAD] scale-95 rotate-12"
            )}
            aria-hidden="true"
          />
        )}
        <span className="sr-only">Dark theme</span>
      </button>

      {/* Light Theme Button */}
      <button
        type="button"
        onClick={(e) => handleToggle("light", e)}
        disabled={isSaving}
        aria-pressed={!isDark}
        aria-label="Switch to light theme"
        title="Switch to light theme"
        className={cn(
          "relative z-10 w-7 h-7 flex items-center justify-center rounded text-[11px] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 disabled:opacity-50 transition-colors duration-200",
          !isDark
            ? "text-amber-500"
            : "text-[#929BAD] hover:text-[#E5E7EB]"
        )}
      >
        {isSaving && !isDark ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" aria-hidden="true" />
        ) : (
          <Sun
            className={cn(
              "w-3.5 h-3.5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
              !isDark
                ? "text-amber-500 fill-amber-500/20 scale-105 rotate-0"
                : "text-[#929BAD] scale-95 -rotate-12"
            )}
            aria-hidden="true"
          />
        )}
        <span className="sr-only">Light theme</span>
      </button>
    </div>
  );
};
