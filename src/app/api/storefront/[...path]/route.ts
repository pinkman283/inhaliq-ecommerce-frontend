import { NextRequest, NextResponse } from "next/server";
import { cachedFetch, createDeterministicHash, getRedisClient } from "@/lib/redis";

const LARAVEL_API_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api";

interface CacheRule {
  key: (path: string[], searchParams: URLSearchParams) => string;
  ttl: number;
  tags: string[];
}

// Rules mapping paths to Redis keys and TTLs
function matchCacheRule(path: string[], searchParams: URLSearchParams): CacheRule | null {
  const pathStr = path.join("/");

  // 0. Header Navigation
  if (pathStr === "navigation/header") {
    return {
      key: () => "aether:navigation:header",
      ttl: 86400, // 24 hours
      tags: ["navigation"],
    };
  }

  // 1. Homepage Banners
  if (pathStr === "homepage/banners") {
    return {
      key: () => "aether:banners:homepage",
      ttl: 7200, // 2 hours
      tags: ["banners"],
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
  if (path.length === 2 && path[0] === "categories") {
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
  if (path.length === 2 && path[0] === "brands") {
    const slug = path[1];
    return {
      key: () => `aether:brand:${slug}`,
      ttl: 21600, // 6 hours
      tags: ["brands"],
    };
  }

  // 7. Products Listing vs Single Product
  if (pathStr === "products") {
    // If search term is present, we keep TTL very short (60s) for freshness
    const hasSearch = Boolean(searchParams.get("search"));
    const queryHash = createDeterministicHash(searchParams);
    return {
      key: () => `aether:products:list:${queryHash}`,
      ttl: hasSearch ? 60 : 300, // 5 minutes for general catalog, 1 min for search
      tags: ["products"],
    };
  }
  if (path.length === 2 && path[0] === "products") {
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
  if (path.length === 2 && path[0] === "pages") {
    const slug = path[1];
    return {
      key: () => `aether:cms:page:${slug}`,
      ttl: 86400, // 24 hours
      tags: ["pages"],
    };
  }

  // 10. Blog Posts Listing: blog/posts
  if (pathStr === "blog/posts") {
    const queryHash = createDeterministicHash(searchParams);
    return {
      key: () => `aether:blog:list:${queryHash}`,
      ttl: 3600, // 1 hour
      tags: ["blog"],
    };
  }

  // 11. Shipping Zones
  if (pathStr === "shipping-zones") {
    return {
      key: () => "aether:shipping:zones",
      ttl: 43200, // 12 hours
      tags: ["shipping"],
    };
  }

  // 12. Store Navigation & Footer
  if (pathStr === "store-navigation") {
    return {
      key: () => "aether:store:navigation",
      ttl: 21600, // 6 hours
      tags: ["navigation", "footer"],
    };
  }

  // NOTE: blog/posts/{slug} is intentionally EXCLUDED to ensure view counter increment runs on Laravel.
  // NOTE: promotions/claimable is intentionally EXCLUDED to prevent cross-user state leaks.

  return null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const searchParams = request.nextUrl.searchParams;
  const pathStr = path.join("/");
  const searchStr = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const targetUrl = `${LARAVEL_API_URL}/${pathStr}${searchStr}`;

  const rule = matchCacheRule(path, searchParams);

  // If endpoint is not configured for caching, pass through directly to Laravel API
  if (!rule) {
    try {
      const response = await fetch(targetUrl, {
        headers: {
          Accept: "application/json",
          ...(request.headers.get("authorization")
            ? { Authorization: request.headers.get("authorization")! }
            : {}),
        },
        signal: AbortSignal.timeout(8000),
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

  // Fast path: Check Redis if available
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

  // On Cache Miss -> Fetch upstream with cachedFetch logic
  try {
    const data = await cachedFetch(
      cacheKey,
      async () => {
        const res = await fetch(targetUrl, {
          headers: {
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(8000),
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
