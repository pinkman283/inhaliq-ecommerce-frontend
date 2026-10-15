"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  Store,
  Save,
  Upload,
  Image as ImageIcon,
  Trash2,
  Loader2,
  Plus,
  AlertTriangle,
  Globe,
  X,
  Layers,
  Check,
  RotateCcw,
  ChevronRight,
  Sparkles,
  Smartphone,
  FileText,
  ShieldCheck,
  Split,
  Edit2,
  ExternalLink,
  CheckCircle2,
  Eye,
  Info
} from "lucide-react";
import {
  brandingService,
  BrandLogo,
  PlacementOption,
} from "@/services/brandingService";
import {
  useThemeStore,
  DEFAULT_THEME_SETTINGS,
  resolveLogo,
} from "@/store/useThemeStore";
import { AdminSaveBar } from "@/components/admin/ui/AdminSaveBar";
import { toast } from "sonner";

const DEFAULT_PLACEMENTS: PlacementOption[] = [
  { id: "navbar", label: "Desktop Navbar", description: "Main navigation header on desktop screens (≥640px)", recommended: "400 × 400 px · 1:1" },
  { id: "mobile_navbar", label: "Mobile Navbar", description: "Compact navigation header on mobile devices (<640px)", recommended: "320 × 320 px · 1:1" },
  { id: "footer", label: "Storefront Footer", description: "Bottom branding emblem and copyright section", recommended: "500 × 500 px · 1:1" },
  { id: "auth", label: "Customer Auth", description: "Customer authentication cards on /login and /signup", recommended: "400 × 400 px · 1:1" },
  { id: "invoice", label: "Invoices & Receipts", description: "Order confirmation invoices and printable receipts", recommended: "600 × 200 px · 3:1" },
  { id: "split_reveal", label: "Splash / Split Screen", description: "Centered split shutter reveal on homepage entrance", recommended: "512 × 512 px · 1:1" },
];

