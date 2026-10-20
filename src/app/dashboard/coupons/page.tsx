"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Gift,
  Tag,
  Clock,
  Sparkles,
  ChevronLeft,
  CheckCircle2,
  ShoppingBag,
} from "lucide-react";
import { api } from "@/lib/api";
import { Promotion, PromotionClaim } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";
import { CouponCard } from "@/components/promotions/CouponCard";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

function normalizeClaimToPromotion(claim: any): { promotion: Promotion; userClaim: PromotionClaim } {
  const promo: any = {
    id: claim.promotion_id || claim.claim_id || claim.id,
    name: claim.name || "Special Reward",
    description: claim.description || "",
    discount_type: claim.discount_type || "percentage",
    discount_value: claim.discount_value || 0,
    min_order_amount: claim.min_order_amount || 0,
    max_discount_amount: claim.max_discount_amount || null,
    badge_text: claim.badge_text || null,
    expires_at: claim.expires_at || null,
    status: claim.status || "active",
    promotion_type: "claimable_coupon",
    codes: claim.code ? [{ code: claim.code }] : [],
  };

  const userClaimObj: any = {
    id: claim.claim_id || claim.id,
    user_id: claim.user_id,
    promotion_id: claim.promotion_id,
    claimed_code: claim.code || claim.claimed_code,
    status: claim.status,
    claimed_at: claim.claimed_at,
    expires_at: claim.expires_at,
    redeemed_at: claim.redeemed_at,
    order_id: claim.order_id,
  };

  return { promotion: promo, userClaim: userClaimObj };
}

