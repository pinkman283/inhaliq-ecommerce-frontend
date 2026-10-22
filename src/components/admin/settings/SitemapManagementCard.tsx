"use client";

import React, { useState, useEffect } from "react";
import { 
  FileCode2, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw, 
  Globe, 
  ShoppingBag, 
  Layers, 
  Tag, 
  BookOpen, 
  Search
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { toast } from "sonner";

interface SitemapManagementCardProps {
  canonicalBaseUrl?: string;
  className?: string;
}

export function SitemapManagementCard({ 
  canonicalBaseUrl,
  className = "" 
}: SitemapManagementCardProps) {
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [sitemapStats, setSitemapStats] = useState<{
    total?: number;
    products?: number;
    categories?: number;
    brands?: number;
    posts?: number;
    pages?: number;
  } | null>(null);

  // Determine the active sitemap URL
  const publicBaseUrl = (canonicalBaseUrl || (typeof window !== "undefined" ? window.location.origin : "https://inhaliq.com")).replace(/\/+$/, "");
  const sitemapUrl = `${publicBaseUrl}/sitemap.xml`;

  // Initial stats fetch
  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        const res = await adminApi.generateSitemap();
        if (isMounted && res) {
          setSitemapStats({
            total: res.total_urls,
            products: (res as any)?.counts?.products,
            categories: (res as any)?.counts?.categories,
            brands: (res as any)?.counts?.brands,
            posts: (res as any)?.counts?.posts,
            pages: (res as any)?.counts?.pages,
          });
          setLastSynced(new Date(res.generated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        }
      } catch (e) {
        // Fallback silently if offline
      }
    }
    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(sitemapUrl);
    setCopied(true);
    toast.success("Sitemap URL copied! Paste into Google Search Console.");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRevalidateSitemap = async () => {
    setIsSyncing(true);
    try {
      // Trigger backend sitemap re-generation
      const res = await adminApi.generateSitemap();
      
      // Refresh local state
      setSitemapStats({
        total: res.total_urls,
        products: (res as any)?.counts?.products,
        categories: (res as any)?.counts?.categories,
        brands: (res as any)?.counts?.brands,
        posts: (res as any)?.counts?.posts,
        pages: (res as any)?.counts?.pages,
      });
      setLastSynced("Just now");

      toast.success(
        `Dynamic sitemap successfully re-synced! ${res.total_urls} live URLs ready for search engines.`
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to revalidate sitemap.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className={`bg-[#0f121b] border border-white/[0.08] rounded-md p-5 sm:p-6 space-y-5 transition-all ${className}`}>
      {/* Header with Live Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <FileCode2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Dynamic XML Sitemap &amp; Indexing
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Live Auto-Sync Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automatically scans active products, categories, brands &amp; blog articles in real-time.
            </p>
          </div>
        </div>

        {lastSynced && (
          <span className="text-[11px] text-slate-500 font-mono self-start sm:self-center">
            Last verified: <strong className="text-slate-300 font-medium">{lastSynced}</strong>
          </span>
        )}
      </div>

      {/* URL Display with Copy & View Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#161a26] border border-white/[0.08] rounded-md p-2 sm:p-2.5">
        <div className="flex-1 min-w-0 px-2 py-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">
            Public Sitemap XML
          </span>
          <span className="text-xs font-mono text-cyan-300 truncate block">
            {sitemapUrl}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors cursor-pointer"
            title="Copy Sitemap URL"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy URL</span>
              </>
            )}
          </button>

          <a
            href={sitemapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
            title="Open Live XML in new tab"
          >
            <span>View XML</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Breakdown Metrics Pills */}
      {sitemapStats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
          <div className="p-2.5 rounded-md bg-[#131622] border border-white/[0.05]">
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
              <ShoppingBag className="w-3 h-3 text-[#A78BFA]" /> Products
            </span>
            <span className="text-sm font-bold font-mono text-white">
              {sitemapStats.products ?? "500+"}
            </span>
          </div>

          <div className="p-2.5 rounded-md bg-[#131622] border border-white/[0.05]">
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
              <Layers className="w-3 h-3 text-cyan-400" /> Categories
            </span>
            <span className="text-sm font-bold font-mono text-white">
              {sitemapStats.categories ?? "All"}
            </span>
          </div>

          <div className="p-2.5 rounded-md bg-[#131622] border border-white/[0.05]">
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
              <Tag className="w-3 h-3 text-amber-400" /> Brands
            </span>
            <span className="text-sm font-bold font-mono text-white">
              {sitemapStats.brands ?? "All"}
            </span>
          </div>

          <div className="p-2.5 rounded-md bg-[#131622] border border-white/[0.05]">
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
              <BookOpen className="w-3 h-3 text-emerald-400" /> Blog
            </span>
            <span className="text-sm font-bold font-mono text-white">
              {sitemapStats.posts ?? "0"}
            </span>
          </div>

          <div className="p-2.5 rounded-md bg-[#131622] border border-white/[0.05] col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
              <Globe className="w-3 h-3 text-sky-400" /> Total URLs
            </span>
            <span className="text-sm font-bold font-mono text-emerald-400">
              {sitemapStats.total ?? "Active"}
            </span>
          </div>
        </div>
      )}

      {/* Action Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
        <button
          type="button"
          onClick={handleRevalidateSitemap}
          disabled={isSyncing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          <span>{isSyncing ? "Re-syncing Sitemap..." : "Re-generate & Revalidate Sitemap"}</span>
        </button>

        <a
          href="https://search.google.com/search-console/sitemaps"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors py-1"
        >
          <Search className="w-3.5 h-3.5 text-[#A78BFA]" />
          <span>Submit on Google Search Console</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
