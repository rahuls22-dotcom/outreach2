"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Plug, UserCircle2, Building2 } from "lucide-react";
import { useCurrentUser } from "@/lib/workspace-store";

// Billing is intentionally out of scope for now — the design
// conversation is parked on Usage and won't touch billing-mode
// switching, invoices, or top-up estimator surfaces until we come
// back to it. The /settings/billing route file stays in place so
// we can rewire the nav entry later without rebuilding the page;
// nothing visible points at it.
const SETTINGS_NAV = [
  { name: "Usage",        href: "/settings/utilization",  icon: BarChart3 },
  { name: "Workspaces",   href: "/settings/workspaces",   icon: Building2 },
  { name: "Integrations", href: "/settings/integrations", icon: Plug },
  { name: "Profile",      href: "/settings/profile",      icon: UserCircle2 },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useCurrentUser();

  // Settings is admin-only. Members reach the app shell but never the
  // settings surface — their sidebar shows Log out, not the gear. Guard
  // here too so a hand-typed /settings URL, or a live role switch while
  // sitting on a settings page, bounces them home instead of leaking it.
  useEffect(() => {
    if (user.role !== "admin") router.replace("/");
  }, [user.role, router]);

  if (user.role !== "admin") return null;

  const renderLink = (item: { name: string; href: string; icon: typeof BarChart3 }) => {
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-2.5 px-2 h-8 rounded-[6px] transition-colors duration-150 ${
          active
            ? "bg-surface-secondary text-text-primary font-medium"
            : "text-text-secondary hover:bg-surface-secondary/60"
        }`}
        style={{ fontSize: "13.5px" }}
      >
        <item.icon size={16} strokeWidth={1.5} />
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold text-text-primary">Settings</h1>
      </div>
      <div className="flex gap-5">
        <aside className="w-[176px] flex-shrink-0">
          {/* Flat list — no Account/Connections sub-headers. With only
              four items the headers were paying rent without earning
              it: extra vertical noise for a forced grouping. */}
          <nav className="space-y-0.5">
            {SETTINGS_NAV.map(renderLink)}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
