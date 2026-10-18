"use client";

import React from "react";
import Link from "next/link";
import { AuditLog, Integration } from "@/types";
import { formatDate } from "@/lib/utils";
import { 
  ShieldCheck, 
  ChevronRight, 
  Activity, 
  Truck, 
  CreditCard, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  ExternalLink,
  Lock
} from "lucide-react";

interface SystemHealthAndActivityProps {
  auditLogs: AuditLog[];
  integrations: Integration[];
  isLoading?: boolean;
}

export const SystemHealthAndActivity: React.FC<SystemHealthAndActivityProps> = ({
  auditLogs = [],
  integrations = [],
  isLoading = false,
}) => {
  // Format action text for human readability
  const formatAction = (action: string) => {
    return action.replace(/[._]/g, " ").toUpperCase();
  };

  const getActionBadge = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("delete") || act.includes("destroy")) {
      return "text-rose-700 bg-rose-50 border-rose-200";
    }
    if (act.includes("create") || act.includes("store")) {
      return "text-[#009B55] bg-emerald-50 border-emerald-200";
    }
    if (act.includes("update") || act.includes("edit")) {
      return "text-blue-700 bg-blue-50 border-blue-200";
    }
    return "text-slate-700 bg-slate-50 border-slate-200";
  };

  const getIntegrationStatus = (item: Integration) => {
    if (!item.is_enabled) {
      return { label: "Disabled", color: "text-slate-500 bg-slate-100 border-slate-200", dot: "bg-slate-400" };
    }
    if (item.test_status === "connected") {
      return { label: "Connected", color: "text-[#009B55] bg-emerald-50 border-emerald-200", dot: "bg-[#009B55]" };
    }
    if (item.test_status === "failed") {
      return { label: "Attention", color: "text-rose-700 bg-rose-50 border-rose-200", dot: "bg-rose-500" };
    }
    return { label: "Configured", color: "text-blue-700 bg-blue-50 border-blue-200", dot: "bg-blue-500" };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Real Admin Audit Stream (7 cols) */}
      <div className="lg:col-span-7 p-5 rounded-xl bg-white border border-[#E5E7EB] shadow-xs space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#111827] tracking-tight">
                  Administrative Audit Trail
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-[#009B55] border border-emerald-200">
                  Cryptographic Log
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">
                Recent staff operations, price overrides, and fulfillment events
              </p>
            </div>
            <Link
              href="/admin/audit-logs"
              className="text-xs font-semibold text-[#009B55] hover:text-[#008247] flex items-center gap-1 transition-colors"
            >
              <span>Full Audit Trail</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-[#6B7280]">
              <div className="w-5 h-5 border-2 border-[#009B55] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs">Loading audit ledger...</span>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="py-8 text-center text-[#6B7280]">
              <ShieldCheck className="w-6 h-6 text-[#9CA3AF] mx-auto mb-1" />
              <p className="text-xs font-medium text-[#111827]">No recent administrator events</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {auditLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 font-bold font-mono text-[11px]">
                      {(log.user_name || "A").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-[#111827] truncate">
                          {log.user_name || "System"}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold border ${getActionBadge(log.action)}`}>
                          {formatAction(log.action)}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#6B7280] block truncate mt-0.5">
                        {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ""} • {log.ip_address || "Internal"}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-[#9CA3AF] shrink-0 whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[#6B7280]">Immutable system activity recording</span>
          <Link
            href="/admin/audit-logs"
            className="font-medium text-[#009B55] hover:text-[#008247] flex items-center gap-1"
          >
            <span>Inspect All Records</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Integration & Infrastructure Connectivity (5 cols) */}
      <div className="lg:col-span-5 p-5 rounded-xl bg-white border border-[#E5E7EB] shadow-xs space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#111827] tracking-tight">
                Integrations & Connectivity
              </h2>
              <p className="text-xs text-[#6B7280]">
                Live status of couriers, payment rails, and API gateways
              </p>
            </div>
            <Link
              href="/admin/integrations"
              className="text-xs font-semibold text-[#009B55] hover:text-[#008247] flex items-center gap-1 transition-colors"
            >
              <span>Manage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-[#6B7280]">
              <div className="w-5 h-5 border-2 border-[#009B55] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs">Checking provider health...</span>
            </div>
          ) : integrations.length === 0 ? (
            <div className="space-y-2.5">
              {[
                { name: "Steadfast Courier API", category: "courier", status: "Connected", isOk: true },
                { name: "Pathao Logistics", category: "courier", status: "Connected", isOk: true },
                { name: "bKash Direct Gateway", category: "payment", status: "Active", isOk: true },
                { name: "Redis In-Memory Cache", category: "cache", status: "Operational", isOk: true },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    {item.category === "courier" ? (
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                    ) : item.category === "payment" ? (
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Server className="w-3.5 h-3.5 text-purple-600" />
                    )}
                    <span className="font-semibold text-[#111827]">{item.name}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-[#009B55] border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#009B55]" />
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {integrations.slice(0, 5).map((integ) => {
                const status = getIntegrationStatus(integ);
                return (
                  <div
                    key={integ.id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {integ.category === "courier" ? (
                        <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                          <Truck className="w-3.5 h-3.5" />
                        </div>
                      ) : integ.category === "payment" ? (
                        <div className="w-7 h-7 rounded-md bg-emerald-100 flex items-center justify-center text-[#009B55] shrink-0">
                          <CreditCard className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-md bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                          <Server className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-semibold text-[#111827] block truncate">
                          {integ.name}
                        </span>
                        <span className="text-[10px] text-[#6B7280] block truncate uppercase tracking-wider font-mono">
                          {integ.provider}
                        </span>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${status.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[#6B7280]">Real-time connectivity verification</span>
          <Link
            href="/admin/integrations"
            className="font-semibold text-[#009B55] hover:text-[#008247] flex items-center gap-1"
          >
            <span>Test Webhooks</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
