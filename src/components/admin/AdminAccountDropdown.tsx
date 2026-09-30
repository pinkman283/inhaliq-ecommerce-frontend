"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Settings,
  Palette,
  Activity,
  ExternalLink,
  LogOut,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { useAdminAuthStore } from "@/store/useAdminAuthStore";
import { adminApi } from "@/lib/adminApi";

interface AdminAccountDropdownProps {
  className?: string;
}

export const AdminAccountDropdown: React.FC<AdminAccountDropdownProps> = ({ className = "" }) => {
  const router = useRouter();
  const { adminUser, logoutAdmin } = useAdminAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await adminApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      logoutAdmin();
      router.push("/admin/login");
    }
  };

  const displayName = adminUser?.name || "Admin";
  const firstName = adminUser?.name ? adminUser.name.trim().split(/\s+/)[0] : "Admin";
  const displayRole = adminUser?.role?.replace("_", " ") || "Administrator";
  const avatarUrl =
    adminUser?.avatar ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button matching Untitled UI Account Card (md) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={`group flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-full sm:rounded-xl border transition-all duration-150 cursor-pointer focus:outline-none select-none ${
          isOpen
            ? "bg-white/[0.08] border-purple-500/60 ring-2 ring-purple-500/30 text-white"
            : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] hover:border-white/20 text-slate-200"
        }`}
      >
        {/* Avatar with Status Indicator Dot */}
        <div className="relative shrink-0">
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-white/20 group-hover:ring-purple-400/50 transition-all"
          />
          {/* Online Indicator Dot */}
          <span
            className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#090b10]"
            title="Online"
          />
        </div>

        {/* Admin First Name */}
        <span className="hidden sm:inline text-xs font-semibold text-slate-200 group-hover:text-white max-w-[120px] truncate">
          {firstName}
        </span>

        {/* Chevron Icon */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-purple-400" : ""
          }`}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl bg-[#0d111c]/98 backdrop-blur-xl border border-white/[0.1] shadow-2xl p-1.5 ring-1 ring-black/40 z-50 animate-in fade-in zoom-in-95 duration-100 text-slate-200 focus:outline-none"
        >
          {/* Header Card: Name + Email with Role Badge on the right */}
          <div className="p-3 bg-white/[0.03] rounded-xl mb-1 border border-white/[0.05]">
            <div className="flex items-start justify-between gap-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{displayName}</p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{adminUser?.email}</p>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0 self-start">
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                {displayRole}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-0.5">
            {/* 1. My Profile */}
            <Link
              href="/admin/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-lg text-slate-200 hover:text-white hover:bg-white/[0.06] transition-colors group"
            >
              <div className="flex items-center gap-2.5 truncate">
                <User className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-colors shrink-0" />
                <span>My Profile</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[9.5px] font-mono rounded bg-white/[0.05] border border-white/[0.08] text-slate-400">
                ⌘P
              </kbd>
            </Link>

            {/* 2. Store Settings */}
            <Link
              href="/admin/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-lg text-slate-200 hover:text-white hover:bg-white/[0.06] transition-colors group"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Settings className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors shrink-0" />
                <span>Store Settings</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[9.5px] font-mono rounded bg-white/[0.05] border border-white/[0.08] text-slate-400">
                ⌘S
              </kbd>
            </Link>

            {/* 3. Theme Studio & Branding */}
            <Link
              href="/admin/content/branding"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-lg text-slate-200 hover:text-white hover:bg-white/[0.06] transition-colors group"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Palette className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors shrink-0" />
                <span>Theme & Branding</span>
              </div>
            </Link>

            {/* 4. Audit Logs */}
            <Link
              href="/admin/settings/audit-logs"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-lg text-slate-200 hover:text-white hover:bg-white/[0.06] transition-colors group"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Activity className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors shrink-0" />
                <span>Audit & Activity</span>
              </div>
            </Link>

            {/* 5. Live Storefront */}
            <Link
              href="/"
              target="_blank"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-lg text-slate-200 hover:text-white hover:bg-white/[0.06] transition-colors group"
            >
              <div className="flex items-center gap-2.5 truncate">
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors shrink-0" />
                <span>Customer Store</span>
              </div>
              <span className="text-slate-500 group-hover:text-slate-300 text-xs">↗</span>
            </Link>
          </div>

          {/* Separator */}
          <div className="my-1.5 h-px bg-white/[0.08] -mx-1" />

          {/* Sign Out Action */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-500/10 transition-colors cursor-pointer text-left group"
          >
            <LogOut className="w-4 h-4 text-rose-400 group-hover:text-rose-300 transition-colors shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
};
