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
