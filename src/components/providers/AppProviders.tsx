"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { SearchModal } from "@/components/shared/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { WishlistDrawer } from "@/components/cart/WishlistDrawer";
import { AuthModal } from "@/components/auth/AuthModal";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { Locale } from "@/types/i18n";
import { SplitReveal } from "@/components/shared/SplitReveal";
import { Toaster } from "sonner";

import { FloatingWhatsApp } from "@/components/shared/FloatingWhatsApp";
import { BackToTop } from "@/components/shared/BackToTop";
import { MobileBottomNav } from "@/components/shared/MobileBottomNav";
import { ThemeSettings } from "@/store/useThemeStore";

/* ─────────────────────────────────────────────────────────
   Age-Verification Gate (inline — no persistence whatsoever)
   ───────────────────────────────────────────────────────── */
type AgeGateStatus = "waiting" | "gate" | "denied" | "allowed";

function AgeGate({ status, onAccept, onDeny }: { status: AgeGateStatus; onAccept: () => void; onDeny: () => void }) {
  // Not visible while waiting for split reveal, or after user accepted
  if (status === "waiting" || status === "allowed") return null;

  return (
    <div
      className="fixed inset-0 z-[99998] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.55)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="relative w-[92vw] max-w-sm mx-auto rounded-2xl shadow-xl overflow-hidden"
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e8e8ec",
          boxShadow: "0 8px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)",
        }}
      >
        {/* Subtle top accent bar */}
        <div
          className="h-1 w-full"
          style={{ background: "linear-gradient(90deg, var(--theme-primary, #006B45), var(--theme-secondary, #C6A15B))" }}
        />

        <div className="px-6 pt-7 pb-6 sm:px-8 sm:pt-8 sm:pb-7">
          {status === "gate" ? (
            /* ── Age verification prompt ── */
            <>
              {/* 18+ badge */}
              <div className="flex justify-center mb-5">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "color-mix(in srgb, var(--theme-primary, #006B45) 8%, #ffffff)", border: "2px solid color-mix(in srgb, var(--theme-primary, #006B45) 15%, transparent)" }}
                >
                  <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--theme-primary, #006B45)", letterSpacing: "-0.5px" }}>18+</span>
                </div>
              </div>

              <h2
                className="text-center font-semibold mb-2"
                style={{ fontSize: "20px", lineHeight: 1.3, color: "#1a1a2e", letterSpacing: "-0.3px" }}
              >
                Are you 18 or older?
              </h2>
              <p
                className="text-center mb-7"
                style={{ fontSize: "14px", lineHeight: 1.55, color: "#6b7280" }}
              >
                You must be of legal age to enter this website.
              </p>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={onAccept}
                  className="w-full py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200"
                  style={{
                    backgroundColor: "var(--theme-btn-primary-bg, var(--theme-primary, #006B45))",
                    color: "var(--theme-btn-primary-text, #ffffff)",
                    border: "none",
                    cursor: "pointer",
                    letterSpacing: "0.5px",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--theme-primary-hover, #005238)"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 14px color-mix(in srgb, var(--theme-primary, #006B45) 35%, transparent)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--theme-btn-primary-bg, var(--theme-primary, #006B45))"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  YES, ENTER
                </button>
                <button
                  onClick={onDeny}
                  className="w-full py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200"
                  style={{
                    backgroundColor: "#f5f5f7",
                    color: "#6b7280",
                    border: "1px solid #e5e5ea",
                    cursor: "pointer",
                    letterSpacing: "0.5px",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#ececef"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#f5f5f7"; }}
                >
                  NO, EXIT
                </button>
              </div>
            </>
          ) : (
            /* ── Denied / Blocked state ── */
            <>
              <div className="flex justify-center mb-5">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#fef2f2", border: "2px solid #fde8e8" }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                </div>
              </div>

              <h2
                className="text-center font-semibold mb-2"
                style={{ fontSize: "20px", lineHeight: 1.3, color: "#1a1a2e", letterSpacing: "-0.3px" }}
              >
                Access Denied
              </h2>
              <p
                className="text-center"
                style={{ fontSize: "14px", lineHeight: 1.55, color: "#6b7280" }}
              >
                Sorry, you must be 18 or older to enter this website.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function AppProviders({
  children,
  initialTheme,
  initialLocale,
}: {
  children: React.ReactNode;
  initialTheme?: ThemeSettings;
  initialLocale?: Locale;
}) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Age gate state — verified in localStorage
  const [ageGateStatus, setAgeGateStatus] = useState<AgeGateStatus>("waiting");

  useEffect(() => {
    try {
      const verified = localStorage.getItem("inhaliq_age_verified");
      if (verified === "true") {
        setAgeGateStatus("allowed");
        return;
      }
    } catch {}
    setAgeGateStatus("gate");
  }, []);

  const handleSplitRevealComplete = useCallback(() => {
    try {
      if (localStorage.getItem("inhaliq_age_verified") === "true") {
        setAgeGateStatus("allowed");
        return;
      }
    } catch {}
    setAgeGateStatus("gate");
  }, []);

  const handleAgeAccept = useCallback(() => {
    setAgeGateStatus("allowed");
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("inhaliq_age_verified", "true");
      } catch {}
    }
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
  }, []);

  const handleAgeDeny = useCallback(() => {
    setAgeGateStatus("denied");
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }
  }, []);

  // Block body scroll while the age gate is visible (gate or denied)
  useEffect(() => {
    if (ageGateStatus === "gate" || ageGateStatus === "denied") {
      document.body.style.overflow = "hidden";
    }
    return () => {
      if (ageGateStatus === "allowed") {
        document.body.style.overflow = "";
      }
    };
  }, [ageGateStatus]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Always ensure landing at the top of the page on navigation
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [pathname]);

  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <LanguageProvider initialLocale={initialLocale}>
        <ThemeProvider initialTheme={initialTheme}>
          {children}
          {mounted && (
            <Toaster
              theme="dark"
              position="bottom-right"
              closeButton
              toastOptions={{
                style: {
                  background: "#0c0e15",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  color: "#ffffff",
                },
              }}
            />
          )}
        </ThemeProvider>
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider initialLocale={initialLocale}>
      <ThemeProvider initialTheme={initialTheme}>
        <div className="min-h-screen flex flex-col">
          {/* Horizontal Split Reveal Intro Animation */}
          <SplitReveal initialTheme={initialTheme} onComplete={handleSplitRevealComplete} />

          <Navbar onOpenSearch={() => setSearchOpen(true)} />
          
          <main className="flex-1 flex flex-col pb-14 sm:pb-0">
            {children}
          </main>

          <Footer />
        </div>

        {/* Global Modals, Drawers & Conversion Widgets */}
        {mounted && (
          <>
            <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
            <CartDrawer />
            <WishlistDrawer />
            <AuthModal />
            {/* Floating Actions Stack: Back To Top directly on top of WhatsApp Quick Button */}
            <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end gap-2.5 sm:gap-3 pointer-events-none">
              <BackToTop />
              <FloatingWhatsApp />
            </div>
            <MobileBottomNav onOpenSearch={() => setSearchOpen(true)} />
            <Toaster
              theme="dark"
              position="bottom-right"
              closeButton
              toastOptions={{
                style: {
                  background: "#0e121e",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#ffffff",
                },
              }}
            />
          </>
        )}

        {/* Age Verification Gate — appears after split reveal finishes */}
        {!isAdminRoute && <AgeGate status={ageGateStatus} onAccept={handleAgeAccept} onDeny={handleAgeDeny} />}
      </ThemeProvider>
    </LanguageProvider>
  );
}

