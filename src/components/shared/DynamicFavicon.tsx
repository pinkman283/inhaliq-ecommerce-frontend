"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/useThemeStore";

/**
 * Safely updates browser tab favicon in the live DOM without removing any nodes.
 * Mutating .href is safe for React reconciliation and avoids "removeChild" errors.
 */
export function DynamicFavicon() {
  const { theme } = useThemeStore();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const applyFaviconHref = (targetUrl: string, bustCache = false) => {
      try {
        const cacheBuster = bustCache && (targetUrl.startsWith("http") || targetUrl.startsWith("/storage"))
          ? (targetUrl.includes("?") ? `${targetUrl}&v=${Date.now()}` : `${targetUrl}?v=${Date.now()}`)
          : targetUrl;

        // Select all icon links (icon, shortcut icon, apple-touch-icon)
        const iconLinks = Array.from(document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']"));

        if (iconLinks.length > 0) {
          iconLinks.forEach((link) => {
            if (link.getAttribute("href") !== cacheBuster) {
              link.href = cacheBuster;
            }
          });
        } else {
          let dynamicLink = document.getElementById("dynamic-favicon-link") as HTMLLinkElement | null;
          if (!dynamicLink) {
            dynamicLink = document.createElement("link");
            dynamicLink.id = "dynamic-favicon-link";
            dynamicLink.rel = "icon";
            document.head.appendChild(dynamicLink);
          }
          dynamicLink.href = cacheBuster;
        }
      } catch (e) {
        console.warn("Favicon update notice:", e);
      }
    };

    const updateFaviconInDOM = (url?: string, bustCache = false) => {
      const rawUrl = url?.trim() || "";
      const defaultFavicon = "/favicon.png";

      if (!rawUrl || rawUrl === defaultFavicon || rawUrl === "/favicon.ico") {
        applyFaviconHref(defaultFavicon, bustCache);
        return;
      }

      // Apply immediately so user never sees a momentary flash
      applyFaviconHref(rawUrl, bustCache);

      // Background safety check: if custom URL fails to load (404/broken), revert to default
      const img = new Image();
      img.onerror = () => {
        applyFaviconHref(defaultFavicon);
      };
      img.src = rawUrl;
    };

    updateFaviconInDOM(theme?.store_favicon, false);

    const handleCustomFavicon = (e: any) => {
      updateFaviconInDOM(e.detail, true);
    };

    window.addEventListener("store_favicon_updated", handleCustomFavicon);
    return () => {
      window.removeEventListener("store_favicon_updated", handleCustomFavicon);
    };
  }, [theme?.store_favicon]);

  return null;
}
