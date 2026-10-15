"use client";

import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  KeyRound, 
  Phone, 
  Mail, 
  Save, 
  Lock, 
  X, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  Check,
  RotateCcw
} from "lucide-react";
import { useAdminAuthStore } from "@/store/useAdminAuthStore";
import { adminApi, ADMIN_PERMISSION_MODULES } from "@/lib/adminApi";
import { ImageUploadAvatar } from "@/components/ui/ImageUploadAvatar";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { AdminSaveBar } from "@/components/admin/ui";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";

export default function AdminProfilePage() {
  const { adminUser, updateAdminUser } = useAdminAuthStore();

  // Basic Profile Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState(adminUser?.phone || "");
  const [avatar, setAvatar] = useState<string | null>(adminUser?.avatar || null);
  const [saving, setSaving] = useState(false);

  // Email change rightside drawer state
  const [showEmailDrawer, setShowEmailDrawer] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [confirmingEmail, setConfirmingEmail] = useState(false);

  // Change password rightside drawer state
  const [showPasswordDrawer, setShowPasswordDrawer] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Initialize/sync from adminUser
  useEffect(() => {
    if (adminUser) {
      const parts = (adminUser.name || "").trim().split(" ");
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
      setPhone(adminUser.phone || "");
      setAvatar(adminUser.avatar || null);
    }
  }, [adminUser]);

  const originalParts = (adminUser?.name || "").trim().split(" ");
  const originalFirst = originalParts[0] || "";
  const originalLast = originalParts.slice(1).join(" ") || "";

  // Track if basic details have been modified
  const hasUnsavedChanges = 
    firstName !== originalFirst ||
    lastName !== originalLast ||
    phone !== (adminUser?.phone || "") ||
    avatar !== (adminUser?.avatar || null);

  const handleDiscardChanges = () => {
    if (!hasUnsavedChanges || !adminUser) return;
    setFirstName(originalFirst);
    setLastName(originalLast);
    setPhone(adminUser.phone || "");
    setAvatar(adminUser.avatar || null);
    toast.info("Unsaved profile changes reverted.");
  };

  // Main Profile Details Save (Name, Phone, Avatar)
  const handleMainFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!hasUnsavedChanges) {
      toast.info("No changes to save.");
      return;
    }

    if (!firstName.trim()) {
      toast.error("First name is required.");
      return;
    }

    setSaving(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const payload: any = {
        name: fullName,
        phone: phone || null,
        avatar: avatar,
      };

      const res = await adminApi.updateProfile(payload);
      updateAdminUser(res.user);
      toast.success("Profile details updated successfully.");
    } catch (err: any) {
      const msg = 
        err.response?.data?.errors?.name?.[0] || 
        err.response?.data?.errors?.phone?.[0] || 
        err.response?.data?.message || 
        "Failed to update profile.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Confirm email change with password in rightside drawer
  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = newEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      toast.error("Please enter a new email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (trimmedEmail === adminUser?.email?.trim().toLowerCase()) {
      toast.error("The new email must be different from your current email.");
      return;
    }

    if (!emailCurrentPassword) {
      toast.error("Please enter your current password to authorize this change.");
      return;
    }

    setConfirmingEmail(true);
    try {
      const res = await adminApi.updateProfile({
        email: trimmedEmail,
        current_password: emailCurrentPassword,
      });

      updateAdminUser(res.user);
      setShowEmailDrawer(false);
      setNewEmail("");
      setEmailCurrentPassword("");
      toast.success(`Admin email successfully changed to ${trimmedEmail}`);
    } catch (err: any) {
      const msg = 
        err.response?.data?.errors?.current_password?.[0] || 
        err.response?.data?.errors?.email?.[0] || 
        err.response?.data?.message || 
        "Failed to update email address.";
      toast.error(msg);
    } finally {
      setConfirmingEmail(false);
    }
  };

  // Password update handler in rightside drawer
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pwdCurrent) {
      toast.error("Please enter your current password.");
      return;
    }

    if (!pwdNew) {
      toast.error("Please enter a new password.");
      return;
    }

    if (pwdNew.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }

    if (pwdNew !== pwdConfirm) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await adminApi.updateProfile({
        current_password: pwdCurrent,
        password: pwdNew,
        password_confirmation: pwdConfirm,
      });

      updateAdminUser(res.user);
      setShowPasswordDrawer(false);
      setPwdCurrent("");
      setPwdNew("");
      setPwdConfirm("");
      toast.success("Password changed successfully.");
    } catch (err: any) {
      const msg = 
        err.response?.data?.errors?.current_password?.[0] || 
        err.response?.data?.errors?.password?.[0] || 
        err.response?.data?.message || 
        "Failed to change password.";
      toast.error(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-white tracking-tight">Admin Profile</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              {adminUser?.role === "super_admin" ? "Super Admin" : (adminUser?.role || "Admin").toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Manage your personal information, avatar, and security settings.</p>
        </div>
      </div>

      {/* Main Profile Details Form */}
      <form id="admin-profile-form" onSubmit={handleMainFormSubmit} className="space-y-6">
        {/* Section 1: Personal Information */}
        <div className="p-6 sm:p-7 rounded-md bg-[#0c0f17] border border-white/[0.08] shadow-sm space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-white">Personal Information</h2>
            <p className="text-xs text-slate-400 mt-0.5">Update your photo and administrator contact details.</p>
          </div>

          <div className="pt-1 pb-1">
            <ImageUploadAvatar
              value={avatar}
              onChange={(newVal) => setAvatar(newVal)}
              name={`${firstName} ${lastName}`.trim() || adminUser?.name || "Admin"}
              size="lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                First Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-md px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#A78BFA]/50 focus:ring-1 focus:ring-[#A78BFA]/20 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-md px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#A78BFA]/50 focus:ring-1 focus:ring-[#A78BFA]/20 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Email Address
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    readOnly
                    value={adminUser?.email || ""}
                    onClick={() => {
                      setNewEmail("");
                      setEmailCurrentPassword("");
                      setShowEmailDrawer(true);
                    }}
                    placeholder="admin@example.com"
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-md pl-10 pr-3.5 py-2.5 text-sm text-slate-200 cursor-pointer focus:outline-none hover:bg-white/[0.05] hover:border-white/[0.12] transition-all"
                    title="Click to change email address via drawer"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewEmail("");
                    setEmailCurrentPassword("");
                    setShowEmailDrawer(true);
                  }}
                  className="px-3.5 py-2.5 rounded-md bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-200 hover:text-white transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-[#A78BFA]" />
                  <span>Change Email</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Primary sign-in credential. Managed securely via authorization drawer.
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-md pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#A78BFA]/50 focus:ring-1 focus:ring-[#A78BFA]/20 transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Optional contact number for administrator alerts.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Password & Security */}
        <div className="p-6 sm:p-7 rounded-md bg-[#0c0f17] border border-white/[0.08] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 text-[#A78BFA]">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Password & Security</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  •••••••••••• · Keep your administrator account protected
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setPwdCurrent("");
                setPwdNew("");
                setPwdConfirm("");
                setShowPasswordDrawer(true);
              }}
              className="px-4 py-2 rounded-md bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-200 hover:text-white transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span>Change Password</span>
            </button>
          </div>
        </div>

        {/* Section 3: Role & Access Privileges */}
        <div className="p-6 sm:p-7 rounded-md bg-[#0c0f17] border border-white/[0.08] shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Role & Access Privileges</h2>
            <p className="text-xs text-slate-400 mt-0.5">Permissions and administrative capabilities assigned to your account.</p>
          </div>

          {adminUser?.role === "super_admin" || adminUser?.role === "admin" ? (
            <div className="flex items-start gap-3.5 p-4 rounded-md bg-white/[0.02] border border-white/[0.06]">
              <div className="p-2 rounded-md bg-[#211B32] text-[#A78BFA] shrink-0 border border-[#A78BFA]/30">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white block">Full Administrator Authority</span>
                <span className="text-xs text-slate-400 mt-0.5 block">
                  Unrestricted access across catalog, orders, customers, financial records, branding, and system settings.
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ADMIN_PERMISSION_MODULES.map((mod) => (
                <div key={mod.name} className="p-3.5 rounded-md bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <span className="text-xs font-semibold text-slate-200 block">{mod.name}</span>
                  <div className="space-y-1">
                    {mod.permissions.map((p) => {
                      const has = adminUser?.permissions?.includes(p.id);
                      return (
                        <div key={p.id} className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">{p.name}</span>
                          <span className={`text-[11px] font-medium ${has ? "text-emerald-400" : "text-slate-500"}`}>
                            {has ? "Granted" : "Restricted"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>

      {/* Rightside Drawer 1: Change Email Address */}
      <Sheet open={showEmailDrawer} onOpenChange={setShowEmailDrawer}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:w-[460px] sm:!max-w-[460px] max-w-full bg-[#0b0e17] border-l border-white/[0.08] p-0 flex flex-col justify-between shadow-2xl text-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/[0.08] flex items-start justify-between gap-4 bg-[#0e121e]/80 shrink-0">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-md bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA] shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <SheetTitle className="text-base font-semibold text-white">Change Email Address</SheetTitle>
                <SheetDescription className="text-xs text-slate-400 mt-1">
                  Update the login and notification email for your administrator account.
                </SheetDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowEmailDrawer(false);
                setNewEmail("");
                setEmailCurrentPassword("");
              }}
              className="w-8 h-8 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <form id="email-change-drawer-form" onSubmit={handleEmailUpdate} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Notice Callout */}
            <div className="p-4 rounded-md bg-amber-500/[0.06] border border-amber-500/20 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200/90 leading-relaxed">
                <span className="font-semibold text-amber-300 block mb-0.5">Authorization Required</span>
                Changing your administrator email will change the email address you use to sign in. Enter your current password below to authorize this security update.
              </div>
            </div>

            {/* Current Email Display */}
            <div className="p-3.5 rounded-md bg-white/[0.02] border border-white/[0.06] space-y-1">
              <span className="text-[11px] font-medium text-slate-400 block">Current Registered Email</span>
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>{adminUser?.email || "No email registered"}</span>
              </div>
            </div>

            {/* New Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">
                New Email Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="new-admin@example.com"
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-md pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#A78BFA]/50 focus:ring-1 focus:ring-[#A78BFA]/20 transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                You will receive all security alerts and notifications here.
              </p>
            </div>

            {/* Current Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">
                Current Password <span className="text-rose-400">*</span>
              </label>
              <PasswordInput
                required
                value={emailCurrentPassword}
                onChange={(e) => setEmailCurrentPassword(e.target.value)}
                placeholder="Enter current password to verify"
                inputClassName="bg-white/[0.04] border border-white/[0.1] rounded-md py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-[#A78BFA]/50 transition-colors"
              />
              <p className="text-[11px] text-slate-500">
                Enter your existing password to verify account ownership.
              </p>
            </div>
          </form>

          {/* Drawer Footer */}
          <div className="p-5 border-t border-white/[0.08] bg-[#090c15]/80 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowEmailDrawer(false);
                setNewEmail("");
                setEmailCurrentPassword("");
              }}
              className="px-4 py-2 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="email-change-drawer-form"
              disabled={confirmingEmail || !newEmail.trim() || !emailCurrentPassword}
              className="px-4 py-2 rounded-md text-xs font-semibold bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#A78BFA]/20 font-bold"
            >
              {confirmingEmail ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating Email...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Email</span>
                </>
              )}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Rightside Drawer 2: Change Password */}
      <Sheet open={showPasswordDrawer} onOpenChange={setShowPasswordDrawer}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:w-[460px] sm:!max-w-[460px] max-w-full bg-[#0b0e17] border-l border-white/[0.08] p-0 flex flex-col justify-between shadow-2xl text-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/[0.08] flex items-start justify-between gap-4 bg-[#0e121e]/80 shrink-0">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-md bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA] shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <SheetTitle className="text-base font-semibold text-white">Change Password</SheetTitle>
                <SheetDescription className="text-xs text-slate-400 mt-1">
                  Update your administrator account login password.
                </SheetDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowPasswordDrawer(false);
                setPwdCurrent("");
                setPwdNew("");
                setPwdConfirm("");
              }}
              className="w-8 h-8 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <form id="password-change-drawer-form" onSubmit={handlePasswordUpdate} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Notice Callout */}
            <div className="p-4 rounded-md bg-white/[0.02] border border-white/[0.06] flex items-start gap-3">
              <Lock className="w-4 h-4 text-[#A78BFA] shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                <span className="font-semibold text-white block mb-0.5">Password Security</span>
                Ensure your password is at least 8 characters long. After changing your password, your current active browser session will stay authenticated.
              </div>
            </div>

            {/* Current Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">
                Current Password <span className="text-rose-400">*</span>
              </label>
              <PasswordInput
                required
                autoFocus
                value={pwdCurrent}
                onChange={(e) => setPwdCurrent(e.target.value)}
                placeholder="Enter current password"
                inputClassName="bg-white/[0.04] border border-white/[0.1] rounded-md py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-[#A78BFA]/50 transition-colors"
              />
            </div>

            {/* New Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">
                New Password <span className="text-rose-400">*</span>
              </label>
              <PasswordInput
                required
                value={pwdNew}
                onChange={(e) => setPwdNew(e.target.value)}
                placeholder="Minimum 8 characters"
                inputClassName="bg-white/[0.04] border border-white/[0.1] rounded-md py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-[#A78BFA]/50 transition-colors"
              />
              {/* Length indicator */}
              <div className="flex items-center gap-1.5 pt-1 text-[11px]">
                {pwdNew.length >= 8 ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Minimum 8 characters satisfied
                  </span>
                ) : (
                  <span className="text-slate-500">
                    Must be at least 8 characters {pwdNew.length > 0 ? `(${pwdNew.length}/8)` : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Confirm New Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">
                Confirm New Password <span className="text-rose-400">*</span>
              </label>
              <PasswordInput
                required
                value={pwdConfirm}
                onChange={(e) => setPwdConfirm(e.target.value)}
                placeholder="Repeat new password"
                inputClassName="bg-white/[0.04] border border-white/[0.1] rounded-md py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-[#A78BFA]/50 transition-colors"
              />
              {/* Match indicator */}
              {pwdConfirm.length > 0 && (
                <div className="flex items-center gap-1.5 pt-1 text-[11px]">
                  {pwdNew === pwdConfirm ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Passwords match
                    </span>
                  ) : (
                    <span className="text-[#A78BFA] flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Passwords do not match yet
                    </span>
                  )}
                </div>
              )}
            </div>
          </form>

          {/* Drawer Footer */}
          <div className="p-5 border-t border-white/[0.08] bg-[#090c15]/80 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowPasswordDrawer(false);
                setPwdCurrent("");
                setPwdNew("");
                setPwdConfirm("");
              }}
              className="px-4 py-2 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="password-change-drawer-form"
              disabled={savingPassword || !pwdCurrent || !pwdNew || !pwdConfirm || pwdNew !== pwdConfirm || pwdNew.length < 8}
              className="px-4 py-2 rounded-md text-xs font-semibold bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#A78BFA]/20 font-bold"
            >
              {savingPassword ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Floating Contextual Unsaved Changes Dock */}
      <AdminSaveBar
        isDirty={hasUnsavedChanges}
        isSaving={saving}
        onSave={() => handleMainFormSubmit()}
        onDiscard={handleDiscardChanges}
        saveLabel="Save Changes"
        discardLabel="Discard"
        message="Unsaved profile changes"
      />
    </div>
  );
}
