import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // Max execution timeout for Vercel Serverless

const ALLOWED_PROFILES = new Set(["product", "thumbnail", "banner", "brand", "lossless"]);
const ALLOWED_OUTPUT_FORMATS = new Set(["auto", "webp", "jpeg", "png", "preserve"]);
const ALLOWED_ADMIN_ROLES = new Set(["admin", "super_admin", "staff"]);
const MAX_PROXY_BYTES = process.env.VERCEL ? 4.2 * 1024 * 1024 : 20 * 1024 * 1024; // 20MB local, 4.2MB Vercel safe ceiling

const FORWARDED_METADATA_HEADERS = [
  "x-image-output-format",
  "x-image-original-bytes",
  "x-image-optimized-bytes",
  "x-image-bytes-saved",
  "x-image-reduction-percent",
  "x-image-original-width",
  "x-image-original-height",
  "x-image-output-width",
  "x-image-output-height",
  "x-image-has-alpha",
  "x-image-transformed",
  "x-image-quality-mode",
  "x-image-profile",
];

export async function POST(request: NextRequest) {
  // 1. Authenticate Request via Bearer Token
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized: Admin bearer token required.", code: "AUTH_REQUIRED" },
      { status: 401 }
    );
  }

  // 2. Validate Caller Identity & Role against Laravel Backend
  const backendBaseUrl = (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000/api"
  ).replace(/\/+$/, "");

  try {
    const authVerifyRes = await fetch(`${backendBaseUrl}/admin/auth/me`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(6000), // 6s deadline for auth check
    });

    if (!authVerifyRes.ok) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or expired admin credentials.", code: "AUTH_INVALID" },
        { status: 401 }
      );
    }

    const authData = await authVerifyRes.json();
    const userRole = authData?.user?.role;
    if (!userRole || !ALLOWED_ADMIN_ROLES.has(userRole)) {
      return NextResponse.json(
        { error: "Forbidden: User does not hold administrative privileges.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }
  } catch (authErr: any) {
    // If backend auth check times out or network fails, reject securely
    return NextResponse.json(
      { error: "Authentication verification service temporarily unavailable.", code: "AUTH_SERVICE_UNAVAILABLE" },
      { status: 502 }
    );
  }

  // 3. Verify Server-Side Image Service Configuration
  const imageServiceUrl = process.env.IMAGE_SERVICE_URL || "http://127.0.0.1:8100";
  const imageServiceKey = process.env.IMAGE_SERVICE_API_KEY;

  // 4. Parse & Validate Multipart Form Data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Malformed multipart form data in request.", code: "BAD_MULTIPART" },
      { status: 400 }
    );
  }

  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing required binary image file (field 'file').", code: "MISSING_FILE" },
      { status: 400 }
    );
  }

  if (file.size === 0) {
    return NextResponse.json(
      { error: "Cannot process empty 0-byte file.", code: "EMPTY_FILE" },
      { status: 400 }
    );
  }

  // Enforce Vercel Serverless Function payload boundary
  if (file.size > MAX_PROXY_BYTES) {
    return NextResponse.json(
      {
        error: `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds proxy payload limit of ${(MAX_PROXY_BYTES / (1024 * 1024)).toFixed(0)}MB.`,
        code: "PAYLOAD_TOO_LARGE",
      },
      { status: 413 }
    );
  }

  // Validate parameters
  const profile = (formData.get("profile") as string) || "product";
  if (!ALLOWED_PROFILES.has(profile)) {
    return NextResponse.json(
      { error: `Invalid profile '${profile}'. Allowed profiles: ${Array.from(ALLOWED_PROFILES).join(", ")}.`, code: "INVALID_PROFILE" },
      { status: 400 }
    );
  }

  const outputFormat = (formData.get("output_format") as string) || "auto";
  if (!ALLOWED_OUTPUT_FORMATS.has(outputFormat)) {
    return NextResponse.json(
      { error: `Invalid output format '${outputFormat}'.`, code: "INVALID_OUTPUT_FORMAT" },
      { status: 400 }
    );
  }

  const qualityStr = formData.get("quality") as string | null;
  const maxWidthStr = formData.get("max_width") as string | null;
  const maxHeightStr = formData.get("max_height") as string | null;

  // 5. Construct Upstream Request to Private Image Service
  const upstreamFormData = new FormData();
  upstreamFormData.append("file", file, file.name);
  upstreamFormData.append("profile", profile);
  upstreamFormData.append("output_format", outputFormat);
  if (qualityStr) upstreamFormData.append("quality", qualityStr);
  if (maxWidthStr) upstreamFormData.append("max_width", maxWidthStr);
  if (maxHeightStr) upstreamFormData.append("max_height", maxHeightStr);

  const forwardHeaders: Record<string, string> = {};
  if (imageServiceKey) {
    forwardHeaders["X-Service-Key"] = imageServiceKey;
  }

  // Forward client IP for upstream abuse tracking
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
  if (clientIp) {
    forwardHeaders["X-Forwarded-For"] = clientIp;
  }

  // 6. Dispatch Upstream Request with Timeout
  try {
    const upstreamTarget = `${imageServiceUrl.replace(/\/+$/, "")}/api/v1/optimize`;
    const upstreamRes = await fetch(upstreamTarget, {
      method: "POST",
      headers: forwardHeaders,
      body: upstreamFormData,
      signal: AbortSignal.timeout(28000), // 28s deadline (safely within maxDuration = 30)
    });

    if (!upstreamRes.ok) {
      let sanitizedMessage = "Image optimization failed.";
      let errorCode = "OPTIMIZATION_FAILED";

      try {
        const errorBody = await upstreamRes.json();
        if (errorBody?.detail?.error) {
          sanitizedMessage = errorBody.detail.error;
          errorCode = errorBody.detail.code || errorCode;
        } else if (typeof errorBody?.detail === "string") {
          sanitizedMessage = errorBody.detail;
        }
      } catch {
        sanitizedMessage = `Upstream error HTTP ${upstreamRes.status}.`;
      }

      return NextResponse.json(
        { error: sanitizedMessage, code: errorCode, upstreamStatus: upstreamRes.status },
        { status: upstreamRes.status }
      );
    }

    // 7. Stream Binary Output with Whitelisted Metadata Headers
    const responseBlob = await upstreamRes.blob();
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", upstreamRes.headers.get("content-type") || "image/webp");

    for (const h of FORWARDED_METADATA_HEADERS) {
      const val = upstreamRes.headers.get(h);
      if (val !== null) {
        responseHeaders.set(h, val);
      }
    }

    return new Response(responseBlob, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err: any) {
    if (err.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Image optimization processing timed out.", code: "UPSTREAM_TIMEOUT" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Image optimization service is currently unreachable.", code: "UPSTREAM_UNAVAILABLE" },
      { status: 502 }
    );
  }
}
