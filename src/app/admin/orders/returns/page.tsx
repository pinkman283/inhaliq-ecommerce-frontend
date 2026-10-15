"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  RotateCcw, 
  Search, 
  Filter, 
  Truck, 
  PackageCheck, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Eye, 
  Plus, 
  X, 
  RefreshCw, 
  Loader2, 
  ShieldAlert, 
  CreditCard, 
  Coins, 
  Building2, 
  FileText,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Check,
  Trash2
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { OrderReturn, OrderReturnItem } from "@/types";
import { formatPrice, formatDate } from "@/lib/utils";
import { ScrollableTableCard } from "@/components/admin/ScrollableTableCard";
import { AdminPageHeader, AdminStatusBadge, AdminEmptyState } from "@/components/admin/ui";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { toast } from "sonner";

export default function AdminReturnsPage() {
  return (
    <Suspense fallback={
      <div className="p-12 text-center text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#A78BFA] mb-2" />
        Loading Returns & RTO Management...
      </div>
    }>
      <ReturnsContent />
    </Suspense>
  );
}

function ReturnsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "all";

  const [returns, setReturns] = useState<OrderReturn[]>([]);
  const [stats, setStats] = useState({
    all_count: 0,
    rto_count: 0,
    customer_returns_count: 0,
    awaiting_inspection_count: 0,
    refunded_count: 0,
    total_refunded_amount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selected Return for Drawer / Modal (supports ID number or RET/ORD code string)
  const [selectedReturnId, setSelectedReturnId] = useState<number | string | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<OrderReturn | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [returnNotFound, setReturnNotFound] = useState(false);

  // QC Modal state
  const [qcModalOpen, setQcModalOpen] = useState(false);
  const [qcItems, setQcItems] = useState<any[]>([]);
  const [qcSubmitting, setQcSubmitting] = useState(false);

  // Refund Modal state
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundMethod, setRefundMethod] = useState<string>("cash");
  const [refundNotes, setRefundNotes] = useState<string>("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  // New Return Modal state
  const [newReturnModalOpen, setNewReturnModalOpen] = useState(false);
  const [newOrderId, setNewOrderId] = useState("");
  const [newReturnType, setNewReturnType] = useState("rto");
  const [newReturnReason, setNewReturnReason] = useState("");
  const [newReturnCreating, setNewReturnCreating] = useState(false);

  // Deletion States
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [deletingReturn, setDeletingReturn] = useState<OrderReturn | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getReturns({
        tab: activeTab,
        search: searchQuery || undefined,
        page: currentPage,
        per_page: 20,
      });
      setReturns(res.data || []);
      if (res.stats) {
        setStats(res.stats);
      }
      if (res.meta) {
        setTotalPages(res.meta.last_page);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load returns");
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, currentPage]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const loadReturnDetail = useCallback(async (id: number | string) => {
    setDrawerLoading(true);
    setReturnNotFound(false);
    setSelectedReturnId(id);
    try {
      const res = await adminApi.getReturn(id);
      if (res && res.data) {
        setSelectedReturn(res.data);
        setSelectedReturnId(res.data.id);
      } else {
        setReturnNotFound(true);
        setSelectedReturn(null);
      }
    } catch (err: any) {
      setReturnNotFound(true);
      setSelectedReturn(null);
    } finally {
      setDrawerLoading(false);
    }
  }, []);

  const openReturnDrawer = (ret: OrderReturn) => {
    setSelectedReturn(ret);
    setSelectedReturnId(ret.id);
    setReturnNotFound(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("returnId", ret.return_number);
      window.history.pushState(null, "", url.toString());
    }
  };

  const closeReturnDrawer = () => {
    setSelectedReturnId(null);
    setSelectedReturn(null);
    setReturnNotFound(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("returnId");
      url.searchParams.delete("id");
      const curSearch = url.searchParams.get("search");
      if (curSearch && (curSearch.startsWith("RET-") || curSearch.startsWith("ORD-"))) {
        url.searchParams.delete("search");
      }
      window.history.replaceState(null, "", url.toString());
    }
  };

  // Deep-link resolution from URL params on load
  useEffect(() => {
    const returnIdParam = searchParams.get("returnId") || searchParams.get("id");
    const searchParam = searchParams.get("search");

    if (returnIdParam) {
      loadReturnDetail(returnIdParam);
    } else if (searchParam && (searchParam.startsWith("RET-") || searchParam.startsWith("ORD-"))) {
      loadReturnDetail(searchParam);
    }
  }, [searchParams, loadReturnDetail]);

  // Sync search input if search param is present
  useEffect(() => {
    const searchParam = searchParams.get("search");
    if (searchParam && !searchQuery) {
      setSearchQuery(searchParam);
    }
  }, [searchParams]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const rid = params.get("returnId") || params.get("id");
      if (rid) {
        loadReturnDetail(rid);
      } else {
        setSelectedReturnId(null);
        setSelectedReturn(null);
        setReturnNotFound(false);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [loadReturnDetail]);

  // Escape key closes drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedReturnId) {
        closeReturnDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedReturnId]);

  const handleTabChange = (tabKey: string) => {
    setCurrentPage(1);
    setSelectedIds([]);
    router.push(`/admin/orders/returns?tab=${tabKey}`);
  };

  const handleToggleSelectAll = () => {
    if (returns.length > 0 && selectedIds.length === returns.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(returns.map((r) => r.id));
    }
  };

  const handleToggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSingleDelete = async () => {
    if (!deletingReturn) return;
    setIsDeletingSingle(true);
    try {
      const res = await adminApi.deleteReturn(deletingReturn.id);
      const deletedId = deletingReturn.id;
      setReturns((prev) => prev.filter((r) => r.id !== deletedId));
      setSelectedIds((prev) => prev.filter((id) => id !== deletedId));
      if (selectedReturn?.id === deletedId) {
        closeReturnDrawer();
      }
      toast.success(res.message || `Return #${deletingReturn.return_number} deleted.`);
      setDeletingReturn(null);
      fetchReturns();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to delete return.");
    } finally {
      setIsDeletingSingle(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const res = await adminApi.bulkDeleteReturns(selectedIds);
      const deletedIds = [...selectedIds];
      setReturns((prev) => prev.filter((r) => !deletedIds.includes(r.id)));
      if (selectedReturn && deletedIds.includes(selectedReturn.id)) {
        closeReturnDrawer();
      }
      setSelectedIds([]);
      toast.success(res.message || `Deleted ${deletedIds.length} return(s).`);
      fetchReturns();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to delete selected returns.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleMarkReceived = async (returnId: number) => {
    try {
      await adminApi.receiveReturn(returnId);
      toast.success("Parcel marked as physically received at warehouse!");
      fetchReturns();
      if (selectedReturnId === returnId || (selectedReturn && selectedReturn.id === returnId)) {
        loadReturnDetail(returnId);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to mark parcel as received");
    }
  };

  const openQcModal = (ret: OrderReturn) => {
    setSelectedReturn(ret);
    const initialItems = (ret.items || []).map((item) => ({
      id: item.id,
      product_name: item.product?.name || item.order_item?.product_name || `Product #${item.product_id}`,
      product_sku: item.product?.sku || item.order_item?.product_sku || "",
      quantity_returned: item.quantity_returned,
      unit_price: item.unit_price,
      refund_unit_price: item.refund_unit_price || item.unit_price,
      condition: item.condition || "unopened",
      disposition: item.disposition !== "pending" ? item.disposition : "restock_sellable",
      restocked_quantity: item.restocked_quantity || item.quantity_returned,
      damaged_quantity: item.damaged_quantity || 0,
      writeoff_quantity: item.writeoff_quantity || 0,
      qc_notes: item.qc_notes || "",
    }));
    setQcItems(initialItems);
    setQcModalOpen(true);
  };

  const handleQcSubmit = async () => {
    if (!selectedReturn) return;
    setQcSubmitting(true);
    try {
      await adminApi.submitReturnQc(selectedReturn.id, {
        items: qcItems.map((item) => ({
          id: item.id,
          disposition: item.disposition,
          restocked_quantity: parseInt(item.restocked_quantity) || 0,
          damaged_quantity: parseInt(item.damaged_quantity) || 0,
          writeoff_quantity: parseInt(item.writeoff_quantity) || 0,
          refund_unit_price: parseFloat(item.refund_unit_price) || 0,
          condition: item.condition,
          qc_notes: item.qc_notes,
        })),
      });
      toast.success("QC Inspection submitted! Sellable stock & FIFO cost layers updated.");
      setQcModalOpen(false);
      fetchReturns();
      loadReturnDetail(selectedReturn.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit QC inspection");
    } finally {
      setQcSubmitting(false);
    }
  };

  const openRefundModal = (ret: OrderReturn) => {
    setSelectedReturn(ret);
    setRefundAmount(ret.refund_amount || 0);
    setRefundMethod(ret.refund_method !== "none" ? ret.refund_method : "cash");
    setRefundNotes("");
    setRefundModalOpen(true);
  };

  const handleRefundSubmit = async () => {
    if (!selectedReturn) return;
    setRefundSubmitting(true);
    try {
      await adminApi.processReturnRefund(selectedReturn.id, {
        refund_amount: parseFloat(refundAmount as any) || 0,
        refund_method: refundMethod,
        notes: refundNotes,
      });
      toast.success("Refund processed & double-entry journal posted!");
      setRefundModalOpen(false);
      fetchReturns();
      loadReturnDetail(selectedReturn.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to process refund");
    } finally {
      setRefundSubmitting(false);
    }
  };

  const handleCreateNewReturn = async () => {
    if (!newOrderId) {
      toast.error("Please enter a valid Order ID");
      return;
    }
    setNewReturnCreating(true);
    try {
      await adminApi.createReturn({
        order_id: parseInt(newOrderId),
        return_type: newReturnType,
        return_reason: newReturnReason,
      });
      toast.success("Return initiated successfully!");
      setNewReturnModalOpen(false);
      setNewOrderId("");
      setNewReturnReason("");
      fetchReturns();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to initiate return");
    } finally {
      setNewReturnCreating(false);
    }
  };

  const getReturnStatusGroup = (ret: OrderReturn) => {
    switch (ret.status) {
      case "initiated":
        return {
          title: "Initiated",
          desc: "Awaiting pickup / transit",
          badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          dotColor: "bg-amber-400",
        };
      case "in_transit":
        return {
          title: "In Transit",
          desc: "With courier partner",
          badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          dotColor: "bg-amber-400",
        };
      case "received":
        return {
          title: "Received",
          desc: "At warehouse facility",
          badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
          dotColor: "bg-purple-400",
        };
      case "qc_completed":
        return {
          title: "QC Completed",
          desc: "Inspection & restock done",
          badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/30",
          dotColor: "bg-sky-400",
        };
      case "resolved":
        return {
          title: "Resolved",
          desc: "Operations & accounting complete",
          badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          dotColor: "bg-emerald-400",
        };
      case "cancelled":
        return {
          title: "Cancelled",
          desc: "Return request cancelled",
          badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          dotColor: "bg-rose-400",
        };
      case "rejected":
        return {
          title: "Rejected",
          desc: "Return rejected",
          badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          dotColor: "bg-rose-400",
        };
      default:
        return {
          title: String((ret as any).status || "Unknown").replace(/_/g, " "),
          desc: "Current status",
          badgeColor: "bg-muted text-muted-foreground border-border",
          dotColor: "bg-muted-foreground",
        };
    }
  };

  const getQcStatusGroup = (ret: OrderReturn) => {
    if (ret.inspection_status === "pending") {
      if (ret.status === "in_transit" || ret.status === "initiated") {
        return {
          title: "Pending",
          desc: "Awaiting physical arrival",
          badgeColor: "bg-slate-500/10 text-slate-400 border-slate-500/30",
          dotColor: "bg-slate-400",
        };
      }
      return {
        title: "Pending",
        desc: "Awaiting inspection",
        badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        dotColor: "bg-amber-400",
      };
    }

    const items = ret.items || [];
    const hasDamaged = items.some((i) => i.disposition === "quarantine_damaged");
    const hasWriteoff = items.some((i) => i.disposition === "write_off_loss");
    const hasRestock = items.some((i) => i.disposition === "restock_sellable");

    if (hasDamaged && !hasRestock && !hasWriteoff) {
      return {
        title: "Completed — Damaged",
        desc: "Quarantined in warehouse",
        badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        dotColor: "bg-amber-400",
      };
    }
    if (hasWriteoff && !hasRestock && !hasDamaged) {
      return {
        title: "Completed — Written Off",
        desc: "Inventory loss written off",
        badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30",
        dotColor: "bg-rose-400",
      };
    }
    if (hasRestock && (hasDamaged || hasWriteoff)) {
      return {
        title: "Completed — Partial Restock",
        desc: "Split restock & damaged",
        badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/30",
        dotColor: "bg-sky-400",
      };
    }
    if (hasRestock) {
      return {
        title: "Completed — Restocked",
        desc: "Sellable stock restored",
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        dotColor: "bg-emerald-400",
      };
    }

    return {
      title: ret.inspection_status === "rejected" ? "Rejected" : "Completed",
      desc: "Inspection finalized",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      dotColor: "bg-emerald-400",
    };
  };

  const getFinancialStatusGroup = (ret: OrderReturn) => {
    const isZeroRefund = Number(ret.refund_amount) === 0;
    const isNotRequired = ret.refund_status === "not_required" || (isZeroRefund && (ret.status === "resolved" || ret.status === "qc_completed"));

    if (isNotRequired) {
      return {
        title: "Adjusted — No Refund Required",
        desc: "COD refusal / GL reversed",
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        dotColor: "bg-emerald-400",
      };
    }

    if (ret.refund_status === "processed" || ret.refund_status === "store_credit_issued") {
      const isStoreCredit = ret.refund_status === "store_credit_issued" || ret.refund_method === "store_credit";
      return {
        title: isStoreCredit ? "Refunded — Store Credit" : "Refunded",
        desc: `${formatPrice(ret.refund_amount)} via ${ret.refund_method || "cash"}`,
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        dotColor: "bg-emerald-400",
      };
    }

    if (ret.refund_status === "pending") {
      return {
        title: "Pending",
        desc: `${formatPrice(ret.refund_amount)} refund required`,
        badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        dotColor: "bg-amber-400",
      };
    }

    if (ret.status === "resolved") {
      return {
        title: "Adjusted",
        desc: "Accounting balanced",
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        dotColor: "bg-emerald-400",
      };
    }

    return {
      title: "Not Required",
      desc: "No customer payout pending",
      badgeColor: "bg-slate-500/10 text-slate-400 border-slate-500/30",
      dotColor: "bg-slate-400",
    };
  };

  const renderNextAction = (ret: OrderReturn) => {
    // 1. In transit -> Receive
    if (ret.status === "in_transit") {
      return (
        <div className="p-4 rounded-md border border-purple-500/30 bg-purple-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Next Action Required</span>
            </div>
            <h4 className="text-sm font-bold text-foreground">Mark Parcel Received at Warehouse</h4>
            <p className="text-xs text-muted-foreground">
              Confirm physical arrival of the returned parcel before starting QC inspection.
            </p>
          </div>
          <button
            onClick={() => handleMarkReceived(ret.id)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-xs font-semibold flex items-center gap-2 transition shrink-0 cursor-pointer shadow-sm"
          >
            <PackageCheck className="w-4 h-4" />
            Mark Received
          </button>
        </div>
      );
    }

    // 2. Received & QC pending -> Start QC
    if (ret.status === "received" && ret.inspection_status === "pending") {
      return (
        <div className="p-4 rounded-md border border-[#A78BFA]/30 bg-[#211B32] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A78BFA]">Next Action Required</span>
            </div>
            <h4 className="text-sm font-bold text-foreground">Start QC Inspection & Disposition</h4>
            <p className="text-xs text-muted-foreground">
              Grade returned items and assign restock, damage quarantine, or write-off dispositions.
            </p>
          </div>
          <button
            onClick={() => openQcModal(ret)}
            className="px-4 py-2 bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] rounded-md text-xs font-semibold flex items-center gap-2 transition shrink-0 cursor-pointer shadow-sm"
          >
            <ShieldAlert className="w-4 h-4" />
            Start QC
          </button>
        </div>
      );
    }

    // 3. QC Completed & Refund pending -> Process Refund
    if (ret.status === "qc_completed" && ret.refund_status === "pending") {
      return (
        <div className="p-4 rounded-md border border-emerald-500/30 bg-emerald-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Next Action Required</span>
            </div>
            <h4 className="text-sm font-bold text-foreground">Process Customer Refund ({formatPrice(ret.refund_amount)})</h4>
            <p className="text-xs text-muted-foreground">
              Inspection completed. Issue customer refund via MFS/cash or credit to customer wallet.
            </p>
          </div>
          <button
            onClick={() => openRefundModal(ret)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold flex items-center gap-2 transition shrink-0 cursor-pointer shadow-sm"
          >
            <DollarSign className="w-4 h-4" />
            Process Refund
          </button>
        </div>
      );
    }

    // 4. Resolved -> Resolved confirmation state
    if (ret.status === "resolved") {
      return (
        <div className="p-4 rounded-md border border-emerald-500/20 bg-emerald-500/[0.04] flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-foreground">Resolved</h4>
            <p className="text-xs text-muted-foreground">
              All physical inspection, stock reconciliation, and accounting adjustments are complete.
            </p>
          </div>
        </div>
      );
    }

    // 5. Cancelled or Rejected
    if (ret.status === "cancelled" || ret.status === "rejected") {
      return (
        <div className="p-4 rounded-md border border-border bg-muted/20 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-muted text-muted-foreground flex items-center justify-center shrink-0">
            <X className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-foreground">Return Closed ({ret.status})</h4>
            <p className="text-xs text-muted-foreground">
              No further operational actions are pending for this return.
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-[#A78BFA]" />
            Returns & RTO Operations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reconcile parcel returns, physical warehouse inspection, FIFO inventory restock, and customer refunds.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchReturns()}
            className="p-2 border border-border rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setNewReturnModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] rounded-md text-sm font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Return / RTO
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-md border border-border bg-card shadow-sm">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">All Returns</span>
          <div className="mt-1 text-2xl font-bold text-foreground">{stats.all_count}</div>
        </div>
        <div className="p-4 rounded-md border border-border bg-card shadow-sm">
          <span className="text-xs font-medium text-amber-500 uppercase tracking-wider flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" /> In-Transit RTO
          </span>
          <div className="mt-1 text-2xl font-bold text-amber-500">{stats.rto_count}</div>
        </div>
        <div className="p-4 rounded-md border border-border bg-card shadow-sm">
          <span className="text-xs font-medium text-purple-400 uppercase tracking-wider flex items-center gap-1">
            <PackageCheck className="w-3.5 h-3.5" /> Awaiting Inspection
          </span>
          <div className="mt-1 text-2xl font-bold text-purple-400">{stats.awaiting_inspection_count}</div>
        </div>
        <div className="p-4 rounded-md border border-border bg-card shadow-sm">
          <span className="text-xs font-medium text-emerald-500 uppercase tracking-wider flex items-center gap-1">
            <Coins className="w-3.5 h-3.5" /> Total Refunded
          </span>
          <div className="mt-1 text-2xl font-bold text-emerald-500">{formatPrice(stats.total_refunded_amount)}</div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { key: "all", label: "All Returns", count: stats.all_count },
            { key: "rto", label: "RTO Parcels", count: stats.rto_count },
            { key: "customer_return", label: "Customer Returns", count: stats.customer_returns_count },
            { key: "awaiting_inspection", label: "Awaiting Inspection", count: stats.awaiting_inspection_count },
            { key: "refunded", label: "Refunded", count: stats.refunded_count },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition flex items-center gap-2 ${
                  isActive
                    ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    isActive ? "bg-[#211B32] text-[#A78BFA]" : "bg-muted text-muted-foreground"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search return #, order #, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#A78BFA]/40 focus:border-[#A78BFA]/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <ScrollableTableCard>
        {loading ? (
          <div className="py-20 text-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#A78BFA] mb-2" />
            Loading records...
          </div>
        ) : returns.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <RotateCcw className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-base font-medium text-foreground">No return records found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? "Try refining your search keyword." : "Parcel returns and RTOs will appear here."}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <AdminCheckbox
                    checked={returns.length > 0 && selectedIds.length === returns.length}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < returns.length}
                    onChange={handleToggleSelectAll}
                    title="Select all returns"
                  />
                </th>
                <th className="px-4 py-3 font-semibold">Return / Tracking</th>
                <th className="px-4 py-3 font-semibold">Order / Customer</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Parcel Status</th>
                <th className="px-4 py-3 font-semibold">QC Disposition</th>
                <th className="px-4 py-3 font-semibold">Refund Status</th>
                <th className="px-4 py-3 font-semibold text-right">Refund Amount</th>
                <th className="px-4 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {returns.map((ret) => {
                const isRto = ret.return_type === "rto" || ret.return_type === "failed_delivery";
                const isSelected = selectedIds.includes(ret.id);
                return (
                  <tr
                    key={ret.id}
                    className={`transition ${isSelected ? "bg-[#211B32]" : "hover:bg-muted/30"}`}
                  >
                    <td className="w-12 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <AdminCheckbox
                        checked={isSelected}
                        onChange={() => handleToggleSelectRow(ret.id)}
                        title={`Select return ${ret.return_number}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openReturnDrawer(ret)}
                        className="font-mono font-medium text-[#A78BFA] hover:underline text-left block cursor-pointer"
                      >
                        {ret.return_number}
                      </button>
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        {formatDate(ret.created_at)}
                      </span>
                      {ret.courier_tracking_code && (
                        <span className="text-xs font-mono text-muted-foreground block">
                          TRK: {ret.courier_tracking_code}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders?search=${ret.order?.order_number || ""}`}
                        className="font-medium text-foreground hover:text-[#A78BFA] transition"
                      >
                        #{ret.order?.order_number || ret.order_id}
                      </Link>
                      <span className="text-xs text-muted-foreground block">
                        {ret.customer?.name || "Customer"} {ret.customer?.phone ? `(${ret.customer.phone})` : ""}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        isRto ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}>
                        {ret.return_type === "rto" ? "RTO" : ret.return_type.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${
                        ret.status === "resolved" ? "bg-emerald-500/10 text-emerald-400" :
                        ret.status === "received" ? "bg-purple-500/10 text-purple-400" :
                        ret.status === "in_transit" ? "bg-amber-500/10 text-amber-400" :
                        "bg-slate-500/10 text-slate-400"
                      }`}>
                        {ret.status.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        ret.inspection_status === "passed" ? "bg-emerald-500/10 text-emerald-400" :
                        ret.inspection_status === "partial_damage" ? "bg-amber-500/10 text-amber-400" :
                        ret.inspection_status === "rejected" ? "bg-rose-500/10 text-rose-400" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {ret.inspection_status.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        ret.refund_status === "processed" || ret.refund_status === "store_credit_issued"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : ret.refund_status === "pending"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {ret.refund_status === "store_credit_issued" ? "Credit Issued" : ret.refund_status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {formatPrice(ret.refund_amount || 0)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {ret.status === "in_transit" && (
                          <button
                            onClick={() => handleMarkReceived(ret.id)}
                            className="px-2 py-1 text-xs bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded transition font-medium"
                            title="Mark parcel received at warehouse"
                          >
                            Receive
                          </button>
                        )}
                        {ret.status === "received" && ret.inspection_status === "pending" && (
                          <button
                            onClick={() => openQcModal(ret)}
                            className="px-2 py-1 text-xs bg-[#211B32] text-[#A78BFA] hover:bg-[#A78BFA]/20 rounded transition font-medium"
                            title="Perform QC & disposition"
                          >
                            Inspect
                          </button>
                        )}
                        {ret.status === "qc_completed" && ret.refund_status !== "processed" && ret.refund_status !== "store_credit_issued" && (
                          <button
                            onClick={() => openRefundModal(ret)}
                            className="px-2 py-1 text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded transition font-medium"
                            title="Process customer refund"
                          >
                            Refund
                          </button>
                        )}
                        <button
                          onClick={() => openReturnDrawer(ret)}
                          className="p-1 hover:bg-accent text-muted-foreground hover:text-foreground rounded transition cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingReturn(ret)}
                          className="p-1 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 rounded transition cursor-pointer"
                          title="Delete Return Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </ScrollableTableCard>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1 border border-border rounded hover:bg-muted disabled:opacity-40 transition"
            >
              Previous
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1 border border-border rounded hover:bg-muted disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Return Details Side Drawer */}
      {selectedReturnId && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end transition"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeReturnDrawer();
            }
          }}
        >
          <div className="w-full max-w-2xl bg-card border-l border-border h-full overflow-y-auto flex flex-col shadow-2xl p-6 space-y-6">
            {/* Drawer Header (Requirement 4) */}
            <div className="flex items-start justify-between border-b border-border pb-4 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-base font-bold text-foreground flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-[#A78BFA]" />
                    {selectedReturn ? selectedReturn.return_number : String(selectedReturnId)}
                  </span>
                  {selectedReturn && (
                    <>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${getReturnStatusGroup(selectedReturn).badgeColor}`}>
                        {getReturnStatusGroup(selectedReturn).title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                        {selectedReturn.return_type === "rto" ? "RTO Parcel" :
                         selectedReturn.return_type === "failed_delivery" ? "Failed Delivery" :
                         selectedReturn.return_type === "customer_return" ? "Customer Return" :
                         selectedReturn.return_type.replace(/_/g, " ")}
                      </span>
                    </>
                  )}
                </div>
                {selectedReturn && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span>Order:</span>
                    <Link
                      href={`/admin/orders?search=${encodeURIComponent(selectedReturn.order?.order_number || String(selectedReturn.order_id))}`}
                      className="font-mono font-bold text-[#A78BFA] hover:text-[#B9A3FF] hover:underline inline-flex items-center gap-1"
                      target="_blank"
                      title="Open order in new tab"
                    >
                      #{selectedReturn.order?.order_number || selectedReturn.order_id}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                    {selectedReturn.customer?.name && (
                      <>
                        <span className="text-border">•</span>
                        <span>{selectedReturn.customer.name}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={closeReturnDrawer}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition cursor-pointer"
                title="Close drawer (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {drawerLoading ? (
              <div className="py-24 text-center text-muted-foreground">
                <Loader2 className="w-7 h-7 animate-spin mx-auto text-[#A78BFA] mb-3" />
                <p className="font-medium text-foreground">Loading return details...</p>
                <p className="text-xs text-muted-foreground mt-1">Retrieving return record and QC audit</p>
              </div>
            ) : returnNotFound ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-12 h-12 rounded-md bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Return Record Not Found</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    No return or RTO record matching <span className="font-mono text-[#A78BFA] font-semibold">{String(selectedReturnId)}</span> was found in the database.
                  </p>
                </div>
                <button
                  onClick={closeReturnDrawer}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-md text-xs font-semibold transition cursor-pointer"
                >
                  Close & View All Returns
                </button>
              </div>
            ) : selectedReturn ? (
              <div className="space-y-5 text-sm">
                {/* Three Compact Status Groups (Requirement 4) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-muted/40 rounded-md border border-border">
                  {/* RETURN */}
                  {(() => {
                    const retStatus = getReturnStatusGroup(selectedReturn);
                    return (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                          RETURN
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${retStatus.dotColor}`} />
                          <span className="font-bold text-foreground text-xs">{retStatus.title}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground block">{retStatus.desc}</span>
                      </div>
                    );
                  })()}

                  {/* QC */}
                  {(() => {
                    const qcStatus = getQcStatusGroup(selectedReturn);
                    return (
                      <div className="space-y-1 sm:border-l sm:border-border/60 sm:pl-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                          QC
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${qcStatus.dotColor}`} />
                          <span className="font-bold text-foreground text-xs">{qcStatus.title}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground block">{qcStatus.desc}</span>
                      </div>
                    );
                  })()}

                  {/* FINANCIAL */}
                  {(() => {
                    const finStatus = getFinancialStatusGroup(selectedReturn);
                    return (
                      <div className="space-y-1 sm:border-l sm:border-border/60 sm:pl-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                          FINANCIAL
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${finStatus.dotColor}`} />
                          <span className="font-bold text-foreground text-xs">{finStatus.title}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground block">{finStatus.desc}</span>
                      </div>
                    );
                  })()}
                </div>

                {/* Next Recommended Action (Requirement 5) */}
                {renderNextAction(selectedReturn)}

                {/* Commercial Order Snapshot */}
                <div className="border border-border rounded-md p-4 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Commercial Order Snapshot
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Order Number</span>
                      <span className="font-mono font-medium text-foreground">
                        #{selectedReturn.order?.order_number || selectedReturn.order_id}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Customer</span>
                      <span className="font-medium text-foreground">
                        {selectedReturn.customer?.name || selectedReturn.order?.customer_name || "N/A"}
                        {selectedReturn.customer?.phone ? ` (${selectedReturn.customer.phone})` : ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Order Total</span>
                      <span className="font-mono font-medium text-foreground">
                        {formatPrice(selectedReturn.order_total_snapshot)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Courier Collected (COD)</span>
                      <span className="font-mono font-medium text-foreground">
                        {formatPrice(selectedReturn.amount_collected_courier)}
                      </span>
                    </div>
                    {selectedReturn.courier_tracking_code && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground block">Courier Return Tracking</span>
                        <span className="font-mono text-[#A78BFA] font-semibold">
                          {selectedReturn.courier_tracking_code}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items & QC Status */}
                <div className="border border-border rounded-md p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Return Items ({selectedReturn.items?.length || 0})
                    </h3>
                    {selectedReturn.status === "received" && selectedReturn.inspection_status === "pending" && (
                      <button
                        onClick={() => openQcModal(selectedReturn)}
                        className="px-2.5 py-1 text-xs bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] rounded font-bold transition cursor-pointer"
                      >
                        Start QC
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-border">
                    {selectedReturn.items?.map((item) => (
                      <div key={item.id} className="py-2.5 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-foreground text-xs">
                            {item.product?.name || item.order_item?.product_name || `Product #${item.product_id}`}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                            Qty Returned: {item.quantity_returned} | Unit: {formatPrice(item.unit_price)}
                          </p>
                          {item.qc_notes && (
                            <p className="text-[11px] text-muted-foreground italic mt-0.5">QC Remarks: {item.qc_notes}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                            item.disposition === "restock_sellable" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            item.disposition === "quarantine_damaged" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                            item.disposition === "write_off_loss" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                            "bg-muted text-muted-foreground border border-border"
                          }`}>
                            {item.disposition.replace(/_/g, " ")}
                          </span>
                          {item.disposition === "restock_sellable" && (
                            <span className="block text-[10px] text-emerald-400/90 font-mono mt-0.5">
                              Restocked: {item.restocked_quantity}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit Timestamps & Return Reason */}
                <div className="border border-border rounded-md p-4 bg-muted/20 space-y-2 text-xs">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Audit Trail & Timestamps
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div>
                      <span className="block text-[10px] text-muted-foreground/80 uppercase">Initiated</span>
                      <span className="font-mono text-foreground">{formatDate(selectedReturn.created_at)}</span>
                    </div>
                    {selectedReturn.received_at && (
                      <div>
                        <span className="block text-[10px] text-muted-foreground/80 uppercase">Received at FC</span>
                        <span className="font-mono text-foreground">{formatDate(selectedReturn.received_at)}</span>
                      </div>
                    )}
                    {selectedReturn.inspected_at && (
                      <div>
                        <span className="block text-[10px] text-muted-foreground/80 uppercase">QC Inspected</span>
                        <span className="font-mono text-foreground">{formatDate(selectedReturn.inspected_at)}</span>
                      </div>
                    )}
                    {selectedReturn.resolved_at && (
                      <div>
                        <span className="block text-[10px] text-muted-foreground/80 uppercase">Resolved</span>
                        <span className="font-mono text-foreground">{formatDate(selectedReturn.resolved_at)}</span>
                      </div>
                    )}
                  </div>

                  {selectedReturn.return_reason && (
                    <div className="pt-2 border-t border-border mt-2">
                      <span className="font-semibold text-foreground block mb-0.5">Reason:</span>
                      <p className="text-muted-foreground">{selectedReturn.return_reason}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* QC Inspection Modal */}
      {qcModalOpen && selectedReturn && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-[#A78BFA]" />
                QC Inspection & Stock Restock ({selectedReturn.return_number})
              </h2>
              <button onClick={() => setQcModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              QC Disposition determines sellable inventory. Only items marked <strong className="text-emerald-400">Restock Sellable</strong> will increment stock with an updated FIFO valuation layer.
            </p>

            <div className="space-y-4">
              {qcItems.map((item, idx) => (
                <div key={item.id} className="p-3 border border-border rounded-md bg-muted/20 space-y-2 text-sm">
                  <div className="font-medium text-foreground">{item.product_name} (Qty: {item.quantity_returned})</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Disposition</label>
                      <select
                        value={item.disposition}
                        onChange={(e) => {
                          const updated = [...qcItems];
                          updated[idx].disposition = e.target.value;
                          setQcItems(updated);
                        }}
                        className="w-full text-xs p-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-[#A78BFA]/40 focus:border-[#A78BFA]/50"
                      >
                        <option value="restock_sellable">Restock Sellable (+Stock & FIFO Layer)</option>
                        <option value="quarantine_damaged">Quarantine Damaged (Loss Write-Off)</option>
                        <option value="write_off_loss">Write Off Loss (Disposal)</option>
                        <option value="return_to_customer">Return to Customer (Rejected)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Condition</label>
                      <select
                        value={item.condition}
                        onChange={(e) => {
                          const updated = [...qcItems];
                          updated[idx].condition = e.target.value;
                          setQcItems(updated);
                        }}
                        className="w-full text-xs p-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-[#A78BFA]/40 focus:border-[#A78BFA]/50"
                      >
                        <option value="unopened">Unopened / Brand New</option>
                        <option value="opened_intact">Opened Packaging (Intact)</option>
                        <option value="damaged_packaging">Damaged Outer Packaging</option>
                        <option value="damaged_product">Damaged Product</option>
                        <option value="defective">Defective / Faulty</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">QC Notes</label>
                    <input
                      type="text"
                      placeholder="Inspection remarks..."
                      value={item.qc_notes}
                      onChange={(e) => {
                        const updated = [...qcItems];
                        updated[idx].qc_notes = e.target.value;
                        setQcItems(updated);
                      }}
                      className="w-full text-xs p-1.5 bg-background border border-border rounded text-foreground focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setQcModalOpen(false)}
                className="px-4 py-2 border border-border rounded-md text-sm hover:bg-muted text-muted-foreground transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={qcSubmitting}
                onClick={handleQcSubmit}
                className="px-4 py-2 bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] rounded-md text-sm font-bold transition disabled:opacity-50 flex items-center gap-2"
              >
                {qcSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Save QC & Update Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Processing Modal */}
      {refundModalOpen && selectedReturn && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-500" />
                Process Customer Refund
              </h2>
              <button onClick={() => setRefundModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Executing this refund posts a double-entry journal (Contra-revenue Account 4095) and updates customer store credit or payment status.
            </p>

            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Refund Amount (৳)</label>
                <input
                  type="number"
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 bg-background border border-border rounded-md text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Payout Method</label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  className="w-full p-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="store_credit">Store Credit (Instant Wallet Credit)</option>
                  <option value="cash">Cash on Hand</option>
                  <option value="bkash">bKash (MFS)</option>
                  <option value="nagad">Nagad (MFS)</option>
                  <option value="rocket">Rocket (MFS)</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Notes / Transaction Reference</label>
                <input
                  type="text"
                  placeholder="e.g. MFS TrxID or Store credit memo"
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  className="w-full p-2 bg-background border border-border rounded-md text-foreground focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setRefundModalOpen(false)}
                className="px-4 py-2 border border-border rounded-md text-sm hover:bg-muted text-muted-foreground transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={refundSubmitting}
                onClick={handleRefundSubmit}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-sm font-medium transition disabled:opacity-50 flex items-center gap-2"
              >
                {refundSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Return / RTO Modal */}
      {newReturnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#A78BFA]" />
                Initiate New Return / RTO
              </h2>
              <button onClick={() => setNewReturnModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Target Order ID</label>
                <input
                  type="number"
                  placeholder="e.g. 109"
                  value={newOrderId}
                  onChange={(e) => setNewOrderId(e.target.value)}
                  className="w-full p-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-[#A78BFA]/40 focus:border-[#A78BFA]/50"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Return Classification</label>
                <select
                  value={newReturnType}
                  onChange={(e) => setNewReturnType(e.target.value)}
                  className="w-full p-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-[#A78BFA]/40 focus:border-[#A78BFA]/50"
                >
                  <option value="rto">RTO (Customer Refusal / Unreachable)</option>
                  <option value="customer_return">Customer Return (After Delivery)</option>
                  <option value="failed_delivery">Failed Delivery Attempt</option>
                  <option value="partial_rejection">Partial Rejection (COD item refuse)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Reason / Note</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Customer cancelled upon delivery call"
                  value={newReturnReason}
                  onChange={(e) => setNewReturnReason(e.target.value)}
                  className="w-full p-2 bg-background border border-border rounded-md text-foreground focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setNewReturnModalOpen(false)}
                className="px-4 py-2 border border-border rounded-md text-sm hover:bg-muted text-muted-foreground transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={newReturnCreating}
                onClick={handleCreateNewReturn}
                className="px-4 py-2 bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] rounded-md text-sm font-bold transition disabled:opacity-50 flex items-center gap-2"
              >
                {newReturnCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                Initiate Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={returns.length}
        onClearSelection={() => setSelectedIds([])}
        onConfirmDelete={handleBulkDelete}
        isDeleting={isBulkDeleting}
        itemName="return"
      />

      {/* Single Return Delete Modal */}
      {deletingReturn && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                Delete Return #{deletingReturn.return_number}
              </h2>
              <button
                type="button"
                onClick={() => setDeletingReturn(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete return record <strong className="text-foreground font-semibold">{deletingReturn.return_number}</strong>? This action will remove all associated line items and cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setDeletingReturn(null)}
                className="px-4 py-2 border border-border rounded-md text-sm hover:bg-muted text-muted-foreground transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingSingle}
                onClick={handleSingleDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-md text-sm font-medium transition disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {isDeletingSingle && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
