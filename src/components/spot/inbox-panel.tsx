"use client";

// Local stub — NOT committed. No-op panel so spot/page.tsx compiles.

import type { SpotInboxItem } from "@/lib/spot/inbox-data";

export function InboxPanel({
  open,
}: {
  open: boolean;
  onClose: () => void;
  notifs: SpotInboxItem[];
  onOpenItem: (id: string) => void;
  onMarkAllRead: () => void;
}) {
  if (!open) return null;
  return null;
}
