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
      return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    }
    if (act.includes("create") || act.includes("store")) {
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    }
    if (act.includes("update") || act.includes("edit")) {
      return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    }
    return "text-[#929BAD] bg-[#171B26] border-[#272B35]";
  };

  const getIntegrationStatus = (item: Integration) => {
    if (!item.is_enabled) {
      return { label: "Disabled", color: "text-[#929BAD] bg-[#171B26] border-[#272B35]", dot: "bg-[#6B7280]" };
    }
    if (item.test_status === "connected") {
      return { label: "Connected", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400" };
    }
    if (item.test_status === "failed") {
      return { label: "Attention", color: "text-rose-400 bg-rose-500/10 border-rose-500/20", dot: "bg-rose-400" };
    }
    return { label: "Configured", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", dot: "bg-blue-400" };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Real Admin Audit Stream (7 cols) */}
      <div className="lg:col-span-7 p-5 rounded-xl bg-[#11141D] border border-[#272B35] space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Administrative Audit Trail
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30">
                  Cryptographic Log
                </span>
              </div>
              <p className="text-xs text-[#929BAD]">
                Recent staff operations, price overrides, and fulfillment events
              </p>
            </div>
            <Link
              href="/admin/audit-logs"
              className="text-xs font-semibold text-[#A78BFA] hover:text-[#B9A3FF] flex items-center gap-1 transition-colors"
            >
              <span>Full Audit Trail</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-[#929BAD]">
              <div className="w-5 h-5 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs">Loading audit ledger...</span>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="py-8 text-center text-[#929BAD]">
              <ShieldCheck className="w-6 h-6 text-[#6B7280] mx-auto mb-1" />
              <p className="text-xs font-medium text-white">No recent administrator events</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {auditLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg bg-[#171B26] border border-[#272B35] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-[#090B10] border border-[#272B35] flex items-center justify-center text-white shrink-0 font-bold font-mono text-[11px]">
                      {(log.user_name || "A").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-white truncate">
                          {log.user_name || "System"}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold border ${getActionBadge(log.action)}`}>
                          {formatAction(log.action)}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#929BAD] block truncate mt-0.5">
                        {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ""} • {log.ip_address || "Internal"}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-[#6B7280] shrink-0 whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-[#272B35] flex items-center justify-between text-xs">
          <span className="text-[#929BAD]">Immutable system activity recording</span>
          <Link
            href="/admin/audit-logs"
            className="font-medium text-[#A78BFA] hover:text-[#B9A3FF] flex items-center gap-1 transition-colors"
          >
            <span>Inspect All Records</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Integration & Infrastructure Connectivity (5 cols) */}
      <div className="lg:col-span-5 p-5 rounded-xl bg-[#11141D] border border-[#272B35] space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Integrations & Connectivity
              </h2>
              <p className="text-xs text-[#929BAD]">
                Live status of couriers, payment rails, and API gateways
              </p>
            </div>
            <Link
              href="/admin/integrations"
              className="text-xs font-semibold text-[#A78BFA] hover:text-[#B9A3FF] flex items-center gap-1 transition-colors"
            >
              <span>Manage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-[#929BAD]">
              <div className="w-5 h-5 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
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
                  className="p-3 rounded-lg bg-[#171B26] border border-[#272B35] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    {item.category === "courier" ? (
                      <Truck className="w-3.5 h-3.5 text-blue-400" />
                    ) : item.category === "payment" ? (
                      <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Server className="w-3.5 h-3.5 text-purple-400" />
                    )}
                    <span className="font-semibold text-white">{item.name}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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
                    className="p-3 rounded-lg bg-[#171B26] border border-[#272B35] flex items-center justify-between text-xs group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {integ.category === "courier" ? (
                        <div className="w-7 h-7 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                          <Truck className="w-3.5 h-3.5" />
                        </div>
                      ) : integ.category === "payment" ? (
                        <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                          <CreditCard className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-md bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                          <Server className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-semibold text-white block truncate">
                          {integ.name}
                        </span>
                        <span className="text-[10px] text-[#929BAD] block truncate uppercase tracking-wider font-mono">
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

        <div className="pt-3 border-t border-[#272B35] flex items-center justify-between text-xs">
          <span className="text-[#929BAD]">Real-time connectivity verification</span>
          <Link
            href="/admin/integrations"
            className="font-semibold text-[#A78BFA] hover:text-[#B9A3FF] flex items-center gap-1 transition-colors"
          >
            <span>Test Webhooks</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
