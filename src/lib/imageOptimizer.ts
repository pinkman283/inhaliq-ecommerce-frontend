import { adminApi, OptimizationError } from "@/lib/adminApi";
import { calculateReduction, notifyOptimizationSuccess } from "@/lib/uploadFeedback";

/**
 * Client-side image optimizer for admin uploads.
 * Ensures uploaded images are automatically resized and compressed to fit safely
 * within server upload limits (e.g., PHP's default 2MB upload_max_filesize limit)
 * without sacrificing visual fidelity on storefront displays.
 */

export interface ImageOptimizationOptions {
  maxDimension?: number;
  maxSizeBytes?: number;
  quality?: number;
}

export async function optimizeImageForUpload(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<File> {
  const {
    maxDimension = 1600,
    maxSizeBytes = 1.5 * 1024 * 1024, // 1.5MB (safely below PHP's default 2MB upload_max_filesize)
    quality = 0.88,
  } = options;

  // Don't attempt to optimize non-images, SVGs, or animated GIFs
  if (
    !file.type.startsWith("image/") ||
    file.type === "image/gif" ||
    file.type === "image/svg+xml"
  ) {
    return file;
  }

  // If running in SSR or unsupported environment, return original
  if (typeof window === "undefined" || typeof document === "undefined") {
    return file;
  }

  return new Promise<File>((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      const exceedsDimension = width > maxDimension || height > maxDimension;
      const exceedsSize = file.size > maxSizeBytes;

      // If already within dimensions and size limit, keep original file
      if (!exceedsDimension && !exceedsSize) {
        return resolve(file);
      }

      // Proportional downscale
      if (exceedsDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return resolve(file);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      // Prefer WebP for high quality & small file size
      const targetMime = "image/webp";

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return resolve(file);
          }

          // If compression resulted in a larger file (rare, e.g. very low quality original), keep original
          if (blob.size >= file.size && !exceedsSize) {
            return resolve(file);
          }

          const baseName = file.name.replace(/\.[^/.]+$/, "");
          const extension = targetMime === "image/webp" ? "webp" : "jpg";
          const optimizedFile = new File([blob], `${baseName}.${extension}`, {
            type: targetMime,
            lastModified: Date.now(),
          });

          resolve(optimizedFile);
        },
        targetMime,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

export type OptimizationProfile = "product" | "thumbnail" | "banner" | "brand" | "lossless";

export interface OptimizeUploadOptions {
  profile?: OptimizationProfile;
  maxDimension?: number;
  quality?: number;
  outputFormat?: "auto" | "webp" | "jpeg" | "png" | "preserve";
  notify?: boolean; // Default false: suppress intermediate toast so only the final upload confirmation toast displays
  label?: string;   // Label for the notification
}

export type OptimizedFile = File & {
  originalBytes?: number;
  optimizedBytes?: number;
  reductionPercent?: number;
  reductionText?: string;
  isOptimized?: boolean;
};

/**
 * Universal optimization pipeline for admin uploads:
 * 1. Sends to high-performance Python FastAPI microservice (:8100) via /api/admin/optimize proxy.
 * 2. Compresses to high-efficiency WebP/PNG according to profile (e.g. 2560x1440 for banner, 1600x1600 for product, 800x800 for brand).
 * 3. Gracefully falls back to browser canvas downscaling if microservice is offline or inaccessible,
 *    guaranteeing the file is always well within PHP / webserver payload limits.
 * 4. Automatically triggers user notification showing exact reduction metrics ("5.3 MB → 340 KB · 94% smaller").
 */
export async function optimizeUploadFile(
  file: File,
  options: OptimizeUploadOptions = {}
): Promise<OptimizedFile> {
  const {
    profile = "product",
    quality,
    outputFormat = "auto",
    maxDimension,
    notify = false,
    label,
  } = options;

  // Passthrough SVGs, ICOs, or non-images immediately
  if (
    !file.type.startsWith("image/") ||
    file.type === "image/svg+xml" ||
    file.type === "image/x-icon" ||
    file.type === "image/vnd.microsoft.icon"
  ) {
    const uncompressed = file as OptimizedFile;
    uncompressed.isOptimized = false;
    uncompressed.originalBytes = file.size;
    uncompressed.optimizedBytes = file.size;
    return uncompressed;
  }

  // Pre-downscale extremely large files client-side before forwarding to proxy
  // Local/Node proxy allows up to 20MB, while Vercel serverless functions enforce a 4.5MB ceiling.
  let candidateForProxy = file;
  const isVercelHost = typeof window !== "undefined" && window.location.hostname.includes("vercel.app");
  const proxyThreshold = isVercelHost ? 4.2 * 1024 * 1024 : 18 * 1024 * 1024;

  if (file.size > proxyThreshold) {
    try {
      candidateForProxy = await optimizeImageForUpload(file, {
        maxDimension: maxDimension || (profile === "banner" ? 2560 : 1800),
        quality: 0.90,
      });
    } catch {
      candidateForProxy = file;
    }
  }

  // Attempt optimization via Python microservice
  try {
    const res = await adminApi.optimizeImage(candidateForProxy, {
      profile,
      quality,
      outputFormat,
      maxWidth: maxDimension,
    });

    const origBytes = res.originalBytes || file.size;
    const optBytes = res.optimizedBytes || res.file.size;
    const reduction = calculateReduction(origBytes, optBytes);

    const resultFile = res.file as OptimizedFile;
    resultFile.originalBytes = origBytes;
    resultFile.optimizedBytes = optBytes;
    resultFile.reductionPercent = reduction.reductionPercent;
    resultFile.reductionText = reduction.descriptionText;
    resultFile.isOptimized = true;

    if (notify) {
      notifyOptimizationSuccess(origBytes, optBytes, label || "Image");
    }

    return resultFile;
  } catch (err: unknown) {
    if (err instanceof OptimizationError && err.isAuthError) {
      // Re-throw authentication/permission errors
      throw err;
    }

    console.warn(`[ImageService] Microservice optimization for profile '${profile}' fell back to local canvas:`, err);

    // Fallback to local canvas compression
    const fallbackFile = await optimizeImageForUpload(file, {
      maxDimension: maxDimension || (profile === "banner" ? 2560 : profile === "brand" ? 800 : 1600),
      quality: quality ? quality / 100 : (profile === "brand" ? 0.90 : 0.88),
    });

    const origBytes = file.size;
    const optBytes = fallbackFile.size;
    const reduction = calculateReduction(origBytes, optBytes);

    const resultFile = fallbackFile as OptimizedFile;
    resultFile.originalBytes = origBytes;
    resultFile.optimizedBytes = optBytes;
    resultFile.reductionPercent = reduction.reductionPercent;
    resultFile.reductionText = reduction.descriptionText;
    resultFile.isOptimized = true;

    if (notify) {
      notifyOptimizationSuccess(origBytes, optBytes, label ? `${label} (canvas)` : "Image");
    }

    return resultFile;
  }
}
