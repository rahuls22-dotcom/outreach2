# CRM Self-Serve Integration — Research (2026-06)

Research for Revspot's self-serve CRM integration. Revspot enriches real-estate
leads and needs to connect to each CLIENT's own CRM (Salesforce, HubSpot, Zoho,
Pipedrive, LeadSquared) to push enriched leads back and/or pull leads in.

Four research streams: (1) connection/auth, (2) field-mapping UX, (3) sync
mechanics, (4) self-serve onboarding flow. Sources cited inline.

---

## 1. Connection & Auth

### Canonical self-serve OAuth2 flow (5 steps)
1. Click "Connect [CRM]" → backend builds authorize URL (`client_id`,
   `redirect_uri`, `scope`, `state`, `response_type=code`).
2. Redirect browser to CRM `/authorize`.
3. Consent screen — user logs into THEIR CRM, approves scopes.
4. Callback to `redirect_uri?code=…&state=…`. Verify `state`.
5. Backend exchanges `code` + `client_secret` at `/token` → `access_token` +
   `refresh_token` + `expires_in`. Store encrypted. Mark "Connected."

### Per-CRM auth
| CRM | Method | Notes |
|---|---|---|
| HubSpot | OAuth2 only | read & write are SEPARATE scopes; scopes must match install URL exactly |
| Salesforce | OAuth2 via Connected App | token returns `instance_url` (org pod) — use for all calls; Prod vs Sandbox host toggle (`login.` vs `test.salesforce.com`) |
| Pipedrive | OAuth2 | per-entity read-only or full scopes |
| Zoho | OAuth2, multi-DC | **gotcha**: token must be generated AND refreshed against same data center (com/eu/in/...) |
| LeadSquared | **API key + secret** (no OAuth) | paste-keys form, validate with test call |

**Auth methods boil down to two UX paths:** OAuth redirect (HubSpot, SF,
Pipedrive, Zoho) vs API-key form + validating test call (LeadSquared, regional).
Avoid username/password (storing raw client login).

### Build vs Buy — unified/embedded providers
One deep CRM integration = 2–8 weeks each + perpetual maintenance. For 5 CRMs
that's a quarter+ before shipping enrichment logic. Providers collapse this to days.

| | Merge.dev | Paragon | Nango | Tray Embedded |
|---|---|---|---|---|
| Model | Unified API (normalized schema) | Embedded iPaaS + UI | Code-first / OSS | Enterprise iPaaS |
| Self-serve UI | Merge Link widget + Magic Link (hosted) | Connect Portal (whitelabel popup) | Frontend SDK (you style) | Embedded UI |
| OAuth+refresh | Yes | Yes | Yes | Yes |
| Self-host | No | On-prem (ent) | **Yes (OSS)** | Limited |
| Customization | Low | Med-high | **High** | High |
| Pricing | free ≤3 accts, ~$650/mo for 10, ~$65/extra; ent $50k+/yr | opaque, contact sales | from ~$35/mo; OSS free self-host | enterprise |
| Best for | many shallow standardized connects fast | polished user-facing UI | integrations = core IP, own data | large enterprise |

**Verdict:** Buy the auth layer. **Merge.dev** for speed on standard CRMs
(Common Model already normalizes SF/HubSpot/Pipedrive/Zoho; Magic Link = onboard
with one emailed URL, zero frontend). **Nango** as fallback when per-account
pricing hurts or for regional CRMs Merge covers poorly (LeadSquared) — code-first,
self-hostable (data residency). Don't hand-roll 5 CRMs unless integration is the
differentiator.

### Lifecycle
- **Model connections N-per-client, keyed by org instance** (`instance_url` /
  portalId / DC). Support multiple Salesforce orgs per client from day 1.
- **Token refresh**: proactive, ~60–180s before expiry, jittered. SF refresh-token
  rotation (Spring '24+) can issue a new refresh token each cycle — persist it.
- **`invalid_grant` = dead token** (revoked/expired/pw change). Retry once, then
  mark "Needs reauthorization" with in-place **Reconnect** button. Don't retry forever.
- **Revoke** on disconnect (each CRM has a revoke endpoint).
- **Health**: don't trust a static green dot. Periodic cheap health ping (GET
  current user). States: Connected / Syncing / Needs reauth / Error / Disconnected.

### Metadata to fetch right after connect (powers field mapping)
Object/module list, fields per object (name, type, picklist values, required,
is_custom), pipelines & stages, owners/users, picklist enum values.
- SF: `/sobjects/` → `/sobjects/{Object}/describe`
- HubSpot: `/crm/v3/schemas`
- Zoho: `/settings/modules` → `/settings/fields?module=`
- Pipedrive: `/dealFields`, `/personFields`, `/organizationFields`

### Security
Encrypt tokens at rest (KMS/secrets manager, per-tenant key isolation) + in
transit. Least-privilege scopes (read-only where only pulling; write only objects
you push) — also ~20–30% higher connect-completion (scary scopes lose users).
SOC2: token handling in scope, audit-log every use, revoke+delete on churn,
confirm unified-API vendor is SOC2 Type II (becomes your subprocessor).

