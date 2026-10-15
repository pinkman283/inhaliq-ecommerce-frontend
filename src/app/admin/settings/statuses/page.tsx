"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  GitCommit, 
  Plus, 
  Save, 
  Trash2, 
  Check, 
  RotateCcw, 
  Loader2, 
  Bell, 
  Mail, 
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  X
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { OrderStatusConfig } from "@/types";
import { SettingsNavTabs } from "@/components/admin/settings/SettingsNavTabs";
import { AdminPageHeader, AdminEmptyState, AdminSaveBar } from "@/components/admin/ui";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

const COLOR_PRESETS = [
  { id: "amber", label: "Amber / Warning", bg: "bg-amber-500/20", border: "border-amber-500/40", text: "text-amber-300" },
  { id: "blue", label: "Blue / Info", bg: "bg-blue-500/20", border: "border-blue-500/40", text: "text-blue-300" },
  { id: "purple", label: "Purple / Processing", bg: "bg-purple-500/20", border: "border-purple-500/40", text: "text-purple-300" },
  { id: "sky", label: "Sky / In Transit", bg: "bg-sky-500/20", border: "border-sky-500/40", text: "text-sky-300" },
  { id: "emerald", label: "Emerald / Completed", bg: "bg-emerald-500/20", border: "border-emerald-500/40", text: "text-emerald-300" },
  { id: "rose", label: "Rose / Cancelled", bg: "bg-rose-500/20", border: "border-rose-500/40", text: "text-rose-300" },
];

