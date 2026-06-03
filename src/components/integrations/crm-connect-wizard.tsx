"use client";

// Stepped modal to connect a new CRM (Model A). Six steps: choose CRM, connect
// both directions, pick capabilities, assign products, map fields, test+activate.
// Prototype only — no persistence; on finish it closes. Recommended/Advanced fork
// at the capability step keeps the happy path one click.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Copy,
  Sparkles,
  SlidersHorizontal,
  Plus,
} from "lucide-react";
import {
  WIZARD_PROVIDERS,
  PROVIDER_META,
} from "@/lib/crm-integration-data";
import type { CrmProvider, Capability } from "@/lib/crm-integration-data";
import { ProviderMark } from "./crm-bits";
import { CapabilityPicker } from "./capability-picker";
import { useProducts, ALL_PRODUCTS, type ProductKey } from "@/lib/products";

const STEPS = ["CRM", "Connect", "Capabilities", "Products", "Fields", "Activate"] as const;

// Static issued key — prototype only (Math.random avoided for determinism).
const ISSUED_KEY = "rvk_live_9d4f7a2c8b1e6035";

const STARTER_FIELDS: { revspot: string; crm: string; create: boolean }[] = [
  { revspot: "Full Name", crm: "contact_name", create: false },
  { revspot: "Phone", crm: "phone", create: false },
  { revspot: "Email", crm: "email", create: false },
  { revspot: "Lead Status", crm: "rs_status", create: true },
  { revspot: "Enrichment Data", crm: "rs_enrichment", create: true },
];

