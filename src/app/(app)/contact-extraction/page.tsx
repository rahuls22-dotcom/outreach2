"use client";

// /contact-extraction — base/Dashboard tab for the Contact extraction module.
// Demo placeholder for the second data product.

import { DataPageShell } from "@/components/data/data-page-shell";
import { ContactExtractionDashboard } from "@/components/data/contact-extraction-dashboard";

export default function ContactExtractionDashboardPage() {
  return (
    <DataPageShell
      variant="connected"
      title="Contact extraction"
      rootLabel="Contact extraction"
      rootHref="/contact-extraction"
      description="Pull verified contacts from websites, directories, and uploaded lists. Pushes clean rows back to the same CRM you use for enrichment."
    >
      {() => <ContactExtractionDashboard />}
    </DataPageShell>
  );
}
