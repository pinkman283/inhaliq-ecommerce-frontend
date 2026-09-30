import { NextRequest, NextResponse } from "next/server";
import { cachedFetch, createDeterministicHash, getRedisClient } from "@/lib/redis";

function getUpstreamConfig() {
  const provider = (process.env.BACKEND_PROVIDER || process.env.NEXT_PUBLIC_BACKEND_PROVIDER || "senior").toLowerCase();
  const isSenior = provider === "senior";

  const baseUrl = isSenior
    ? (process.env.SENIOR_API_BASE_URL || "http://127.0.0.1:8000/api/v1")
    : (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api");

  // Private secret key - injected server-side only, NEVER sent to client
  const apiKey = isSenior ? (process.env.SENIOR_API_KEY || "") : "";

  return {
    isSenior,
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey,
  };
}

interface CacheRule {
  key: (path: string[], searchParams: URLSearchParams) => string;
  ttl: number;
  tags: string[];
}

// Rules mapping paths to Redis keys and TTLs
function matchCacheRule(path: string[], searchParams: URLSearchParams): CacheRule | null {
  const pathStr = path.join("/");

  // 0. Header Navigation & Init Settings
  if (pathStr === "navigation/header" || pathStr === "nav-menu") {
    return {
      key: () => "aether:navigation:header",
      ttl: 86400, // 24 hours
      tags: ["navigation"],
    };
  }

  if (pathStr === "init-settings") {
    return {
      key: () => "aether:settings:init",
      ttl: 86400, // 24 hours
      tags: ["settings"],
    };
  }

  // 1. Homepage Banners
  if (pathStr === "homepage/banners" || pathStr === "home") {
    return {
      key: () => "aether:banners:homepage",
      ttl: 3600, // 1 hour
      tags: ["banners", "homepage"],
    };
  }

  // 2. Homepage Sections
  if (pathStr === "homepage/sections") {
    return {
      key: () => "aether:sections:homepage",
      ttl: 3600, // 1 hour
      tags: ["sections"],
    };
  }

  // 3. Section Tab Products: homepage/sections/{id}/tab-products
  if (path.length === 4 && path[0] === "homepage" && path[1] === "sections" && path[3] === "tab-products") {
    const sectionId = path[2];
    const tabId = searchParams.get("tab_id") || "default";
    return {
      key: () => `aether:sections:${sectionId}:tab:${tabId}`,
      ttl: 1800, // 30 minutes
      tags: ["sections"],
    };
  }

  // 4. Featured Products/Categories
  if (pathStr === "featured") {
    return {
      key: () => "aether:products:featured",
      ttl: 3600, // 1 hour
      tags: ["products", "featured"],
    };
  }

  // 5. Categories
  if (pathStr === "categories") {
    return {
      key: () => "aether:categories:all",
      ttl: 21600, // 6 hours
      tags: ["categories"],
    };
  }
  if (path.length === 2 && (path[0] === "categories" || path[0] === "category")) {
    const slug = path[1];
    return {
      key: () => `aether:category:${slug}`,
      ttl: 21600, // 6 hours
      tags: ["categories"],
    };
  }

  // 6. Brands
  if (pathStr === "brands") {
    return {
      key: () => "aether:brands:all",
      ttl: 21600, // 6 hours
      tags: ["brands"],
    };
  }
  if (path.length === 2 && (path[0] === "brands" || path[0] === "brand")) {
    const slug = path[1];
    return {
      key: () => `aether:brand:${slug}`,
      ttl: 21600, // 6 hours
      tags: ["brands"],
    };
  }

  // 7. Products Listing vs Single Product
  if (pathStr === "products") {
    const hasSearch = Boolean(searchParams.get("search") || searchParams.get("keyword"));
    const queryHash = createDeterministicHash(searchParams);
    return {
      key: () => `aether:products:list:${queryHash}`,
      ttl: hasSearch ? 60 : 300, // 5 minutes for general catalog, 1 min for search
      tags: ["products"],
    };
  }
  if (path.length === 2 && (path[0] === "products" || path[0] === "product")) {
    const slug = path[1];
    return {
      key: () => `aether:product:${slug}`,
      ttl: 600, // 10 minutes
      tags: ["products"],
    };
  }

  // 8. Colors
  if (pathStr === "colors") {
    return {
      key: () => "aether:colors:active",
      ttl: 86400, // 24 hours
      tags: ["colors"],
    };
  }

  // 9. CMS Pages: pages/{slug}
  if (path.length === 2 && (path[0] === "pages" || path[0] === "page")) {
    const slug = path[1];
    return {
      key: () => `aether:cms:page:${slug}`,
      ttl: 86400, // 24 hours
      tags: ["pages"],
    };
  }

  // 10. Blog Posts Listing: blog/posts or blogs
  if (pathStr === "blog/posts" || pathStr === "blogs") {
    const queryHash = createDeterministicHash(searchParams);
    return {
      key: () => `aether:blog:list:${queryHash}`,
      ttl: 3600, // 1 hour
      tags: ["blog"],
    };
  }

  // 11. Shipping & Payment Gateways
  if (pathStr === "shipping-zones" || pathStr === "shipping-charge") {
    return {
      key: () => "aether:shipping:charges",
      ttl: 43200, // 12 hours
      tags: ["shipping"],
    };
  }

  if (pathStr === "payment-gateways" || pathStr === "payment-methods") {
    return {
      key: () => "aether:payment:gateways",
      ttl: 43200, // 12 hours
      tags: ["payments"],
    };
  }

  return null;
}

function buildForwardHeaders(request: NextRequest, apiKey: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const authHeader = request.headers.get("authorization");
  if (authHeader) headers["Authorization"] = authHeader;

  // Pass-through tracking headers (Meta CAPI & Client Device)
  const eventSourceUrl = request.headers.get("x-event-source-url");
  if (eventSourceUrl) headers["X-Event-Source-Url"] = eventSourceUrl;

  const fbp = request.headers.get("x-fbp");
  if (fbp) headers["X-FBP"] = fbp;

  const fbc = request.headers.get("x-fbc");
  if (fbc) headers["X-FBC"] = fbc;

  const deviceId = request.headers.get("x-device-id");
  if (deviceId) headers["X-Device-ID"] = deviceId;

  const idempotencyKey = request.headers.get("x-idempotency-key");
  if (idempotencyKey) headers["X-Idempotency-Key"] = idempotencyKey;

  // Inject secure server-side API Key
  if (apiKey) {
    headers["X-API-KEY"] = apiKey;
  }

  return headers;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const searchParams = request.nextUrl.searchParams;
  const pathStr = path.join("/");
  const searchStr = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const { baseUrl, apiKey } = getUpstreamConfig();
  const targetUrl = `${baseUrl}/${pathStr}${searchStr}`;

  const rule = matchCacheRule(path, searchParams);

  // If endpoint is not configured for caching or user is authenticated, pass through
  const hasAuth = Boolean(request.headers.get("authorization"));
  if (!rule || hasAuth) {
    try {
      const response = await fetch(targetUrl, {
        headers: buildForwardHeaders(request, apiKey),
        signal: AbortSignal.timeout(10000),
      });

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        return NextResponse.json(data, {
          status: response.status,
          headers: {
            "X-Cache": "BYPASS",
          },
        });
      }

      const text = await response.text();
      return new NextResponse(text, {
        status: response.status,
        headers: {
          "Content-Type": contentType || "text/plain",
          "X-Cache": "BYPASS",
        },
      });
    } catch (err: any) {
      console.error(`[Proxy] Pass-through fetch error for ${targetUrl}:`, err);
      return NextResponse.json(
        { error: "Upstream service error", details: err?.message },
        { status: 502 }
      );
    }
  }

  // Cacheable endpoint
  const cacheKey = rule.key(path, searchParams);
  const redis = getRedisClient();

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached !== null && cached !== undefined) {
        return NextResponse.json(cached, {
          status: 200,
          headers: {
            "X-Cache": "HIT",
            "X-Cache-Key": cacheKey,
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        });
      }
    } catch (err) {
      console.warn(`[Proxy] Redis read error for ${cacheKey}:`, err);
    }
  }

  // Cache Miss
  try {
    const data = await cachedFetch(
      cacheKey,
      async () => {
        const res = await fetch(targetUrl, {
          headers: buildForwardHeaders(request, apiKey),
          signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) {
          throw new Error(`Upstream API error: ${res.status} ${res.statusText}`);
        }

        return await res.json();
      },
      {
        ttlSeconds: rule.ttl,
        tags: rule.tags,
      }
    );

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "X-Cache": "MISS",
        "X-Cache-Key": cacheKey,
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err: any) {
    console.error(`[Proxy] Error fetching/caching ${targetUrl}:`, err);
    return NextResponse.json(
      { error: "Failed to fetch upstream resource", message: err?.message },
      { status: 502 }
    );
  }
}