---

## 2. Field-Mapping UX

**Dominant pattern: two-column row-per-mapping table.** Source field left, target
field dropdown right, "Add mapping" button. Hightouch is the strongest reference.

### Best patterns worth copying
1. **Type-filtered source picker** (Hightouch) — after picking a target field,
   only show source columns whose type matches. Kills the #1 error class at selection.
2. **Auto-suggest by name similarity** + one-click "Suggest mappings", user
   confirms (Hightouch/Census). Pre-fill, don't auto-commit.
3. **Source-first AND target-first authoring** — users think both ways.
4. **Field Coverage %** next to each custom field (Merge) — steer away from dead fields.
5. **Value-translation table** for picklists, matched on **API name** not label
   (Hot → High Priority).
6. **Static/constant value + "don't sync nulls" toggle** (safe overwrites).
7. **Non-destructive unmapping** — removing a mapping stops updates, never deletes (Census).
8. **Preview-by-record** (Merge "Preview Values") + live debugger (Hightouch).
9. **Org-wide defaults + per-linked-account override** (Merge) — essential for scale.
10. **"Refresh fields"** control for schema drift.

### Data types
- Picklists match on **API name** (`valueName`), not label.
- Multi-select on Salesforce = `;`-separated string.
- Transformations via Liquid templating (Hightouch/Census) with sample-row tester.
- `NULL` clears a field; empty string ignored (Fivetran semantics).

### Custom fields
Discover from CRM after connect (Merge `remote-field-classes` returns name, type,
`is_custom`, `field_choices`). "Refresh" to pull newly-created fields. Most tools
require the field to pre-exist in CRM — **creating a custom field in the client's
CRM from the mapping UI is rare** and a strong Revspot differentiator (enriched
attrs like net worth / salary band have no native CRM field).

### Recommended Revspot field-mapping UX (push-oriented)
0. **Object + sync mode** — pick target (Lead/Contact/Custom), mode (Create/Update/
   **Upsert** default on email).
1. **Auto-map** — fetch schema, suggest rows by name similarity, flag "confirm".
2. **Two-column table** — Revspot field left, CRM dropdown right (searchable,
   custom grouped+labeled, Coverage % if avail, type-filtered). Required marked,
   block save until satisfied. "Refresh fields" button.
3. **Enriched attrs** (net worth, years exp, salary range) — usually no native
   field. Inline **"Create custom field in {CRM}"** action via metadata API →
   auto-select. Highest-leverage differentiator.
4. **Per-field advanced**: constant, default/fallback, "don't overwrite null",
   value-mapping table for picklists.
5. **Validate + preview** — type warnings, "Preview 5 records" mapped to CRM values.
6. **Save as template + version** — org-wide default per CRM, per-account override.
   On schema change: keep old mapping, badge removed/changed fields, prompt re-map.

---

## 3. Sync Mechanics

### Direction — frame Revspot as TWO coordinated one-way flows, not bidirectional
You own enrichment fields exclusively; client owns CRM-native fields. Disjoint
field ownership eliminates most conflict + loop complexity.
- **Inbound** (CRM → Revspot): ingest raw leads to enrich.
- **Outbound** (Revspot → CRM): write enrichment back, only enrichment fields.

Reserve true bidirectional only if clients demand round-tripping shared fields.

### Loop prevention (if bidirectional ever needed)
Best = **dedicated integration user + last-modified-by filter** (`LastModifiedBy
!= integration@revspot.ai`). Alternatives: last-touch marker field, fingerprint/
hash suppression, sync-required flag. Layer source-of-truth rules (field-level
best: Revspot owns enrichment fields, CRM owns sales fields).

### Triggers — HYBRID (webhook + polling fallback)
Webhooks for immediacy, periodic poll (~24h) to catch missed events.
**Never fan webhook events directly into API calls** — push to durable queue,
workers drain at rate-limit-safe pace.

| CRM | Change feed |
|---|---|
| HubSpot | native app webhooks + workflow webhooks |
| Salesforce | Change Data Capture (CDC) / Platform Events; no HTTP webhooks; 24h replay |
| Zoho | workflow webhooks, max 6/rule |
| Pipedrive | native webhooks, NOT rate-limited |
| LeadSquared | webhooks (lead create, task update, ...) |

### Dedup & matching (ordered by reliability)
1. **External ID / idempotency key (best)** — store Revspot lead ID in a CRM
   custom external-ID field, upsert by it. One CRM record per lead, ever. SF
   sObject Collections PATCH (200/batch).
2. Email (normalized).
3. Phone (E.164).
4. Fuzzy (Jaro-Winkler) — last resort, flag for review.

**Always write external ID on first push; never blind-INSERT.**

### Conflict resolution
Field-level merge + source priority. Revspot enrichment fields → Revspot wins;
CRM-native fields → read-only on push, never overwrite. Disjoint sets = conflicts
nearly impossible. Always log conflicts with before/after.

