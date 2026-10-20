"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  Clock,
  RefreshCw,
  CreditCard,
  ShoppingBag,
} from "lucide-react";
import { api } from "@/lib/api";
import { StoreCreditAccount, StoreCreditTransaction } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerStoreCreditPage() {
  const { isAuthenticated, logout, openAuthModal } = useAuthStore();
  const [account, setAccount] = useState<StoreCreditAccount | null>(null);
  const [transactions, setTransactions] = useState<StoreCreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStoreCredit = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.getMyStoreCredit();
      setAccount({
        id: 0,
        user_id: 0,
        balance: res.balance,
        total_credited: res.total_credited,
        total_debited: res.total_debited,
        is_frozen: res.is_frozen,
        updated_at: new Date().toISOString(),
      });
      setTransactions(res.transactions?.data || []);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        logout();
        toast.error("Your session has expired. Please sign in again.");
        openAuthModal("login");
      } else {
        toast.error("Failed to load store credit details");
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, logout, openAuthModal]);

  useEffect(() => {
    loadStoreCredit();
  }, [loadStoreCredit]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-28 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
          <Wallet className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sign In Required</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Please sign in to view your available store credits, balance, and activity ledger.
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

  const balance = Number(account?.balance || 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-white/5">
        <div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 mb-1.5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Store Credit</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Your store balance and credit history
          </p>
        </div>

        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-sm self-start sm:self-auto"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          Shop With Credit
        </Link>
      </div>

      {/* 2. Balance & KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Main Available Balance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0f131f] border border-gray-200/80 dark:border-white/10 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Available Balance</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">৳{balance.toLocaleString()}</p>
          </div>
        </div>

        {/* Lifetime Credited */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0f131f] border border-gray-200/80 dark:border-white/10 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Total Credited</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">৳{Number(account?.total_credited || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Redeemed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0f131f] border border-gray-200/80 dark:border-white/10 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Total Redeemed</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">৳{Number(account?.total_debited || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* 3. Transactions Activity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Activity History
          </h2>
          <button
            onClick={() => loadStoreCredit()}
            disabled={loading}
            className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors text-xs flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0f131f] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Balance</th>
                  <th className="p-3.5">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {loading ? (
                  Array.from({ length: 5 }).map((_, rIdx) => (
                    <tr key={rIdx} className="border-b border-gray-100 dark:border-white/5">
                      <td className="p-3.5"><Skeleton className="h-4 w-20 rounded bg-muted" /></td>
                      <td className="p-3.5"><Skeleton className="h-5 w-16 rounded-full bg-muted" /></td>
                      <td className="p-3.5"><Skeleton className="h-4 w-16 rounded bg-muted" /></td>
                      <td className="p-3.5"><Skeleton className="h-4 w-20 rounded bg-muted" /></td>
                      <td className="p-3.5"><Skeleton className="h-4 w-40 rounded bg-muted" /></td>
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-slate-400">
                      <CreditCard className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      No credit transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const isCredit =
                      tx.type === "credit" ||
                      tx.type === "refund" ||
                      tx.type === "reward";
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400 text-xs">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md border ${
                              isCredit
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                            }`}
                          >
                            {isCredit ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownLeft className="w-3 h-3" />
                            )}
                            {tx.type}
                          </span>
                        </td>

                        <td className="p-3.5 whitespace-nowrap font-mono font-bold text-xs">
                          <span className={isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                            {isCredit ? "+" : "-"}৳{Number(tx.amount).toLocaleString()}
                          </span>
                        </td>

                        <td className="p-3.5 whitespace-nowrap font-mono text-slate-800 dark:text-slate-200 text-xs">
                          ৳{Number(tx.balance_after).toLocaleString()}
                        </td>

                        <td className="p-3.5 text-slate-600 dark:text-slate-300 max-w-sm truncate text-xs">
                          {tx.reason || "Store credit transaction"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
