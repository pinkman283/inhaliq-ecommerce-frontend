"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Maximize2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  RotateCcw
} from "lucide-react";
import { ProductImage } from "@/types";

interface ProductGalleryProps {
  images?: ProductImage[];
  productName: string;
  selectedImageId?: number | null;
  selectedImageUrl?: string | null;
}

const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";

export function ProductGallery({
  images = [],
  productName,
  selectedImageId,
  selectedImageUrl,
}: ProductGalleryProps) {
  const defaultImages = images.length > 0 ? images : [
    {
      id: 1,
      product_id: 0,
      image_url: FALLBACK_IMAGE,
      is_primary: true,
      display_order: 0,
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = defaultImages[activeIndex] || defaultImages[0];
  const lastSynchronizedRef = useRef<string | number | null>(null);

  // Synchronize gallery active image when a variant with image is selected,
  // while preserving user thumbnail navigation once synchronized
  useEffect(() => {
    const currentKey = selectedImageId || selectedImageUrl || null;
    if (currentKey && currentKey !== lastSynchronizedRef.current) {
      lastSynchronizedRef.current = currentKey;
      if (selectedImageId) {
        const idx = defaultImages.findIndex((img) => img.id === selectedImageId);
        if (idx !== -1) {
          setActiveIndex(idx);
          setIsZoomed(false);
        }
      } else if (selectedImageUrl) {
        const idx = defaultImages.findIndex((img) => img.image_url === selectedImageUrl);
        if (idx !== -1) {
          setActiveIndex(idx);
          setIsZoomed(false);
        }
      }
    }
  }, [selectedImageId, selectedImageUrl, defaultImages]);

  // Fullscreen & Click-to-Zoom States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const zoomImageRef = useRef<HTMLImageElement | null>(null);

  // Handle keyboard navigation in fullscreen
  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isZoomed) {
          setIsZoomed(false);
        } else {
          setIsFullscreen(false);
        }
      } else if (e.key === "ArrowLeft") {
        setIsZoomed(false);
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : defaultImages.length - 1));
      } else if (e.key === "ArrowRight") {
        setIsZoomed(false);
        setActiveIndex((prev) => (prev < defaultImages.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isFullscreen, isZoomed, defaultImages.length]);

  // Click on image in fullscreen to zoom into that exact point
  const handleFullscreenImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = zoomImageRef.current || e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    if (!isZoomed) {
      setZoomOrigin({ x, y });
      setIsZoomed(true);
    } else {
      setIsZoomed(false);
    }
  };

  // While zoomed, smoothly pan following the mouse cursor
  const handleFullscreenMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const target = zoomImageRef.current || e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomOrigin({ x, y });
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsZoomed(false);
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : defaultImages.length - 1));
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsZoomed(false);
    setActiveIndex((prev) => (prev < defaultImages.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-3 select-none w-full max-w-[530px] mx-auto lg:mx-0">
      {/* Main Image Stage */}
      <div 
        onClick={() => {
          setIsFullscreen(true);
          setIsZoomed(false);
          setZoomOrigin({ x: 50, y: 50 });
        }}
        className="relative max-h-[510px] aspect-square w-full rounded-2xl sm:rounded-3xl overflow-hidden border flex items-center justify-center group cursor-zoom-in transition-all shadow-xs hover:shadow-sm"
        style={{
          backgroundColor: "var(--theme-card-bg, #ffffff)",
          borderColor: "var(--theme-card-border, #e5e7eb)"
        }}
      >
        <div className="w-full h-full overflow-hidden flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.img
              key={activeImage.image_url}
              src={activeImage.image_url}
              alt={activeImage.alt_text || productName}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </AnimatePresence>
        </div>

        {/* Floating Prev / Next Arrow Buttons (Reference Design) */}
        {defaultImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevImage}
              aria-label="Previous Image"
              className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-10 cursor-pointer border border-black/5"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              aria-label="Next Image"
              className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-10 cursor-pointer border border-black/5"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
            </button>
          </>
        )}

        {/* Floating Zoom & Fullscreen Hint */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-white text-[11px] font-semibold shadow-lg">
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Click to Zoom</span>
        </div>

        {/* Image Counter Badge */}
        <div 
          className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider backdrop-blur-md border shadow-xs"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            borderColor: "rgba(255, 255, 255, 0.15)",
            color: "#ffffff"
          }}
        >
          {activeIndex + 1} / {defaultImages.length}
        </div>
      </div>

      {/* Thumbnails Row */}
      {defaultImages.length > 1 && (
        <div className="flex gap-2 sm:gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
          {defaultImages.map((img, idx) => {
            const isCurrent = activeIndex === idx;
            return (
              <button
                key={img.id || idx}
                onClick={() => {
                  setActiveIndex(idx);
                  setIsZoomed(false);
                }}
                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer flex items-center justify-center ${
                  isCurrent
                    ? "scale-105 shadow-md ring-2 ring-black/5 dark:ring-white/10"
                    : "opacity-60 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: "var(--theme-card-bg, #ffffff)",
                  borderColor: isCurrent 
                    ? "var(--theme-view-all-color, var(--theme-tab-active-bg, var(--theme-primary, #006B45)))" 
                    : "var(--theme-card-border, #e5e7eb)"
                }}
              >
                <img
                  src={img.image_url}
                  alt={`${productName} thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULLSCREEN LIGHTBOX & CLICK-TO-ZOOM MODAL                                 */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-xl flex flex-col justify-between"
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-black/50 backdrop-blur-md z-10 text-white">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs sm:text-sm font-bold truncate max-w-xs sm:max-w-md">
                  {productName}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-mono text-slate-300 shrink-0">
                  {activeIndex + 1} of {defaultImages.length}
                </span>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center gap-2">
                {isZoomed ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsZoomed(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition-all cursor-pointer"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Fit to Screen</span>
                  </button>
                ) : (
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 mr-2">
                    <ZoomIn className="w-3.5 h-3.5 text-slate-300" />
                    <span>Click anywhere on image to zoom in</span>
                  </div>
                )}

                <button
                  onClick={() => {
                    setIsFullscreen(false);
                    setIsZoomed(false);
                  }}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Close (Esc)"
                  aria-label="Close fullscreen gallery"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Interactive Zoom Stage */}
            <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden p-2 sm:p-6">
              {/* Navigation Arrow Left */}
              {defaultImages.length > 1 && (
                <button
                  onClick={handlePrevImage}
                  className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition-transform hover:scale-110 cursor-pointer shadow-xl"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}

              {/* Interactive Image Container */}
              <div
                id="fullscreen-zoom-stage"
                onClick={handleFullscreenImageClick}
                onMouseMove={handleFullscreenMouseMove}
                className={`relative max-w-full max-h-full flex items-center justify-center ${
                  isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
                }`}
              >
                <motion.img
                  id="fullscreen-zoom-image"
                  ref={zoomImageRef}
                  key={activeImage.image_url}
                  src={activeImage.image_url}
                  alt={activeImage.alt_text || productName}
                  style={{
                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                  }}
                  animate={{
                    scale: isZoomed ? 2.5 : 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 280,
                    damping: 26,
                  }}
                  className="max-h-[75vh] max-w-[90vw] object-contain rounded-lg select-none pointer-events-auto transition-transform duration-75"
                />
              </div>

              {/* Navigation Arrow Right */}
              {defaultImages.length > 1 && (
                <button
                  onClick={handleNextImage}
                  className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition-transform hover:scale-110 cursor-pointer shadow-xl"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}
            </div>

            {/* Bottom Strip: Thumbnails & Quick Guide */}
            <div className="px-4 py-3 border-t border-white/10 bg-black/50 backdrop-blur-md flex items-center justify-center gap-3 z-10">
              {defaultImages.length > 1 ? (
                <div className="flex gap-2 max-w-full overflow-x-auto py-1 scrollbar-none">
                  {defaultImages.map((img, idx) => {
                    const isCurrent = activeIndex === idx;
                    return (
                      <button
                        key={img.id || idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveIndex(idx);
                          setIsZoomed(false);
                        }}
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 p-0.5 cursor-pointer ${
                          isCurrent
                            ? "border-emerald-400 scale-105 shadow-md shadow-emerald-400/30"
                            : "border-white/20 opacity-50 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={img.image_url}
                          alt={`${productName} full view thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover rounded-md"
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <span className="text-xs text-slate-400">
                  {isZoomed ? "Click again to zoom out" : "Click anywhere on the image to zoom in"}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
