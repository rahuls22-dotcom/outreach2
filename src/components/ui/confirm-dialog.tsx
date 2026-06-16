"use client";

import { AlertTriangle } from "lucide-react";

/**
 * Generic confirm modal — scrim + fadeUp, matching the invite modal pattern.
 * Used for destructive actions (remove member) where a misclick is costly.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onCancel} />
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 110,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4vh 16px",
          pointerEvents: "none",
        }}
      >
        <div
          className="fadeUp"
          style={{
            width: "min(420px, 100%)",
            background: "#FFF",
            borderRadius: 14,
            boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
            overflow: "hidden",
            pointerEvents: "auto",
          }}
        >
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-start gap-3">
              {destructive && (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--err-bg)", color: "var(--err-fg)" }}
                >
                  <AlertTriangle size={15} />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[14.5px] font-semibold leading-tight">{title}</div>
                {body && (
                  <div className="text-[12.5px] text-text-secondary mt-1.5 leading-[1.5]">
                    {body}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-border bg-surface-page">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center h-8 px-3 rounded-button border border-border bg-white text-[12.5px]"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex items-center h-8 px-3.5 rounded-button text-[12.5px] font-medium"
              style={destructive ? { background: "#DC2626", color: "#FFF" } : { background: "#1A1A1A", color: "#FFF" }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
