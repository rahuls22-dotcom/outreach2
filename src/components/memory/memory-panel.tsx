"use client";

// Memory · the persistent, cross-conversation product knowledge hub, as a
// project-scoped, closeable SIDE PANEL.
//
// Memory is reached from inside a project (Projects → a project → "Memory"),
// and from Spot. Clicking it slides this drawer in over the current screen —
// scoped to THAT one project, closeable right there (X · scrim · Esc). You
// never leave the page you were on.
//
// Every tab is a VIEWER for one real markdown file in Spot's per-project
// memory filesystem — nothing more:
//
//   Product        → product.md   (brief + pricing + USPs + the source
//                                  material Spot read, merged into one page)
//   Personas       → personas.md  (identity only — who they are, what hurts,
//                                  what lands; no performance, no scorecard)
//   Active memory  → CLAUDE.md     (Spot's durable working memory — Summary ·
//                                  Live Campaigns · Performance · Change
//                                  History — auto-loaded every turn; earned
//                                  as campaigns run)
//
// Each file is rendered through one clean markdown beautifier (MarkdownDoc).
// No bespoke per-section widgets: what's in the file is what shows.
//
// The shell (provider + drawer + tab nav) is deliberately the same shell the
// fuller multi-level (user / project / global) memory will build on later;
// only the project layer is wired up for now.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Brain, X, FileText, Users, Activity } from "lucide-react";
import { PRODUCTS } from "@/lib/products-data";
import { PERSONAS, type Persona } from "@/lib/personas-data";
import { memoryFilesFor, type ProductMemoryFiles } from "@/lib/spot/memory-files";
import { activeMemoryFor, activeMemoryMdFor } from "@/lib/spot/active-memory";
import { MarkdownDoc } from "./md-doc";

/* ════════════════════════════════════════════════════════════════
 * CONTEXT · one panel, opened from anywhere with openMemory(productId)
 *
 * Mounted once at the app shell (outside page-level transforms), so the
 * drawer's `position: fixed` is always relative to the viewport, and any
 * call site — a project page, a Spot card, a workflow screen — can pop it
 * open for a specific product without owning its own copy.
 * ═══════════════════════════════════════════════════════════════ */

interface MemoryPanelCtx {
  /** Open the memory drawer scoped to one product (= one project). */
  openMemory: (productId: string) => void;
  /** Close the drawer. */
  closeMemory: () => void;
}

const Ctx = createContext<MemoryPanelCtx | null>(null);

export function useMemoryPanel(): MemoryPanelCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useMemoryPanel must be used within a <MemoryProvider>");
  }
  return ctx;
}

