"use client";

// Expanded sidebar (240px). Sourced from the mvp-final layout, but the Spot
// row is a Link to /spot (demo behavior) so the full Spot workflow surface
// still owns the right pane.
//
// Order (top → bottom):
//   1. Spot               (demo)
//   2. Dashboard          (mvp)
//   3. Projects           (mvp)
//   4. Campaigns          (demo)
//   5. Leads              (demo, route /enquiries)
//   6. Outreach           (demo)
//   (Memory is no longer in the nav — reached from Projects → Memory)
//   8. Tools section      (mvp): Enrichment (children), Contact extraction
//                                 (children), Creatives, AI calling agents,
//                                 Audiences (Soon).
//   — no Workspace section
//   9. Wallet widget      (mvp)
//  10. Demo toggles       (mvp): Empty State, Enrichment-Only, Enrichment
//                                 demo view
//  11. User + Settings    (mvp)

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  FolderKanban,
  Monitor,
  FileText,
  Globe,
  Image as ImageIcon,
  Settings,
  Eye,
  EyeOff,
  UserSearch,
  ContactRound,
  ChevronRight,
  ChevronUp,
  Activity,
  Database,
  ScanLine,
  ListChecks,
  Lock,
  PhoneCall,
  Wallet,
  Send,
  ChevronDown,
  MessageCircle,
  LogOut,
} from "lucide-react";
import { useLogout } from "@/lib/auth-actions";
import { useDemoMode } from "@/lib/demo-mode";
import { useProducts, PRODUCT_PRESETS, currentPreset, type ProductKey, type ProductPreset } from "@/lib/products";
import { useSpotStore } from "@/lib/spot/store";
import { SpotMark } from "@/components/spot/spot-mark";
import { WorkspaceSwitcher, UserRolePill } from "@/components/layout/workspace-switcher";
import { useCurrentUser } from "@/lib/workspace-store";
import { poolSummary } from "@/lib/credits-data";

// ─── Top standalone items (above sections) ───────────────────────
// Nav items carry their own entitlement so the renderer can lock/unlock
// each row independently without a giant URL-match ladder. `product` is
// an array (OR semantics): an item with product: ["enrichment",
// "contact_extraction"] unlocks when the workspace owns either product.
// Items without a product list are brand-wide / always accessible.
// `lockedHref` is the route the lock state navigates to; we reuse the
// two existing /locked stubs since they map cleanly to the data vs.
// calling worlds.
type NavMeta = {
  product?: ProductKey[];
  lockedHref?: string;
};
const dashboardItem = { name: "Dashboard", href: "/dashboard", icon: LayoutGrid };
const projectsItem: { name: string; href: string; icon: typeof LayoutGrid } & NavMeta =
  { name: "Projects",  href: "/projects",  icon: FolderKanban };
const campaignsItem: { name: string; href: string; icon: typeof LayoutGrid } & NavMeta =
  { name: "Campaigns", href: "/campaigns", icon: Monitor,
    product: ["campaigns"], lockedHref: "/locked/ai-calling-agents" };
const leadsItem: { name: string; href: string; icon: typeof LayoutGrid } & NavMeta =
  { name: "Leads",     href: "/enquiries", icon: FileText,
    product: ["enrichment", "contact_extraction"], lockedHref: "/locked/contact-extraction" };
const outreachItem: { name: string; href: string; icon: typeof LayoutGrid } & NavMeta =
  { name: "Outreach",  href: "/outreach",  icon: Send,
    product: ["ai_calling"], lockedHref: "/locked/ai-calling-agents" };

function formatInrShort(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function WalletWidget() {
  // Sourced from the same `poolSummary()` helper the billing/usage
  // pages use — so the sidebar's number never disagrees with what the
  // user sees on /settings/billing. Displayed in ₹ instead of minutes
  // because the wallet itself is denominated in money.
  const { utilized, totalCredits, pctUsed } = poolSummary();
  const tone = { bar: "rgba(15, 23, 42, 0.78)", text: "text-text-primary" };

  return (
    <div className="px-3 pb-2">
      <div className="rounded-[8px] border border-border-subtle bg-white px-2.5 py-2">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Wallet size={11} strokeWidth={1.75} className="text-text-tertiary shrink-0" />
          <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.5px]">
            Wallet
          </span>
          <span className={`text-[10px] font-semibold tabular-nums ${tone.text} ml-auto`}>
            {Math.round(pctUsed)}%
          </span>
        </div>
        <div className="h-1 rounded-full bg-surface-secondary overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pctUsed.toFixed(1)}%`, background: tone.bar }}
          />
        </div>
        {/* Top up affordance removed for v1 — the wallet shows the
            running state but adding money isn't a v1 surface; it
            comes back when we revisit billing. */}
        <div className="flex items-center mt-1.5 text-[10px] tabular-nums">
          <span className="text-text-tertiary">
            <span className="text-text-secondary font-medium">{formatInrShort(utilized)}</span>
            <span className="mx-0.5">/</span>
            {formatInrShort(totalCredits)}
          </span>
        </div>
      </div>
    </div>
  );
}

