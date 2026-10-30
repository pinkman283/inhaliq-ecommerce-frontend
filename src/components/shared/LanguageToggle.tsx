"use client";

import React, { useState, useEffect } from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  variant?: "desktop" | "mobile" | "compact";
  className?: string;
}

export function LanguageToggle({ variant = "desktop", className }: LanguageToggleProps) {
  const { locale, isBangla, setLocale, toggleLocale } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const accessibleLabel = isBangla
    ? "Switch language to English"
    : "Switch language to Bangla (বাংলায় পরিবর্তন করুন)";

  if (!mounted) {
    // Avoid hydration mismatch by rendering a stable placeholder
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center h-8 sm:h-9 px-2.5 rounded-md border border-gray-200 dark:border-white/10 bg-gray-100/60 dark:bg-white/5 opacity-50",
          className
        )}
        aria-hidden="true"
      >
        <Globe className="w-3.5 h-3.5 text-gray-400" />
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <button
        onClick={toggleLocale}
        type="button"
        aria-label={accessibleLabel}
        aria-pressed={isBangla}
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer",
          "border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-slate-800 dark:text-white",
          "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-cyan-500",
          className
        )}
      >
        <Globe className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
        <span className="font-semibold">{isBangla ? "EN" : "বাং"}</span>
      </button>
    );
  }

  if (variant === "mobile") {
    return (
      <div
        className={cn(
          "flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5",
          className
        )}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
          <Globe className="w-4 h-4 text-cyan-500" />
          <span>Language / ভাষা</span>
        </div>
        <div
          role="group"
          aria-label="Language selection"
          className="inline-flex rounded-md p-0.5 bg-gray-200 dark:bg-white/10 border border-gray-300 dark:border-white/10"
        >
          <button
            type="button"
            onClick={() => setLocale("en")}
            aria-pressed={!isBangla}
            className={cn(
              "px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer",
              !isBangla
                ? "bg-white dark:bg-[#0f172a] text-slate-950 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLocale("bn")}
            aria-pressed={isBangla}
            className={cn(
              "px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer",
              isBangla
                ? "bg-white dark:bg-[#0f172a] text-slate-950 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            বাংলা
          </button>
        </div>
      </div>
    );
  }

  // Default: Segmented interactive switch button for desktop navbar
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md p-0.5 border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 shadow-2xs select-none",
        className
      )}
      role="group"
      aria-label="Language selection"
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={!isBangla}
        aria-label="English language"
        className={cn(
          "flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded text-[11px] font-bold tracking-tight transition-all cursor-pointer",
          !isBangla
            ? "bg-white dark:bg-[#0f172a] text-slate-950 dark:text-white shadow-xs"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        )}
      >
        <span className="text-[10px] opacity-75">EN</span>
      </button>

      <div className="w-[1px] h-3 bg-gray-300 dark:bg-white/10 mx-0.5" />

      <button
        type="button"
        onClick={() => setLocale("bn")}
        aria-pressed={isBangla}
        aria-label="বাংলা ভাষা (Bangla language)"
        className={cn(
          "flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded text-[11px] font-bold tracking-tight transition-all cursor-pointer font-bengali",
          isBangla
            ? "bg-white dark:bg-[#0f172a] text-slate-950 dark:text-white shadow-xs text-cyan-600 dark:text-cyan-400"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        )}
      >
        <span>বাংলা</span>
      </button>
    </div>
  );
}

