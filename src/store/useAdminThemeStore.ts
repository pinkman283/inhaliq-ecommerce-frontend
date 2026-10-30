"use client";

import React from "react";
import { create } from "zustand";
import { adminApi } from "@/lib/adminApi";
import { useAdminAuthStore } from "@/store/useAdminAuthStore";
import { toast } from "sonner";

export type AdminThemeMode = "dark" | "light";

export interface ThemeTransitionOrigin {
  x: number;
  y: number;
}

/**
 * Computes exact click origin coordinates from a MouseEvent,
 * centering on the target element for symmetrical circular ripples (matching Bricky).
 */
export function getOriginFromEvent(e?: React.MouseEvent): ThemeTransitionOrigin | undefined {
  if (!e) return undefined;

  const target = e.currentTarget as HTMLElement | null;
  if (target && typeof target.getBoundingClientRect === "function") {
    const rect = target.getBoundingClientRect();
    return {
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height / 2),
    };
  }

  if (e.clientX !== 0 || e.clientY !== 0) {
    return { x: Math.round(e.clientX), y: Math.round(e.clientY) };
  }

  return undefined;
}

interface AdminThemeState {
  theme: AdminThemeMode;
  isInitialized: boolean;
  isSaving: boolean;
  initUserTheme: (userId?: number | null, serverTheme?: string | null) => void;
  toggleTheme: (origin?: ThemeTransitionOrigin) => Promise<void>;
  setTheme: (mode: AdminThemeMode, origin?: ThemeTransitionOrigin) => Promise<void>;
  resetTheme: () => void;
}

function mutateDOMTheme(mode: AdminThemeMode) {
  if (typeof document === "undefined") return;
  const body = document.body;
  if (!body) return;

  if (mode === "light") {
    body.classList.add("admin-theme-light");
    body.setAttribute("data-admin-theme", "light");
  } else {
    body.classList.remove("admin-theme-light");
    body.setAttribute("data-admin-theme", "dark");
  }
}

/**
 * Ultra-smooth, GPU-accelerated circular clip-path reveal matching Bricky.
 * Originates from the exact center of the clicked toggle button,
 * expanding outwards smoothly across the viewport with fluid Apple deceleration.
 */
async function applyThemeWithAnimation(mode: AdminThemeMode, origin?: ThemeTransitionOrigin) {
  if (typeof document === "undefined" || typeof window === "undefined") return;

  const body = document.body;
  const root = document.documentElement;
  if (!body || !root) return;

  // Instant mutation without transition on initial load or reset
  if (!origin) {
    mutateDOMTheme(mode);
    return;
  }

  // If user prefers reduced motion, skip view transitions
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    mutateDOMTheme(mode);
    return;
  }

  // Modern Native View Transition API (Chromium, Edge, Safari 18+)
  if (
    typeof document !== "undefined" &&
    "startViewTransition" in document &&
    typeof (document as any).startViewTransition === "function"
  ) {
    try {
      // 1. Lock live DOM CSS transitions during snapshot capture so all elements
      // snap to their final settled colors before the transition begins.
      root.classList.add("admin-theme-clip-active");

      const transition = (document as any).startViewTransition(() => {
        mutateDOMTheme(mode);
      });

      if (origin && typeof transition.ready?.then === "function") {
        await transition.ready;

        const x = origin.x;
        const y = origin.y;
        // Subpixel buffer ensures 100% viewport coverage on high-DPI screens
        const endRadius = Math.ceil(
          Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
          )
        ) + 2;

        // Ultra-fluid deceleration circular reveal: 520ms with cubic-bezier(0.16, 1, 0.3, 1)
        const anim = root.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 520,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            fill: "forwards",
            pseudoElement: "::view-transition-new(root)",
          }
        );

        // Wait for animation to finish completely (with safety timeout for throttled tabs)
        await Promise.race([
          anim.finished,
          new Promise((resolve) => setTimeout(resolve, 620)),
        ]).catch(() => {});

        // Race transition teardown with safety timeout
        if (transition.finished) {
          await Promise.race([
            transition.finished,
            new Promise((resolve) => setTimeout(resolve, 140)),
          ]).catch(() => {});
        }
      } else if (transition && typeof transition.finished?.then === "function") {
        await Promise.race([
          transition.finished,
          new Promise((resolve) => setTimeout(resolve, 520)),
        ]).catch(() => {});
      }

      // Wait for next animation frame so the compositor paints the settled DOM
      await Promise.race([
        new Promise((resolve) => requestAnimationFrame(resolve)),
        new Promise((resolve) => setTimeout(resolve, 40)),
      ]);
      return;
    } catch (_) {
      // Fall through to fallback
    } finally {
      root.classList.remove("admin-theme-clip-active");
    }
  }

  // Smooth fallback for browsers without View Transition API
  body.classList.add("admin-theme-transitioning");
  mutateDOMTheme(mode);

  await new Promise<void>((resolve) => {
    setTimeout(() => {
      body.classList.remove("admin-theme-transitioning");
      resolve();
    }, 300);
  });
}

function getCacheKey(userId: number | string): string {
  return `aether_admin_theme_${userId}`;
}

export const useAdminThemeStore = create<AdminThemeState>((set, get) => ({
  theme: "dark",
  isInitialized: false,
  isSaving: false,

  initUserTheme: (userId, serverTheme) => {
    if (typeof window === "undefined") return;

    let targetTheme: AdminThemeMode = "dark";

    if (userId) {
      const cacheKey = getCacheKey(userId);
      const cached = localStorage.getItem(cacheKey);

      if (serverTheme === "light" || serverTheme === "dark") {
        targetTheme = serverTheme;
        localStorage.setItem(cacheKey, serverTheme);
      } else if (cached === "light" || cached === "dark") {
        targetTheme = cached;
      }
    }

    // Initial mount: instant without transition delay or flash
    mutateDOMTheme(targetTheme);
    set({ theme: targetTheme, isInitialized: true });
  },

  toggleTheme: async (origin?: ThemeTransitionOrigin) => {
    const current = get().theme;
    const next: AdminThemeMode = current === "dark" ? "light" : "dark";
    await get().setTheme(next, origin);
  },

  setTheme: async (nextTheme: AdminThemeMode, origin?: ThemeTransitionOrigin) => {
    if (nextTheme !== "dark" && nextTheme !== "light") {
      nextTheme = "dark";
    }

    const previousTheme = get().theme;
    if (previousTheme === nextTheme && get().isInitialized) return;

    // 1. Immediately trigger GPU-accelerated circular reveal or fallback transition
    set({ theme: nextTheme, isSaving: true });
    await applyThemeWithAnimation(nextTheme, origin);

    const adminUser = useAdminAuthStore.getState().adminUser;
    if (adminUser?.id && typeof window !== "undefined") {
      const cacheKey = getCacheKey(adminUser.id);
      localStorage.setItem(cacheKey, nextTheme);
      useAdminAuthStore.getState().updateAdminUser({ admin_theme: nextTheme });
    }

    // 2. Dispatch persistent server-side update asynchronously
    try {
      await adminApi.updateAdminTheme(nextTheme);
    } catch (err: unknown) {
      console.warn("[AdminTheme] Failed to save theme preference to server:", err);
      toast.error("Could not save theme preference to server. Your choice is kept locally.", {
        duration: 3500,
      });
    } finally {
      set({ isSaving: false });
    }
  },

  resetTheme: () => {
    mutateDOMTheme("dark");
    set({ theme: "dark", isInitialized: false, isSaving: false });
  },
}));