// Tools section — data and ops surfaces. Each item declares the
// products that unlock it; the renderer flips it into a locked row
// when the active product preview doesn't include any of them.
const toolsSection = {
  label: "Tools",
  items: [
    {
      name: "Enrichment",
      href: "/enrichment",
      icon: UserSearch,
      product: ["enrichment"] as ProductKey[],
      lockedHref: "/locked/contact-extraction",
      children: [
        { name: "Dashboard", href: "/enrichment", icon: LayoutGrid },
        { name: "Enrich", href: "/enrichment/operations", icon: Activity },
        { name: "History", href: "/enrichment/database", icon: Database },
      ],
    },
    {
      name: "Extraction",
      href: "/contact-extraction",
      icon: ContactRound,
      product: ["contact_extraction"] as ProductKey[],
      lockedHref: "/locked/contact-extraction",
      children: [
        { name: "New extraction", href: "/contact-extraction/operations", icon: ScanLine },
        { name: "All contacts", href: "/contact-extraction/database", icon: ListChecks },
      ],
    },
  ],
};

// Agents section — every agent the workspace can run. Voice is the
// renamed AI calling agents surface; WhatsApp is a new agent type
// not yet shipped (rendered as Coming Soon); Creatives moves here
// because creative generation is also agent work rather than a tool.
const agentsSection = {
  label: "Agents",
  items: [
    { name: "Voice",     href: "/agents-mvp",      icon: PhoneCall,
      product: ["ai_calling"] as ProductKey[], lockedHref: "/locked/ai-calling-agents" },
    { name: "WhatsApp",  href: "/agents/whatsapp", icon: MessageCircle, comingSoon: true },
    { name: "Creatives", href: "/creatives",       icon: ImageIcon,
      product: ["campaigns"] as ProductKey[], lockedHref: "/locked/ai-calling-agents" },
  ],
};

