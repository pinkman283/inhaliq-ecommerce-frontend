"use client";

import React, { useEffect, useState } from "react";
import { 
  Cpu, 
  Trash2, 
  RefreshCw, 
  FileCode, 
  Check, 
  Server, 
  Activity, 
  Database, 
  HardDrive, 
  ExternalLink,
  Loader2,
  Sparkles
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { SettingsNavTabs } from "@/components/admin/settings/SettingsNavTabs";
import { AdminPageHeader } from "@/components/admin/ui";
import { toast } from "sonner";

export default function AdminSystemSettingsPage() {
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState<string | null>(null);
  const [generatingSitemap, setGeneratingSitemap] = useState(false);
  const [sitemapData, setSitemapData] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getExtendedSettings();
      setSystemInfo(res.system_info || null);
    } catch (err) {
      toast.error("Failed to load system diagnostics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClearCache = async (type: string = "all") => {
    setClearing(type);
    try {
      const res = await adminApi.clearSystemCache(type);
      toast.success(res.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to flush cache.");
    } finally {
      setClearing(null);
    }
  };

  const handleGenerateSitemap = async () => {
    setGeneratingSitemap(true);
    try {
      const res = await adminApi.generateSitemap();
      setSitemapData(res);
      toast.success(`Sitemap regenerated: ${res.total_urls} URLs indexed.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to generate sitemap.");
    } finally {
      setGeneratingSitemap(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        title="Settings & System Studio"
        subtitle="Manage runtime system caches, view server environment health, and generate dynamic sitemap XML."
        breadcrumbs={[
          { label: "Settings", href: "/admin/settings" },
          { label: "System & Cache", href: "/admin/settings/system" },
        ]}
        actions={
          <button
            onClick={() => handleClearCache("all")}
            disabled={clearing !== null}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {clearing === "all" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>Flush All Caches</span>
          </button>
        }
      />

      <SettingsNavTabs />

      {/* Server Environment Health Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#0f121b] border border-white/[0.08] rounded-2xl p-4">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
            PHP Version
          </span>
          <span className="text-sm font-mono font-bold text-amber-400">
            {systemInfo?.php_version || "8.2+"}
          </span>
        </div>

        <div className="bg-[#0f121b] border border-white/[0.08] rounded-2xl p-4">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
            Laravel Core
          </span>
          <span className="text-sm font-mono font-bold text-white">
            {systemInfo?.laravel_version || "11.x"}
          </span>
        </div>

        <div className="bg-[#0f121b] border border-white/[0.08] rounded-2xl p-4">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
            Environment
          </span>
          <span className="text-sm font-mono font-bold text-emerald-400 capitalize">
            {systemInfo?.environment || "local"}
          </span>
        </div>

        <div className="bg-[#0f121b] border border-white/[0.08] rounded-2xl p-4">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
            Cache Store
          </span>
          <span className="text-sm font-mono font-bold text-sky-400 uppercase">
            {systemInfo?.cache_driver || "file"}
          </span>
        </div>

        <div className="bg-[#0f121b] border border-white/[0.08] rounded-2xl p-4">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
            Database
          </span>
          <span className="text-sm font-mono font-bold text-purple-400 uppercase">
            {systemInfo?.database_driver || "sqlite"}
          </span>
        </div>

        <div className="bg-[#0f121b] border border-white/[0.08] rounded-2xl p-4">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
            Daemon Health
          </span>
          <span className="text-sm font-mono font-bold text-emerald-400">
            Operational
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cache Flusher */}
        <div className="bg-[#0f121b] border border-white/[0.08] rounded-2xl p-6 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              Operational Cache Revalidation & Flusher
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Purge compiled routes, config files, and cached database queries when updating production code or schemas.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-[#161a26] rounded-xl border border-white/5">
              <div>
                <span className="text-xs font-semibold text-white block">Application Cache</span>
                <span className="text-[11px] text-slate-400">Cached queries and transient session data</span>
              </div>
              <button
                onClick={() => handleClearCache("cache")}
                disabled={clearing === "cache"}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 cursor-pointer"
              >
                {clearing === "cache" ? "Clearing..." : "Clear Cache"}
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#161a26] rounded-xl border border-white/5">
              <div>
                <span className="text-xs font-semibold text-white block">Configuration Cache</span>
                <span className="text-[11px] text-slate-400">Environment variables and config arrays</span>
              </div>
              <button
                onClick={() => handleClearCache("config")}
                disabled={clearing === "config"}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 cursor-pointer"
              >
                {clearing === "config" ? "Clearing..." : "Clear Config"}
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#161a26] rounded-xl border border-white/5">
              <div>
                <span className="text-xs font-semibold text-white block">Route Cache</span>
                <span className="text-[11px] text-slate-400">Compiled route registration map</span>
              </div>
              <button
                onClick={() => handleClearCache("route")}
                disabled={clearing === "route"}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 cursor-pointer"
              >
                {clearing === "route" ? "Clearing..." : "Clear Routes"}
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#161a26] rounded-xl border border-white/5">
              <div>
                <span className="text-xs font-semibold text-white block">Compiled Blade Views</span>
                <span className="text-[11px] text-slate-400">Pre-rendered view templates</span>
              </div>
              <button
                onClick={() => handleClearCache("view")}
                disabled={clearing === "view"}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 cursor-pointer"
              >
                {clearing === "view" ? "Clearing..." : "Clear Views"}
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Sitemap Generator */}
        <div className="bg-[#0f121b] border border-white/[0.08] rounded-2xl p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                Dynamic XML Sitemap Generator
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically scans active products, categories, blog posts, and CMS static pages into standard search sitemap format.
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#161a26] rounded-xl border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white block">Public Sitemap Endpoint</span>
                <span className="text-[11px] font-mono text-slate-400">/api/sitemap.xml</span>
              </div>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"}/sitemap.xml`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
              >
                <span>View XML</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <button
              onClick={handleGenerateSitemap}
              disabled={generatingSitemap}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {generatingSitemap ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>Regenerate & Inspect Sitemap Index</span>
            </button>
          </div>

          {/* Sample Entries Box */}
          {sitemapData && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">
                  Total Indexed URLs: <span className="text-emerald-400 font-mono">{sitemapData.total_urls}</span>
                </span>
                <span className="text-[10px] text-slate-500">
                  {new Date(sitemapData.generated_at).toLocaleTimeString()}
                </span>
              </div>

              <div className="max-h-44 overflow-y-auto bg-black/40 rounded-xl p-3 border border-white/5 space-y-1 font-mono text-[11px] text-slate-400 no-scrollbar">
                {sitemapData.entries_sample?.map((e: any, idx: number) => (
                  <div key={idx} className="truncate hover:text-white transition-colors">
                    <span className="text-amber-400 mr-2">[{e.priority}]</span>
                    <span>{e.loc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
