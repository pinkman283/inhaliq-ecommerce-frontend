"use client";

import { useEffect, useRef, Suspense } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { META_PIXEL_ID, trackPageView } from "@/lib/metaPixel";

/**
 * Route Tracker subcomponent that listens to Next.js App Router client-side navigation.
 * Wrapped in Suspense to satisfy useSearchParams requirement.
 */
export function MetaPixelRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstMount = useRef(true);
  const lastTrackedUrl = useRef<string>("");

  useEffect(() => {
    // Construct full path with search parameters
    const queryString = searchParams?.toString();
    const currentUrl = queryString ? `${pathname}?${queryString}` : pathname;

    // Do not track admin backoffice routes
    if (pathname?.startsWith("/admin")) {
      lastTrackedUrl.current = currentUrl;
      return;
    }

    // Skip tracking on initial mount if already tracked by base script in <head>
    if (isFirstMount.current) {
      isFirstMount.current = false;
      lastTrackedUrl.current = currentUrl;
      return;
    }

    // Trigger PageView only if URL has actually changed
    if (currentUrl && currentUrl !== lastTrackedUrl.current) {
      lastTrackedUrl.current = currentUrl;
      trackPageView();
    }
  }, [pathname, searchParams]);

  return null;
}

export function MetaPixel() {
  return (
    <Suspense fallback={null}>
      <MetaPixelRouteTracker />
    </Suspense>
  );
}
