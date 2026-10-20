"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { 
  BadgeDollarSign, 
  Search, 
  Filter, 
  Receipt, 
  Printer, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  Banknote, 
  ShoppingBag, 
  Calculator, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Eye, 
  Calendar, 
  ChevronDown, 
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { Order, SalesInvoice, SalesSummary } from "@/types";
import { formatPrice, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  AdminPageHeader,
  AdminStatStrip,
  AdminStatusBadge,
  AdminPagination,
  AdminEmptyState,
} from "@/components/admin/ui";
import { OrderInvoiceModal } from "@/components/admin/orders/OrderInvoiceModal";
import { TableSkeletonRows } from "@/components/admin/ui/TableSkeletonRows";

export default function AdminSalesPage() {
  const [sales, setSales] = useState<Order[]>([]);
  const [summary, setSummary] = useState<SalesSummary>({
    total_sales: 0,
    total_transactions: 0,
    average_invoice_value: 0,
    pos_sales: 0,
    online_sales: 0,
    total_tax_collected: 0,
    total_discount_given: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [openPaymentStatusFilter, setOpenPaymentStatusFilter] = useState(false);
  const [openPaymentMethodFilter, setOpenPaymentMethodFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Invoice Modal
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  // Drag-to-scroll State
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  useEffect(() => {
    fetchSales();
  }, [search, sourceFilter, paymentStatusFilter, paymentMethodFilter, dateFrom, dateTo, page]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSales({
        search: search.trim() || undefined,
        source: sourceFilter !== "all" ? sourceFilter : undefined,
        payment_status: paymentStatusFilter !== "all" ? paymentStatusFilter : undefined,
        payment_method: paymentMethodFilter !== "all" ? paymentMethodFilter : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page,
        per_page: 15,
      });

      setSales(res.sales.data || []);
      setTotalPages(res.sales.last_page || 1);
      setSummary(res.summary);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load sales history.");
    } finally {
      setLoading(false);
    }
  };

  const openInvoiceModal = async (orderId: number) => {
    setLoadingInvoice(true);
    setSelectedInvoice(null);
    try {
      const invoiceData = await adminApi.getSalesInvoice(orderId);
      setSelectedInvoice(invoiceData);
    } catch (err: any) {
      toast.error("Failed to generate commercial invoice.");
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const fromParam = dateFrom ? `&date_from=${dateFrom}` : "";
    const toParam = dateTo ? `&date_to=${dateTo}` : "";
    const srcParam = sourceFilter !== "all" ? `&source=${sourceFilter}` : "";
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"}/admin/sales/export?_token=1${srcParam}${fromParam}${toParam}`;
    window.open(url, "_blank");
  };

  // Drag-to-scroll Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, select, a, textarea")) return;
    if (!tableContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - tableContainerRef.current.offsetLeft);
    setScrollLeftState(tableContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !tableContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    tableContainerRef.current.scrollLeft = scrollLeftState - walk;
  };

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case "pos":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Calculator className="w-3 h-3" /> POS Terminal
          </span>
        );
      case "online":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <ShoppingBag className="w-3 h-3" /> Online Store
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30">
            Direct Admin
          </span>
        );
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">PAID</span>;
      case "pending":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">PENDING</span>;
      case "refunded":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">REFUNDED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-slate-400 border border-white/10 uppercase">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Admin Page Header */}
      <AdminPageHeader
        title="Commercial Sales & Invoices"
        description="Unified multi-channel sales ledger across POS retail registers and online storefront checkouts."
        badge={`${summary.total_transactions} txns`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchSales}
              disabled={loading}
              className="px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#A78BFA]" : ""}`} />
              Refresh
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/[0.08] text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Export CSV
            </button>
          </div>
        }
      />

      {/* Workspace Unification Banner */}
      <div className="p-4 rounded-md bg-gradient-to-r from-[#A78BFA]/10 via-[#A78BFA]/5 to-transparent border border-[#A78BFA]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white tracking-wide">Orders & Invoices Unified</h4>
              <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30">Canonical Workspace</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Sales, commercial invoice generation, and POS/web channel fulfillment are unified into the main <strong>Orders & Fulfillment</strong> workspace.
            </p>
          </div>
        </div>
        <Link
          href="/admin/orders"
          className="px-3.5 py-1.5 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
        >
          <span>Open Orders Workspace</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* KPI Sales Performance Ribbon */}
      <AdminStatStrip
        stats={[
          {
            label: "Total Sales Revenue",
            value: formatPrice(summary.total_sales),
            change: `${summary.total_transactions} txns`,
            icon: BadgeDollarSign,
            helper: "Processed gross volume",
          },
          {
            label: "In-Store POS Sales",
            value: formatPrice(summary.pos_sales),
            change: `${summary.total_sales > 0 ? Math.round((summary.pos_sales / summary.total_sales) * 100) : 0}%`,
            icon: Calculator,
            helper: "Physical retail registers",
          },
          {
            label: "Online Storefront",
            value: formatPrice(summary.online_sales),
            change: `${summary.total_sales > 0 ? Math.round((summary.online_sales / summary.total_sales) * 100) : 0}%`,
            icon: ShoppingBag,
            helper: "eCommerce checkouts",
          },
          {
            label: "Average Ticket (AOV)",
            value: formatPrice(summary.average_invoice_value),
            icon: Receipt,
            helper: `VAT: ${formatPrice(summary.total_tax_collected)}`,
          },
        ]}
      />

      {/* Filter Toolbar */}
      <div className="bg-[#0f121b] p-4 rounded-md border border-white/[0.08] space-y-3">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          
          {/* Channel Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "All Sales" },
              { id: "pos", label: "In-Store POS" },
              { id: "online", label: "Online Storefront" },
              { id: "admin", label: "Admin Direct" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setSourceFilter(tab.id); setPage(1); }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                  sourceFilter === tab.id
                    ? "bg-[#A78BFA] text-[#090B10] font-bold shadow-sm"
                    : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar & Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search invoice #, customer, phone..."
                className="w-full bg-[#161a26] border border-white/[0.08] focus:border-[#A78BFA]/50 rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition"
              />
            </div>

            {/* Payment Status Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setOpenPaymentStatusFilter(!openPaymentStatusFilter);
                  setOpenPaymentMethodFilter(false);
                }}
                className="bg-[#161a26] hover:bg-[#1c2232] border border-white/[0.08] hover:border-white/20 rounded-md px-3 py-1.5 text-xs font-medium text-slate-200 flex items-center justify-between gap-2 transition cursor-pointer"
              >
                <span>
                  {paymentStatusFilter === "all" && "All Statuses"}
                  {paymentStatusFilter === "paid" && "Paid"}
                  {paymentStatusFilter === "pending" && "Pending"}
                  {paymentStatusFilter === "refunded" && "Refunded"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openPaymentStatusFilter ? "rotate-180 text-[#A78BFA]" : ""}`} />
              </button>

              {openPaymentStatusFilter && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setOpenPaymentStatusFilter(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-48 rounded-md bg-[#0f121b] border border-white/[0.1] shadow-xl p-1.5 z-40 space-y-1">
                    {[
                      { id: "all", label: "All Payment Statuses" },
                      { id: "paid", label: "Paid" },
                      { id: "pending", label: "Pending" },
                      { id: "refunded", label: "Refunded" },
                    ].map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setPaymentStatusFilter(st.id);
                          setPage(1);
                          setOpenPaymentStatusFilter(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                          paymentStatusFilter === st.id
                            ? "bg-[#211B32] text-[#A78BFA] font-semibold"
                            : "text-slate-300 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span>{st.label}</span>
                        {paymentStatusFilter === st.id && <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Payment Method Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setOpenPaymentMethodFilter(!openPaymentMethodFilter);
                  setOpenPaymentStatusFilter(false);
                }}
                className="bg-[#161a26] hover:bg-[#1c2232] border border-white/[0.08] hover:border-white/20 rounded-md px-3 py-1.5 text-xs font-medium text-slate-200 flex items-center justify-between gap-2 transition cursor-pointer"
              >
                <span>
                  {paymentMethodFilter === "all" && "All Tender Methods"}
                  {paymentMethodFilter === "cash" && "Cash"}
                  {paymentMethodFilter === "credit_card" && "Credit / Debit Card"}
                  {paymentMethodFilter === "bank_transfer" && "Bank Wire"}
                  {paymentMethodFilter === "mobile_money" && "Mobile Banking"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openPaymentMethodFilter ? "rotate-180 text-[#A78BFA]" : ""}`} />
              </button>

              {openPaymentMethodFilter && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setOpenPaymentMethodFilter(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-52 rounded-md bg-[#0f121b] border border-white/[0.1] shadow-xl p-1.5 z-40 space-y-1">
                    {[
                      { id: "all", label: "All Tender Methods" },
                      { id: "cash", label: "Cash" },
                      { id: "credit_card", label: "Credit / Debit Card" },
                      { id: "bank_transfer", label: "Bank Transfer" },
                      { id: "mobile_money", label: "Mobile Banking" },
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setPaymentMethodFilter(m.id);
                          setPage(1);
                          setOpenPaymentMethodFilter(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                          paymentMethodFilter === m.id
                            ? "bg-[#211B32] text-[#A78BFA] font-semibold"
                            : "text-slate-300 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span>{m.label}</span>
                        {paymentMethodFilter === m.id && <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sales Transactions & Invoices Table */}
      <div className="rounded-md bg-[#0f121b] border border-white/[0.08] shadow-sm overflow-hidden">
        <div 
          ref={tableContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`overflow-x-auto select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"} custom-horizontal-scrollbar pb-3`}
        >
          <table className="w-full text-left text-xs text-slate-300 min-w-[1050px]">
            <thead className="bg-white/[0.02] border-b border-white/[0.06] uppercase font-semibold text-[10px] tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4 min-w-[140px] whitespace-nowrap">Invoice / Order #</th>
                <th className="py-3 px-4 min-w-[150px] whitespace-nowrap">Channel</th>
                <th className="py-3 px-4 min-w-[240px] whitespace-nowrap">Customer / Cashier</th>
                <th className="py-3 px-4 min-w-[160px] whitespace-nowrap">Line Items</th>
                <th className="py-3 px-4 min-w-[140px] whitespace-nowrap">Tender & Status</th>
                <th className="py-3 px-4 min-w-[130px] whitespace-nowrap">Net Amount</th>
                <th className="py-3 px-4 min-w-[140px] whitespace-nowrap">Date & Time</th>
                <th className="py-3 px-4 min-w-[130px] whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <TableSkeletonRows rows={8} colSpan={8} hasCheckbox={false} />
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <AdminEmptyState
                      icon={BadgeDollarSign}
                      title="No sales transactions found"
                      description="Sales will populate automatically from in-store POS checkouts and web orders."
                    />
                  </td>
                </tr>
              ) : (
                sales.map(order => {
                  const itemsCount = order.items?.reduce((acc, it) => acc + it.quantity, 0) || order.items?.length || 0;

                  return (
                    <tr key={order.id} className="hover:bg-white/[0.02] transition">
                      
                      {/* Invoice & Order Number */}
                      <td className="py-3.5 px-4 whitespace-nowrap min-w-[150px]">
                        <button
                          onClick={() => openInvoiceModal(order.id)}
                          className="text-left group cursor-pointer"
                        >
                          <span className="font-mono font-bold text-[#A78BFA] group-hover:text-[#B9A3FF] block transition">
                            {order.invoice_number || `INV-${String(order.id).padStart(6, '0')}`}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Ref: {order.order_number}
                          </span>
                        </button>
                      </td>

                      {/* Source Channel Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap min-w-[150px]">
                        {getSourceBadge(order.order_source)}
                        {order.pos_register_session?.pos_register && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {order.pos_register_session.pos_register.name}
                          </div>
                        )}
                      </td>

                      {/* Customer & Cashier Info */}
                      <td className="py-3.5 px-4 whitespace-nowrap min-w-[240px]">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-white block">{order.customer_name}</span>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2">
                            {order.customer_phone && <span className="font-mono">{order.customer_phone}</span>}
                            {order.cashier_user && (
                              <span className="text-[10px] text-[#A78BFA] bg-[#211B32] px-1.5 py-0.5 rounded font-mono">
                                Cashier: {order.cashier_user.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Line Items Preview */}
                      <td className="py-3.5 px-4 whitespace-nowrap min-w-[160px]">
                        <div className="space-y-0.5">
                          <span className="text-xs font-medium text-slate-200 block">
                            {itemsCount} {itemsCount === 1 ? "unit" : "units"}
                          </span>
                          {order.items && order.items.length > 0 && (
                            <span className="text-[11px] text-slate-400 line-clamp-1 max-w-[180px] block">
                              {order.items[0]?.product_name}
                              {order.items.length > 1 && ` +${order.items.length - 1} more`}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Payment Tender & Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap min-w-[140px]">
                        <div className="space-y-1">
                          <div>
                            <AdminStatusBadge status={order.payment_status} size="sm" />
                          </div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block font-mono">
                            {order.payment_method?.replace("_", " ") || "CASH"}
                          </span>
                        </div>
                      </td>

                      {/* Net Amount */}
                      <td className="py-3.5 px-4 whitespace-nowrap min-w-[130px]">
                        <span className="font-mono font-bold text-emerald-400 text-sm block">
                          {formatPrice(order.total_amount)}
                        </span>
                        {parseFloat(order.tax_amount as any) > 0 && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            Incl. {formatPrice(order.tax_amount)} VAT
                          </span>
                        )}
                      </td>

                      {/* Date & Timestamp */}
                      <td className="py-3.5 px-4 text-slate-300 text-xs whitespace-nowrap min-w-[140px] font-mono">
                        {formatDate(order.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[130px]">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openInvoiceModal(order.id)}
                            className="px-2.5 py-1 rounded-md bg-[#211B32] hover:bg-[#A78BFA]/20 border border-[#A78BFA]/30 text-[#A78BFA] text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                            title="View Formal Commercial Invoice"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            Invoice
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3.5 bg-white/[0.01] border-t border-white/[0.06]">
            <AdminPagination
              page={page}
              totalPages={totalPages}
              totalItems={summary.total_transactions}
              itemsPerPage={15}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FORMAL COMMERCIAL INVOICE MODAL (Printable & Downloadable) */}
      {/* ========================================================================= */}
      <OrderInvoiceModal
        invoice={selectedInvoice}
        loading={loadingInvoice}
        onClose={() => setSelectedInvoice(null)}
      />

    </div>
  );
}
