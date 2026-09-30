"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, Loader2, Trash2, CheckCircle2, Image as ImageIcon, Palette } from "lucide-react";
import { ProductFormImage } from "@/types";
import { ImageUploadGuidance } from "@/components/admin/ui/ImageUploadGuidance";
import { optimizeImageForUpload } from "@/lib/imageOptimizer";
import { adminApi } from "@/lib/adminApi";
import { toast } from "sonner";

interface ProductMediaTabProps {
  images: ProductFormImage[];
  onImagesChange: (images: ProductFormImage[]) => void;
  productName: string;
  availableColors?: string[];
  onImageUploaded?: (imageUrl: string, path: string) => void;
  onImageDeleted?: (image: ProductFormImage) => void;
}

export function ProductMediaTab({
  images,
  onImagesChange,
  productName,
  availableColors = [],
  onImageUploaded,
  onImageDeleted,
}: ProductMediaTabProps) {
  const [inputMode, setInputMode] = useState<"upload" | "url">("upload");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddImageUrl = () => {
    const url = newImageUrl.trim();
    if (!url) {
      toast.error("Please enter an image URL.");
      return;
    }
    if (!/^https?:\/\/.+/i.test(url)) {
      toast.error("URL must start with http:// or https://");
      return;
    }
    if (images.length >= 5) {
      toast.error("Maximum 5 images allowed.");
      return;
    }
    const isFirst = images.length === 0;
    const next: ProductFormImage[] = [
      ...images,
      {
        image_url: url,
        is_primary: isFirst,
        source: "url",
        alt_text: productName || "Product Image",
        color_name: null,
        display_order: images.length,
      },
    ];
    onImagesChange(next);
    setNewImageUrl("");
    toast.success("Image added from URL.");
  };

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const remainingSlots = 5 - images.length;
    if (remainingSlots <= 0) {
      toast.error("Maximum 5 images allowed.");
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setIsUploading(true);
    try {
      const uploadedImages: ProductFormImage[] = [];
      for (const file of filesToUpload) {
        if (!file.type.startsWith("image/")) continue;
        const fileToUpload = await optimizeImageForUpload(file, {
          maxDimension: 1600,
          maxSizeBytes: 1.5 * 1024 * 1024,
          quality: 0.88,
        });
        const res = await adminApi.uploadProductImage(fileToUpload);
        onImageUploaded?.(res.image_url, res.path);

        uploadedImages.push({
          image_url: res.image_url,
          is_primary: images.length === 0 && uploadedImages.length === 0,
          source: "upload",
          alt_text: file.name.replace(/\.[^/.]+$/, ""),
          color_name: null,
          display_order: images.length + uploadedImages.length,
        });
      }

      if (uploadedImages.length > 0) {
        const next = [...images, ...uploadedImages];
        if (!next.some((img) => img.is_primary)) {
          next[0].is_primary = true;
        }
        onImagesChange(next);
        toast.success(`Uploaded ${uploadedImages.length} image(s).`);
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { errors?: { image?: string[] }; message?: string } } };
      const errMsg =
        errorObj.response?.data?.errors?.image?.[0] ||
        errorObj.response?.data?.message ||
        "Failed to upload image.";
      toast.error(errMsg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeviceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
  };

  const handleRemoveImage = async (index: number) => {
    const targetImage = images[index];
    if (!targetImage) return;

    // Immediately trigger server uncommitted cleanup if uploaded from device
    if (targetImage.source === "upload" || targetImage.image_url.includes("/storage/products/")) {
      try {
        await adminApi.deleteUncommittedImage({ image_url: targetImage.image_url });
      } catch {
        // Safe ignore: might already be persisted or cleaned
      }
    }

    onImageDeleted?.(targetImage);

    const nextImages = images.filter((_, idx) => idx !== index);
    if (nextImages.length > 0 && !nextImages.some((img) => img.is_primary)) {
      nextImages[0].is_primary = true;
    }
    // Re-index display_order
    const reindexed = nextImages.map((img, idx) => ({ ...img, display_order: idx }));
    onImagesChange(reindexed);
    toast.info("Image removed.");
  };

  const handleSetPrimaryImage = (index: number) => {
    const nextImages = images.map((img, idx) => ({
      ...img,
      is_primary: idx === index,
    }));
    onImagesChange(nextImages);
    toast.success("Primary catalog image updated.");
  };

  const handleUpdateAltText = (index: number, newAlt: string) => {
    const nextImages = [...images];
    nextImages[index] = { ...nextImages[index], alt_text: newAlt };
    onImagesChange(nextImages);
  };

  const handleUpdateColor = (index: number, color: string) => {
    const nextImages = [...images];
    nextImages[index] = {
      ...nextImages[index],
      color_name: color === "" ? null : color,
    };
    onImagesChange(nextImages);
    toast.success(color ? `Associated with "${color}".` : "Set to All Colors (General).");
  };

  return (
    <div className="space-y-5">
      {/* Media Header & Guidance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-white tracking-wide">Product Images & Color Association</h4>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                images.length === 0
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              }`}
            >
              {images.length}/5 uploaded
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            At least 1 product image is required. Tag photos with variant colors so the storefront gallery updates when customers click color swatches.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="p-0.5 rounded-lg bg-white/[0.04] border border-white/10 flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setInputMode("upload")}
            className={`px-3 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
              inputMode === "upload"
                ? "bg-white/15 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Device Upload
          </button>
          <button
            type="button"
            onClick={() => setInputMode("url")}
            className={`px-3 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
              inputMode === "url"
                ? "bg-white/15 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Image URL
          </button>
        </div>
      </div>

      <ImageUploadGuidance slotKey="admin_product_primary" layout="row" />

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/*"
        onChange={handleDeviceUpload}
        disabled={isUploading || images.length >= 5}
        className="hidden"
      />

      {/* Upload Zone / URL Input */}
      {inputMode === "upload" ? (
        <div
          onClick={() => {
            if (!isUploading && images.length < 5) {
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
          }}
          className={`border border-dashed rounded-xl py-7 px-4 text-center transition-all flex flex-col items-center justify-center gap-2.5 ${
            images.length >= 5
              ? "opacity-40 border-white/10 cursor-not-allowed bg-white/[0.01]"
              : "border-white/15 hover:border-amber-400/50 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer group"
          }`}
        >
          <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:text-amber-400 group-hover:scale-105 transition">
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
            ) : (
              <UploadCloud className="w-5 h-5" />
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-200">
              {isUploading
                ? "Uploading & optimizing image..."
                : images.length >= 5
                ? "Maximum 5 images limit reached"
                : "Click to browse or drag and drop image files here"}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Supports JPEG, PNG, WebP, AVIF up to 10MB (auto-compressed for fast storefront load)
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="https://images.unsplash.com/photo-..."
            className="flex-1 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-amber-400/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 transition-all outline-none"
          />
          <button
            type="button"
            onClick={handleAddImageUrl}
            disabled={images.length >= 5}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition cursor-pointer disabled:opacity-50"
          >
            Add URL
          </button>
        </div>
      )}

      {/* Thumbnails Gallery */}
      {images.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Configured Media Assets ({images.length})</span>
            <span>Assign variant colors, edit alt text, or choose catalog cover</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
            {images.map((img, idx) => (
              <div
                key={idx}
                className={`rounded-xl border ${
                  img.is_primary
                    ? "border-amber-400/60 ring-1 ring-amber-400/30 bg-amber-500/[0.02]"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                } p-2.5 flex flex-col justify-between gap-2.5 transition-all shadow-sm`}
              >
                {/* Image preview with badges */}
                <div className="relative aspect-video sm:aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/60 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.image_url}
                    alt={img.alt_text || "Product thumbnail"}
                    className="w-full h-full object-cover"
                  />

                  {/* Primary Badge */}
                  {img.is_primary && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-sm text-amber-300 text-[10px] font-semibold border border-amber-400/40 shadow-xs flex items-center gap-1 z-10">
                      <CheckCircle2 className="w-3 h-3 text-amber-400" />
                      Primary Cover
                    </span>
                  )}

                  {/* Color Badge */}
                  {img.color_name ? (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-sm text-cyan-300 text-[10px] font-semibold border border-cyan-400/40 shadow-xs flex items-center gap-1 z-10">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                      {img.color_name}
                    </span>
                  ) : (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-slate-400 text-[9px] font-medium border border-white/10">
                      All Colors
                    </span>
                  )}

                  {/* Quick Action Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!img.is_primary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryImage(idx)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold transition cursor-pointer shadow"
                      >
                        Make Primary
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-500 text-white transition cursor-pointer shadow"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Controls under preview */}
                <div className="space-y-2">
                  {/* Color selection dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                      <Palette className="w-3 h-3 text-slate-400" />
                      Color Swatch Link
                    </label>
                    <select
                      value={img.color_name || ""}
                      onChange={(e) => handleUpdateColor(idx, e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 focus:border-cyan-400/50 rounded-lg px-2 py-1.5 text-[11px] text-slate-200 outline-none cursor-pointer"
                    >
                      <option value="" className="bg-[#0b0e17] text-slate-300">
                        All Colors (General Catalog)
                      </option>
                      {availableColors.map((color) => (
                        <option key={color} value={color} className="bg-[#0b0e17] text-white">
                          Color: {color}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Alt Text Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-400">Alt Text (SEO & Accessibility)</label>
                    <input
                      type="text"
                      value={img.alt_text || ""}
                      onChange={(e) => handleUpdateAltText(idx, e.target.value)}
                      placeholder="e.g. Matte Black finish side view"
                      className="w-full bg-white/[0.03] border border-white/10 focus:border-amber-400/50 rounded-lg px-2 py-1.5 text-[11px] text-white placeholder:text-slate-600 outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 text-center text-xs text-slate-500 space-y-1">
          <ImageIcon className="w-6 h-6 mx-auto mb-1.5 text-slate-600" />
          <p className="font-semibold text-slate-400">No images uploaded yet</p>
          <p className="text-[11px]">Add at least 1 image to showcase this product in the catalog.</p>
        </div>
      )}
    </div>
  );
}
