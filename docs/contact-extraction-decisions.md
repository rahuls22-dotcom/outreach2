# Contact Extraction — Decision Log

Running record of product/UX decisions for the Contact Extraction module
(`src/app/(app)/contact-extraction/`, `src/components/data/contact-extraction/`).
Each entry: **what** we decided and **why**. Newest first. Update this on every
change.

What the module does: give a LinkedIn profile → extract Phone / Personal email /
Work email, optionally verify. Works in bulk (CSV) and single (one URL). Ports
the existing app.revspot product with cleaner UX.

---

## 2026-06-01

### All-contacts metric strip → per-type performance funnel
**Decision:** Replaced the 4 generic summary tiles (Contacts / Verified / Phone
numbers / Emails) in `database.tsx` with a 3-card performance panel — one card per
contact type (Phone / Personal email / Work email). Each card is a funnel of three
stacked horizontal bars: **Requested** (full-width baseline, gray), **Found** (blue,
count + % of requested), **Verified** (green, count + % of requested). Header shows
the type + "N requested".
**Why:** The old tiles were a flat scoreboard — they couldn't show delivery against
what was asked, and lumped both emails together. The funnel reads as "of what we
promised, how much did we deliver and confirm," per type. This is the core Revspot
performance metric for the product.
**Mechanics:** Per contact, a field is *requested* when defined (`fieldOf(c,t) !==
undefined`), *found* when `field.value` is truthy, *verified* when
`field.status === "verified"`. Counts computed over the `filtered` list, so the
panel is **reactive** — it narrows with every filter (date, Has, search). Verified
(7d) sanity: Phone requested 1,036 → 346. Removed now-unused `fieldsOf`/`hasVerified`
helpers. Bars use `#1D4ED8` (found) / `#059669` (verified); % is always relative to
Requested.

### Numbered pagination + single result as side-by-side boxes
**Decision (pagination):** Added a shared windowed numbered `Pagination` component
(`parts.tsx`): Previous · 1 · 2 · … · 25 · Next, current page filled, gaps
collapsed to "…". Replaced the Previous/Next-only "Page X of Y" blocks in both the
All-contacts table (`database.tsx`) and the run-history table (`history-table.tsx`)
with it. Pages stay 0-indexed internally, buttons show 1-based labels.
**Decision (single result boxes):** The single-lookup "Extracted contacts" section
(`SingleResultPanel` in `composer.tsx`) was a stacked `<dl>` (one row per type).
Now a responsive grid of boxes laid side by side (1 / 2 / 3 cols), one card per
requested type: uppercase type label + value + verified tick + copy. Each box is a
white card on the section's `surface-page` tint.
**Why:** Numbered pages are easier to navigate a 25-page table than Prev/Next
clicking. Boxes read as distinct, scannable results instead of a cramped list.
**Files:** `parts.tsx` (`Pagination`, `pageItems`), `database.tsx`,
`history-table.tsx`, `composer.tsx`.

### Bulk run history: column set = Uploaded → Requested → Extracted → Credits
**Decision:** Final column model for the bulk run table (`BulkRow` in
`history-table.tsx`):
- **Uploaded** — leads in the CSV (`run.total`).
- **Requested** — total field requests across every selected type
  (`run.total × requestedTypes.length`). This makes it comparable to Extracted
  (both summed across types) — e.g. 240 leads × 3 types = 720, vs the old
  "Requested 240" sitting next to "Found 635" which compared leads to field-values.
- **Extracted** — fields found (`sumOver(run, "found")`). Just the number.
- **Credits** — used + green refunded sub-line (unchanged).
- **Status**, **When** (time of upload), chevron.
- **No verified info in the table.** Dropped the `442 verified` sub-line and the
  earlier green "Verified" chip + `BadgeCheck` import. Verification detail lives in
  the run drawer, not the list. Name cell keeps the type chips only.
