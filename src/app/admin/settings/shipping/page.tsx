"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  Truck, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Check, 
  RotateCcw, 
  Loader2, 
  ShieldCheck, 
  Info,
  Clock,
  DollarSign,
  X
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { ShippingZone } from "@/types";
import { SettingsNavTabs } from "@/components/admin/settings/SettingsNavTabs";
import { AdminPageHeader, AdminEmptyState, AdminSaveBar } from "@/components/admin/ui";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

export default function AdminShippingSettingsPage() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [initialZones, setInitialZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add / Edit Zone Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [zoneId, setZoneId] = useState("");
  const [zoneName, setZoneName] = useState("");
  const [rate, setRate] = useState("60");
  const [duration, setDuration] = useState("24-48 Hours");
  const [freeThreshold, setFreeThreshold] = useState("3000");
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(true);
  const [savedThreshold, setSavedThreshold] = useState("3000");
  const [isActive, setIsActive] = useState(true);
  const [isTogglingFreeShipping, setIsTogglingFreeShipping] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getExtendedSettings();
      const loaded = res.shipping_zones || [];
      setZones(loaded);
      setInitialZones(loaded);
    } catch (err) {
      toast.error("Failed to load shipping settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const isDirty = useMemo(() => {
    return JSON.stringify(zones) !== JSON.stringify(initialZones);
  }, [zones, initialZones]);

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
    setZones(initialZones);
    toast.info("Unsaved changes discarded.");
  };

  const handleOpenCreate = () => {
    setEditingIndex(null);
    setZoneId(`zone_${Date.now()}`);
    setZoneName("");
    setRate("60");
    setDuration("24-48 Hours");
    setFreeThreshold("3000");
    setSavedThreshold("3000");
    setFreeShippingEnabled(false);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (index: number) => {
    const z = zones[index];
    setEditingIndex(index);
    setZoneId(z.id);
    setZoneName(z.name);
    setRate(String(z.rate));
    setDuration(z.duration);
    const hasFree = Number(z.free_threshold) > 0;
    setFreeShippingEnabled(hasFree);
    const thresholdVal = hasFree ? String(z.free_threshold) : "3000";
    setFreeThreshold(thresholdVal);
    setSavedThreshold(thresholdVal);
    setIsActive(z.is_active);
    setIsModalOpen(true);
  };

  const handleToggleModalFreeShipping = async () => {
    const nextState = !freeShippingEnabled;
    setFreeShippingEnabled(nextState);

    const parsedCurrent = parseFloat(freeThreshold);
    const fallback = parseFloat(savedThreshold) || 3000;
    const thresholdToUse = parsedCurrent > 0 ? parsedCurrent : fallback;
    const newThreshold = nextState ? thresholdToUse : 0;

    if (nextState) {
      setFreeThreshold(String(thresholdToUse));
    }

    // Immediately persist to backend if editing an existing zone
    if (editingIndex !== null && zones[editingIndex]) {
      setIsTogglingFreeShipping(true);
      const updatedZone: ShippingZone = {
        ...zones[editingIndex],
        free_threshold: newThreshold,
      };
      const updatedZones = [...zones];
      updatedZones[editingIndex] = updatedZone;
      setZones(updatedZones);

      try {
        await adminApi.updateSettingsGroup("shipping_zones", updatedZones);
        setInitialZones(updatedZones);
        if (nextState) {
          toast.success(`Free shipping enabled for ${zones[editingIndex].name} (Over ৳${thresholdToUse.toLocaleString()})`);
        } else {
          toast.success(`Free shipping disabled for ${zones[editingIndex].name}`);
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to update free shipping status.");
      } finally {
        setIsTogglingFreeShipping(false);
      }
    } else {
      if (nextState) {
        toast.info(`Free shipping enabled for new zone (Over ৳${thresholdToUse.toLocaleString()})`);
      } else {
        toast.info("Free shipping disabled for new zone.");
      }
    }
  };

  const handleToggleRowFreeShipping = async (index: number) => {
    const target = zones[index];
    if (!target) return;

    const isCurrentlyEnabled = target.free_threshold > 0;
    const nextEnabled = !isCurrentlyEnabled;

    const fallbackThreshold = 3000;
    const restoredThreshold = target.free_threshold > 0 ? target.free_threshold : fallbackThreshold;
    const newThreshold = nextEnabled ? restoredThreshold : 0;

    const updatedZone: ShippingZone = {
      ...target,
      free_threshold: newThreshold,
    };

    const updatedZones = [...zones];
    updatedZones[index] = updatedZone;
    setZones(updatedZones);

    try {
      await adminApi.updateSettingsGroup("shipping_zones", updatedZones);
      setInitialZones(updatedZones);
      if (nextEnabled) {
        toast.success(`Free shipping enabled for ${target.name} (Over ৳${restoredThreshold.toLocaleString()})`);
      } else {
        toast.success(`Free shipping disabled for ${target.name}`);
      }
    } catch (err: any) {
      setZones(zones);
      toast.error(err.response?.data?.message || "Failed to update free shipping status.");
    }
  };

  const handleDeleteZone = async (index: number) => {
    const target = zones[index];
    const updated = zones.filter((_, idx) => idx !== index);
    setZones(updated);
    try {
      await adminApi.updateSettingsGroup("shipping_zones", updated);
      setInitialZones(updated);
      toast.success(`Shipping zone "${target?.name || ""}" removed.`);
    } catch (err: any) {
      toast.info("Zone removed from draft list. Click 'Save Changes' to persist.");
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim()) {
      toast.error("Zone name is required.");
      return;
    }

    const finalThreshold = freeShippingEnabled ? (parseFloat(freeThreshold) || 0) : 0;

    const item: ShippingZone = {
      id: zoneId || `zone_${Date.now()}`,
      name: zoneName.trim(),
      rate: parseFloat(rate) || 0,
      duration: duration.trim() || "2-3 Days",
      free_threshold: finalThreshold,
      is_active: isActive,
    };

    let updated: ShippingZone[];
    if (editingIndex !== null) {
      updated = [...zones];
      updated[editingIndex] = item;
    } else {
      updated = [...zones, item];
    }
    setZones(updated);
    setIsModalOpen(false);

    try {
      await adminApi.updateSettingsGroup("shipping_zones", updated);
      setInitialZones(updated);
      toast.success("Shipping zone saved successfully.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Zone updated in draft list. Click 'Save Changes' to retry.");
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await adminApi.updateSettingsGroup("shipping_zones", zones);
      setInitialZones(zones);
      toast.success("Shipping zones successfully updated & saved.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save shipping zones.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        title="Settings & System Studio"
        subtitle="Manage shipping zones, delivery tiers, and free shipping triggers."
        breadcrumbs={[
          { label: "Settings", href: "/admin/settings" },
          { label: "Shipping Zones", href: "/admin/settings/shipping" },
        ]}
        actions={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Shipping Zone</span>
          </button>
        }
      />

      <SettingsNavTabs />

      {/* Content Container */}
      <div className="bg-[#0f121b] border border-white/[0.08] rounded-md p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#A78BFA]" />
              Zone-Based Delivery Rates & Transit Windows
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              These rates automatically apply to customer orders and calculate shipping totals at checkout.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30 hover:bg-[#A78BFA]/20 transition-all cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>New Zone</span>
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-[#161a26] rounded-md animate-pulse" />
            ))}
          </div>
        ) : zones.length === 0 ? (
          <AdminEmptyState
            title="No Shipping Zones Configured"
            description="Create your first shipping territory (e.g. Inside Dhaka, Outside Dhaka)."
            icon={Truck}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Zone Territory Name</th>
                  <th className="py-3 px-4">Base Rate (BDT)</th>
                  <th className="py-3 px-4">Estimated Transit Window</th>
                  <th className="py-3 px-4">Free Shipping Threshold</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs text-slate-300">
                {zones.map((zone, index) => (
                  <tr key={zone.id || index} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {zone.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#A78BFA]">
                      ৳ {zone.rate.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 flex items-center gap-1.5 mt-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{zone.duration}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {zone.free_threshold > 0 ? (
                        <span className="font-mono text-emerald-400 font-semibold">
                          Over ৳ {zone.free_threshold.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium">Disabled</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          zone.is_active
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-700/30 text-slate-400 border border-slate-700/50"
                        }`}
                      >
                        {zone.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(index)}
                          className="p-1.5 text-slate-400 hover:text-[#A78BFA] hover:bg-white/5 rounded-md transition-colors cursor-pointer"
                          title="Edit Zone"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteZone(index)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-md transition-colors cursor-pointer"
                          title="Delete Zone"
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
      </div>

      {/* Add / Edit Shipping Zone Slide-over Drawer */}
      <Sheet open={isModalOpen} onOpenChange={(open) => { if (!open) setIsModalOpen(false); }}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:w-[480px] md:w-[520px] sm:!max-w-[520px] max-w-full bg-[#0b0e17] border-l border-white/[0.08] p-0 flex flex-col justify-between shadow-2xl text-slate-100 overflow-hidden"
        >
          <form onSubmit={handleModalSubmit} className="flex flex-col h-full overflow-hidden">
            {/* Compact Header: h-12 */}
            <div className="h-12 px-6 border-b border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0 pr-3">
                <SheetTitle className="text-xs font-semibold text-white tracking-wide shrink-0">
                  {editingIndex !== null ? "Edit Shipping Zone" : "New Shipping Zone"}
                </SheetTitle>
                <span className="text-slate-600 text-xs shrink-0">·</span>
                <span className="text-xs text-slate-400 truncate">
                  {editingIndex !== null ? zoneName : "Fulfillment Territory Rate"}
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
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Territory Name <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Inside Dhaka Metro, Outside Dhaka"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none transition"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">Base Shipping Fee (৳) <span className="text-rose-400">*</span></label>
                  <input
                    type="number"
                    step="1"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none transition font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">Estimated Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 24-48 Hours, 3-5 Days"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Free Shipping Section */}
              <div className="p-3.5 rounded-md bg-white/[0.02] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-white block">Free Shipping Perk</span>
                    <span className="text-[11px] text-slate-400 block">Waive shipping cost for orders exceeding a minimum amount</span>
                  </div>
                  <Switch
                    size="sm"
                    checked={freeShippingEnabled}
                    onCheckedChange={handleToggleModalFreeShipping}
                    disabled={isTogglingFreeShipping}
                    title={freeShippingEnabled ? "Click to disable free shipping" : "Click to enable free shipping"}
                  />
                </div>
                {freeShippingEnabled && (
                  <div className="space-y-1.5 pt-1 border-t border-white/5">
                    <label className="text-xs font-medium text-slate-300 block">Order Value Threshold (৳)</label>
                    <input
                      type="number"
                      step="100"
                      min="1"
                      value={freeThreshold}
                      onChange={(e) => {
                        setFreeThreshold(e.target.value);
                        if (parseFloat(e.target.value) > 0) {
                          setSavedThreshold(e.target.value);
                        }
                      }}
                      placeholder="e.g. 3000"
                      className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none transition font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="p-3 rounded-md bg-white/[0.02] border border-white/5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <AdminCheckbox
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <div>
                    <span className="text-xs font-medium text-white block">Active Zone</span>
                    <span className="text-[11px] text-slate-400 block">Available for customer selection during checkout</span>
                  </div>
                </label>
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
                Confirm Zone
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
        saveLabel="Save Changes"
        discardLabel="Discard"
        message="Unsaved shipping zones"
      />
    </div>
  );
}
