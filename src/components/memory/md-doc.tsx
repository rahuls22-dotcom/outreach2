"use client";

// MarkdownDoc · a clean, faithful markdown *beautifier* — zero external deps.
//
// This is NOT a section-aware dashboard. Each memory tab (Product, Personas,
// Active memory) is a real markdown FILE that Spot reads and writes; this
// component renders that file the way a good markdown viewer would, using the
// full standard vocabulary and nothing more:
//
//   # / ## / ### / ####   headings, with a GitHub-style hairline under H2
//   paragraphs             comfortable measure + leading
//   **bold** _italic_      inline emphasis
//   `code`                 inline code
//   [text](url)            links
//   - / * / 1.             bullet + ordered lists
//   | a | b |              tables (the skimmable workhorse — pricing, metrics)
//   > quote                blockquote callout (tinted block, no side-stripe)
//   ---                    horizontal rule
//   ```fence```            code block
//
// No per-section "boxes", no content-specific widgets. What's in the file is
// what renders. The richer, section-detecting renderer lives in md-render.tsx
// and powers the onboarding canvas; this one powers the memory drawer.

import { Fragment, type ReactNode } from "react";

/* ─── Public component ────────────────────────────────────────── */

export function MarkdownDoc({ source }: { source: string }) {
  const blocks = parseBlocks(source);
  return (
    <article className="md-doc max-w-[680px]">
      {blocks.map((b, i) => renderBlock(b, i))}
    </article>
  );
}

/* ─── Block model ─────────────────────────────────────────────── */

type Align = "left" | "center" | "right";

type Block =
  | { type: "heading"; level: 1 | 2 | 3 | 4; text: string }
  | { type: "paragraph"; text: string }
  | { type: "label"; text: string } // a paragraph that is entirely bold → lead-in label
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; head: string[]; align: Align[]; rows: string[][] }
  | { type: "quote"; lines: string[] }
  | { type: "code"; text: string }
  | { type: "rule" };

/* ─── Parsing ─────────────────────────────────────────────────── */

function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  const isRule = (l: string) => /^(-{3,}|\*{3,}|_{3,})$/.test(l.trim());
  const isTableRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
  const isTableSep = (l: string) =>
    /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(l);

  while (i < lines.length) {
    const line = lines[i];

    // Blank line → skip.
    if (!line.trim()) {
      i++;
      continue;
    }

    // Fenced code block.
    if (/^```/.test(line.trim())) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        buf.push(lines[i]);
        i++;
      }
      i++; // closing fence
      blocks.push({ type: "code", text: buf.join("\n") });
      continue;
    }

    // Horizontal rule.
    if (isRule(line)) {
      blocks.push({ type: "rule" });
      i++;
      continue;
    }

    // Heading.
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      blocks.push({
        type: "heading",
        level: h[1].length as 1 | 2 | 3 | 4,
        text: h[2].trim(),
      });
      i++;
      continue;
    }

    // Table — header row immediately followed by a separator row.
    if (isTableRow(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const head = splitTableRow(line);
      const align = parseAlign(lines[i + 1], head.length);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      blocks.push({ type: "table", head, align, rows });
      continue;
    }

    // Blockquote.
    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "quote", lines: quoteLines });
      continue;
    }

    // Unordered list.
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, "").trim());
        i++;
      }
      blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    // Ordered list.
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, "").trim());
        i++;
      }
      blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    // Paragraph — gather consecutive plain lines.
    const buf: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,4})\s+/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^```/.test(lines[i].trim()) &&
      !isRule(lines[i]) &&
      !(isTableRow(lines[i]) && i + 1 < lines.length && isTableSep(lines[i + 1]))
    ) {
      buf.push(lines[i]);
      i++;
    }
    const text = buf.join(" ").trim();
    // A paragraph that is wholly bold reads as a lead-in label.
    if (/^\*\*[^*]+\*\*$/.test(text)) {
      blocks.push({ type: "label", text: text.replace(/^\*\*|\*\*$/g, "") });
    } else {
      blocks.push({ type: "paragraph", text });
    }
  }

  return blocks;
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function parseAlign(sep: string, n: number): Align[] {
  const cells = splitTableRow(sep);
  const out: Align[] = [];
  for (let k = 0; k < n; k++) {
    const c = (cells[k] ?? "").trim();
    const l = c.startsWith(":");
    const r = c.endsWith(":");
    out.push(l && r ? "center" : r ? "right" : "left");
  }
  return out;
}

