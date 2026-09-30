"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Check,
  X,
  Loader2,
  Globe,
  SlidersHorizontal,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Truck,
  Scale,
  Info,
  Calendar,
  Bold,
  Italic,
  Heading2,
  Heading3,
  Link2,
  Code,
  List,
  Quote,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CmsPage } from "@/types";
import { pagesService } from "@/services/pagesService";
import {
  AdminPageHeader,
  AdminStatStrip,
  AdminStatusBadge,
  AdminEmptyState,
} from "@/components/admin/ui";
import { SettingsNavTabs } from "@/components/admin/settings/SettingsNavTabs";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

function getPageCategoryBadge(slug: string) {
  const s = slug.toLowerCase();
  if (s.includes("terms") || s.includes("condition")) {
    return { label: "Legal", variant: "purple", icon: Scale };
  }
  if (s.includes("privacy") || s.includes("gdpr") || s.includes("data")) {
    return { label: "Privacy", variant: "emerald", icon: ShieldCheck };
  }
  if (s.includes("ship") || s.includes("delivery") || s.includes("refund") || s.includes("return")) {
    return { label: "Policy", variant: "cyan", icon: Truck };
  }
  if (s.includes("faq") || s.includes("help") || s.includes("guide")) {
    return { label: "Support", variant: "amber", icon: HelpCircle };
  }
  if (s.includes("about") || s.includes("story") || s.includes("company")) {
    return { label: "Company", variant: "blue", icon: Info };
  }
  return { label: "Custom", variant: "slate", icon: FileText };
}

