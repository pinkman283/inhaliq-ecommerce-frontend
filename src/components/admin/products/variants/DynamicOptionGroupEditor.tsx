"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  X,
  Sparkles,
  Layers,
  AlertCircle,
  Tag,
  Check,
  Palette,
  HardDrive,
  Maximize2,
  Cpu,
} from "lucide-react";
import { ProductOption } from "@/types";
import { adminApi } from "@/lib/adminApi";
import { validateDynamicOptions } from "./VariantCombinationUtils";

interface DynamicOptionGroupEditorProps {
  options: ProductOption[];
  onOptionsChange: (options: ProductOption[]) => void;
  onSyncMatrix?: () => void;
  disabled?: boolean;
}

const COMMON_PRESETS = [
  { name: "Color", icon: Palette, sampleValues: ["Obsidian Black", "Pure White", "Space Gray", "Titanium Silver"] },
  { name: "Size", icon: Maximize2, sampleValues: ["S", "M", "L", "XL"] },
  { name: "Storage", icon: HardDrive, sampleValues: ["128GB", "256GB", "512GB", "1TB"] },
  { name: "Material", icon: Layers, sampleValues: ["Anodized Aluminum", "Carbon Fiber", "Titanium", "Tempered Glass"] },
  { name: "Switch Type", icon: Cpu, sampleValues: ["Linear Red", "Tactile Brown", "Clicky Blue", "Silent Yellow"] },
];