- All numeric columns right-aligned.
- **Column spacing (final — `table-fixed` + colgroup, user chose "even fill,
  full width"):** Auto table-layout kept misbehaving — `w-full` on Run dumped all
  slack into one column (void between name and numbers), and capping the block read
  as "cut off." Both abandoned. Final: the bulk table uses `table-fixed` with an
  explicit `<colgroup>` of percentage widths (Run 27% · Uploaded 11 · Requested 11
  · Extracted 11 · Credits 13 · Status 11 · When 11 · chevron 5). Percentages scale,
  so the columns distribute evenly edge-to-edge at ANY width — no void, no cutoff,
  deterministic. Metric columns `whitespace-nowrap`, `px-4` rhythm, Status badge
  `text-center`. Scoped to bulk (`!single`); the single-lookup table keeps auto
  layout because its email columns need natural sizing.
**Why (supersedes the earlier "fix ragged layout" entry):** User wanted the row to
read as a clean funnel — uploaded → requested → extracted → credits — with
verification kept out of the summary. The old Requested/Found pairing also compared
unlike units; leads × types fixes that.
**Files:** `history-table.tsx` (`BulkRow`, `TypeTags`, headers, `colSpan`).

### All-contacts: removed the "Status" (verified) filter
**Decision:** Dropped the Status dropdown (All / Verified / Unverified) from the
filter bar. Removed `verify` state, `VerifyFilter` type, and the now-unused
`FilterSelect` component. The Verified count tile stays (still computed via
`hasVerified`).
**Why:** Verification is already a quiet per-field tick in the table; a top-level
verified/unverified filter was redundant and cluttered the bar. Search + Date + Has
cover the real scoping needs.
**Files:** `database.tsx`.

### All-contacts "Has" filter: single-select → checkbox multi-select
**Decision:** Replaced the "Has" `FilterSelect` (single native `<select>`: Any /
Phone / Personal email / Work email) with a checkbox dropdown (`HasFilter` in
`database.tsx`). Trigger keeps the toolbar "Has: …" look (label = "Any field" /
single field name / "N fields"); clicking opens a popover with a click-away
backdrop containing the **same `TypeCheckboxes`** component the composer uses, plus
a "Clear" link. Field state is now `CEContactType[]` ( `[]` = any). Predicate
`hasFields` is **AND** — a contact shows only if it carries every checked field
(`fieldOf().value` truthy).
**Why:** Fields combine freely (phone + work email, all three, …), which a
single-select can't express. Checkboxes are the right control, and reusing
`TypeCheckboxes` keeps it consistent with the extract composer.
**Files:** `database.tsx` (`HasFilter`, `fieldOf`/`hasFields`, `fields` state,
imports `TypeCheckboxes` + `CE_TYPE_LABEL` + `CEContactType`).

### Single result card: consistent sizing, cleaner layout, real LinkedIn icon
**Decision:** Reworked the single-lookup result card (`SingleResult` in
`composer.tsx`).
- **Type sizing unified.** Extracted-contact values were rendered via the shared
  `ContactFieldCell` (13px + a 220px truncate), which read as bigger/different next
  to the 12.5px profile rows and cut long emails to "…". Now profile and extracted
  rows share one `<dl>` spec: 12px tertiary label, 13px primary value. Extracted
  values render inline (tick + copy) with `break-all` and **no truncation**, so the
  full email/phone shows.
- **Layout.** Semantic `<dl>`/`<dt>`/`<dd>`, baseline-aligned rows, the Extracted
  contacts block gets a subtle `surface-page` tint + section label so it reads as a
  distinct group.
- **LinkedIn icon.** Replaced lucide's generic `Linkedin` outline with a real
  LinkedIn brand glyph (`LinkedInIcon` in `parts.tsx`, official "in" logo path in
  LinkedIn blue `#0A66C2`). Used both as the profile link in the card header and as
  the URL-input adornment. Dropped the redundant `ExternalLink` next to it (the
  branded icon is the link).
**Why:** Mixed font sizes + a truncated email made the card look unpolished and hid
data. One sizing spec + full values fixes both. The lucide LinkedIn mark looked
off-brand; the real logo signals "this opens LinkedIn."
**Files:** `parts.tsx` (`LinkedInIcon`), `composer.tsx` (`SingleResult` card,
URL-input icon, imports).

### All-contacts: redesigned filter bar, above the cards, reactive
**Decision:** Reworked the Extracted-contacts (now "All contacts") controls.
- Moved the whole filter bar **above** the metric tiles. Every filter now narrows
  both the tiles and the table, so the four numbers always describe what's shown
  (`SummaryStrip` takes the `filtered` set and counts phones/emails/verified from
  it directly — dropped the `computeKpis(runs)` dependency).
- Replaced the All / Verified / Issues segmented control (the old "Issues" tied to
  risky/invalid, which we no longer surface) with labeled **dropdown filters**
  (`FilterSelect`, native `<select>` styled to the toolbar, "Label: value" +
  active-state border):
  - **Has** — Any field / Phone / Personal email / Work email (completeness).
  - **Status** — All / Verified / Unverified.
  - **Date** — upgraded to the same control Enriched leads uses: a **7d / 30d /
    90d / All segmented** strip plus a **Custom** trigger that opens the shared
    `DateRangePopover` (preset shortcuts + month calendar + Apply/Cancel). Presets
    count back from today; custom is inclusive of the end day. Replaced the earlier
    plain "All time…" dropdown — a real date picker is the expected control here.
- Dropdowns scale to more filters without eating horizontal space like stacked
  segmented controls.
**Why:** The old single segmented control was weak and sat below the cards, so the
tiles ignored it. A real filter bar that governs the cards too is the expected
behavior. Date was missing and is the most common scoping need.
**Files:** `database.tsx` (`FilterSelect`, reordered layout, `SummaryStrip`
reactive, date/field/status state).

### Fill personal emails (most bulk runs request all three types)
**Decision:** Bumped seed bulk runs to request `personal_email` so the column
isn't mostly "—". Now 5 of 6 bulk runs include personal email (cer-1/2/4/5/7);
cer-8 stays Phone+Work for variety. The "—" in that column was *not requested*,
not *not found* — fixed at the request level, not the found-rate.
**Why:** A near-empty Personal email column reads as "the product can't find
emails." Demo should show the column working.
**Files:** `contact-extraction-data.ts` (`SEED_RUNS` requestedTypes).

### Bulk run history: type tag chips + Verified chip (drop "verify on")
**Decision:** The bulk run subtitle was `Phone · Work · verify on` plain text. Now
each contact type renders as a small **tag chip**, and when phone verification was
on the run gets a green **"Verified"** chip (BadgeCheck) instead of the "verify
on" words. New `TypeTags` component in `history-table.tsx`.
**Why:** "verify on" read badly and the dot-joined types looked like throwaway
text. Chips read as real metadata; the green Verified chip says "verification was
enabled" at a glance.
**Files:** `history-table.tsx` (`TypeTags`, `BulkRow`).

### Tab rename: New extraction / All contacts
**Decision:** Renamed the two Contact-extraction tabs from "Extract" /
"Extracted contacts" to **"New extraction"** / **"All contacts"** (sidebar +
page titles + composer toast copy).
**Why:** "Extract" (verb) vs "Extracted contacts" (past-participle of the same
word) read as near-duplicates. "New extraction" = the action you start; "All
contacts" = the full database you browse. Clearer split.
**Files:** `sidebar.tsx`, `operations/page.tsx`, `database/page.tsx`,
`composer.tsx` (toast copy).

### Show the value, drop "Couldn't verify" (reverses Option A)
**Decision:** `risky`/`invalid` fields now show the extracted value with no green
tick — same as `found`. Removed the "Couldn't verify" branch from
`ContactFieldCell` entirely. Only signal left is the tick: present = verified,
absent = unverified-but-usable. `not_found` still shows "Not found".
**Why:** Reverses the earlier Option A. A muted "Couldn't verify" hides a value the
user could still act on and reads as a dead end. Hand over the contact; let the
tick (or its absence) carry trust. Fewer empty-looking cells in a demo too.
**Files:** `parts.tsx` (`ContactFieldCell`).

### Raise found rates (demo data)
**Decision:** Bumped phone/email found + verified probabilities in the seed so most
cells carry a value. Phone not_found `r > 0.85` (was 0.6), verify `< 0.62`. Email
found personal `< 0.9` / work `< 0.85`; valid cuts 0.78 / 0.68; risky band +0.16.
**Why:** This is a demo — sparse tables read as "the product can't find anything."
Fuller data shows the value. Still leaves some gaps so it's not unrealistically
perfect.
**Files:** `contact-extraction-data.ts` (`phoneResult`, `emailResult`).

### Hide Ask Spot launcher on data products
**Decision:** The floating "Ask Spot" launcher is hidden on `/enrichment` and
`/contact-extraction` (already hidden on `/data`). Broadened the path guard in
`SpotFloatingLauncher`.
**Why:** These are operational dashboards, not coach-driven flows. The launcher is
noise on a data table and was distracting in the demo.
**Files:** `spot/spot-floating-launcher.tsx`.

### Drop "View all N contacts" from the bulk run drawer
**Decision:** Removed the drawer footer with the "View all {N} contacts →" link
(it pushed to `/database?run=`). Drawer now ends at the Export row. Removed the
now-dead `useRouter`/`ArrowRight` imports.
**Why:** The drawer already shows the per-type breakdown + export; a deep-link to a
filtered table is an extra hop nobody asked for and muddies the drawer's purpose.
**Files:** `contact-extraction/run-drawer.tsx`.

## 2026-05-30

### Parent nav opens Extract by default
**Decision:** Clicking the "Contact extraction" parent nav item now lands on
**Extract** (`/contact-extraction/operations`), not Extracted contacts. The module
root `redirect()` was repointed from `/database` to `/operations`. Also removed the
`backHref` from the Extract page header (it's a tab, and with the redirect a back
arrow to `/contact-extraction` would just loop back to Extract).
**Why:** Mirrors Enrichment, where the parent lands on its primary action tab.
Extract is the thing you come here to do; the data view is secondary.
**Files:** `app/(app)/contact-extraction/page.tsx` (redirect target),
`app/(app)/contact-extraction/operations/page.tsx` (dropped `backHref`).

### Single-lookup history: drop the status filter, paginate 10/page
**Decision:** Removed the All / Done / Running segmented filter from the
single-lookup history (kept it for bulk runs). Added pagination at **10 rows per
page** (shared `PAGE_SIZE`; Previous/Next + "Page X of Y", same control as the
Database table). Seeded ~25 single lookups so the pager has real pages.
**Why:** Single lookups resolve instantly, so a Done/Running filter is noise on
that table. With more history rows, paging keeps the table scannable instead of an
endless scroll. Bulk runs can be in-flight, so they keep the status filter.
**Files:** `history-table.tsx` (conditional `StatusFilterTabs`, pagination),
`contact-extraction-data.ts` (`SINGLE_LOOKUPS` seed batch).

### Contact name links to the LinkedIn profile
**Decision:** The contact name in both tables (Extracted contacts + single-lookup
history) is now a link to that person's LinkedIn profile (`ProfileNameLink` in
`parts.tsx`). Hover underlines it and reveals a small external-link glyph +
native "Open LinkedIn profile" tooltip; opens in a new tab. Dropped the separate
trailing LinkedIn-icon column from the Database table (the name is the link now,
so the extra column was redundant) — table is back to 5 columns. Falls back to
plain text when there's no URL yet (single lookup still running).
**Why:** Adopted from app.revspot's Contact History, where the LinkedIn slug is a
clickable link. Putting it on the name is the natural target and removes a column.
**Files:** `parts.tsx` (`ProfileNameLink`), `database.tsx` (`ContactRow`, removed
LinkedIn column), `history-table.tsx` (`SingleRow`).

