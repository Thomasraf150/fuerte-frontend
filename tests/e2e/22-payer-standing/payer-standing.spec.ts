/**
 * Good-payer pill on the Borrowers list and the Borrower page.
 *
 * Rule — Heidi Abatan (operations), 2026-09-10: "No UA/SP walang past due &
 * short sa accounts." GOOD = open loans, none short; PROBLEM = any open loan
 * with a shortfall (so it is listed on Problem Accounts); NONE = no open loan.
 *
 * Auth is seeded into localStorage from a locally minted Owner token, as in
 * 18-branch-scope/branch-scope.spec.ts — the comment there says how to mint it.
 */
import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const FIXTURE = path.resolve(__dirname, '../../../../fuerte-backend/dev/_scratch/auth_owner.json');
const LABELS: Record<string, string> = { GOOD: 'Good', PROBLEM: 'Problem', NONE: 'None' };

type Row = { id: string; payer_standing: string | null };

test.setTimeout(180000);

test.beforeEach(async ({ page }) => {
  if (!fs.existsSync(FIXTURE)) {
    throw new Error(`Missing auth fixture: ${FIXTURE} — mint it first (see 18-branch-scope).`);
  }
  const auth = fs.readFileSync(FIXTURE, 'utf8');
  await page.addInitScript((a) => localStorage.setItem('authStore', a as string), auth);
});

/** Open /borrowers and return the rows the list query actually returned. */
async function openList(page: Page): Promise<Row[]> {
  const response = page.waitForResponse(
    (r) => r.url().includes('/fuerte-api') && (r.request().postData() ?? '').includes('getBorrowers('),
    { timeout: 120000 },
  );
  await page.goto('/borrowers');
  const body = await (await response).json();
  return body.data.getBorrowers.data as Row[];
}

test('every borrower row shows one payer pill, matching the API', async ({ page }) => {
  const rows = await openList(page);
  expect(rows.length).toBeGreaterThan(0);
  for (const r of rows) expect(Object.keys(LABELS)).toContain(r.payer_standing);

  await expect(page.locator('.rdt_TableCol', { hasText: 'Payer' })).toBeVisible({ timeout: 60000 });
  const pills = page.locator('.rdt_TableBody [data-payer-standing]');
  await expect(pills).toHaveCount(rows.length, { timeout: 60000 });
  expect((await pills.allInnerTexts()).map((t) => t.trim())).toEqual(
    rows.map((r) => LABELS[r.payer_standing as string]),
  );
});

test("a Problem pill opens that borrower's Problem Accounts page", async ({ page }) => {
  const rows = await openList(page);
  const problem = rows.find((r) => r.payer_standing === 'PROBLEM');
  test.skip(!problem, 'no Problem borrower on the first page');

  const link = page.locator(`a[href="/problem-accounts/borrower/${problem!.id}"]`);
  await expect(link).toHaveText('Problem', { timeout: 60000 });
  // Long timeout: in dev a duplicate list fetch can put the table back into its
  // loading state (rows unmount) right after the text check above.
  await expect(link.locator('svg'), 'the "more detail" chevron').toHaveCount(1, { timeout: 60000 });
  await link.click();
  // The dev server compiles the route on first visit and the App Router only
  // commits the URL once it has loaded — the top loader bar shows navigation
  // started long before the URL changes — so allow for the compile.
  await expect(page).toHaveURL(new RegExp(`/problem-accounts/borrower/${problem!.id}$`), {
    timeout: 120000,
  });
  await expect(page.locator('.rdt_TableBody .rdt_TableRow').first()).toBeVisible({ timeout: 120000 });
  await expect(page.getByText('No data found for this borrower.')).toHaveCount(0);
});

test('the Borrower page shows the same pill as the list', async ({ page }) => {
  const [first] = await openList(page);
  await page.goto(`/borrowers/${first.id}`);
  const pill = page.locator(`[data-payer-standing="${first.payer_standing}"]`);
  await expect(pill).toBeVisible({ timeout: 120000 });
  await expect(pill).toHaveText(LABELS[first.payer_standing as string]);
});

