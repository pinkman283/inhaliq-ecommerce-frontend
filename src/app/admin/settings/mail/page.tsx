"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  Save, 
  Loader2, 
  Server, 
  RotateCcw, 
  HelpCircle,
  ShoppingBag, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  KeyRound, 
  Users,
  AtSign
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { SettingsNavTabs } from "@/components/admin/settings/SettingsNavTabs";
import { AdminPageHeader, AdminSaveBar } from "@/components/admin/ui";
import { toast } from "sonner";
import { MailSenderEntry } from "@/types";

interface EventItem {
  key: string;
  name: string;
  desc: string;
  icon: React.ElementType;
  emailPrefix: string;
  nameSuffix: string;
}

const EVENTS: EventItem[] = [
  { key: "order_confirmed", name: "Order Confirmed", desc: "Receipt & order invoice", icon: ShoppingBag, emailPrefix: "orders", nameSuffix: "Orders" },
  { key: "order_shipped", name: "Order Shipped", desc: "Tracking code & dispatch alert", icon: Truck, emailPrefix: "dispatch", nameSuffix: "Dispatch" },
  { key: "order_delivered", name: "Order Delivered", desc: "Delivery confirmation", icon: CheckCircle2, emailPrefix: "orders", nameSuffix: "Orders" },
  { key: "order_cancelled", name: "Order Cancelled", desc: "Cancellation & refund notice", icon: XCircle, emailPrefix: "support", nameSuffix: "Support" },
  { key: "auth", name: "OTP & Security", desc: "Verification & password resets", icon: KeyRound, emailPrefix: "no-reply", nameSuffix: "Security" },
  { key: "staff_invitation", name: "Staff Invitation", desc: "Admin invitation emails", icon: Users, emailPrefix: "admin", nameSuffix: "Admin" },
];

const DEFAULT_SENDERS: Record<string, MailSenderEntry> = {
  order_confirmed: { address: "", name: "", reply_to: "" },
  order_shipped: { address: "", name: "", reply_to: "" },
  order_delivered: { address: "", name: "", reply_to: "" },
  order_cancelled: { address: "", name: "", reply_to: "" },
  auth: { address: "", name: "", reply_to: "" },
  staff_invitation: { address: "", name: "", reply_to: "" },
};

