"use client";

import React from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { 
  Ticket, 
  ChevronRight, 
  Globe, 
  ExternalLink, 
  AlertCircle, 
  TrendingUp, 
  Zap,
  HelpCircle
} from "lucide-react";

interface CouponReportRow {
  code: string;
  discount_type?: string;
  redemptions: number;
  total_discounts_given: number;
  revenue_generated: number;
  discount_to_revenue_roi?: string;
}

interface MarketingAndAttributionCardProps {
  couponRows: CouponReportRow[];
  isLoading?: boolean;
}

export const MarketingAndAttributionCard: React.FC<MarketingAndAttributionCardProps> = ({
  couponRows = [],
  isLoading = false,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Coupon & Promotional ROI (7 cols) */}
      <div className="lg:col-span-7 p-5 rounded-xl bg-white border border-[#E5E7EB] shadow-xs space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#111827] tracking-tight">
                  Promotions & Coupon Velocity
                </h2>
                <div
                  className="group relative cursor-help"
                  title="Realized discounts granted and incremental checkout revenue generated through promotional codes."
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#9CA3AF] hover:text-[#4B5563]" />
                </div>
              </div>
              <p className="text-xs text-[#6B7280]">
                Discount surrender vs. captured order revenue ROI
              </p>
            </div>
            <Link
              href="/admin/promotions"
              className="text-xs font-semibold text-[#009B55] hover:text-[#008247] flex items-center gap-1 transition-colors"
            >
              <span>Promotions</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-[#6B7280]">
              <div className="w-5 h-5 border-2 border-[#009B55] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs">Loading campaign performance...</span>
            </div>
          ) : couponRows.length === 0 ? (
            <div className="py-8 text-center text-[#6B7280] space-y-2">
              <Ticket className="w-6 h-6 text-[#9CA3AF] mx-auto" />
              <p className="text-xs font-medium text-[#111827]">No active coupon redemptions recorded</p>
              <p className="text-[11px] text-[#9CA3AF]">
                Create a marketing voucher or bundle discount to stimulate customer checkouts.
              </p>
              <div className="pt-1">
                <Link
                  href="/admin/promotions/new"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#009B55] hover:bg-[#008247] text-white text-xs font-semibold shadow-xs"
                >
                  <span>Launch New Promo Code</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#4B5563] font-semibold text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Uses</th>
                    <th className="py-2.5 px-3">Discounts</th>
                    <th className="py-2.5 px-3">Revenue Gen.</th>
                    <th className="py-2.5 px-3 text-right">ROI Multiplier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] bg-white">
                  {couponRows.slice(0, 4).map((c, i) => (
                    <tr key={i} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#111827]">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {c.code}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-[#4B5563]">
                        {c.redemptions}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-rose-600">
                        {formatPrice(c.total_discounts_given)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#111827]">
                        {formatPrice(c.revenue_generated)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#009B55]">
                        {c.discount_to_revenue_roi || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[#6B7280]">Realized campaign conversion telemetry</span>
          <Link
            href="/admin/promotions"
            className="font-semibold text-[#009B55] hover:text-[#008247] flex items-center gap-1"
          >
            <span>All Promotions</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Traffic Attribution & Web Telemetry (5 cols) */}
      <div className="lg:col-span-5 p-5 rounded-xl bg-white border border-[#E5E7EB] shadow-xs space-y-4 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#111827] tracking-tight">
                Traffic & Conversion Attribution
              </h2>
              <p className="text-xs text-[#6B7280]">
                Session acquisition, referrer sources, and cart abandonment
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-[#4B5563] border border-slate-200">
              GA4 Status
            </span>
          </div>

          {/* Transparent Notice Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#111827]">
                  Web Analytics Integration Unconfigured
                </h4>
                <p className="text-[11px] text-[#4B5563] leading-relaxed">
                  Real-time visitor sessions, bounce rates, and organic/paid search attribution require linking your Google Analytics 4 Measurement ID or server-side Pixel.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <span className="text-[11px] text-[#6B7280] font-medium">
                No simulated data generated
              </span>
              <Link
                href="/admin/integrations"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111827] hover:bg-black text-white text-xs font-semibold transition-colors shadow-xs"
              >
                <span>Connect GA4</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-2 text-[11px] text-[#6B7280]">
          Connect your Google Tag Manager or GA4 stream under <Link href="/admin/integrations" className="text-[#009B55] underline hover:text-[#008247]">Integrations & Settings</Link> to unlock UTM campaign attribution.
        </div>
      </div>
    </div>
  );
};