export function CrmConnectWizard({ onClose }: { onClose: () => void }) {
  const { products: owned } = useProducts();
  const [step, setStep] = useState(0);
  const [provider, setProvider] = useState<CrmProvider | null>(null);
  const [crmUrl, setCrmUrl] = useState("");
  const [crmKey, setCrmKey] = useState("");
  const [mode, setMode] = useState<"recommended" | "advanced">("recommended");
  const [caps, setCaps] = useState<Capability[]>([
    "read_rows",
    "create_row",
    "update_row",
    "create_field",
  ]);
  const [pickedProducts, setPickedProducts] = useState<ProductKey[]>([]);
  const [fields, setFields] = useState(STARTER_FIELDS);
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [done, setDone] = useState(false);

  const meta = provider ? PROVIDER_META[provider] : null;
  const ownedProducts = ALL_PRODUCTS.filter((p) => owned.includes(p.key));

  const canNext = () => {
    if (step === 0) return !!provider;
    if (step === 1) return crmUrl.trim().length > 3;
    if (step === 2) return caps.length > 0;
    if (step === 3) return pickedProducts.length > 0;
    return true;
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };
  const back = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const copyKey = () => {
    navigator.clipboard?.writeText(ISSUED_KEY).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const runTest = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      setDone(true);
    }, 1600);
  };

  const toggleProductPick = (k: ProductKey) =>
    setPickedProducts((prev) =>
      prev.includes(k) ? prev.filter((p) => p !== k) : [...prev, k],
    );

  const toggleCreate = (i: number) =>
    setFields((prev) => prev.map((f, idx) => (idx === i ? { ...f, create: !f.create } : f)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="relative w-full max-w-[620px] bg-white rounded-card shadow-xl border border-border overflow-hidden flex flex-col max-h-[88vh]"
      >
        {/* Header + stepper */}
        <div className="px-6 pt-5 pb-4 border-b border-border-subtle">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-text-primary">Connect a CRM</h2>
            <button
              onClick={onClose}
              className="text-text-tertiary hover:text-text-primary transition-colors duration-150"
            >
              <X size={17} strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-1.5 flex-1 last:flex-none">
                <div
                  className={`flex items-center gap-1.5 ${
                    i <= step ? "text-text-primary" : "text-text-tertiary"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${
                      i < step
                        ? "bg-accent text-white"
                        : i === step
                          ? "bg-accent/[0.12] text-accent border border-accent"
                          : "bg-surface-secondary text-text-tertiary"
                    }`}
                  >
                    {i < step ? <Check size={11} strokeWidth={2.5} /> : i + 1}
                  </span>
                  <span className="text-[11px] font-medium hidden sm:inline">{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-px flex-1 ${i < step ? "bg-accent" : "bg-border-subtle"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15 }}
            >
              {/* STEP 0 — Choose CRM */}
              {step === 0 && (
                <div>
                  <p className="text-[12.5px] text-text-secondary mb-4">
                    Pick the CRM you want to connect. We&apos;ll set up two-way sync next.
                  </p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {WIZARD_PROVIDERS.map((p) => {
                      const pm = PROVIDER_META[p];
                      const sel = provider === p;
                      return (
                        <button
                          key={p}
                          onClick={() => setProvider(p)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-card border transition-colors duration-150 ${
                            sel
                              ? "border-accent bg-accent/[0.04]"
                              : "border-border hover:border-border-strong"
                          }`}
                        >
                          <ProviderMark provider={p} size={36} />
                          <span className="text-[12px] font-medium text-text-primary">
                            {pm.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 1 — Connect both directions */}
              {step === 1 && meta && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-[13px] font-semibold text-text-primary mb-1">
                      Revspot → {meta.name}
                    </h3>
                    <p className="text-[12px] text-text-secondary mb-2.5">
                      Paste your {meta.name} API endpoint and key so Revspot can read and write.
                    </p>
                    <label className="block text-[11px] font-medium text-text-tertiary uppercase tracking-[0.5px] mb-1">
                      {meta.name} URL
                    </label>
                    <input
                      value={crmUrl}
                      onChange={(e) => setCrmUrl(e.target.value)}
                      placeholder="https://api.your-crm.com/v1/workspace"
                      className="w-full h-9 px-3 text-[13px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-accent transition-colors duration-150 placeholder:text-text-tertiary mb-2.5"
                    />
                    <label className="block text-[11px] font-medium text-text-tertiary uppercase tracking-[0.5px] mb-1">
                      {meta.name} API key
                    </label>
                    <input
                      value={crmKey}
                      onChange={(e) => setCrmKey(e.target.value)}
                      placeholder="Paste your CRM API key"
                      className="w-full h-9 px-3 text-[13px] font-mono border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-accent transition-colors duration-150 placeholder:text-text-tertiary"
                    />
                  </div>

                  <div className="pt-4 border-t border-border-subtle">
                    <h3 className="text-[13px] font-semibold text-text-primary mb-1">
                      {meta.name} → Revspot
                    </h3>
                    <p className="text-[12px] text-text-secondary mb-2.5">
                      Use this key to push leads into Revspot from {meta.name} automations.
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 h-9 px-3 flex items-center text-[12px] font-mono border border-border rounded-input bg-surface-page text-text-primary">
                        {ISSUED_KEY}
                      </code>
                      <button
                        onClick={copyKey}
                        className="inline-flex items-center gap-1.5 h-9 px-3 text-[12px] font-medium border border-border rounded-button text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors duration-150"
                      >
                        {copied ? (
                          <>
                            <Check size={13} strokeWidth={2} className="text-[#15803D]" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy size={13} strokeWidth={1.5} />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 — Capabilities */}
              {step === 2 && (
                <div>
                  <p className="text-[12.5px] text-text-secondary mb-3">
                    What should Revspot be allowed to do in this CRM?
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => {
                        setMode("recommended");
                        setCaps(["read_rows", "create_row", "update_row", "create_field"]);
                      }}
                      className={`inline-flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium rounded-button border transition-colors duration-150 ${
                        mode === "recommended"
                          ? "border-accent bg-accent/[0.04] text-text-primary"
                          : "border-border text-text-secondary hover:border-border-strong"
                      }`}
                    >
                      <Sparkles size={13} strokeWidth={1.5} />
                      Recommended
                    </button>
                    <button
                      onClick={() => setMode("advanced")}
                      className={`inline-flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium rounded-button border transition-colors duration-150 ${
                        mode === "advanced"
                          ? "border-accent bg-accent/[0.04] text-text-primary"
                          : "border-border text-text-secondary hover:border-border-strong"
                      }`}
                    >
                      <SlidersHorizontal size={13} strokeWidth={1.5} />
                      Advanced
                    </button>
                  </div>
                  {mode === "recommended" ? (
                    <div className="p-4 rounded-card border border-border bg-surface-page">
                      <p className="text-[12.5px] text-text-secondary leading-relaxed">
                        Full two-way sync: read existing rows, create new leads, update rows with
                        enrichment + outcomes, and create Revspot-owned fields. Best for most
                        setups.
                      </p>
                    </div>
                  ) : (
                    <CapabilityPicker value={caps} onChange={setCaps} />
                  )}
                </div>
              )}

              {/* STEP 3 — Assign products */}
              {step === 3 && (
                <div>
                  <p className="text-[12.5px] text-text-secondary mb-4">
                    Which products should use this connection? Only products you own are shown.
                  </p>
                  <div className="space-y-2">
                    {ownedProducts.map((p) => {
                      const on = pickedProducts.includes(p.key);
                      return (
                        <button
                          key={p.key}
                          onClick={() => toggleProductPick(p.key)}
                          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-card border transition-colors duration-150 ${
                            on
                              ? "border-accent bg-accent/[0.04]"
                              : "border-border hover:border-border-strong"
                          }`}
                        >
                          <span className="text-[13px] font-medium text-text-primary">
                            {p.label}
                          </span>
                          <span
                            className={`w-4 h-4 rounded-[5px] flex items-center justify-center ${
                              on ? "bg-accent text-white" : "border border-border"
                            }`}
                          >
                            {on && <Check size={11} strokeWidth={2.5} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 4 — Field mapping */}
              {step === 4 && meta && (
                <div>
                  <p className="text-[12.5px] text-text-secondary mb-4">
                    Map Revspot fields to {meta.name}. Fields marked{" "}
                    <span className="text-text-primary font-medium">Create</span> will be added to
                    the CRM at activation.
                  </p>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-subtle">
                        <th className="px-2 py-2 text-[10px] font-medium text-text-tertiary uppercase tracking-[0.5px] text-left">
                          Revspot
                        </th>
                        <th className="px-2 py-2 text-[10px] font-medium text-text-tertiary uppercase tracking-[0.5px] text-left">
                          {meta.name}
                        </th>
                        <th className="px-2 py-2 text-[10px] font-medium text-text-tertiary uppercase tracking-[0.5px] text-right">
                          Create
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((f, i) => (
                        <tr key={f.revspot} className="border-b border-border-subtle last:border-0">
                          <td className="px-2 py-2.5 text-[12px] text-text-primary font-medium">
                            {f.revspot}
                          </td>
                          <td className="px-2 py-2.5">
                            <input
                              defaultValue={f.crm}
                              className="h-7 px-2 text-[12px] font-mono border border-border rounded-[4px] bg-white text-text-primary focus:outline-none focus:border-accent transition-colors duration-150 w-full max-w-[180px]"
                            />
                          </td>
                          <td className="px-2 py-2.5 text-right">
                            <button
                              onClick={() => toggleCreate(i)}
                              className={`relative w-9 h-5 rounded-full transition-colors duration-150 ${
                                f.create ? "bg-accent" : "bg-silver-light"
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-150 ${
                                  f.create ? "translate-x-4" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-text-secondary hover:text-text-primary transition-colors duration-150">
                    <Plus size={12} strokeWidth={1.5} />
                    Add mapping
                  </button>
                </div>
              )}

              {/* STEP 5 — Test & activate */}
              {step === 5 && meta && (
                <div className="text-center py-4">
                  {done ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#F0FDF4] flex items-center justify-center">
                        <Check size={22} strokeWidth={2} className="text-[#15803D]" />
                      </div>
                      <div>
                        <div className="text-[15px] font-semibold text-text-primary">
                          {meta.name} connected
                        </div>
                        <div className="text-[12.5px] text-text-secondary mt-0.5">
                          Serving{" "}
                          {pickedProducts
                            .map((k) => ALL_PRODUCTS.find((p) => p.key === k)?.label)
                            .filter(Boolean)
                            .join(", ")}
                          . Tune per-product behavior in Settings.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center">
                        {testing ? (
                          <Loader2 size={22} strokeWidth={2} className="text-accent animate-spin" />
                        ) : (
                          <ArrowRight size={22} strokeWidth={1.5} className="text-text-tertiary" />
                        )}
                      </div>
                      <div>
                        <div className="text-[15px] font-semibold text-text-primary">
                          {testing ? "Testing connection…" : "Ready to activate"}
                        </div>
                        <div className="text-[12.5px] text-text-secondary mt-0.5">
                          {testing
                            ? `Verifying ${meta.name} credentials and field access.`
                            : "We'll verify credentials, create the marked fields, and start syncing."}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-between">
          <button
            onClick={back}
            disabled={step === 0}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-[12.5px] font-medium text-text-secondary hover:text-text-primary transition-colors duration-150 disabled:opacity-0"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={next}
              disabled={!canNext()}
              className="inline-flex items-center gap-1.5 h-9 px-5 bg-accent text-white text-[12.5px] font-medium rounded-button hover:bg-accent-hover transition-colors duration-150 disabled:opacity-40"
            >
              Continue
              <ArrowRight size={14} strokeWidth={2} />
            </button>
          ) : done ? (
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 h-9 px-5 bg-accent text-white text-[12.5px] font-medium rounded-button hover:bg-accent-hover transition-colors duration-150"
            >
              Done
            </button>
          ) : (
            <button
              onClick={runTest}
              disabled={testing}
              className="inline-flex items-center gap-1.5 h-9 px-5 bg-accent text-white text-[12.5px] font-medium rounded-button hover:bg-accent-hover transition-colors duration-150 disabled:opacity-60"
            >
              {testing ? "Testing…" : "Test & activate"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