export default function AdminMailSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<Record<string, string>>({
    MAIL_MAILER: "smtp",
    MAIL_HOST: "",
    MAIL_PORT: "587",
    MAIL_USERNAME: "",
    MAIL_PASSWORD: "",
    MAIL_ENCRYPTION: "tls",
    MAIL_FROM_ADDRESS: "",
    MAIL_FROM_NAME: "",
  });

  const [senders, setSenders] = useState<Record<string, MailSenderEntry>>(DEFAULT_SENDERS);
  const [initialConfig, setInitialConfig] = useState<Record<string, string>>({});
  const [initialSenders, setInitialSenders] = useState<Record<string, MailSenderEntry>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getExtendedSettings();
      let loadedConfig = { ...config };
      let loadedSenders = { ...DEFAULT_SENDERS };
      if (res.mail_configuration) {
        loadedConfig = { ...loadedConfig, ...res.mail_configuration };
        setConfig(loadedConfig);
      }
      if (res.mail_senders) {
        loadedSenders = { ...loadedSenders, ...res.mail_senders };
        setSenders(loadedSenders);
      }
      setInitialConfig(loadedConfig);
      setInitialSenders(loadedSenders);
    } catch {
      toast.error("Failed to load mail configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isDirty = useMemo(() => {
    return (
      JSON.stringify(config) !== JSON.stringify(initialConfig) ||
      JSON.stringify(senders) !== JSON.stringify(initialSenders)
    );
  }, [config, initialConfig, senders, initialSenders]);

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

  const handleConfigUpdate = (field: string, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSenderUpdate = (key: string, field: keyof MailSenderEntry, value: string) => {
    setSenders((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const handleResetSender = (key: string) => {
    setSenders((prev) => ({
      ...prev,
      [key]: { address: "", name: "", reply_to: "" },
    }));
  };

  const handleDiscard = () => {
    if (!isDirty) return;
    setConfig(initialConfig);
    setSenders(initialSenders);
    toast.info("Unsaved mail changes discarded.");
  };

  const handleSaveAll = async () => {
    if (!isDirty || saving) return;
    setSaving(true);
    try {
      await Promise.all([
        adminApi.updateSettingsGroup("mail_configuration", config),
        adminApi.updateSettingsGroup("mail_senders", senders),
      ]);
      setInitialConfig(config);
      setInitialSenders(senders);
      toast.success("Mail settings saved successfully.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const defaultFrom = config.MAIL_FROM_ADDRESS || "noreply@yourdomain.com";
  const defaultName = config.MAIL_FROM_NAME || "Store";

  return (
    <div className="space-y-6 pb-16 w-full">
      <AdminPageHeader
        title="Settings & System Studio"
        subtitle="Configure SMTP connection and customize sender addresses per email notification."
        breadcrumbs={[
          { label: "Settings", href: "/admin/settings" },
          { label: "Mail Configuration", href: "/admin/settings/mail" },
        ]}
      />

      <SettingsNavTabs />

      {loading ? (
        <div className="bg-[#0f121b] border border-white/[0.08] rounded-md p-8 space-y-4 animate-pulse w-full">
          <div className="h-5 w-40 bg-white/5 rounded" />
          <div className="h-32 bg-white/5 rounded-md" />
        </div>
      ) : (
        <div className="space-y-6 w-full">
          {/* SMTP Gateway Credentials */}
          <div className="bg-[#0f121b] border border-white/[0.08] rounded-md p-6 space-y-5 w-full">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-semibold text-white">SMTP Credentials</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Single authenticated SMTP gateway</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Mailer Protocol</label>
                <select
                  value={config.MAIL_MAILER || "smtp"}
                  onChange={(e) => handleConfigUpdate("MAIL_MAILER", e.target.value)}
                  className="w-full bg-[#141824] border border-white/10 rounded-md px-3.5 py-2.5 text-white focus:outline-none focus:border-[#A78BFA]/50 transition-colors"
                >
                  <option value="smtp">SMTP</option>
                  <option value="sendmail">Sendmail</option>
                  <option value="log">Log (Local Test)</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="text-[11px] font-medium text-slate-400 block mb-1.5">SMTP Host</label>
                <input
                  type="text"
                  value={config.MAIL_HOST || ""}
                  onChange={(e) => handleConfigUpdate("MAIL_HOST", e.target.value)}
                  placeholder="e.g. smtp.mailgun.org or smtp.gmail.com"
                  className="w-full bg-[#141824] border border-white/10 rounded-md px-3.5 py-2.5 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-[#A78BFA]/50 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Port</label>
                <input
                  type="text"
                  value={config.MAIL_PORT || ""}
                  onChange={(e) => handleConfigUpdate("MAIL_PORT", e.target.value)}
                  placeholder="587"
                  className="w-full bg-[#141824] border border-white/10 rounded-md px-3.5 py-2.5 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-[#A78BFA]/50 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Encryption</label>
                <select
                  value={config.MAIL_ENCRYPTION || "tls"}
                  onChange={(e) => handleConfigUpdate("MAIL_ENCRYPTION", e.target.value)}
                  className="w-full bg-[#141824] border border-white/10 rounded-md px-3.5 py-2.5 text-white focus:outline-none focus:border-[#A78BFA]/50 transition-colors"
                >
                  <option value="tls">TLS</option>
                  <option value="ssl">SSL</option>
                  <option value="">None</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Username / API User</label>
                <input
                  type="text"
                  value={config.MAIL_USERNAME || ""}
                  onChange={(e) => handleConfigUpdate("MAIL_USERNAME", e.target.value)}
                  placeholder="API key or username"
                  className="w-full bg-[#141824] border border-white/10 rounded-md px-3.5 py-2.5 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-[#A78BFA]/50 transition-colors"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Password / API Secret</label>
                <input
                  type="password"
                  value={config.MAIL_PASSWORD || ""}
                  onChange={(e) => handleConfigUpdate("MAIL_PASSWORD", e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full bg-[#141824] border border-white/10 rounded-md px-3.5 py-2.5 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-[#A78BFA]/50 transition-colors"
                />
              </div>
            </div>

            {/* Global Default From */}
            <div className="pt-4 border-t border-white/[0.06] grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1.5">
                  Default From Email
                </label>
                <input
                  type="email"
                  value={config.MAIL_FROM_ADDRESS || ""}
                  onChange={(e) => handleConfigUpdate("MAIL_FROM_ADDRESS", e.target.value)}
                  placeholder="noreply@yourdomain.com"
                  className="w-full bg-[#141824] border border-white/10 rounded-md px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-[#A78BFA]/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                  <span>Default Sender Name (Display Name)</span>
                  <span title="Human name shown in customer inbox (e.g. 'INHALIQ' instead of just raw email address)">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                  </span>
                </label>
                <input
                  type="text"
                  value={config.MAIL_FROM_NAME || ""}
                  onChange={(e) => handleConfigUpdate("MAIL_FROM_NAME", e.target.value)}
                  placeholder="e.g. INHALIQ"
                  className="w-full bg-[#141824] border border-white/10 rounded-md px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#A78BFA]/50 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Minimal Full-Width Sender Routing Table */}
          <div className="bg-[#0f121b] border border-white/[0.08] rounded-md p-6 space-y-4 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-white/[0.06]">
              <div>
                <div className="flex items-center gap-2">
                  <AtSign className="w-4 h-4 text-[#A78BFA]" />
                  <h3 className="text-sm font-semibold text-white">Email Sender Routing</h3>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Optional overrides per notification type. If left empty, emails inherit your default sender above ({defaultFrom}).
                </p>
              </div>
            </div>

            {/* Full Width Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4 w-60">Notification Event</th>
                    <th className="py-3 px-4">From Email</th>
                    <th className="py-3 px-4">
                      <span className="inline-flex items-center gap-1">
                        Display Name
                        <span title="The sender name displayed in customer inboxes (e.g. 'Store Orders')">
                          <HelpCircle className="w-3 h-3 text-slate-500" />
                        </span>
                      </span>
                    </th>
                    <th className="py-3 px-4">Reply-To (Optional)</th>
                    <th className="py-3 px-4 w-12 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-xs">
                  {EVENTS.map((item) => {
                    const Icon = item.icon;
                    const sender = senders[item.key] || { address: "", name: "", reply_to: "" };
                    const hasValue = Boolean(sender.address || sender.name || sender.reply_to);

                    return (
                      <tr key={item.key} className="hover:bg-white/[0.02] transition-colors">
                        {/* Event Name */}
                        <td className="py-3.5 px-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-white/5 text-slate-300">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-white text-xs">{item.name}</div>
                              <div className="text-[11px] text-slate-500 leading-tight">{item.desc}</div>
                            </div>
                          </div>
                        </td>

                        {/* From Email */}
                        <td className="py-3 px-4 align-middle">
                          <input
                            type="email"
                            value={sender.address || ""}
                            onChange={(e) => handleSenderUpdate(item.key, "address", e.target.value)}
                            placeholder={`${item.emailPrefix}@... (or inherit)`}
                            className={`w-full bg-[#141824] border rounded-md px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-[#A78BFA]/50 transition-colors ${
                              sender.address ? "border-amber-500/40 text-amber-300" : "border-white/10"
                            }`}
                          />
                        </td>

                        {/* Display Name */}
                        <td className="py-3 px-4 align-middle">
                          <input
                            type="text"
                            value={sender.name || ""}
                            onChange={(e) => handleSenderUpdate(item.key, "name", e.target.value)}
                            placeholder={`${defaultName} ${item.nameSuffix}`}
                            className="w-full bg-[#141824] border border-white/10 rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#A78BFA]/50 transition-colors"
                          />
                        </td>

                        {/* Reply To */}
                        <td className="py-3 px-4 align-middle">
                          <input
                            type="email"
                            value={sender.reply_to || ""}
                            onChange={(e) => handleSenderUpdate(item.key, "reply_to", e.target.value)}
                            placeholder="support@... (optional)"
                            className="w-full bg-[#141824] border border-white/10 rounded-md px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-[#A78BFA]/50 transition-colors"
                          />
                        </td>

                        {/* Reset button */}
                        <td className="py-3 px-4 text-right align-middle">
                          {hasValue && (
                            <button
                              type="button"
                              onClick={() => handleResetSender(item.key)}
                              title="Reset to inherit default"
                              className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors rounded-md hover:bg-white/5 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
        saveLabel="Save Settings"
        discardLabel="Discard"
        message="Unsaved mail configurations"
      />
    </div>
  );
}
