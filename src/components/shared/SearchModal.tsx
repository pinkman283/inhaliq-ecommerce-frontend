"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight, Sparkles, Tag, Star } from "lucide-react";
import { api } from "@/lib/api";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useThemeStore } from "@/store/useThemeStore";
import { trackSearch } from "@/lib/metaPixel";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const { theme } = useThemeStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const cleanQuery = query.trim();
        const data = await api.getProducts({ search: cleanQuery, per_page: 6 });
        setResults(data.data || []);
        if (cleanQuery.length >= 2) {
          trackSearch({ searchString: cleanQuery });
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectProduct = (slug: string) => {
    onClose();
    router.push(`/products/${slug}`);
  };

  const [quickCategories, setQuickCategories] = useState<{ name: string; slug: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      api.getCategories()
        .then((cats) => {
          const list = Array.isArray(cats) ? cats : [];
          setQuickCategories(
            list
              .filter((c) => c && c.slug && !c.slug.includes("test"))
              .slice(0, 6)
              .map((c) => ({ name: c.name, slug: c.slug }))
          );
        })
        .catch(() => {});
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-20 px-3 sm:px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl rounded-lg bg-[#0e121e] border border-white/15 shadow-2xl overflow-hidden z-10"
          >
            {/* Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
              <Search className="w-5 h-5 text-cyan-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query.trim()) {
                    onClose();
                    router.push(`/products?search=${encodeURIComponent(query.trim())}`);
                  }
                }}
                placeholder="Search studio headphones, mechanical boards, tech packs..."
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-300 font-medium focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 rounded-md hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="px-2 py-0.5 text-[10px] font-bold text-slate-200 bg-white/10 rounded border border-white/20">
                ESC
              </kbd>
            </div>

            {/* Results / Suggestions Container */}
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="py-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  Searching laboratory catalog...
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Matching Gear ({results.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        router.push(`/products?search=${encodeURIComponent(query.trim())}`);
                      }}
                      className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      View all results <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  {results.map((product) => {
                    const img = product.primary_image?.image_url || product.images?.[0]?.image_url;
                    return (
                      <div
                        key={product.id}
                        onClick={() => handleSelectProduct(product.slug)}
                        className="flex items-center gap-3 p-2.5 rounded-md hover:bg-white/5 border border-transparent hover:border-white/10 cursor-pointer transition-all group"
                      >
                        {img && (
                          <img
                            src={img}
                            alt={product.name}
                            className="w-12 h-12 rounded-md object-cover bg-slate-900 border border-white/10"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-400">{product.brand}</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-xs font-extrabold text-cyan-400">{formatPrice(product.price)}</span>
                            {theme.reviews_enabled !== false && product.rating_average ? (
                              <span className="text-[10px] text-amber-400 flex items-center gap-0.5 ml-auto">
                                <Star className="w-3 h-3 fill-amber-400" /> {product.rating_average}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    );
                  })}
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        router.push(`/products?search=${encodeURIComponent(query.trim())}`);
                      }}
                      className="w-full py-2 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-colors cursor-pointer"
                    >
                      See all products matching &ldquo;{query}&rdquo;
                    </button>
                  </div>
                </div>
              ) : query.trim() ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No hardware matching <span className="text-white font-semibold">&ldquo;{query}&rdquo;</span> found.
                </div>
              ) : (
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 px-1">
                    Popular Categories
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {quickCategories.map((c) => (
                      <button
                        key={c.slug}
                        onClick={() => {
                          onClose();
                          router.push(`/category/${c.slug}`);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 hover:text-white transition-all"
                      >
                        <Tag className="w-3 h-3 text-indigo-400" />
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
