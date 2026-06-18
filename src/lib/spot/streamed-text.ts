// Streamed-text memory.
//
// Rule: once a Spot answer has streamed token-by-token, it must never stream
// again — not on panel reopen, not on route change, not on a full page
// reload. StreamingText reveals on mount, so without this it re-animates
// every time the component remounts. We remember what has already streamed
// and render it static thereafter.
//
// Keyed by a cheap content hash (not the raw text) so localStorage stays
// small and we don't persist conversation content. Collisions are
// astronomically unlikely for distinct answers, and if two answers ever did
// collide the only effect is the second renders static — which is the
// desired behaviour anyway ("don't stream it again").

const STORAGE_KEY = "spot.streamedText.v1";

let memory: Set<string> | null = null;

function hash(text: string): string {
  // djb2 — fast, stable, good enough for de-duping answer strings.
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = (h * 33) ^ text.charCodeAt(i);
  }
  // Fold length in so same-prefix variants don't alias as easily.
  return `${(h >>> 0).toString(36)}.${text.length.toString(36)}`;
}

function load(): Set<string> {
  if (memory) return memory;
  memory = new Set<string>();
  if (typeof window === "undefined") return memory;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as string[];
      if (Array.isArray(arr)) memory = new Set(arr);
    }
  } catch {
    // Corrupt or unavailable storage — fall back to an in-memory set.
  }
  return memory;
}

function persist(set: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // Quota or privacy mode — in-memory tracking still holds for the session.
  }
}

/** Has this exact text already finished streaming at any point? */
export function hasStreamed(text: string): boolean {
  if (!text) return true; // nothing to stream
  return load().has(hash(text));
}

/** Mark this text as fully streamed so it never animates again. */
export function markStreamed(text: string): void {
  if (!text) return;
  const set = load();
  const key = hash(text);
  if (set.has(key)) return;
  set.add(key);
  persist(set);
}
