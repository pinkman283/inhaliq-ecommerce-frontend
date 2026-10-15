"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { adminApi } from "@/lib/adminApi";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";
import { PasswordInput } from "@/components/ui/PasswordInput";
import Link from "next/link";

function ActivateAdminForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      toast.error("Invalid activation link.");
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await adminApi.activateAdmin({
        token,
        email,
        password,
        password_confirmation: passwordConfirm,
      });
      toast.success(res.message || "Account activated successfully.");
      setActivated(true);
      setTimeout(() => {
        router.push("/admin/login");
      }, 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to activate account.");
    } finally {
      setLoading(false);
    }
  };

  if (activated) {
    return (
      <div className="w-full max-w-sm p-8 rounded-md bg-[#0b0e17]/80 backdrop-blur-xl border border-emerald-500/30 text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-emerald-500/20 text-emerald-400 flex items-center justify-center rounded-md">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-white">Activation Complete</h2>
        <p className="text-sm text-slate-400">Your administrator account is now active. You will be redirected to the login page momentarily.</p>
        <Link href="/admin/login" className="text-emerald-400 hover:text-emerald-300 text-sm font-bold block pt-2">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm p-8 rounded-lg bg-[#0b0e17]/80 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
      
      <div className="flex items-center gap-2 mb-8">
        <ShieldCheck className="w-6 h-6 text-purple-400" />
        <span className="text-lg font-black text-white tracking-tight uppercase">Set Password</span>
      </div>

      <div className="space-y-4 mb-6">
        <p className="text-sm text-slate-300">
          Welcome, <span className="font-bold text-white">{email}</span>. Please set a secure password to activate your administrator account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">New Password</label>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            inputClassName="h-11 rounded-md border border-white/10 bg-[#131722] px-4 text-sm text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Confirm Password</label>
          <PasswordInput
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="••••••••"
            required
            inputClassName="h-11 rounded-md border border-white/10 bg-[#131722] px-4 text-sm text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !token || !email}
          className="w-full h-11 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-wider text-xs transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Activate Account"}
        </button>
      </form>
    </div>
  );
}

export default function AdminActivatePage() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />
      <Suspense fallback={<div className="text-white"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
        <ActivateAdminForm />
      </Suspense>
    </div>
  );
}
