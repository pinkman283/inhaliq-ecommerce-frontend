"use client";

import { useState, useRef } from "react";
import { Camera, Trash2, Upload, User as UserIcon, RefreshCw } from "lucide-react";
import { ImageUploadGuidance } from "@/components/admin/ui/ImageUploadGuidance";
import { optimizeUploadFile } from "@/lib/imageOptimizer";
import { toast } from "sonner";

interface ImageUploadAvatarProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function ImageUploadAvatar({
  value,
  onChange,
  name = "User",
  size = "lg",
  label,
  disabled = false,
  className = "",
}: ImageUploadAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: "w-10 h-10 text-xs",
    md: "w-14 h-14 text-sm",
    lg: "w-20 h-20 text-lg",
    xl: "w-24 h-24 text-xl",
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (PNG, JPG, WebP).");
      return;
    }

    // Validate size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image must be smaller than 20MB.");
      return;
    }

    try {
      const optimized = await optimizeUploadFile(file, { profile: "thumbnail", maxDimension: 400, label: "Profile picture" });
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        onChange(dataUrl);
        toast.info("Profile picture updated in preview. Click Save to apply changes.", {
          description: optimized.reductionText ? `Optimized: ${optimized.reductionText}` : undefined,
        });
      };
      reader.readAsDataURL(optimized);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        onChange(dataUrl);
        toast.info("Profile picture updated in preview. Click Save to apply changes.");
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    toast.info("Picture removed in preview. Click Save to apply changes.");
  };

  // Get initials for fallback
  const getInitials = (str: string) => {
    const parts = str.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return str.slice(0, 2).toUpperCase() || "U";
  };

  return (
    <div className={`flex flex-col items-center sm:items-start gap-2 ${className}`}>
      {label && <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">{label}</label>}

      <div className="flex items-center gap-4">
        {/* Circular Avatar Container with Hover Overlay */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`relative rounded-full overflow-hidden cursor-pointer ring-2 transition-all group shrink-0 ${sizeClasses[size]
            } ${isHovered
              ? "ring-indigo-500 shadow-lg shadow-indigo-500/10 scale-105"
              : "ring-gray-200 dark:ring-white/10 bg-gray-100 dark:bg-slate-900"
            } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {value ? (
            <img
              src={value}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900 text-slate-700 dark:text-slate-200 font-bold">
              {name ? getInitials(name) : <UserIcon className="w-6 h-6 text-slate-400 dark:text-slate-500" />}
            </div>
          )}

          {/* Hover Overlay with Camera Icon */}
          <div
            className={`absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white transition-opacity ${isHovered && !disabled ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
          >
            <Camera className="w-4 h-4 text-white mb-0.5" />
            <span className="text-[9px] font-semibold text-slate-200">
              {value ? "Change" : "Upload"}
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileChange}
            disabled={disabled}
            className="hidden"
          />
        </div>

        {/* Action Buttons & Guidance Text */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-gray-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span>{value ? "Change photo" : "Upload photo"}</span>
            </button>

            {value && (
              <button
                type="button"
                disabled={disabled}
                onClick={handleRemove}
                className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                title="Remove current avatar"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400">
            JPG, PNG or WebP · Max 5MB · 400 × 400 px recommended
          </span>
        </div>
      </div>
    </div>
  );
}