function BrandingStudioContent() {
  const { theme, setTheme: updateClientTheme } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Store Brand Identity State
  const [brandName, setBrandName] = useState(DEFAULT_THEME_SETTINGS.store_brand_name);
  const [brandTagline, setBrandTagline] = useState(DEFAULT_THEME_SETTINGS.store_brand_tagline);
  const [initialIdentity, setInitialIdentity] = useState({ name: "", tagline: "" });

  // Favicon State
  const [faviconUrl, setFaviconUrl] = useState("");
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [showRemoveFaviconModal, setShowRemoveFaviconModal] = useState(false);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // Brand Logos & Placements State
  const [logos, setLogos] = useState<BrandLogo[]>([]);
  const [savedLogos, setSavedLogos] = useState<BrandLogo[]>([]);
  const [availablePlacements, setAvailablePlacements] = useState<PlacementOption[]>(DEFAULT_PLACEMENTS);
  const [replacingLogoId, setReplacingLogoId] = useState<number | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // Add Logo Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLogoName, setNewLogoName] = useState("");
  const [newLogoUrl, setNewLogoUrl] = useState("");
  const [newLogoPlacements, setNewLogoPlacements] = useState<string[]>([]);
  const [creatingLogo, setCreatingLogo] = useState(false);
  const [uploadingNewLogo, setUploadingNewLogo] = useState(false);
  const newLogoFileRef = useRef<HTMLInputElement>(null);

  // Edit Logo Name State
  const [editingLogoId, setEditingLogoId] = useState<number | null>(null);
  const [editingLogoName, setEditingLogoName] = useState("");

  // Delete Confirmation Modal State
  const [deletingLogo, setDeletingLogo] = useState<BrandLogo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch initial branding settings
  async function loadData() {
    try {
      setLoading(true);
      const data = await brandingService.getBrandingData();

      // Brand Identity from theme store or API
      const s = theme || DEFAULT_THEME_SETTINGS;
      const initialName = s.store_brand_name || DEFAULT_THEME_SETTINGS.store_brand_name;
      const initialTagline = s.store_brand_tagline || DEFAULT_THEME_SETTINGS.store_brand_tagline;

      setBrandName(initialName);
      setBrandTagline(initialTagline);
      setInitialIdentity({ name: initialName, tagline: initialTagline });

      setFaviconUrl(data.favicon || s.store_favicon || "");

      const resolvedLogos: BrandLogo[] = (data.logos && data.logos.length > 0)
        ? data.logos
        : (s.store_brand_logo ? [{
            id: 1,
            name: "Primary Store Logo",
            image_url: s.store_brand_logo,
            is_active: true,
            placements: [
              { id: 1, logo_id: 1, placement: "navbar" },
              { id: 2, logo_id: 1, placement: "footer" },
              { id: 3, logo_id: 1, placement: "split_reveal" },
            ],
          }] : []);

      setLogos(resolvedLogos);
      setSavedLogos(JSON.parse(JSON.stringify(resolvedLogos)));

      if (data.available_placements && data.available_placements.length > 0) {
        setAvailablePlacements(data.available_placements);
      }
    } catch (err: any) {
      console.error("Failed to load branding data:", err);
      toast.error("Failed to load branding assets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Helper to get placement keys for a logo
  const getLogoPlacements = (logo: BrandLogo): string[] => {
    return (logo.placements || []).map((p) => (typeof p === "string" ? p : p.placement));
  };

  // Fingerprint for dirty checking placements
  const getPlacementsFingerprint = (list: BrandLogo[]) => {
    return list
      .map((l) => ({
        id: l.id,
        placements: getLogoPlacements(l).slice().sort(),
      }))
      .sort((a, b) => a.id - b.id);
  };

  const isPlacementsDirty = useMemo(() => {
    return JSON.stringify(getPlacementsFingerprint(logos)) !== JSON.stringify(getPlacementsFingerprint(savedLogos));
  }, [logos, savedLogos]);

  const isIdentityDirty =
    brandName.trim() !== initialIdentity.name.trim() ||
    brandTagline.trim() !== initialIdentity.tagline.trim();

  const isDirty = isPlacementsDirty || isIdentityDirty;

  // Unload prevention
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

  // Assign a placement to a target logo (and unassign from others to enforce 1-to-1 surface placement)
  const handleAssignPlacement = (placementKey: string, targetLogoId: number | null) => {
    setLogos((prevLogos) =>
      prevLogos.map((logo) => {
        const currentPlacements = getLogoPlacements(logo);
        if (targetLogoId !== null && logo.id === targetLogoId) {
          // Add placement to this logo if not present
          if (!currentPlacements.includes(placementKey)) {
            const next = [...currentPlacements, placementKey];
            return {
              ...logo,
              placements: next.map((p, idx) => ({ id: idx + 1, logo_id: logo.id, placement: p })),
            };
          }
          return logo;
        } else {
          // Remove this placement from any other logo
          if (currentPlacements.includes(placementKey)) {
            const next = currentPlacements.filter((p) => p !== placementKey);
            return {
              ...logo,
              placements: next.map((p, idx) => ({ id: idx + 1, logo_id: logo.id, placement: p })),
            };
          }
          return logo;
        }
      })
    );
  };

  // Favicon Upload Handler
  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Favicon must be less than 2MB.");
      return;
    }

    setUploadingFavicon(true);
    try {
      const uploadRes = await brandingService.uploadAsset(file);
      await brandingService.updateFavicon(uploadRes.image_url);
      setFaviconUrl(uploadRes.image_url);
      updateClientTheme({ store_favicon: uploadRes.image_url });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("store_favicon_updated", { detail: uploadRes.image_url }));
      }
      toast.success("Favicon updated successfully!");
    } catch (err: any) {
      console.error("Favicon upload failed:", err);
      toast.error(err?.response?.data?.message || "Failed to upload favicon.");
    } finally {
      setUploadingFavicon(false);
      if (faviconInputRef.current) faviconInputRef.current.value = "";
    }
  };

  // Remove Favicon Handler
  const handleRemoveFavicon = async () => {
    try {
      await brandingService.removeFavicon();
      setFaviconUrl("");
      updateClientTheme({ store_favicon: "" });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("store_favicon_updated", { detail: "" }));
      }
      setShowRemoveFaviconModal(false);
      toast.info("Favicon removed. Default browser icon restored.");
    } catch (err: any) {
      console.error("Remove favicon failed:", err);
      toast.error(err?.response?.data?.message || "Failed to remove favicon.");
    }
  };

  // Replace Logo Image File
  const handleReplaceLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || replacingLogoId === null) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Logo file must be less than 10MB.");
      return;
    }

    try {
      const uploadRes = await brandingService.uploadAsset(file);
      const targetLogo = logos.find((l) => l.id === replacingLogoId);
      if (!targetLogo) return;

      const updated = await brandingService.updateLogo(replacingLogoId, {
        name: targetLogo.name || undefined,
        image_url: uploadRes.image_url,
        placements: getLogoPlacements(targetLogo),
      });

      setLogos((prev) =>
        prev.map((l) => (l.id === replacingLogoId ? { ...l, image_url: uploadRes.image_url } : l))
      );
      setSavedLogos((prev) =>
        prev.map((l) => (l.id === replacingLogoId ? { ...l, image_url: uploadRes.image_url } : l))
      );

      // If active on navbar, update client theme
      if (getLogoPlacements(targetLogo).includes("navbar")) {
        updateClientTheme({ store_brand_logo: uploadRes.image_url });
      }

      toast.success("Logo image replaced successfully!");
    } catch (err: any) {
      console.error("Replace logo failed:", err);
      toast.error(err?.response?.data?.message || "Failed to replace logo image.");
    } finally {
      setReplacingLogoId(null);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";
    }
  };

  // Save Logo Name Inline Edit
  const handleSaveLogoName = async (logoId: number) => {
    if (!editingLogoName.trim()) {
      setEditingLogoId(null);
      return;
    }

    try {
      const targetLogo = logos.find((l) => l.id === logoId);
      if (!targetLogo) return;

      await brandingService.updateLogo(logoId, {
        name: editingLogoName.trim(),
        image_url: targetLogo.image_url,
        placements: getLogoPlacements(targetLogo),
      });

      setLogos((prev) =>
        prev.map((l) => (l.id === logoId ? { ...l, name: editingLogoName.trim() } : l))
      );
      setSavedLogos((prev) =>
        prev.map((l) => (l.id === logoId ? { ...l, name: editingLogoName.trim() } : l))
      );
      toast.success("Logo name updated.");
    } catch (err: any) {
      console.error("Update logo name failed:", err);
      toast.error(err?.response?.data?.message || "Failed to update logo name.");
    } finally {
      setEditingLogoId(null);
      setEditingLogoName("");
    }
  };

  // Delete Logo Handler
  const handleDeleteLogo = async () => {
    if (!deletingLogo) return;

    if (logos.length <= 1) {
      toast.error("You must keep at least one brand logo. Replace it instead of deleting.");
      setDeletingLogo(null);
      return;
    }

    try {
      setIsDeleting(true);
      await brandingService.deleteLogo(deletingLogo.id);

      const refreshed = await brandingService.getBrandingData();
      setLogos(refreshed.logos || []);
      setSavedLogos(refreshed.logos || []);

      toast.success("Brand logo deleted successfully.");
    } catch (err: any) {
      console.error("Delete logo failed:", err);
      toast.error(err?.response?.data?.message || "Failed to delete brand logo.");
    } finally {
      setIsDeleting(false);
      setDeletingLogo(null);
    }
  };

  // Upload New Logo in Add Modal
  const handleNewLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB.");
      return;
    }

    setUploadingNewLogo(true);
    try {
      const uploadRes = await brandingService.uploadAsset(file);
      setNewLogoUrl(uploadRes.image_url);
      toast.success("Logo image uploaded successfully!");
    } catch (err: any) {
      console.error("Upload new logo failed:", err);
      toast.error(err?.response?.data?.message || "Failed to upload logo.");
    } finally {
      setUploadingNewLogo(false);
      if (newLogoFileRef.current) newLogoFileRef.current.value = "";
    }
  };

  // Create New Logo Handler
  const handleCreateLogo = async () => {
    if (!newLogoUrl.trim()) {
      toast.error("Please upload an image for the new logo.");
      return;
    }

    setCreatingLogo(true);
    try {
      await brandingService.createLogo({
        name: newLogoName.trim() || undefined,
        image_url: newLogoUrl.trim(),
        placements: newLogoPlacements,
      });

      const refreshed = await brandingService.getBrandingData();
      setLogos(refreshed.logos || []);
      setSavedLogos(refreshed.logos || []);

      setShowAddModal(false);
      setNewLogoName("");
      setNewLogoUrl("");
      setNewLogoPlacements([]);
      toast.success("New brand logo created successfully!");
    } catch (err: any) {
      console.error("Create logo failed:", err);
      toast.error(err?.response?.data?.message || "Failed to create brand logo.");
    } finally {
      setCreatingLogo(false);
    }
  };

  // Discard all unstaged changes
  const handleDiscardAll = () => {
    if (!isDirty) return;
    setLogos(JSON.parse(JSON.stringify(savedLogos)));
    setBrandName(initialIdentity.name);
    setBrandTagline(initialIdentity.tagline);
    toast.info("Unsaved changes discarded.");
  };

  // Save All Changes (Identity + Placements)
  const handleSaveAll = async () => {
    if (!isDirty || saving) return;

    setSaving(true);
    try {
      const promises: Promise<any>[] = [];

      // 1. Save Placements if modified
      if (isPlacementsDirty) {
        const batchPayload = logos.map((l) => ({
          logo_id: l.id,
          placements: getLogoPlacements(l),
        }));
        promises.push(brandingService.batchUpdatePlacements(batchPayload));
      }

      // 2. Save Identity if modified
      if (isIdentityDirty) {
        promises.push(
          brandingService.updateStoreIdentity({
            store_brand_name: brandName.trim(),
            store_brand_tagline: brandTagline.trim(),
          })
        );
      }

      await Promise.all(promises);

      // Synchronize client-side Zustand store
      const navLogo = logos.find((l) => getLogoPlacements(l).includes("navbar"));
      const splitLogo = logos.find((l) => getLogoPlacements(l).includes("split_reveal"));
      const themeUpdates: Record<string, string> = {
        store_brand_name: brandName.trim(),
        store_brand_tagline: brandTagline.trim(),
      };
      if (navLogo) themeUpdates.store_brand_logo = navLogo.image_url;
      if (splitLogo) themeUpdates.split_reveal_logo = splitLogo.image_url;

      updateClientTheme(themeUpdates);

      setSavedLogos(JSON.parse(JSON.stringify(logos)));
      setInitialIdentity({ name: brandName.trim(), tagline: brandTagline.trim() });

      toast.success("Branding and placements saved successfully!");
    } catch (err: any) {
      console.error("Save branding failed:", err);
      toast.error(err?.response?.data?.message || "Failed to save branding settings.");
    } finally {
      setSaving(false);
    }
  };

  // Active logos by placement
  const desktopLogo = useMemo(() => {
    return logos.find((l) => getLogoPlacements(l).includes("navbar")) || logos[0];
  }, [logos]);

  const mobileLogo = useMemo(() => {
    return logos.find((l) => getLogoPlacements(l).includes("mobile_navbar")) || desktopLogo;
  }, [logos, desktopLogo]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm font-medium text-slate-400">Loading Branding Studio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 max-w-6xl">
      {/* Hidden file input for Replace action */}
      <input
        type="file"
        ref={replaceFileInputRef}
        accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
        onChange={handleReplaceLogoFile}
        className="hidden"
      />

      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
            <Link href="/admin" className="hover:text-slate-300 transition-colors">Admin</Link>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-slate-400">Content / CMS</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-cyan-400 font-medium">Branding Studio</span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Branding Studio</h1>
              <p className="text-xs text-slate-400">
                Visual brand marks, desktop & mobile logos, browser favicon, and storefront placement mapping
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Add Logo</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all shadow-md cursor-pointer ${
              isDirty
                ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:from-cyan-400 hover:to-indigo-500 shadow-cyan-500/20"
                : "bg-white/10 text-slate-300 hover:bg-white/15"
            }`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? "Saving..." : isDirty ? "Save Changes" : "Saved"}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Brand Identity */}
      <div className="p-5 rounded-md bg-[#0f121a]/80 border border-white/10 backdrop-blur-md space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Store Brand Identity</span>
          </h2>
          <p className="text-xs text-slate-400">
            Global store brand name and signature tagline used across SEO tags, emails, and legal pages.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="text-xs font-bold text-slate-300 mb-1.5 block">Store Brand Name</label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. INHALIQ"
              className="w-full px-3.5 py-2.5 rounded-md bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 mb-1.5 block">Brand Tagline / Slogan</label>
            <input
              type="text"
              value={brandTagline}
              onChange={(e) => setBrandTagline(e.target.value)}
              placeholder="e.g. ELEVATE EVERY INHALE"
              className="w-full px-3.5 py-2.5 rounded-md bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Key Visual Assets (Desktop Logo, Mobile Logo, Favicon) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Desktop Navbar Logo Card */}
        <div className="p-5 rounded-md bg-[#0f121a]/80 border border-white/10 backdrop-blur-md flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Store Logo</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Desktop
              </span>
            </div>

            {/* Preview Box */}
            <div className="h-32 rounded-md border border-white/10 bg-black/50 flex items-center justify-center p-4 relative group overflow-hidden">
              {desktopLogo?.image_url ? (
                <img
                  src={desktopLogo.image_url}
                  alt={desktopLogo.name || "Store Logo"}
                  className="max-h-full max-w-full object-contain drop-shadow"
                />
              ) : (
                <div className="text-center text-slate-500 text-xs">No Logo Set</div>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold text-white truncate">{desktopLogo?.name || "Primary Brand Mark"}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Used for main header & navigation</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => {
                if (desktopLogo) {
                  setReplacingLogoId(desktopLogo.id);
                  replaceFileInputRef.current?.click();
                }
              }}
              className="flex-1 py-1.5 px-3 rounded-md bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Replace Image</span>
            </button>
          </div>
        </div>

        {/* Mobile Navbar Logo Card */}
        <div className="p-5 rounded-md bg-[#0f121a]/80 border border-white/10 backdrop-blur-md flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Mobile Branding</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Mobile
              </span>
            </div>

            {/* Preview Box */}
            <div className="h-32 rounded-md border border-white/10 bg-black/50 flex items-center justify-center p-4 relative group overflow-hidden">
              {mobileLogo?.image_url ? (
                <img
                  src={mobileLogo.image_url}
                  alt={mobileLogo.name || "Mobile Logo"}
                  className="max-h-full max-w-full object-contain drop-shadow"
                />
              ) : (
                <div className="text-center text-slate-500 text-xs">Falls back to desktop logo</div>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold text-white truncate">{mobileLogo?.name || "Mobile Header Mark"}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Used on mobile header viewports (&lt;640px)</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            <select
              value={logos.find((l) => getLogoPlacements(l).includes("mobile_navbar"))?.id || ""}
              onChange={(e) => {
                const targetId = e.target.value ? parseInt(e.target.value) : null;
                handleAssignPlacement("mobile_navbar", targetId);
              }}
              className="w-full px-2.5 py-1.5 rounded-md bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">Same as Desktop Logo (Fallback)</option>
              {logos.map((logo) => (
                <option key={logo.id} value={logo.id}>
                  {logo.name || `Logo #${logo.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Favicon Card */}
        <div className="p-5 rounded-md bg-[#0f121a]/80 border border-white/10 backdrop-blur-md flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Favicon</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30">
                Browser Tab
              </span>
            </div>

            {/* Browser Tab Mock Preview */}
            <div className="h-32 rounded-md border border-white/10 bg-black/50 flex flex-col justify-center px-4 py-2 space-y-2">
              <div className="p-2.5 rounded-md bg-[#1a1f2c] border border-white/10 flex items-center gap-2.5 shadow-md">
                {faviconUrl ? (
                  <img
                    src={faviconUrl}
                    alt="Favicon Preview"
                    className="w-4 h-4 object-contain rounded-sm shrink-0"
                  />
                ) : (
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className="text-[11px] font-medium text-slate-200 truncate">
                  {brandName || "My Store"} | Home
                </span>
                <span className="text-[10px] text-slate-500 ml-auto">✕</span>
              </div>
              <p className="text-[10px] text-slate-500 text-center">Simulated browser tab presentation</p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-white">Browser Tab Icon</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Recommended 32×32 or 64×64 PNG/ICO</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            <input
              type="file"
              ref={faviconInputRef}
              accept="image/x-icon,image/png,image/svg+xml,image/webp"
              onChange={handleFaviconUpload}
              className="hidden"
            />
            <button
              type="button"
              disabled={uploadingFavicon}
              onClick={() => faviconInputRef.current?.click()}
              className="flex-1 py-1.5 px-3 rounded-md bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {uploadingFavicon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span>{faviconUrl ? "Replace Favicon" : "Upload Favicon"}</span>
            </button>

            {faviconUrl && (
              <button
                type="button"
                onClick={() => setShowRemoveFaviconModal(true)}
                className="p-1.5 rounded-md bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 transition-all cursor-pointer"
                title="Remove Favicon"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: Surface Placements Mapping */}
      <div className="p-5 rounded-md bg-[#0f121a]/80 border border-white/10 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Logo Placements</span>
            </h2>
            <p className="text-xs text-slate-400">
              Assign specific brand marks to different storefront locations. Each surface uses exactly one logo mark.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{availablePlacements.length} Supported Surfaces</span>
          </div>
        </div>

        {/* Placements Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {availablePlacements.map((placement) => {
            const assignedLogo = logos.find((l) => getLogoPlacements(l).includes(placement.id));

            return (
              <div
                key={placement.id}
                className="p-4 rounded-md bg-white/[0.03] border border-white/10 flex flex-col justify-between space-y-3 hover:border-white/20 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{placement.label}</span>
                    <span className="text-[10px] font-mono text-slate-500">{placement.recommended}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{placement.description}</p>

                  {/* Surface Logo Preview */}
                  <div className="h-16 rounded-md bg-black/40 border border-white/10 flex items-center justify-center p-2">
                    {assignedLogo?.image_url ? (
                      <img
                        src={assignedLogo.image_url}
                        alt={assignedLogo.name || placement.label}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">No logo assigned</span>
                    )}
                  </div>
                </div>

                {/* Assignment Dropdown */}
                <div className="pt-2 border-t border-white/5">
                  <select
                    value={assignedLogo?.id || ""}
                    onChange={(e) => {
                      const targetId = e.target.value ? parseInt(e.target.value) : null;
                      handleAssignPlacement(placement.id, targetId);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-md bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {logos.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name || `Logo #${l.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: Available Brand Logos */}
      <div className="p-5 rounded-md bg-[#0f121a]/80 border border-white/10 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              <span>Available Brand Logos</span>
            </h2>
            <p className="text-xs text-slate-400">
              All stored logo variations. Click any logo to rename, replace its image, or reassign placements.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload New Logo</span>
          </button>
        </div>

        {/* Logos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-1">
          {logos.map((logo) => {
            const placements = getLogoPlacements(logo);
            const isEditingThis = editingLogoId === logo.id;

            return (
              <div
                key={logo.id}
                className="p-4 rounded-md bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-3">
                  {/* Image Display */}
                  <div className="h-28 rounded-md bg-black/60 border border-white/10 flex items-center justify-center p-3 relative overflow-hidden">
                    <img
                      src={logo.image_url}
                      alt={logo.name || `Logo #${logo.id}`}
                      className="max-h-full max-w-full object-contain drop-shadow"
                    />
                  </div>

                  {/* Name Edit */}
                  <div>
                    {isEditingThis ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          autoFocus
                          value={editingLogoName}
                          onChange={(e) => setEditingLogoName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveLogoName(logo.id);
                            if (e.key === "Escape") setEditingLogoId(null);
                          }}
                          className="flex-1 px-2 py-1 rounded bg-black/50 border border-cyan-500 text-xs text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveLogoName(logo.id)}
                          className="p-1 rounded bg-cyan-500 text-white"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-white truncate" title={logo.name || `Logo #${logo.id}`}>
                          {logo.name || `Logo #${logo.id}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLogoId(logo.id);
                            setEditingLogoName(logo.name || "");
                          }}
                          className="text-slate-500 hover:text-slate-300 p-0.5"
                          title="Rename logo"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Placement Badges */}
                  <div className="flex flex-wrap gap-1 min-h-[22px]">
                    {placements.length > 0 ? (
                      placements.map((p) => {
                        const label = availablePlacements.find((opt) => opt.id === p)?.label || p;
                        return (
                          <span
                            key={p}
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                          >
                            {label}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">Unassigned</span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-2.5 border-t border-white/5 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReplacingLogoId(logo.id);
                      replaceFileInputRef.current?.click();
                    }}
                    className="flex-1 py-1 px-2 rounded-md bg-white/5 hover:bg-white/10 text-[11px] font-medium text-slate-300 border border-white/10 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Replace</span>
                  </button>

                  <button
                    type="button"
                    disabled={logos.length <= 1}
                    onClick={() => setDeletingLogo(logo)}
                    className={`p-1.5 rounded-md border transition-all ${
                      logos.length <= 1
                        ? "opacity-30 cursor-not-allowed border-transparent text-slate-600"
                        : "bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border-white/10 hover:border-rose-500/30 cursor-pointer"
                    }`}
                    title={logos.length <= 1 ? "At least one logo must remain" : "Delete logo"}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Save Bar */}
      <AdminSaveBar
        isDirty={isDirty}
        isSaving={saving}
        onSave={handleSaveAll}
        onDiscard={handleDiscardAll}
        saveLabel="Save Branding"
        discardLabel="Discard"
      />

      {/* MODAL: Add New Logo */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="max-w-lg w-full p-6 rounded-lg bg-[#0f121a] border border-white/15 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Upload New Brand Logo</h3>
                  <p className="text-xs text-slate-400">Add a new logo asset and configure initial placements</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Logo Label / Name</label>
                <input
                  type="text"
                  value={newLogoName}
                  onChange={(e) => setNewLogoName(e.target.value)}
                  placeholder="e.g. Light Mode Navbar Mark"
                  className="w-full px-3.5 py-2.5 rounded-md bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Upload Zone */}
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Logo File</label>
                <input
                  type="file"
                  ref={newLogoFileRef}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                  onChange={handleNewLogoFileUpload}
                  className="hidden"
                />

                {newLogoUrl ? (
                  <div className="p-4 rounded-md bg-black/50 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-md bg-black/60 border border-white/10 flex items-center justify-center p-2">
                        <img src={newLogoUrl} alt="New Logo Preview" className="max-h-full max-w-full object-contain" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">Image uploaded</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-xs block">{newLogoUrl}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewLogoUrl("")}
                      className="p-1.5 rounded-md text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => newLogoFileRef.current?.click()}
                    className="border-2 border-dashed border-white/15 hover:border-cyan-500/50 rounded-md p-6 text-center cursor-pointer transition-all bg-white/[0.02] hover:bg-white/[0.04]"
                  >
                    {uploadingNewLogo ? (
                      <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <span className="text-xs font-semibold text-slate-200 block">Click to select logo file</span>
                        <span className="text-[11px] text-slate-500 block mt-1">PNG, JPG, SVG, WebP up to 10MB</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Initial Placements Assignment */}
              <div>
                <label className="text-xs font-bold text-slate-300 mb-2 block">Initial Placements (Optional)</label>
                <div className="grid grid-cols-2 gap-2">
                  {availablePlacements.map((p) => {
                    const isChecked = newLogoPlacements.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setNewLogoPlacements((prev) => prev.filter((id) => id !== p.id));
                          } else {
                            setNewLogoPlacements((prev) => [...prev, p.id]);
                          }
                        }}
                        className={`p-2.5 rounded-md border text-left text-xs transition-all flex items-center justify-between ${
                          isChecked
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                            : "bg-black/30 border-white/10 text-slate-400 hover:text-white"
                        }`}
                      >
                        <span className="font-medium truncate">{p.label}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 shrink-0 ml-1 text-cyan-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-md text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={creatingLogo || !newLogoUrl}
                onClick={handleCreateLogo}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-white disabled:opacity-40 transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                {creatingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>{creatingLogo ? "Creating..." : "Create Logo"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Delete Logo Confirmation */}
      {deletingLogo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="max-w-md w-full p-6 rounded-lg bg-[#0f121a] border border-white/15 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Brand Logo?</h3>
                <p className="text-xs text-slate-400">{deletingLogo.name || `Logo #${deletingLogo.id}`}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete this brand logo? Any storefront locations currently displaying this logo will become unassigned and fall back to the primary brand mark.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingLogo(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-md text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteLogo}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition-all shadow-lg shadow-rose-500/20 cursor-pointer"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{isDeleting ? "Deleting..." : "Yes, Delete Logo"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Remove Favicon Confirmation */}
      {showRemoveFaviconModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="max-w-md w-full p-6 rounded-lg bg-[#0f121a] border border-white/15 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Remove Store Favicon?</h3>
                <p className="text-xs text-slate-400">Restore default browser icon</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              The custom favicon file will be deleted and browsers will revert to displaying the default system icon.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRemoveFaviconModal(false)}
                className="px-4 py-2 rounded-md text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveFavicon}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition-all shadow-lg shadow-rose-500/20 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove Favicon</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminContentBrandingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      }
    >
      <BrandingStudioContent />
    </Suspense>
  );
}
