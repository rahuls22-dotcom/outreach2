"use client";

// /contact-extraction/operations — where extraction actually happens (demo).

import { useRouter } from "next/navigation";

import { DataPageShell } from "@/components/data/data-page-shell";
import { ContactExtraction } from "@/components/data/contact-extraction";

export default function ContactExtractionOperationsPage() {
  const router = useRouter();
  return (
    <DataPageShell
      variant="connected"
      title="Extract"
      rootLabel="Contact extraction"
      rootHref="/contact-extraction"
      breadcrumbTrail={[
        { label: "Contact extraction", href: "/contact-extraction" },
        { label: "Extract" },
      ]}
      description="Point us at a website or upload a list. We crawl, dedupe, and verify."
    >
      {() => <ContactExtraction onBack={() => router.push("/contact-extraction")} />}
    </DataPageShell>
  );
}
