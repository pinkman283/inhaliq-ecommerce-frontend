"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Package,
  MapPin,
  Tag,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

interface CustomerAccountDropdownProps {
  className?: string;
}

export const CustomerAccountDropdown: React.FC<CustomerAccountDropdownProps> = ({ className = "" }) => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
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

  if (!user) return null;

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    router.push("/");
  };

  const firstName = user.name?.trim().split(" ")[0] || "Account";
  const initials = user.name ? user.name.trim().slice(0, 1).toUpperCase() : "U";
  const isAdmin = user.role === "admin";

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button matching Untitled UI Account Card (md) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={`group flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-md border transition-all duration-150 cursor-pointer focus:outline-none select-none ${
          isOpen
            ? "bg-gray-100 dark:bg-white/[0.08] border-purple-500/60 dark:border-purple-500/60 ring-2 ring-purple-500/25 text-slate-900 dark:text-white"
            : "bg-gray-50/80 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border-gray-200 dark:border-white/10 text-slate-800 dark:text-slate-200"
        }`}
      >
        {/* Avatar with Status Indicator Dot */}
        <div className="relative shrink-0">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name || "Customer"}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-200 dark:ring-white/20 group-hover:ring-purple-500/40 transition-all"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-emerald-600/15 dark:bg-purple-600/20 text-emerald-700 dark:text-purple-300 ring-1 ring-emerald-600/30 dark:ring-purple-500/30 flex items-center justify-center font-black text-xs">
              {initials}
            </div>
          )}
          {/* Online Status Dot */}
          <span
            className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#090a0f]"
            title="Online"
          />
        </div>

        {/* Customer First Name */}
        <span className="hidden sm:inline text-xs font-semibold max-w-[110px] truncate">
          {firstName}
        </span>

        {/* Chevron Icon */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-purple-600 dark:text-purple-400" : ""
          }`}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl bg-white/98 dark:bg-[#0e121e]/98 backdrop-blur-xl border border-gray-200 dark:border-white/[0.1] shadow-2xl p-1.5 ring-1 ring-black/5 dark:ring-black/40 z-50 animate-in fade-in zoom-in-95 duration-100 text-slate-800 dark:text-slate-200 focus:outline-none"
        >
          {/* Header Card: Account Badge + Email */}
          <div className="p-3 bg-gray-50/80 dark:bg-white/[0.03] rounded-xl mb-1 border border-gray-100 dark:border-white/[0.05] flex items-start justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">{user.name}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 leading-tight">{user.email}</p>
            </div>
            <div className="shrink-0 pt-0.5">
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <ShieldCheck className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                  Admin Staff
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Member
                </span>
              )}
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-0.5">
            {/* 1. My Account */}
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors group"
            >
              <User className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-purple-400 transition-colors shrink-0" />
              <span>My Account</span>
            </Link>

            {/* 2. My Orders */}
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors group"
            >
              <Package className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-indigo-400 transition-colors shrink-0" />
              <span>My Orders</span>
            </Link>

            {/* 3. Saved Addresses */}
            <Link
              href="/dashboard/addresses"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors group"
            >
              <MapPin className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-cyan-400 transition-colors shrink-0" />
              <span>Saved Addresses</span>
            </Link>

            {/* 4. Coupons & Discounts */}
            <Link
              href="/dashboard/coupons"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors group"
            >
              <Tag className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-amber-400 transition-colors shrink-0" />
              <span>Coupons & Discounts</span>
            </Link>

            {/* 5. Conditional Admin Console Link */}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-lg text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <LayoutDashboard className="w-4 h-4 text-amber-600 dark:text-amber-400 transition-colors shrink-0" />
                  <span>Admin Console</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                  Staff
                </span>
              </Link>
            )}
          </div>

          {/* Separator */}
          <div className="my-1.5 h-px bg-gray-100 dark:bg-white/[0.08] -mx-1" />

          {/* Sign Out Action */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer text-left group"
          >
            <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400 group-hover:text-rose-700 dark:group-hover:text-rose-300 transition-colors shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
};
