"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight, 
  ArrowLeft,
  X,
  Trash2,
  Calendar,
  Layers,
  FileSpreadsheet
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { AccountingLedgerResponse, ChartOfAccountItem, JournalEntryItem } from "@/types";
import { AdminPageHeader, AdminEmptyState } from "@/components/admin/ui";

export default function GeneralLedgerPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AccountingLedgerResponse | null>(null);
  const [accounts, setAccounts] = useState<ChartOfAccountItem[]>([]);
  
  // Filters
  const [search, setSearch] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  // Expanded Rows state
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  // Manual Journal Entry Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [narration, setNarration] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [lines, setLines] = useState<
    { chart_of_account_id: number; debit: string; credit: string; memo: string }[]
  >([
    { chart_of_account_id: 0, debit: "", credit: "", memo: "" },
    { chart_of_account_id: 0, debit: "", credit: "", memo: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    fetchLedger();
  }, [page, selectedAccountId, dateFrom, dateTo]);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchAccounts = async () => {
    try {
      const res = await adminApi.getChartOfAccounts({ is_active: true });
      setAccounts(res.accounts || []);
    } catch {
      // Non-blocking
    }
  };

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAccountingLedger({
        page,
        per_page: 20,
        search: search || undefined,
        chart_of_account_id: selectedAccountId ? Number(selectedAccountId) : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setData(res);
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to load general ledger.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLedger();
  };

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Line management in Manual Modal
  const addLine = () => {
    setLines((prev) => [...prev, { chart_of_account_id: 0, debit: "", credit: "", memo: "" }]);
  };

  const removeLine = (idx: number) => {
    if (lines.length <= 2) return;
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: string, value: any) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  // Computed modal totals
  const modalTotalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const modalTotalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const modalVariance = Math.abs(modalTotalDebit - modalTotalCredit);
  const isModalBalanced = modalTotalDebit > 0 && modalVariance < 0.01;

  const handleCreateJournalEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isModalBalanced) {
      showToast("error", "Journal entry must be balanced (Total Debit == Total Credit).");
      return;
    }

    // Validate accounts
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].chart_of_account_id) {
        showToast("error", `Please select an account for line ${i + 1}.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await adminApi.createJournalEntry({
        entry_date: entryDate,
        narration,
        reference_number: referenceNumber,
        lines: lines.map((l) => ({
          chart_of_account_id: Number(l.chart_of_account_id),
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
          memo: l.memo || undefined,
        })),
      });

      showToast("success", "Journal entry posted successfully to general ledger.");
      setModalOpen(false);
      setNarration("");
      setReferenceNumber("");
      setLines([
        { chart_of_account_id: 0, debit: "", credit: "", memo: "" },
        { chart_of_account_id: 0, debit: "", credit: "", memo: "" },
      ]);
      fetchLedger();
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to post journal entry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-md shadow-2xl border backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300 ${
            toast.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/40"
              : "bg-rose-950/90 text-rose-200 border-rose-500/40"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.text}</span>
        </div>
      )}

      {/* Admin Page Header */}
      <AdminPageHeader
        title="General Ledger & Journal Entries"
        description="Immutable double-entry transaction record. Every debit matches a credit with full source references."
        badge="Double-Entry GAAP"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] text-xs font-semibold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Journal Entry</span>
            </button>
            <a
              href={adminApi.getAccountingExportUrl("ledger")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/[0.08] text-xs font-semibold text-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </a>
            <button
              onClick={fetchLedger}
              disabled={loading}
              className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/[0.08] text-slate-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#A78BFA]" : ""}`} />
            </button>
          </div>
        }
      />

      {/* Mathematical Audit Balance Summary Bar */}
      <div className="p-4 rounded-md bg-[#0f121b] border border-white/[0.08] flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Ledger Debits</span>
            <div className="text-lg font-bold text-slate-100 font-mono">
              ${(data?.summary?.total_debit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="h-8 w-px bg-white/[0.08]" />
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Ledger Credits</span>
            <div className="text-lg font-bold text-slate-100 font-mono">
              ${(data?.summary?.total_credit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {data?.summary?.is_balanced ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Perfect Double-Entry Balance (Debit == Credit)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              <AlertCircle className="w-4 h-4" />
              <span>Ledger Variance Detected</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 rounded-md bg-[#0f121b] border border-white/[0.08] text-xs shadow-sm">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by entry #, narration, memo, reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#161a26] border border-white/[0.08] rounded-md pl-9 pr-3 py-1.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#A78BFA]/50 transition"
          />
        </div>

        <div>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full bg-[#161a26] border border-white/[0.08] rounded-md px-3 py-1.5 text-white focus:outline-none focus:border-[#A78BFA]/50 transition"
          >
            <option value="">All Accounts (All Classes)</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                [{a.account_code}] {a.account_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full bg-[#161a26] border border-white/[0.08] rounded-md px-2 py-1.5 text-white focus:outline-none focus:border-[#A78BFA]/50 transition"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-semibold transition-all cursor-pointer shrink-0 shadow-sm"
          >
            Filter
          </button>
        </div>
      </form>

      {/* General Ledger Table */}
      <div className="p-4 rounded-md bg-[#0f121b] border border-white/[0.08] space-y-3 shadow-sm">
        {(!data?.entries?.data || data.entries.data.length === 0) ? (
          <AdminEmptyState
            icon={BookOpen}
            title="No journal entries found"
            description="No transaction records match the current filter criteria."
          />
        ) : (
          <div className="space-y-2.5">
            {data.entries.data.map((entry) => {
              const isExpanded = !!expandedRows[entry.id];
              const totalDebit = entry.lines.reduce((s, l) => s + (l.debit || 0), 0);
              const totalCredit = entry.lines.reduce((s, l) => s + (l.credit || 0), 0);

              return (
                <div
                  key={entry.id}
                  className="rounded-md bg-white/[0.02] border border-white/5 overflow-hidden transition-colors hover:border-white/10"
                >
                  {/* Entry Header Bar */}
                  <div
                    onClick={() => toggleRow(entry.id)}
                    className="p-3.5 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <button className="text-slate-400 hover:text-white">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-indigo-400" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <span className="font-mono font-bold text-[#A78BFA] text-xs sm:text-sm">
                        {entry.entry_number}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{entry.entry_date}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-slate-300">
                        {entry.reference_type || "Manual"}
                      </span>
                      {entry.reference_number && (
                        <span className="text-[11px] font-mono text-slate-400">
                          #{entry.reference_number}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 mr-2 font-mono">Debit / Credit:</span>
                        <span className="text-xs font-mono font-bold text-slate-200">
                          ${totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {entry.status}
                      </span>
                    </div>
                  </div>

                  {/* Narration Preview */}
                  <div className="px-3.5 pb-3 text-xs text-slate-300 border-b border-white/5">
                    {entry.narration}
                  </div>

                  {/* Collapsible Lines Section */}
                  {isExpanded && (
                    <div className="p-3 bg-[#080c14] border-t border-white/5 overflow-x-auto animate-in fade-in duration-150">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-400 font-mono text-[10px] uppercase">
                            <th className="pb-2 font-semibold">Account Code</th>
                            <th className="pb-2 font-semibold">Account Name</th>
                            <th className="pb-2 font-semibold">Classification</th>
                            <th className="pb-2 font-semibold text-right">Debit ($)</th>
                            <th className="pb-2 font-semibold text-right">Credit ($)</th>
                            <th className="pb-2 font-semibold">Line Memo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {entry.lines.map((line) => (
                            <tr key={line.id} className="hover:bg-white/[0.02]">
                              <td className="py-2 font-mono text-[#A78BFA] font-bold">
                                {line.account?.account_code || "—"}
                              </td>
                              <td className="py-2 text-white font-medium">
                                {line.account?.account_name || "Account"}
                              </td>
                              <td className="py-2">
                                <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono bg-white/5 text-slate-400">
                                  {line.account?.account_type || "asset"}
                                </span>
                              </td>
                              <td className="py-2 text-right font-mono font-semibold text-slate-200">
                                {line.debit > 0 ? `$${line.debit.toFixed(2)}` : "—"}
                              </td>
                              <td className="py-2 text-right font-mono font-semibold text-slate-200">
                                {line.credit > 0 ? `$${line.credit.toFixed(2)}` : "—"}
                              </td>
                              <td className="py-2 text-slate-400 text-[11px] italic">
                                {line.memo || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-white/10 font-mono text-xs font-bold text-slate-200">
                            <td colSpan={3} className="pt-2 text-slate-400">Total Lines Balance:</td>
                            <td className="pt-2 text-right text-emerald-400">${totalDebit.toFixed(2)}</td>
                            <td className="pt-2 text-right text-emerald-400">${totalCredit.toFixed(2)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pagination */}
            {data.entries.last_page > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-slate-400">
                <div>
                  Showing page {data.entries.current_page} of {data.entries.last_page} ({data.entries.total} total entries)
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= data.entries.last_page}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Journal Entry Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b0f19] border border-white/10 rounded-lg max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Post Manual Journal Entry</h3>
                  <p className="text-[11px] text-slate-400">Enter balanced debit and credit transactions</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateJournalEntry} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Entry Date</label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full bg-[#141a29] border border-white/10 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Reference Number</label>
                  <input
                    type="text"
                    placeholder="e.g. ADJ-001, MEMO-99"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full bg-[#141a29] border border-white/10 rounded-md px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Narration / Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Official business reason for this journal entry..."
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  className="w-full bg-[#141a29] border border-white/10 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400 resize-none"
                />
              </div>

              {/* Multi-line Entry Grid */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Entry Lines</span>
                  <button
                    type="button"
                    onClick={addLine}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {lines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white/[0.02] p-2.5 rounded-md border border-white/5">
                      <div className="col-span-5">
                        <select
                          value={line.chart_of_account_id}
                          onChange={(e) => updateLine(idx, "chart_of_account_id", Number(e.target.value))}
                          className="w-full bg-[#141a29] border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                          required
                        >
                          <option value={0}>Select Account...</option>
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              [{a.account_code}] {a.account_name} ({a.account_type})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Debit $"
                          value={line.debit}
                          onChange={(e) => {
                            updateLine(idx, "debit", e.target.value);
                            if (e.target.value) updateLine(idx, "credit", "");
                          }}
                          className="w-full bg-[#141a29] border border-white/10 rounded-md px-2 py-1.5 text-xs text-white font-mono text-right focus:outline-none focus:border-indigo-400"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Credit $"
                          value={line.credit}
                          onChange={(e) => {
                            updateLine(idx, "credit", e.target.value);
                            if (e.target.value) updateLine(idx, "debit", "");
                          }}
                          className="w-full bg-[#141a29] border border-white/10 rounded-md px-2 py-1.5 text-xs text-white font-mono text-right focus:outline-none focus:border-indigo-400"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="Line memo"
                          value={line.memo}
                          onChange={(e) => updateLine(idx, "memo", e.target.value)}
                          className="w-full bg-[#141a29] border border-white/10 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                        />
                      </div>

                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          disabled={lines.length <= 2}
                          onClick={() => removeLine(idx)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 disabled:opacity-20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Balance Check Footer */}
              <div className="p-3 rounded-md bg-[#141a29] border border-white/10 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-slate-400 mr-2">Total Debits:</span>
                  <span className="font-bold text-white">${modalTotalDebit.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400 mr-2">Total Credits:</span>
                  <span className="font-bold text-white">${modalTotalCredit.toFixed(2)}</span>
                </div>
                <div>
                  {isModalBalanced ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Balanced
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> Diff: ${modalVariance.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-md bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !isModalBalanced}
                  className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-40 shadow-md shadow-indigo-600/20"
                >
                  {submitting ? "Validating & Posting..." : "Post Journal Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
