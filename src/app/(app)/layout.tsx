"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { DemoModeProvider } from "@/lib/demo-mode";
import { SpotRoot } from "@/components/spot/spot-root";
import { useSpotStore } from "@/lib/spot/store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const spotOpen = useSpotStore((s) => s.open);
  return (
    <DemoModeProvider>
      <div className="min-h-screen bg-surface-page">
        <Sidebar />
        <main
          className="ml-sidebar"
          style={{
            marginRight: spotOpen ? 440 : 0,
            transition: "margin-right 240ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div className="max-w-[1400px] mx-auto px-8 py-8">{children}</div>
        </main>
        <SpotRoot />
      </div>
    </DemoModeProvider>
  );
}
