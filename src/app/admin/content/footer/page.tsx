"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Check,
  X,
  Loader2,
  AlertTriangle,
  RefreshCw,
  FolderTree,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Eye,
  Globe,
  Share2,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  CheckCircle2,
  ChevronRight,
  Monitor,
  Smartphone,
  MessageCircle,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { FooterColumn, FooterLink, SocialLink } from "@/types";
import { footerService } from "@/services/footerService";
import { AdminPageHeader, AdminStatStrip, AdminStatusBadge, AdminEmptyState } from "@/components/admin/ui";
import { SettingsNavTabs } from "@/components/admin/settings/SettingsNavTabs";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useThemeStore } from "@/store/useThemeStore";
import { BrandLogoImage } from "@/components/shared/BrandLogoImage";
import { SocialPlatformIcon } from "@/components/shared/SocialPlatformIcon";

const PRESET_PLATFORMS = [
  { name: "WhatsApp", icon: "whatsapp", placeholder: "8801XXXXXXXXX" },
  { name: "Instagram", icon: "instagram", placeholder: "https://instagram.com/yourhandle" },
  { name: "Facebook", icon: "facebook", placeholder: "https://facebook.com/yourpage" },
  { name: "X (Twitter)", icon: "twitter", placeholder: "https://x.com/yourhandle" },
  { name: "YouTube", icon: "youtube", placeholder: "https://youtube.com/c/yourchannel" },
  { name: "Discord", icon: "discord", placeholder: "https://discord.gg/yourserver" },
  { name: "TikTok", icon: "tiktok", placeholder: "https://tiktok.com/@yourhandle" },
  { name: "LinkedIn", icon: "linkedin", placeholder: "https://linkedin.com/company/yourbrand" },
  { name: "GitHub", icon: "github", placeholder: "https://github.com/yourbrand" },
];

const COMMON_LINK_PRESETS = [
  { label: "Products Catalog", url: "/products" },
  { label: "About Us", url: "/about" },
  { label: "Contact Us", url: "/contact" },
  { label: "Order Tracking", url: "/track" },
  { label: "FAQ / Help", url: "/faq" },
  { label: "Shipping Policy", url: "/shipping-policy" },
  { label: "Refund Policy", url: "/refund-policy" },
  { label: "Privacy Policy", url: "/privacy" },
  { label: "Terms of Service", url: "/terms" },
];

function buildWhatsAppUrl(number: string, message: string): string {
  const clean = number.replace(/[^0-9]/g, "");
  if (!clean) return "";
  const trimmed = message.trim();
  return trimmed ? `https://wa.me/${clean}?text=${encodeURIComponent(trimmed)}` : `https://wa.me/${clean}`;
}

function parseWhatsAppUrl(urlStr: string): { number: string; message: string } {
  try {
    const parsed = new URL(urlStr.startsWith("http") ? urlStr : `https://${urlStr}`);
    const num = parsed.pathname.replace(/^\/+/, "").replace(/[^0-9]/g, "");
    const msg = parsed.searchParams.get("text") || "";
    return { number: num, message: msg };
  } catch {
    const match = urlStr.match(/wa\.me\/([0-9]+)(\?text=(.*))?/);
    if (match) {
      return {
        number: match[1] || "",
        message: match[3] ? decodeURIComponent(match[3]) : "",
      };
    }
    return { number: "", message: "" };
  }
}

function AdminContentFooterPageContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "social" ? "social" : "columns";

  const [activeTab, setActiveTab] = useState<"columns" | "social" | "preview">(initialTab);
  const [columns, setColumns] = useState<FooterColumn[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const { theme } = useThemeStore();

  // Column Modal State
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<FooterColumn | null>(null);
  const [columnTitle, setColumnTitle] = useState("");
  const [columnSortOrder, setColumnSortOrder] = useState("0");
  const [columnIsActive, setColumnIsActive] = useState(true);
  const [savingColumn, setSavingColumn] = useState(false);
  const [deletingColumn, setDeletingColumn] = useState<FooterColumn | null>(null);

  // Link Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<FooterLink | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkIsExternal, setLinkIsExternal] = useState(false);
  const [linkOpenInNewTab, setLinkOpenInNewTab] = useState(false);
  const [linkSortOrder, setLinkSortOrder] = useState("0");
  const [linkIsActive, setLinkIsActive] = useState(true);
  const [savingLink, setSavingLink] = useState(false);
  const [deletingLink, setDeletingLink] = useState<FooterLink | null>(null);

  // Social Modal State
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [editingSocialLink, setEditingSocialLink] = useState<SocialLink | null>(null);
  const [socialPlatform, setSocialPlatform] = useState("WhatsApp");
  const [socialUrl, setSocialUrl] = useState("");
  const [socialWhatsappNumber, setSocialWhatsappNumber] = useState("");
  const [socialWhatsappMessage, setSocialWhatsappMessage] = useState("");
  const [socialIcon, setSocialIcon] = useState("whatsapp");
  const [socialSortOrder, setSocialSortOrder] = useState("0");
  const [socialIsActive, setSocialIsActive] = useState(true);
  const [savingSocial, setSavingSocial] = useState(false);
  const [deletingSocialLink, setDeletingSocialLink] = useState<SocialLink | null>(null);

  const [deleting, setDeleting] = useState(false);

  // Fetch all footer data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [colData, socData] = await Promise.all([
        footerService.getFooterColumns(),
        footerService.getSocialLinks().catch(() => []),
      ]);
      setColumns(colData || []);
      setSocialLinks(socData || []);
    } catch {
      toast.error("Failed to load footer navigation data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Total link count across all columns
  const totalLinks = useMemo(() => {
    return columns.reduce((acc, col) => acc + (col.links?.length || 0), 0);
  }, [columns]);

  // Active link count
  const activeLinksCount = useMemo(() => {
    return columns.reduce((acc, col) => {
      if (!col.is_active) return acc;
      return acc + (col.links?.filter((l) => l.is_active).length || 0);
    }, 0);
  }, [columns]);

  // Statistics
  const stats = useMemo(() => {
    return [
      {
        label: "Footer Columns",
        value: columns.length,
        helper: `${columns.filter((c) => c.is_active).length} visible on storefront`,
        variant: "default" as const,
      },
      {
        label: "Navigation Links",
        value: totalLinks,
        helper: `${activeLinksCount} published links`,
        variant: "cyan" as const,
      },
      {
        label: "Active Social Channels",
        value: socialLinks.filter((s) => s.is_active).length,
        helper: `${socialLinks.length} configured profiles`,
        variant: "purple" as const,
      },
      {
        label: "Storefront Status",
        value: columns.some((c) => c.is_active) ? "Live & Synced" : "Empty",
        helper: "Single canonical CMS source",
        variant: columns.some((c) => c.is_active) ? ("emerald" as const) : ("rose" as const),
      },
    ];
  }, [columns, totalLinks, activeLinksCount, socialLinks]);

  // ==========================================
  // COLUMN ACTIONS
  // ==========================================

  const handleOpenCreateColumn = () => {
    setEditingColumn(null);
    setColumnTitle("");
    const maxSort = columns.length > 0 ? Math.max(...columns.map((c) => c.sort_order)) : 0;
    setColumnSortOrder(String(maxSort + 1));
    setColumnIsActive(true);
    setIsColumnModalOpen(true);
  };

  const handleOpenEditColumn = (col: FooterColumn) => {
    setEditingColumn(col);
    setColumnTitle(col.title);
    setColumnSortOrder(String(col.sort_order));
    setColumnIsActive(col.is_active);
    setIsColumnModalOpen(true);
  };

  const handleSaveColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!columnTitle.trim()) {
      toast.error("Column title is required.");
      return;
    }

    setSavingColumn(true);
    try {
      const payload = {
        title: columnTitle.trim(),
        sort_order: Number(columnSortOrder) || 0,
        is_active: columnIsActive,
      };

      if (editingColumn) {
        await footerService.updateFooterColumn(editingColumn.id, payload);
        toast.success(`Column "${columnTitle}" updated.`);
      } else {
        await footerService.createFooterColumn(payload);
        toast.success(`Column "${columnTitle}" created.`);
      }
      setIsColumnModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save footer column.");
    } finally {
      setSavingColumn(false);
    }
  };

  const handleDeleteColumn = async () => {
    if (!deletingColumn) return;
    setDeleting(true);
    try {
      await footerService.deleteFooterColumn(deletingColumn.id);
      toast.success(`Column "${deletingColumn.title}" deleted.`);
      setDeletingColumn(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete column.");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleColumnActive = async (col: FooterColumn) => {
    try {
      await footerService.updateFooterColumn(col.id, {
        title: col.title,
        sort_order: col.sort_order,
        is_active: !col.is_active,
      });
      setColumns((prev) =>
        prev.map((c) => (c.id === col.id ? { ...c, is_active: !col.is_active } : c))
      );
      toast.success(`Column "${col.title}" ${col.is_active ? "hidden" : "activated"}.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to toggle column status.");
    }
  };

  const handleMoveColumn = async (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= columns.length) return;

    const newCols = [...columns];
    const temp = newCols[index];
    newCols[index] = newCols[targetIndex];
    newCols[targetIndex] = temp;

    setColumns(newCols);

    try {
      await footerService.reorderFooterColumns(newCols.map((c) => c.id));
      toast.success("Column order updated.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save column reorder.");
      fetchData();
    }
  };

  // ==========================================
  // LINK ACTIONS
  // ==========================================

  const handleOpenCreateLink = (columnId?: number) => {
    setEditingLink(null);
    setSelectedColumnId(columnId || (columns[0] ? columns[0].id : null));
    setLinkTitle("");
    setLinkUrl("");
    setLinkIsExternal(false);
    setLinkOpenInNewTab(false);

    const col = columns.find((c) => c.id === (columnId || columns[0]?.id));
    const maxSort = col && col.links && col.links.length > 0 ? Math.max(...col.links.map((l) => l.sort_order)) : 0;
    setLinkSortOrder(String(maxSort + 1));
    setLinkIsActive(true);
    setIsLinkModalOpen(true);
  };

  const handleOpenEditLink = (link: FooterLink) => {
    setEditingLink(link);
    setSelectedColumnId(link.footer_column_id || (columns[0] ? columns[0].id : null));
    setLinkTitle(link.title);
    setLinkUrl(link.url);
    setLinkIsExternal(Boolean(link.is_external));
    setLinkOpenInNewTab(Boolean(link.open_in_new_tab));
    setLinkSortOrder(String(link.sort_order));
    setLinkIsActive(link.is_active);
    setIsLinkModalOpen(true);
  };

  const handleUrlChange = (value: string) => {
    setLinkUrl(value);
    const trimmed = value.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      setLinkIsExternal(true);
      setLinkOpenInNewTab(true);
    } else if (trimmed.startsWith("/")) {
      setLinkIsExternal(false);
      setLinkOpenInNewTab(false);
    }
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTitle.trim() || !linkUrl.trim()) {
      toast.error("Title and URL are required.");
      return;
    }

    const trimmedUrl = linkUrl.trim().toLowerCase();
    if (trimmedUrl.startsWith("javascript:") || trimmedUrl.startsWith("data:") || trimmedUrl.startsWith("vbscript:")) {
      toast.error("Unsafe URL protocol prohibited.");
      return;
    }

    setSavingLink(true);
    try {
      const payload = {
        footer_column_id: selectedColumnId,
        title: linkTitle.trim(),
        url: linkUrl.trim(),
        is_external: linkIsExternal,
        open_in_new_tab: linkOpenInNewTab,
        sort_order: Number(linkSortOrder) || 0,
        is_active: linkIsActive,
      };

      if (editingLink) {
        await footerService.updateFooterLink(editingLink.id, payload);
        toast.success(`Link "${linkTitle}" updated.`);
      } else {
        await footerService.createFooterLink(payload);
        toast.success(`Link "${linkTitle}" created.`);
      }
      setIsLinkModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save link.");
    } finally {
      setSavingLink(false);
    }
  };

  const handleDeleteLink = async () => {
    if (!deletingLink) return;
    setDeleting(true);
    try {
      await footerService.deleteFooterLink(deletingLink.id);
      toast.success(`Link "${deletingLink.title}" deleted.`);
      setDeletingLink(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete link.");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleLinkActive = async (link: FooterLink) => {
    try {
      await footerService.updateFooterLink(link.id, {
        footer_column_id: link.footer_column_id,
        title: link.title,
        url: link.url,
        is_external: link.is_external,
        open_in_new_tab: link.open_in_new_tab,
        sort_order: link.sort_order,
        is_active: !link.is_active,
      });
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          links: col.links?.map((l) => (l.id === link.id ? { ...l, is_active: !link.is_active } : l)),
        }))
      );
      toast.success(`Link "${link.title}" ${link.is_active ? "disabled" : "enabled"}.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update link status.");
    }
  };

  const handleMoveLink = async (columnId: number, linkIndex: number, direction: "up" | "down") => {
    const targetCol = columns.find((c) => c.id === columnId);
    if (!targetCol || !targetCol.links) return;

    const targetIndex = direction === "up" ? linkIndex - 1 : linkIndex + 1;
    if (targetIndex < 0 || targetIndex >= targetCol.links.length) return;

    const newLinks = [...targetCol.links];
    const temp = newLinks[linkIndex];
    newLinks[linkIndex] = newLinks[targetIndex];
    newLinks[targetIndex] = temp;

    setColumns((prev) =>
      prev.map((c) => (c.id === columnId ? { ...c, links: newLinks } : c))
    );

    try {
      await footerService.reorderFooterLinks(newLinks.map((l) => l.id), columnId);
      toast.success("Link order updated.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save link order.");
      fetchData();
    }
  };

  // ==========================================
  // SOCIAL ACTIONS
  // ==========================================

  const isSocialWhatsApp = socialPlatform.trim().toLowerCase() === "whatsapp";
  const hasExistingWhatsApp = socialLinks.some(
    (l) => l.platform.toLowerCase() === "whatsapp" && (!editingSocialLink || editingSocialLink.id !== l.id)
  );

  const handleOpenCreateSocial = () => {
    setEditingSocialLink(null);
    const defaultPreset = hasExistingWhatsApp ? PRESET_PLATFORMS[1] : PRESET_PLATFORMS[0];
    setSocialPlatform(defaultPreset.name);
    setSocialUrl(defaultPreset.name === "WhatsApp" ? "" : defaultPreset.placeholder);
    setSocialIcon(defaultPreset.icon);
    setSocialWhatsappNumber("");
    setSocialWhatsappMessage("");
    setSocialSortOrder(String(socialLinks.length + 1));
    setSocialIsActive(true);
    setIsSocialModalOpen(true);
  };

  const handleOpenEditSocial = (link: SocialLink) => {
    setEditingSocialLink(link);
    setSocialPlatform(link.platform);
    setSocialUrl(link.url);
    setSocialIcon(link.icon || "globe");
    setSocialSortOrder(String(link.sort_order));
    setSocialIsActive(link.is_active);

    if (link.platform.toLowerCase() === "whatsapp" || link.url.includes("wa.me")) {
      const parsed = parseWhatsAppUrl(link.url);
      setSocialWhatsappNumber(parsed.number);
      setSocialWhatsappMessage(parsed.message);
    } else {
      setSocialWhatsappNumber("");
      setSocialWhatsappMessage("");
    }

    setIsSocialModalOpen(true);
  };

  const handlePresetSelect = (p: typeof PRESET_PLATFORMS[0]) => {
    setSocialPlatform(p.name);
    setSocialIcon(p.icon);
    if (p.name === "WhatsApp") {
      setSocialUrl(buildWhatsAppUrl(socialWhatsappNumber, socialWhatsappMessage));
    } else {
      if (!socialUrl || socialUrl.includes("wa.me")) {
        setSocialUrl(p.placeholder);
      }
    }
  };

  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSocialWhatsApp) {
      if (hasExistingWhatsApp && !editingSocialLink) {
        toast.error("WhatsApp channel is already configured.");
        return;
      }

      const cleanNumber = socialWhatsappNumber.replace(/[^0-9]/g, "");
      if (!cleanNumber || cleanNumber.length < 7 || cleanNumber.length > 15) {
        toast.error("Please enter a valid phone number (7–15 digits with country code).");
        return;
      }

      const finalUrl = buildWhatsAppUrl(cleanNumber, socialWhatsappMessage);
      setSavingSocial(true);
      try {
        const payload = {
          platform: "WhatsApp",
          url: finalUrl,
          icon: "whatsapp",
          whatsapp_number: cleanNumber,
          whatsapp_message: socialWhatsappMessage,
          sort_order: Number(socialSortOrder) || 0,
          is_active: socialIsActive,
        };

        if (editingSocialLink) {
          await footerService.updateSocialLink(editingSocialLink.id, payload);
          toast.success("WhatsApp channel updated.");
        } else {
          await footerService.createSocialLink(payload);
          toast.success("WhatsApp channel added.");
        }
        setIsSocialModalOpen(false);
        fetchData();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to save WhatsApp channel.");
      } finally {
        setSavingSocial(false);
      }
      return;
    }

    if (!socialPlatform.trim() || !socialUrl.trim()) {
      toast.error("Platform name and URL are required.");
      return;
    }

    setSavingSocial(true);
    try {
      const payload = {
        platform: socialPlatform.trim(),
        url: socialUrl.trim(),
        icon: socialIcon || socialPlatform.toLowerCase().replace(/[^a-z0-9]/g, ""),
        sort_order: Number(socialSortOrder) || 0,
        is_active: socialIsActive,
      };

      if (editingSocialLink) {
        await footerService.updateSocialLink(editingSocialLink.id, payload);
        toast.success(`Channel "${socialPlatform}" updated.`);
      } else {
        await footerService.createSocialLink(payload);
        toast.success(`Channel "${socialPlatform}" added.`);
      }
      setIsSocialModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save social channel.");
    } finally {
      setSavingSocial(false);
    }
  };

  const handleDeleteSocial = async () => {
    if (!deletingSocialLink) return;
    setDeleting(true);
    try {
      await footerService.deleteSocialLink(deletingSocialLink.id);
      toast.success(`Channel "${deletingSocialLink.platform}" removed.`);
      setDeletingSocialLink(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete channel.");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleSocialActive = async (link: SocialLink) => {
    try {
      await footerService.updateSocialLink(link.id, {
        platform: link.platform,
        url: link.url,
        icon: link.icon || undefined,
        sort_order: link.sort_order,
        is_active: !link.is_active,
      });
      setSocialLinks((prev) =>
        prev.map((s) => (s.id === link.id ? { ...s, is_active: !link.is_active } : s))
      );
      toast.success(`Channel "${link.platform}" ${link.is_active ? "disabled" : "enabled"}.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update channel status.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <SettingsNavTabs />

      {/* Header */}
      <AdminPageHeader
        title="Storefront Footer & Social"
        badge="CMS Layout Engine"
        badgeVariant="cyan"
        description="Single canonical interface for managing the public storefront footer. Configure navigation columns, links, social channels, and preview the live layout with real-time storefront synchronization."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Content / CMS", href: "/admin/content/footer" },
          { label: "Footer & Social" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={handleOpenCreateSocial}
              className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-purple-400" />
              Add Social Link
            </button>
            <button
              onClick={handleOpenCreateColumn}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-md transition-all shadow-sm shadow-cyan-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Column
            </button>
          </div>
        }
      />

      {/* Stats Strip */}
      <AdminStatStrip stats={stats} columns={4} />

      {/* Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("columns")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "columns"
                ? "bg-white/10 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Footer Columns & Links
          </button>
          <button
            onClick={() => setActiveTab("social")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "social"
                ? "bg-white/10 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-purple-400" />
            Social Profiles ({socialLinks.length})
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "preview"
                ? "bg-white/10 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            Live Storefront Preview
          </button>
        </div>

        {activeTab === "preview" && (
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-0.5 rounded-md text-xs">
            <button
              onClick={() => setPreviewDevice("desktop")}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
                previewDevice === "desktop" ? "bg-white/10 text-white font-medium" : "text-slate-400 hover:text-white"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Desktop (Multi-Column)
            </button>
            <button
              onClick={() => setPreviewDevice("mobile")}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
                previewDevice === "mobile" ? "bg-white/10 text-white font-medium" : "text-slate-400 hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Mobile (Accordion)
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: Columns & Links View */}
      {activeTab === "columns" && (
        <div className="space-y-6">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
              <p className="text-xs">Loading footer layout...</p>
            </div>
          ) : columns.length === 0 ? (
            <AdminEmptyState
              icon={Layers}
              title="No Footer Columns Found"
              description="Start organizing your storefront footer by creating your first column (e.g. 'Customer Care', 'Quick Links', 'About Us')."
              action={
                <button
                  type="button"
                  onClick={handleOpenCreateColumn}
                  className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-md transition-colors cursor-pointer"
                >
                  Create First Column
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-start">
              {columns.map((col, colIdx) => (
                <div
                  key={col.id}
                  className={`rounded-md border transition-all duration-200 overflow-hidden flex flex-col bg-[#0F141E]/90 ${
                    col.is_active
                      ? "border-white/[0.09] shadow-sm hover:border-white/20"
                      : "border-white/[0.04] opacity-70"
                  }`}
                >
                  {/* Column Header */}
                  <div className="p-4 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between gap-2">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                          Col {colIdx + 1}
                        </span>
                        <h3 className="font-bold text-sm text-white truncate" title={col.title}>
                          {col.title}
                        </h3>
                      </div>
                      <span className="text-[10.5px] text-slate-500 font-mono block">
                        {(col.links || []).length} link{(col.links || []).length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Column Ordering & Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveColumn(colIdx, "left")}
                        disabled={colIdx === 0}
                        title="Move column left"
                        className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveColumn(colIdx, "right")}
                        disabled={colIdx === columns.length - 1}
                        title="Move column right"
                        className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleColumnActive(col)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                          col.is_active
                            ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                            : "text-slate-400 bg-white/5 border border-white/10"
                        }`}
                      >
                        {col.is_active ? "Active" : "Hidden"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditColumn(col)}
                        className="p-1 rounded text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                        title="Edit Column"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingColumn(col)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete Column"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Links List inside Column */}
                  <div className="p-3 space-y-2 flex-1 min-h-[140px]">
                    {!col.links || col.links.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-1">
                        <span>No links in this column yet</span>
                      </div>
                    ) : (
                      col.links.map((link, linkIdx) => (
                        <div
                          key={link.id}
                          className={`p-2.5 rounded-md border transition-all duration-150 flex items-center justify-between gap-2.5 ${
                            link.is_active
                              ? "bg-black/30 border-white/[0.06] hover:border-white/15"
                              : "bg-black/10 border-white/[0.03] opacity-60"
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-xs text-white truncate" title={link.title}>
                                {link.title}
                              </span>
                              {link.is_external && (
                                <span className="text-[9px] px-1 rounded bg-white/5 text-slate-400 border border-white/10 flex items-center gap-0.5">
                                  <ExternalLink className="w-2.5 h-2.5" /> ext
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[10.5px] text-cyan-400/80 truncate block" title={link.url}>
                              {link.url}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Move Up/Down within column */}
                            <button
                              type="button"
                              onClick={() => handleMoveLink(col.id, linkIdx, "up")}
                              disabled={linkIdx === 0}
                              className="p-1 text-slate-500 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveLink(col.id, linkIdx, "down")}
                              disabled={linkIdx === col.links!.length - 1}
                              className="p-1 text-slate-500 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleLinkActive(link)}
                              className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                                link.is_active ? "bg-emerald-400 shadow-xs shadow-emerald-400" : "bg-slate-600"
                              }`}
                              title={link.is_active ? "Active" : "Disabled"}
                            />
                            <button
                              type="button"
                              onClick={() => handleOpenEditLink(link)}
                              className="p-1 text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingLink(link)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Link to this Column */}
                  <div className="p-3 pt-0">
                    <button
                      type="button"
                      onClick={() => handleOpenCreateLink(col.id)}
                      className="w-full py-1.5 px-3 text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-cyan-400" />
                      Add Link
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Social Channels View */}
      {activeTab === "social" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white">Connected Social Media & Channels</h3>
              <p className="text-xs text-slate-400">
                Channels appear in the brand column of your footer and customer touchpoints.
              </p>
            </div>
            <button
              onClick={handleOpenCreateSocial}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-md transition-all shadow-sm shadow-purple-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Social Profile
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              <p className="text-xs">Loading social links...</p>
            </div>
          ) : socialLinks.length === 0 ? (
            <AdminEmptyState
              icon={Share2}
              title="No Social Profiles Configured"
              description="Connect channels like WhatsApp, Instagram, Facebook, or YouTube to link your social presence directly in the footer."
              action={
                <button
                  type="button"
                  onClick={handleOpenCreateSocial}
                  className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-md transition-colors cursor-pointer"
                >
                  Add First Social Profile
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {socialLinks.map((link) => (
                <div
                  key={link.id}
                  className={`p-4 rounded-md border transition-all duration-200 flex items-center justify-between gap-3 bg-[#0F141E]/90 ${
                    link.is_active
                      ? "border-white/[0.09] shadow-sm hover:border-white/20"
                      : "border-white/[0.04] opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                      <SocialPlatformIcon platform={link.platform} icon={link.icon} className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white truncate">{link.platform}</span>
                        {link.platform.toLowerCase() === "whatsapp" && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Chat Link
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-slate-400 truncate block" title={link.url}>
                        {link.url}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleSocialActive(link)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                        link.is_active
                          ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                          : "text-slate-400 bg-white/5 border border-white/10"
                      }`}
                    >
                      {link.is_active ? "Active" : "Hidden"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditSocial(link)}
                      className="p-1.5 text-slate-400 hover:text-purple-400 transition-colors cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingSocialLink(link)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Live Storefront Preview */}
      {activeTab === "preview" && (
        <div className="space-y-4">
          <div className="p-4 rounded-md bg-[#0B0F17] border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono text-slate-400">
                  Live Footer Presentation Simulation ({previewDevice === "desktop" ? "Desktop Grid" : "Mobile Accordion"})
                </span>
              </div>
              <span className="text-xs font-mono text-cyan-400">
                {columns.filter((c) => c.is_active).length} Active Columns, {socialLinks.filter((s) => s.is_active).length} Social Channels
              </span>
            </div>

            {/* Simulated Storefront Footer */}
            <div className="border border-white/10 rounded-md overflow-hidden bg-[#0a0d14] shadow-2xl">
              {/* Optional Theme Feature Ribbon banner */}
              {theme?.footer_features_enabled !== false && (
                <div className="bg-white/[0.02] border-b border-white/[0.06] p-4 text-xs text-slate-400 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#A78BFA]" />
                    <span className="font-semibold text-slate-300">Theme Guarantees Ribbon Active</span>
                  </div>
                  <Link
                    href="/admin/content/theme"
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>Configure Feature Badges in Theme Settings</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              )}

              {/* Main Footer Container */}
              <div className="p-6 sm:p-8 space-y-8">
                {previewDevice === "desktop" ? (
                  /* Desktop Simulation: Brand column + 4 columns */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
                    {/* Brand Column (2 wide) */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-[#005826] flex items-center justify-center font-bold text-white text-sm">
                          {theme?.store_brand_name?.charAt(0) || "S"}
                        </div>
                        <span className="font-bold text-white tracking-wide text-base">
                          {theme?.store_brand_name || "INHALIQ"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                        {theme?.store_brand_tagline || "Curated premium disposable vapes, pod systems, and accessories. Elevate your experience with verified flavors and authentic hardware."}
                      </p>

                      {/* Social icons */}
                      <div className="pt-2">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                          Connect with us
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          {socialLinks
                            .filter((s) => s.is_active)
                            .map((s) => (
                              <div
                                key={s.id}
                                className="w-8 h-8 rounded-md border border-white/10 bg-white/[0.03] flex items-center justify-center text-slate-300 hover:text-cyan-400 transition-colors"
                              >
                                <SocialPlatformIcon platform={s.platform} icon={s.icon} className="w-4 h-4" />
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>

                    {/* Columns */}
                    {columns
                      .filter((c) => c.is_active)
                      .map((col) => (
                        <div key={col.id} className="space-y-3">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                            {col.title}
                          </h4>
                          <ul className="space-y-2">
                            {(col.links || [])
                              .filter((l) => l.is_active)
                              .map((link) => (
                                <li key={link.id}>
                                  <span className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer block truncate">
                                    {link.title}
                                  </span>
                                </li>
                              ))}
                          </ul>
                        </div>
                      ))}
                  </div>
                ) : (
                  /* Mobile Simulation */
                  <div className="max-w-sm mx-auto space-y-6">
                    <div className="space-y-3 text-center">
                      <span className="font-bold text-white text-base block">{theme?.store_brand_name || "INHALIQ"}</span>
                      <p className="text-xs text-slate-400">{theme?.store_brand_tagline || "Elevate every inhale."}</p>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        {socialLinks
                          .filter((s) => s.is_active)
                          .map((s) => (
                            <div
                              key={s.id}
                              className="w-8 h-8 rounded-md border border-white/10 bg-white/[0.03] flex items-center justify-center text-slate-300"
                            >
                              <SocialPlatformIcon platform={s.platform} icon={s.icon} className="w-4 h-4" />
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
                      {columns
                        .filter((c) => c.is_active)
                        .map((col) => (
                          <div key={col.id} className="py-3 space-y-2">
                            <div className="flex items-center justify-between font-bold text-xs text-white uppercase tracking-wider">
                              <span>{col.title}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <ul className="space-y-1.5 pl-2">
                              {(col.links || [])
                                .filter((l) => l.is_active)
                                .map((link) => (
                                  <li key={link.id} className="text-xs text-slate-400">
                                    {link.title}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Bottom Bar Simulation */}
                <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
                  <span>© {new Date().getFullYear()} {theme?.store_brand_name || "INHALIQ"}. All rights reserved.</span>
                  <div className="flex items-center gap-4">
                    <span>Privacy Policy</span>
                    <span>Terms of Service</span>
                    <span>Refund Policy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER / MODAL: Column */}
      <Sheet open={isColumnModalOpen} onOpenChange={setIsColumnModalOpen}>
        <SheetContent className="bg-[#0F141E] border-l border-white/10 text-white w-full sm:max-w-md p-0 overflow-y-auto">
          <div className="p-6 border-b border-white/10 sticky top-0 bg-[#0F141E] z-10">
            <SheetTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              {editingColumn ? `Edit Column: ${editingColumn.title}` : "Create Footer Column"}
            </SheetTitle>
            <p className="text-xs text-slate-400 mt-1">
              Columns organize footer links into logical storefront groups.
            </p>
          </div>

          <form onSubmit={handleSaveColumn} className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Column Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={columnTitle}
                onChange={(e) => setColumnTitle(e.target.value)}
                placeholder="e.g. Quick Links, Customer Service, Legal"
                required
                maxLength={100}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Sort Order Position</label>
              <input
                type="number"
                value={columnSortOrder}
                onChange={(e) => setColumnSortOrder(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="pt-2 border-t border-white/[0.08]">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={columnIsActive}
                  onChange={(e) => setColumnIsActive(e.target.checked)}
                  className="w-4 h-4 rounded bg-black/40 border-white/20 text-cyan-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-slate-200">Active (Visible in storefront footer)</span>
              </label>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsColumnModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-white/5 rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingColumn}
                className="px-5 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-md transition-all shadow-sm shadow-cyan-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {savingColumn && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingColumn ? "Save Changes" : "Create Column"}
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* DRAWER / MODAL: Link */}
      <Sheet open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <SheetContent className="bg-[#0F141E] border-l border-white/10 text-white w-full sm:max-w-md p-0 overflow-y-auto">
          <div className="p-6 border-b border-white/10 sticky top-0 bg-[#0F141E] z-10">
            <SheetTitle className="text-lg font-bold text-white flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-cyan-400" />
              {editingLink ? `Edit Link: ${editingLink.title}` : "Add Footer Link"}
            </SheetTitle>
            <p className="text-xs text-slate-400 mt-1">
              Specify destination URL, target column, and tab opening behavior.
            </p>
          </div>

          <form onSubmit={handleSaveLink} className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Target Column <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedColumnId ?? ""}
                onChange={(e) => setSelectedColumnId(Number(e.target.value))}
                required
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Link Title / Label <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="e.g. Return Policy, Contact Support"
                required
                maxLength={100}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">
                Destination URL <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="e.g. /about, /shipping-policy, https://..."
                required
                maxLength={255}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-md text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />

              <div className="space-y-1 pt-1">
                <span className="text-[10px] text-slate-500 font-mono block">Common Presets:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COMMON_LINK_PRESETS.map((p) => (
                    <button
                      key={p.url}
                      type="button"
                      onClick={() => {
                        handleUrlChange(p.url);
                        if (!linkTitle) setLinkTitle(p.label);
                      }}
                      className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-mono transition-colors cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/[0.08]">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={linkOpenInNewTab}
                  onChange={(e) => setLinkOpenInNewTab(e.target.checked)}
                  className="w-4 h-4 rounded bg-black/40 border-white/20 text-cyan-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-slate-200">Open in new tab</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={linkIsActive}
                  onChange={(e) => setLinkIsActive(e.target.checked)}
                  className="w-4 h-4 rounded bg-black/40 border-white/20 text-cyan-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-slate-200">Active (Visible in column)</span>
              </label>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-white/5 rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingLink}
                className="px-5 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-md transition-all shadow-sm shadow-cyan-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {savingLink && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingLink ? "Save Changes" : "Create Link"}
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* DRAWER / MODAL: Social Profile */}
      <Sheet open={isSocialModalOpen} onOpenChange={setIsSocialModalOpen}>
        <SheetContent className="bg-[#0F141E] border-l border-white/10 text-white w-full sm:max-w-md p-0 overflow-y-auto">
          <div className="p-6 border-b border-white/10 sticky top-0 bg-[#0F141E] z-10">
            <SheetTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-purple-400" />
              {editingSocialLink ? `Edit Profile: ${editingSocialLink.platform}` : "Add Social Profile"}
            </SheetTitle>
            <p className="text-xs text-slate-400 mt-1">
              Connect external storefront profiles and messaging channels.
            </p>
          </div>

          <form onSubmit={handleSaveSocial} className="p-6 space-y-5">
            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Choose Platform</label>
              <div className="grid grid-cols-3 gap-1.5">
                {PRESET_PLATFORMS.map((p) => {
                  const isSelected = socialPlatform.toLowerCase() === p.name.toLowerCase();
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handlePresetSelect(p)}
                      className={`p-2 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-purple-500/15 border-purple-500/40 text-purple-300 shadow-xs"
                          : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.05]"
                      }`}
                    >
                      <SocialPlatformIcon platform={p.name} icon={p.icon} className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom or WhatsApp inputs */}
            {isSocialWhatsApp ? (
              <div className="space-y-3 p-3.5 rounded-md bg-emerald-500/5 border border-emerald-500/20">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-emerald-300">
                    WhatsApp Business Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={socialWhatsappNumber}
                    onChange={(e) => setSocialWhatsappNumber(e.target.value)}
                    placeholder="e.g. 8801700000000"
                    required
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-md text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500">Include country code without + or spaces.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-emerald-300">Pre-filled Chat Message (Optional)</label>
                  <input
                    type="text"
                    value={socialWhatsappMessage}
                    onChange={(e) => setSocialWhatsappMessage(e.target.value)}
                    placeholder="e.g. Hi, I have a question about my order."
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Platform Name</label>
                  <input
                    type="text"
                    value={socialPlatform}
                    onChange={(e) => setSocialPlatform(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Profile / Channel URL</label>
                  <input
                    type="text"
                    value={socialUrl}
                    onChange={(e) => setSocialUrl(e.target.value)}
                    placeholder="https://..."
                    required
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-md text-sm text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-white/[0.08]">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={socialIsActive}
                  onChange={(e) => setSocialIsActive(e.target.checked)}
                  className="w-4 h-4 rounded bg-black/40 border-white/20 text-purple-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-slate-200">Active (Visible on public storefront)</span>
              </label>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsSocialModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-white/5 rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingSocial}
                className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-md transition-all shadow-sm shadow-purple-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {savingSocial && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingSocialLink ? "Save Changes" : "Add Profile"}
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* DIALOG: Delete Column Confirmation */}
      {deletingColumn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0F141E] border border-white/10 rounded-lg w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Delete Footer Column</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove <span className="font-semibold text-white">&apos;{deletingColumn.title}&apos;</span>?
              {deletingColumn.links && deletingColumn.links.length > 0 && (
                <span className="block mt-2 text-rose-300">
                  Warning: This column currently contains {deletingColumn.links.length} link{deletingColumn.links.length !== 1 ? "s" : ""}. Deleting it will remove the column from the storefront.
                </span>
              )}
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingColumn(null)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white bg-white/5 rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteColumn}
                disabled={deleting}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete Column
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG: Delete Link Confirmation */}
      {deletingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0F141E] border border-white/10 rounded-lg w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Delete Footer Link</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove <span className="font-semibold text-white">&apos;{deletingLink.title}&apos;</span> ({deletingLink.url})?
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingLink(null)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white bg-white/5 rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteLink}
                disabled={deleting}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG: Delete Social Link Confirmation */}
      {deletingSocialLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0F141E] border border-white/10 rounded-lg w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Delete Social Profile</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove the channel <span className="font-semibold text-white">&apos;{deletingSocialLink.platform}&apos;</span>?
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingSocialLink(null)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white bg-white/5 rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSocial}
                disabled={deleting}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminContentFooterPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
          <p className="text-xs">Loading footer console...</p>
        </div>
      }
    >
      <AdminContentFooterPageContent />
    </React.Suspense>
  );
}