async function forwardMutation(
  method: string,
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const searchParams = request.nextUrl.searchParams;
  const pathStr = path.join("/");
  const searchStr = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const { baseUrl, apiKey } = getUpstreamConfig();
  const targetUrl = `${baseUrl}/${pathStr}${searchStr}`;

  const forwardHeaders = buildForwardHeaders(request, apiKey) as Record<string, string>;
  const reqContentType = request.headers.get("content-type");
  if (reqContentType) {
    forwardHeaders["Content-Type"] = reqContentType;
  }

  let body: any = undefined;
  if (method !== "GET" && method !== "HEAD") {
    try {
      if (reqContentType?.includes("application/json")) {
        const json = await request.json();
        body = JSON.stringify(json);
      } else {
        body = await request.text();
      }
    } catch {
      // Body may be empty
    }
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      method,
      headers: forwardHeaders,
      body,
      signal: AbortSignal.timeout(15000),
    });

    const contentType = upstreamRes.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await upstreamRes.json();
      return NextResponse.json(data, { status: upstreamRes.status });
    }

    const text = await upstreamRes.text();
    return new NextResponse(text, {
      status: upstreamRes.status,
      headers: { "Content-Type": contentType || "text/plain" },
    });
  } catch (err: any) {
    console.error(`[Proxy] Mutation error for ${method} ${targetUrl}:`, err);
    return NextResponse.json(
      { error: "Upstream service error during mutation", details: err?.message },
      { status: 502 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forwardMutation("POST", request, context);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forwardMutation("PUT", request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forwardMutation("PATCH", request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forwardMutation("DELETE", request, context);
}
