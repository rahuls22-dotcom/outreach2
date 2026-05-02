/**
 * Capture the 10 screenshot states referenced in docs/prd-brief-handoff.md §11.
 *
 * Prereqs:
 *   - dev server running on http://localhost:3000
 *   - system Chrome installed (uses Playwright's `channel: "chrome"` so we don't
 *     need to download Playwright's bundled chromium — the sandbox blocks the CDN).
 *
 * Run:
 *   npx tsx scripts/capture-prd-screenshots.ts
 *
 * Output:
 *   docs/images/01-home-default.png  through  10-diagnosis-bullets.png
 *   (state 05 — SCALE modal — is intentionally skipped; mock data has no SCALE action.)
 */

import { chromium, type Page } from "playwright";
import * as path from "node:path";

const BASE = "http://localhost:3000/campaigns/camp-7";
const OUT = path.join(__dirname, "..", "docs", "images");

async function snap(page: Page, name: string, opts: { fullPage?: boolean; clip?: { x: number; y: number; width: number; height: number } } = {}) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: opts.fullPage ?? false, clip: opts.clip });
  console.log(`  ✓ ${name}.png`);
}

async function gotoFresh(page: Page) {
  await page.goto(BASE, { waitUntil: "networkidle" });
  // Settle a beat so framer-motion entries finish.
  await page.waitForTimeout(400);
}

async function openDiagnosis(page: Page) {
  await page.getByRole("button", { name: "Diagnosis", exact: true }).first().click();
  await page.waitForTimeout(300);
}

async function expandAdsetRow(page: Page, name: string) {
  const row = page.locator("tr.cursor-pointer", { hasText: name }).first();
  await row.scrollIntoViewIfNeeded();
  await row.click();
  await page.waitForTimeout(300);
}

async function dismissAgentBanner(page: Page) {
  const dismiss = page.locator('button[aria-label="Dismiss"]').first();
  if (await dismiss.isVisible().catch(() => false)) {
    await dismiss.click();
    await page.waitForTimeout(200);
  }
}

async function main() {
  console.log("Launching system Chrome…");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log(`Capturing screenshots → ${OUT}`);

  // 1. Default home (banner + status strip + NBA + tabs visible).
  await gotoFresh(page);
  await snap(page, "01-home-default");

  // 2. Banner dismissed → Connect agent pill in header.
  await dismissAgentBanner(page);
  await snap(page, "02-banner-dismissed");

  // 3. Status strip + NBA card focus — crop to top section (~520px tall).
  await gotoFresh(page);
  await snap(page, "03-status-strip-nba", { clip: { x: 0, y: 0, width: 1440, height: 540 } });

  // 4. Action-flow modal — Confirm flow with CBO callout.
  await gotoFresh(page);
  await page.getByRole("button", { name: "Apply reallocation", exact: true }).click();
  await page.waitForSelector(".fixed.z-\\[70\\]");
  await page.waitForTimeout(200);
  await snap(page, "04-modal-confirm-cbo");

  // 5. SCALE modal — intentionally skipped (no SCALE action in current mock).
  console.log("  ⤳ skipping 05 (no SCALE action in mock; capture manually)");

  // 6. Action-flow modal — Refresh deeplink.
  await gotoFresh(page);
  await openDiagnosis(page);
  await expandAdsetRow(page, "Sarjapur IT Corridor");
  await page.getByRole("button", { name: "Reformat", exact: true }).first().click();
  await page.waitForSelector(".fixed.z-\\[70\\]");
  await page.waitForTimeout(200);
  await snap(page, "06-modal-deeplink-refresh");

  // 7. Diagnosis tab — full page.
  await gotoFresh(page);
  await openDiagnosis(page);
  await snap(page, "07-diagnosis-tab", { fullPage: true });

  // 8. Persona scorecard — scrolled into view, focused.
  await gotoFresh(page);
  await openDiagnosis(page);
  const personaCard = page.locator("h3", { hasText: "Persona scorecard" }).first();
  await personaCard.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -80));
  await page.waitForTimeout(200);
  await snap(page, "08-persona-scorecard");

  // 9. Creative signals with VIDEO_THUMBNAIL_DROP — Broad Bangalore expanded.
  await gotoFresh(page);
  await openDiagnosis(page);
  await expandAdsetRow(page, "Broad Bangalore");
  const sigHeader = page.locator("span", { hasText: "CREATIVE SIGNALS" }).first();
  await sigHeader.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -100));
  await page.waitForTimeout(200);
  await snap(page, "09-creative-signals-video");

  // 10. Verb-specific Diagnosis bullet chips.
  await gotoFresh(page);
  await openDiagnosis(page);
  const diagCard = page.locator("h3", { hasText: "Diagnosis" }).filter({ has: page.locator("..") }).first();
  // Diagnosis card heading inside the diagnosis-bullets component
  const bullets = page.locator(".rounded-card", { hasText: "signals connecting top of funnel" }).first();
  await bullets.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -80));
  await page.waitForTimeout(200);
  await snap(page, "10-diagnosis-bullets");

  await browser.close();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