export function MemoryProvider({ children }: { children: ReactNode }) {
  const [productId, setProductId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const openMemory = useCallback((id: string) => {
    setProductId(id);
    setOpen(true);
  }, []);
  const closeMemory = useCallback(() => setOpen(false), []);

  return (
    <Ctx.Provider value={{ openMemory, closeMemory }}>
      {children}
      <MemoryDrawer productId={productId} open={open} onClose={closeMemory} />
    </Ctx.Provider>
  );
}

/* ════════════════════════════════════════════════════════════════
 * DRAWER
 * ═══════════════════════════════════════════════════════════════ */

type TabKey = "product" | "personas" | "active";

const TABS: { key: TabKey; label: string; icon: typeof FileText; file: string }[] = [
  { key: "product", label: "Product", icon: FileText, file: "product.md" },
  { key: "personas", label: "Personas", icon: Users, file: "personas.md" },
  { key: "active", label: "Active memory", icon: Activity, file: "CLAUDE.md" },
];

/** Personas linked to a product — the cross-product persona library, filtered. */
function personasForProduct(productId: string): Persona[] {
  return PERSONAS.filter((p) => p.products.some((x) => x.id === productId));
}

function MemoryDrawer({
  productId,
  open,
  onClose,
}: {
  productId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<TabKey>("product");

  // Reset to the first tab whenever the drawer is pointed at a new project,
  // so reopening for product B never lands on product A's last-viewed tab.
  useEffect(() => {
    setTab("product");
  }, [productId]);

  // While open: Esc closes, and the page behind is scroll-locked so the
  // drawer's own scroll doesn't fight the page's.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !productId) return null;
  const files = memoryFilesFor(productId);
  if (!files) return null;

  return (
    <>
      {/* Backdrop — matches the app's other drawers (lighter scrim, high z) */}
      <div className="fixed inset-0 bg-black/20 z-[60]" onClick={onClose} aria-hidden />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-[760px] bg-white shadow-lg border-l border-border z-[70] flex flex-col">
        {/* Header — brain · "Memory" · the project name. Nothing else. */}
        <div className="px-6 pt-5 pb-4 border-b border-border-subtle flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-card bg-[#FAF8F2] border border-[#E8E3D5] flex items-center justify-center flex-shrink-0">
              <Brain size={16} strokeWidth={1.5} className="text-text-secondary" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-text-tertiary uppercase tracking-[0.6px] mb-0.5">
                Memory
              </div>
              <h2 className="text-[19px] font-semibold text-text-primary leading-tight truncate">
                {files.productName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close memory"
            className="shrink-0 p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-page rounded-button transition-colors"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Tab nav */}
        <TabNav tab={tab} onChange={setTab} files={files} />

        {/* Body — scrolls */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "product" && <ProductTab files={files} />}
          {tab === "personas" && <PersonasTab files={files} />}
          {tab === "active" && <ActiveMemoryTab files={files} />}
        </div>
      </div>
    </>
  );
}

/* ─── Tab nav ──────────────────────────────────────────────────── */

function TabNav({
  tab,
  onChange,
  files,
}: {
  tab: TabKey;
  onChange: (k: TabKey) => void;
  files: ProductMemoryFiles;
}) {
  const product = PRODUCTS.find((p) => p.id === files.productId);
  const mem = activeMemoryFor(files.productId);
  const tabCounts: Partial<Record<TabKey, string>> = {
    product: `${product?.collateral.length ?? 0}`,
    personas: `${personasForProduct(files.productId).length}`,
    active: `${mem?.campaigns.length ?? 0}`,
  };
  return (
    <div className="flex items-end px-6 border-b border-border-subtle bg-surface-page overflow-x-auto">
      {TABS.map((t) => {
        const Icon = t.icon;
        const active = t.key === tab;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={`relative inline-flex items-center gap-1.5 py-3 px-3 text-[12.5px] font-medium transition-colors whitespace-nowrap ${
              active ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Icon size={12} strokeWidth={1.7} />
            <span>{t.label}</span>
            {tabCounts[t.key] && tabCounts[t.key] !== "0" && (
              <span className="text-[10px] text-text-tertiary tabular">
                {tabCounts[t.key]}
              </span>
            )}
            {active && (
              <span
                aria-hidden
                className="absolute left-3 right-3 -bottom-px h-0.5 bg-text-primary rounded-full"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─── File-path breadcrumb · the "this is a real file Spot reads" cue ── */

function FilePathBreadcrumb({ productId, file }: { productId: string; file: string }) {
  const slug = productId.replace(/^prod-/, "");
  return (
    <div className="font-mono text-[10.5px] text-text-tertiary mb-5 inline-flex items-center gap-1">
      <span>memory</span>
      <span className="text-text-tertiary/60">/</span>
      <span>{slug}</span>
      <span className="text-text-tertiary/60">/</span>
      <span className="text-text-secondary">{file}</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
 * TABS · each one is just the file path + the markdown file, rendered.
 * ═══════════════════════════════════════════════════════════════ */

function ProductTab({ files }: { files: ProductMemoryFiles }) {
  return (
    <div>
      <FilePathBreadcrumb productId={files.productId} file="product.md" />
      <MarkdownDoc source={files.productInfoMd} />
    </div>
  );
}

function PersonasTab({ files }: { files: ProductMemoryFiles }) {
  return (
    <div>
      <FilePathBreadcrumb productId={files.productId} file="personas.md" />
      <MarkdownDoc source={files.personasMd} />
    </div>
  );
}

function ActiveMemoryTab({ files }: { files: ProductMemoryFiles }) {
  const md = activeMemoryMdFor(files.productId);
  if (!md) return null;
  return (
    <div>
      <FilePathBreadcrumb productId={files.productId} file="CLAUDE.md" />
      <MarkdownDoc source={md} />
    </div>
  );
}
