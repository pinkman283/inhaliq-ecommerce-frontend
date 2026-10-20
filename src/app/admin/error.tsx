"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";

export default function AdminErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin Segment Error Boundary caught exception:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#11141D] border border-[#272B35] rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full inline-block">
            Console Exception
          </span>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Section Failed to Render
          </h2>
          <p className="text-xs text-[#929BAD] max-w-sm mx-auto leading-relaxed">
            An unexpected error occurred while rendering this module. Your session is active and other admin sections remain functional.
          </p>
          {error?.digest && (
            <p className="text-[10px] font-mono text-slate-500 pt-1">
              Error Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Section
          </button>
          <Link
            href="/admin"
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#171B26] hover:bg-[#1E2333] border border-[#272B35] text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
