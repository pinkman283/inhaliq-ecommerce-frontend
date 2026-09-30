"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Check, Plus, X, Palette, Sliders, Layers, RefreshCw } from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { SelectedColorOption } from "./VariantCombinationUtils";

interface VariantMatrixGeneratorProps {
  onGenerateMatrix: (selectedColors: SelectedColorOption[], selectedSizes: string[], defaultStock: number, defaultPriceMod: number) => void;
  disabled?: boolean;
}

const DEFAULT_FALLBACK_COLORS: SelectedColorOption[] = [
  { name: "Stealth Black", hex: "#0F172A" },
  { name: "Pure White", hex: "#FFFFFF" },
  { name: "Space Gray", hex: "#64748B" },
  { name: "Cyber Cyan", hex: "#06B6D4" },
  { name: "Crimson Red", hex: "#EF4444" },
  { name: "Olive Green", hex: "#3F6212" },
  { name: "Royal Gold", hex: "#D97706" },
  { name: "Deep Navy", hex: "#1E3A8A" },
];

const HARDWARE_SIZE_PRESETS = [
  {
    group: "Hardware Dimensions",
    presets: ["40mm", "44mm", "49mm", "2.5 inch", "M.2"],
  },
  {
    group: "Storage & Capacity",
    presets: ["128GB", "256GB", "512GB", "1TB", "2TB"],
  },
  {
    group: "Keyboards & Form Factor",
    presets: ["60%", "65%", "75%", "TKL", "Full 100%"],
  },
  {
    group: "Switch Types & Specs",
    presets: ["Linear", "Tactile", "Clicky", "Silent"],
  },
  {
    group: "Standard Sizing",
    presets: ["XS", "S", "M", "L", "XL", "XXL"],
  },
];