export function DynamicOptionGroupEditor({
  options,
  onOptionsChange,
  onSyncMatrix,
  disabled = false,
}: DynamicOptionGroupEditorProps) {
  const [newGroupName, setNewGroupName] = useState("");
  const [valueInputs, setValueInputs] = useState<Record<number, string>>({});
  const [colorRegistry, setColorRegistry] = useState<Array<{ name: string; hex: string }>>([]);

  // Fetch color registry for enhanced Color group suggestion
  useEffect(() => {
    let ignore = false;
    async function loadColors() {
      try {
        const data = await adminApi.getColors({ status: "active" });
        if (!ignore && data && data.length > 0) {
          setColorRegistry(data.map((c) => ({ name: c.name, hex: c.hex_code })));
        }
      } catch {
        // Fallback colors already in presets
      }
    }
    loadColors();
    return () => {
      ignore = true;
    };
  }, []);

  // Validation
  const validation = validateDynamicOptions(options);

  // Calculate combinations count
  const validOptionCounts = options
    .map((o) => (o.values || []).map((v) => v.trim()).filter(Boolean).length)
    .filter((count) => count > 0);

  const totalPossibleCombos =
    validOptionCounts.length > 0
      ? validOptionCounts.reduce((acc, curr) => acc * curr, 1)
      : 0;

  // Add Option Group
  const handleAddGroup = (nameToAdd?: string) => {
    const rawName = (nameToAdd || newGroupName).trim();
    if (!rawName) return;

    // Check if group already exists (case-insensitive)
    const exists = options.some((o) => o.name.trim().toLowerCase() === rawName.toLowerCase());
    if (exists) {
      return;
    }

    const next = [...options, { name: rawName, values: [] }];
    onOptionsChange(next);
    setNewGroupName("");
  };

  // Rename Option Group
  const handleRenameGroup = (index: number, newName: string) => {
    const next = options.map((opt, i) => (i === index ? { ...opt, name: newName } : opt));
    onOptionsChange(next);
  };

  // Remove Option Group
  const handleRemoveGroup = (index: number) => {
    const next = options.filter((_, i) => i !== index);
    onOptionsChange(next);
  };

  // Add Option Value
  const handleAddValue = (groupIndex: number, valToAdd?: string) => {
    const group = options[groupIndex];
    if (!group) return;

    const currentInput = valToAdd !== undefined ? valToAdd : (valueInputs[groupIndex] || "");
    const rawVal = currentInput.trim();
    if (!rawVal) return;

    // Support comma-separated values pasting: "Black, White, Gray"
    const splitVals = rawVal
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    const existingValuesLower = new Set(group.values.map((v) => v.trim().toLowerCase()));
    const valuesToAppend: string[] = [];

    for (const v of splitVals) {
      const lower = v.toLowerCase();
      if (!existingValuesLower.has(lower)) {
        existingValuesLower.add(lower);
        valuesToAppend.push(v);
      }
    }

    if (valuesToAppend.length > 0) {
      const next = options.map((opt, i) =>
        i === groupIndex ? { ...opt, values: [...opt.values, ...valuesToAppend] } : opt
      );
      onOptionsChange(next);
    }

    setValueInputs((prev) => ({ ...prev, [groupIndex]: "" }));
  };

  // Remove Option Value
  const handleRemoveValue = (groupIndex: number, valueIndex: number) => {
    const next = options.map((opt, i) =>
      i === groupIndex
        ? { ...opt, values: opt.values.filter((_, vIdx) => vIdx !== valueIndex) }
        : opt
    );
    onOptionsChange(next);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header & Group Add Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900/60 rounded-xl border border-white/5 backdrop-blur-md">
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#A78BFA]" />
            Dynamic Option Groups
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure custom option specifications (e.g. Color, Storage, Size, Material).
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-500 font-medium mr-1">Quick Add:</span>
          {COMMON_PRESETS.map((preset) => {
            const isAlreadyAdded = options.some(
              (o) => o.name.trim().toLowerCase() === preset.name.toLowerCase()
            );
            return (
              <button
                key={preset.name}
                type="button"
                disabled={disabled || isAlreadyAdded}
                onClick={() => handleAddGroup(preset.name)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  isAlreadyAdded
                    ? "bg-white/[0.02] text-slate-600 border border-transparent cursor-not-allowed"
                    : "bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/5 hover:border-purple-500/30"
                }`}
                title={isAlreadyAdded ? `'${preset.name}' is already added` : `Add ${preset.name} option group`}
              >
                <preset.icon className="w-3 h-3 text-[#A78BFA]" />
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Custom Option Group Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Tag className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            disabled={disabled}
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddGroup();
              }
            }}
            placeholder="Create custom option group (e.g., Battery Capacity, Connectivity, Finish)..."
            className="w-full bg-slate-900/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/60 transition"
          />
        </div>
        <button
          type="button"
          disabled={disabled || !newGroupName.trim()}
          onClick={() => handleAddGroup()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:bg-slate-800 disabled:text-slate-600 text-white transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Group
        </button>
      </div>

      {/* 3. Option Groups List */}
      {options.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/20 rounded-xl border border-dashed border-white/10">
          <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-300">No option groups defined yet.</p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
            Click on a preset like Color, Size, or Storage above, or type a custom option name to start generating combinations.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {options.map((group, groupIdx) => {
            const isColorGroup =
              group.name.trim().toLowerCase() === "color" ||
              group.name.trim().toLowerCase() === "colour";

            return (
              <div
                key={groupIdx}
                className="p-4 bg-slate-900/40 rounded-xl border border-white/10 space-y-3 transition hover:border-white/15"
              >
                {/* Group Header: Name + Delete */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 max-w-xs">
                    <span className="text-xs font-mono text-purple-400 font-semibold px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                      Option {groupIdx + 1}
                    </span>
                    <input
                      type="text"
                      disabled={disabled}
                      value={group.name}
                      onChange={(e) => handleRenameGroup(groupIdx, e.target.value)}
                      placeholder="Option group name"
                      className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-[#A78BFA] px-1 py-0.5 text-xs font-semibold text-white focus:outline-none transition"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      {group.values.length} {group.values.length === 1 ? "value" : "values"}
                    </span>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleRemoveGroup(groupIdx)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                      title={`Remove option group '${group.name}'`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Values Chips */}
                <div className="flex flex-wrap items-center gap-1.5 min-h-[32px]">
                  {group.values.map((val, valIdx) => {
                    const matchedColor = isColorGroup
                      ? colorRegistry.find((c) => c.name.toLowerCase() === val.toLowerCase())
                      : null;

                    return (
                      <span
                        key={valIdx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-white/[0.06] border border-white/10 text-white font-medium group transition hover:border-[#A78BFA]/40"
                      >
                        {matchedColor && (
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/30 shrink-0"
                            style={{ backgroundColor: matchedColor.hex }}
                          />
                        )}
                        <span>{val}</span>
                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => handleRemoveValue(groupIdx, valIdx)}
                            className="text-slate-400 hover:text-red-400 transition ml-0.5"
                            title={`Remove '${val}'`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    );
                  })}

                  {/* Add Value Input */}
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      disabled={disabled}
                      value={valueInputs[groupIdx] || ""}
                      onChange={(e) =>
                        setValueInputs((prev) => ({ ...prev, [groupIdx]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          handleAddValue(groupIdx);
                        }
                      }}
                      placeholder="+ Add value (hit Enter)..."
                      className="w-40 bg-white/[0.03] border border-white/10 focus:border-[#A78BFA] rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      disabled={disabled || !(valueInputs[groupIdx] || "").trim()}
                      onClick={() => handleAddValue(groupIdx)}
                      className="px-2 py-1 rounded-lg text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 disabled:opacity-30 transition"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Preset Suggestions for this group type */}
                {isColorGroup && colorRegistry.length > 0 && (
                  <div className="pt-2 border-t border-white/5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-500">Add from palette:</span>
                    {colorRegistry.slice(0, 8).map((c) => {
                      const isSelected = group.values.some(
                        (v) => v.toLowerCase() === c.name.toLowerCase()
                      );
                      return (
                        <button
                          key={c.name}
                          type="button"
                          disabled={disabled || isSelected}
                          onClick={() => handleAddValue(groupIdx, c.name)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition ${
                            isSelected
                              ? "opacity-30 cursor-not-allowed bg-transparent text-slate-600"
                              : "bg-white/[0.03] hover:bg-white/[0.07] text-slate-300 hover:text-white border border-white/5"
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full border border-black/30"
                            style={{ backgroundColor: c.hex }}
                          />
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Combinations Calculation & Validation Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/50 border border-white/5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#A78BFA]" />
          <span className="text-xs text-slate-300">
            {options.length === 0 ? (
              "No option combinations."
            ) : (
              <>
                Matrix will generate{" "}
                <strong className="text-white font-mono">{totalPossibleCombos}</strong> variant combination
                {totalPossibleCombos === 1 ? "" : "s"}
                {options.length > 1 && (
                  <span className="text-slate-500 ml-1">
                    ({options.map((o) => o.values.length).join(" × ")})
                  </span>
                )}
              </>
            )}
          </span>
        </div>

        {onSyncMatrix && (
          <button
            type="button"
            disabled={disabled || !validation.valid || totalPossibleCombos === 0}
            onClick={onSyncMatrix}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:bg-slate-800 disabled:text-slate-600 text-white transition shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            Sync Variant Matrix
          </button>
        )}
      </div>

      {/* 5. Validation Errors if any */}
      {!validation.valid && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl space-y-1">
          {validation.errors.map((err, i) => (
            <p key={i} className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {err}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
