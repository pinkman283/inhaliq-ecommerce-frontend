"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  Smartphone, 
  Save, 
  Sparkles, 
  Palette, 
  Layers, 
  Check, 
  RotateCcw, 
  Loader2, 
  ExternalLink,
  Sliders
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { PwaSettings } from "@/types";
import { SettingsNavTabs } from "@/components/admin/settings/SettingsNavTabs";
import { AdminPageHeader, AdminSaveBar } from "@/components/admin/ui";
import { ImageUploadGuidance } from "@/components/admin/ui/ImageUploadGuidance";
import { toast } from "sonner";

export default function AdminPwaSettingsPage() {
  const [pwa, setPwa] = useState<PwaSettings>({
    name: "AETHER Audio Labs",
    short_name: "AETHER",
    theme_color: "#090b10",
    background_color: "#07090e",
    display: "standalone",
    orientation: "portrait-primary",
    start_url: "/?pwa=1",
    scope: "/",
    icon_192: "/icons/icon-192x192.png",
    icon_512: "/icons/icon-512x512.png",
  });
  const [initialPwa, setInitialPwa] = useState<PwaSettings>({
    name: "AETHER Audio Labs",
    short_name: "AETHER",
    theme_color: "#090b10",
    background_color: "#07090e",
    display: "standalone",
    orientation: "portrait-primary",
    start_url: "/?pwa=1",
    scope: "/",
    icon_192: "/icons/icon-192x192.png",
    icon_512: "/icons/icon-512x512.png",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getExtendedSettings();
      if (res.pwa_manifest) {
        setPwa(res.pwa_manifest);
        setInitialPwa(res.pwa_manifest);
      }
    } catch (err) {
      toast.error("Failed to load PWA manifest settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isDirty = useMemo(() => {
    return JSON.stringify(pwa) !== JSON.stringify(initialPwa);
  }, [pwa, initialPwa]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleDiscard = () => {
    if (!isDirty) return;
    setPwa(initialPwa);
    toast.info("Unsaved PWA changes discarded.");
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isDirty || saving) return;
    setSaving(true);
    try {
      await adminApi.updateSettingsGroup("pwa_manifest", pwa);
      setInitialPwa(pwa);
      toast.success("PWA Manifest settings successfully saved.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save PWA manifest.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        title="Settings & System Studio"
        subtitle="Configure Progressive Web App (PWA) manifest tokens, splash screen branding, and installable app identity."
        breadcrumbs={[
          { label: "Settings", href: "/admin/settings" },
          { label: "PWA Studio", href: "/admin/settings/pwa" },
        ]}
      />

      <SettingsNavTabs />

      {loading ? (
        <div className="bg-[#0f121b] border border-white/[0.08] rounded-md p-8 space-y-4 animate-pulse">
          <div className="h-6 w-48 bg-[#161a26] rounded-md" />
          <div className="h-40 bg-[#161a26] rounded-md" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Controls */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#0f121b] border border-white/[0.08] rounded-md p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#A78BFA]" />
                  App Manifest Specifications
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Controls how your store presents itself when added to a user&apos;s home screen on iOS and Android devices.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Application Name</label>
                  <input
                    type="text"
                    value={pwa.name || ""}
                    onChange={(e) => setPwa({ ...pwa, name: e.target.value })}
                    placeholder="AETHER Audio Labs"
                    className="w-full bg-[#161a26] border border-white/10 rounded-md px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Short Name (App Icon Label)</label>
                  <input
                    type="text"
                    value={pwa.short_name || ""}
                    onChange={(e) => setPwa({ ...pwa, short_name: e.target.value })}
                    placeholder="AETHER"
                    className="w-full bg-[#161a26] border border-white/10 rounded-md px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Theme Color (Status Bar)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={pwa.theme_color || "#090b10"}
                      onChange={(e) => setPwa({ ...pwa, theme_color: e.target.value })}
                      className="w-8 h-8 rounded-md bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={pwa.theme_color || "#090b10"}
                      onChange={(e) => setPwa({ ...pwa, theme_color: e.target.value })}
                      className="w-full bg-[#161a26] border border-white/10 rounded-md px-3.5 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Splash Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={pwa.background_color || "#07090e"}
                      onChange={(e) => setPwa({ ...pwa, background_color: e.target.value })}
                      className="w-8 h-8 rounded-md bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={pwa.background_color || "#07090e"}
                      onChange={(e) => setPwa({ ...pwa, background_color: e.target.value })}
                      className="w-full bg-[#161a26] border border-white/10 rounded-md px-3.5 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Display Mode</label>
                  <select
                    value={pwa.display || "standalone"}
                    onChange={(e) => setPwa({ ...pwa, display: e.target.value })}
                    className="w-full bg-[#161a26] border border-white/10 rounded-md px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#A78BFA]/50"
                  >
                    <option value="standalone">Standalone (App-like, hides browser UI)</option>
                    <option value="fullscreen">Fullscreen (Immersive kiosk)</option>
                    <option value="minimal-ui">Minimal UI</option>
                    <option value="browser">Browser Default</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Orientation</label>
                  <select
                    value={pwa.orientation || "portrait-primary"}
                    onChange={(e) => setPwa({ ...pwa, orientation: e.target.value })}
                    className="w-full bg-[#161a26] border border-white/10 rounded-md px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#A78BFA]/50"
                  >
                    <option value="portrait-primary">Portrait (Primary)</option>
                    <option value="landscape-primary">Landscape</option>
                    <option value="any">Auto Rotate (Any)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">192x192 Icon Path</label>
                    <ImageUploadGuidance slotKey="admin_pwa_192" imageUrl={pwa.icon_192} layout="inline" />
                  </div>
                  <input
                    type="text"
                    value={pwa.icon_192 || ""}
                    onChange={(e) => setPwa({ ...pwa, icon_192: e.target.value })}
                    placeholder="/icons/icon-192x192.png"
                    className="w-full bg-[#161a26] border border-white/10 rounded-md px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">512x512 High-Res Icon Path</label>
                    <ImageUploadGuidance slotKey="admin_pwa_512" imageUrl={pwa.icon_512} layout="inline" />
                  </div>
                  <input
                    type="text"
                    value={pwa.icon_512 || ""}
                    onChange={(e) => setPwa({ ...pwa, icon_512: e.target.value })}
                    placeholder="/icons/icon-512x512.png"
                    className="w-full bg-[#161a26] border border-white/10 rounded-md px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Mobile Home Screen Preview */}
          <div className="space-y-4">
            <div className="bg-[#0f121b] border border-white/[0.08] rounded-md p-5 space-y-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 border-b border-white/[0.06] pb-3">
                <Smartphone className="w-3.5 h-3.5 text-[#A78BFA]" />
                Home Screen App Icon Simulator
              </span>

              <div className="p-6 bg-[#07090e] rounded-md border border-white/5 flex flex-col items-center justify-center gap-3">
                <div 
                  className="w-16 h-16 rounded-md flex items-center justify-center text-white font-bold text-lg shadow-xl shadow-black/60 border border-white/10"
                  style={{ backgroundColor: pwa.theme_color || "#090b10" }}
                >
                  <Sparkles className="w-8 h-8 text-[#A78BFA]" />
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-white tracking-wide">
                    {pwa.short_name || "AETHER"}
                  </div>
                  <span className="text-[10px] text-slate-500">Standalone Web App</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 text-[11px] text-slate-400">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span>Scope URL:</span>
                  <span className="font-mono text-slate-300">{pwa.scope || "/"}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span>Display:</span>
                  <span className="font-mono text-[#A78BFA] capitalize">{pwa.display || "standalone"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Theme:</span>
                  <span className="font-mono text-slate-300">{pwa.theme_color}</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Floating Contextual Unsaved Changes Dock */}
      <AdminSaveBar
        isDirty={isDirty}
        isSaving={saving}
        onSave={handleSave}
        onDiscard={handleDiscard}
        saveLabel="Save PWA Manifest"
        discardLabel="Discard"
        message="Unsaved PWA settings"
      />
    </div>
  );
}