/* ─── Rendering ───────────────────────────────────────────────── */

function renderBlock(b: Block, key: number): ReactNode {
  switch (b.type) {
    case "heading": {
      if (b.level === 1)
        return (
          <h1
            key={key}
            className="text-[24px] font-semibold text-text-primary tracking-tight leading-tight mt-0 mb-2 first:mt-0"
          >
            <Inline text={b.text} />
          </h1>
        );
      if (b.level === 2)
        return (
          <h2
            key={key}
            className="text-[15px] font-semibold text-text-primary mt-8 mb-3 pb-1.5 border-b border-border-subtle first:mt-0"
          >
            <Inline text={b.text} />
          </h2>
        );
      if (b.level === 3)
        return (
          <h3
            key={key}
            className="text-[13.5px] font-semibold text-text-primary mt-5 mb-1.5 first:mt-0"
          >
            <Inline text={b.text} />
          </h3>
        );
      return (
        <h4
          key={key}
          className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mt-4 mb-1.5 first:mt-0"
        >
          <Inline text={b.text} />
        </h4>
      );
    }

    case "label":
      return (
        <p
          key={key}
          className="text-[12.5px] font-semibold text-text-primary mt-4 mb-1.5"
        >
          <Inline text={b.text} />
        </p>
      );

    case "paragraph":
      return (
        <p
          key={key}
          className="text-[13px] text-text-secondary leading-[1.65] mb-3.5 last:mb-0"
        >
          <Inline text={b.text} />
        </p>
      );

    case "rule":
      return <hr key={key} className="border-0 border-t border-border-subtle my-6" />;

    case "list":
      return b.ordered ? (
        <ol key={key} className="mb-4 space-y-1.5 ml-0.5">
          {b.items.map((it, j) => (
            <li
              key={j}
              className="flex gap-2.5 text-[13px] text-text-secondary leading-[1.6]"
            >
              <span className="text-text-tertiary tabular text-[12px] mt-px flex-shrink-0 w-4 text-right">
                {j + 1}.
              </span>
              <span className="flex-1">
                <Inline text={it} />
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <ul key={key} className="mb-4 space-y-1.5">
          {b.items.map((it, j) => (
            <li
              key={j}
              className="flex gap-2.5 text-[13px] text-text-secondary leading-[1.6]"
            >
              <span
                aria-hidden
                className="flex-shrink-0 mt-[8px] w-1 h-1 rounded-full bg-text-tertiary"
              />
              <span className="flex-1">
                <Inline text={it} />
              </span>
            </li>
          ))}
        </ul>
      );

    case "table":
      return (
        <div key={key} className="mb-4 overflow-x-auto rounded-card border border-border-subtle">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                {b.head.map((c, j) => (
                  <th
                    key={j}
                    className="bg-[var(--spot-tint)] text-text-primary font-semibold px-3 py-2 border-b border-border-subtle whitespace-nowrap"
                    style={{ textAlign: b.align[j] ?? "left" }}
                  >
                    <Inline text={c} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((row, r) => (
                <tr key={r} className="last:[&>td]:border-b-0">
                  {row.map((c, j) => (
                    <td
                      key={j}
                      className="px-3 py-2 border-b border-border-subtle text-text-secondary align-top"
                      style={{ textAlign: b.align[j] ?? "left" }}
                    >
                      <Inline text={c} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "quote":
      return (
        <blockquote
          key={key}
          className="mb-4 rounded-card bg-[var(--spot-tint)] border border-[var(--spot-stroke)] px-4 py-3"
        >
          {splitParas(b.lines).map((para, j) => (
            <p
              key={j}
              className="text-[12.5px] text-text-secondary leading-[1.6] mb-2 last:mb-0"
            >
              <Inline text={para} />
            </p>
          ))}
        </blockquote>
      );

    case "code":
      return (
        <pre
          key={key}
          className="mb-4 overflow-x-auto rounded-card bg-surface-page border border-border-subtle px-3.5 py-3 text-[12px] font-mono text-text-primary leading-[1.55]"
        >
          <code>{b.text}</code>
        </pre>
      );
  }
}

/** Collapse blockquote lines into paragraphs on blank lines. */
function splitParas(lines: string[]): string[] {
  const out: string[] = [];
  let buf: string[] = [];
  for (const l of lines) {
    if (!l.trim()) {
      if (buf.length) {
        out.push(buf.join(" ").trim());
        buf = [];
      }
    } else {
      buf.push(l);
    }
  }
  if (buf.length) out.push(buf.join(" ").trim());
  return out;
}

/* ─── Inline (code · link · bold · italic) ────────────────────── */

function Inline({ text }: { text: string }) {
  return <>{tokenizeInline(text).map((n, i) => <Fragment key={i}>{n}</Fragment>)}</>;
}

type Tok = string | { kind: "code" | "bold" | "italic"; text: string } | { kind: "link"; text: string; href: string };

function tokenizeInline(text: string): ReactNode[] {
  // 1 · protect inline code spans first.
  let toks: Tok[] = [];
  {
    const re = /`([^`]+)`/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      if (m.index > last) toks.push(text.slice(last, m.index));
      toks.push({ kind: "code", text: m[1] });
      last = m.index + m[0].length;
    }
    if (last < text.length) toks.push(text.slice(last));
  }

  // 2 · links [text](href)
  toks = toks.flatMap((t) => {
    if (typeof t !== "string") return [t];
    const out: Tok[] = [];
    const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(t))) {
      if (m.index > last) out.push(t.slice(last, m.index));
      out.push({ kind: "link", text: m[1], href: m[2] });
      last = m.index + m[0].length;
    }
    if (last < t.length) out.push(t.slice(last));
    return out;
  });

  // 3 · bold **text**
  toks = toks.flatMap((t) => {
    if (typeof t !== "string") return [t];
    const out: Tok[] = [];
    const re = /\*\*([^*]+)\*\*/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(t))) {
      if (m.index > last) out.push(t.slice(last, m.index));
      out.push({ kind: "bold", text: m[1] });
      last = m.index + m[0].length;
    }
    if (last < t.length) out.push(t.slice(last));
    return out;
  });

  // 4 · italic _text_ or *text*
  toks = toks.flatMap((t) => {
    if (typeof t !== "string") return [t];
    const out: Tok[] = [];
    const re = /_([^_]+)_|\*([^*]+)\*/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(t))) {
      if (m.index > last) out.push(t.slice(last, m.index));
      out.push({ kind: "italic", text: m[1] ?? m[2] });
      last = m.index + m[0].length;
    }
    if (last < t.length) out.push(t.slice(last));
    return out;
  });

  return toks.map((t, i) => {
    if (typeof t === "string") return t;
    if (t.kind === "bold")
      return (
        <strong key={i} className="font-semibold text-text-primary">
          {t.text}
        </strong>
      );
    if (t.kind === "italic")
      return (
        <em key={i} className="italic text-text-secondary">
          {t.text}
        </em>
      );
    if (t.kind === "link")
      return (
        <a
          key={i}
          href={t.href}
          target="_blank"
          rel="noreferrer"
          className="text-text-primary underline decoration-border underline-offset-2 hover:decoration-text-tertiary"
        >
          {t.text}
        </a>
      );
    return (
      <code
        key={i}
        className="px-1.5 py-px rounded bg-surface-page border border-border-subtle text-[11.5px] font-mono text-text-primary"
      >
        {t.text}
      </code>
    );
  });
}
