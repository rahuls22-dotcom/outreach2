"use client";

import { useEffect, useRef } from "react";
import { Paperclip, AtSign, Mic, ArrowUp } from "lucide-react";

export function SpotComposer({
  value,
  onChange,
  onSend,
  placeholder = "Ask Spot anything…",
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = Math.min(ref.current.scrollHeight, 160) + "px";
    }
  }, [value]);

  return (
    <div className="composer">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
      />
      <div className="flex items-center gap-1 px-2 py-2">
        <button
          type="button"
          className="inline-flex items-center justify-center h-7 w-7 rounded-button text-text-tertiary hover:text-text-primary hover:bg-surface-secondary"
          title="Attach"
        >
          <Paperclip size={13} />
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center h-7 w-7 rounded-button text-text-tertiary hover:text-text-primary hover:bg-surface-secondary"
          title="Mention a campaign or lead"
        >
          <AtSign size={13} />
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center h-7 w-7 rounded-button text-text-tertiary hover:text-text-primary hover:bg-surface-secondary"
          title="Voice"
        >
          <Mic size={13} />
        </button>
        <div className="flex-1" />
        <span className="mono text-[10px] text-text-tertiary mr-1">⏎ to send</span>
        <button
          type="button"
          disabled={!value.trim()}
          onClick={onSend}
          className="apply-btn"
          style={{ width: 26, height: 26, padding: 0, justifyContent: "center" }}
        >
          <ArrowUp size={13} />
        </button>
      </div>
    </div>
  );
}
