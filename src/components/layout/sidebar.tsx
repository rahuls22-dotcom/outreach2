"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  FolderKanban,
  Monitor,
  Zap,
  FileText,
  Globe,
  Image as ImageIcon,
  Plug,
  Settings,
  Eye,
  EyeOff,
  Sparkles,
  UserSearch,
  ContactRound,
  ChevronRight,
  ChevronUp,
  Activity,
  Database,
  ScanLine,
  ListChecks,
} from "lucide-react";
import { useDemoMode } from "@/lib/demo-mode";
import { useSpotStore } from "@/lib/spot/store";
import { SpotMark } from "@/components/spot/spot-mark";
import { WorkspaceSwitcher, UserRolePill } from "@/components/layout/workspace-switcher";
import { useCurrentUser } from "@/lib/workspace-store";

const dashboardItem = { name: "Dashboard", href: "/dashboard", icon: LayoutGrid };

const navSections = [
  {
    label: "Lead Generation",
    items: [
      { name: "Projects", href: "/projects", icon: FolderKanban },
      { name: "Campaigns", href: "/campaigns", icon: Monitor },
    ],
  },
  {
    label: "CRM",
    items: [
      { name: "Leads", href: "/enquiries", icon: FileText },
    ],
  },
  {
    label: "Tools",
    items: [
      {
        name: "Enrichment",
        href: "/enrichment",
        icon: UserSearch,
        children: [
          { name: "Enrich",         href: "/enrichment/operations", icon: Activity },
          { name: "Enriched leads", href: "/enrichment/database",   icon: Database },
        ],
      },
      {
        name: "Contact extraction",
        href: "/contact-extraction",
        icon: ContactRound,
        children: [
          { name: "Extract",            href: "/contact-extraction/operations", icon: ScanLine },
          { name: "Extracted contacts", href: "/contact-extraction/database",   icon: ListChecks },
        ],
      },
      { name: "Creatives", href: "/creatives", icon: ImageIcon },
      { name: "Agents", href: "/agents-mvp", icon: Zap },
      { name: "Audiences", href: "/audiences", icon: Globe, comingSoon: true },
      { name: "Integrations", href: "/integrations", icon: Plug, comingSoon: true },
    ],
  },
  {
    label: "Workspace",
    items: [
      { name: "Brand", href: "/brand", icon: Sparkles },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname() || "";
  const { isEmpty, toggle } = useDemoMode();
  const askSpot = useSpotStore((s) => s.askSpot);
  const spotOpen = useSpotStore((s) => s.open);
  const user = useCurrentUser();

  // Manual expand/collapse overrides per parent href. `undefined` = follow the
  // route default (expanded when current path is under the parent). Toggling the
  // caret sets an explicit boolean; navigating elsewhere doesn't reset it.
  const [expandedOverride, setExpandedOverride] = useState<Record<string, boolean>>({});

  // Used to decide whether to render a parent's children. True when current
  // path is under the parent (e.g. /enrichment, /enrichment/operations).
  const isUnder = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Parent active highlight = exact match only when item has no children OR
  // when we're at the exact parent path. Children expand the highlight to
  // themselves when they own a deeper segment.
  const isExactlyAt = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname === href;
  };

  // Parent gets "active" treatment for any sub-route — including its children —
  // EXCEPT we want the parent's row not to look pressed while a child is the
  // current page. So highlight parent only when exactly on it.
  const isActiveForParent = (item: { href: string; children?: { href: string }[] }) => {
    if (item.children && item.children.length > 0) return isExactlyAt(item.href);
    return isUnder(item.href);
  };

  const navLinkClass = (active: boolean) =>
    `relative flex items-center gap-2.5 px-2 h-8 rounded-[6px] transition-colors duration-150 ${
      active
        ? "bg-surface-secondary text-text-primary font-medium"
        : "text-text-secondary hover:bg-surface-secondary/60"
    }`;

  return (
    <aside className="fixed left-0 top-0 h-screen w-sidebar bg-white border-r border-border flex flex-col z-50">
      {/* Workspace switcher — sits in the brand row; the workspace mark IS
          the brand mark in this product (Revspot is implicit). */}
      <div className="px-2 pt-3 pb-2 border-b border-border-subtle">
        <WorkspaceSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-1 pb-2">
        {/* Dashboard + Spot — standalone at top */}
        <div className="mb-3 space-y-0.5">
          <Link href={dashboardItem.href} className={navLinkClass(isUnder(dashboardItem.href))} style={{ fontSize: "13.5px" }}>
            <dashboardItem.icon size={16} strokeWidth={1.5} />
            <span>{dashboardItem.name}</span>
          </Link>
          <button
            type="button"
            onClick={() => askSpot("")}
            className={`relative flex items-center gap-2.5 px-2 h-8 rounded-[6px] transition-colors duration-150 w-full text-left ${
              spotOpen
                ? "bg-surface-secondary text-text-primary font-medium"
                : "text-text-secondary hover:bg-surface-secondary/60"
            }`}
            style={{ fontSize: "13.5px" }}
          >
            <span className="inline-flex items-center justify-center" style={{ width: 16, height: 16 }}>
              <SpotMark size={14} />
            </span>
            <span>Spot</span>
            <span
              className="ml-auto"
              style={{ width: 6, height: 6, borderRadius: "50%", background: "#1A1A1A" }}
              aria-hidden
              title="New from Spot"
            />
          </button>
        </div>

        {/* Sections */}
        {navSections.map((section) => (
          <div key={section.label} className="mb-3">
            <div className="label-section px-2 mb-1">{section.label}</div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const cs = "comingSoon" in item && item.comingSoon;
                if (cs) {
                  return (
                    <div key={item.href} className="relative flex items-center gap-2.5 px-2 h-8 rounded-[6px] text-text-tertiary cursor-default" style={{ fontSize: "13.5px" }}>
                      <item.icon size={16} strokeWidth={1.5} />
                      <span>{item.name}</span>
                      <span className="ml-auto text-[8px] font-medium px-1 py-0.5 rounded bg-surface-secondary text-text-tertiary">Soon</span>
                    </div>
                  );
                }
                const children = ("children" in item ? item.children : undefined) as
                  | { name: string; href: string; icon: typeof item.icon }[]
                  | undefined;
                const hasChildren = !!children && children.length > 0;
                const isExpanded = hasChildren
                  ? (expandedOverride[item.href] ?? isUnder(item.href))
                  : false;
                const toggleExpanded = (e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setExpandedOverride((s) => ({ ...s, [item.href]: !isExpanded }));
                };
                return (
                  <div key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (hasChildren) {
                          setExpandedOverride((s) => ({ ...s, [item.href]: true }));
                        }
                      }}
                      className={navLinkClass(isActiveForParent(item))}
                      style={{ fontSize: "13.5px" }}
                    >
                      <item.icon size={16} strokeWidth={1.5} />
                      <span>{item.name}</span>
                      {hasChildren && (
                        <button
                          type="button"
                          onClick={toggleExpanded}
                          aria-label={isExpanded ? "Collapse" : "Expand"}
                          aria-expanded={isExpanded}
                          className="ml-auto p-0.5 -mr-0.5 rounded hover:bg-surface-tertiary/60 text-text-tertiary hover:text-text-secondary transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp size={12} strokeWidth={2} />
                          ) : (
                            <ChevronRight size={12} strokeWidth={2} />
                          )}
                        </button>
                      )}
                    </Link>
                    {hasChildren && isExpanded && (
                      <div className="mt-0.5 mb-1 ml-[14px] pl-3 border-l border-border-subtle space-y-0.5">
                        {children!.map((child) => {
                          const childActive = isUnder(child.href);
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={`relative flex items-center gap-2 px-2 h-7 rounded-[6px] transition-colors duration-150 ${
                                childActive
                                  ? "bg-surface-secondary text-text-primary font-medium"
                                  : "text-text-secondary hover:bg-surface-secondary/60"
                              }`}
                              style={{ fontSize: "12.5px" }}
                            >
                              <child.icon size={13} strokeWidth={1.5} />
                              <span>{child.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Demo mode toggle */}
      <div className="px-3 pb-2">
        <button
          onClick={toggle}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-[6px] text-[11px] font-medium transition-all duration-150 ${
            isEmpty
              ? "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
              : "bg-surface-secondary text-text-tertiary hover:text-text-secondary"
          }`}
        >
          {isEmpty ? <EyeOff size={12} strokeWidth={2} /> : <Eye size={12} strokeWidth={2} />}
          {isEmpty ? "Empty State Mode ON" : "Preview Empty States"}
        </button>
      </div>

      {/* User section */}
      <div className="border-t border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-[26px] h-[26px] rounded-full bg-surface-secondary flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-medium text-text-secondary">
              {user.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-text-primary leading-tight flex items-center gap-1.5">
              <span className="truncate">{user.name}</span>
              <UserRolePill />
            </div>
            <div className="text-[10px] text-text-tertiary truncate">{user.email}</div>
          </div>
          <button className="p-1 text-text-tertiary hover:text-text-secondary transition-colors">
            <Settings size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  );
}
