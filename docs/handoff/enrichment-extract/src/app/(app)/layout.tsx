"use client";

// Minimal app shell for the enrichment extract.
// Wraps every (app) route in DemoModeProvider so the variant picker +
// useDemoMode hook work everywhere. Sidebar is a stub that exposes the
// four enrichment routes + the variant picker.

import { DemoModeProvider } from "@/lib/demo-mode";
import { Sidebar } from "@/components/layout/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoModeProvider>
      <div className="min-h-screen flex bg-background">
        <Sidebar />
        <main className="flex-1 min-w-0 p-6 overflow-x-hidden">{children}</main>
      </div>
    </DemoModeProvider>
  );
}
