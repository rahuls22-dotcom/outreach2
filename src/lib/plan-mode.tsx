"use client";

// Demo-only plan gating. Mirrors demo-mode.tsx: a simple context with a toggle.
// When `enrichmentOnly` is true, Contact extraction and AI calling agents render
// as locked rows in the sidebar and route to upsell pages under /locked/*.

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface PlanModeContextValue {
  enrichmentOnly: boolean;
  toggle: () => void;
}

const PlanModeContext = createContext<PlanModeContextValue>({
  enrichmentOnly: false,
  toggle: () => {},
});

export function PlanModeProvider({ children }: { children: ReactNode }) {
  const [enrichmentOnly, setEnrichmentOnly] = useState(false);
  const toggle = useCallback(() => setEnrichmentOnly((v) => !v), []);
  return (
    <PlanModeContext.Provider value={{ enrichmentOnly, toggle }}>
      {children}
    </PlanModeContext.Provider>
  );
}

export function usePlanMode() {
  return useContext(PlanModeContext);
}