### Error handling & observability (self-serve make-or-break)
- Verify → dedupe on event ID → fast 202 ack + enqueue → exponential backoff +
  **jitter** (avoid thundering herd) → DLQ on exhaustion.
- Retry 5xx/408/429; don't retry other 4xx. Read `Retry-After`.
- **Idempotency**: external-ID upsert + processed-event-ID cache → retries are no-ops.
- **Per-record error log**: "12 of 500 failed — here's why" with row identity +
  retry button. Sync-run history (added/updated/failed counts, duration, status).
- **Partial failure**: commit the 488, queue the 12 — never fail whole batch.

### Incremental sync
Initial = bulk backfill (Bulk API). Delta = `updated_at` cursor (overlap window
slightly for clock skew) or CDC/change stream.

### Per-CRM rate limits (cheat sheet)
| CRM | Burst | Daily | Batch |
|---|---|---|---|
| HubSpot | 100–250/10s | 250k–1M | 100/req; Search separate 4 req/s |
| Salesforce | concurrency | 100k/24h + 1k/user | sObject Collections 200/req; Bulk 2.0 150M/day |
| Zoho | — | 4k–25k/day or 500/user license | bulk APIs |
| Pipedrive | token-bucket 20–120/2s | 30k×mult×seats; +10k POST/user/24h | API v2 cheaper |
| LeadSquared | 5/sec | plan | **Async API exempt** — use for bulk |

---

## 4. Self-Serve Onboarding Flow

### Canonical sequence (convergent across HubSpot, Outreach, Clay, Apollo)
Pick → Authorize (OAuth) → **Recommended-vs-Advanced fork** → Choose objects →
Map fields (pre-filled) → Sync rules → (Test) → Activate → Manage.

**Recommended-setup is the dominant UX lever.** HubSpot collapses object-select +
mapping + rules into ONE review screen with everything pre-filled; the 80% never
see a dropdown. Advanced is a sibling link, not a gate.

**Test-before-activate is a GAP in mature tools** (HubSpot/Outreach just start
syncing). For non-technical real-estate users, an explicit **"Send a test lead"**
confirmation before going live is a differentiator Revspot can win on.

### Integrations-page IA
- **Card grid** of provider logos (not a table). Connected section on top
  (status badges), Available below. Search + category filters when >12.
- **Per-provider detail page** → overview, permissions, Connect; after connecting
  becomes the settings/management surface with **Sync Health** (errors + impacted
  records, clickable).

### Global vs Per-Module config — THE key architecture decision
**Recommendation: ONE global connection + per-module behavior settings.**
- **Connection** (auth/token, object selection, default field map, sync health)
  → lives in **global `/integrations`**, connect once.
- **Per-module CRM behavior** → lives inside each module's Settings, points at the
  one global connection:
  - AI calling agents → which call outcomes/dispositions write to CRM, lead status mapping
  - Campaigns → reply/engagement sync-back, list inclusion, suppression
  - Enrichment → which enriched fields write back, match-before-write, "don't
    overwrite rep-managed fields"

Why: per-module connections = OAuth 3×, triple error surface, confuses users.
Fully global = the 3 modules genuinely need different write rules (a call
disposition ≠ an enriched field). Split: **connect once globally, configure
behavior where the user already is.** Each module's CRM panel shows "Connected to
HubSpot ✓ (manage connection)" chip → global Integrations. If none connected,
inline "Connect a CRM first →" deep-link.

### Friction reducers (ranked, for non-technical real-estate audience)
1. **Recommended setup that pre-fills everything** (#1 lever).
2. **Permission transparency** on connect screen — "we'll read Contacts &
   Companies, write new Leads, never delete" before OAuth.
3. **Test connection / send-test-lead before activate** (the gap to win on).
4. **Pause sync (not just disconnect)** — reversible safety valve.
5. **Sync activity log / health surface** — users need to SEE leads flowing.
6. Sandbox / "sync to test list" mode (lower priority for SMB).

### Recommended Revspot wizard
Entry: global `/integrations` empty state → "Connect your CRM" + 3-step "what
happens next".
1. Choose CRM (card grid).
2. Permission preview (plain language) → Authorize.
3. OAuth popup.
4. Setup fork — **Recommended** (default, one review screen) vs Advanced (steps 5–6).
5. Choose objects (Contacts/Companies/Deals/Leads toggles).
6. Map fields + sync rules (auto-mapped, editable; per-object direction).
7. Test — "Send a test lead" → confirm in CRM.
8. Activate — "Finish & start syncing".
9. Post-connect — confirmation + first-sync status → Sync Health page.

---

## Top decisions for Revspot
1. **Buy auth (Merge.dev) vs build** — biggest cost lever.
2. **Two one-way flows, not bidirectional** — disjoint field ownership kills conflicts/loops.
3. **External-ID upsert everywhere** — kills duplicates + makes retries idempotent.
4. **One global connection + per-module behavior settings** — IA decision.
5. **Recommended-setup default + test-lead-before-activate** — the UX wins.
6. **Create-custom-field-in-CRM from mapping UI** — enrichment-attr differentiator.
