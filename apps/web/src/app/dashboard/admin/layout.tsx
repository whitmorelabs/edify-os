"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard/admin", label: "Overview", exact: true },
  { href: "/dashboard/admin/members", label: "Members" },
  { href: "/dashboard/admin/usage", label: "Usage" },
  { href: "/dashboard/admin/ai-config", label: "AI Configuration" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Mock role check — in production this would read from session/context
  const isAdmin = true;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
          <Shield className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="heading-2 mb-2">Access Restricted</h2>
        <p className="text-slate-500 max-w-sm">
          You don&apos;t have permission to view this page. Contact your organization owner to request access.
        </p>
      </div>
    );
  }

  // Build breadcrumb
  const currentTab = tabs.find((t) =>
    t.exact ? pathname === t.href : pathname.startsWith(t.href) && t.href !== "/dashboard/admin"
  ) || tabs[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard" className="hover:text-slate-700 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/dashboard/admin" className="hover:text-slate-700 transition-colors">
          Admin
        </Link>
        {pathname !== "/dashboard/admin" && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-slate-900 font-medium">{currentTab.label}</span>
          </>
        )}
      </nav>

      {/* Sub-navigation tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                  isActive
                    ? "border-brand-500 text-brand-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Page content */}
      {children}
    </div>
  );
}
