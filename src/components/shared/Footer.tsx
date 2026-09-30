"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Banknote,
  Headphones,
  Globe,
  ChevronDown,
  ExternalLink
} from "lucide-react";
import { useAppTheme } from "@/components/providers/ThemeProvider";
import { BrandLogoImage } from "@/components/shared/BrandLogoImage";
import { FooterColumn, SocialLink } from "@/types";
import { SocialPlatformIcon } from "@/components/shared/SocialPlatformIcon";

export function Footer() {
  const { theme } = useAppTheme();
  const [columns, setColumns] = useState<FooterColumn[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [openAccordion, setOpenAccordion] = useState<Record<number, boolean>>({});

  // Fetch dynamic navigation data from the single source of truth
  useEffect(() => {
    let isMounted = true;

    async function loadNavigation() {
      try {
        const res = await fetch("/api/storefront/store-navigation", {
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) throw new Error("Navigation fetch failed");
        const data = await res.json();
        if (isMounted) {
          if (data.footer_columns && Array.isArray(data.footer_columns)) {
            setColumns(data.footer_columns);
          }
          if (data.social_links && Array.isArray(data.social_links)) {
            setSocialLinks(data.social_links);
          }
        }
      } catch (err) {
        // Graceful fallback to direct API if storefront proxy failed and not senior
        try {
          const provider = process.env.NEXT_PUBLIC_BACKEND_PROVIDER || "senior";
          if (provider !== "senior") {
            const directUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
            const directRes = await fetch(`${directUrl}/store-navigation`);
            if (directRes.ok && isMounted) {
              const directData = await directRes.json();
              if (directData.footer_columns) setColumns(directData.footer_columns);
              if (directData.social_links) setSocialLinks(directData.social_links);
            }
          }
        } catch {}
      }
    }

    loadNavigation();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleAccordion = (columnId: number) => {
    setOpenAccordion((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  const brandName = theme.store_brand_name || "Inheliq";
  const brandTagline = theme.store_brand_tagline || "Elevate every inhale";

  // Filter active columns and their active links
  const activeColumns = columns
    .filter((c) => c.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  const activeSocials = socialLinks
    .filter((s) => s.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
      {/* 1. Store Benefits Strip (Clean, Production-Grade Trust Strip) */}
      {theme.footer_features_enabled !== false && (
        <section
          aria-label="Why Shop With Us"
          className="w-full border-t border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0b101a] py-8 sm:py-9 transition-colors"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-0 lg:divide-x divide-gray-200/80 dark:divide-white/10">
              {/* 1. Nationwide Delivery */}
              <Link
                href={theme.footer_feature_link_1 || "/shipping-policy"}
                className="group flex items-center gap-3.5 px-2 lg:px-6 py-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#009B55] rounded-lg transition-colors"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#009B55]/10 dark:bg-[#009B55]/20 text-[#009B55] flex items-center justify-center shrink-0 transition-all duration-200 group-hover:bg-[#009B55] group-hover:text-white shadow-2xs">
                  <Truck className="w-5 h-5 transition-transform duration-200 group-hover:scale-105" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-[#009B55] transition-colors">
                    {theme.footer_feature_title_1 || "Nationwide Delivery"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                    {theme.footer_feature_desc_1 || "Fast delivery across Bangladesh"}
                  </p>
                </div>
              </Link>

              {/* 2. 100% Authentic Guarantee */}
              <Link
                href={theme.footer_feature_link_2 || "/about"}
                className="group flex items-center gap-3.5 px-2 lg:px-6 py-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#009B55] rounded-lg transition-colors"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#009B55]/10 dark:bg-[#009B55]/20 text-[#009B55] flex items-center justify-center shrink-0 transition-all duration-200 group-hover:bg-[#009B55] group-hover:text-white shadow-2xs">
                  <ShieldCheck className="w-5 h-5 transition-transform duration-200 group-hover:scale-105" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-[#009B55] transition-colors">
                    {theme.footer_feature_title_2 || "100% Authentic Guarantee"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                    {theme.footer_feature_desc_2 || "Verified genuine products"}
                  </p>
                </div>
              </Link>

              {/* 3. Cash on Delivery */}
              <Link
                href={theme.footer_feature_link_3 || "/track"}
                className="group flex items-center gap-3.5 px-2 lg:px-6 py-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#009B55] rounded-lg transition-colors"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#009B55]/10 dark:bg-[#009B55]/20 text-[#009B55] flex items-center justify-center shrink-0 transition-all duration-200 group-hover:bg-[#009B55] group-hover:text-white shadow-2xs">
                  <Banknote className="w-5 h-5 transition-transform duration-200 group-hover:scale-105" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-[#009B55] transition-colors">
                    {theme.footer_feature_title_3 || "Cash on Delivery"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                    {theme.footer_feature_desc_3 || "Pay safely upon arrival"}
                  </p>
                </div>
              </Link>

              {/* 4. Dedicated Customer Care */}
              <Link
                href={theme.footer_feature_link_4 || "/contact"}
                className="group flex items-center gap-3.5 px-2 lg:px-6 py-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#009B55] rounded-lg transition-colors"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#009B55]/10 dark:bg-[#009B55]/20 text-[#009B55] flex items-center justify-center shrink-0 transition-all duration-200 group-hover:bg-[#009B55] group-hover:text-white shadow-2xs">
                  <Headphones className="w-5 h-5 transition-transform duration-200 group-hover:scale-105" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-[#009B55] transition-colors">
                    {theme.footer_feature_title_4 || "Dedicated Customer Care"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                    {theme.footer_feature_desc_4 || "Prompt expert support"}
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 2. Main Footer Area */}
      <footer
        suppressHydrationWarning
        className="theme-footer border-t text-sm transition-colors duration-200"
        role="contentinfo"
      >
        <div className="theme-footer-main max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 sm:pt-12 sm:pb-16 lg:pt-14 lg:pb-16">
        <nav aria-label="Footer Navigation" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Column (2-wide on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <Link
              href="/"
              suppressHydrationWarning
              className="inline-flex items-center group select-none p-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg"
            >
              <BrandLogoImage placement="footer" />
            </Link>

            <p className="theme-footer-desc text-xs leading-relaxed max-w-sm text-slate-400">
              Curated premium disposable vapes, pod systems, e-liquids, and accessories. Elevate your vaping experience with authentic hardware, verified flavors, and express dispatch.
            </p>

            {/* Social Links (Admin Managed via social_links) */}
            {activeSocials.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-400 block mb-2">Connect with us</span>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {activeSocials.map((social) => (
                    <a
                      key={social.id}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Follow ${brandName} on ${social.platform} (opens in a new tab)`}
                      className="theme-footer-social-btn w-8 h-8 rounded-md border flex items-center justify-center transition-all hover:text-cyan-400 hover:border-cyan-400/50 hover:bg-cyan-500/10 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-400"
                    >
                      <SocialPlatformIcon platform={social.platform} icon={social.icon} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Configurable Navigation Columns (Admin Managed) */}
          {activeColumns.map((col) => {
            const links = (col.links || [])
              .filter((l) => l.is_active)
              .sort((a, b) => a.sort_order - b.sort_order);

            const isOpen = openAccordion[col.id];

            return (
              <div key={col.id} className="border-b border-white/[0.06] md:border-b-0 pb-4 md:pb-0">
                {/* Mobile Accordion Trigger / Desktop Heading */}
                <button
                  type="button"
                  onClick={() => handleToggleAccordion(col.id)}
                  className="w-full flex items-center justify-between text-left md:pointer-events-none group py-2 md:py-0"
                  aria-expanded={Boolean(isOpen)}
                >
                  <h4 className="theme-footer-col-title font-bold text-xs uppercase tracking-wider text-white">
                    {col.title}
                  </h4>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 md:hidden transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-cyan-400" : ""
                    }`}
                  />
                </button>

                {/* Links list (always visible on md+, collapsible on mobile) */}
                <ul
                  className={`theme-footer-col-links space-y-2.5 text-xs mt-3 md:block ${
                    isOpen ? "block" : "hidden md:block"
                  }`}
                >
                  {links.map((link) => {
                    const isExt = link.is_external || link.url.startsWith("http://") || link.url.startsWith("https://");
                    const openInNewTab = link.open_in_new_tab || isExt;

                    if (isExt) {
                      return (
                        <li key={link.id}>
                          <a
                            href={link.url}
                            target={openInNewTab ? "_blank" : undefined}
                            rel={openInNewTab ? "noopener noreferrer" : undefined}
                            className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-sm"
                          >
                            <span>{link.title}</span>
                            {openInNewTab && (
                              <span className="sr-only">(opens in a new tab)</span>
                            )}
                          </a>
                        </li>
                      );
                    }

                    return (
                      <li key={link.id}>
                        <Link
                          href={link.url}
                          className="hover:text-cyan-400 transition-colors inline-block focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-sm"
                        >
                          {link.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* 3. Bottom Copyright & Compliance Bar */}
        <div className="theme-footer-bottom border-t mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-400 text-center sm:text-left">
            &copy; {new Date().getFullYear()} {brandName}. All rights reserved.
          </p>
          <p className="text-[11px] text-slate-500 text-center sm:text-right font-medium">
            Strictly 18+ Only • Age verification required upon entry and delivery
          </p>
        </div>
      </div>
    </footer>
  </>
);
}
