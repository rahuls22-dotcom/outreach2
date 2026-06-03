"use client";

// Minimal sidebar stub for the extract. Lists the four enrichment routes
// and embeds the EnrichmentVariantPicker so demo states are reachable
// without the full app shell.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EnrichmentVariantPicker } from "@/components/data/enrichment-variant-picker";

const ROUTES = [
  { href: "/enrichment", label: "Enrichment (default)" },
  { href: "/enrichment/operations", label: "↳ Operations" },
  { href: "/enrichment/database", label: "↳ Database" },
  { href: "/enrichment-empty", label: "Enrichment (empty)" },
  { href: "/enrichment-empty/operations", label: "↳ Operations" },
  { href: "/enrichment-empty/database", label: "↳ Database" },
  { href: "/enrichment-crm", label: "Enrichment CRM" },
  { href: "/enrichment-crm-empty", label: "Enrichment CRM (empty)" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-[260px] flex-shrink-0 border-r border-border bg-white p-4 flex flex-col gap-4 sticky top-0 h-screen overflow-y-auto">
      <div className="text-[15px] font-semibold text-text-primary">Revspot · Enrichment</div>

      <nav className="flex flex-col gap-0.5">
        {ROUTES.map((r) => {
          const active = pathname === r.href;
          return (
            <Link
              key={r.href}
              href={r.href}
              className={[
                "text-[12.5px] px-2.5 py-1.5 rounded-button transition-colors",
                active
                  ? "bg-surface-secondary text-text-primary font-medium"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary/50",
              ].join(" ")}
            >
              {r.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-border">
        <EnrichmentVariantPicker />
        <p className="text-[10.5px] text-text-tertiary mt-3 leading-snug">
          The variant picker re-renders all enrichment routes through the
          chosen demo state. Selection persists via localStorage.
        </p>
      </div>
    </aside>
  );
}
