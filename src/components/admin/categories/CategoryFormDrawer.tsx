/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Upload,
  Trash2,
  Loader2,
  Search,
  AlertCircle,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";
import { ImageUploadGuidance } from "@/components/admin/ui/ImageUploadGuidance";
import { optimizeImageForUpload } from "@/lib/imageOptimizer";
import { adminApi } from "@/lib/adminApi";
import { Category } from "@/types";
import { toast } from "sonner";

export interface CategoryFormData {
  parent_id: number | null;
  name: string;
  description: string;
  image: string | null;
  icon?: string;
  badge: string | null;
  display_order: number;
  is_featured: boolean;
  meta_title: string | null;
  meta_description: string | null;
  image_alt: string | null;
}

interface CategoryFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory: Category | null;
  defaultParentId?: number | null;
  categories: Category[];
  getCategoryLevel: (cat: Category) => number;
  onSave: (data: CategoryFormData) => Promise<void>;
  saving: boolean;
}

function CategoryFormDrawerContent({
  onClose,
  editingCategory,
  defaultParentId = null,
  categories,
  getCategoryLevel,
  onSave,
  saving,
}: Omit<CategoryFormDrawerProps, "isOpen">) {
  const [parentId, setParentId] = useState<number | null>(() =>
    editingCategory ? editingCategory.parent_id ?? null : defaultParentId ?? null
  );
  const [name, setName] = useState(() => editingCategory?.name || "");
  const [description, setDescription] = useState(() => editingCategory?.description || "");
  const [image, setImage] = useState(() => editingCategory?.image || "");
  const [icon] = useState(() => editingCategory?.icon || "Sparkles");
  const [badge, setBadge] = useState(() =>
    editingCategory ? editingCategory.badge || "" : defaultParentId ? "" : "Flagship Line"
  );
  const [displayOrder, setDisplayOrder] = useState(() =>
    editingCategory ? (editingCategory.display_order ?? 0).toString() : "0"
  );
  const [isFeatured, setIsFeatured] = useState(() => editingCategory?.is_featured ?? true);
  const [metaTitle, setMetaTitle] = useState(() => editingCategory?.meta_title || "");
  const [metaDescription, setMetaDescription] = useState(() => editingCategory?.meta_description || "");
  const [imageAlt, setImageAlt] = useState(() => editingCategory?.image_alt || "");
  const [uploadingImage, setUploadingImage] = useState(false);

  // CRITICAL PARENT SELECTION SAFETY:
  // When editing, calculate the set of forbidden parent IDs (the category itself + all its descendants)
  const invalidParentIds = useMemo(() => {
    if (!editingCategory) return new Set<number>();

    const invalid = new Set<number>([editingCategory.id]);
    const childrenMap = new Map<number, number[]>();

    categories.forEach((cat) => {
      if (cat.parent_id) {
        if (!childrenMap.has(cat.parent_id)) {
          childrenMap.set(cat.parent_id, []);
        }
        childrenMap.get(cat.parent_id)!.push(cat.id);
      }
    });

    const queue: number[] = [editingCategory.id];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const kids = childrenMap.get(currentId) || [];
      for (const kid of kids) {
        if (!invalid.has(kid)) {
          invalid.add(kid);
          queue.push(kid);
        }
      }
    }

    return invalid;
  }, [categories, editingCategory]);

  // Filter selectable parent choices
  const selectableParents = useMemo(() => {
    return categories.filter((cat) => !invalidParentIds.has(cat.id));
  }, [categories, invalidParentIds]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPG, PNG, WEBP, GIF, AVIF).");
      return;
    }

    if (file.type === "image/svg+xml") {
      toast.error("SVG vector files are not supported for category cover images. Please select a JPG, PNG, WEBP, or AVIF image.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image file size must be less than 20MB.");
      return;
    }

    setUploadingImage(true);
    try {
      const fileToUpload = await optimizeImageForUpload(file, {
        maxDimension: 1600,
        maxSizeBytes: 1.5 * 1024 * 1024,
        quality: 0.88,
      });

      const res = await adminApi.uploadCategoryImage(fileToUpload);
      setImage(res.image_url);
      toast.success("Image uploaded from device successfully.");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: { image?: string[] }; message?: string } } };
      const errMsg =
        axiosErr.response?.data?.errors?.image?.[0] ||
        axiosErr.response?.data?.message ||
        "Failed to upload image from device.";
      toast.error(errMsg);
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const isEditDirty = Boolean(
    editingCategory && (
      parentId !== (editingCategory.parent_id ?? null) ||
      name.trim() !== (editingCategory.name || "").trim() ||
      description.trim() !== (editingCategory.description || "").trim() ||
      image.trim() !== (editingCategory.image || "").trim() ||
      icon.trim() !== (editingCategory.icon || "Sparkles").trim() ||
      badge.trim() !== (editingCategory.badge || "").trim() ||
      displayOrder !== (editingCategory.display_order ?? 0).toString() ||
      isFeatured !== (editingCategory.is_featured ?? false) ||
      metaTitle.trim() !== (editingCategory.meta_title || "").trim() ||
      metaDescription.trim() !== (editingCategory.meta_description || "").trim() ||
      imageAlt.trim() !== (editingCategory.image_alt || "").trim()
    )
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    // Double check parent selection safety
    if (editingCategory && parentId !== null && invalidParentIds.has(parentId)) {
      toast.error("Invalid parent selection: A category cannot be parented to itself or any of its descendants.");
      return;
    }

    if (editingCategory && !isEditDirty) {
      toast.info("No changes were made.");
      return;
    }

    const payload: CategoryFormData = {
      parent_id: parentId,
      name: name.trim(),
      description: description.trim(),
      image: image.trim() || null,
      icon,
      badge: badge.trim() || null,
      display_order: Number(displayOrder) || 0,
      is_featured: isFeatured,
      meta_title: metaTitle.trim() || null,
      meta_description: metaDescription.trim() || null,
      image_alt: imageAlt.trim() || null,
    };

    await onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="h-12 px-6 border-b border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0 pr-3">
          <SheetTitle className="text-xs font-semibold text-white tracking-wide shrink-0">
            {editingCategory ? "Edit Category" : parentId ? "Add Subcategory" : "New Root Category"}
          </SheetTitle>
          {editingCategory && (
            <>
              <span className="text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded shrink-0">
                #{editingCategory.id}
              </span>
              <span className="text-slate-600 text-xs shrink-0">·</span>
              <span className="text-xs text-slate-400 truncate max-w-[220px]">
                {editingCategory.name}
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

      {/* Form Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs">
        {/* Parent Category Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">Parent Category (Optional)</label>
            {editingCategory && invalidParentIds.size > 1 && (
              <span className="text-[10px] text-amber-400 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" />
                Descendants protected ({invalidParentIds.size - 1} excluded)
              </span>
            )}
          </div>
          <select
            value={parentId === null ? "" : parentId}
            onChange={(e) => setParentId(e.target.value === "" ? null : Number(e.target.value))}
            className="w-full h-9 rounded-lg border border-white/10 bg-[#131722] px-3 text-xs text-white focus:border-amber-400/50 focus:outline-none transition cursor-pointer"
          >
            <option value="" className="bg-[#131722] text-slate-300">
              None (Top-Level Root Category)
            </option>
            {selectableParents.map((cat) => {
              const level = getCategoryLevel(cat);
              const prefix = level > 1 ? `${"　".repeat(level - 1)}↳ ` : "📁 ";
              return (
                <option key={cat.id} value={cat.id} className="bg-[#131722] text-white">
                  {prefix}{cat.name}
                </option>
              );
            })}
          </select>
        </div>

        {/* Category Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">
            Category Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mechanical Keyboards & Desks"
            className="w-full h-9 rounded-lg border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none transition"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Category overview, specifications, and scope..."
            className="w-full rounded-lg border border-white/10 bg-[#131722] p-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none transition resize-none"
          />
        </div>

        {/* SEO Configuration */}
        <div className="pt-4 mt-4 border-t border-white/[0.06] space-y-4">
          <h4 className="text-[13px] font-medium text-white flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-amber-400" />
            Search Engine Optimization
          </h4>
          <p className="text-xs text-slate-400">
            Leave blank to automatically use the category name and description as fallbacks.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 block">Meta Title</label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="Custom SEO title..."
              className="w-full h-9 rounded-lg border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 block">Meta Description</label>
            <textarea
              rows={2}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Custom SEO description..."
              className="w-full rounded-lg border border-white/10 bg-[#131722] p-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none transition resize-none"
            />
          </div>
        </div>

        {/* Image Upload & Management Section */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-300">Cover Image</label>
              <ImageUploadGuidance slotKey="admin_category_thumbnail" imageUrl={image} layout="inline" />
            </div>
            {image && (
              <button
                type="button"
                onClick={() => setImage("")}
                className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition cursor-pointer"
                title="Remove current image"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove Image</span>
              </button>
            )}
          </div>

          {/* Minimal Image Thumbnail Preview if an image exists */}
          {image && (
            <div className="relative rounded-xl overflow-hidden border border-white/10 bg-slate-950 h-28 flex items-center justify-center group">
              <img
                src={image}
                alt={imageAlt || "Category Preview"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                <label className="px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold backdrop-blur-sm cursor-pointer flex items-center gap-1.5 transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Change</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/avif"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploadingImage}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setImage("")}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-600 text-white text-[11px] font-bold backdrop-blur-sm cursor-pointer flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          )}

          {/* Direct Upload Button & Fallback URL input */}
          <div className="flex items-center gap-2">
            <label className="h-9 px-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0">
              {uploadingImage ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{uploadingImage ? "Uploading..." : "Upload Device Image"}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/avif"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploadingImage}
              />
            </label>

            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="Or paste external image URL..."
              className="flex-1 h-9 rounded-lg border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none transition min-w-0"
            />

            {image && (
              <button
                type="button"
                onClick={() => setImage("")}
                className="h-9 px-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition flex items-center justify-center shrink-0 cursor-pointer"
                title="Remove current image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Image Alt Text */}
          <div className="space-y-1.5 mt-2">
            <label className="text-xs font-medium text-slate-300">Image Alt Text (SEO)</label>
            <input
              type="text"
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
              placeholder="Leave blank to use category name..."
              className="w-full h-9 rounded-lg border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Badge & Order */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Badge Tag</label>
            <input
              type="text"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="e.g. Flagship"
              className="w-full h-9 rounded-lg border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none transition"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Display Order</label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              className="w-full h-9 rounded-lg border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none transition"
            />
          </div>
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-xs font-medium">
            <AdminCheckbox
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
            <span>Feature in Highlights & Menus</span>
          </label>
        </div>
      </div>

      {/* Footer */}
      <div className="h-12 px-6 border-t border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-medium text-slate-400 hover:text-white transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || uploadingImage || (Boolean(editingCategory) && !isEditDirty)}
          className="h-8 px-4 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
        >
          {saving && <Loader2 className="w-3 h-3 animate-spin" />}
          <span>{editingCategory ? "Save Changes" : "Create Category"}</span>
        </button>
      </div>
    </form>
  );
}

export function CategoryFormDrawer(props: CategoryFormDrawerProps) {
  return (
    <Sheet open={props.isOpen} onOpenChange={(open) => { if (!open) props.onClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:w-[540px] md:w-[580px] sm:!max-w-[580px] max-w-full bg-[#0b0e17] border-l border-white/[0.08] p-0 flex flex-col justify-between shadow-2xl text-slate-100 overflow-hidden"
      >
        {props.isOpen && (
          <CategoryFormDrawerContent
            key={`${props.editingCategory?.id ?? "create"}-${props.defaultParentId ?? "none"}`}
            {...props}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
