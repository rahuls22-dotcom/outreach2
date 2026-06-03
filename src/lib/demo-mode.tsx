"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

type DemoMode = "populated" | "empty";

// Module-scoped variant for the Enrichment product. Drives Dashboard,
// Operations, Database, and CRM-tab states from a single picker.
export type EnrichmentVariant = "populated" | "empty" | "no-crm" | "no-storage";

interface DemoModeContextValue {
  mode: DemoMode;
  toggle: () => void;
  setMode: (m: DemoMode) => void;
  isEmpty: boolean;
  // Enrichment-only demo variant. Independent of the global isEmpty so
  // toggling enrichment to no-crm doesn't blank out other modules.
  enrichmentVariant: EnrichmentVariant;
  setEnrichmentVariant: (v: EnrichmentVariant) => void;
  isEnrichmentEmpty: boolean;
  isEnrichmentNoCrm: boolean;
  isEnrichmentNoStorage: boolean;
  // No-CRM flow: user has submitted a "connect via support" request. Flips
  // the CRM connect banner from CTA → pending state. Persists across navs.
  crmRequestSubmitted: boolean;
  setCrmRequestSubmitted: (v: boolean) => void;
}

const DemoModeContext = createContext<DemoModeContextValue>({
  mode: "populated",
  toggle: () => {},
  setMode: () => {},
  isEmpty: false,
  enrichmentVariant: "populated",
  setEnrichmentVariant: () => {},
  isEnrichmentEmpty: false,
  isEnrichmentNoCrm: false,
  isEnrichmentNoStorage: false,
  crmRequestSubmitted: false,
  setCrmRequestSubmitted: () => {},
});

const STORAGE_KEY = "revspot:enrichment-variant";
const CRM_REQUEST_KEY = "revspot:crm-request-submitted";

function isValidVariant(v: string | null): v is EnrichmentVariant {
  return v === "populated" || v === "empty" || v === "no-crm" || v === "no-storage";
}

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<DemoMode>("populated");
  const [enrichmentVariant, setEnrichmentVariantState] =
    useState<EnrichmentVariant>("populated");
  const [crmRequestSubmitted, setCrmRequestSubmittedState] = useState(false);

  // Hydrate enrichment variant + CRM-request flag from localStorage so demo
  // state survives page nav.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isValidVariant(stored)) setEnrichmentVariantState(stored);
    setCrmRequestSubmittedState(window.localStorage.getItem(CRM_REQUEST_KEY) === "1");
  }, []);

  const setEnrichmentVariant = useCallback((v: EnrichmentVariant) => {
    setEnrichmentVariantState(v);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, v);
    }
  }, []);

  const setCrmRequestSubmitted = useCallback((v: boolean) => {
    setCrmRequestSubmittedState(v);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CRM_REQUEST_KEY, v ? "1" : "0");
    }
  }, []);

  const toggle = useCallback(
    () => setMode((m) => (m === "populated" ? "empty" : "populated")),
    [],
  );

  // Global "Preview Empty States" and the enrichment variant are independent
  // controls now. Sidebar exposes both side-by-side so flipping enrichment to
  // "No CRM" doesn't blank out non-enrichment modules.
  const globalEmpty = mode === "empty";

  return (
    <DemoModeContext.Provider
      value={{
        mode,
        toggle,
        setMode,
        isEmpty: globalEmpty,
        enrichmentVariant,
        setEnrichmentVariant,
        isEnrichmentEmpty: enrichmentVariant === "empty",
        isEnrichmentNoCrm: enrichmentVariant === "no-crm",
        isEnrichmentNoStorage: enrichmentVariant === "no-storage",
        crmRequestSubmitted,
        setCrmRequestSubmitted,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoModeContext);
}
