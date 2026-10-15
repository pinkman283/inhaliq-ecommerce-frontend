"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Tag,
  Plus,
  Search,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  X,
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { PromotionCode, Promotion } from "@/types";
import {
  AdminPageHeader,
  AdminStatusBadge,
  AdminPagination,
} from "@/components/admin/ui";
import { ScrollableTableCard } from "@/components/admin/ScrollableTableCard";
import { toast } from "sonner";

export default function DiscountCodesPage() {
  const [codes, setCodes] = useState<PromotionCode[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPromoId, setSelectedPromoId] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [targetPromotionId, setTargetPromotionId] = useState<number | "">("");
  const [batchCount, setBatchCount] = useState(10);
  const [batchPrefix, setBatchPrefix] = useState("AETHER-");
  const [batchLimit, setBatchLimit] = useState<number | null>(1);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const [codesRes, promoRes] = await Promise.all([
        adminApi.getPromotionCodes({
          search: search || undefined,
          promotion_id: selectedPromoId !== "all" ? Number(selectedPromoId) : undefined,
          page,
          per_page: 20,
        }),
        adminApi.getPromotions({ per_page: 100 }),
      ]);

      setCodes(codesRes.data || []);
      setTotalPages(codesRes.last_page || 1);
      setTotalCount(codesRes.total || 0);
      setPromotions(promoRes.data || []);

      if (promoRes.data?.length > 0 && !targetPromotionId) {
        setTargetPromotionId(promoRes.data[0].id);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load discount codes");
    } finally {
      setLoading(false);
    }
  }, [search, selectedPromoId, page]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied code: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleBatchGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPromotionId) {
      toast.error("Please select a target promotion");
      return;
    }

    setGenerating(true);
    try {
      const res = await adminApi.generatePromotionCodes(Number(targetPromotionId), {
        count: Number(batchCount),
        prefix: batchPrefix,
        usage_limit_per_code: batchLimit ? Number(batchLimit) : null,
      });

      toast.success(res.message || `Generated ${batchCount} codes successfully`);
      setIsModalOpen(false);
      fetchCodes();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to generate codes");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <AdminPageHeader
        title="Discount Codes & Vouchers"
        description="Inspect, search, and generate individual or bulk voucher codes for active promotional campaigns."
        badge="Promo Code Registry"
        badgeVariant="purple"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Promotions & Discounts", href: "/admin/promotions" },
          { label: "Discount Codes" },
        ]}
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchCodes()}
              disabled={loading}
              className="p-2 rounded-md bg-[#171B26] border border-[#272B35] hover:bg-[#272B35] text-[#929BAD] hover:text-[#E5E7EB] transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] shadow-lg shadow-[#A78BFA]/10 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Batch Generate Codes
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="p-4 rounded-md border border-[#272B35] bg-[#11141D] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#929BAD]" />
            <input
              type="text"
              placeholder="Search code string..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-md bg-[#171B26] border border-[#272B35] text-xs text-[#E5E7EB] placeholder-[#929BAD] focus:border-[#A78BFA]/60 outline-none"
            />
          </div>

          <select
            value={selectedPromoId}
            onChange={(e) => setSelectedPromoId(e.target.value)}
            className="px-3 py-2 rounded-md bg-[#171B26] border border-[#272B35] text-xs text-[#E5E7EB] focus:border-[#A78BFA]/60 outline-none max-w-xs"
          >
            <option value="all">All Promotions</option>
            {promotions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-[#929BAD] font-mono">
          Total Codes: <strong className="text-white">{totalCount}</strong>
        </span>
      </div>

      {/* Table */}
      <ScrollableTableCard>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase tracking-wider font-semibold">
              <th className="p-4">Voucher Code</th>
              <th className="p-4">Linked Promotion</th>
              <th className="p-4">Usage Count / Limit</th>
              <th className="p-4">Status</th>
              <th className="p-4">Created Date</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#272B35]">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-[#929BAD]">
                  <div className="w-6 h-6 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading discount codes...
                </td>
              </tr>
            ) : codes.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-[#929BAD]">
                  <Tag className="w-8 h-8 text-[#626B7B] mx-auto mb-2" />
                  No discount codes found.
                </td>
              </tr>
            ) : (
              codes.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#A78BFA] text-xs bg-[#211B32] border border-[#A78BFA]/30 px-2.5 py-1 rounded">
                        {c.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(c.code)}
                        className="p-1 hover:text-white text-[#929BAD] transition-colors"
                        title="Copy Code"
                      >
                        {copiedCode === c.code ? (
                          <Check className="w-3.5 h-3.5 text-[#34D399]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  <td className="p-4">
                    <Link
                      href={`/admin/promotions/${c.promotion_id}`}
                      className="font-bold text-white hover:text-[#B9A3FF] transition-colors"
                    >
                      Promotion #{c.promotion_id}
                    </Link>
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <span className="font-mono text-[#E5E7EB]">
                      {c.used_count} / {c.usage_limit ?? "∞ Unlimited"}
                    </span>
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <AdminStatusBadge status={c.is_active ? "active" : "paused"} />
                  </td>

                  <td className="p-4 whitespace-nowrap text-[#929BAD] font-mono text-[11px]">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>

                  <td className="p-4 text-right whitespace-nowrap">
                    <Link
                      href={`/admin/promotions/${c.promotion_id}`}
                      className="text-xs text-[#A78BFA] hover:text-[#B9A3FF] hover:underline font-medium inline-flex items-center gap-1"
                    >
                      View Campaign →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ScrollableTableCard>

      {/* Pagination */}
      {totalPages > 1 && (
        <AdminPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
        />
      )}

      {/* Batch Code Generation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#11141D] border border-[#272B35] rounded-lg w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#A78BFA]" />
                Batch Code Generator
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-[#929BAD] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBatchGenerate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#E5E7EB]">Target Promotion</label>
                <select
                  required
                  value={targetPromotionId}
                  onChange={(e) => setTargetPromotionId(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-md bg-[#171B26] border border-[#272B35] text-xs text-white focus:border-[#A78BFA]/60 outline-none"
                >
                  {promotions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.promotion_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#E5E7EB]">Code Prefix</label>
                <input
                  type="text"
                  required
                  value={batchPrefix}
                  onChange={(e) => setBatchPrefix(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 rounded-md bg-[#171B26] border border-[#272B35] text-xs text-white font-mono uppercase focus:border-[#A78BFA]/60 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#E5E7EB]">Quantity of Codes</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={batchCount}
                    onChange={(e) => setBatchCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-md bg-[#171B26] border border-[#272B35] text-xs text-white font-mono focus:border-[#A78BFA]/60 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#E5E7EB]">Usage Limit / Code</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="1 for single-use"
                    value={batchLimit || ""}
                    onChange={(e) => setBatchLimit(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3.5 py-2 rounded-md bg-[#171B26] border border-[#272B35] text-xs text-white font-mono focus:border-[#A78BFA]/60 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-md text-xs font-semibold text-[#929BAD] hover:text-[#E5E7EB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-5 py-2 rounded-md text-xs font-bold bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] shadow-lg shadow-[#A78BFA]/10 transition-all disabled:opacity-50"
                >
                  {generating ? "Generating..." : "Generate Codes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
