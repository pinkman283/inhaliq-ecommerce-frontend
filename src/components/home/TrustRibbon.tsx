"use client";

import { motion } from "framer-motion";
import { Truck, ShieldCheck, Banknote, RotateCcw } from "lucide-react";
import { useThemeStore } from "@/store/useThemeStore";
import { STOREFRONT_CONFIG } from "@/config/storefrontConfig";

export function TrustRibbon() {
  const { theme } = useThemeStore();

  // Controlled by centralized STOREFRONT_CONFIG (Default: false / Hidden)
  if (!STOREFRONT_CONFIG.SHOW_BENEFIT_CARDS || theme.trust_ribbon_enabled === false) {
    return null;
  }

  const trustItems = [
    {
      icon: Truck,
      title: theme.trust_ribbon_title_1 || "Fast Express Delivery",
      subtitle: theme.trust_ribbon_desc_1 || "Dispatched within 24-48 hours",
      badge: "Express",
      colorClass: "text-[#006B45] dark:text-cyan-400",
      glowClass: "from-emerald-500/10 to-transparent",
    },
    {
      icon: Banknote,
      title: theme.trust_ribbon_title_2 || "Cash on Delivery (COD)",
      subtitle: theme.trust_ribbon_desc_2 || "Pay safely upon product arrival",
      badge: "Safe COD",
      colorClass: "text-emerald-600 dark:text-emerald-400",
      glowClass: "from-emerald-500/10 to-transparent",
    },
    {
      icon: ShieldCheck,
      title: theme.trust_ribbon_title_3 || "100% Genuine & Authentic",
      subtitle: theme.trust_ribbon_desc_3 || "Official manufacturer warranty coverage",
      badge: "Verified",
      colorClass: "text-[#006B45] dark:text-indigo-400",
      glowClass: "from-emerald-500/10 to-transparent",
    },
    {
      icon: RotateCcw,
      title: theme.trust_ribbon_title_4 || "7-Day Easy Replacement",
      subtitle: theme.trust_ribbon_desc_4 || "Hassle-free returns & replacement policy",
      badge: "Guaranteed",
      colorClass: "text-rose-600 dark:text-pink-400",
      glowClass: "from-rose-500/10 to-transparent",
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {trustItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title + index}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
              className="relative group p-3.5 sm:p-4 rounded-xl theme-card border border-gray-200 dark:border-white/10 overflow-hidden flex items-center gap-3.5 transition-all duration-300 hover:border-[#006B45]/30 dark:hover:border-white/20 hover:scale-[1.01] shadow-xs"
            >
              {/* Subtle gradient background glow on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${item.glowClass} opacity-40 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
              />

              {/* Icon Container */}
              <div
                className="relative p-2.5 rounded-xl border shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-inner"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--theme-primary, #006B45) 12%, rgba(255, 255, 255, 0.03))",
                  borderColor: "color-mix(in srgb, var(--theme-primary, #006B45) 25%, rgba(255, 255, 255, 0.1))",
                }}
              >
                <Icon className={`w-5 h-5 ${item.colorClass}`} />
              </div>

              {/* Text content */}
              <div className="relative z-10 min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4
                    className="text-xs sm:text-[13px] font-black tracking-tight leading-tight truncate"
                    style={{ color: "var(--theme-text-heading, #ffffff)" }}
                  >
                    {item.title}
                  </h4>
                  {item.badge && (
                    <span
                      className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider shrink-0"
                      style={{
                        backgroundColor: "color-mix(in srgb, var(--theme-primary, #006B45) 15%, transparent)",
                        color: "var(--theme-primary, #006B45)",
                        border: "1px solid color-mix(in srgb, var(--theme-primary, #006B45) 30%, transparent)",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <p
                  className="text-[10px] sm:text-[11px] font-medium line-clamp-1 mt-0.5"
                  style={{ color: "var(--theme-text-body, #94a3b8)" }}
                >
                  {item.subtitle}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