export function VariantMatrixGenerator({
  onGenerateMatrix,
  disabled = false,
}: VariantMatrixGeneratorProps) {
  const [colors, setColors] = useState<SelectedColorOption[]>([]);
  const [loadingColors, setLoadingColors] = useState(true);

  // Selected for generation
  const [selectedColors, setSelectedColors] = useState<SelectedColorOption[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [activePresetGroup, setActivePresetGroup] = useState(0);

  // Initial defaults
  const [defaultStock, setDefaultStock] = useState<number>(20);
  const [defaultPriceMod, setDefaultPriceMod] = useState<number>(0);

  // Load colors from Live Color Registry
  useEffect(() => {
    let ignore = false;
    async function loadColors() {
      try {
        const data = await adminApi.getColors({ status: "active" });
        if (!ignore) {
          if (data && data.length > 0) {
            setColors(data.map((c) => ({ name: c.name, hex: c.hex_code })));
          } else {
            setColors(DEFAULT_FALLBACK_COLORS);
          }
        }
      } catch {
        if (!ignore) {
          setColors(DEFAULT_FALLBACK_COLORS);
        }
      } finally {
        if (!ignore) {
          setLoadingColors(false);
        }
      }
    }
    loadColors();
    return () => {
      ignore = true;
    };
  }, []);

  // Color selection toggles
  const toggleColor = (color: SelectedColorOption) => {
    setSelectedColors((prev) => {
      const exists = prev.some((c) => c.name.toLowerCase() === color.name.toLowerCase());
      if (exists) {
        return prev.filter((c) => c.name.toLowerCase() !== color.name.toLowerCase());
      }
      return [...prev, color];
    });
  };

  const handleSelectAllColors = () => {
    setSelectedColors(colors);
  };

  const handleClearColors = () => {
    setSelectedColors([]);
  };

  // Size selection toggles
  const toggleSize = (size: string) => {
    const trimmed = size.trim();
    if (!trimmed) return;
    setSelectedSizes((prev) => {
      const exists = prev.some((s) => s.toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        return prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
      }
      return [...prev, trimmed];
    });
  };

  const handleAddCustomSize = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    const trimmed = customSizeInput.trim();
    if (!trimmed) return;
    if (!selectedSizes.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSelectedSizes((prev) => [...prev, trimmed]);
    }
    setCustomSizeInput("");
  };

  const handleRemoveSize = (sizeToRemove: string) => {
    setSelectedSizes((prev) => prev.filter((s) => s !== sizeToRemove));
  };

  const handleClearSizes = () => {
    setSelectedSizes([]);
  };

  // Total combinations calculation
  const totalCombosToGenerate =
    selectedColors.length > 0 && selectedSizes.length > 0
      ? selectedColors.length * selectedSizes.length
      : selectedColors.length > 0
      ? selectedColors.length
      : selectedSizes.length;

  const canGenerate = selectedColors.length > 0 || selectedSizes.length > 0;

  const handleTriggerGenerate = () => {
    if (!canGenerate) return;
    onGenerateMatrix(selectedColors, selectedSizes, defaultStock, defaultPriceMod);
  };

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-white tracking-wide">
              Combination Matrix Generator
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select multiple colors and sizes/specifications to generate Cartesian variant combinations automatically.
            </p>
          </div>
        </div>

        {canGenerate && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-emerald-400 font-semibold">
              {selectedColors.length} Colors × {selectedSizes.length} Sizes = {totalCombosToGenerate} Combos
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Step 1: Select Colors (5 Cols) */}
        <div className="lg:col-span-6 space-y-3 p-3.5 rounded-xl bg-white/[0.015] border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                1. Select Colors ({selectedColors.length} chosen)
              </label>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <button
                type="button"
                onClick={handleSelectAllColors}
                className="text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
              >
                Select all
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={handleClearColors}
                className="text-slate-400 hover:text-slate-300 transition cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {loadingColors ? (
            <div className="py-6 flex items-center justify-center text-xs text-slate-500 gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Loading color registry...
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
              {colors.map((color) => {
                const isSelected = selectedColors.some(
                  (c) => c.name.toLowerCase() === color.name.toLowerCase()
                );
                return (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => toggleColor(color)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300 shadow-2xs font-medium"
                        : "border-white/5 hover:border-white/15 bg-white/[0.02] text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0 shadow-2xs flex items-center justify-center"
                      style={{ backgroundColor: color.hex || "#333333" }}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                    </span>
                    <span className="truncate text-[11px]">{color.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 2: Select Sizes / Specs (7 Cols) */}
        <div className="lg:col-span-6 space-y-3 p-3.5 rounded-xl bg-white/[0.015] border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                2. Select Sizes / Specifications ({selectedSizes.length} chosen)
              </label>
            </div>
            {selectedSizes.length > 0 && (
              <button
                type="button"
                onClick={handleClearSizes}
                className="text-[10px] text-slate-400 hover:text-slate-300 transition cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Preset Group Tabs */}
          <div className="flex flex-wrap gap-1 pb-1 border-b border-white/[0.04]">
            {HARDWARE_SIZE_PRESETS.map((group, idx) => (
              <button
                key={group.group}
                type="button"
                onClick={() => setActivePresetGroup(idx)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                  activePresetGroup === idx
                    ? "bg-amber-400/10 text-amber-300 border border-amber-400/30"
                    : "text-slate-400 hover:text-slate-300 hover:bg-white/5"
                }`}
              >
                {group.group}
              </button>
            ))}
          </div>

          {/* Preset Chips */}
          <div className="flex flex-wrap gap-1.5">
            {HARDWARE_SIZE_PRESETS[activePresetGroup].presets.map((preset) => {
              const isSelected = selectedSizes.some(
                (s) => s.toLowerCase() === preset.toLowerCase()
              );
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => toggleSize(preset)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? "border-amber-400/50 bg-amber-400/15 text-amber-300 shadow-2xs font-semibold"
                      : "border-white/5 hover:border-white/15 bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]"
                  }`}
                >
                  {preset}
                </button>
              );
            })}
          </div>

          {/* Custom Size / Spec Input */}
          <div className="pt-1 flex gap-2">
            <input
              type="text"
              value={customSizeInput}
              onChange={(e) => setCustomSizeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomSize(e);
                }
              }}
              placeholder="Or type custom spec (e.g. Linear Cream, 2TB) + Enter"
              className="flex-1 bg-white/[0.03] border border-white/10 focus:border-amber-400/50 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none transition"
            />
            <button
              type="button"
              onClick={handleAddCustomSize}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>

          {/* Selected Sizes Chips Display */}
          {selectedSizes.length > 0 && (
            <div className="pt-1.5 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {selectedSizes.map((sz) => (
                <span
                  key={sz}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-mono"
                >
                  {sz}
                  <button
                    type="button"
                    onClick={() => handleRemoveSize(sz)}
                    className="hover:text-rose-400 transition cursor-pointer"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Generation Bar with Defaults & Action Button */}
      <div className="pt-3 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-400">Initial Stock:</label>
            <input
              type="number"
              min="0"
              value={defaultStock}
              onChange={(e) => setDefaultStock(Math.max(0, parseInt(e.target.value || "0", 10)))}
              className="w-16 bg-white/[0.03] border border-white/10 focus:border-emerald-400/50 rounded-md px-2 py-1 text-xs text-white outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-400">Price Modifier (+$):</label>
            <input
              type="number"
              step="0.01"
              value={defaultPriceMod}
              onChange={(e) => setDefaultPriceMod(parseFloat(e.target.value || "0") || 0)}
              className="w-20 bg-white/[0.03] border border-white/10 focus:border-emerald-400/50 rounded-md px-2 py-1 text-xs text-white outline-none"
            />
          </div>

          <span className="text-[11px] text-slate-500 italic">
            * Existing matching combinations preserve their IDs, SKU, stock, and prices.
          </span>
        </div>

        <button
          type="button"
          disabled={!canGenerate || disabled}
          onClick={handleTriggerGenerate}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-sm cursor-pointer ${
            canGenerate && !disabled
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 active:scale-95 border border-emerald-400/30"
              : "opacity-40 bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Generate Matrix ({totalCombosToGenerate || 0})
        </button>
      </div>
    </div>
  );
}
