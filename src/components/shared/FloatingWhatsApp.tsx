"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useThemeStore } from "@/store/useThemeStore";

export function FloatingWhatsApp() {
  const { theme } = useThemeStore();
  const [isHovered, setIsHovered] = useState(false);

  // If WhatsApp support is disabled by admin, do not render
  if (theme.whatsapp_support_enabled === false) return null;

  const phoneNumber = theme.whatsapp_phone_number || "+18002384371";
  const defaultMessage =
    theme.whatsapp_default_message || "Hello! I would like to inquire about your studio products.";

  const handleOpenWhatsApp = () => {
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, "");
    const encodedMsg = encodeURIComponent(defaultMessage);
    const url = `https://wa.me/${cleanNumber}?text=${encodedMsg}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="pointer-events-auto flex items-center gap-2">
      {/* Tooltip speech bubble */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0c101d] border border-emerald-500/30 text-white text-xs font-bold shadow-xl backdrop-blur-md whitespace-nowrap"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Need Help? Chat on WhatsApp</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulsing Floating Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleOpenWhatsApp}
        className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-green-500 text-white shadow-xl shadow-emerald-600/30 cursor-pointer flex items-center justify-center border border-white/20 group shrink-0"
        title="Chat on WhatsApp with Support"
        aria-label="Chat on WhatsApp with Support"
      >
        {/* Radar Pulse Effect */}
        <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-25 pointer-events-none" />

        {/* WhatsApp Icon */}
        <svg
          className="w-5 h-5 fill-current"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.276-.1-.476-.15-.676.15-.2.3-.776.979-.952 1.18-.175.2-.35.225-.651.075-.301-.15-1.27-.468-2.42-1.493-.894-.798-1.498-1.783-1.674-2.083-.175-.3-.019-.462.132-.612.136-.135.301-.35.451-.525.15-.175.2-.3.301-.5.1-.2.05-.375-.025-.525-.075-.15-.676-1.63-.926-2.234-.244-.588-.492-.508-.676-.518-.175-.01-.375-.01-.576-.01-.2 0-.526.075-.802.375-.276.3-1.052 1.028-1.052 2.508 0 1.48 1.078 2.91 1.228 3.11.15.2 2.122 3.24 5.14 4.542.718.31 1.278.495 1.714.633.72.23 1.376.197 1.895.12.578-.087 1.78-.727 2.03-1.43.25-.702.25-1.303.175-1.43-.075-.125-.275-.2-.576-.35zM12.04 2c-5.52 0-10 4.48-10 10 0 1.765.46 3.424 1.26 4.872L2 22l5.3-1.39C8.71 21.41 10.33 22 12.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10zm0 18.2c-1.53 0-2.98-.41-4.24-1.13l-.3-.18-3.15.83.84-3.07-.2-.32C4.24 15.01 3.8 13.54 3.8 12c0-4.54 3.69-8.23 8.24-8.23 4.54 0 8.23 3.69 8.23 8.23 0 4.54-3.69 8.2-8.23 8.2z" />
        </svg>
      </motion.button>
    </div>
  );
}
