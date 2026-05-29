"use client";

import { useEffect } from "react";
import { Check } from "lucide-react";
import { useSpotStore } from "@/lib/spot/store";
import { SpotPanel } from "./spot-panel";
import { SpotCommandPalette } from "./spot-command-palette";
import { SpotFloatingLauncher } from "./spot-floating-launcher";
import { GuidedFlowModal } from "./guided-flow";

/**
 * Mounted once at the app shell level. Provides:
 * - The right-docked Spot panel
 * - The Cmd-K command palette
 * - The floating "Ask Spot" launcher
 * - The guided flow modal
 * - A bottom toast
 * - Global ⌘K / ⌘J keyboard shortcuts
 */
export function SpotRoot() {
  const openPalette = useSpotStore((s) => s.openPalette);
  const togglePanel = useSpotStore((s) => s.togglePanel);
  const toast = useSpotStore((s) => s.toast);
  const dismissToast = useSpotStore((s) => s.dismissToast);

  // ⌘K → palette, ⌘J → toggle panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openPalette();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        togglePanel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPalette, togglePanel]);

  // Auto-dismiss toast after 2.4s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => dismissToast(), 2400);
    return () => clearTimeout(t);
  }, [toast, dismissToast]);

  return (
    <>
      <SpotPanel />
      <SpotFloatingLauncher />
      <SpotCommandPalette />
      <GuidedFlowModal />
      {toast && (
        <div
          className="fadeUp"
          style={{
            position: "fixed",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#111",
            color: "#FAFAF8",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            zIndex: 200,
            boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Check size={14} style={{ color: "#4ADE80" }} />
          {toast}
        </div>
      )}
    </>
  );
}
