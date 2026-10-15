"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  UserCog, 
  Plus, 
  Eye, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Mail, 
  Phone, 
  Check, 
  X, 
  Edit, 
  Trash2, 
  Sparkles, 
  ScrollText, 
  Calendar, 
  CheckCircle2, 
  XCircle,
  Sliders,
  CheckSquare,
  Square,
  Crown,
  ArrowUpCircle,
  ArrowDownCircle,
  UserCheck,
  Search,
  RotateCcw
} from "lucide-react";
import { adminApi, ADMIN_PERMISSION_MODULES, PermissionModule } from "@/lib/adminApi";
import { User } from "@/types";
import { formatDate } from "@/lib/utils";
import { useAdminAuthStore } from "@/store/useAdminAuthStore";
import { ScrollableTableCard } from "@/components/admin/ScrollableTableCard";
import { AdminDropdown } from "@/components/admin/AdminDropdown";
import { SuspensionModal, SuspensionPayload } from "@/components/admin/SuspensionModal";
import { ImageUploadAvatar } from "@/components/ui/ImageUploadAvatar";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

export default function AdminStaffPage() {
  const { adminUser } = useAdminAuthStore();
  const isSuperAdmin = adminUser?.role === "super_admin";
  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // View Staff Modal State
  const [viewingStaff, setViewingStaff] = useState<User | null>(null);

  // Suspension Modal State
  const [suspendingStaff, setSuspendingStaff] = useState<User | null>(null);
  const [isSubmittingSuspension, setIsSubmittingSuspension] = useState(false);

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);

  // Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("admin");
  const [inviting, setInviting] = useState(false);

  // Bulk Selection & Deletion State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("staff");
  const [status, setStatus] = useState<string>("active");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>(["products.view", "products.manage", "orders.view", "orders.manage"]);
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deletingStaff, setDeletingStaff] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getStaff();
      setStaffList(data || []);
    } catch (err) {
      toast.error("Failed to load staff accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleOpenCreate = () => {
    setEditingStaff(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setRole("staff");
    setStatus("active");
    setPhone("");
    setAvatar(null);
    setPermissions(["products.view", "products.manage", "orders.view", "orders.manage"]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: User) => {
    if (s.role === "super_admin" && !isSuperAdmin) {
      toast.error("Super Administrator account is untouchable and cannot be modified.");
      return;
    }
    setEditingStaff(s);
    const parts = (s.name || "").trim().split(" ");
    setFirstName(parts[0] || "");
    setLastName(parts.slice(1).join(" ") || "");
    setEmail(s.email);
    setPassword("");
    setRole(s.role);
    setStatus(s.status || "active");
    setPhone(s.phone || "");
    setAvatar(s.avatar || null);
    setPermissions(s.permissions || []);
    setIsModalOpen(true);
  };

  const handlePromote = async (s: User) => {
    if (!isSuperAdmin) {
      toast.error("Only Super Administrators have authority to promote personnel to Admin status.");
      return;
    }
    try {
      const res = await adminApi.promoteStaff(s.id);
      setStaffList(staffList.map((item) => (item.id === s.id ? { ...item, ...res.staff } : item)));
      toast.success(res.message || `Personnel '${s.name}' promoted to Administrator!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to promote staff member.");
    }
  };

  const handleDemote = async (s: User) => {
    if (!isSuperAdmin) {
      toast.error("Only Super Administrators have authority to demote administrators.");
      return;
    }
    if (s.role === "super_admin") {
      toast.error("Super Administrator is untouchable and cannot be demoted.");
      return;
    }
    try {
      const res = await adminApi.demoteStaff(s.id);
      setStaffList(staffList.map((item) => (item.id === s.id ? { ...item, ...res.staff } : item)));
      toast.success(res.message || `Administrator '${s.name}' demoted to Staff.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to demote administrator.");
    }
  };

  const togglePermission = (permId: string) => {
    if (permissions.includes(permId)) {
      setPermissions(permissions.filter((p) => p !== permId));
    } else {
      setPermissions([...permissions, permId]);
    }
  };

  const toggleModulePermissions = (module: PermissionModule) => {
    const modulePermIds = module.permissions.map((p) => p.id);
    const allSelected = modulePermIds.every((id) => permissions.includes(id));

    if (allSelected) {
      // Remove all in this module
      setPermissions(permissions.filter((id) => !modulePermIds.includes(id)));
    } else {
      // Add all missing in this module
      const combined = Array.from(new Set([...permissions, ...modulePermIds]));
      setPermissions(combined);
    }
  };

  // Quick Preset Handlers
  const applyPreset = (preset: "all" | "operations" | "warehouse" | "support" | "catalog" | "none") => {
    if (preset === "all") {
      const allPerms = ADMIN_PERMISSION_MODULES.flatMap((m) => m.permissions.map((p) => p.id));
      setPermissions(allPerms);
    } else if (preset === "operations") {
      setPermissions([
        "products.view", "products.manage", "categories.manage", 
        "inventory.manage", "orders.view", "orders.manage", 
        "customers.view", "customers.manage", "coupons.manage", "reviews.manage", "analytics.view"
      ]);
    } else if (preset === "warehouse") {
      setPermissions(["inventory.manage", "products.view", "orders.view"]);
    } else if (preset === "support") {
      setPermissions(["orders.view", "orders.manage", "customers.view", "customers.manage", "reviews.manage"]);
    } else if (preset === "catalog") {
      setPermissions(["products.view", "products.manage", "categories.manage", "inventory.manage"]);
    } else {
      setPermissions([]);
    }
  };

  const isEditDirty = Boolean(
    editingStaff && (
      (firstName.trim() !== ((editingStaff.name || "").trim().split(" ")[0] || "")) ||
      (lastName.trim() !== ((editingStaff.name || "").trim().split(" ").slice(1).join(" ") || "")) ||
      (email.trim() !== (editingStaff.email || "")) ||
      ((phone.trim() || "") !== (editingStaff.phone || "")) ||
      ((avatar || null) !== (editingStaff.avatar || null)) ||
      (role !== editingStaff.role) ||
      (status !== (editingStaff.status || "active")) ||
      (password.length > 0) ||
      (role === "staff" && JSON.stringify([...permissions].sort()) !== JSON.stringify([...(editingStaff.permissions || [])].sort()))
    )
  );

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaff?.role === "super_admin" && !isSuperAdmin) {
      toast.error("Super Administrator account is untouchable and cannot be modified.");
      return;
    }
    if (editingStaff && !isEditDirty) {
      toast.info("No changes were made.");
      return;
    }
    setSaving(true);

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const payload: any = {
      name: fullName,
      email,
      role: isSuperAdmin ? role : (editingStaff ? editingStaff.role : "staff"),
      status,
      phone: phone || null,
      avatar,
      permissions: role === "staff" ? permissions : [],
    };

    if (password) {
      payload.password = password;
    }

    try {
      if (editingStaff) {
        const res = await adminApi.updateStaff(editingStaff.id, payload);
        setStaffList(staffList.map((s) => (s.id === editingStaff.id ? res.staff : s)));
        if (viewingStaff?.id === editingStaff.id) setViewingStaff(res.staff);
        toast.success(`Updated staff account '${res.staff.name}'`);
      } else {
        const res = await adminApi.createStaff(payload);
        setStaffList([res.staff, ...staffList]);
        toast.success(`Created ${res.staff.role} account '${res.staff.name}'`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save staff account.");
    } finally {
      setSaving(false);
    }
  };

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await adminApi.inviteAdmin({
        email: inviteEmail,
        name: inviteName || undefined,
        role: inviteRole,
      });
      toast.success(res.message || "Invitation sent successfully.");
      setIsInviteModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send invitation.");
    } finally {
      setInviting(false);
    }
  };

  const handleConfirmSuspension = async (payload: SuspensionPayload) => {
    if (!suspendingStaff) return;
    setIsSubmittingSuspension(true);
    try {
      const res = await adminApi.suspendStaff(suspendingStaff.id, payload);
      setStaffList(staffList.map((s) => (s.id === suspendingStaff.id ? res.staff : s)));
      if (viewingStaff?.id === suspendingStaff.id) setViewingStaff(res.staff);
      toast.success(res.message || `Staff '${suspendingStaff.name}' suspended.`);
      setSuspendingStaff(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to suspend staff.");
    } finally {
      setIsSubmittingSuspension(false);
    }
  };

  const handleReactivateStaff = async (staffMember: User) => {
    try {
      const res = await adminApi.reactivateStaff(staffMember.id);
      setStaffList(staffList.map((s) => (s.id === staffMember.id ? res.staff : s)));
      if (viewingStaff?.id === staffMember.id) setViewingStaff(res.staff);
      toast.success(res.message || `Staff '${staffMember.name}' reactivated.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reactivate staff.");
    }
  };

  const handleDeleteStaff = async () => {
    if (!deletingStaff) return;
    setDeleting(true);

    try {
      await adminApi.deleteStaff(deletingStaff.id);
      setStaffList(staffList.filter((s) => s.id !== deletingStaff.id));
      setSelectedIds((prev) => prev.filter((id) => id !== deletingStaff.id));
      if (viewingStaff?.id === deletingStaff.id) setViewingStaff(null);
      toast.success(`Staff account '${deletingStaff.name}' removed.`);
      setDeletingStaff(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete staff account.");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleSelectAll = () => {
    // Only select staff that can be deleted (exclude super_admin and self)
    const deletableIds = filteredStaff
      .filter((s) => s.role !== "super_admin" && s.id !== adminUser?.id)
      .map((s) => s.id);

    if (deletableIds.length > 0 && selectedIds.length === deletableIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(deletableIds);
    }
  };

  const handleToggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const res = await adminApi.bulkDeleteStaff(selectedIds);
      const updated = await adminApi.getStaff();
      setStaffList(updated || []);
      if (viewingStaff && selectedIds.includes(viewingStaff.id)) setViewingStaff(null);
      setSelectedIds([]);
      toast.success(res.message || `Processed staff deletion.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete selected staff.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
    toast.success("Personnel filters reset to default.");
  };

  const filteredStaff = staffList.filter((s) => {
    if (roleFilter !== "all" && s.role !== roleFilter) return false;
    if (statusFilter !== "all" && (s.status || "active") !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = (s.name || "").toLowerCase().includes(q);
      const matchEmail = (s.email || "").toLowerCase().includes(q);
      const matchRole = (s.role || "").toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchRole) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#A78BFA]">
            Access Control & RBAC
          </span>
          <h1 className="text-2xl font-black text-white">Staff & Administrator Directory ({filteredStaff.length})</h1>
        </div>

        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <button
              onClick={() => {
                setInviteEmail("");
                setInviteName("");
                setInviteRole("admin");
                setIsInviteModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-md bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-black flex items-center gap-1.5 transition-all shadow-lg"
            >
              <Mail className="w-4 h-4" /> Invite Admin
            </button>
          )}
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] text-xs font-black flex items-center gap-1.5 transition-all shadow-lg shadow-[#A78BFA]/20"
          >
            <Plus className="w-4 h-4" /> Add Personnel
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-md bg-[#0e121e] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search personnel name, email, or role..."
            className="w-full bg-white/5 border border-white/10 rounded-md pl-9.5 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#A78BFA]/50"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <AdminDropdown
            value={roleFilter}
            onChange={(val) => setRoleFilter(val)}
            options={[
              { value: "all", label: "All Security Roles" },
              { value: "super_admin", label: "Super Admin" },
              { value: "admin", label: "Admin" },
              { value: "staff", label: "Staff" },
            ]}
          />

          <AdminDropdown
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: "all", label: "All Account Statuses" },
              { value: "active", label: "Active" },
              { value: "suspended", label: "Suspended" },
            ]}
          />

          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
            title="Reset personnel filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Staff Table with Scrollable Drag Card */}
      <ScrollableTableCard>
        <table className="w-full text-left text-xs text-slate-300 min-w-[760px]">
          <thead className="bg-white/5 border-b border-white/10 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-3.5 w-10 text-center">
                <AdminCheckbox
                  checked={
                    filteredStaff.filter((s) => s.role !== "super_admin" && s.id !== adminUser?.id).length > 0 &&
                    selectedIds.length === filteredStaff.filter((s) => s.role !== "super_admin" && s.id !== adminUser?.id).length
                  }
                  indeterminate={
                    selectedIds.length > 0 &&
                    selectedIds.length < filteredStaff.filter((s) => s.role !== "super_admin" && s.id !== adminUser?.id).length
                  }
                  onChange={handleToggleSelectAll}
                  title="Select all deletable staff"
                />
              </th>
              <th className="p-3.5">Personnel</th>
              <th className="p-3.5">Role</th>
              <th className="p-3.5">Permissions</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Joined</th>
              <th className="p-3.5 text-center min-w-[160px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  Loading personnel records...
                </td>
              </tr>
            ) : filteredStaff.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                  No personnel matching search or filter criteria.
                </td>
              </tr>
            ) : (
              filteredStaff.map((s: any) => {
                const isSelected = selectedIds.includes(s.id);
                const isProtected = s.role === "super_admin" || s.id === adminUser?.id;
                return (
                  <tr
                    key={s.id}
                    className={`transition-colors ${
                      isSelected
                        ? "bg-[#211B32] border-l-2 border-[#A78BFA]"
                        : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <AdminCheckbox
                        checked={isSelected}
                        disabled={isProtected}
                        onChange={() => handleToggleSelectRow(s.id)}
                        title={isProtected ? "Protected account cannot be selected for deletion" : "Select row"}
                      />
                    </td>
                    <td className="p-3.5 flex items-center gap-3 font-bold text-white">
                    <img
                      src={s.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"}
                      alt={s.name}
                      className="w-8 h-8 rounded-md object-cover bg-slate-900 ring-1 ring-[#A78BFA]/30 shrink-0"
                    />
                    <div>
                      <span className="text-white font-bold block">{s.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{s.email}</span>
                    </div>
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${
                      s.role === "super_admin"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/10"
                        : s.role === "admin"
                        ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30"
                        : "bg-cyan-500/15 text-cyan-300 border border-cyan-400/30"
                    }`}>
                      {s.role === "super_admin" && <Crown className="w-3 h-3 text-purple-400 shrink-0" />}
                      {s.role === "admin" && <ShieldCheck className="w-3 h-3 text-[#A78BFA] shrink-0" />}
                      {s.role === "staff" && <UserCog className="w-3 h-3 text-cyan-400 shrink-0" />}
                      {s.role === "super_admin" ? "Super Admin" : s.role}
                    </span>
                  </td>
                  <td className="p-3.5 text-[11px] text-slate-300 max-w-xs truncate">
                    {s.role === "super_admin" ? (
                      <span className="text-purple-300 font-bold flex items-center gap-1">
                        <Crown className="w-3 h-3 text-purple-400" /> Untouchable Root Access
                      </span>
                    ) : s.role === "admin" ? (
                      <span className="text-[#A78BFA] font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-[#A78BFA]" /> Full Operations Access
                      </span>
                    ) : s.permissions && s.permissions.length > 0 ? (
                      <span className="text-slate-400 font-mono text-[10px]">{s.permissions.length} module permissions</span>
                    ) : (
                      <span className="text-slate-500 italic">Read-only</span>
                    )}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    {s.status === "active" ? (
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        Active
                      </span>
                    ) : s.suspended_until ? (
                      <div className="flex flex-col">
                        <span
                          className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30 cursor-help"
                          title={s.suspension_reason ? `Reason: ${s.suspension_reason}` : undefined}
                        >
                          Suspended (Timed)
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                          Until {formatDate(s.suspended_until)}
                        </span>
                      </div>
                    ) : (
                      <span
                        className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30 cursor-help"
                        title={s.suspension_reason ? `Reason: ${s.suspension_reason}` : undefined}
                      >
                        Suspended (Indefinite)
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-slate-400 whitespace-nowrap">{formatDate(s.created_at)}</td>
                  
                  {/* ICON-ONLY ACTION SYSTEM */}
                  <td className="p-3.5 text-center whitespace-nowrap">
                    {s.role === "super_admin" && !isSuperAdmin ? (
                      /* Protected Super Admin Badge for non-superadmins */
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewingStaff(s)}
                          className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:scale-105 transition-all shadow-sm"
                          title="View Super Admin Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <div 
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-black tracking-wide"
                          title="Super Administrator is permanent and protected from all external modifications"
                        >
                          <Crown className="w-3 h-3 text-purple-400 shrink-0" />
                          <span>Untouchable</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-start gap-1.5 flex-wrap w-[146px] mx-auto">
                        <button
                          onClick={() => setViewingStaff(s)}
                          className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:scale-105 transition-all shadow-sm"
                          title="View Personnel Profile & Clearance"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center bg-[#211B32] hover:bg-[#A78BFA]/20 border border-[#A78BFA]/30 text-[#A78BFA] hover:scale-105 transition-all shadow-sm"
                          title="Edit Personnel & Permissions"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Super Admin Quick Promote to Admin */}
                        {isSuperAdmin && s.role === "staff" && (
                          <button
                            onClick={() => handlePromote(s)}
                            className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:scale-105 transition-all shadow-sm"
                            title="Promote to Administrator (Executive Clearance)"
                          >
                            <ArrowUpCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Super Admin Quick Demote to Staff */}
                        {isSuperAdmin && s.role === "admin" && (
                          <button
                            onClick={() => handleDemote(s)}
                            className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center bg-[#211B32] hover:bg-[#A78BFA]/20 border border-[#A78BFA]/30 text-[#A78BFA] hover:scale-105 transition-all shadow-sm"
                            title="Demote from Administrator to Staff"
                          >
                            <ArrowDownCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Suspension Toggle (Excluded for Super Admin accounts & Self) */}
                        {s.role !== "super_admin" && adminUser?.id !== s.id && (
                          s.status === "active" ? (
                            <button
                              onClick={() => setSuspendingStaff(s)}
                              className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:scale-105 transition-all shadow-sm"
                              title="Suspend Account (Indefinite / Timed)"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivateStaff(s)}
                              className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:scale-105 transition-all shadow-sm"
                              title="Reactivate Account"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}

                        {/* Delete (Excluded for Super Admin accounts & Self) */}
                        {s.role !== "super_admin" && adminUser?.id !== s.id && (
                          <button
                            onClick={() => setDeletingStaff(s)}
                            className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:scale-105 transition-all shadow-sm"
                            title="Delete Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
            )}
          </tbody>
        </table>
      </ScrollableTableCard>

      {/* View Staff Profile & Permissions Drawer */}
      <Sheet open={!!viewingStaff} onOpenChange={(open) => { if (!open) setViewingStaff(null); }}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:w-[480px] md:w-[540px] sm:!max-w-[540px] max-w-full bg-[#0b0e17] border-l border-white/[0.08] p-0 flex flex-col justify-between shadow-2xl text-slate-100 overflow-hidden"
        >
          {viewingStaff && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Compact Header: h-12 */}
              <div className="h-12 px-6 border-b border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0 pr-3">
                  <SheetTitle className="text-xs font-semibold text-white tracking-wide shrink-0">
                    Personnel Profile
                  </SheetTitle>
                  <span className="text-slate-600 text-xs shrink-0">·</span>
                  <span className="text-xs text-slate-400 truncate max-w-[180px]">
                    {viewingStaff.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingStaff(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs">
                {/* Profile Card */}
                <div className="p-4 rounded-md bg-white/[0.02] border border-white/5 flex items-center gap-3.5">
                  <img
                    src={viewingStaff.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"}
                    alt={viewingStaff.name}
                    className="w-11 h-11 rounded-md object-cover ring-1 ring-white/10 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-white truncate">{viewingStaff.name}</h3>
                    <p className="text-xs text-slate-400 truncate">{viewingStaff.email}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium uppercase shrink-0 ${
                    viewingStaff.status === "active"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}>
                    {viewingStaff.status || "Active"}
                  </span>
                </div>

                {viewingStaff.role === "super_admin" && (
                  <div className="p-3 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs flex items-center gap-2">
                    <Crown className="w-4 h-4 text-purple-400 shrink-0" />
                    <span><b>Super Administrator:</b> Master authority account with immutable clearance across all modules.</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-md bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">
                      Role Clearance
                    </span>
                    <span className="text-xs font-semibold uppercase text-slate-200 flex items-center gap-1.5">
                      {viewingStaff.role === "super_admin" && <Crown className="w-3.5 h-3.5 text-purple-400" />}
                      {viewingStaff.role === "super_admin" ? "Super Admin" : viewingStaff.role}
                    </span>
                  </div>
                  <div className="p-3 rounded-md bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">
                      Active Permissions
                    </span>
                    <span className="text-xs font-semibold text-slate-200 block">
                      {viewingStaff.role === "super_admin" ? "All Privileges (Master)" : `${viewingStaff.permissions?.length || 0} permissions`}
                    </span>
                  </div>
                </div>

                {/* Permissions Matrix Inspection */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                    Module Permission Matrix
                  </span>
                  
                  <div className="space-y-2.5">
                    {ADMIN_PERMISSION_MODULES.map((module) => (
                      <div key={module.name} className="p-3 rounded-md bg-white/[0.02] border border-white/5 space-y-2">
                        <span className="text-xs font-semibold text-slate-200 block">
                          {module.name}
                        </span>
                        <div className="space-y-1.5">
                          {module.permissions.map((p) => {
                            const hasPerm = viewingStaff.role === "super_admin" || viewingStaff.role === "admin" || (viewingStaff.permissions && viewingStaff.permissions.includes(p.id));
                            return (
                              <div key={p.id} className="flex items-center justify-between text-xs">
                                <span className="text-slate-300">{p.name}</span>
                                {hasPerm ? (
                                  <span className="text-emerald-400 font-medium flex items-center gap-1 text-[11px]">
                                    <CheckCircle2 className="w-3 h-3" /> Enabled
                                  </span>
                                ) : (
                                  <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                                    <XCircle className="w-3 h-3" /> Restricted
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Compact Footer: h-12 */}
              <div className="h-12 px-6 border-t border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
                <Link
                  href={`/admin/audit-logs?search=${viewingStaff.name}`}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ScrollText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Audit Logs</span>
                </Link>

                {(! (viewingStaff.role === "super_admin" && !isSuperAdmin)) && (
                  <button
                    type="button"
                    onClick={() => {
                      const s = viewingStaff;
                      setViewingStaff(null);
                      handleOpenEdit(s);
                    }}
                    className="h-8 px-4 rounded-md bg-white hover:bg-slate-200 text-slate-950 font-semibold text-xs transition cursor-pointer shadow-sm"
                  >
                    Modify Personnel
                  </button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Create / Edit Staff Slide-over Drawer */}
      <Sheet open={isModalOpen} onOpenChange={(open) => { if (!open) setIsModalOpen(false); }}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:w-[500px] md:w-[560px] sm:!max-w-[560px] max-w-full bg-[#0b0e17] border-l border-white/[0.08] p-0 flex flex-col justify-between shadow-2xl text-slate-100 overflow-hidden"
        >
          <form onSubmit={handleSaveStaff} className="flex flex-col h-full overflow-hidden">
            {/* Compact Header: h-12 */}
            <div className="h-12 px-6 border-b border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0 pr-3">
                <SheetTitle className="text-xs font-semibold text-white tracking-wide shrink-0">
                  {editingStaff ? "Modify Personnel" : "Provision Personnel"}
                </SheetTitle>
                <span className="text-slate-600 text-xs shrink-0">·</span>
                <span className="text-xs text-slate-400 truncate">
                  {editingStaff ? editingStaff.name : "Staff Administration & RBAC"}
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
              <ImageUploadAvatar
                value={avatar}
                onChange={(val) => setAvatar(val)}
                name={`${firstName} ${lastName}`.trim() || "Personnel"}
                size="md"
                label="Personnel Profile Photo"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">
                    First Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Rachel"
                    className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Sterling"
                    className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">Official Email <span className="text-rose-400">*</span></label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rachel@store.test"
                    className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">
                    Password {editingStaff && "(Leave blank to keep)"}
                  </label>
                  <PasswordInput
                    required={!editingStaff}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    inputClassName="h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white focus:border-white/20 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">
                    System Role {!isSuperAdmin && "(Locked)"}
                  </label>
                  <AdminDropdown
                    value={role}
                    onChange={(val) => {
                      if (!isSuperAdmin) {
                        toast.error("Only Super Administrators can change personnel system roles.");
                        return;
                      }
                      setRole(val);
                    }}
                    className="w-full"
                    buttonClassName="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white"
                    options={
                      isSuperAdmin
                        ? [
                            { value: "staff", label: "Staff Member (Custom RBAC)" },
                            { value: "admin", label: "Operational Admin (Full Access)" },
                            ...(editingStaff?.role === "super_admin"
                              ? [{ value: "super_admin", label: "Super Administrator (Master)" }]
                              : []),
                          ]
                        : [
                            { value: role, label: role === "super_admin" ? "Super Administrator (Protected)" : role === "admin" ? "Operational Admin" : "Staff Member" },
                          ]
                    }
                  />
                  {!isSuperAdmin && (
                    <span className="text-[10px] text-amber-400/80 mt-1 block">
                      Super Administrator clearance required to change roles.
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">Account Status</label>
                  <AdminDropdown
                    value={status}
                    onChange={(val) => setStatus(val)}
                    className="w-full"
                    buttonClassName="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white"
                    options={[
                      { value: "active", label: "Active" },
                      { value: "suspended", label: "Suspended" },
                    ]}
                  />
                </div>
              </div>

              {/* Dynamic Modular Staff Permissions Matrix */}
              {role === "staff" ? (
                <div className="space-y-3 pt-3 border-t border-white/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">
                        Access Control Matrix ({permissions.length} active)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Configure granular feature permissions or apply quick presets.
                      </span>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => applyPreset("all")}
                        className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-200 text-[10px] font-medium border border-white/10 cursor-pointer"
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("operations")}
                        className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-medium border border-white/10 cursor-pointer"
                      >
                        Ops Manager
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("warehouse")}
                        className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-medium border border-white/10 cursor-pointer"
                      >
                        Warehouse
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("support")}
                        className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-medium border border-white/10 cursor-pointer"
                      >
                        Support
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("none")}
                        className="px-2 py-0.5 rounded bg-white/5 hover:bg-rose-500/20 text-rose-300 text-[10px] font-medium border border-white/10 cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Modules Accordion Cards */}
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {ADMIN_PERMISSION_MODULES.map((module) => {
                      const modulePermIds = module.permissions.map((p) => p.id);
                      const allSelected = modulePermIds.every((id) => permissions.includes(id));

                      return (
                        <div
                          key={module.name}
                          className="p-3 rounded-md bg-white/[0.02] border border-white/5 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold text-slate-200 block">
                                {module.name}
                              </span>
                              <span className="text-[10px] text-slate-400">{module.description}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleModulePermissions(module)}
                              className="text-[10px] font-medium text-slate-400 hover:text-white transition cursor-pointer"
                            >
                              {allSelected ? "Deselect All" : "Select All"}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/5">
                            {module.permissions.map((p) => {
                              const isChecked = permissions.includes(p.id);
                              return (
                                <label
                                  key={p.id}
                                  className={`p-2 rounded-md border flex items-start gap-2 cursor-pointer transition ${
                                    isChecked
                                      ? "bg-white/10 border-white/20 text-white shadow-xs"
                                      : "bg-white/[0.01] border-white/5 text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                                  }`}
                                >
                                  <AdminCheckbox
                                    checked={isChecked}
                                    onChange={() => togglePermission(p.id)}
                                    className="mt-0.5"
                                  />
                                  <div>
                                    <span className="font-medium text-xs block leading-none">{p.name}</span>
                                    <span className="text-[10px] text-slate-400 mt-1 block leading-tight">
                                      {p.description}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-md bg-white/[0.02] border border-white/5 text-xs text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-[#A78BFA]" />
                  <span>The <b>{role.toUpperCase()}</b> role automatically inherits complete privileges across all modules.</span>
                </div>
              )}
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
                disabled={saving || (editingStaff ? !isEditDirty : false)}
                className="h-8 px-4 rounded-md bg-white hover:bg-slate-200 text-slate-950 font-semibold text-xs transition cursor-pointer disabled:opacity-50 shadow-sm"
                title={editingStaff && !isEditDirty ? "No changes made to personnel profile or permissions" : undefined}
              >
                {saving ? "Saving..." : editingStaff ? "Save Permissions" : "Create Personnel"}
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Suspension Modal for Staff */}
      {suspendingStaff && (
        <SuspensionModal
          isOpen={!!suspendingStaff}
          onClose={() => setSuspendingStaff(null)}
          onConfirm={handleConfirmSuspension}
          targetName={suspendingStaff.name}
          targetEmail={suspendingStaff.email}
          targetType="staff"
          isSubmitting={isSubmittingSuspension}
        />
      )}

      {/* Delete Modal */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setDeletingStaff(null)} className="fixed inset-0 bg-black/80 backdrop-blur-sm" />

          <div className="relative w-full max-w-md rounded-md bg-[#0e121e] border border-rose-500/30 p-6 z-10 space-y-4 text-xs">
            <h3 className="text-base font-black text-white">Delete Personnel</h3>
            <p className="text-slate-300">
              Are you sure you want to terminate administrative access for <span className="font-bold text-white">{deletingStaff.name}</span>?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStaff(null)}
                className="px-4 py-2 rounded-md text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteStaff}
                className="px-5 py-2.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-md"
              >
                {deleting ? "Deleting..." : "Confirm Termination"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Admin Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsInviteModalOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm" />

          <div className="relative w-full max-w-md rounded-md bg-[#0e121e] border border-purple-500/30 p-6 z-10 space-y-4 text-xs">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-400" />
              Invite Administrator
            </h3>
            <p className="text-slate-300">
              Send an email invitation. The recipient will receive a secure activation link to set their password and join the staff directory.
            </p>

            <form onSubmit={handleInviteAdmin} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Name (Optional)</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Email Address <span className="text-rose-400">*</span></label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">System Role</label>
                <AdminDropdown
                  value={inviteRole}
                  onChange={(val) => setInviteRole(val)}
                  className="w-full"
                  buttonClassName="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white"
                  options={[
                    { value: "admin", label: "Admin (Full Operations)" },
                    { value: "staff", label: "Staff Member (Custom RBAC)" },
                    { value: "super_admin", label: "Super Administrator (Master)" },
                  ]}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-md text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-5 py-2 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {inviting ? "Sending..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={filteredStaff.filter((s) => s.role !== "super_admin" && s.id !== adminUser?.id).length}
        itemName="personnel"
        isDeleting={isBulkDeleting}
        onClearSelection={() => setSelectedIds([])}
        onSelectAll={handleToggleSelectAll}
        onConfirmDelete={handleBulkDelete}
      />
    </div>
  );
}
