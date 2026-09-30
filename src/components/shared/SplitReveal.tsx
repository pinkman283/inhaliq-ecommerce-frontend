"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppTheme } from "@/components/providers/ThemeProvider";
import { ThemeSettings, resolveLogo } from "@/store/useThemeStore";
import { BrandLogoImage } from "@/components/shared/BrandLogoImage";

function sanitizeAssetUrl(url?: string): string {
  if (!url) return "";
  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    url.startsWith("http://") &&
    !url.includes("localhost") &&
    !url.includes("127.0.0.1")
  ) {
    return url.replace(/^http:\/\//i, "https://");
  }
  return url;
}

export function SplitReveal({ initialTheme, onComplete: onCompleteCb }: { initialTheme?: ThemeSettings; onComplete?: () => void }) {
  const pathname = usePathname();
  const { theme } = useAppTheme();
  const isAdmin = pathname?.startsWith("/admin");
  const [previewTheme, setPreviewTheme] = useState<Partial<ThemeSettings> | null>(null);

  // Active merged theme: preview overrides theme, which overrides initialTheme
  const activeTheme: ThemeSettings = {
    ...(initialTheme || {}),
    ...theme,
    ...(previewTheme || {}),
  };

  const mode = activeTheme.split_reveal_mode || "every_time";
  const splitRevealEnabled = activeTheme.split_reveal_enabled ?? true;

  // Frame-0 SSR Parity: Server and Client evaluate identical boolean on initial render
  const shouldShowOnMount = !isAdmin && splitRevealEnabled;
  const [isVisible, setIsVisible] = useState(shouldShowOnMount);
  const [isOpening, setIsOpening] = useState(false);
  const isFinishedRef = useRef(false);

  // Real-Time Progress State (0% to 100%)
  const [loaderProgress, setLoaderProgress] = useState(15);
  const targetProgressRef = useRef(20);
  const startTimeRef = useRef(0);

  // Active assets
  const rawBg =
    activeTheme.split_reveal_image ||
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=2000&q=85";
  const bgImage = sanitizeAssetUrl(rawBg);
  const rawLogo = resolveLogo(activeTheme, "split_reveal", "/branding/logo.png");
  const logoUrl = sanitizeAssetUrl(rawLogo);
  const isVertical = (activeTheme.split_reveal_direction || "vertical") === "vertical";
  const dimOpacity = activeTheme.split_reveal_dim ?? 0.45;
  const effectiveDim = Math.min(dimOpacity * 0.1, 0.04);

  // Configured duration (e.g. 2.5s)
  const rawDuration = Number(activeTheme.split_reveal_duration);
  const openingDuration = !isNaN(rawDuration) && rawDuration > 0 ? Math.max(rawDuration, 1.2) : 2.5;
  const cinematicEase = [0.76, 0, 0.24, 1] as const;

  // Completion handler to unmount curtain and release interactions
  const handleComplete = useCallback(() => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    setIsVisible(false);
    setIsOpening(false);
    setPreviewTheme(null);

    // Release body scroll lock
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }

    // Persist seen cookie and sessionStorage flag
    if (typeof window !== "undefined") {
      try {
        if (mode === "once_per_session") {
          sessionStorage.setItem("aether_split_reveal_seen", "true");
          // Pure session cookie without max-age: automatically purges when session closes
          document.cookie = "aether_split_reveal_seen=true; path=/; SameSite=Lax";
        }
      } catch (e) {}
    }

    // Notify parent that the split reveal animation has finished
    onCompleteCb?.();
  }, [mode, onCompleteCb]);

  // Hybrid Real-Time Asset & Hydration Engine
  useEffect(() => {
    if (!isVisible) return;
    if (isAdmin && !previewTheme) return;

    // Lock body scroll
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }

    // Check once_per_session in sessionStorage as fallback guard
    if (mode === "once_per_session" && !previewTheme && typeof window !== "undefined") {
      try {
        if (sessionStorage.getItem("aether_split_reveal_seen") === "true") {
          handleComplete();
          return;
        }
      } catch (e) {}
    }

    isFinishedRef.current = false;
    startTimeRef.current = Date.now();
    targetProgressRef.current = 25;
    setLoaderProgress(15);

    let animFrameId: number;
    let currentP = 15;
    let isFullReady = false;

    // 1. Track Typography (document.fonts.ready)
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready
        .then(() => {
          targetProgressRef.current = Math.max(targetProgressRef.current, 40);
        })
        .catch(() => {});
    }

    // 2. Track DOM lifecycle (document.readyState)
    if (typeof document !== "undefined") {
      if (document.readyState === "complete") {
        targetProgressRef.current = Math.max(targetProgressRef.current, 50);
      } else {
        const onDomLoaded = () => {
          targetProgressRef.current = Math.max(targetProgressRef.current, 50);
          window.removeEventListener("load", onDomLoaded);
        };
        window.addEventListener("load", onDomLoaded);
      }
    }

    // 3. Track Critical Images (Wallpaper & Brand Logo)
    const imagesToPreload: string[] = [];
    if (bgImage) imagesToPreload.push(bgImage);
    if (logoUrl) imagesToPreload.push(logoUrl);

    let imagesLoadedCount = 0;
    const totalImages = Math.max(imagesToPreload.length, 1);

    const triggerFullReadiness = () => {
      if (isFullReady) return;
      isFullReady = true;

      // Minimum aesthetic floor: 800ms to preserve brand intro perception
      const elapsed = Date.now() - startTimeRef.current;
      const minFloorMs = 800;
      const remainingDelay = Math.max(0, minFloorMs - elapsed);

      setTimeout(() => {
        targetProgressRef.current = 100;
      }, remainingDelay);
    };

    const handleSingleImageLoaded = () => {
      imagesLoadedCount++;
      const imageProgress = 50 + Math.round((imagesLoadedCount / totalImages) * 35); // 50% -> 85%
      targetProgressRef.current = Math.max(targetProgressRef.current, imageProgress);

      if (imagesLoadedCount >= totalImages) {
        triggerFullReadiness();
      }
    };

    if (imagesToPreload.length === 0) {
      triggerFullReadiness();
    } else {
      imagesToPreload.forEach((src) => {
        const img = new Image();
        img.src = src;
        if (img.complete) {
          handleSingleImageLoaded();
        } else {
          img.onload = handleSingleImageLoaded;
          img.onerror = handleSingleImageLoaded;
        }
      });
    }

    // 4. Safety Ceiling Timer: Never block customer longer than 3.0s under any network condition
    const safetyCeilingTimer = setTimeout(() => {
      triggerFullReadiness();
    }, 3000);

    // 5. Watchdog Timeout to guarantee unmount even if transition events are dropped
    const totalWatchdogMs = 3000 + Math.round(openingDuration * 1000) + 1200;
    const watchdogTimer = setTimeout(() => {
      handleComplete();
    }, totalWatchdogMs);

    // 6. High-Frequency Smooth Interpolation Loop
    const runInterpolationLoop = () => {
      const target = targetProgressRef.current;
      if (currentP < target) {
        // High speed when target is 100%, smooth realistic easing when awaiting assets
        const delta = target === 100 ? Math.max((target - currentP) * 0.18, 1.8) : Math.max((target - currentP) * 0.08, 0.4);
        currentP = Math.min(currentP + delta, target);
        setLoaderProgress(Math.round(currentP));
      }

      if (currentP < 100) {
        animFrameId = requestAnimationFrame(runInterpolationLoop);
      } else {
        // 100% reached: 120ms settle pause, then trigger shutter split
        setTimeout(() => {
          setIsOpening(true);
        }, 120);
      }
    };

    animFrameId = requestAnimationFrame(runInterpolationLoop);

    return () => {
      cancelAnimationFrame(animFrameId);
      clearTimeout(safetyCeilingTimer);
      clearTimeout(watchdogTimer);
    };
  }, [isVisible, openingDuration, isAdmin, previewTheme, mode, bgImage, logoUrl, handleComplete]);

  // Admin live preview event listener
  useEffect(() => {
    const handlePreviewEvent = (e: Event) => {
      const customEvent = e as CustomEvent<Partial<ThemeSettings>>;
      if (customEvent.detail) {
        setPreviewTheme(customEvent.detail);
      }
      isFinishedRef.current = false;
      setIsOpening(false);
      setIsVisible(true);
      setLoaderProgress(15);
      targetProgressRef.current = 100;

      if (typeof document !== "undefined") {
        document.body.style.overflow = "hidden";
      }

      // Smooth simulation for preview
      let p = 15;
      const previewLoop = () => {
        p = Math.min(p + 3, 100);
        setLoaderProgress(p);
        if (p < 100) {
          requestAnimationFrame(previewLoop);
        } else {
          setTimeout(() => {
            setIsOpening(true);
          }, 120);
        }
      };
      requestAnimationFrame(previewLoop);
    };

    window.addEventListener("preview-split-reveal", handlePreviewEvent);
    return () => {
      window.removeEventListener("preview-split-reveal", handlePreviewEvent);
    };
  }, []);

  // Cleanup body scroll lock on unmount
  useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  // Unified logo or brand title component (splits cleanly with the shutters)
  const renderBrandLine = () => (
    <div className="flex items-center justify-center whitespace-nowrap pointer-events-none select-none px-4">
      <BrandLogoImage placement="split_reveal" priority={true} theme={activeTheme} />
    </div>
  );

  // Real-Time Smooth Loader Bar
  const renderLoaderBar = () => (
    <div
      className="w-48 sm:w-64 h-1 sm:h-1.5 rounded-full bg-white/20 overflow-hidden relative border border-white/30 shadow-lg backdrop-blur-sm pointer-events-none transition-opacity duration-300"
      style={{ opacity: isOpening ? 0 : 1 }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${loaderProgress}%`,
          background: "linear-gradient(90deg, var(--theme-primary, #006B45), var(--theme-secondary, #C6A15B))",
          boxShadow: "0 0 12px var(--theme-primary, #006B45)",
          transition: "width 0.06s linear",
        }}
      />
    </div>
  );

  return (
    <AnimatePresence>
      <div
        id="split-reveal-curtain"
        className="fixed inset-0 z-[99999] pointer-events-auto overflow-hidden select-none cursor-default"
        aria-hidden="true"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
        }}
      >
        {/* ========================================================================= */}
        {/* VERTICAL SPLIT: TOP & BOTTOM SHUTTERS */}
        {/* ========================================================================= */}
        {isVertical ? (
          <>
            {/* TOP SHUTTER (0% to 50vh) */}
            <motion.div
              initial={{ y: "0%" }}
              animate={{ y: isOpening ? "-100%" : "0%" }}
              transition={{ duration: openingDuration, ease: cinematicEase }}
              onAnimationComplete={() => {
                if (isOpening) {
                  handleComplete();
                }
              }}
              className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden border-b shadow-2xl pointer-events-auto"
              style={{
                backgroundColor: "var(--theme-bg, #090a0f)",
                borderBottomColor: "color-mix(in srgb, var(--theme-primary, #006B45) 40%, transparent)",
                willChange: "transform",
                transform: "translateZ(0)",
              }}
            >
              {/* Seamless Fullscreen Background (shows top half) */}
              <div
                className="absolute top-0 left-0 w-full h-[100vh] bg-cover bg-center pointer-events-none"
                style={{ backgroundImage: `url("${bgImage}")` }}
              />

              {/* Ultra-subtle tint so image is vivid and clearly visible */}
              <div
                className="absolute inset-0"
                style={{ backgroundColor: "var(--theme-bg, #090a0f)", opacity: effectiveDim }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-transparent" />

              {/* Seam Glow Line at Bottom Edge */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[1px]"
                style={{
                  background: "linear-gradient(90deg, transparent, var(--theme-primary, #006B45), transparent)",
                  boxShadow: "0 0 14px var(--theme-primary, #006B45)",
                }}
              />

              {/* Top Half of Logo + Brand Name (elevated above split seam) */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[calc(50%-32px)] z-20 pointer-events-none">
                {renderBrandLine()}
              </div>
            </motion.div>

            {/* BOTTOM SHUTTER (50vh to 100vh) */}
            <motion.div
              initial={{ y: "0%" }}
              animate={{ y: isOpening ? "100%" : "0%" }}
              transition={{ duration: openingDuration, ease: cinematicEase }}
              className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden border-t shadow-2xl pointer-events-auto"
              style={{
                backgroundColor: "var(--theme-bg, #090a0f)",
                borderTopColor: "color-mix(in srgb, var(--theme-primary, #006B45) 40%, transparent)",
                willChange: "transform",
                transform: "translateZ(0)",
              }}
            >
              {/* Seamless Fullscreen Background offset by 50vh (shows bottom half) */}
              <div
                className="absolute -top-[50vh] left-0 w-full h-[100vh] bg-cover bg-center pointer-events-none"
                style={{ backgroundImage: `url("${bgImage}")` }}
              />

              {/* Ultra-subtle tint so image is vivid and clearly visible */}
              <div
                className="absolute inset-0"
                style={{ backgroundColor: "var(--theme-bg, #090a0f)", opacity: effectiveDim }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />

              {/* Seam Glow Line at Top Edge */}
              <div
                className="absolute top-0 left-0 right-0 h-[1px]"
                style={{
                  background: "linear-gradient(90deg, transparent, var(--theme-primary, #006B45), transparent)",
                  boxShadow: "0 0 14px var(--theme-primary, #006B45)",
                }}
              />

              {/* Bottom Half of Logo + Brand Name (elevated above split seam) */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+32px)] z-20 pointer-events-none">
                {renderBrandLine()}
              </div>

              {/* Real-Time Progress Loader Bar (positioned below the split line) */}
              <div className="absolute top-10 sm:top-14 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
                {renderLoaderBar()}
              </div>
            </motion.div>
          </>
        ) : (
          /* ========================================================================= */
          /* HORIZONTAL SPLIT: LEFT & RIGHT SHUTTERS */
          /* ========================================================================= */
          <>
            {/* LEFT SHUTTER (0% to 50vw) */}
            <motion.div
              initial={{ x: "0%" }}
              animate={{ x: isOpening ? "-100%" : "0%" }}
              transition={{ duration: openingDuration, ease: cinematicEase }}
              onAnimationComplete={() => {
                if (isOpening) {
                  handleComplete();
                }
              }}
              className="absolute top-0 bottom-0 left-0 w-1/2 overflow-hidden border-r shadow-2xl pointer-events-auto"
              style={{
                backgroundColor: "var(--theme-bg, #090a0f)",
                borderRightColor: "color-mix(in srgb, var(--theme-primary, #006B45) 40%, transparent)",
                willChange: "transform",
                transform: "translateZ(0)",
              }}
            >
              <div
                className="absolute top-0 left-0 w-[100vw] h-full bg-cover bg-center pointer-events-none"
                style={{ backgroundImage: `url("${bgImage}")` }}
              />
              <div
                className="absolute inset-0"
                style={{ backgroundColor: "var(--theme-bg, #090a0f)", opacity: effectiveDim }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-transparent" />
              <div
                className="absolute top-0 bottom-0 right-0 w-[1px]"
                style={{
                  background: "linear-gradient(180deg, transparent, var(--theme-primary, #006B45), transparent)",
                  boxShadow: "0 0 14px var(--theme-primary, #006B45)",
                }}
              />

              {/* Left Half of Logo + Brand Name */}
              <div className="absolute top-1/2 right-0 -translate-y-[calc(50%+32px)] translate-x-1/2 z-20 pointer-events-none">
                {renderBrandLine()}
              </div>

              {/* Left Half of Real-Time Loader Bar */}
              <div className="absolute bottom-16 right-0 translate-x-1/2 z-20 pointer-events-none">
                {renderLoaderBar()}
              </div>
            </motion.div>

            {/* RIGHT SHUTTER (50vw to 100vw) */}
            <motion.div
              initial={{ x: "0%" }}
              animate={{ x: isOpening ? "100%" : "0%" }}
              transition={{ duration: openingDuration, ease: cinematicEase }}
              className="absolute top-0 bottom-0 right-0 w-1/2 overflow-hidden border-l shadow-2xl pointer-events-auto"
              style={{
                backgroundColor: "var(--theme-bg, #090a0f)",
                borderLeftColor: "color-mix(in srgb, var(--theme-primary, #006B45) 40%, transparent)",
                willChange: "transform",
                transform: "translateZ(0)",
              }}
            >
              <div
                className="absolute top-0 -left-[50vw] w-[100vw] h-full bg-cover bg-center pointer-events-none"
                style={{ backgroundImage: `url("${bgImage}")` }}
              />
              <div
                className="absolute inset-0"
                style={{ backgroundColor: "var(--theme-bg, #090a0f)", opacity: effectiveDim }}
              />
              <div className="absolute inset-0 bg-gradient-to-l from-black/15 via-transparent to-transparent" />
              <div
                className="absolute top-0 bottom-0 left-0 w-[1px]"
                style={{
                  background: "linear-gradient(180deg, transparent, var(--theme-primary, #006B45), transparent)",
                  boxShadow: "0 0 14px var(--theme-primary, #006B45)",
                }}
              />

              {/* Right Half of Logo + Brand Name */}
              <div className="absolute top-1/2 left-0 -translate-y-[calc(50%+32px)] -translate-x-1/2 z-20 pointer-events-none">
                {renderBrandLine()}
              </div>

              {/* Right Half of Real-Time Loader Bar */}
              <div className="absolute bottom-16 left-0 -translate-x-1/2 z-20 pointer-events-none">
                {renderLoaderBar()}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </AnimatePresence>
  );
}
