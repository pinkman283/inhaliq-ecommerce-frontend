"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics";

interface PublicTrackingConfig {
  gtm: {
    enabled: boolean;
    container_id: string | null;
    data_layer_name?: string;
  };
  meta_pixel: {
    enabled: boolean;
    pixel_id: string | null;
    settings?: {
      auto_pageview?: boolean;
      track_view_content?: boolean;
      track_search?: boolean;
      track_add_to_cart?: boolean;
      track_initiate_checkout?: boolean;
      track_purchase?: boolean;
    };
  };
}

/**
 * Route Tracker subcomponent that listens to Next.js App Router client-side transitions.
 */
function RouteChangeTracker({ config }: { config: PublicTrackingConfig | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstMount = useRef(true);
  const lastTrackedUrl = useRef<string>("");

  useEffect(() => {
    if (!config) return;

    const queryString = searchParams?.toString();
    const currentUrl = queryString ? `${pathname}?${queryString}` : pathname;

    // Do not track admin backoffice routes
    if (pathname?.startsWith("/admin")) {
      lastTrackedUrl.current = currentUrl;
      return;
    }

    // Skip tracking on initial mount if already initialized by base script
    if (isFirstMount.current) {
      isFirstMount.current = false;
      lastTrackedUrl.current = currentUrl;
      return;
    }

    // Trigger PageView only when URL has changed
    if (currentUrl && currentUrl !== lastTrackedUrl.current) {
      lastTrackedUrl.current = currentUrl;
      trackPageView(currentUrl);
    }
  }, [pathname, searchParams, config]);

  return null;
}

/**
 * Dynamic Tracking Scripts Manager
 * Loads Meta Pixel and GTM dynamically based on backend admin settings.
 */
export function TrackingScripts() {
  const [config, setConfig] = useState<PublicTrackingConfig | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTrackingConfig() {
      try {
        const rawBackendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const backendBaseUrl = rawBackendUrl.replace(/\/api\/?$/, "");
        const res = await fetch(`${backendBaseUrl}/api/integrations/tracking`, {
          cache: "no-store",
        });

        if (res.ok) {
          const data: PublicTrackingConfig = await res.json();
          if (isMounted) {
            setConfig(data);
          }
        }
      } catch (err) {
        console.debug("[Analytics] Failed to fetch dynamic tracking config:", err);
      }
    }

    loadTrackingConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  const metaEnabled = Boolean(config?.meta_pixel?.enabled && config?.meta_pixel?.pixel_id);
  const pixelId = config?.meta_pixel?.pixel_id || "";

  const gtmEnabled = Boolean(config?.gtm?.enabled && config?.gtm?.container_id);
  const gtmId = config?.gtm?.container_id || "";
  const dataLayerName = config?.gtm?.data_layer_name || "dataLayer";

  return (
    <>
      <Suspense fallback={null}>
        <RouteChangeTracker config={config} />
      </Suspense>

      {/* Meta Pixel dynamic script */}
      {metaEnabled && (
        <>
          <Script
            id="meta-pixel-dynamic"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${pixelId}');
                ${config?.meta_pixel?.settings?.auto_pageview !== false ? "fbq('track', 'PageView');" : ""}
              `,
            }}
          />
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}

      {/* Google Tag Manager dynamic script */}
      {gtmEnabled && (
        <>
          <Script
            id="gtm-dynamic"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','${dataLayerName}','${gtmId}');
              `,
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        </>
      )}
    </>
  );
}