### Reference tables (app.revspot): what we adopt vs. skip
**Decision — single "Contact History" table.** Adopt: LinkedIn-as-clickable-name
(done above); verified tick on email/phone (already had); Job Title + Company
(already shown — title under name, company column). Skip: the **Type** column
(Prof. Email / Phone) and per-row **Status** (Completed/Failed). Reason: their
table is *one row per lookup action*, so the same person appears on multiple rows
(one per type) and each needs a Type + Status. Ours is *one row per contact* with
all fields side-by-side, and per-field state is already said by the field cell
(verified tick / "Couldn't verify" / "Not found"). A single global row status is
meaningless when one row holds three fields.
**Decision — bulk "File History" table.** Their columns: File Name, Uploaded By,
Uploaded Date, Progress (%), Status, Lead Count, Actions. Our bulk history already
covers the equivalents (Run label, When, Status badge with live %, Requested/Found/
Verified, Credits, row → drawer). Worth adopting: **Lead Count** (their row count)
maps to our Requested total — already shown. **Progress %** — we already fold into
the live status badge. Skip **Uploaded By** (single-user prototype, no team column
needed yet) and the **Actions ⋯ menu** (our row opens a drawer with the per-type
breakdown + export, which is richer than a kebab). No change needed to the bulk
table; it already carries the useful columns.
**Why:** Keep parity where their columns add value, drop what's an artifact of
their data model or premature for a single-user prototype.
**Files:** none (analysis; bulk table unchanged).

