"use client";

import { PhoneCall, Target, ListChecks, FileText } from "lucide-react";
import { LockedProduct } from "@/components/locked/locked-product";

export default function LockedAiCallingAgentsPage() {
  return (
    <LockedProduct
      icon={PhoneCall}
      eyebrow="Add-on product"
      title="AI calling agents"
      lede="Build an AI agent for a calling purpose, give it your leads and qualification criteria, and let it run. The agent has the conversation and tells you who qualifies."
      features={[
        {
          icon: Target,
          title: "Purpose-built agents",
          body: "One agent per calling purpose, qualify, follow up, re-engage.",
        },
        {
          icon: ListChecks,
          title: "Your qualification criteria",
          body: "Budget, timeline, geography, intent. The agent keeps them in mind on every call.",
        },
        {
          icon: FileText,
          title: "Transcripts + outcomes",
          body: "Full transcript, qualification result, next-best-action per call.",
        },
      ]}
      mailSubject="Interested in AI calling agents"
    />
  );
}
