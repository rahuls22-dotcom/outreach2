"use client";

// /contact-extraction-empty, Dashboard tab in the "no CRM" demo variant.

import { DataPageShell } from "@/components/data/data-page-shell";
import { ContactExtractionDashboard } from "@/components/data/contact-extraction-dashboard";

export default function ContactExtractionEmptyDashboardPage() {
  return (
    <DataPageShell
      variant="empty"
      title="Contact extraction"
      rootLabel="Contact extraction"
      rootHref="/contact-extraction-empty"
      description="Pull verified contacts from websites, directories, and uploaded lists. Connect a CRM to push rows back automatically."
    >
      {() => <ContactExtractionDashboard />}
    </DataPageShell>
  );
}
