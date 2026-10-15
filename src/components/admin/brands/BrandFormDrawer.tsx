/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { X, Upload, Trash2, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";
import { ImageUploadGuidance } from "@/components/admin/ui/ImageUploadGuidance";
import { optimizeImageForUpload } from "@/lib/imageOptimizer";
import { adminApi } from "@/lib/adminApi";
import { Brand } from "@/types";
import { toast } from "sonner";

export interface BrandFormData {
  name: string;
  description: string | null;
  logo: string | null;
  website: string | null;
  display_order: number;
  is_featured: boolean;
}

interface BrandFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  editingBrand: Brand | null;
  onSave: (data: BrandFormData) => Promise<void>;
  saving: boolean;
}

function BrandFormDrawerContent({
  onClose,
  editingBrand,
  onSave,
  saving,
}: Omit<BrandFormDrawerProps, "isOpen">) {
  const [name, setName] = useState(() => editingBrand?.name || "");
  const [description, setDescription] = useState(() => editingBrand?.description || "");
  const [logo, setLogo] = useState(() => editingBrand?.logo || "");
  const [website, setWebsite] = useState(() => editingBrand?.website || "");
  const [displayOrder, setDisplayOrder] = useState(() =>
    (editingBrand?.display_order ?? 0).toString()
  );
  const [isFeatured, setIsFeatured] = useState(() => editingBrand?.is_featured ?? true);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const isEditDirty = Boolean(
    editingBrand && (
      name.trim() !== (editingBrand.name || "").trim() ||
      description.trim() !== (editingBrand.description || "").trim() ||
      logo.trim() !== (editingBrand.logo || "").trim() ||
      website.trim() !== (editingBrand.website || "").trim() ||
      displayOrder !== (editingBrand.display_order ?? 0).toString() ||
      isFeatured !== (editingBrand.is_featured ?? false)
    )
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WEBP, GIF, AVIF).");
      return;
    }

    if (file.type === "image/svg+xml") {
      toast.error("SVG vector files are not supported. Please select a JPG, PNG, WEBP, or AVIF image.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Logo file size must be less than 20MB.");
      return;
    }

    setUploadingLogo(true);
    try {
      const fileToUpload = await optimizeImageForUpload(file, {
        maxDimension: 800,
        maxSizeBytes: 1 * 1024 * 1024,
        quality: 0.9,
      });

      const res = await adminApi.uploadBrandLogo(fileToUpload);
      setLogo(res.logo_url || res.image_url);
      toast.success("Brand logo uploaded successfully.");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: { logo?: string[] }; message?: string } } };
      const errMsg =
        axiosErr.response?.data?.errors?.logo?.[0] ||
        axiosErr.response?.data?.message ||
        "Failed to upload logo.";
      toast.error(errMsg);
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Brand name is required.");
      return;
    }

    if (editingBrand && !isEditDirty) {
      toast.info("No changes were made.");
      return;
    }

    await onSave({
      name: name.trim(),
      description: description.trim() || null,
      logo: logo.trim() || null,
      website: website.trim() || null,
      display_order: Number(displayOrder) || 0,
      is_featured: isFeatured,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
      {/* Compact Header: h-12 */}
      <div className="h-12 px-6 border-b border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0 pr-3">
          <SheetTitle className="text-xs font-semibold text-white tracking-wide shrink-0">
            {editingBrand ? "Edit Brand" : "New Brand"}
          </SheetTitle>
          {editingBrand && (
            <>
              <span className="text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded shrink-0">
                #{editingBrand.id}
              </span>
              <span className="text-slate-600 text-xs shrink-0">·</span>
              <span className="text-xs text-slate-400 truncate max-w-[220px]">
                {editingBrand.name}
              </span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable un-boxed form canvas */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">
            Brand Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sennheiser, Focal, AETHER Studio"
            className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none transition"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Website URL (Optional)</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://manufacturer.com"
            className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none transition"
          />
        </div>

        {/* Logo Upload & Management Section */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-300">Brand Logo</label>
              <ImageUploadGuidance slotKey="admin_brand_logo" imageUrl={logo} layout="inline" />
            </div>
            {logo && (
              <button
                type="button"
                onClick={() => setLogo("")}
                className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition cursor-pointer"
                title="Remove current logo"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove Logo</span>
              </button>
            )}
          </div>

          {/* Minimal Logo Preview if logo exists */}
          {logo && (
            <div className="relative rounded-md overflow-hidden border border-white/10 bg-slate-950 h-28 flex items-center justify-center p-2 group">
              <img
                src={logo}
                alt={name || "Brand Logo Preview"}
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                <label className="px-2.5 py-1.5 rounded-md bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold backdrop-blur-sm cursor-pointer flex items-center gap-1.5 transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Change</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/avif"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploadingLogo}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setLogo("")}
                  className="px-2.5 py-1.5 rounded-md bg-rose-500/80 hover:bg-rose-600 text-white text-[11px] font-bold backdrop-blur-sm cursor-pointer flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          )}

          {/* Direct Upload Button & Fallback URL input */}
          <div className="flex items-center gap-2">
            <label className="h-9 px-3 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0">
              {uploadingLogo ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>{uploadingLogo ? "Uploading..." : "Upload Device Logo"}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/avif"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploadingLogo}
              />
            </label>

            <input
              type="text"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="Or paste external logo URL..."
              className="flex-1 h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none transition min-w-0"
            />

            {logo && (
              <button
                type="button"
                onClick={() => setLogo("")}
                className="h-9 px-2.5 rounded-md border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition flex items-center justify-center shrink-0 cursor-pointer"
                title="Remove current logo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Description (Optional)</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brand acoustic philosophy, background, and origin..."
            className="w-full rounded-md border border-white/10 bg-[#131722] p-3 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none transition resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Display Order</label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none transition"
            />
          </div>

          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-xs font-medium">
              <AdminCheckbox
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              <span>Featured Tier</span>
            </label>
          </div>
        </div>
      </div>

      {/* Compact Footer: h-12 */}
      <div className="h-12 px-6 border-t border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-medium text-slate-400 hover:text-white transition px-1 py-1 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || (editingBrand ? !isEditDirty : false)}
          className={`h-8 px-4 rounded-md text-xs font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm ${
            editingBrand && !isEditDirty
              ? "bg-white/10 text-slate-500 cursor-not-allowed border border-white/5"
              : "bg-cyan-400 hover:bg-cyan-300 text-slate-950"
          }`}
        >
          {saving && <Loader2 className="w-3 h-3 animate-spin" />}
          <span>{saving ? "Saving..." : editingBrand ? "Save Changes" : "Create Brand"}</span>
        </button>
      </div>
    </form>
  );
}

export function BrandFormDrawer({
  isOpen,
  onClose,
  editingBrand,
  onSave,
  saving,
}: BrandFormDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:w-[520px] md:w-[560px] sm:!max-w-[560px] max-w-full bg-[#0b0e17] border-l border-white/[0.08] p-0 flex flex-col justify-between shadow-2xl text-slate-100 overflow-hidden"
      >
        {isOpen && (
          <BrandFormDrawerContent
            onClose={onClose}
            editingBrand={editingBrand}
            onSave={onSave}
            saving={saving}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
