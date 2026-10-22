"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ShoppingBag, Search, HelpCircle, Package, Mail, BookOpen, ArrowRight } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`/products?search=${encodeURIComponent(query)}`);
    } else {
      router.push("/products");
    }
  };

  return (
    <div className="min-h-[72vh] flex items-center justify-center px-4 py-16 sm:py-24">
      <div className="max-w-xl w-full text-center space-y-8">
        
        {/* Subtle, Minimal Status Badge */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            404 Error • Page Not Found
          </span>
        </div>

        {/* Clean Typography */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Looking for something?
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
            The page you requested doesn't exist, has been relocated, or is no longer available. Let's get you back on track.
          </p>
        </div>

        {/* Quick Search Bar */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands, or categories..."
              className="w-full pl-10 pr-24 py-3 text-sm rounded-xl bg-white dark:bg-[#0e121e] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white/20 transition shadow-xs"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 text-xs font-semibold rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-950 hover:bg-gray-800 dark:hover:bg-gray-100 transition shadow-xs cursor-pointer"
            >
              Search
            </button>
          </div>
        </form>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-950 text-xs font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>

          <Link
            href="/products"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200/70 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span>Browse Products</span>
          </Link>
        </div>

        {/* Helpful Quick Links Cards */}
        <div className="pt-8 border-t border-gray-200 dark:border-white/10">
          <p className="text-xs uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-500 mb-4">
            Helpful Destinations
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <Link
              href="/track"
              className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/5 hover:border-gray-300 dark:hover:border-white/20 transition-all text-left group"
            >
              <Package className="w-4 h-4 text-gray-500 dark:text-gray-400 mb-2 group-hover:text-gray-900 dark:group-hover:text-white transition" />
              <div className="font-semibold text-gray-900 dark:text-white">Track Order</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Live status</div>
            </Link>

            <Link
              href="/blog"
              className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/5 hover:border-gray-300 dark:hover:border-white/20 transition-all text-left group"
            >
              <BookOpen className="w-4 h-4 text-gray-500 dark:text-gray-400 mb-2 group-hover:text-gray-900 dark:group-hover:text-white transition" />
              <div className="font-semibold text-gray-900 dark:text-white">Store Blog</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Guides & stories</div>
            </Link>

            <Link
              href="/faq"
              className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/5 hover:border-gray-300 dark:hover:border-white/20 transition-all text-left group"
            >
              <HelpCircle className="w-4 h-4 text-gray-500 dark:text-gray-400 mb-2 group-hover:text-gray-900 dark:group-hover:text-white transition" />
              <div className="font-semibold text-gray-900 dark:text-white">FAQ Center</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Common questions</div>
            </Link>

            <Link
              href="/contact"
              className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/5 hover:border-gray-300 dark:hover:border-white/20 transition-all text-left group"
            >
              <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400 mb-2 group-hover:text-gray-900 dark:group-hover:text-white transition" />
              <div className="font-semibold text-gray-900 dark:text-white">Support</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Get in touch</div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