export function Sidebar() {
  const pathname = usePathname() || "";
  const { isEmpty, toggle, enrichmentVariant, setEnrichmentVariant } = useDemoMode();
  const { products, setProducts, enrichmentOnly, has } = useProducts();
  const activePreset = currentPreset(products);

  // Render-helper: given an item with optional `product` + `lockedHref`,
  // decide whether it should render in its locked state and where the
  // lock points. Items with no `product` are brand-wide (always
  // accessible). All sections are visible in every preset; this just
  // flips the row chrome.
  const lockInfo = (item: NavMeta) => {
    const isLocked = !!(item.product && !item.product.some(has));
    return { isLocked, lockedHref: isLocked ? (item.lockedHref ?? null) : null };
  };
  const spotOpen = useSpotStore((s) => s.open);
  const user = useCurrentUser();
  const logout = useLogout();

  // Manual expand/collapse overrides per parent href. `undefined` = follow the
  // route default (expanded when current path is under the parent). Toggling
  // the caret sets an explicit boolean; navigating elsewhere doesn't reset it.
  const [expandedOverride, setExpandedOverride] = useState<Record<string, boolean>>({});

  // All demo-mode toggles (Preview Empty States, Enrichment-Only,
  // Enrichment demo view) live under one collapsible block. Default
  // closed so the sidebar stays focused on real navigation; the
  // sales-engineer can pop it open during a demo.
  const [demoControlsOpen, setDemoControlsOpen] = useState(false);

  const isUnder = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    if (href === "/spot") return pathname === "/spot";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const isExactlyAt = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname === href;
  };

  // Parent gets "active" treatment for any sub-route, including its children —
  // EXCEPT we want the parent's row not to look pressed while a child is the
  // current page. So highlight parent only when exactly on it.
  const isActiveForParent = (item: { href: string; children?: { href: string }[] }) => {
    if (item.children && item.children.length > 0) {
      const childOwnsParentRoute = item.children.some((c) => c.href === item.href);
      if (childOwnsParentRoute) return false;
      return isExactlyAt(item.href);
    }
    return isUnder(item.href);
  };

  const navLinkClass = (active: boolean) =>
    `relative flex items-center gap-2.5 px-2 h-8 rounded-[6px] transition-colors duration-150 ${
      active
        ? "bg-surface-secondary text-text-primary font-medium"
        : "text-text-secondary hover:bg-surface-secondary/60"
    }`;


  return (
    <aside
      className="fixed left-2 top-2 bottom-2 w-[224px] bg-white flex flex-col z-50 overflow-hidden rounded-[14px]"
      style={{
        border: "1px solid var(--spot-card-border)",
        boxShadow: "var(--spot-shadow)",
      }}
    >
      {/* Workspace switcher · sits in the brand row */}
      <div className="px-2 pt-3 pb-2 border-b border-border-subtle">
        <WorkspaceSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-1 pb-2">
        {/* Spot · brand-wide, always visible. */}
        <div className="mb-1 space-y-0.5">
          <Link
            href="/spot"
            className={`relative flex items-center gap-2.5 px-2 h-8 rounded-[6px] transition-colors duration-150 ${
              isUnder("/spot") || spotOpen
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
          </Link>
        </div>

        {/* Dashboard · brand-wide standalone, above the sections. */}
        <div className="mb-3 space-y-0.5">
          <Link
            key={dashboardItem.href}
            href={dashboardItem.href}
            className={navLinkClass(isUnder(dashboardItem.href))}
            style={{ fontSize: "13.5px" }}
          >
            <dashboardItem.icon size={16} strokeWidth={1.5} />
            <span>{dashboardItem.name}</span>
          </Link>
        </div>

        {/* LAUNCH · always rendered; each row locks individually based
            on the active product preview preset. Projects is brand-wide;
            Campaigns needs campaigns, Outreach needs ai_calling. Memory
            is reached from a project's Memory button, not the nav. */}
        <div className="mb-3">
          <div className="label-section px-2 mb-1">Launch</div>
          <div className="space-y-0.5">
            {[projectsItem, campaignsItem, outreachItem].map((item) => {
              const { lockedHref } = lockInfo(item);
              if (lockedHref) {
                const locked = isUnder(lockedHref);
                return (
                  <Link
                    key={item.href}
                    href={lockedHref}
                    className={`relative flex items-center gap-2.5 px-2 h-8 rounded-[6px] transition-colors duration-150 ${
                      locked
                        ? "bg-surface-secondary text-text-primary font-medium"
                        : "text-text-tertiary hover:bg-surface-secondary/60 hover:text-text-secondary"
                    }`}
                    style={{ fontSize: "13.5px" }}
                  >
                    <item.icon size={16} strokeWidth={1.5} />
                    <span>{item.name}</span>
                    <Lock size={11} strokeWidth={1.75} className="ml-auto text-text-tertiary" aria-label="Locked" />
                  </Link>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={navLinkClass(isUnder(item.href))}
                  style={{ fontSize: "13.5px" }}
                >
                  <item.icon size={16} strokeWidth={1.5} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Tools section · always rendered. Each item locks
            individually based on the active product preview. */}
        {(() => {
          const items = toolsSection.items;
          if (items.length === 0) return null;
          return (
            <div className="mb-3">
              <div className="label-section px-2 mb-1">{toolsSection.label}</div>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const { lockedHref } = lockInfo(item);
                  if (lockedHref) {
                    const locked = isUnder(lockedHref);
                    return (
                      <Link
                        key={item.href}
                        href={lockedHref}
                        className={`relative flex items-center gap-2.5 px-2 h-8 rounded-[6px] transition-colors duration-150 ${
                          locked
                            ? "bg-surface-secondary text-text-primary font-medium"
                            : "text-text-tertiary hover:bg-surface-secondary/60 hover:text-text-secondary"
                        }`}
                        style={{ fontSize: "13.5px" }}
                      >
                        <item.icon size={16} strokeWidth={1.5} />
                        <span>{item.name}</span>
                        <Lock
                          size={11}
                          strokeWidth={1.75}
                          className="ml-auto text-text-tertiary"
                          aria-label="Locked"
                        />
                      </Link>
                    );
                  }
                  const cs = "comingSoon" in item && item.comingSoon;
                  if (cs) {
                    return (
                      <div
                        key={item.href}
                        className="relative flex items-center gap-2.5 px-2 h-8 rounded-[6px] text-text-tertiary cursor-default"
                        style={{ fontSize: "13.5px" }}
                      >
                        <item.icon size={16} strokeWidth={1.5} />
                        <span>{item.name}</span>
                        <span className="ml-auto text-[8px] font-medium px-1 py-0.5 rounded bg-surface-secondary text-text-tertiary">
                          Soon
                        </span>
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
                          {children!
                            .filter((child) => {
                              // No-storage clients have no persistent records DB,
                              // so the "History" sub-tab is hidden.
                              if (
                                enrichmentVariant === "no-storage" &&
                                child.href === "/enrichment/database"
                              ) {
                                return false;
                              }
                              return true;
                            })
                            .map((child) => {
                              const childActive =
                                child.href === item.href
                                  ? pathname === child.href
                                  : isUnder(child.href);
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
          );
        })()}

        {/* CONTACTS section · always rendered; Leads unlocks for any
            workspace that owns enrichment or contact-extraction. */}
        <div className="mb-3">
          <div className="label-section px-2 mb-1">Contacts</div>
          <div className="space-y-0.5">
            {(() => {
              const { lockedHref } = lockInfo(leadsItem);
              if (lockedHref) {
                const locked = isUnder(lockedHref);
                return (
                  <Link
                    key={leadsItem.href}
                    href={lockedHref}
                    className={`relative flex items-center gap-2.5 px-2 h-8 rounded-[6px] transition-colors duration-150 ${
                      locked
                        ? "bg-surface-secondary text-text-primary font-medium"
                        : "text-text-tertiary hover:bg-surface-secondary/60 hover:text-text-secondary"
                    }`}
                    style={{ fontSize: "13.5px" }}
                  >
                    <leadsItem.icon size={16} strokeWidth={1.5} />
                    <span>{leadsItem.name}</span>
                    <Lock size={11} strokeWidth={1.75} className="ml-auto text-text-tertiary" aria-label="Locked" />
                  </Link>
                );
              }
              return (
                <Link
                  key={leadsItem.href}
                  href={leadsItem.href}
                  className={navLinkClass(isUnder(leadsItem.href))}
                  style={{ fontSize: "13.5px" }}
                >
                  <leadsItem.icon size={16} strokeWidth={1.5} />
                  <span>{leadsItem.name}</span>
                </Link>
              );
            })()}
          </div>
        </div>

        {/* AGENTS section · always rendered. Voice needs ai_calling,
            Creatives needs campaigns; WhatsApp is a coming-soon
            teaser independent of entitlement. */}
        <div className="mb-3">
          <div className="label-section px-2 mb-1">{agentsSection.label}</div>
          <div className="space-y-0.5">
            {agentsSection.items.map((item) => {
              if ("comingSoon" in item && item.comingSoon) {
                return (
                  <div
                    key={item.href}
                    className="relative flex items-center gap-2.5 px-2 h-8 rounded-[6px] text-text-tertiary cursor-default"
                    style={{ fontSize: "13.5px" }}
                  >
                    <item.icon size={16} strokeWidth={1.5} />
                    <span>{item.name}</span>
                    <span className="ml-auto text-[8px] font-medium px-1 py-0.5 rounded bg-surface-secondary text-text-tertiary">
                      Soon
                    </span>
                  </div>
                );
              }
              const { lockedHref } = lockInfo(item);
              if (lockedHref) {
                const locked = isUnder(lockedHref);
                return (
                  <Link
                    key={item.href}
                    href={lockedHref}
                    className={`relative flex items-center gap-2.5 px-2 h-8 rounded-[6px] transition-colors duration-150 ${
                      locked
                        ? "bg-surface-secondary text-text-primary font-medium"
                        : "text-text-tertiary hover:bg-surface-secondary/60 hover:text-text-secondary"
                    }`}
                    style={{ fontSize: "13.5px" }}
                  >
                    <item.icon size={16} strokeWidth={1.5} />
                    <span>{item.name}</span>
                    <Lock size={11} strokeWidth={1.75} className="ml-auto text-text-tertiary" aria-label="Locked" />
                  </Link>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={navLinkClass(isUnder(item.href))}
                  style={{ fontSize: "13.5px" }}
                >
                  <item.icon size={16} strokeWidth={1.5} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Wallet — always visible above the demo controls */}
      <WalletWidget />

      {/* Demo controls — collapsible. Empty State + Enrichment-Only +
          Enrichment demo view all sit under one disclosure now. Default
          closed because none of them is a real customer-facing control;
          the indigo dot on the header surfaces when any control is in
          a non-default state, so the operator can tell at a glance. */}
      <div className="px-3 pb-2">
        {(() => {
          const anyActive = isEmpty || enrichmentOnly || enrichmentVariant !== "populated";
          return (
            <>
              <button
                type="button"
                onClick={() => setDemoControlsOpen((v) => !v)}
                className="w-full flex items-center gap-1 px-1 py-1.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-text-tertiary hover:text-text-secondary transition-colors"
                aria-expanded={demoControlsOpen}
              >
                {demoControlsOpen ? (
                  <ChevronDown size={9} strokeWidth={2} className="shrink-0" />
                ) : (
                  <ChevronRight size={9} strokeWidth={2} className="shrink-0" />
                )}
                <span>Demo controls</span>
                {!demoControlsOpen && anyActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#6366F1]" aria-label="A demo control is active" />
                )}
              </button>
              {demoControlsOpen && (
                <div className="space-y-1.5 mt-1">
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
                  {/* Product preview presets — one button per customer
                      shape we want to preview. Clicking an active preset
                      toggles back to the full workspace, so the picker
                      doubles as a "reset to everything" affordance. The
                      presets drive the same nav gating the old single
                      Enrichment-Only toggle did (lock screens, upsell
                      flows), just with more shapes to flip between. */}
                  <div className="pt-1">
                    <div className="px-1 pb-1 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
                      Product preview
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {([
                        { id: "enrichment_only",         label: "Enrichment only" },
                        { id: "voice_only",              label: "Voice AI only" },
                        { id: "contact_extraction_only", label: "Contact Extraction only" },
                        { id: "voice_plus_enrichment",   label: "Voice + Enrichment" },
                      ] as { id: ProductPreset; label: string }[]).map((opt) => {
                        const active = activePreset === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              setProducts(
                                active
                                  ? PRODUCT_PRESETS.full
                                  : PRODUCT_PRESETS[opt.id],
                              )
                            }
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-[6px] text-[11px] font-medium transition-all duration-150 ${
                              active
                                ? "bg-[#EEF2FF] text-[#3730A3] border border-[#C7D2FE]"
                                : "bg-surface-secondary text-text-tertiary hover:text-text-secondary"
                            }`}
                          >
                            <Lock size={12} strokeWidth={2} />
                            {active ? `${opt.label} ON` : `Preview ${opt.label}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Enrichment demo view · 4 chips. Drives every /enrichment
                      tab from one place so the user can A/B states without
                      leaving the sidebar. */}
                  <div className="pt-1">
                    <div className="px-1 pb-1 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
                      Enrichment demo view
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { key: "populated", label: "Populated" },
                        { key: "empty", label: "Empty" },
                        { key: "no-crm", label: "No CRM" },
                        { key: "no-storage", label: "No storage" },
                      ].map((opt) => {
                        const active = enrichmentVariant === opt.key;
                        return (
                          <button
                            key={opt.key}
                            onClick={() => setEnrichmentVariant(opt.key as typeof enrichmentVariant)}
                            className={`px-2 py-1.5 rounded-[6px] text-[11px] font-medium transition-all duration-150 ${
                              active
                                ? "bg-text-primary text-white"
                                : "bg-surface-secondary text-text-tertiary hover:text-text-secondary"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* User row · name + role + email + trailing action. The action is
          role-gated: admins get the Settings gear (settings is admin-only);
          members get Log out directly, since they have no settings surface
          to reach it from. Exactly one action, sized to the role. */}
      <div className="border-t border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-[26px] h-[26px] rounded-full bg-surface-secondary flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-medium text-text-secondary">
              {user.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-text-primary leading-tight flex items-center gap-1.5">
              <span className="truncate">{user.name}</span>
              <UserRolePill />
            </div>
            <div className="text-[10px] text-text-tertiary truncate">{user.email}</div>
          </div>
          {user.role === "admin" ? (
            <Link
              href="/settings"
              aria-label="Settings"
              className={`p-1 transition-colors ${
                isUnder("/settings")
                  ? "text-text-primary"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              <Settings size={14} strokeWidth={1.5} />
            </Link>
          ) : (
            <button
              type="button"
              onClick={logout}
              aria-label="Log out"
              title="Log out"
              className="p-1 text-text-tertiary hover:text-[#DC2626] transition-colors"
            >
              <LogOut size={14} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