// On a 360px budget phone only ~2 columns fit. The list must lead with who the
// borrower is, then their standing, both inside the viewport without scrolling.
// It also guards app/borrowers/styles.css: its phone rules hide columns by
// data-column-id and reach the borrower page's tables too, so the Payer column
// must never renumber them (renumbering once hid the Loans tab's Action column).
test('on a phone the list leads with the name, then the standing', async ({ page }) => {
  const width = 360;
  await page.setViewportSize({ width, height: 800 });
  await openList(page);
  const pill = page.locator('.rdt_TableBody [data-payer-standing]').first();
  await expect(pill).toBeVisible({ timeout: 60000 });

  const visibleHeaders = await page.locator('.rdt_TableHeadRow .rdt_TableCol').evaluateAll((cols) =>
    cols
      .filter((c) => getComputedStyle(c).display !== 'none')
      .sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left)
      .map((c) => (c.textContent ?? '').replace(/[^A-Za-z ]/g, '').trim()),
  );
  expect(visibleHeaders.slice(0, 2)).toEqual(['First Name', 'Payer']);
  for (const hidden of ['Branch', 'Middle Name', 'Chief', 'Residence Address']) {
    expect(visibleHeaders).not.toContain(hidden);
  }
  // The narrower phone columns must wrap header labels, never ellipsize them.
  const truncatedHeaders = await page.locator('.rdt_TableHeadRow .rdt_TableCol').evaluateAll((cols) =>
    cols
      .filter((c) => getComputedStyle(c).display !== 'none')
      .filter((c) => [c, ...Array.from(c.querySelectorAll('*'))].some((el) => el.scrollWidth > el.clientWidth + 1))
      .map((c) => (c.textContent ?? '').replace(/[^A-Za-z ]/g, '').trim()),
  );
  expect(truncatedHeaders, 'header labels cut off').toEqual([]);

  // Worst case: the Problem filter, where every stamp is the widest one
  // ("Problem ›"). The unfiltered first page once hid a 5px overflow here,
  // because the table sizes its columns from whatever content is on the page.
  await applyPayerFilter(page, 'Problem', 'PROBLEM');
  let fit: { overflowPx: number; namesCut: number } | null = null;
  for (let attempt = 0; attempt < 60 && !fit; attempt++) {
    // Retry: a duplicate dev fetch can unmount the rows for a moment.
    fit = await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('.rdt_TableBody [data-payer-standing]'));
      if (!pills.length || pills.some((p) => p.getAttribute('data-payer-standing') !== 'PROBLEM')) return null;
      // Measure against the table's own visible edge (its horizontal scroller),
      // not the viewport: the card's padding clips the table well inside 360px.
      let scroller = pills[0].parentElement;
      while (scroller && !['auto', 'scroll'].includes(getComputedStyle(scroller).overflowX)) {
        scroller = scroller.parentElement;
      }
      const edge = Math.min(window.innerWidth, (scroller ?? document.documentElement).getBoundingClientRect().right);
      const names = Array.from(document.querySelectorAll('.rdt_TableBody [data-column-id="2"]'));
      return {
        overflowPx: Math.max(...pills.map((p) => p.getBoundingClientRect().right)) - edge,
        namesCut: names.filter((n) => n.scrollWidth > n.clientWidth + 1).length,
      };
    });
    if (!fit) await page.waitForTimeout(1000);
  }
  expect(fit, 'the Problem-filtered table never settled').not.toBeNull();
  expect(fit!.overflowPx, 'a "Problem ›" stamp is cut off by the table edge').toBeLessThanOrEqual(0);
  expect(fit!.namesCut, 'a first name is cut off').toBe(0);
});

/** Click a Payer chip; return the rows of the list request that click triggered. */
async function applyPayerFilter(page: Page, label: string, standing: string | null): Promise<Row[]> {
  const response = page.waitForResponse(
    (r) => {
      const body = r.request().postData() ?? '';
      if (!r.url().includes('/fuerte-api') || !body.includes('getBorrowers(')) return false;
      return standing ? body.includes(`"payer":"${standing}"`) : !body.includes('"payer"');
    },
    { timeout: 120000 },
  );
  await page
    .getByRole('group', { name: 'Filter by payer' })
    .getByRole('button', { name: label, exact: true })
    .click();
  const json = await (await response).json();
  return json.data.getBorrowers.data as Row[];
}

// The filter is server-side (the list is paged), so every row it returns — not
// just the ones on screen — must carry the chosen standing.
test('the Payer filter lists only borrowers with that standing', async ({ page }) => {
  await openList(page);
  const chips = page.getByRole('group', { name: 'Filter by payer' });
  const pills = page.locator('.rdt_TableBody [data-payer-standing]');

  for (const [label, standing] of [['Problem', 'PROBLEM'], ['Good', 'GOOD'], ['None', 'NONE']] as const) {
    const rows = await applyPayerFilter(page, label, standing);
    expect(rows.every((r) => r.payer_standing === standing), `${label} returned another standing`).toBe(true);
    await expect(chips.getByRole('button', { name: label, exact: true })).toHaveAttribute('aria-pressed', 'true');
    // Wait until no pill of another standing is left on screen, then count.
    await expect(page.locator(`.rdt_TableBody [data-payer-standing]:not([data-payer-standing="${standing}"])`))
      .toHaveCount(0, { timeout: 60000 });
    await expect(pills).toHaveCount(rows.length, { timeout: 60000 });
  }

  const all = await applyPayerFilter(page, 'All', null);
  expect(all.length).toBeGreaterThan(0);
  await expect(chips.getByRole('button', { name: 'All', exact: true })).toHaveAttribute('aria-pressed', 'true');
});