export default function AdminOrderStatusesPage() {
  const [statuses, setStatuses] = useState<OrderStatusConfig[]>([]);
  const [initialStatuses, setInitialStatuses] = useState<OrderStatusConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New Status Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newId, setNewId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("blue");
  const [newSmsTrigger, setNewSmsTrigger] = useState(false);
  const [newEmailTrigger, setNewEmailTrigger] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getExtendedSettings();
      const loaded = res.order_statuses || [];
      setStatuses(loaded);
      setInitialStatuses(loaded);
    } catch (err) {
      toast.error("Failed to load order status pipeline.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isDirty = useMemo(() => {
    return JSON.stringify(statuses) !== JSON.stringify(initialStatuses);
  }, [statuses, initialStatuses]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleDiscard = () => {
    if (!isDirty) return;
    setStatuses(initialStatuses);
    toast.info("Unsaved pipeline changes discarded.");
  };

  const handleToggleSms = (idx: number) => {
    const updated = [...statuses];
    updated[idx].sms_trigger = !updated[idx].sms_trigger;
    setStatuses(updated);
  };

  const handleToggleEmail = (idx: number) => {
    const updated = [...statuses];
    updated[idx].email_trigger = !updated[idx].email_trigger;
    setStatuses(updated);
  };

  const handleDeleteStatus = (idx: number) => {
    if (statuses[idx].is_system) {
      toast.error("Core system order lifecycle statuses cannot be deleted.");
      return;
    }
    const updated = statuses.filter((_, i) => i !== idx);
    setStatuses(updated);
    toast.info("Status removed from draft pipeline.");
  };

  const handleAddStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim() || !newLabel.trim()) {
      toast.error("Status slug and label are required.");
      return;
    }

    const cleanSlug = newId.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (statuses.some((s) => s.id === cleanSlug)) {
      toast.error("A status with this slug already exists.");
      return;
    }

    const item: OrderStatusConfig = {
      id: cleanSlug,
      label: newLabel.trim(),
      color: newColor,
      is_system: false,
      sms_trigger: newSmsTrigger,
      email_trigger: newEmailTrigger,
    };

    setStatuses([...statuses, item]);
    setIsModalOpen(false);
    toast.success("New order stage added to pipeline.");
  };

  const handleSaveAll = async () => {
    if (!isDirty || saving) return;
    setSaving(true);
    try {
      await adminApi.updateSettingsGroup("order_statuses", statuses);
      setInitialStatuses(statuses);
      toast.success("Order status pipeline saved successfully.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save order pipeline.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        title="Settings & System Studio"
        subtitle="Configure order lifecycle stages, visual color tags, and automated SMS/Email hooks."
        breadcrumbs={[
          { label: "Settings", href: "/admin/settings" },
          { label: "Order Pipeline", href: "/admin/settings/statuses" },
        ]}
        actions={
          <button
            onClick={() => {
              setNewId("");
              setNewLabel("");
              setNewColor("blue");
              setNewSmsTrigger(false);
              setNewEmailTrigger(true);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Stage</span>
          </button>
        }
      />

      <SettingsNavTabs />

      {/* Main Container */}
      <div className="bg-[#0f121b] border border-white/[0.08] rounded-md p-6 space-y-6">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-[#A78BFA]" />
            Order Fulfillment Pipeline Stages
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            When an order status changes, automated webhooks, SMS broadcasting, and transactional emails trigger automatically.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-[#161a26] rounded-md animate-pulse" />
            ))}
          </div>
        ) : statuses.length === 0 ? (
          <AdminEmptyState
            title="No Order Stages"
            description="Add stages to customize the order processing flow."
            icon={GitCommit}
          />
        ) : (
          <div className="divide-y divide-white/[0.06] border border-white/[0.06] rounded-md overflow-hidden">
            {statuses.map((item, idx) => {
              const preset = COLOR_PRESETS.find((c) => c.id === item.color) || COLOR_PRESETS[0];

              return (
                <div
                  key={item.id || idx}
                  className="p-4 bg-[#161a26]/40 hover:bg-[#161a26]/80 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
                >
                  {/* Left Info */}
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-mono font-bold text-slate-400">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${preset.bg} ${preset.border} ${preset.text} border`}>
                          {item.label}
                        </span>
                        {item.is_system && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            (System Core)
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                        slug: <span className="text-[#A78BFA]">{item.id}</span>
                      </span>
                    </div>
                  </div>

                  {/* Automation Toggles */}
                  <div className="flex items-center gap-6 text-xs">
                    {/* SMS Hook */}
                    <button
                      type="button"
                      onClick={() => handleToggleSms(idx)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-all cursor-pointer ${
                        item.sms_trigger
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                          : "bg-white/5 text-slate-400 border-transparent hover:bg-white/10"
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>SMS Trigger {item.sms_trigger ? "ON" : "OFF"}</span>
                    </button>

                    {/* Email Hook */}
                    <button
                      type="button"
                      onClick={() => handleToggleEmail(idx)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-all cursor-pointer ${
                        item.email_trigger
                          ? "bg-sky-500/10 text-sky-300 border-sky-500/30"
                          : "bg-white/5 text-slate-400 border-transparent hover:bg-white/10"
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Trigger {item.email_trigger ? "ON" : "OFF"}</span>
                    </button>

                    {/* Delete */}
                    {!item.is_system && (
                      <button
                        onClick={() => handleDeleteStatus(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-md transition-colors cursor-pointer"
                        title="Remove Stage"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Custom Stage Slide-over Drawer */}
      <Sheet open={isModalOpen} onOpenChange={(open) => { if (!open) setIsModalOpen(false); }}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:w-[480px] md:w-[520px] sm:!max-w-[520px] max-w-full bg-[#0b0e17] border-l border-white/[0.08] p-0 flex flex-col justify-between shadow-2xl text-slate-100 overflow-hidden"
        >
          <form onSubmit={handleAddStatus} className="flex flex-col h-full overflow-hidden">
            {/* Compact Header: h-12 */}
            <div className="h-12 px-6 border-b border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0 pr-3">
                <SheetTitle className="text-xs font-semibold text-white tracking-wide shrink-0">
                  Add Order Stage
                </SheetTitle>
                <span className="text-slate-600 text-xs shrink-0">·</span>
                <span className="text-xs text-slate-400 truncate">Pipeline Stage Configuration</span>
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
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Stage Display Label <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Quality Inspection Passed"
                  value={newLabel}
                  onChange={(e) => {
                    setNewLabel(e.target.value);
                    if (!newId) {
                      setNewId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "_"));
                    }
                  }}
                  className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Internal Slug (Machine Key) <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. qc_passed"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none transition font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Color Tag Theme</label>
                <select
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white focus:border-white/20 focus:outline-none transition cursor-pointer"
                >
                  {COLOR_PRESETS.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#131722] text-white">
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3.5 rounded-md bg-white/[0.02] border border-white/5 space-y-2.5 pt-3">
                <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">
                  Automated Triggers
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-white transition">
                    <AdminCheckbox
                      checked={newSmsTrigger}
                      onChange={(e) => setNewSmsTrigger(e.target.checked)}
                    />
                    <span>Trigger SMS Notice</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-white transition">
                    <AdminCheckbox
                      checked={newEmailTrigger}
                      onChange={(e) => setNewEmailTrigger(e.target.checked)}
                    />
                    <span>Trigger Email Notice</span>
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
                className="h-8 px-4 rounded-md bg-white hover:bg-slate-200 text-slate-950 font-semibold text-xs transition cursor-pointer shadow-sm"
              >
                Add Stage
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Floating Contextual Unsaved Changes Dock */}
      <AdminSaveBar
        isDirty={isDirty}
        isSaving={saving}
        onSave={handleSaveAll}
        onDiscard={handleDiscard}
        saveLabel="Save Pipeline"
        discardLabel="Discard"
        message="Unsaved pipeline changes"
      />
    </div>
  );
}
