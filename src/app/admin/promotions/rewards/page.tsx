"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Award,
  Plus,
  Search,
  User as UserIcon,
  Clock,
  Sparkles,
  RefreshCw,
  X,
  Tag,
  Check,
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { PromotionClaim, User } from "@/types";
import {
  AdminPageHeader,
  AdminStatusBadge,
  AdminPagination,
  CustomerCombobox,
} from "@/components/admin/ui";
import { ScrollableTableCard } from "@/components/admin/ScrollableTableCard";
import { toast } from "sonner";

export default function CustomerRewardsPage() {
  const [rewards, setRewards] = useState<PromotionClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [selectedCustomerObj, setSelectedCustomerObj] = useState<User | null>(null);
  const [rewardName, setRewardName] = useState("VIP Privilege Customer Reward");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed_amount">("percentage");
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(0);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | "">("");
  const [daysValid, setDaysValid] = useState<number>(30);

  const fetchRewards = useCallback(async () => {
    setLoading(true);
    try {
      const claimsRes = await adminApi.getPromotionClaims({
        search: search || undefined,
        page,
        per_page: 20,
      });

      setRewards(claimsRes.data || []);
      setTotalPages(claimsRes.last_page || 1);
      setTotalCount(claimsRes.total || 0);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load customer rewards");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const handleIssueReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error("Please select a customer");
      return;
    }

    setIssuing(true);
    try {
      const res = await adminApi.issueCustomerReward({
        user_id: Number(selectedUserId),
        name: rewardName,
        discount_type: discountType,
        discount_value: Number(discountValue),
        min_order_amount: minOrderAmount ? Number(minOrderAmount) : 0,
        max_discount_amount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
        days_valid: daysValid ? Number(daysValid) : 30,
      });

      toast.success(res.message || "Customer reward issued successfully!");
      setIsModalOpen(false);
      fetchRewards();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to issue customer reward");
    } finally {
      setIssuing(false);
    }
  };

  const openDrawer = () => {
    setIsModalOpen(true);
    setSelectedUserId("");
    setSelectedCustomerObj(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <AdminPageHeader
        title="Customer Rewards & VIP Privileges"
        description="Grant exclusive personalized discount vouchers and compensation rewards directly assigned to individual customer accounts."
        badge="Direct Loyalty"
        badgeVariant="purple"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Promotions & Discounts", href: "/admin/promotions" },
          { label: "Customer Rewards" },
        ]}
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchRewards()}
              disabled={loading}
              className="p-2 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={openDrawer}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] shadow-lg shadow-purple-500/10 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Issue Customer Reward
            </button>
          </div>
        }
      />

      {/* Filter strip */}
      <div className="p-4 rounded-md border border-white/[0.06] bg-[#0c0e14] flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by customer name, email, reward code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white placeholder-slate-500 focus:border-[#A78BFA]/50 outline-none"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Assigned Rewards: <strong className="text-white">{totalCount}</strong>
        </span>
      </div>

      {/* Table */}
      <ScrollableTableCard>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase tracking-wider font-semibold">
              <th className="p-4">Customer</th>
              <th className="p-4">Reward Campaign</th>
              <th className="p-4">Exclusive Voucher</th>
              <th className="p-4">Issued Date</th>
              <th className="p-4">Valid Until</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Redemption Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-500">
                  <div className="w-6 h-6 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading customer rewards...
                </td>
              </tr>
            ) : rewards.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-500">
                  <Award className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  No customer rewards issued yet.
                </td>
              </tr>
            ) : (
              rewards.map((reward) => (
                <tr key={reward.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center font-bold text-[#A78BFA]">
                        {reward.user?.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <div className="font-bold text-white">{reward.user?.name || `Customer #${reward.user_id}`}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{reward.user?.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="font-semibold text-white">
                      {reward.promotion?.name || `Promotion #${reward.promotion_id}`}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-1.5 font-mono text-xs text-[#A78BFA] font-semibold bg-[#211B32] border border-[#A78BFA]/30 px-2.5 py-1 rounded w-fit">
                      <Tag className="w-3 h-3 text-[#A78BFA]" />
                      {reward.claimed_code}
                    </div>
                  </td>

                  <td className="p-4 whitespace-nowrap text-slate-300 font-mono text-[11px]">
                    {new Date(reward.claimed_at).toLocaleDateString()}
                  </td>

                  <td className="p-4 whitespace-nowrap text-slate-300 font-mono text-[11px]">
                    {reward.expires_at ? (
                      (() => {
                        const isExpiringSoon = new Date(reward.expires_at).getTime() - Date.now() < 24 * 3600 * 1000;
                        return (
                          <span className={`flex items-center gap-1 ${isExpiringSoon ? "text-amber-400" : "text-slate-300"}`}>
                            <Clock className="w-3 h-3" />
                            {new Date(reward.expires_at).toLocaleDateString()}
                          </span>
                        );
                      })()
                    ) : (
                      "Never expires"
                    )}
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <AdminStatusBadge status={reward.status} />
                  </td>

                  <td className="p-4 text-right whitespace-nowrap">
                    {reward.order ? (
                      <Link
                        href={`/admin/orders/${reward.order.id}`}
                        className="text-xs text-cyan-400 hover:underline font-mono font-bold"
                      >
                        #{reward.order.order_number}
                      </Link>
                    ) : (
                      <span className="text-slate-500 text-[11px] italic">Not yet redeemed</span>
                    )}
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


      {/* Right-Side Drawer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-md w-full bg-[#0d1017] border-l border-white/10 shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
              <h3 className="text-sm font-semibold text-white">Issue Customer Reward</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <form onSubmit={handleIssueReward} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Target Customer: Reusable Combobox */}
              <CustomerCombobox
                label="Customer"
                required
                placeholder="Search customer by name, email, phone or ID..."
                value={selectedUserId}
                selectedCustomer={selectedCustomerObj}
                onChange={(customer) => {
                  setSelectedUserId(customer ? customer.id : "");
                  setSelectedCustomerObj(customer);
                }}
              />

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Reward Title</label>
                <input
                  type="text"
                  required
                  value={rewardName}
                  onChange={(e) => setRewardName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#12151f] border border-white/10 rounded-md text-xs text-white focus:border-[#A78BFA]/50 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-[#12151f] border border-white/10 rounded-md text-xs text-white focus:border-[#A78BFA]/50 outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount (৳)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {discountType === "percentage" ? "Percentage (%)" : "Amount (৳)"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-[#12151f] border border-white/10 rounded-md text-xs text-white font-mono focus:border-[#A78BFA]/50 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Min Spend (৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-[#12151f] border border-white/10 rounded-md text-xs text-white font-mono focus:border-[#A78BFA]/50 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Validity (Days)</label>
                  <input
                    type="number"
                    min={1}
                    value={daysValid}
                    onChange={(e) => setDaysValid(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-[#12151f] border border-white/10 rounded-md text-xs text-white font-mono focus:border-[#A78BFA]/50 outline-none"
                  />
                </div>
              </div>

              {discountType === "percentage" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Max Discount (৳) (Optional)</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="No limit"
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3.5 py-2 bg-[#12151f] border border-white/10 rounded-md text-xs text-white font-mono focus:border-[#A78BFA]/50 outline-none"
                  />
                </div>
              )}
            </form>

            {/* Drawer Footer */}
            <div className="p-4 px-6 border-t border-white/[0.08] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-md text-xs font-medium text-slate-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleIssueReward}
                disabled={issuing || !selectedUserId}
                className="px-4 py-2 rounded-md text-xs font-semibold bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {issuing ? "Granting..." : "Grant Reward"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
