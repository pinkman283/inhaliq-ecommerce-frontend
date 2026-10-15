"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface AdminBreadcrumbItem {
  label: string;
  href?: string;
}

export interface AdminPageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "cyan" | "purple";
  action?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: AdminBreadcrumbItem[];
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  title,
  description,
  subtitle,
  badge,
  badgeVariant = "default",
  action,
  actions,
  breadcrumbs,
}) => {
  const desc = description || subtitle;
  const getBadgeClass = () => {
    switch (badgeVariant) {
      case "success":
        return "bg-[#34D399]/10 text-[#34D399] border-[#34D399]/20";
      case "warning":
        return "bg-[#FBBF24]/10 text-[#FBBF24] border-[#FBBF24]/20";
      case "cyan":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "purple":
        return "bg-[#211B32] text-[#A78BFA] border-[#A78BFA]/30";
      default:
        return "bg-[#171B26] text-[#E5E7EB] border-[#272B35]";
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#272B35]">
      <div className="space-y-0.5">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-[11px] text-[#929BAD] mb-1">
            {breadcrumbs.map((b, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="w-3 h-3 text-[#626B7B]" />}
                  {b.href && !isLast ? (
                    <Link
                      href={b.href}
                      className="hover:text-[#E5E7EB] transition-colors"
                    >
                      {b.label}
                    </Link>
                  ) : (
                    <span className={isLast ? "text-[#E5E7EB] font-medium" : ""}>
                      {b.label}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
          {badge && (
            <span
              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase tracking-wide ${getBadgeClass()}`}
            >
              {badge}
            </span>
          )}
        </div>

        {desc && (
          <p className="text-xs text-[#929BAD] max-w-2xl">{desc}</p>
        )}
      </div>

      {(action || actions) && <div className="flex items-center gap-2 shrink-0">{action || actions}</div>}
    </div>
  );
};