### Bulk upload: 10,000-row cap + CSV/single-file guard
**Decision:** A single bulk upload is capped at `MAX_ROWS = 10000`. The dropzone
states "CSV only · up to 10,000 rows · one file at a time." On file pick we
reject non-CSV files and files over the cap with an inline red message (red
border on the dropzone), and never set them as the active file. One file at a
time (the input is not `multiple`).
**Why:** Mirrors the app.revspot limit. Better to stop an oversized/invalid file
at the door with a clear reason than to let a run start and fail later.
**Files:** `composer.tsx` (`MAX_ROWS`, `onFileChosen`, `BulkBody`).

### Hide dead values instead of tagging them (Option A)
**Decision:** When verification returns `risky` or `invalid`, do NOT surface the
value. Show a muted "Couldn't verify" instead. `not_found` shows "Not found".
Only `verified` (value + green tick) and `found` (plain value) are presented as
usable results. Removed the `StatusPill` component and the `FieldValue` helper
(both now dead).
**Why:** Showing `riya.bose@khatabook.com [Invalid]` is contradictory — we hand
over a dead email and label it dead in the same cell. A bounced email is
worthless to act on, so don't present it as a result at all. Kills the noisy
tag entirely; cleaner and matches "don't create things."
**Files:** `parts.tsx` (`ContactFieldCell`, removed `StatusPill`/`FieldValue`),
`composer.tsx` (single result rows now use `ContactFieldCell`).

