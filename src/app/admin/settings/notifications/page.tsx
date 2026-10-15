"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  Bell, 
  Save, 
  MessageSquare, 
  Mail, 
  Code, 
  Copy, 
  Check, 
  RotateCcw, 
  Loader2, 
  Sparkles,
  Send
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { NotificationTemplate } from "@/types";
import { SettingsNavTabs } from "@/components/admin/settings/SettingsNavTabs";
import { AdminPageHeader, AdminSaveBar } from "@/components/admin/ui";
import { toast } from "sonner";

const TEMPLATE_KEYS = [
  { key: "order_confirmed", label: "Order Confirmed & Payment Received" },
  { key: "order_shipped", label: "Out for Delivery / Dispatched" },
  { key: "order_delivered", label: "Successfully Delivered" },
  { key: "order_cancelled", label: "Order Cancelled Notice" },
];

const VARIABLE_CHIPS = [
  { chip: "{customer_name}", desc: "Customer Full Name" },
  { chip: "{order_number}", desc: "e.g. ORD-98214" },
  { chip: "{total_amount}", desc: "Total Order Price" },
  { chip: "{tracking_link}", desc: "Live Tracking URL" },
  { chip: "{courier_name}", desc: "Assigned Courier" },
  { chip: "{consignment_id}", desc: "Courier Parcel ID" },
  { chip: "{hotline}", desc: "Support Phone" },
];

export default function AdminNotificationTemplatesPage() {
  const [templates, setTemplates] = useState<Record<string, NotificationTemplate>>({});
  const [initialTemplates, setInitialTemplates] = useState<Record<string, NotificationTemplate>>({});
  const [selectedKey, setSelectedKey] = useState("order_confirmed");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getExtendedSettings();
      if (res.notification_templates) {
        setTemplates(res.notification_templates);
        setInitialTemplates(res.notification_templates);
      }
    } catch (err) {
      toast.error("Failed to load notification templates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isDirty = useMemo(() => {
    return JSON.stringify(templates) !== JSON.stringify(initialTemplates);
  }, [templates, initialTemplates]);

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

  const currentTpl = templates[selectedKey] || {
    title: "",
    sms_body: "",
    email_subject: "",
  };

  const handleUpdateCurrent = (field: keyof NotificationTemplate, value: string) => {
    setTemplates({
      ...templates,
      [selectedKey]: {
        ...currentTpl,
        [field]: value,
      },
    });
  };

  const handleInsertVariable = (chip: string) => {
    const updatedSms = (currentTpl.sms_body || "") + " " + chip;
    handleUpdateCurrent("sms_body", updatedSms);
    toast.info(`Inserted ${chip}`);
  };

  const handleDiscard = () => {
    if (!isDirty) return;
    setTemplates(initialTemplates);
    toast.info("Unsaved notification changes discarded.");
  };

  const handleSaveAll = async () => {
    if (!isDirty || saving) return;
    setSaving(true);
    try {
      await adminApi.updateSettingsGroup("notification_templates", templates);
      setInitialTemplates(templates);
      toast.success("Notification message templates saved successfully.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save message templates.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        title="Settings & System Studio"
        subtitle="Manage dynamic message templates for automated SMS broadcasting and transactional emails."
        breadcrumbs={[
          { label: "Settings", href: "/admin/settings" },
          { label: "Notification Templates", href: "/admin/settings/notifications" },
        ]}
      />

      <SettingsNavTabs />

      {loading ? (
        <div className="bg-[#0f121b] border border-white/[0.08] rounded-md p-8 space-y-4 animate-pulse">
          <div className="h-6 w-48 bg-[#161a26] rounded-md" />
          <div className="h-40 bg-[#161a26] rounded-md" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Event List */}
          <div className="bg-[#0f121b] border border-white/[0.08] rounded-md p-4 space-y-2 h-fit">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-2 mb-2">
              Lifecycle Events
            </span>
            {TEMPLATE_KEYS.map((item) => {
              const isSelected = selectedKey === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setSelectedKey(item.key)}
                  className={`w-full text-left px-3.5 py-3 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30"
                      : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}

            {/* Variable Tokens Box */}
            <div className="pt-4 border-t border-white/[0.06] px-2 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 block">
                Click Variable to Insert:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLE_CHIPS.map((v) => (
                  <button
                    key={v.chip}
                    type="button"
                    onClick={() => handleInsertVariable(v.chip)}
                    className="px-2 py-1 rounded text-[10px] font-mono bg-[#161a26] hover:bg-[#211B32] text-slate-300 hover:text-[#A78BFA] border border-white/5 transition-all cursor-pointer"
                    title={v.desc}
                  >
                    {v.chip}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right 3 Columns: Editor */}
          <div className="lg:col-span-3 space-y-6">
            {/* SMS Template */}
            <div className="bg-[#0f121b] border border-white/[0.08] rounded-md p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#A78BFA]" />
                  <h3 className="text-sm font-bold text-white">SMS Broadcast Copy</h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {(currentTpl.sms_body || "").length} Characters (approx {Math.ceil(((currentTpl.sms_body || "").length || 1) / 160)} SMS Parts)
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Message Body</label>
                <textarea
                  rows={4}
                  value={currentTpl.sms_body || ""}
                  onChange={(e) => handleUpdateCurrent("sms_body", e.target.value)}
                  className="w-full bg-[#161a26] border border-white/10 rounded-md p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50 resize-none font-mono leading-relaxed"
                  placeholder="Type SMS text..."
                />
              </div>

              {/* Live Preview Bubble */}
              <div className="p-4 bg-[#161a26]/40 rounded-md border border-white/5 space-y-2">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                  Simulated Customer Phone SMS Preview
                </span>
                <div className="max-w-md bg-[#211B32] border border-[#A78BFA]/30 text-[#A78BFA] text-xs p-3.5 rounded-md rounded-tl-none font-mono leading-relaxed">
                  {(currentTpl.sms_body || "")
                    .replace(/\{customer_name\}/g, "Ahsan Habib")
                    .replace(/\{order_number\}/g, "ORD-2026-992")
                    .replace(/\{total_amount\}/g, "৳ 14,500")
                    .replace(/\{tracking_link\}/g, "aether.com/track/ORD-992")
                    .replace(/\{courier_name\}/g, "Steadfast")
                    .replace(/\{consignment_id\}/g, "STDF-991204")
                    .replace(/\{hotline\}/g, "+880 1800-AETHER")}
                </div>
              </div>
            </div>

            {/* Email Subject Template */}
            <div className="bg-[#0f121b] border border-white/[0.08] rounded-md p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
                <Mail className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Transactional Email Subject Line</h3>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Subject Heading</label>
                <input
                  type="text"
                  value={currentTpl.email_subject || ""}
                  onChange={(e) => handleUpdateCurrent("email_subject", e.target.value)}
                  className="w-full bg-[#161a26] border border-white/10 rounded-md px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50 font-mono"
                  placeholder="e.g. Order Confirmed #{order_number} - AETHER"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Contextual Unsaved Changes Dock */}
      <AdminSaveBar
        isDirty={isDirty}
        isSaving={saving}
        onSave={handleSaveAll}
        onDiscard={handleDiscard}
        saveLabel="Save All Templates"
        discardLabel="Discard"
        message="Unsaved notification templates"
      />
    </div>
  );
}
