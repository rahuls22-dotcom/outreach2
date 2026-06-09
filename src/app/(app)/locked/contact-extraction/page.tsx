"use client";

import { ContactRound, Link2, BadgeCheck, Upload } from "lucide-react";
import { LockedProduct } from "@/components/locked/locked-product";

export default function LockedContactExtractionPage() {
  return (
    <LockedProduct
      icon={ContactRound}
      eyebrow="Add-on product"
      title="Contact extraction"
      lede="Drop a LinkedIn URL, get work email, personal email, and phone number back, each marked verified or unverified."
      features={[
        {
          icon: Link2,
          title: "LinkedIn → contact",
          body: "Work email, personal email, direct phone in seconds.",
        },
        {
          icon: BadgeCheck,
          title: "Verified flag on every field",
          body: "Your team only chases what's real.",
        },
        {
          icon: Upload,
          title: "Single or bulk",
          body: "One URL inline, or a CSV of thousands.",
        },
      ]}
      mailSubject="Interested in Contact extraction"
    />
  );
}