### Single-mode: submit button inline with the URL field
**Decision:** In single mode the "Extract contact · up to N credits" button sits
on the same row as the LinkedIn URL input (input flex-grows, button right). Enter
key also submits. Dropped the footer for single mode (bulk keeps its footer).
**Why:** One profile, one URL, one action — the button belongs next to the input,
not parked in a separate footer strip. Less vertical hop between typing and
acting.
**Files:** `composer.tsx` (`SingleBody`, footer now `mode === "bulk"` only).

### Fold the Dashboard into Extracted contacts
**Decision:** Removed the standalone Contact-extraction Dashboard tab/route.
`/contact-extraction` now `redirect()`s to `/contact-extraction/database`. A
compact 4-tile metrics strip (Contacts · Verified · Phone numbers · Emails) sits
at the top of Extracted contacts. `dashboard.tsx` trimmed to just the shared
`RunStatusBadge` + `relativeTime` helpers.
**Why:** A full tab for a handful of numbers is overkill for someone subscribed
to the service. The numbers belong above the data they describe.
**Files:** `app/(app)/contact-extraction/page.tsx` (redirect), `database.tsx`
(`SummaryStrip`), `dashboard.tsx` (trimmed).

### Trim Dashboard metrics to subscriber-relevant ones
**Decision:** Kept: total Contacts, Verified count, Phone numbers found, Emails
found. Dropped: Extraction-runs count, Profiles-processed throughput, Recent-runs
table, per-type found/verified % bars.
**Why:** A subscriber cares what they got (contacts, phones, emails) and how much
is trustworthy (verified). Run counts and throughput are operational noise.
**Files:** `database.tsx` (`SummaryStrip`).

### Filters on Extracted contacts
**Decision:** Added an `All / Verified / Issues` segmented filter next to the
existing name/company/title search. Verified = contact has ≥1 verified field;
Issues = contact has ≥1 risky/invalid field. Same control style as the single
history filter.
**Why:** Parity with the single-lookup history; lets a subscriber jump to
trustworthy contacts or ones that couldn't be verified. Reused the existing
segmented-control pattern rather than building something new.
**Files:** `database.tsx` (`VerifyFilterTabs`).

### Remove back button on Extracted contacts
**Decision:** Dropped `backHref` from the Extracted contacts page header.
**Why:** It's a top-level tab, not a sub-page. A back arrow implied a parent
page to return to.
**Files:** `app/(app)/contact-extraction/database/page.tsx`.

### Single-lookup history mirrors the Extracted-contacts table
**Decision:** Single history table uses the same columns and field rendering as
the Database table (Name / Company / Phone / Personal email / Work email / When),
via the shared `ContactFieldCell`. Added search + status filter to it too.
**Why:** Two tables showing the same kind of data should look identical. One
shared cell component keeps them in sync.
**Files:** `history-table.tsx`, `parts.tsx` (`ContactFieldCell`).

### Credit info: static, per-type, mode-aware
**Decision:** Top strip shows a static per-type price list ("Phone 1 credit ·
Personal email 1 credit · Work email 1 credit") driven by a `CREDIT_PER_TYPE`
map. Word is "credit(s)", never "cr". Bulk footer shows blocked total with
"refunded for anything we can't find"; single charges only after the lookup (no
"blocked" language).
**Why:** Per-type costs can differ, so list each explicitly rather than assume a
flat rate. "cr" reads as crore. Single deducts post-extraction, so up-front
"blocked" framing is wrong for single.
**Files:** `composer.tsx` (`CreditInfo`, `CREDIT_PER_TYPE`).

### Contact-type controls are checkboxes, no icons
**Decision:** Phone / Personal email / Work email are real checkbox controls
(box + label), not filled pill buttons. No per-type icons. Verify-phone toggle
sits inline with them; credit info is top-right.
**Why:** Filled pills read as primary actions and clashed with the real CTA.
Icons added clutter without meaning — the labels are self-explanatory.
**Files:** `parts.tsx` (`TypeCheckboxes`, `VerifyToggle`), `composer.tsx`.

### Default: all three contact types selected
**Decision:** Phone, Personal email, Work email all pre-checked on load.
**Why:** Most lookups want the full contact set, and anything we can't find is
refunded — no downside to defaulting on.
**Files:** `composer.tsx` (`DEFAULT_TYPES`).
