"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp } from "lucide-react";

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      setScrollProgress(progress);
      setIsVisible(scrollTop > 350);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Tooltip speech bubble matching WhatsApp style */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, x: 10, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.9 }}
                className="hidden sm:flex items-center px-3 py-1.5 rounded-full bg-[#0c101d] border border-cyan-500/30 text-white text-xs font-bold shadow-xl backdrop-blur-md whitespace-nowrap"
              >
                <span>Back to Top</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Circular Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={scrollToTop}
            className="relative w-12 h-12 rounded-full bg-[#0c101d]/90 backdrop-blur-md border border-white/15 text-white shadow-xl hover:border-cyan-400 hover:text-cyan-400 transition-all cursor-pointer group flex items-center justify-center shrink-0"
            title="Back to Top"
            aria-label="Back to Top"
          >
            {/* Circular SVG Scroll Progress Ring */}
            <svg className="w-9 h-9 -rotate-90 pointer-events-none" viewBox="0 0 36 36">
              <path
                className="text-white/10"
                strokeWidth="2.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-cyan-400 transition-all duration-100"
                strokeDasharray={`${scrollProgress}, 100`}
                strokeWidth="2.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>

            {/* Icon Centered */}
            <ChevronUp className="w-4 h-4 absolute group-hover:-translate-y-0.5 transition-transform" />
          </motion.button>
        </div>
      )}
    </AnimatePresence>
  );
}
