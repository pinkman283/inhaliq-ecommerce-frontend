import { toast } from "sonner";

/**
 * Formats a byte count into a human-readable size string (B, KB, or MB).
 * Examples: 850 B, 200 KB, 2.00 MB
 */
export function formatByteSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return `${kb >= 10 ? Math.round(kb) : kb.toFixed(1)} KB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

export interface ReductionInfo {
  reductionPercent: number;
  isSmaller: boolean;
  isLarger: boolean;
  descriptionText: string;
}

/**
 * Calculates reduction metrics and formatted comparison text.
 * Avoids claiming a positive reduction if the file was not smaller.
 */
export function calculateReduction(originalBytes: number, optimizedBytes: number): ReductionInfo {
  const origFormatted = formatByteSize(originalBytes);
  const optFormatted = formatByteSize(optimizedBytes);

  if (optimizedBytes < originalBytes) {
    const diff = originalBytes - optimizedBytes;
    const pct = Math.round((diff / originalBytes) * 100);
    return {
      reductionPercent: pct,
      isSmaller: true,
      isLarger: false,
      descriptionText: `${origFormatted} → ${optFormatted} · ${pct}% smaller`,
    };
  }

  if (optimizedBytes > originalBytes) {
    return {
      reductionPercent: 0,
      isSmaller: false,
      isLarger: true,
      descriptionText: `${origFormatted} → ${optFormatted} · Original size retained`,
    };
  }

  return {
    reductionPercent: 0,
    isSmaller: false,
    isLarger: false,
    descriptionText: `${origFormatted} · Size preserved`,
  };
}

/**
 * Phase 3A: Toast when microservice successfully optimizes image bytes.
 * Never claims the image is uploaded to storage yet.
 */
export function notifyOptimizationSuccess(originalBytes: number, optimizedBytes: number, label: string = "Image") {
  const reduction = calculateReduction(originalBytes, optimizedBytes);
  toast.success(`${label} optimized successfully`, {
    description: reduction.descriptionText,
    duration: 5000,
  });
}

/**
 * Phase 3B & 3E: Toast when Laravel confirms successful storage.
 */
export function notifyUploadSuccess(isFallbackOriginal: boolean = false, reductionText?: string) {
  const desc = reductionText ? `Optimized: ${reductionText}` : undefined;
  if (isFallbackOriginal) {
    // Case E: Fallback upload succeeded
    toast.success("Image uploaded successfully using the original file.", {
      description: desc,
      duration: 5000,
    });
  } else {
    // Case B: Standard optimized upload succeeded
    toast.success("Image uploaded successfully.", {
      description: desc,
      duration: 5000,
    });
  }
}

/**
 * Phase 3C: Warning toast when optimization service is unavailable or unreachable.
 */
export function notifyOptimizationUnavailable() {
  toast.warning("Image optimization service unavailable. Uploading the original image instead.", {
    duration: 4500,
  });
}

/**
 * Phase 3D: Warning toast when optimization rejects image or returns error.
 */
export function notifyOptimizationFailed(reason?: string) {
  const safeReason = reason ? cleanSafeReason(reason) : undefined;
  toast.warning("Image optimization unsuccessful. Uploading the original image instead.", {
    description: safeReason ? `Reason: ${safeReason}` : undefined,
    duration: 4500,
  });
}

/**
 * Phase 3F: Error toast when Laravel upload fails.
 */
export function notifyUploadFailed(error: unknown, optimizationSucceeded: boolean = false) {
  const laravelErrorMsg = extractLaravelErrorMessage(error);
  if (optimizationSucceeded) {
    toast.error("Image upload failed", {
      description: `Optimization succeeded, but image could not be saved: ${laravelErrorMsg}`,
      duration: 5000,
    });
  } else {
    toast.error("Image upload failed", {
      description: laravelErrorMsg,
      duration: 5000,
    });
  }
}

interface ApiErrorResponse {
  response?: {
    status?: number;
    data?: {
      message?: string;
      errors?: {
        image?: string[];
      };
    };
  };
  message?: string;
}

/**
 * Extracts a safe, user-actionable error message from Laravel API error response.
 */
export function extractLaravelErrorMessage(error: unknown): string {
  if (!error) return "Upload failed. Please try again.";
  const err = error as ApiErrorResponse;

  // 1. Validation error in response data (e.g. { errors: { image: ['The image size cannot exceed 10MB.'] } })
  const imageErrors = err.response?.data?.errors?.image;
  if (Array.isArray(imageErrors) && imageErrors.length > 0 && typeof imageErrors[0] === "string") {
    return imageErrors[0];
  }

  // 2. Direct message in response data
  if (err.response?.data?.message && typeof err.response.data.message === "string") {
    return err.response.data.message;
  }

  // 3. Known HTTP status codes mapping
  const status = err.response?.status;
  if (status === 413) return "File exceeds the allowed upload size.";
  if (status === 415) return "Unsupported image format.";
  if (status === 401 || status === 403) return "You are not authorized to upload this image.";
  if (status === 422) return "Image validation failed. Please check file format and size.";
  if (status === 500) return "Server error occurred while saving the image. Please try again.";

  // 4. Axios / Network error message
  if (typeof err.message === "string" && !err.message.includes("status code")) {
    return err.message;
  }

  return "Upload failed. Please try again.";
}

/**
 * Ensures failure reasons do not leak internal stack traces or paths.
 */
function cleanSafeReason(raw: string): string {
  // Strip any stack traces or file path references
  const firstLine = raw.split("\n")[0].trim();
  if (firstLine.length > 120) {
    return firstLine.substring(0, 117) + "...";
  }
  return firstLine;
}
