"use client";

// Entitlement layer. Single source of truth for which products the workspace
// has purchased. Drives sidebar nav + Settings product tabs. Generalizes the
// old plan-mode.tsx (which only knew "enrichment-only").
//
// Demo-only: products are toggled from the sidebar so you can preview how the
// app collapses for clients on different plans. Persisted to localStorage so
// the selection survives page navigation (mirrors demo-mode.tsx).

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

// Contact Extraction is a separate product from Enrichment — the
// workspace may own one without the other. Added to keep the demo
// presets honest ("Contact Extraction only" is a real customer
// shape we want to preview); route gating still treats the four
// keys independently.
export type ProductKey = "enrichment" | "contact_extraction" | "ai_calling" | "campaigns";

export const ALL_PRODUCTS: { key: ProductKey; label: string }[] = [
  { key: "enrichment",         label: "Enrichment" },
  { key: "contact_extraction", label: "Contact Extraction" },
  { key: "ai_calling",         label: "AI Calling" },
  { key: "campaigns",          label: "Campaigns" },
];

interface ProductsContextValue {
  products: ProductKey[];
  has: (k: ProductKey) => boolean;
  setProducts: (p: ProductKey[]) => void;
  toggleProduct: (k: ProductKey) => void;
  // Derived alias for the old enrichment-only plan. True when the workspace
  // owns ONLY enrichment — keeps the locked/upsell flows working unchanged.
  enrichmentOnly: boolean;
}

const DEFAULT_PRODUCTS: ProductKey[] = ["enrichment", "contact_extraction", "ai_calling", "campaigns"];

// Named presets — each maps to a "preview mode" toggle in the sidebar's
// Demo controls. Lets the demo flip the whole workspace to a customer
// profile in one click instead of toggling individual products. Sales
// uses these because they mirror real customer mixes.
export type ProductPreset =
  | "full"
  | "enrichment_only"
  | "voice_only"
  | "contact_extraction_only"
  | "voice_plus_enrichment";

export const PRODUCT_PRESETS: Record<ProductPreset, ProductKey[]> = {
  full:                    ["enrichment", "contact_extraction", "ai_calling", "campaigns"],
  enrichment_only:         ["enrichment"],
  voice_only:              ["ai_calling", "campaigns"],
  contact_extraction_only: ["contact_extraction"],
  voice_plus_enrichment:   ["enrichment", "ai_calling", "campaigns"],
};

// Resolve which preset (if any) the current product set matches — used
// to highlight the active button in the sidebar's Demo controls.
export function currentPreset(products: ProductKey[]): ProductPreset | null {
  const norm = [...products].sort().join(",");
  for (const [key, list] of Object.entries(PRODUCT_PRESETS)) {
    if ([...list].sort().join(",") === norm) return key as ProductPreset;
  }
  return null;
}

const ProductsContext = createContext<ProductsContextValue>({
  products: DEFAULT_PRODUCTS,
  has: () => true,
  setProducts: () => {},
  toggleProduct: () => {},
  enrichmentOnly: false,
});

const STORAGE_KEY = "revspot:products";

function isValidProduct(v: string): v is ProductKey {
  return (
    v === "enrichment" ||
    v === "contact_extraction" ||
    v === "ai_calling" ||
    v === "campaigns"
  );
}

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProductsState] = useState<ProductKey[]>(DEFAULT_PRODUCTS);

  // Hydrate from localStorage so plan selection survives navs.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const valid = parsed.filter((x): x is ProductKey => typeof x === "string" && isValidProduct(x));
        if (valid.length > 0) setProductsState(valid);
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  const persist = useCallback((next: ProductKey[]) => {
    setProductsState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }, []);

  const setProducts = useCallback((p: ProductKey[]) => persist(p), [persist]);

  const toggleProduct = useCallback(
    (k: ProductKey) => {
      setProductsState((prev) => {
        const next = prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k];
        // Never allow an empty plan — fall back to enrichment so the app
        // always has at least one product surface.
        const safe = next.length === 0 ? (["enrichment"] as ProductKey[]) : next;
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
        }
        return safe;
      });
    },
    [],
  );

  const has = useCallback((k: ProductKey) => products.includes(k), [products]);
  const enrichmentOnly = products.length === 1 && products[0] === "enrichment";

  return (
    <ProductsContext.Provider
      value={{ products, has, setProducts, toggleProduct, enrichmentOnly }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductsContext);
}