export default function CustomerCouponsPage() {
  const { isAuthenticated, logout, openAuthModal } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"all" | "available" | "claimed" | "redeemed" | "expired">("all");

  const [claimablePromotions, setClaimablePromotions] = useState<Promotion[]>([]);
  const [userClaims, setUserClaims] = useState<PromotionClaim[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [claimableRes, couponsRes] = await Promise.all([
        api.getClaimablePromotions().catch(() => []),
        api.getMyCoupons().catch(() => ({ claimed: [], available: [], used: [], expired: [] })),
      ]);

      setClaimablePromotions(Array.isArray(claimableRes) ? (claimableRes as any) : []);
      const allUserClaims = [
        ...(couponsRes.claimed || []),
        ...(couponsRes.used || []),
        ...(couponsRes.expired || []),
      ];
      setUserClaims(allUserClaims);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        logout();
        toast.error("Your session has expired. Please sign in again.");
        openAuthModal("login");
      } else {
        toast.error("Failed to load your coupons");
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, logout, openAuthModal]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClaimSuccess = (newClaim: PromotionClaim) => {
    toast.success("Coupon claimed successfully!");
    setUserClaims((prev) => [newClaim, ...prev]);
    loadData();
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-28 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
          <Gift className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sign In Required</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Sign in to view your available coupons, claim special discounts, and track vouchers.
        </p>
        <button
          onClick={() => openAuthModal("login")}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-sm"
        >
          Sign In
        </button>
      </div>
    );
  }

  // Segment user claims
  const claimedList = userClaims.filter((c) => c.status === "claimed");
  const redeemedList = userClaims.filter((c) => c.status === "redeemed");
  const expiredList = userClaims.filter((c) => c.status === "expired");

  const allCouponsList = [
    ...claimablePromotions.map((p) => ({ type: "available" as const, data: p })),
    ...claimedList.map((c) => ({ type: "claimed" as const, data: c })),
    ...redeemedList.map((c) => ({ type: "redeemed" as const, data: c })),
    ...expiredList.map((c) => ({ type: "expired" as const, data: c })),
  ];

  const tabs = [
    { key: "all", label: "All Coupons", count: allCouponsList.length, icon: Tag },
    { key: "available", label: "Available", count: claimablePromotions.length, icon: Sparkles },
    { key: "claimed", label: "Claimed", count: claimedList.length, icon: Gift },
    { key: "redeemed", label: "Redeemed", count: redeemedList.length, icon: CheckCircle2 },
    { key: "expired", label: "Expired", count: expiredList.length, icon: Clock },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-white/5">
        <div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 mb-1.5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Coupons & Discounts</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Available discounts, promo codes, and rewards for your account
          </p>
        </div>

        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-sm self-start sm:self-auto"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          Browse Products
        </Link>
      </div>

      {/* 2. Segmented Pill Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 rounded-xl w-fit overflow-x-auto text-xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-white dark:bg-[#0f131f] text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive
                    ? "bg-gray-100 dark:bg-white/10 text-slate-800 dark:text-slate-200"
                    : "bg-gray-200/60 dark:bg-white/5 text-slate-500 dark:text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents (Unified Layout across all sections) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0f131f] space-y-3"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24 rounded-full bg-muted" />
                <Skeleton className="h-4 w-16 rounded bg-muted" />
              </div>
              <Skeleton className="h-6 w-32 rounded bg-muted" />
              <Skeleton className="h-4 w-full rounded bg-muted" />
              <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                <Skeleton className="h-8 w-24 rounded-lg bg-muted" />
                <Skeleton className="h-8 w-20 rounded-lg bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === "all" ? (
        <div>
          {allCouponsList.length === 0 ? (
            <div className="p-10 rounded-2xl bg-white dark:bg-[#0f131f] border border-gray-200/80 dark:border-white/10 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mx-auto text-slate-400">
                <Tag className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">No coupons found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Check back soon for new promotions, seasonal discounts, and special offers!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allCouponsList.map((item, idx) => {
                if (item.type === "available") {
                  return (
                    <CouponCard
                      key={`avail-${item.data.id || idx}`}
                      promotion={item.data}
                      onClaimSuccess={handleClaimSuccess}
                    />
                  );
                }
                const { promotion, userClaim } = normalizeClaimToPromotion(item.data);
                return (
                  <CouponCard
                    key={`claim-${userClaim.id || idx}`}
                    promotion={promotion}
                    userClaim={userClaim}
                    disabled={item.type === "redeemed" || item.type === "expired"}
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === "available" ? (
        <div>
          {claimablePromotions.length === 0 ? (
            <div className="p-10 rounded-2xl bg-white dark:bg-[#0f131f] border border-gray-200/80 dark:border-white/10 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mx-auto text-slate-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">No available claimable coupons</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Check back soon for new promotions, seasonal discounts, and special offers!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {claimablePromotions.map((promo) => (
                <CouponCard
                  key={promo.id}
                  promotion={promo}
                  onClaimSuccess={handleClaimSuccess}
                />
              ))}
            </div>
          )}
        </div>
      ) : activeTab === "claimed" ? (
        <div>
          {claimedList.length === 0 ? (
            <div className="p-10 rounded-2xl bg-white dark:bg-[#0f131f] border border-gray-200/80 dark:border-white/10 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mx-auto text-slate-400">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">No claimed coupons</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Switch to &quot;Available&quot; to claim discount coupons to your account.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("available")}
                className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                View Available Coupons
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {claimedList.map((claim, idx) => {
                const { promotion, userClaim } = normalizeClaimToPromotion(claim);
                return (
                  <CouponCard
                    key={userClaim.id || idx}
                    promotion={promotion}
                    userClaim={userClaim}
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === "redeemed" ? (
        <div>
          {redeemedList.length === 0 ? (
            <div className="p-10 rounded-2xl bg-white dark:bg-[#0f131f] border border-gray-200/80 dark:border-white/10 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mx-auto text-slate-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">No redeemed coupons</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Coupons that you have already applied to past orders will be archived here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {redeemedList.map((claim, idx) => {
                const { promotion, userClaim } = normalizeClaimToPromotion(claim);
                return (
                  <CouponCard
                    key={userClaim.id || idx}
                    promotion={promotion}
                    userClaim={userClaim}
                    disabled
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div>
          {expiredList.length === 0 ? (
            <div className="p-10 rounded-2xl bg-white dark:bg-[#0f131f] border border-gray-200/80 dark:border-white/10 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mx-auto text-slate-400">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">No expired coupons</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                All of your coupons are currently active.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expiredList.map((claim, idx) => {
                const { promotion, userClaim } = normalizeClaimToPromotion(claim);
                return (
                  <CouponCard
                    key={userClaim.id || idx}
                    promotion={promotion}
                    userClaim={userClaim}
                    disabled
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
