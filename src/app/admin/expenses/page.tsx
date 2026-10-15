"use client";

import { useEffect, useState } from "react";
import { 
  Receipt, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  Tag, 
  X, 
  Building2, 
  FolderPlus,
  CreditCard,
  ChevronDown,
  PieChart
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { Expense, ExpenseCategory, Vendor } from "@/types";
import { ExpenseBreakdownChart } from "@/components/admin/accounting";

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openCategoryFilter, setOpenCategoryFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showSpendAnalytics, setShowSpendAnalytics] = useState(false);

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    expense_category_id: "",
    title: "",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    payee_vendor_id: "",
    payee_name: "",
    payment_method: "cash",
    reference_number: "",
    receipt_attachment_url: "",
    notes: "",
    status: "recorded" as "recorded" | "approved" | "cancelled",
  });

  const [newCatForm, setNewCatForm] = useState({ name: "", code: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, [search, categoryFilter, statusFilter, page]);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const [expRes, catRes, venRes] = await Promise.all([
        adminApi.getExpenses({
          search: search || undefined,
          category_id: categoryFilter !== "all" ? categoryFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          page,
        }),
        adminApi.getExpenseCategories(),
        adminApi.getVendors({ per_page: 100 }),
      ]);
      setExpenses(expRes.expenses.data);
      setTotalPages(expRes.expenses.last_page);
      setStats(expRes.stats);
      setCategories(catRes);
      setVendors(venRes.vendors.data);
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to load expenses.");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({
      expense_category_id: categories.length > 0 ? categories[0].id.toString() : "",
      title: "",
      amount: "",
      expense_date: new Date().toISOString().split("T")[0],
      payee_vendor_id: "",
      payee_name: "",
      payment_method: "cash",
      reference_number: "",
      receipt_attachment_url: "",
      notes: "",
      status: "recorded",
    });
    setCreateModal(true);
  };

  const openEditModal = (exp: Expense) => {
    setSelectedExpense(exp);
    setFormData({
      expense_category_id: exp.expense_category_id.toString(),
      title: exp.title,
      amount: exp.amount.toString(),
      expense_date: exp.expense_date,
      payee_vendor_id: exp.payee_vendor_id ? exp.payee_vendor_id.toString() : "",
      payee_name: exp.payee_name || "",
      payment_method: exp.payment_method || "cash",
      reference_number: exp.reference_number || "",
      receipt_attachment_url: exp.receipt_attachment_url || "",
      notes: exp.notes || "",
      status: exp.status,
    });
    setEditModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.expense_category_id || !formData.amount) {
      showToast("error", "Please specify category and amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        expense_category_id: parseInt(formData.expense_category_id),
        title: formData.title,
        amount: parseFloat(formData.amount),
        expense_date: formData.expense_date,
        payee_vendor_id: formData.payee_vendor_id ? parseInt(formData.payee_vendor_id) : null,
        payee_name: formData.payee_name || undefined,
        payment_method: formData.payment_method,
        reference_number: formData.reference_number || undefined,
        notes: formData.notes || undefined,
        status: formData.status,
      };

      const res = await adminApi.createExpense(payload as any);
      showToast("success", res.message);
      setCreateModal(false);
      fetchExpenses();
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to record expense.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;

    setIsSubmitting(true);
    try {
      const payload = {
        expense_category_id: parseInt(formData.expense_category_id),
        title: formData.title,
        amount: parseFloat(formData.amount),
        expense_date: formData.expense_date,
        payee_vendor_id: formData.payee_vendor_id ? parseInt(formData.payee_vendor_id) : null,
        payee_name: formData.payee_name || undefined,
        payment_method: formData.payment_method,
        reference_number: formData.reference_number || undefined,
        notes: formData.notes || undefined,
        status: formData.status,
      };

      const res = await adminApi.updateExpense(selectedExpense.id, payload as any);
      showToast("success", res.message);
      setEditModal(false);
      fetchExpenses();
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to update expense.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (exp: Expense) => {
    if (!confirm(`Are you sure you want to delete expense record '${exp.expense_number}'?`)) return;
    try {
      const res = await adminApi.deleteExpense(exp.id);
      showToast("success", res.message);
      fetchExpenses();
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to delete expense.");
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminApi.createExpenseCategory(newCatForm);
      showToast("success", res.message);
      setNewCatForm({ name: "", code: "", description: "" });
      const updatedCats = await adminApi.getExpenseCategories();
      setCategories(updatedCats);
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to create category.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`p-4 rounded-md text-sm font-semibold flex items-center gap-3 border shadow-lg animate-in fade-in slide-in-from-top-2 ${
          toast.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" 
            : "bg-rose-500/10 border-rose-500/30 text-rose-300"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d0f18] p-5 rounded-md border border-white/10 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-md bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA] shadow-md">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Operating Expenses Ledger</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Record period business operating costs (Marketing, Salaries, Rent, Utilities) separate from inventory procurement.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setShowSpendAnalytics(!showSpendAnalytics)}
            className={`px-3.5 py-2.5 rounded-md border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              showSpendAnalytics
                ? "bg-[#211B32] text-[#A78BFA] border-[#A78BFA]/30 shadow-sm"
                : "bg-white/5 hover:bg-white/10 text-slate-200 border-white/10"
            }`}
          >
            <PieChart className="w-4 h-4 text-[#A78BFA]" />
            <span>{showSpendAnalytics ? "Hide Spend Analysis" : "Spend Analysis"}</span>
          </button>
          <button
            onClick={() => setCategoryModal(true)}
            className="px-3.5 py-2.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Tag className="w-4 h-4 text-[#A78BFA]" />
            Categories
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-md bg-gradient-to-r from-[#A78BFA] to-[#8B5CF6] hover:from-[#B9A3FF] hover:to-[#A78BFA] text-[#090B10] font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#A78BFA]/20 transition"
          >
            <Plus className="w-4 h-4" />
            Record Operating Expense
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0d0f18] p-4 rounded-md border border-white/10">
          <span className="text-xs text-slate-400 font-bold uppercase block">Total Operating Spend</span>
          <span className="text-2xl font-black text-rose-400 font-mono">${stats.total_expenses?.toFixed(2) || "0.00"}</span>
        </div>
        <div className="bg-[#0d0f18] p-4 rounded-md border border-white/10">
          <span className="text-xs text-slate-400 font-bold uppercase block">This Month's Overhead</span>
          <span className="text-2xl font-black text-[#A78BFA] font-mono">${stats.this_month_expenses?.toFixed(2) || "0.00"}</span>
        </div>
        <div className="bg-[#0d0f18] p-4 rounded-md border border-white/10">
          <span className="text-xs text-slate-400 font-bold uppercase block">Recorded Vouchers</span>
          <span className="text-2xl font-black text-white font-mono">{stats.total_recorded_count || 0}</span>
        </div>
      </div>

      {/* Optional Collapsible Spend Breakdown Analysis */}
      {showSpendAnalytics && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <ExpenseBreakdownChart
            data={categories
              .map((cat) => {
                const catExpenses = expenses.filter((e) => e.expense_category_id === cat.id);
                const total = catExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
                return {
                  account_code: cat.code || `CAT-${cat.id}`,
                  account_name: cat.name,
                  total_amount: total,
                };
              })
              .filter((item) => item.total_amount > 0)}
            isLoading={loading}
            height={280}
          />
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-[#0d0f18] p-4 rounded-md border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search expense, title, payee, or voucher..."
            className="w-full bg-[#151824] border border-white/10 rounded-md pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50"
          />
        </div>

        {/* Rounded Custom Category Dropdown Popover */}
        <div className="relative w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setOpenCategoryFilter(!openCategoryFilter)}
            className="w-full sm:w-64 bg-[#151824] hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-md px-4 py-2.5 text-xs font-bold text-slate-200 flex items-center justify-between gap-2 transition cursor-pointer shadow-md"
          >
            <span className="truncate">
              {categoryFilter === "all"
                ? "All Expense Categories"
                : categories.find(c => String(c.id) === String(categoryFilter))?.name || "Selected Category"}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openCategoryFilter ? "rotate-180 text-[#A78BFA]" : ""}`} />
          </button>

          {openCategoryFilter && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setOpenCategoryFilter(false)} 
              />
              <div className="absolute right-0 top-full mt-2 w-full sm:w-64 rounded-md bg-[#0e121e]/95 backdrop-blur-xl border border-white/15 shadow-2xl p-1.5 z-40 space-y-1 animate-in fade-in zoom-in-95 max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter("all");
                    setPage(1);
                    setOpenCategoryFilter(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                    categoryFilter === "all"
                      ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>All Expense Categories</span>
                  {categoryFilter === "all" && <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />}
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategoryFilter(String(cat.id));
                      setPage(1);
                      setOpenCategoryFilter(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                      String(categoryFilter) === String(cat.id)
                        ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span>{cat.name}</span>
                    {String(categoryFilter) === String(cat.id) && <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Expense Table */}
      <div className="bg-[#0d0f18] rounded-md border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#151824] text-slate-400 border-b border-white/10 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4">Voucher #</th>
                <th className="py-3.5 px-4">Title & Description</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Payee / Vendor</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading operating expense ledger...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No operating expenses recorded matching filters.
                  </td>
                </tr>
              ) : (
                expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {exp.expense_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white block">{exp.title}</span>
                      <span className="text-[10px] text-slate-400">{exp.notes || "No notes"}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-[#A78BFA]">
                        {exp.category?.name || "General"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-400 text-sm">
                      ${exp.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {exp.expense_date}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {exp.payee_vendor?.company_name || exp.payee_name || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 uppercase font-bold text-[10px] text-slate-400">
                      {exp.payment_method.replace("_", " ")}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(exp)}
                          title="Edit Expense"
                          className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp)}
                          title="Delete Expense"
                          className="p-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 bg-[#151824] border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Record / Edit Expense */}
      {(createModal || editModal) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e111a] border border-white/10 rounded-lg w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-[#A78BFA]">
                <Receipt className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">
                  {createModal ? "Record Operating Expense" : "Edit Operating Expense"}
                </h3>
              </div>
              <button onClick={() => { setCreateModal(false); setEditModal(false); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={createModal ? handleCreate : handleUpdate} className="space-y-3.5">
              <div>
                <label className="block uppercase font-bold text-slate-400 mb-1">Expense Title / Description *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Meta Ads Campaign, August Studio Rent, High-Speed Fiber Internet"
                  className="w-full bg-[#151824] border border-white/10 rounded-md px-3.5 py-2.5 text-white focus:outline-none focus:border-[#A78BFA]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1">Category *</label>
                  <select
                    required
                    value={formData.expense_category_id}
                    onChange={e => setFormData({ ...formData, expense_category_id: e.target.value })}
                    className="w-full bg-[#151824] border border-white/10 rounded-md px-3.5 py-2.5 text-white focus:outline-none focus:border-[#A78BFA]/50"
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-[#151824] border border-white/10 rounded-md px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-[#A78BFA]/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1">Expense Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.expense_date}
                    onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full bg-[#151824] border border-white/10 rounded-md px-3.5 py-2.5 text-white focus:outline-none focus:border-[#A78BFA]/50"
                  />
                </div>
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1">Payment Method</label>
                  <select
                    value={formData.payment_method}
                    onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full bg-[#151824] border border-white/10 rounded-md px-3.5 py-2.5 text-white focus:outline-none focus:border-[#A78BFA]/50"
                  >
                    <option value="cash">Cash Tender</option>
                    <option value="bank_transfer">Bank Wire / Transfer</option>
                    <option value="credit_card">Corporate Credit Card</option>
                    <option value="mobile_money">Mobile Banking / Pay</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1">Payee Name / Contractor</label>
                  <input
                    type="text"
                    value={formData.payee_name}
                    onChange={e => setFormData({ ...formData, payee_name: e.target.value })}
                    placeholder="e.g. Google LLC, City Power Corp"
                    className="w-full bg-[#151824] border border-white/10 rounded-md px-3.5 py-2.5 text-white focus:outline-none focus:border-[#A78BFA]/50"
                  />
                </div>
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1">Invoice / Ref #</label>
                  <input
                    type="text"
                    value={formData.reference_number}
                    onChange={e => setFormData({ ...formData, reference_number: e.target.value })}
                    placeholder="e.g. INV-99011"
                    className="w-full bg-[#151824] border border-white/10 rounded-md px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-[#A78BFA]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase font-bold text-slate-400 mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional audit notes..."
                  className="w-full bg-[#151824] border border-white/10 rounded-md p-3 text-white focus:outline-none focus:border-[#A78BFA]/50"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setCreateModal(false); setEditModal(false); }}
                  className="flex-1 py-2.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-bold shadow-lg shadow-[#A78BFA]/20"
                >
                  {isSubmitting ? "Saving..." : createModal ? "Record Expense" : "Update Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Manage Expense Categories */}
      {categoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e111a] border border-white/10 rounded-lg w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in zoom-in-95 text-xs max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-[#A78BFA]">
                <Tag className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Expense Cost Categories</h3>
              </div>
              <button onClick={() => setCategoryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Existing Categories */}
            <div className="space-y-2">
              <label className="uppercase font-bold text-slate-400 block">Existing Categories</label>
              <div className="bg-[#151824] rounded-md border border-white/10 divide-y divide-white/5 max-h-48 overflow-y-auto">
                {categories.map(c => (
                  <div key={c.id} className="p-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">{c.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Code: {c.code}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                      {c.expenses_count || 0} expenses
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Category */}
            <form onSubmit={handleCreateCategory} className="space-y-3 pt-2 border-t border-white/10">
              <label className="uppercase font-bold text-slate-300 block">+ Add New Category</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Category Name"
                  value={newCatForm.name}
                  onChange={e => setNewCatForm({ ...newCatForm, name: e.target.value })}
                  className="bg-[#151824] border border-white/10 rounded-md px-3 py-2 text-white"
                />
                <input
                  type="text"
                  required
                  placeholder="Code (e.g. TAX, LOG)"
                  value={newCatForm.code}
                  onChange={e => setNewCatForm({ ...newCatForm, code: e.target.value.toUpperCase() })}
                  className="bg-[#151824] border border-white/10 rounded-md px-3 py-2 text-white font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-bold shadow-lg shadow-[#A78BFA]/20"
              >
                Save Category
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