function AdminContentPagesContent() {
  const searchParams = useSearchParams();
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Sheet / Drawer Form State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<CmsPage | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewContentMode, setPreviewContentMode] = useState(false);
  const [showSeoSection, setShowSeoSection] = useState(false);

  // Delete State
  const [deletingPage, setDeletingPage] = useState<CmsPage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pagesService.getPages({
        search: search.trim() || undefined,
        is_active: statusFilter === "all" ? undefined : statusFilter === "active",
      });
      setPages(data || []);
    } catch {
      toast.error("Failed to load CMS pages.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  // Deep linking for ?create=true or ?edit=ID
  useEffect(() => {
    const editId = searchParams.get("edit");
    const createParam = searchParams.get("create");

    if (editId) {
      const idNum = Number(editId);
      if (!isNaN(idNum) && idNum > 0) {
        pagesService
          .getPage(idNum)
          .then((page) => {
            handleOpenEdit(page);
          })
          .catch(() => {
            toast.error("Could not find CMS page to edit.");
          });
      }
    } else if (createParam === "true") {
      handleOpenCreate();
    }
  }, [searchParams]);

  const handleOpenCreate = () => {
    setEditingPage(null);
    setTitle("");
    setSlug("");
    setContent("");
    setMetaTitle("");
    setMetaDescription("");
    setIsActive(true);
    setPreviewContentMode(false);
    setShowSeoSection(false);
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (page: CmsPage) => {
    setEditingPage(page);
    setTitle(page.title);
    setSlug(page.slug);
    setContent(page.content);
    setMetaTitle(page.meta_title || "");
    setMetaDescription(page.meta_description || "");
    setIsActive(page.is_active);
    setPreviewContentMode(false);
    setShowSeoSection(Boolean(page.meta_title || page.meta_description));
    setIsSheetOpen(true);
  };

  const insertMarkdownFormatting = (prefix: string, suffix = "") => {
    const textarea = document.getElementById("cms-content-textarea") as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    const selected = current.substring(start, end);

    const replacement = `${prefix}${selected || "text"}${suffix}`;
    const nextVal = current.substring(0, start) + replacement + current.substring(end);
    setContent(nextVal);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected ? selected.length : 4)
      );
    }, 50);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Page title is required.");
      return;
    }
    if (!content.trim()) {
      toast.error("Page content is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        content,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
        is_active: isActive,
      };

      if (editingPage) {
        await pagesService.updatePage(editingPage.id, payload);
        toast.success(`Page "${title}" updated successfully.`);
      } else {
        await pagesService.createPage(payload);
        toast.success(`Page "${title}" published.`);
      }
      setIsSheetOpen(false);
      fetchPages();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to save CMS page.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (page: CmsPage) => {
    try {
      const res = await pagesService.togglePageStatus(page.id);
      setPages((prev) =>
        prev.map((p) => (p.id === page.id ? { ...p, is_active: res.page.is_active } : p))
      );
      toast.success(res.message);
    } catch {
      toast.error("Failed to toggle page status.");
    }
  };

  const handleDelete = async () => {
    if (!deletingPage) return;
    setDeleting(true);
    try {
      await pagesService.deletePage(deletingPage.id);
      toast.success(`Page "${deletingPage.title}" removed.`);
      setDeletingPage(null);
      fetchPages();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to delete page.";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const activeCount = useMemo(() => pages.filter((p) => p.is_active).length, [pages]);
  const draftCount = pages.length - activeCount;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Context Navigation across Content & Settings */}
      <SettingsNavTabs />

      {/* Header */}
      <AdminPageHeader
        title="Storefront Pages & Legal Policies"
        description="Publish static informational pages, legal terms, warranty policies, and help center documentation."
        badge="Content CMS"
        badgeVariant="cyan"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Content / CMS", href: "/admin/content/theme" },
          { label: "Pages" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-black bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Page</span>
            </button>
          </div>
        }
      />

      {/* Primary Metrics Strip */}
      <AdminStatStrip
        columns={3}
        stats={[
          {
            label: "Total Static Pages",
            value: pages.length,
            icon: FileText,
            variant: "cyan",
            helper: "Published & drafts in registry",
          },
          {
            label: "Active & Published",
            value: activeCount,
            icon: Check,
            variant: "emerald",
            helper: "Accessible on storefront /pages/*",
          },
          {
            label: "Drafts / Hidden",
            value: draftCount,
            icon: AlertTriangle,
            variant: draftCount > 0 ? "amber" : "default",
            helper: "Unpublished or in internal review",
          },
        ]}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0f121b] border border-white/[0.08]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search page titles or URLs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#161a26] border border-white/[0.08] rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-400/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-[#161a26] border border-white/[0.08] px-2.5 py-1.5 rounded-lg text-xs text-slate-300">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-hidden cursor-pointer"
            >
              <option value="all" className="bg-[#161a26] text-white">
                All Statuses
              </option>
              <option value="active" className="bg-[#161a26] text-white">
                Active Only
              </option>
              <option value="draft" className="bg-[#161a26] text-white">
                Draft Only
              </option>
            </select>
          </div>

          <button
            onClick={fetchPages}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white bg-[#161a26] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Pages Table Card */}
      <div className="rounded-xl bg-[#0f121b] border border-white/[0.08] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
            <span className="text-xs uppercase tracking-wider font-semibold">
              Loading CMS pages...
            </span>
          </div>
        ) : pages.length === 0 ? (
          <div className="p-8">
            <AdminEmptyState
              title="No Pages Found"
              description={
                search || statusFilter !== "all"
                  ? "No static CMS pages matched your search criteria."
                  : "Create your first static storefront page or policy document."
              }
              action={
                <button
                  onClick={handleOpenCreate}
                  className="px-4 py-2 text-xs font-semibold text-black bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
                >
                  + Create Page
                </button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#161a26] text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-white/[0.08]">
                <tr>
                  <th className="py-3 px-4">Page Title</th>
                  <th className="py-3 px-4">Topic</th>
                  <th className="py-3 px-4">Public URL</th>
                  <th className="py-3 px-4">SEO Metadata</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {pages.map((page) => {
                  const badge = getPageCategoryBadge(page.slug);
                  const BadgeIcon = badge.icon;

                  return (
                    <tr key={page.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Title */}
                      <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <button
                            onClick={() => handleOpenEdit(page)}
                            className="font-bold text-white hover:text-amber-400 transition-colors text-left cursor-pointer"
                          >
                            {page.title}
                          </button>
                        </div>
                      </td>

                      {/* Topic Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded border ${
                            badge.variant === "purple"
                              ? "bg-purple-500/10 text-purple-300 border-purple-500/20"
                              : badge.variant === "emerald"
                              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                              : badge.variant === "cyan"
                              ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
                              : badge.variant === "amber"
                              ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                              : badge.variant === "blue"
                              ? "bg-blue-500/10 text-blue-300 border-blue-500/20"
                              : "bg-white/[0.04] text-slate-400 border-white/[0.06]"
                          }`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Public URL Path */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        <a
                          href={`/pages/${page.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-amber-400 inline-flex items-center gap-1 transition-colors"
                          title="Open storefront page in new tab"
                        >
                          <span>/pages/{page.slug}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-cyan-400" />
                        </a>
                      </td>

                      {/* SEO Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {page.meta_title || page.meta_description ? (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Custom SEO Configured
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-600">Standard Fallback</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(page)}
                          className="cursor-pointer"
                          title="Click to toggle status (Active / Draft)"
                        >
                          <AdminStatusBadge
                            status={page.is_active ? "active" : "inactive"}
                            label={page.is_active ? "PUBLISHED" : "DRAFT"}
                            size="sm"
                          />
                        </button>
                      </td>

                      {/* Updated Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-500">
                        {page.updated_at
                          ? new Date(page.updated_at).toLocaleDateString()
                          : "—"}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={`/pages/${page.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer"
                            title="View Public Page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleOpenEdit(page)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer"
                            title="Edit Page"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingPage(page)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete Page"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit CMS Page Slide-over Drawer */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:w-[640px] md:w-[720px] sm:!max-w-[720px] max-w-full bg-[#0b0e17] border-l border-white/[0.08] p-0 flex flex-col justify-between shadow-2xl text-slate-100 overflow-hidden"
        >
          <form onSubmit={handleSave} className="flex flex-col h-full overflow-hidden">
            {/* Header: h-14 */}
            <div className="h-14 px-6 border-b border-white/[0.06] bg-[#0f121b] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 pr-3">
                <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <SheetTitle className="text-xs font-bold text-white tracking-wide truncate">
                    {editingPage ? "Edit CMS Page" : "Create New CMS Page"}
                  </SheetTitle>
                  <p className="text-[10.5px] text-slate-400 truncate">
                    {editingPage ? `/pages/${editingPage.slug}` : "Draft or publish storefront documentation"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSheetOpen(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs">
              {/* Title & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Page Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2-Year Hardware Warranty & Care"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-9 rounded-lg border border-white/10 bg-[#161a26] px-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-hidden transition"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">URL Slug</label>
                    <span className="text-[10px] text-slate-500">Auto-slugs if empty</span>
                  </div>
                  <input
                    type="text"
                    placeholder="hardware-warranty-care"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full h-9 rounded-lg border border-white/10 bg-[#161a26] px-3 text-xs font-mono text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-hidden transition"
                  />
                </div>
              </div>

              {/* Status Toggle Checkbox */}
              <div className="flex items-center gap-2 py-1 px-3 bg-[#161a26] border border-white/[0.08] rounded-lg">
                <AdminCheckbox
                  id="page_active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <label
                  htmlFor="page_active"
                  className="text-xs text-slate-200 cursor-pointer select-none font-medium"
                >
                  Published & publicly visible on storefront{" "}
                  <span className="text-slate-400 font-normal">
                    (uncheck to keep as internal draft)
                  </span>
                </label>
              </div>

              {/* Content Body Editor with Toolbar & Live Preview Toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Page Content (Markdown / HTML) <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPreviewContentMode(false)}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        !previewContentMode
                          ? "bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewContentMode(true)}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        previewContentMode
                          ? "bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {!previewContentMode ? (
                  <div className="space-y-1">
                    {/* Formatting Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 bg-[#161a26] border border-white/[0.08] px-2 py-1 rounded-t-lg text-slate-300">
                      <button
                        type="button"
                        onClick={() => insertMarkdownFormatting("**", "**")}
                        className="p-1 hover:bg-white/[0.08] rounded transition-colors text-slate-300 hover:text-white cursor-pointer"
                        title="Bold"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdownFormatting("*", "*")}
                        className="p-1 hover:bg-white/[0.08] rounded transition-colors text-slate-300 hover:text-white cursor-pointer"
                        title="Italic"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-px h-4 bg-white/10 mx-1" />
                      <button
                        type="button"
                        onClick={() => insertMarkdownFormatting("## ")}
                        className="p-1 hover:bg-white/[0.08] rounded transition-colors text-slate-300 hover:text-white cursor-pointer"
                        title="Heading 2"
                      >
                        <Heading2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdownFormatting("### ")}
                        className="p-1 hover:bg-white/[0.08] rounded transition-colors text-slate-300 hover:text-white cursor-pointer"
                        title="Heading 3"
                      >
                        <Heading3 className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-px h-4 bg-white/10 mx-1" />
                      <button
                        type="button"
                        onClick={() => insertMarkdownFormatting("- ")}
                        className="p-1 hover:bg-white/[0.08] rounded transition-colors text-slate-300 hover:text-white cursor-pointer"
                        title="Bullet List"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdownFormatting("> ")}
                        className="p-1 hover:bg-white/[0.08] rounded transition-colors text-slate-300 hover:text-white cursor-pointer"
                        title="Quote"
                      >
                        <Quote className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdownFormatting("`", "`")}
                        className="p-1 hover:bg-white/[0.08] rounded transition-colors text-slate-300 hover:text-white cursor-pointer"
                        title="Inline Code"
                      >
                        <Code className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdownFormatting("[", "](url)")}
                        className="p-1 hover:bg-white/[0.08] rounded transition-colors text-slate-300 hover:text-white cursor-pointer"
                        title="Hyperlink"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      id="cms-content-textarea"
                      rows={12}
                      placeholder="## Policy Section&#10;&#10;Detailed customer terms, shipping guarantees, or guide information..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full font-mono rounded-b-lg border border-white/10 bg-[#161a26] p-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-hidden transition resize-y leading-relaxed"
                      required
                    />
                  </div>
                ) : (
                  <div className="w-full min-h-[260px] max-h-[340px] overflow-y-auto p-4 bg-[#161a26] border border-white/[0.08] rounded-lg text-slate-200 text-xs leading-relaxed space-y-3 prose prose-invert">
                    {content ? (
                      <div className="whitespace-pre-wrap">{content}</div>
                    ) : (
                      <span className="text-slate-500 italic">No content written yet.</span>
                    )}
                  </div>
                )}
              </div>

              {/* Collapsible SEO Section */}
              <div className="border border-white/[0.08] rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowSeoSection(!showSeoSection)}
                  className="w-full flex items-center justify-between p-3 bg-[#161a26] text-xs font-bold text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-amber-400" />
                    <span>Search Engine Optimization (SEO & Meta)</span>
                  </div>
                  {showSeoSection ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {showSeoSection && (
                  <div className="p-3.5 space-y-3 bg-[#0f121b] border-t border-white/[0.08]">
                    <p className="text-[11px] text-slate-400">
                      Leave blank to automatically use the page title and introductory text as fallbacks.
                    </p>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Meta Title
                      </label>
                      <input
                        type="text"
                        value={metaTitle}
                        onChange={(e) => setMetaTitle(e.target.value)}
                        placeholder="Custom search engine title tag..."
                        className="w-full px-3 py-2 text-xs bg-[#161a26] border border-white/[0.08] rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-400/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Meta Description
                      </label>
                      <textarea
                        rows={2}
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        placeholder="Custom search engine snippet summary..."
                        className="w-full px-3 py-2 text-xs bg-[#161a26] border border-white/[0.08] rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-400/50"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer: h-14 */}
            <div className="h-14 px-6 border-t border-white/[0.06] bg-[#0f121b] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsSheetOpen(false)}
                className="text-xs font-medium text-slate-400 hover:text-white transition px-2 py-1 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-9 px-5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingPage ? "Update Page" : "Publish Page"}</span>
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Modal */}
      {deletingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#0f121b] border border-white/[0.12] rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-white">Delete CMS Page</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to permanently delete{" "}
                <span className="text-white font-semibold">{deletingPage.title}</span>? Storefront
                links pointing to <span className="font-mono text-[11px]">/pages/{deletingPage.slug}</span> will
                return 404 Not Found.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingPage(null)}
                className="px-3.5 py-1.5 text-xs text-slate-300 hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors cursor-pointer shadow-sm"
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

export default function AdminContentPagesPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          <p className="text-xs">Loading CMS pages console...</p>
        </div>
      }
    >
      <AdminContentPagesContent />
    </React.Suspense>
  );
}
