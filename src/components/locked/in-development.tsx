"use client";

// Empty placeholder shown for pages that another teammate is still building.
// Intentionally calm, no fake content, no spinners, no "coming soon".

import { Hammer } from "lucide-react";

interface Props {
  title: string;
  blurb?: string;
}

export function InDevelopment({ title, blurb }: Props) {
  return (
    <div className="max-w-[820px] mx-auto pt-2 pb-16">
      <div className="mb-8">
        <div className="text-meta text-text-secondary mb-1">Workspace</div>
        <h1 className="text-page-title text-text-primary">{title}</h1>
      </div>

      <div className="border border-dashed border-border rounded-card bg-white px-8 py-16 flex flex-col items-center text-center">
        <div className="w-11 h-11 rounded-full bg-surface-secondary flex items-center justify-center mb-4">
          <Hammer size={18} strokeWidth={1.5} className="text-text-secondary" />
        </div>
        <div className="text-[15px] font-semibold text-text-primary mb-1.5">In development</div>
        <div className="text-[12.5px] text-text-secondary max-w-[420px] leading-relaxed">
          {blurb ?? "This page is being built. It'll show up here when it's ready."}
        </div>
      </div>
    </div>
  );
}
