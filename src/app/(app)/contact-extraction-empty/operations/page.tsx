"use client";

// /contact-extraction-empty/operations, Operations tab in the "no CRM" demo.

import { useRouter } from "next/navigation";

import { DataPageShell } from "@/components/data/data-page-shell";
import { ContactExtraction } from "@/components/data/contact-extraction";

export default function ContactExtractionEmptyOperationsPage() {
  const router = useRouter();
  return (
    <DataPageShell
      variant="empty"
      title="Extract"
      rootLabel="Contact extraction"
      rootHref="/contact-extraction-empty"
      breadcrumbTrail={[
        { label: "Contact extraction", href: "/contact-extraction-empty" },
        { label: "Extract" },
      ]}
      description="Point us at a website or upload a list. We crawl, dedupe, and verify."
    >
      {() => <ContactExtraction onBack={() => router.push("/contact-extraction-empty")} />}
    </DataPageShell>
  );
}
