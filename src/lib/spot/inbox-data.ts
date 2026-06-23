// Local stub — NOT committed. Staging's spot/page.tsx imports this
// module but the full file lives on a different branch. Empty inbox is
// the safest fallback until that lands.

export type SpotInboxItem = {
  id: string;
  read: boolean;
};

export const SPOT_INBOX: SpotInboxItem[] = [];
