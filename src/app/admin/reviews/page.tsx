"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Star, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Sparkles, 
  MessageSquare, 
  Eye, 
  X, 
  Package, 
  User as UserIcon, 
  Calendar, 
  Check, 
  RotateCcw,
  Plus,
  Edit,
  SlidersHorizontal,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { Review, ReviewSummary, Product } from "@/types";
import { AdminPageHeader, AdminStatStrip, AdminStatusBadge, AdminEmptyState, AdminPagination } from "@/components/admin/ui";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";
import { TableSkeletonRows } from "@/components/admin/ui/TableSkeletonRows";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useThemeStore } from "@/store/useThemeStore";
import { toast } from "sonner";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Storefront Reviews Visibility
  const { theme, setTheme: updateClientTheme } = useThemeStore();
  const [reviewsEnabled, setReviewsEnabled] = useState<boolean>(true);
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending">("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkActing, setBulkActing] = useState(false);

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [formProductId, setFormProductId] = useState<string>("");
  const [formUserName, setFormUserName] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState("");
  const [formComment, setFormComment] = useState("");
  const [formVerified, setFormVerified] = useState(true);
  const [formApproved, setFormApproved] = useState(true);
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deletingReview, setDeletingReview] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSummary = async () => {
    try {
      const data = await adminApi.getReviewSummary();
      setSummary(data);
      if (typeof data?.reviews_enabled === "boolean") {
        setReviewsEnabled(data.reviews_enabled);
        updateClientTheme({ reviews_enabled: data.reviews_enabled });
      }
    } catch (err) {
      // Non-blocking
    }
  };

  const fetchProductsList = async () => {
    try {
      const data = await adminApi.getProducts();
      setProducts(Array.isArray(data) ? data : (data as any)?.data || []);
    } catch (err) {
      // Non-blocking
    }
  };

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getReviews({
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        rating: ratingFilter !== "all" ? Number(ratingFilter) : undefined,
        page: currentPage,
        per_page: 20,
      });
      setReviews(res.data || []);
      setTotalPages(res.last_page || 1);
      setTotalItems(res.total || 0);
    } catch (err) {
      toast.error("Failed to load customer reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchProductsList();
  }, []);

  useEffect(() => {
    loadReviews();
  }, [currentPage, statusFilter, ratingFilter, search]);

  const handleOpenCreate = () => {
    setEditingReview(null);
    setFormProductId(products[0]?.id ? String(products[0].id) : "");
    setFormUserName("");
    setFormRating(5);
    setFormTitle("");
    setFormComment("");
    setFormVerified(true);
    setFormApproved(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rev: any) => {
    setEditingReview(rev);
    setFormProductId(String(rev.product_id));
    setFormUserName(rev.user_name);
    setFormRating(rev.rating);
    setFormTitle(rev.title || "");
    setFormComment(rev.comment || "");
    setFormVerified(Boolean(rev.is_verified_purchase));
    setFormApproved(Boolean(rev.is_approved));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUserName.trim()) {
      toast.error("Customer name is required.");
      return;
    }
    if (!formComment.trim()) {
      toast.error("Review comment is required.");
      return;
    }

    setSaving(true);
    try {
      if (editingReview) {
        await adminApi.updateReview(editingReview.id, {
          user_name: formUserName.trim(),
          rating: formRating,
          title: formTitle.trim() || undefined,
          comment: formComment.trim(),
          is_verified_purchase: formVerified,
          is_approved: formApproved,
        });
        toast.success("Review updated successfully.");
      } else {
        if (!formProductId) {
          toast.error("Please select a target product.");
          setSaving(false);
          return;
        }
        await adminApi.createReview({
          product_id: Number(formProductId),
          user_name: formUserName.trim(),
          rating: formRating,
          title: formTitle.trim() || undefined,
          comment: formComment.trim(),
          is_verified_purchase: formVerified,
          is_approved: formApproved,
        });
        toast.success("Verified customer review created.");
      }
      setIsModalOpen(false);
      loadReviews();
      fetchSummary();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to save review.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleApproval = async (id: number) => {
    try {
      const res = await adminApi.toggleReviewApproval(id);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, is_approved: res.review.is_approved } : r
        )
      );
      toast.success(res.message);
      fetchSummary();
    } catch (err) {
      toast.error("Failed to moderate review.");
    }
  };

  const handleDeleteReview = async () => {
    if (!deletingReview) return;
    setDeleting(true);
    try {
      await adminApi.deleteReview(deletingReview.id);
      toast.success("Review removed.");
      setDeletingReview(null);
      loadReviews();
      fetchSummary();
    } catch (err) {
      toast.error("Failed to delete review.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(reviews.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setBulkActing(true);
    try {
      await adminApi.bulkApproveReviews(selectedIds);
      toast.success(`Approved ${selectedIds.length} review(s).`);
      setSelectedIds([]);
      loadReviews();
      fetchSummary();
    } catch (err) {
      toast.error("Bulk approve failed.");
    } finally {
      setBulkActing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    setBulkActing(true);
    try {
      await adminApi.bulkRejectReviews(selectedIds);
      toast.success(`Marked ${selectedIds.length} review(s) as pending.`);
      setSelectedIds([]);
      loadReviews();
      fetchSummary();
    } catch (err) {
      toast.error("Bulk reject failed.");
    } finally {
      setBulkActing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkActing(true);
    try {
      await adminApi.bulkDeleteReviews(selectedIds);
      toast.success(`Deleted ${selectedIds.length} review(s).`);
      setSelectedIds([]);
      loadReviews();
      fetchSummary();
    } catch (err) {
      toast.error("Bulk delete failed.");
    } finally {
      setBulkActing(false);
    }
  };

  const handleToggleReviewsVisibility = async (newVal: boolean) => {
    setTogglingVisibility(true);
    setReviewsEnabled(newVal);
    updateClientTheme({ reviews_enabled: newVal });
    try {
      const res = await adminApi.toggleReviewsVisibility(newVal);
      toast.success(res.message || (newVal ? "Storefront reviews & ratings enabled." : "Storefront reviews & ratings disabled."));
    } catch (err) {
      setReviewsEnabled(!newVal);
      updateClientTheme({ reviews_enabled: !newVal });
      toast.error("Failed to update storefront reviews visibility.");
    } finally {
      setTogglingVisibility(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <AdminPageHeader
        title="Customer Reviews & Testimonials"
        description="Moderate customer product reviews, create verified testimonials, and configure storefront rating scores."
        badge="Quality & Trust"
        badgeVariant="cyan"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Operations" },
          { label: "Reviews" },
        ]}
        action={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#090B10] bg-[#A78BFA] hover:bg-[#B9A3FF] rounded-md transition-colors cursor-pointer font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Add Review</span>
          </button>
        }
      />

      {/* Storefront Visibility Toggle Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-md border border-white/[0.08] bg-[#0c101d] shadow-sm">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className={`w-10 h-10 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
            reviewsEnabled 
              ? "bg-[#211B32] border-[#A78BFA]/30 text-[#A78BFA] shadow-[0_0_12px_rgba(167,139,250,0.15)]" 
              : "bg-slate-800/40 border-white/10 text-slate-500"
          }`}>
            <Star className={`w-5 h-5 ${reviewsEnabled ? "fill-amber-400 text-amber-400" : "text-slate-500"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Storefront Reviews & Ratings Visibility
              </h3>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                reviewsEnabled 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                  : "bg-rose-500/10 border-rose-500/30 text-rose-400"
              }`}>
                {reviewsEnabled ? "Active on Storefront" : "Turned Off (Hidden)"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {reviewsEnabled 
                ? "Customer reviews, star rating scores, and review submission forms are visible across all product pages." 
                : "Customer reviews, rating scores, and review submission forms are completely hidden and disabled on the storefront."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center shrink-0 bg-white/[0.03] px-3.5 py-2 rounded-md border border-white/[0.06]">
          <span className="text-xs font-semibold text-slate-300 select-none">
            {reviewsEnabled ? "Reviews Active" : "Reviews Disabled"}
          </span>
          <Switch
            checked={reviewsEnabled}
            disabled={togglingVisibility}
            onCheckedChange={handleToggleReviewsVisibility}
          />
        </div>
      </div>

      {/* Stats Strip */}
      <AdminStatStrip
        columns={4}
        stats={[
          {
            label: "Total Reviews",
            value: summary?.total_reviews ?? totalItems,
            icon: MessageSquare,
            variant: "cyan",
            helper: "Across entire hardware catalog",
          },
          {
            label: "Pending Moderation",
            value: summary?.pending_reviews ?? 0,
            icon: AlertTriangle,
            variant: (summary?.pending_reviews ?? 0) > 0 ? "amber" : "default",
            helper: "Awaiting administrator approval",
          },
          {
            label: "Approved Reviews",
            value: summary?.approved_reviews ?? 0,
            icon: CheckCircle2,
            variant: "emerald",
            helper: "Live on storefront product pages",
          },
          {
            label: "Average Rating",
            value: `${summary?.average_rating ?? 5.0} / 5.0`,
            icon: Star,
            variant: "amber",
            helper: "Average calculated rating",
          },
        ]}
      />

      {/* Bulk Action Bar if items selected */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-amber-400/10 border border-amber-400/25 rounded-md text-xs text-amber-300 animate-in fade-in duration-150">
          <span className="font-semibold">
            {selectedIds.length} review{selectedIds.length > 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkApprove}
              disabled={bulkActing}
              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-md font-semibold transition-colors cursor-pointer"
            >
              Approve Selected
            </button>
            <button
              onClick={handleBulkReject}
              disabled={bulkActing}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-md font-semibold transition-colors cursor-pointer"
            >
              Hide / Pending
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkActing}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-md font-semibold transition-colors cursor-pointer"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3.5 rounded-md bg-[#0f121b] border border-white/[0.08]">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search author, title, or comments..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#161a26] border border-white/[0.08] rounded-md text-white placeholder:text-slate-500 focus:outline-hidden focus:border-[#A78BFA]/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-[#161a26] p-1 rounded-md border border-white/[0.08]">
            <button
              onClick={() => {
                setStatusFilter("all");
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                statusFilter === "all" ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setStatusFilter(statusFilter === "approved" ? "all" : "approved");
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                statusFilter === "approved" ? "bg-emerald-500/20 text-emerald-300 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => {
                setStatusFilter(statusFilter === "pending" ? "all" : "pending");
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                statusFilter === "pending" ? "bg-amber-500/20 text-amber-300 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Pending
            </button>
          </div>

          {/* Rating Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#161a26] border border-white/[0.08] px-2.5 py-1.5 rounded-md text-xs text-slate-300">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs text-white focus:outline-hidden cursor-pointer"
            >
              <option value="all" className="bg-[#161a26] text-white">All Ratings</option>
              <option value="5" className="bg-[#161a26] text-white">5 Stars (★★★★★)</option>
              <option value="4" className="bg-[#161a26] text-white">4 Stars (★★★★☆)</option>
              <option value="3" className="bg-[#161a26] text-white">3 Stars (★★★☆☆)</option>
              <option value="2" className="bg-[#161a26] text-white">2 Stars (★★☆☆☆)</option>
              <option value="1" className="bg-[#161a26] text-white">1 Star (★☆☆☆☆)</option>
            </select>
          </div>

          <button
            onClick={() => {
              loadReviews();
              fetchSummary();
            }}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white bg-[#161a26] hover:bg-white/[0.08] border border-white/[0.08] rounded-md transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#A78BFA]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Reviews Table Card */}
      <div className="rounded-md bg-[#0f121b] border border-white/[0.08] overflow-hidden">
        {!loading && reviews.length === 0 ? (
          <div className="p-8">
            <AdminEmptyState
              title="No Reviews Found"
              description="No customer reviews matched your search or moderation filters."
              action={
                <button
                  onClick={handleOpenCreate}
                  className="px-4 py-2 text-xs font-semibold text-[#090B10] bg-[#A78BFA] hover:bg-[#B9A3FF] rounded-md transition-colors cursor-pointer font-bold"
                >
                  + Add Verified Review
                </button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#161a26] text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-white/[0.08]">
                <tr>
                  <th className="py-3 px-4 w-8">
                    <AdminCheckbox
                      checked={reviews.length > 0 && selectedIds.length === reviews.length}
                      indeterminate={selectedIds.length > 0 && selectedIds.length < reviews.length}
                      onChange={handleSelectAll}
                      title="Select all reviews"
                    />
                  </th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Review Body</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {loading ? (
                  <TableSkeletonRows rows={8} colSpan={7} hasCheckbox={true} />
                ) : reviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-white/[0.015] transition-colors">
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <AdminCheckbox
                        checked={selectedIds.includes(rev.id)}
                        onChange={() => handleToggleSelect(rev.id)}
                        title="Select review"
                      />
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {rev.product ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-md bg-white/[0.04] border border-white/10 flex items-center justify-center text-cyan-400 shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-white block truncate max-w-[180px]">
                              {rev.product.name}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">
                              SKU: {rev.product.sku || "N/A"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">Product #{rev.product_id}</span>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white">{rev.user_name}</span>
                          {rev.is_verified_purchase && (
                            <span title="Verified Purchase">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            </span>
                          )}
                        </div>
                        {rev.created_at && (
                          <span className="text-[10px] text-slate-500 block">
                            {new Date(rev.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Rating Stars */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-600"
                            }`}
                          />
                        ))}
                        <span className="font-mono text-[11px] text-slate-400 ml-1">
                          {rev.rating}.0
                        </span>
                      </div>
                    </td>

                    {/* Review Body */}
                    <td className="py-3.5 px-4 max-w-sm">
                      {rev.title && (
                        <span className="font-bold text-white block truncate text-[11.5px]">
                          "{rev.title}"
                        </span>
                      )}
                      <p className="text-slate-400 text-xs line-clamp-2 mt-0.5">
                        {rev.comment}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleApproval(rev.id)}
                        className="cursor-pointer"
                        title="Toggle approval"
                      >
                        <AdminStatusBadge
                          status={rev.is_approved ? "approved" : "pending"}
                          label={rev.is_approved ? "Approved" : "Pending"}
                          size="sm"
                        />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(rev)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-md transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingReview(rev)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="p-3.5 border-t border-white/[0.08]">
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              itemsPerPage={20}
            />
          </div>
        )}
      </div>

      {/* Create / Edit Review Slide-over Drawer */}
      <Sheet open={isModalOpen} onOpenChange={(open) => { if (!open) setIsModalOpen(false); }}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:w-[480px] md:w-[520px] sm:!max-w-[520px] max-w-full bg-[#0b0e17] border-l border-white/[0.08] p-0 flex flex-col justify-between shadow-2xl text-slate-100 overflow-hidden"
        >
          <form onSubmit={handleSave} className="flex flex-col h-full overflow-hidden">
            {/* Compact Header: h-12 */}
            <div className="h-12 px-6 border-b border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0 pr-3">
                <SheetTitle className="text-xs font-semibold text-white tracking-wide shrink-0">
                  {editingReview ? "Edit Review" : "Add Verified Review"}
                </SheetTitle>
                <span className="text-slate-600 text-xs shrink-0">·</span>
                <span className="text-xs text-slate-400 truncate">
                  {editingReview ? `ID #${editingReview.id}` : "Customer Feedback Moderation"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs">
              {!editingReview && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">
                    Product Target <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formProductId}
                    onChange={(e) => setFormProductId(e.target.value)}
                    className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white focus:border-white/20 focus:outline-none transition cursor-pointer"
                    required
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#131722] text-white">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">
                  Customer / Reviewer Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. David Hasselbeck"
                  value={formUserName}
                  onChange={(e) => setFormUserName(e.target.value)}
                  className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none transition"
                  required
                />
              </div>

              {/* Star Rating Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">
                  Rating Score ({formRating} / 5 Stars)
                </label>
                <div className="flex items-center gap-1.5 p-2 rounded-md bg-white/[0.02] border border-white/5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormRating(star)}
                      className="p-1 text-slate-500 hover:scale-110 transition cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= formRating
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-600"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-medium text-slate-400 ml-2">
                    {formRating === 5 ? "Exceptional" : formRating === 4 ? "Very Good" : formRating === 3 ? "Average" : formRating === 2 ? "Poor" : "Terrible"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Review Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Exceeded every expectation!"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">
                  Comment Body <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Customer experience narrative and feedback..."
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-[#131722] p-3 text-xs text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none transition resize-none"
                  required
                />
              </div>

              <div className="p-3.5 rounded-md bg-white/[0.02] border border-white/5 space-y-2.5">
                <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">
                  Verification & Moderation
                </span>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-white transition">
                    <AdminCheckbox
                      checked={formVerified}
                      onChange={(e) => setFormVerified(e.target.checked)}
                    />
                    <span>Mark as Verified Purchaser</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-white transition">
                    <AdminCheckbox
                      checked={formApproved}
                      onChange={(e) => setFormApproved(e.target.checked)}
                    />
                    <span>Immediately Approved (Display live on storefront)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Compact Footer: h-12 */}
            <div className="h-12 px-6 border-t border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-8 px-4 rounded-md bg-white hover:bg-slate-200 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingReview ? "Update Review" : "Save Review"}</span>
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Modal */}
      {deletingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#0f121b] border border-white/[0.12] rounded-lg p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-white">Delete Review</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to delete this review by{" "}
                <span className="text-white font-semibold">{deletingReview.user_name}</span>? Product average rating will be recalculated.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingReview(null)}
                className="px-3.5 py-1.5 text-xs text-slate-300 hover:bg-white/[0.08] rounded-md transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReview}
                disabled={deleting}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-md transition-colors cursor-pointer"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
