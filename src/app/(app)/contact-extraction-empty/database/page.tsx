"use client";

// /contact-extraction-empty/database — extracted contacts DB in the "no CRM" demo.

import { ContactRound } from "lucide-react";

import { DataPageShell } from "@/components/data/data-page-shell";
import { EmptyState } from "@/components/layout/empty-state";

export default function ContactExtractionEmptyDatabasePage() {
  return (
    <DataPageShell
      variant="empty"
      title="Extracted contacts"
      rootLabel="Contact extraction"
      rootHref="/contact-extraction-empty"
      breadcrumbTrail={[
        { label: "Contact extraction", href: "/contact-extraction-empty" },
        { label: "Extracted contacts" },
      ]}
      description="Every contact extracted so far. Connect a CRM to push rows back automatically."
    >
      {() => (
        <EmptyState
          illustration={<ContactRound size={36} strokeWidth={1.25} className="text-text-tertiary" />}
          title="Contacts database — coming soon"
          description="Once the real crawler ships, every verified contact will land here ready to push to your CRM."
        />
      )}
    </DataPageShell>
  );
}
