"use client";

// /contact-extraction/database, extracted contacts DB (demo placeholder).

import { ContactRound } from "lucide-react";

import { DataPageShell } from "@/components/data/data-page-shell";
import { EmptyState } from "@/components/layout/empty-state";

export default function ContactExtractionDatabasePage() {
  return (
    <DataPageShell
      variant="connected"
      title="Extracted contacts"
      rootLabel="Contact extraction"
      rootHref="/contact-extraction"
      breadcrumbTrail={[
        { label: "Contact extraction", href: "/contact-extraction" },
        { label: "Extracted contacts" },
      ]}
      description="Every contact extracted so far. Filter, search, and push rows to your CRM."
    >
      {() => (
        <EmptyState
          illustration={<ContactRound size={36} strokeWidth={1.25} className="text-text-tertiary" />}
          title="Contacts database, coming soon"
          description="Once the real crawler ships, every verified contact will land here ready to push to your CRM."
        />
      )}
    </DataPageShell>
  );
}
