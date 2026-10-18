"use client";

import React, { useState } from "react";
import { Trash2, Layers, Image as ImageIcon, Check, AlertCircle, Eye, EyeOff } from "lucide-react";
import { ProductFormVariant, ProductFormImage } from "@/types";

interface VariantMatrixTableProps {
  variants: ProductFormVariant[];
  onUpdateVariant: (index: number, updated: Partial<ProductFormVariant>) => void;
  onRemoveVariant: (index: number) => void;
  basePrice?: number;
  availableImages?: ProductFormImage[];
  disabled?: boolean;
}

export function VariantMatrixTable({
  variants,
  onUpdateVariant,
  onRemoveVariant,
  basePrice = 0,
  availableImages = [],
  disabled = false,
}: VariantMatrixTableProps) {
  if (variants.length === 0) {
    return (
      <div className="py-12 px-4 rounded-xl border border-dashed border-white/10 text-center flex flex-col items-center justify-center space-y-2.5 bg-slate-900/20">
        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-slate-500">
          <Layers className="w-5 h-5 text-slate-400" />
        </div>
        <h4 className="text-xs font-semibold text-white">No Variants Configured</h4>
        <p className="text-[11px] text-slate-400 max-w-sm">
          Define option groups above and click &quot;Sync Variant Matrix&quot; to generate combinations.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-slate-900/40 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] bg-slate-900/60 text-slate-400 text-[11px] uppercase tracking-wider">
              <th className="py-3 px-3 font-medium w-10 text-center" title="Active in catalog">
                Active
              </th>
              <th className="py-3 px-3 font-medium w-14 text-center">Image</th>
              <th className="py-3 px-3.5 font-medium min-w-[140px]">Attributes / Specs</th>
              <th className="py-3 px-3 font-medium min-w-[150px]">Variant Title</th>
              <th className="py-3 px-3 font-medium w-24">Stock</th>
              <th className="py-3 px-3 font-medium w-36">
                <div className="flex flex-col">
                  <span>Direct Price ($)</span>
                  <span className="text-[9px] text-slate-500 font-mono font-normal lowercase">or base+modifier</span>
                </div>
              </th>
              <th className="py-3 px-3 font-medium w-24">Cost ($)</th>
              <th className="py-3 px-3 font-medium w-28">Barcode</th>
              <th className="py-3 px-3 font-medium min-w-[120px]">SKU</th>
              <th className="py-3 px-3 font-medium text-right w-12">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {variants.map((v, idx) => {
              const currentBase = Number(basePrice) || 0;
              const hasDirectPrice = v.price !== null && v.price !== undefined && !isNaN(Number(v.price));
              const effectivePrice = hasDirectPrice
                ? Number(v.price)
                : Math.max(0, currentBase + Number(v.price_modifier || 0));

              const isRowActive = v.is_active !== false;

              // Check validation errors on row
              const rowErrors: string[] = [];
              if (v.stock_quantity < 0) rowErrors.push("Negative stock");
              if (hasDirectPrice && Number(v.price) < 0) rowErrors.push("Negative price");
              if (!v.name?.trim()) rowErrors.push("Missing name");

              const hasErrors = rowErrors.length > 0;

              return (
                <tr
                  key={v.id ? `id-${v.id}` : `idx-${idx}-${v.name}`}
                  className={`transition-colors ${
                    !isRowActive
                      ? "opacity-50 bg-slate-950/40"
                      : hasErrors
                      ? "bg-red-500/5 hover:bg-red-500/10"
                      : "hover:bg-white/[0.02]"
                  }`}
                >
                  {/* 1. Active Status Checkbox */}
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onUpdateVariant(idx, { is_active: !isRowActive })}
                      className={`p-1 rounded transition ${
                        isRowActive
                          ? "text-emerald-400 hover:bg-emerald-500/10"
                          : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                      }`}
                      title={isRowActive ? "Variant is active. Click to deactivate." : "Variant is inactive. Click to activate."}
                    >
                      {isRowActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </td>

                  {/* 2. Image Selector */}
                  <td className="py-2.5 px-3 text-center">
                    <VariantImagePickerCell
                      selectedImageId={v.image_id ?? null}
                      availableImages={availableImages}
                      disabled={disabled}
                      onSelectImage={(newId) => onUpdateVariant(idx, { image_id: newId })}
                    />
                  </td>

                  {/* 3. Attributes / Specs Badges */}
                  <td className="py-2.5 px-3.5">
                    {v.attributes && Object.keys(v.attributes).length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(v.attributes).map(([attrKey, attrVal]) => {
                          const isColor =
                            attrKey.toLowerCase() === "color" || attrKey.toLowerCase() === "colour";
                          return (
                            <span
                              key={attrKey}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/20 text-[#C4B5FD] text-[11px] font-medium"
                            >
                              {isColor && v.color_hex && (
                                <span
                                  className="w-2 h-2 rounded-full border border-black/30 shrink-0"
                                  style={{ backgroundColor: v.color_hex }}
                                />
                              )}
                              <span className="text-purple-300 text-[10px] uppercase font-mono">{attrKey}:</span>
                              <span>{attrVal}</span>
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      // Legacy color & size fallback
                      <div className="flex items-center gap-1.5">
                        {v.color_name && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 text-[11px]">
                            {v.color_hex && (
                              <span
                                className="w-2 h-2 rounded-full border border-black/30"
                                style={{ backgroundColor: v.color_hex }}
                              />
                            )}
                            {v.color_name}
                          </span>
                        )}
                        {v.size && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-slate-300 font-mono text-[11px]">
                            {v.size}
                          </span>
                        )}
                        {!v.color_name && !v.size && (
                          <span className="text-slate-500 italic text-[11px]">Standard Option</span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* 4. Variant Name / Label */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      disabled={disabled}
                      value={v.name}
                      onChange={(e) => onUpdateVariant(idx, { name: e.target.value })}
                      placeholder="Variant display label"
                      className="w-full bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/5 focus:border-[#A78BFA]/50 rounded-lg px-2 py-1 text-xs text-white outline-none transition"
                    />
                    {hasErrors && (
                      <span className="text-[10px] text-red-400 mt-0.5 block flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5" />
                        {rowErrors.join(", ")}
                      </span>
                    )}
                  </td>

                  {/* 5. Stock Quantity */}
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="0"
                      disabled={disabled}
                      value={v.stock_quantity ?? 0}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value || "0", 10));
                        onUpdateVariant(idx, { stock_quantity: isNaN(val) ? 0 : val });
                      }}
                      className="w-full bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/5 focus:border-emerald-400/50 rounded-lg px-2 py-1 text-xs text-white text-center outline-none transition font-mono font-medium"
                    />
                  </td>

                  {/* 6. Selling Price (Direct price with Price Modifier fallback) */}
                  <td className="py-2.5 px-3">
                    <VariantPriceCell
                      basePrice={currentBase}
                      directPrice={v.price ?? null}
                      priceModifier={v.price_modifier ?? 0}
                      disabled={disabled}
                      onUpdatePrices={(newPrice, newMod) =>
                        onUpdateVariant(idx, { price: newPrice, price_modifier: newMod })
                      }
                    />
                  </td>

                  {/* 7. Cost Price */}
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={disabled}
                      placeholder="—"
                      value={v.cost_price ?? ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? null : parseFloat(e.target.value);
                        onUpdateVariant(idx, { cost_price: isNaN(val as number) ? null : val });
                      }}
                      className="w-full bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/5 focus:border-white/20 rounded-lg px-2 py-1 text-xs text-white text-right outline-none transition font-mono"
                    />
                  </td>

                  {/* 8. Barcode */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      disabled={disabled}
                      placeholder="UPC / EAN"
                      value={v.barcode ?? ""}
                      onChange={(e) => onUpdateVariant(idx, { barcode: e.target.value || null })}
                      className="w-full bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/5 focus:border-white/20 rounded-lg px-2 py-1 text-xs text-white outline-none transition font-mono text-center"
                    />
                  </td>

                  {/* 9. SKU */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-mono text-slate-300">
                        {v.sku || (v.id ? `ID #${v.id}` : "Auto-generated")}
                      </span>
                      {v.id && (
                        <span className="text-[9px] font-mono text-slate-500">
                          db id: {v.id}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 10. Action: Remove */}
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onRemoveVariant(idx)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                      title="Remove variant"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// Subcomponent: Image Picker Cell
// ---------------------------------------------------------
interface VariantImagePickerCellProps {
  selectedImageId: number | null;
  availableImages: ProductFormImage[];
  disabled?: boolean;
  onSelectImage: (id: number | null) => void;
}

function VariantImagePickerCell({
  selectedImageId,
  availableImages,
  disabled = false,
  onSelectImage,
}: VariantImagePickerCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const matchedImage = availableImages.find((img) => img.id === selectedImageId);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center overflow-hidden transition"
        title={matchedImage ? "Click to change variant image" : "Click to assign variant image"}
      >
        {matchedImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={matchedImage.image_url}
            alt="Variant thumbnail"
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full mt-1.5 z-50 p-2 bg-slate-900 border border-white/15 rounded-xl shadow-xl w-48 space-y-1 text-left">
            <span className="text-[10px] text-slate-400 font-medium px-1 block mb-1">
              Select Product Image
            </span>

            {/* Clear option */}
            <button
              type="button"
              onClick={() => {
                onSelectImage(null);
                setIsOpen(false);
              }}
              className="w-full px-2 py-1 rounded text-[11px] text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-between"
            >
              <span>None (Use Product Primary)</span>
              {!selectedImageId && <Check className="w-3 h-3 text-emerald-400" />}
            </button>

            {availableImages.map((img) => {
              if (!img.id) return null;
              const isSelected = img.id === selectedImageId;
              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => {
                    onSelectImage(img.id!);
                    setIsOpen(false);
                  }}
                  className={`w-full p-1 rounded flex items-center gap-2 text-[11px] transition ${
                    isSelected ? "bg-purple-500/20 text-white" : "hover:bg-white/5 text-slate-300"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.image_url}
                    alt="Thumbnail"
                    className="w-6 h-6 rounded object-cover border border-white/10 shrink-0"
                  />
                  <span className="truncate flex-1 text-left">
                    {img.color_name || (img.is_primary ? "Primary Image" : `Image #${img.id}`)}
                  </span>
                  {isSelected && <Check className="w-3 h-3 text-[#A78BFA] shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------
// Subcomponent: Direct Price vs Price Modifier Cell
// ---------------------------------------------------------
interface VariantPriceCellProps {
  basePrice: number;
  directPrice: number | null;
  priceModifier: number;
  disabled?: boolean;
  onUpdatePrices: (price: number | null, modifier: number) => void;
}

function VariantPriceCell({
  basePrice,
  directPrice,
  priceModifier,
  disabled = false,
  onUpdatePrices,
}: VariantPriceCellProps) {
  const isDirect = directPrice !== null && !isNaN(Number(directPrice));
  const currentBase = Number(basePrice) || 0;
  const currentMod = Number(priceModifier) || 0;
  const effectivePrice = isDirect ? Number(directPrice) : Math.max(0, currentBase + currentMod);

  const [inputVal, setInputVal] = useState<string>(
    isDirect ? Number(directPrice).toFixed(2) : (effectivePrice > 0 ? effectivePrice.toFixed(2) : "")
  );

  const handleBlur = () => {
    const parsed = parseFloat(inputVal.trim());
    if (isNaN(parsed) || inputVal.trim() === "") {
      // Clear direct price, revert to base price
      onUpdatePrices(null, 0);
      setInputVal("");
    } else {
      const cleanPrice = Math.max(0, parseFloat(parsed.toFixed(2)));
      onUpdatePrices(cleanPrice, 0);
      setInputVal(cleanPrice.toFixed(2));
    }
  };

  return (
    <div className="relative">
      <input
        type="number"
        step="0.01"
        min="0"
        disabled={disabled}
        placeholder={currentBase > 0 ? currentBase.toFixed(2) : "0.00"}
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="w-full bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/5 focus:border-[#A78BFA]/50 rounded-lg px-2 py-1 text-xs text-white text-right outline-none transition font-mono"
      />
      <div className="flex items-center justify-between text-[9px] font-mono mt-0.5">
        {isDirect ? (
          <span className="text-purple-400 font-medium ml-auto">Direct</span>
        ) : currentMod > 0 ? (
          <span className="text-[#A78BFA] font-medium ml-auto">+{currentMod.toFixed(2)}</span>
        ) : (
          <span className="text-slate-500 font-normal ml-auto">Base</span>
        )}
      </div>
    </div>
  );
}
