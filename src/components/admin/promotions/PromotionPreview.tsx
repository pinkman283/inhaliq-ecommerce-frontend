"use client";

import React, { useState } from "react";
import { Sparkles, Ticket, Calculator, Check, ArrowRight, Tag, ShieldCheck } from "lucide-react";
import { Promotion } from "@/types";

interface PromotionPreviewProps {
  form: Omit<Partial<Promotion>, "codes"> & {
    codes?: Array<{ code: string; usage_limit?: number | null }>;
  };
}

export const PromotionPreview: React.FC<PromotionPreviewProps> = ({ form }) => {
  const [simulatorSubtotal, setSimulatorSubtotal] = useState<number>(2500);

  // Compute simulated discount
  const minSpend = Number(form.min_order_amount) || 0;
  const isEligible = simulatorSubtotal >= minSpend;

  let calculatedDiscount = 0;
  if (isEligible) {
    if (form.discount_type === "percentage") {
      calculatedDiscount = (simulatorSubtotal * (Number(form.discount_value) || 0)) / 100;
      if (form.max_discount_amount && calculatedDiscount > Number(form.max_discount_amount)) {
        calculatedDiscount = Number(form.max_discount_amount);
      }
    } else if (form.discount_type === "fixed_amount") {
      calculatedDiscount = Math.min(simulatorSubtotal, Number(form.discount_value) || 0);
    } else if (form.discount_type === "free_shipping") {
      calculatedDiscount = 120; // typical flat shipping rate
    } else if (form.discount_type === "buy_x_get_y") {
      calculatedDiscount = (simulatorSubtotal * (Number(form.bxgy_reward_discount_percent) || 100)) / 100;
    }
  }

  const simulatedTotal = Math.max(0, simulatorSubtotal - calculatedDiscount);

  const displayCode = form.codes?.[0]?.code || "PROMOCODE";

  return (
    <div className="space-y-6 sticky top-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#A78BFA]" />
          Live Customer Preview
        </h3>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Real-time reactive
        </span>
      </div>

      {/* Customer Ticket Card Preview */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-slate-400">Customer Voucher Card:</span>
        <div className="relative overflow-hidden rounded-md border border-[#A78BFA]/30 bg-[#0e1017] p-4 shadow-xl">
          {/* Perforated ticket notches */}
          <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded bg-[#07090e] border-r border-[#A78BFA]/30" />
          <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded bg-[#07090e] border-l border-[#A78BFA]/30" />

          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30">
              <Sparkles className="w-2.5 h-2.5" />
              {form.badge_text || (form.discount_type === "percentage" ? `${form.discount_value || 0}% OFF` : `৳${form.discount_value || 0} OFF`)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {form.promotion_type?.replace(/_/g, " ")}
            </span>
          </div>

          <h4 className="text-base font-black text-white">{form.name || "Untitled Promotion"}</h4>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
            {form.description || "Add a customer-facing description to display here."}
          </p>

          <div className="mt-3 pt-2 border-t border-dashed border-white/10 text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
            {minSpend > 0 && <span>Min Spend: ৳{minSpend.toLocaleString()}</span>}
            {form.max_discount_amount && <span>Max Discount: ৳{Number(form.max_discount_amount).toLocaleString()}</span>}
            {form.claim_validity_days && (
              <span className="text-purple-300 font-medium">Valid {form.claim_validity_days} days after claim</span>
            )}
            {form.claim_deadline && (
              <span className="text-[#A78BFA] font-medium">
                ⏳ Claim before: {new Date(form.claim_deadline).toLocaleDateString()}
              </span>
            )}
            {form.expires_at && (
              <span className="text-rose-300 font-medium">
                Ends: {new Date(form.expires_at).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="mt-3 pt-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-black/50 border border-white/10 rounded px-2.5 py-1 font-mono text-xs font-bold text-[#A78BFA]">
              <Tag className="w-3 h-3 text-[#A78BFA]" />
              {displayCode}
            </div>
            <span className="text-xs font-bold text-[#A78BFA] bg-[#211B32] px-2.5 py-1 rounded">
              Apply Code
            </span>
          </div>
        </div>
      </div>

      {/* Cart Simulator Widget */}
      <div className="p-4 rounded-md border border-white/10 bg-[#090b10] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-cyan-400" />
            Cart Discount Simulator
          </span>
          <span className="text-[11px] font-mono text-slate-400">Authoritative math</span>
        </div>

        <div>
          <label className="text-[11px] text-slate-400 block mb-1">Simulate Order Subtotal (৳):</label>
          <input
            type="number"
            min={0}
            step={100}
            value={simulatorSubtotal}
            onChange={(e) => setSimulatorSubtotal(Math.max(0, Number(e.target.value) || 0))}
            className="w-full bg-[#12151f] border border-white/10 rounded-md px-3 py-1.5 text-xs text-white focus:border-[#A78BFA]/50 outline-none"
          />
        </div>

        <div className="p-2.5 rounded-md bg-black/40 border border-white/5 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal:</span>
            <span className="font-mono text-white">৳{simulatorSubtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-emerald-400">
            <span>Discount Applied:</span>
            <span className="font-mono font-bold">
              {isEligible ? `-৳${calculatedDiscount.toLocaleString()}` : "৳0 (Spend requirement not met)"}
            </span>
          </div>
          <div className="flex justify-between text-slate-200 pt-1.5 border-t border-white/10 font-bold">
            <span>Simulated Checkout Total:</span>
            <span className="font-mono text-[#A78BFA] text-sm">৳{simulatedTotal.toLocaleString()}</span>
          </div>
        </div>

        {!isEligible && minSpend > 0 && (
          <p className="text-[11px] text-[#A78BFA]/80 italic">
            Cart needs ৳{(minSpend - simulatorSubtotal).toLocaleString()} more to activate this promotion.
          </p>
        )}
      </div>

      {/* Security & Audit Summary */}
      <div className="p-3.5 rounded-md border border-white/10 bg-[#090b10] space-y-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-300 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Validation & Safety Checks
        </div>
        <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
          <li>Customer eligibility: <span className="text-white font-mono">{form.customer_eligibility || "all"}</span></li>
          <li>Applies to: <span className="text-white font-mono">{form.applies_to || "entire_order"}</span></li>
          <li>Claim Window: <span className="text-[#A78BFA] font-mono">{form.claim_deadline ? new Date(form.claim_deadline).toLocaleString() : "No cutoff"}</span></li>
          <li>Wallet Validity: <span className="text-purple-300 font-mono">{form.claim_validity_days ? `${form.claim_validity_days} days after claim` : "Until campaign ends"}</span></li>
          <li>Auto-deactivates: <span className="text-emerald-300 font-mono">{form.expires_at ? new Date(form.expires_at).toLocaleString() : "Active until manual pause"}</span></li>
          <li>Double-entry GL: <span className="text-emerald-400 font-mono">4090 - Sales Discounts</span></li>
        </ul>
      </div>
    </div>
  );
};
