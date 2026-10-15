"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, RefreshCw, User as UserIcon, AlertCircle } from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { User } from "@/types";

export interface CustomerComboboxProps {
  value?: number | string | null;
  onChange: (customer: User | null) => void;
  selectedCustomer?: User | null;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

/**
 * Highlights matches of `query` within `text`.
 */
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query || !text) return <span>{text}</span>;

  // Escape regex special chars
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span
            key={i}
            className="text-[#A78BFA] font-semibold bg-[#A78BFA]/20 px-0.5 rounded"
          >
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
}

export function CustomerCombobox({
  value,
  onChange,
  selectedCustomer: initialSelectedCustomer = null,
  placeholder = "Search customer by name, email, phone or ID...",
  disabled = false,
  error,
  label,
  required = false,
  className = "",
}: CustomerComboboxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<User[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selected, setSelected] = useState<User | null>(initialSelectedCustomer);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync controlled selectedCustomer
  useEffect(() => {
    if (initialSelectedCustomer !== undefined) {
      setSelected(initialSelectedCustomer);
    }
  }, [initialSelectedCustomer]);

  // If value is provided but no customer object is available, fetch customer details
  useEffect(() => {
    if (value && (!selected || selected.id !== Number(value))) {
      let isMounted = true;
      adminApi
        .getCustomer(Number(value))
        .then((cust) => {
          if (isMounted && cust) {
            setSelected(cust);
          }
        })
        .catch(() => {
          // Fallback if individual customer fetch fails
        });
      return () => {
        isMounted = false;
      };
    } else if (!value && selected) {
      setSelected(null);
    }
  }, [value, selected]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Server-side search with debounce
  const fetchCustomers = useCallback(async (searchQuery: string) => {
    setLoading(true);
    setSearchError(null);
    try {
      const res = await adminApi.getCustomers({
        search: searchQuery.trim() || undefined,
        per_page: 8,
      });
      setResults(res.data || []);
      setHighlightedIndex(res.data && res.data.length > 0 ? 0 : -1);
    } catch (err: any) {
      setSearchError(err?.response?.data?.message || "Failed to search customers");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setQuery(text);
    setIsOpen(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchCustomers(text);
    }, 250);
  };

  const handleInputFocus = () => {
    if (!selected) {
      setIsOpen(true);
      if (results.length === 0 && !loading) {
        fetchCustomers(query);
      }
    }
  };

  const handleSelectCustomer = (customer: User) => {
    setSelected(customer);
    onChange(customer);
    setIsOpen(false);
    setQuery("");
    setHighlightedIndex(-1);
  };

  const handleClearSelection = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelected(null);
    onChange(null);
    setQuery("");
    setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
      fetchCustomers("");
    }, 50);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setIsOpen(true);
        if (results.length === 0) {
          fetchCustomers(query);
        }
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          handleSelectCustomer(results[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
      case "Tab":
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // Auto-scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  return (
    <div className={`space-y-1.5 relative ${className}`} ref={containerRef}>
      {label && (
        <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
          <span>
            {label}
            {required && <span className="text-amber-400 ml-0.5">*</span>}
          </span>
        </label>
      )}

      {/* Selected State vs Search Input */}
      {selected ? (
        <div
          className={`w-full px-3.5 py-2 bg-[#12151f] border rounded-md text-xs flex items-center justify-between gap-2 transition ${
            error ? "border-red-500/50" : "border-white/10 hover:border-white/20"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-5 h-5 rounded-full bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center text-[10px] font-bold text-[#A78BFA] shrink-0">
              {selected.name?.charAt(0) || "U"}
            </div>
            <span className="font-semibold text-white truncate">{selected.name}</span>
            {selected.customer_id && (
              <span className="font-mono text-[10px] text-[#A78BFA] bg-[#211B32] px-1.5 py-0.5 rounded border border-[#A78BFA]/30 font-bold shrink-0">
                {selected.customer_id}
              </span>
            )}
            <span className="text-slate-400 truncate">
              ({selected.email || selected.phone || "No contact info"})
            </span>
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="p-1 hover:text-white hover:bg-white/10 rounded text-slate-400 transition cursor-pointer"
              title="Change customer"
              aria-label="Remove selected customer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-autocomplete="list"
            disabled={disabled}
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            className={`w-full pl-9 pr-9 py-2 bg-[#12151f] border rounded-md text-xs text-white placeholder-slate-500 outline-none transition ${
              error
                ? "border-red-500/50 focus:border-red-400"
                : "border-white/10 focus:border-[#A78BFA]/50"
            }`}
          />
          {loading ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <RefreshCw className="w-3.5 h-3.5 text-[#A78BFA] animate-spin" />
            </div>
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                fetchCustomers("");
                inputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      )}

      {error && <p className="text-[11px] text-red-400">{error}</p>}

      {/* Popover Results */}
      {isOpen && !selected && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#0e111a] border border-white/10 rounded-md shadow-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-white/5"
        >
          {loading && results.length === 0 ? (
            <div className="py-6 px-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#A78BFA]" />
              <span>Searching customers...</span>
            </div>
          ) : searchError ? (
            <div className="py-5 px-4 text-center text-xs text-red-400 flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4" />
                <span>{searchError}</span>
              </div>
              <button
                type="button"
                onClick={() => fetchCustomers(query)}
                className="text-[11px] text-[#A78BFA] hover:text-[#B9A3FF] hover:underline cursor-pointer"
              >
                Try again
              </button>
            </div>
          ) : results.length === 0 ? (
            <div className="py-6 px-4 text-center text-xs text-slate-500">
              {query.trim() ? (
                <>
                  No customers found matching &ldquo;<span className="text-slate-300 font-semibold">{query}</span>&rdquo;
                </>
              ) : (
                "No customers found."
              )}
            </div>
          ) : (
            results.map((cust, index) => {
              const isHighlighted = index === highlightedIndex;
              return (
                <div
                  key={cust.id}
                  role="option"
                  aria-selected={isHighlighted}
                  onClick={() => handleSelectCustomer(cust)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-3 py-2 text-xs flex items-center justify-between gap-2 cursor-pointer transition ${
                    isHighlighted
                      ? "bg-[#211B32] text-white"
                      : "hover:bg-white/5 text-slate-300"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white truncate">
                        <HighlightText text={cust.name} query={query} />
                      </span>
                      {cust.customer_id && (
                        <span className="font-mono text-[10px] text-[#A78BFA] bg-[#211B32] px-1.5 py-0.2 rounded border border-[#A78BFA]/30 font-bold shrink-0">
                          <HighlightText text={cust.customer_id} query={query} />
                        </span>
                      )}
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-medium ${
                          cust.customer_type === "guest"
                            ? "text-slate-400 bg-white/5"
                            : "text-cyan-400 bg-cyan-500/10"
                        }`}
                      >
                        {cust.customer_type === "guest" ? "Guest" : "Registered"}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-2">
                      {cust.email && (
                        <span>
                          <HighlightText text={cust.email} query={query} />
                        </span>
                      )}
                      {cust.email && cust.phone && <span>·</span>}
                      {cust.phone && (
                        <span className="font-mono">
                          <HighlightText text={cust.phone} query={query} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
