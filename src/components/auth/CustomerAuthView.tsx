"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  User,
  Lock,
  Mail,
  Phone,
  LogIn,
  UserPlus,
  KeyRound,
  Timer
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAppTheme } from "@/components/providers/ThemeProvider";
import { getThemeCardRadiusPx, getThemeInputRadiusPx } from "@/store/useThemeStore";
import { BrandLogoImage } from "@/components/shared/BrandLogoImage";
import { DepthText } from "@/components/DepthText";

interface CustomerAuthViewProps {
  defaultTab?: "login" | "register" | "forgot_password";
}

export function CustomerAuthView({ defaultTab = "login" }: CustomerAuthViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const { isAuthenticated, setAuth } = useAuthStore();
  const { theme } = useAppTheme();

  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot_password">(defaultTab);
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Lockout & Cooldown State
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [lockedCountdown, setLockedCountdown] = useState<string>("");
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  useEffect(() => {
    if (!lockedUntil) return;
    const updateCountdown = () => {
      const now = new Date();
      const target = new Date(lockedUntil);
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setLockedUntil(null);
        setLockedCountdown("");
        return;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setLockedCountdown(`${minutes}m ${seconds}s`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, redirectUrl, router]);

  // Load remembered login identifier if previously saved
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLogin = localStorage.getItem("ecom_remember_login");
      if (savedLogin) {
        setEmail(savedLogin);
        setRememberMe(true);
      }
    }
  }, []);

  // Always scroll to top of page on arrival
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, []);

  // Sync tab with props if prop changes
  useEffect(() => {
    setActiveTab(defaultTab);
    setRegisterStep(1);
    setForgotStep(1);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [defaultTab]);

  const switchTab = (tab: "login" | "register" | "forgot_password") => {
    setError(null);
    setSuccessMessage(null);
    setPassword("");
    setConfirmPassword("");
    setOtp("");
    setActiveTab(tab);
    setRegisterStep(1);
    setForgotStep(1);
    if (typeof window !== "undefined") {
      const newPath = tab === "register" ? "/signup" : "/login";
      if (window.location.pathname !== newPath) {
        window.history.replaceState(null, "", newPath);
      }
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "register") {
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        const res = await api.registerRequest({ name: fullName, email: email.trim(), password, phone: phone.trim() });
        setSuccessMessage(res.message);
        setResendCooldown(60);
        toast.success("A new verification code has been sent.");
      } else if (activeTab === "forgot_password") {
        const res = await api.forgotPassword({ email: email.trim() });
        setSuccessMessage(res.message);
        setResendCooldown(60);
        toast.success("A new password reset code has been sent.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (activeTab === "login") {
        if (lockedUntil) {
          setError("Account is temporarily locked. Please wait.");
          setLoading(false);
          return;
        }

        const res = await api.login({ email: email.trim(), password, remember: rememberMe });
        
        // Handle remember me persistence
        if (typeof window !== "undefined") {
          if (rememberMe) {
            localStorage.setItem("ecom_remember_login", email.trim());
          } else {
            localStorage.removeItem("ecom_remember_login");
          }
        }
        setAuth(res.user, res.token);
        toast.success(`Welcome back, ${res.user.name.split(" ")[0]}!`);

        // Clear all form input fields on successful login
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setFirstName("");
        setLastName("");
        setPhone("");
        setOtp("");

        router.push(redirectUrl);
      } else if (activeTab === "register") {
        if (registerStep === 1) {
          if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
          }
          if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            setLoading(false);
            return;
          }
          const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
          if (!fullName) {
            setError("Please provide your full name.");
            setLoading(false);
            return;
          }

          const res = await api.registerRequest({ name: fullName, email: email.trim(), password, phone: phone.trim() });
          
          // If OTP shield is disabled, account is created immediately
          if ((res as any).otp_required === false) {
            toast.success("Account created successfully! Please sign in with your credentials.");
            switchTab("login");
            router.push("/login");
            setLoading(false);
            return;
          }

          setSuccessMessage(res.message);
          setRegisterStep(2);
          setResendCooldown(60);
        } else if (registerStep === 2) {
          if (otp.length !== 6) {
            setError("OTP must be exactly 6 digits.");
            setLoading(false);
            return;
          }
          await api.registerVerify({ email: email.trim(), otp });
          
          if (typeof window !== "undefined") {
            localStorage.setItem("ecom_remember_login", email.trim());
          }

          // Clear all form input fields on successful registration
          setEmail("");
          setPassword("");
          setConfirmPassword("");
          setFirstName("");
          setLastName("");
          setPhone("");
          setOtp("");

          toast.success("Account created successfully! Please sign in with your credentials.");
          switchTab("login");
          router.push("/login");
        }
      } else if (activeTab === "forgot_password") {
        if (forgotStep === 1) {
          if (!email.trim()) {
            setError("Please enter your registered account email.");
            setLoading(false);
            return;
          }
          const res = await api.forgotPassword({ email: email.trim() });
          setSuccessMessage(res.message);
          setForgotStep(2);
          setResendCooldown(60);
        } else if (forgotStep === 2) {
          if (otp.length !== 6) {
            setError("OTP must be exactly 6 digits.");
            setLoading(false);
            return;
          }
          const res = await api.verifyResetOtp({ email: email.trim(), otp });
          setResetToken(res.reset_token);
          setSuccessMessage("OTP verified. Please set a new password.");
          setForgotStep(3);
        } else if (forgotStep === 3) {
          if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
          }
          if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            setLoading(false);
            return;
          }
          const res = await api.resetPassword({ 
            email: email.trim(), 
            reset_token: resetToken, 
            password, 
            password_confirmation: confirmPassword 
          });
          setSuccessMessage(res.message);
          toast.success("Password reset successfully! Please sign in with your new password.");

          // Clear input fields
          setEmail("");
          setPassword("");
          setConfirmPassword("");
          setOtp("");
          setResetToken("");

          switchTab("login");
          router.push("/login");
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.email?.[0] || err.response?.data?.errors?.otp?.[0] || "Authentication failed. Please check your details.";
      setError(msg);
      if (err.response?.status === 403 && err.response?.data?.locked_until) {
        setLockedUntil(err.response.data.locked_until);
      }
    } finally {
      setLoading(false);
    }
  };

  // Background styling from theme
  const hasBgImage = Boolean(theme.customer_auth_bg_image && theme.customer_auth_bg_image.trim() !== "");
  const bgColor = theme.customer_auth_bg_color || "#ffffff";

  return (
    <div 
      className="w-full flex-1 min-h-[680px] relative pt-8 sm:pt-10 lg:pt-12 pb-16 flex flex-col justify-start items-center transition-colors duration-200 font-sans"
      style={{
        backgroundColor: bgColor,
        backgroundImage: hasBgImage ? `url(${theme.customer_auth_bg_image})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Soft dark overlay when background image is active */}
      {hasBgImage && (
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent pointer-events-none z-0" />
      )}

      {/* Main Canvas - Fixed 2-column track grid locking left and right elements to exact same pixel positions */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-[390px_1fr] items-start gap-10 xl:gap-14">
        
        {/* Left Column: Return Button + Auth Card */}
        <div className="w-full max-w-[390px] flex flex-col">
          {/* Back Button */}
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-md bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-sm group w-fit mb-3.5"
            title="Return to previous page"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5 text-white" />
            <span className="text-white tracking-wide">Return</span>
          </button>

          {/* Clean Redesigned Card */}
          <motion.div
            key={activeTab + registerStep + forgotStep}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              backgroundColor: theme.theme_card_bg_color || "var(--theme-card-bg, #ffffff)",
              borderColor: theme.theme_card_border_color || "var(--theme-card-border, #e2e8f0)",
              borderRadius: `${getThemeCardRadiusPx(theme.theme_radius)}px`,
            }}
            className="w-full border p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.12)] transition-all relative overflow-hidden"
          >
            {/* Brand Logo & Top Pill Badge */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <BrandLogoImage placement="auth" />
              <span 
                style={{
                  backgroundColor: `color-mix(in srgb, ${theme.theme_primary_color || "#059669"} 10%, transparent)`,
                  color: theme.theme_primary_color || "#059669",
                  borderColor: `color-mix(in srgb, ${theme.theme_primary_color || "#059669"} 25%, transparent)`,
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold tracking-wide transition-colors shadow-xs w-fit"
              >
                <ShieldCheck 
                  className="w-3.5 h-3.5 shrink-0" 
                  style={{ color: theme.theme_primary_color || "#059669" }}
                />
                <span>Customer Portal</span>
              </span>
            </div>

            {/* Heading & Subtitle */}
            <div className="space-y-1 mb-5">
              <h1 
                style={{ color: theme.theme_text_heading_color || "var(--theme-text-heading, #0f172a)" }}
                className="text-2xl sm:text-[26px] font-black tracking-tight"
              >
                {activeTab === "login" 
                  ? "Sign In" 
                  : activeTab === "register" 
                  ? (registerStep === 1 ? "Create Account" : "Verify Email")
                  : (forgotStep === 1 ? "Reset Password" : forgotStep === 2 ? "Verify OTP" : "New Password")}
              </h1>
              <p 
                style={{ color: theme.theme_text_body_color || "var(--theme-text-body, #475569)" }}
                className="text-xs sm:text-[13px] leading-relaxed font-normal"
              >
                {activeTab === "login"
                  ? "Welcome back! Access your orders and account."
                  : activeTab === "register"
                  ? (registerStep === 1 ? `Join ${theme.store_brand_name || "us"} to track orders.` : `Enter the 6-digit code sent to ${email}`)
                  : (forgotStep === 1 ? "Enter your email to receive recovery instructions." : forgotStep === 2 ? `Enter the 6-digit code sent to ${email}` : "Set a new strong password.")}
              </p>
            </div>

            {/* Success Banner */}
            {successMessage && (
              <div 
                style={{ borderRadius: `${getThemeInputRadiusPx(theme.theme_radius)}px` }}
                className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-snug font-medium">{successMessage}</span>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div 
                style={{ borderRadius: `${getThemeInputRadiusPx(theme.theme_radius)}px` }}
                className="mb-4 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-snug font-medium">{error}</span>
              </div>
            )}

            {/* Locked Countdown */}
            {activeTab === "login" && lockedUntil && (
              <div 
                style={{ borderRadius: `${getThemeInputRadiusPx(theme.theme_radius)}px` }}
                className="mb-4 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="font-medium">Account Locked</span>
                </div>
                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono tracking-wider">
                  {lockedCountdown}
                </span>
              </div>
            )}

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* === REGISTER FLOW === */}
              {activeTab === "register" && registerStep === 1 && (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">First Name</label>
                      <div style={{ borderRadius: `${getThemeInputRadiusPx(theme.theme_radius)}px` }} className="theme-auth-input-box relative flex items-center px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 shadow-xs">
                        <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" className="auth-seamless-input w-full text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium bg-transparent border-0 outline-none shadow-none focus:ring-0" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Last Name</label>
                      <div style={{ borderRadius: `${getThemeInputRadiusPx(theme.theme_radius)}px` }} className="theme-auth-input-box relative flex items-center px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 shadow-xs">
                        <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Wick" className="auth-seamless-input w-full text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium bg-transparent border-0 outline-none shadow-none focus:ring-0" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Email Address</label>
                    <div style={{ borderRadius: `${getThemeInputRadiusPx(theme.theme_radius)}px` }} className="theme-auth-input-box relative flex items-center px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 shadow-xs">
                      <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2.5 shrink-0" />
                      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" className="auth-seamless-input w-full text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium bg-transparent border-0 outline-none shadow-none focus:ring-0" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Phone (Optional)</label>
                    <div style={{ borderRadius: `${getThemeInputRadiusPx(theme.theme_radius)}px` }} className="theme-auth-input-box relative flex items-center px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 shadow-xs">
                      <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2.5 shrink-0" />
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+880 1700-000000" className="auth-seamless-input w-full text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium bg-transparent border-0 outline-none shadow-none focus:ring-0" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Password</label>
                    <div style={{ borderRadius: `${getThemeInputRadiusPx(theme.theme_radius)}px` }} className="theme-auth-input-box relative flex items-center px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 shadow-xs">
                      <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2.5 shrink-0" />
                      <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="auth-seamless-input w-full text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium bg-transparent border-0 outline-none shadow-none focus:ring-0 pr-6" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors shrink-0">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Confirm Password</label>
                    <div style={{ borderRadius: `${getThemeInputRadiusPx(theme.theme_radius)}px` }} className="theme-auth-input-box relative flex items-center px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 shadow-xs">
                      <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2.5 shrink-0" />
                      <input type={showConfirmPassword ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className="auth-seamless-input w-full text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium bg-transparent border-0 outline-none shadow-none focus:ring-0 pr-6" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors shrink-0">
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "register" && registerStep === 2 && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">OTP Code</label>
                  <div style={{ borderRadius: `${getThemeInputRadiusPx(theme.theme_radius)}px` }} className="theme-auth-input-box relative flex items-center px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 shadow-xs">
                    <KeyRound className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2.5 shrink-0" />
                    <input type="text" required value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" maxLength={6} className="auth-seamless-input w-full text-xs sm:text-sm tracking-widest font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 bg-transparent border-0 outline-none shadow-none focus:ring-0 text-center" />
                  </div>
                  <div className="flex items-center justify-between text-xs mt-2 px-0.5">
                    <span className="text-slate-500 dark:text-slate-400">Didn't receive the code?</span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || loading}
                      style={{ color: resendCooldown > 0 ? undefined : (theme.theme_primary_color || "#059669") }}
                      className={`font-semibold cursor-pointer ${
                        resendCooldown > 0
                          ? "text-slate-400 dark:text-slate-500 cursor-not-allowed"
                          : "hover:underline"
                      }`}
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                    </button>
                  </div>
                </div>
              )}

              {/* === FORGOT PASSWORD FLOW === */}
              {activeTab === "forgot_password" && forgotStep === 1 && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Email Address</label>
                  <div style={{ borderRadius: `${getThemeInputRadiusPx(theme.theme_radius)}px` }} className="theme-auth-input-box relative flex items-center px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 shadow-xs">
                    <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2.5 shrink-0" />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" className="auth-seamless-input w-full text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium bg-transparent border-0 outline-none shadow-none focus:ring-0" />
                  </div>
                </div>
              )}

              {activeTab === "forgot_password" && forgotStep === 2 && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">OTP Code</label>
                  <div style={{ borderRadius: `${getThemeInputRadiusPx(theme.theme_radius)}px` }} className="theme-auth-input-box relative flex items-center px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 shadow-xs">
                    <KeyRound className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2.5 shrink-0" />
                    <input type="text" required value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" maxLength={6} className="auth-seamless-input w-full text-xs sm:text-sm tracking-widest font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 bg-transparent border-0 outline-none shadow-none focus:ring-0 text-center" />
                  </div>
                  <div className="flex items-center justify-between text-xs mt-2 px-0.5">
                    <span className="text-slate-500 dark:text-slate-400">Didn't receive the code?</span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || loading}
                      style={{ color: resendCooldown > 0 ? undefined : (theme.theme_primary_color || "#059669") }}
                      className={`font-semibold cursor-pointer ${
                        resendCooldown > 0
                          ? "text-slate-400 dark:text-slate-500 cursor-not-allowed"
                          : "hover:underline"
                      }`}
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "forgot_password" && forgotStep === 3 && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">New Password</label>
                    <div style={{ borderRadius: `${getThemeInputRadiusPx(theme.theme_radius)}px` }} className="theme-auth-input-box relative flex items-center px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 shadow-xs">
                      <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2.5 shrink-0" />
                      <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New Password" className="auth-seamless-input w-full text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium bg-transparent border-0 outline-none shadow-none focus:ring-0 pr-6" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors shrink-0">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Confirm New Password</label>
                    <div style={{ borderRadius: `${getThemeInputRadiusPx(theme.theme_radius)}px` }} className="theme-auth-input-box relative flex items-center px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 shadow-xs">
                      <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2.5 shrink-0" />
                      <input type={showConfirmPassword ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className="auth-seamless-input w-full text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium bg-transparent border-0 outline-none shadow-none focus:ring-0 pr-6" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors shrink-0">
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* === LOGIN FLOW === */}
              {activeTab === "login" && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Email Address</label>
                    <div style={{ borderRadius: `${getThemeInputRadiusPx(theme.theme_radius)}px` }} className="theme-auth-input-box relative flex items-center px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 shadow-xs">
                      <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2.5 shrink-0" />
                      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" className="auth-seamless-input w-full text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium bg-transparent border-0 outline-none shadow-none focus:ring-0" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Password</label>
                    <div style={{ borderRadius: `${getThemeInputRadiusPx(theme.theme_radius)}px` }} className="theme-auth-input-box relative flex items-center px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 shadow-xs">
                      <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2.5 shrink-0" />
                      <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="auth-seamless-input w-full text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium bg-transparent border-0 outline-none shadow-none focus:ring-0 pr-6" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer shrink-0">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-0.5">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ accentColor: theme.theme_primary_color || "#059669" }} className="w-4 h-4 rounded cursor-pointer" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Remember me</span>
                    </label>
                    <button type="button" onClick={() => switchTab("forgot_password")} style={{ color: theme.theme_primary_color || "#059669" }} className="text-xs font-bold hover:underline hover:brightness-110 transition-colors cursor-pointer">
                      Forgot Password?
                    </button>
                  </div>
                </>
              )}

              {/* Main Action Button */}
              <button
                type="submit"
                disabled={loading || !!lockedUntil}
                style={{
                  backgroundColor: theme.theme_btn_primary_bg || theme.theme_primary_color || "var(--theme-primary, #059669)",
                  color: theme.theme_btn_primary_text || "var(--theme-btn-primary-text, #ffffff)",
                  borderRadius: `${getThemeInputRadiusPx(theme.theme_radius)}px`,
                }}
                className="w-full py-3 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : activeTab === "login" ? (
                  <><LogIn className="w-4 h-4" /><span>Sign In</span></>
                ) : activeTab === "register" ? (
                  <>{registerStep === 1 ? <><UserPlus className="w-4 h-4" /><span>Request OTP</span></> : <><CheckCircle2 className="w-4 h-4" /><span>Verify & Create Account</span></>}</>
                ) : (
                  <>{forgotStep === 1 ? <><Mail className="w-4 h-4" /><span>Send Reset OTP</span></> : forgotStep === 2 ? <><CheckCircle2 className="w-4 h-4" /><span>Verify OTP</span></> : <><KeyRound className="w-4 h-4" /><span>Set New Password</span></>}</>
                )}
              </button>
            </form>

            {/* Divider with Text */}
            <div className="relative flex py-3 items-center mt-3">
              <div className="flex-grow border-t border-slate-200 dark:border-white/10" />
              <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {activeTab === "login" 
                  ? `New to ${theme.store_brand_name || "INHALIQ"}?` 
                  : activeTab === "register"
                  ? "Already have an account?"
                  : "Remember your password?"}
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-white/10" />
            </div>

            {/* Secondary Action Button below Divider */}
            {activeTab === "login" ? (
              <button
                type="button"
                onClick={() => switchTab("register")}
                style={{ borderRadius: `${getThemeInputRadiusPx(theme.theme_radius)}px` }}
                className="w-full py-2.5 border border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span>Create an Account</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => switchTab("login")}
                style={{ borderRadius: `${getThemeInputRadiusPx(theme.theme_radius)}px` }}
                className="w-full py-2.5 border border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span>Sign In</span>
              </button>
            )}
          </motion.div>
        </div>

        {/* Right Column: 3D DepthText Brand & Tagline Showcase (Static anchor for 100% position parity) */}
        <div 
          className="hidden lg:flex flex-col items-start justify-center select-none pointer-events-auto pl-2 xl:pl-6 pt-20 lg:pt-24"
        >
          <div className="flex flex-col items-start text-left">
            {/* Brand Name 3D DepthText */}
            <div className="mb-4 overflow-visible">
              <DepthText
                text={theme.store_brand_name || "INHALIQ"}
                fontSize="clamp(4.4rem, 7.8vw, 7.2rem)"
                fontWeight={900}
                faceColor="#ffffff"
                depthColor={theme.theme_primary_color || "#059669"}
                layers={42}
                depth={3.6}
                tilt={9.0}
                orbitSpeed={0.35}
                autoOrbit={true}
                pointerTracking={true}
                animateOnHover={true}
                shadow={true}
                className="tracking-tight uppercase cursor-pointer"
              />
            </div>

            {/* Tagline 3D DepthText */}
            <div className="overflow-visible pl-1">
              <DepthText
                text={theme.store_brand_tagline || "Elevate Every Inhale"}
                fontSize="clamp(1.5rem, 2.7vw, 2.5rem)"
                fontWeight={700}
                faceColor="#ffffff"
                depthColor={theme.theme_primary_color || "#047857"}
                layers={26}
                depth={2.0}
                tilt={5.5}
                orbitSpeed={0.18}
                autoOrbit={true}
                pointerTracking={true}
                animateOnHover={true}
                shadow={true}
                className="tracking-wide cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
