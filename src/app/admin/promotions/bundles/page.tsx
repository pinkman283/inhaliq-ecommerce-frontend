"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  Plus,
  Search,
  Tag,
  Gift,
  Zap,
  ShoppingBag,
  Percent,
  Trash2,
  CheckCircle2,
  Power,
  RefreshCw,
  X,
  Package,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { Promotion, Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { AdminPageHeader, AdminStatStrip, AdminStatusBadge, AdminEmptyState } from "@/components/admin/ui";
import { toast } from "sonner";

export default function AdminBundlesPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "bxgy" | "combo" | "volume">("all");

  // Create Bundle Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bundleName, setBundleName] = useState("");
  const [bundleHeadline, setBundleHeadline] = useState("");
  const [badgeText, setBadgeText] = useState("BUNDLE DEAL");
  const [dealStrategy, setDealStrategy] = useState<"bxgy" | "combo" | "volume">("bxgy");
  
  // BXGY parameters
  const [buyQuantity, setBuyQuantity] = useState(2);
  const [getQuantity, setGetQuantity] = useState(1);
  const [rewardDiscountPercent, setRewardDiscountPercent] = useState(100); // 100% = Free
  
  // Combo & Volume parameters
  const [comboDiscountPercent, setComboDiscountPercent] = useState(20);
  const [minVolumeQuantity, setMinVolumeQuantity] = useState(3);
  
  // Selected Products for Deal
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [productSearch, setProductSearch] = useState("");

  const fetchBundles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPromotions({
        search: search.trim() || undefined,
        per_page: 50,
      });
      // Filter for bundle-like promotions: discount_type === 'buy_x_get_y' or automatic discounts with products
      const bundlesOnly = (res.data || []).filter(
        (p) => p.discount_type === "buy_x_get_y" || p.promotion_type === "automatic_discount" || p.slug.includes("bundle")
      );
      setPromotions(bundlesOnly.length > 0 ? bundlesOnly : res.data || []);
    } catch (err) {
      toast.error("Failed to load product bundles.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  const loadProducts = async () => {
    if (allProducts.length > 0) return;
    setLoadingProducts(true);
    try {
      const res = await adminApi.getProducts({ per_page: 100 });
      setAllProducts(res.data || []);
    } catch (err) {
      toast.error("Failed to load products for bundle builder.");
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchBundles();
  }, [fetchBundles]);

  const openCreateModal = (preset?: "bxgy" | "combo" | "volume") => {
    loadProducts();
    if (preset === "bxgy") {
      setDealStrategy("bxgy");
      setBundleName("Buy 2 Get 1 Free Deal");
      setBundleHeadline("Add 3 items to cart to receive 1 item completely free!");
      setBadgeText("BUY 2 GET 1 FREE");
      setBuyQuantity(2);
      setGetQuantity(1);
      setRewardDiscountPercent(100);
    } else if (preset === "combo") {
      setDealStrategy("combo");
      setBundleName("Curated Style Combo Pack");
      setBundleHeadline("Save 20% when you purchase this matching cross-sell set!");
      setBadgeText("SAVE 20% COMBO");
      setComboDiscountPercent(20);
    } else if (preset === "volume") {
      setDealStrategy("volume");
      setBundleName("Volume Savings: Buy 3+ Save 25%");
      setBundleHeadline("Volume discount applied automatically at checkout on 3 or more items!");
      setBadgeText("BUY MORE SAVE 25%");
      setMinVolumeQuantity(3);
      setComboDiscountPercent(25);
    } else {
      setDealStrategy("bxgy");
      setBundleName("");
      setBundleHeadline("");
      setBadgeText("BUNDLE DEAL");
      setSelectedProductIds([]);
    }
    setIsModalOpen(true);
  };

  const handleToggleProduct = (id: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleCreateBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bundleName.trim()) {
      toast.error("Please provide a bundle name.");
      return;
    }

    setSaving(true);
    try {
      const slug = bundleName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") + "-" + Date.now().toString().slice(-4);

      let payload: any = {
        name: bundleName.trim(),
        slug,
        headline: bundleHeadline.trim() || undefined,
        badge_text: badgeText.trim() || "SPECIAL DEAL",
        promotion_type: "automatic_discount",
        status: "active",
        show_on_storefront: true,
        storefront_placement: "flash_sale",
        customer_eligibility: "all",
        applies_to: selectedProductIds.length > 0 ? "specific_products" : "entire_order",
        target_product_ids: selectedProductIds,
        priority: 10,
        is_stackable: true,
      };

      if (dealStrategy === "bxgy") {
        payload.discount_type = "buy_x_get_y";
        payload.discount_value = rewardDiscountPercent;
        payload.bxgy_buy_quantity = buyQuantity;
        payload.bxgy_get_quantity = getQuantity;
        payload.bxgy_reward_discount_percent = rewardDiscountPercent;
        payload.bxgy_max_applications = 3;
      } else if (dealStrategy === "volume") {
        payload.discount_type = "percentage";
        payload.discount_value = comboDiscountPercent;
        payload.min_quantity = minVolumeQuantity;
      } else {
        // combo pack
        payload.discount_type = "percentage";
        payload.discount_value = comboDiscountPercent;
      }

      await adminApi.createPromotion(payload);
      toast.success(`Bundle deal "${bundleName}" published successfully!`);
      setIsModalOpen(false);
      fetchBundles();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create bundle deal.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (promo: Promotion) => {
    try {
      await adminApi.togglePromotionStatus(promo.id);
      toast.success(`Deal status updated.`);
      setPromotions((prev) =>
        prev.map((p) =>
          p.id === promo.id
            ? { ...p, status: p.status === "active" ? "paused" : "active" }
            : p
        )
      );
    } catch (err) {
      toast.error("Failed to toggle deal status.");
    }
  };

  const handleDeleteBundle = async (promo: Promotion) => {
    if (!confirm(`Delete deal "${promo.name}"?`)) return;
    try {
      await adminApi.deletePromotion(promo.id);
      toast.success("Deal removed.");
      setPromotions((prev) => prev.filter((p) => p.id !== promo.id));
    } catch (err) {
      toast.error("Failed to delete deal.");
    }
  };

  const filteredPromotions = promotions.filter((p) => {
    if (filterType === "bxgy") return p.discount_type === "buy_x_get_y";
    if (filterType === "volume") return p.min_quantity && p.min_quantity > 1;
    if (filterType === "combo") return p.discount_type === "percentage" && (!p.min_quantity || p.min_quantity <= 1);
    return true;
  });

  const filteredProductsToSelect = allProducts.filter((prod) =>
    prod.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (prod.sku && prod.sku.toLowerCase().includes(productSearch.toLowerCase()))
  );

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <AdminPageHeader
        title="Product Bundles & Deals Engine"
        description="High-converting Buy-X-Get-Y (BXGY), multi-product combo packs, and tiered volume discounts with instant checkout evaluation."
        badge={`${promotions.length} deals active`}
        breadcrumbs={[
          { label: "Marketing", href: "/admin/promotions" },
          { label: "Bundles & Deals Engine" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/promotions"
              className="px-3 py-1.5 rounded-md bg-[#171B26] hover:bg-[#1E2333] border border-[#272B35] text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              All Promotions
            </Link>
            <button
              type="button"
              onClick={() => openCreateModal()}
              className="px-3.5 py-1.5 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Deal Bundle
            </button>
          </div>
        }
      />

      {/* Quick Launch Presets Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <button
          onClick={() => openCreateModal("bxgy")}
          className="p-4 rounded-xl bg-gradient-to-br from-purple-900/20 via-[#161a26] to-[#0f121b] border border-[#A78BFA]/30 hover:border-[#A78BFA] text-left transition-all group cursor-pointer shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#211B32] border border-[#A78BFA]/40 flex items-center justify-center text-[#A78BFA] group-hover:scale-110 transition-transform">
              <Gift className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              High Conversion
            </span>
          </div>
          <h4 className="text-sm font-bold text-white group-hover:text-[#A78BFA] transition-colors">
            Buy X Get Y Free (BXGY)
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Reward customers with free or discounted items when purchasing 2+ units of selected lines.
          </p>
        </button>

        <button
          onClick={() => openCreateModal("combo")}
          className="p-4 rounded-xl bg-gradient-to-br from-blue-900/20 via-[#161a26] to-[#0f121b] border border-blue-500/30 hover:border-blue-400 text-left transition-all group cursor-pointer shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-950/40 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Cross-Sell AOV
            </span>
          </div>
          <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
            Multi-Item Combo Pack
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Bundle complementary accessories or outfit essentials with automatic percentage savings.
          </p>
        </button>

        <button
          onClick={() => openCreateModal("volume")}
          className="p-4 rounded-xl bg-gradient-to-br from-emerald-900/20 via-[#161a26] to-[#0f121b] border border-emerald-500/30 hover:border-emerald-400 text-left transition-all group cursor-pointer shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Stock Clearance
            </span>
          </div>
          <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
            Tiered Volume Discount
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Incentivize bulk purchasing: "Buy 3 or more, unlock 25% automatic discount at checkout".
          </p>
        </button>
      </div>

      {/* Filter Strip */}
      <div className="flex items-center justify-between gap-3 bg-[#0f121b] p-3 rounded-lg border border-white/[0.08]">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: "all", label: "All Bundles" },
            { id: "bxgy", label: "Buy X Get Y (BXGY)" },
            { id: "combo", label: "Combo Packs" },
            { id: "volume", label: "Volume Tiers" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all border cursor-pointer ${
                filterType === tab.id
                  ? "bg-[#211B32] border-[#A78BFA] text-[#A78BFA]"
                  : "bg-[#161a26] border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search bundles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#161a26] border border-white/[0.08] focus:border-[#A78BFA]/50 rounded-md pl-8 pr-3 py-1 text-xs text-white placeholder:text-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Bundles Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 bg-[#0f121b] rounded-xl border border-white/[0.08]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#A78BFA] mb-2" />
          <span>Loading bundle deals...</span>
        </div>
      ) : filteredPromotions.length === 0 ? (
        <div className="bg-[#0f121b] rounded-xl border border-white/[0.08] p-12 text-center">
          <AdminEmptyState
            icon={Package}
            title="No Product Bundles Found"
            description="Create your first Buy-X-Get-Y offer or multi-item combo deal to increase your average order value."
            action={
              <button
                onClick={() => openCreateModal("bxgy")}
                className="mt-3 px-4 py-2 rounded-md bg-[#A78BFA] text-[#090B10] font-bold text-xs"
              >
                Launch Buy-2-Get-1 Free Deal
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPromotions.map((promo) => {
            const isBXGY = promo.discount_type === "buy_x_get_y";
            const isVolume = Boolean(promo.min_quantity && promo.min_quantity > 1);

            return (
              <div
                key={promo.id}
                className="bg-[#0f121b] border border-white/[0.08] hover:border-white/20 rounded-xl p-4.5 flex flex-col justify-between transition-all group shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/30">
                      {promo.badge_text || (isBXGY ? "BUY X GET Y" : isVolume ? "VOLUME DEAL" : "COMBO PACK")}
                    </span>
                    <AdminStatusBadge status={promo.status || "active"} size="sm" />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-[#A78BFA] transition-colors">
                      {promo.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {promo.headline || promo.description || "Automatic cart discount when requirements are fulfilled."}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Deal Mechanic:</span>
                      <strong className="text-white font-mono">
                        {isBXGY
                          ? `Buy ${promo.bxgy_buy_quantity || 2}, Get ${promo.bxgy_get_quantity || 1} Free`
                          : isVolume
                          ? `Buy ${promo.min_quantity}+ Save ${promo.discount_value}%`
                          : `Save ${promo.discount_value}% Automatically`}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Redemptions:</span>
                      <span className="font-mono text-emerald-400 font-semibold">{promo.total_used_count || 0} times</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Checkout Mode:</span>
                      <span className="text-[10px] text-cyan-300 uppercase font-semibold">1-Click Auto Applied</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/[0.06] mt-4 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleStatus(promo)}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Power className={`w-3.5 h-3.5 ${promo.status === "active" ? "text-emerald-400" : "text-slate-500"}`} />
                    <span>{promo.status === "active" ? "Active" : "Paused"}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteBundle(promo)}
                      className="p-1.5 rounded-md hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete bundle"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE DEAL BUNDLE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f121b] border border-white/[0.08] rounded-xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.08] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#211B32] border border-[#A78BFA]/40 flex items-center justify-center text-[#A78BFA]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Create Smart Deal Bundle</h3>
                  <p className="text-xs text-slate-400">Deploy high-converting BXGY or volume deals directly to checkout</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateBundle} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Strategy Selector */}
              <div>
                <label className="font-bold text-slate-300 block mb-2">Deal Strategy</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "bxgy", label: "Buy X Get Y (BXGY)", sub: "e.g. Buy 2 Get 1 Free" },
                    { id: "combo", label: "Combo Pack", sub: "e.g. Curated Set -20%" },
                    { id: "volume", label: "Volume Tier", sub: "e.g. Buy 3+ Save 25%" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setDealStrategy(s.id as any)}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        dealStrategy === s.id
                          ? "bg-[#211B32] border-[#A78BFA] text-white"
                          : "bg-[#161a26] border-white/5 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <strong className="block text-xs text-white">{s.label}</strong>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{s.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Deal Name & Headline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Deal Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Buy 2 Get 1 Free Essentials"
                    value={bundleName}
                    onChange={(e) => setBundleName(e.target.value)}
                    className="w-full bg-[#161a26] border border-white/[0.08] focus:border-[#A78BFA]/50 rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Badge Text</label>
                  <input
                    type="text"
                    placeholder="e.g. BUY 2 GET 1 FREE"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    className="w-full bg-[#161a26] border border-white/[0.08] focus:border-[#A78BFA]/50 rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Customer-Facing Marketing Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Add 3 items to your cart, and the cheapest one is automatically 100% free!"
                  value={bundleHeadline}
                  onChange={(e) => setBundleHeadline(e.target.value)}
                  className="w-full bg-[#161a26] border border-white/[0.08] focus:border-[#A78BFA]/50 rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              {/* Dynamic Strategy Config */}
              {dealStrategy === "bxgy" && (
                <div className="p-3.5 rounded-lg bg-[#161a26] border border-white/[0.08] space-y-3">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[11px] text-[#A78BFA]">
                    Buy X Get Y Rules
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Customer Buys</label>
                      <input
                        type="number"
                        min={1}
                        value={buyQuantity}
                        onChange={(e) => setBuyQuantity(Number(e.target.value))}
                        className="w-full bg-[#0f121b] border border-white/10 rounded px-2.5 py-1.5 text-white font-mono text-center"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">Full price units</span>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Customer Gets</label>
                      <input
                        type="number"
                        min={1}
                        value={getQuantity}
                        onChange={(e) => setGetQuantity(Number(e.target.value))}
                        className="w-full bg-[#0f121b] border border-white/10 rounded px-2.5 py-1.5 text-white font-mono text-center"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">Discounted units</span>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Reward Discount</label>
                      <select
                        value={rewardDiscountPercent}
                        onChange={(e) => setRewardDiscountPercent(Number(e.target.value))}
                        className="w-full bg-[#0f121b] border border-white/10 rounded px-2 py-1.5 text-white"
                      >
                        <option value={100}>100% Free</option>
                        <option value={50}>50% Off</option>
                        <option value={25}>25% Off</option>
                      </select>
                      <span className="text-[10px] text-slate-500 mt-1 block">On reward unit</span>
                    </div>
                  </div>
                </div>
              )}

              {dealStrategy === "volume" && (
                <div className="p-3.5 rounded-lg bg-[#161a26] border border-white/[0.08] space-y-3">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[11px] text-emerald-400">
                    Volume Tier Rules
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Minimum Cart Quantity</label>
                      <input
                        type="number"
                        min={2}
                        value={minVolumeQuantity}
                        onChange={(e) => setMinVolumeQuantity(Number(e.target.value))}
                        className="w-full bg-[#0f121b] border border-white/10 rounded px-2.5 py-1.5 text-white font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Total Discount %</label>
                      <input
                        type="number"
                        min={5}
                        max={90}
                        value={comboDiscountPercent}
                        onChange={(e) => setComboDiscountPercent(Number(e.target.value))}
                        className="w-full bg-[#0f121b] border border-white/10 rounded px-2.5 py-1.5 text-white font-mono text-center"
                      />
                    </div>
                  </div>
                </div>
              )}

              {dealStrategy === "combo" && (
                <div className="p-3.5 rounded-lg bg-[#161a26] border border-white/[0.08] space-y-3">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[11px] text-blue-400">
                    Combo Bundle Discount
                  </h4>
                  <div>
                    <label className="text-slate-400 block mb-1">Bundle Savings Percent</label>
                    <input
                      type="number"
                      min={5}
                      max={90}
                      value={comboDiscountPercent}
                      onChange={(e) => setComboDiscountPercent(Number(e.target.value))}
                      className="w-full bg-[#0f121b] border border-white/10 rounded px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Target Products Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300">
                    Eligible Products ({selectedProductIds.length} selected)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {selectedProductIds.length === 0 ? "Applies to entire catalog" : "Restricted to selected lines"}
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search catalog products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full bg-[#161a26] border border-white/[0.08] focus:border-[#A78BFA]/50 rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-white/[0.06] rounded-md p-2 bg-[#07080c]">
                  {loadingProducts ? (
                    <div className="py-6 text-center text-slate-500">Loading catalog...</div>
                  ) : filteredProductsToSelect.length === 0 ? (
                    <div className="py-6 text-center text-slate-500">No matching products found.</div>
                  ) : (
                    filteredProductsToSelect.map((prod) => {
                      const isSelected = selectedProductIds.includes(prod.id);
                      return (
                        <div
                          key={prod.id}
                          onClick={() => handleToggleProduct(prod.id)}
                          className={`flex items-center justify-between p-2 rounded-md transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#211B32] border border-[#A78BFA]/30"
                              : "hover:bg-white/[0.02] border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded text-[#A78BFA] focus:ring-0"
                            />
                            <span className="font-semibold text-white">{prod.name}</span>
                          </div>
                          <span className="font-mono text-slate-400">{formatPrice(prod.price)}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-md bg-[#161a26] hover:bg-[#1E2333] border border-white/5 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{saving ? "Publishing Deal..." : "Publish Deal to Checkout"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
