/**
 * B1, the Borrowers list (/borrowers), spec docs/superpowers/specs/2026-10-05-borrower-pages-responsive-design.md:
 *   - the whole row opens the borrower; Ctrl-click opens a new tab; a text selection and the
 *     Remove button do not open it; the first name is a real link named by the full name;
 *   - from md: Branch, Payer, First, Last, Date of Birth, Action; from 1280 also Middle and Chief;
 *     never a Residence Address column;
 *   - below md: phone rows, one link each, "DELA CRUZ, JUAN M." then Payer / branch / DOB, no
 *     pencil or trash; the branch only for a user who sees more than one;
 *   - search with a visible label and "Name, mobile no. or chief"; no duplicate card heading;
 *   - nothing scrolls sideways at 360, 768 or 1280.
 *
 * NO CREDENTIALS AND NO BACKEND: borrowerFormHarness's FakeBackend answers every request. The
 * borrowers are fictional. The borrower page is not under test: its URL is answered with a
 * placeholder, so a navigation is seen without that page asking the backend for anything.
 */
import type { Page } from '@playwright/test';
import { test, expect, signedInAs, sidewaysScroll, FakeBackend } from '../26-new-application/borrowerFormHarness';

const APP = 'http://localhost:3000';
const BACKEND = 'http://localhost:8080';

const ROWS = [
  { id: '7001', firstname: 'Juan', middlename: 'Santos', lastname: 'Dela Cruz', payer_standing: 'GOOD', dob: '1990-01-01', branch: 'E2E Sub-branch A' },
  { id: '7002', firstname: 'Maria Lourdes', middlename: '', lastname: 'Villanueva-Reyes', payer_standing: 'PROBLEM', dob: '1985-06-15', branch: 'E2E Sub-branch B' },
].map((r) => ({
  id: r.id, firstname: r.firstname, middlename: r.middlename, lastname: r.lastname, payer_standing: r.payer_standing,
  residence_address: 'BLK 12 LOT 4 SAMPLE SUBDIVISION, SAMPLE CITY', is_deleted: 0,
  chief: { id: '9201', name: 'E2E Chief One' },
  borrower_details: { id: r.id, dob: r.dob, contact_no: '09170000000' },
  branch_sub: { id: '9101', name: r.branch, branch: { name: 'E2E Branch' } },
}));

/** Row 7002 has a deletion request pending (someone else's), so its Action cell holds the pending stamp. */
const PENDING = [{
  request_id: '9901', entity_type: 'borrower', entity_id: 7002, requested_by_user_id: 90002,
  requested_by_name: 'E2E Requester', reason: null, created_at: '2026-10-06 09:00:00', is_mine: false,
}];

const PLACEHOLDER = (route: import('@playwright/test').Route) =>
  route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>elsewhere</title><p>E2E placeholder page</p>' });

async function openList(page: Page, backend: FakeBackend, branches: number[] = [9101]): Promise<void> {
  backend.extraGraphql.set('getBorrowers', () => ({
    data: { getBorrowers: { data: ROWS, paginatorInfo: { total: ROWS.length, currentPage: 1, lastPage: 1, perPage: 20, hasMorePages: false } } },
  }));
  backend.extraGraphql.set('pendingDeletionsForEntities', () => ({ data: { pendingDeletionsForEntities: PENDING } }));
  await page.route(`${APP}/borrowers/70*`, PLACEHOLDER);
  await page.route(`${APP}/problem-accounts/**`, PLACEHOLDER);
  await signedInAs(page, backend, branches);
  await page.goto('/borrowers', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('div.fixed.inset-0.z-9999')).toHaveCount(0, { timeout: 30_000 });
}

/**
 * How far the TABLE scrolls sideways inside its own overflow wrapper (react-data-table-component's
 * `overflow-x: auto` box), which the page-level sidewaysScroll() never sees.
 */
const tableScroll = (page: Page): Promise<number> =>
  page.locator('.rdt_Table').first().evaluate((table) => {
    let box: HTMLElement | null = table.parentElement;
    while (box && !['auto', 'scroll'].includes(getComputedStyle(box).overflowX)) box = box.parentElement;
    return box ? box.scrollWidth - box.clientWidth : 0;
  });

/** Every control in the Action cells, as [left, right] overhang past its cell (0 = fully inside). */
const actionOverhang = (page: Page): Promise<number[]> =>
  page.locator('.rdt_TableRow [data-column-id="8"]').evaluateAll((cells) =>
    cells.flatMap((cell) => {
      const c = cell.getBoundingClientRect();
      return Array.from(cell.querySelectorAll('button')).map((b) => {
        const r = b.getBoundingClientRect();
        return Math.max(0, c.left - r.left, r.right - c.right);
      });
    }));

const headers = (page: Page) =>
  page.locator('.rdt_TableHeadRow .rdt_TableCol').evaluateAll((cols) =>
    // Sortable headers carry the library's sort icon ("▲") in their text.
    cols.filter((c) => getComputedStyle(c).display !== 'none').map((c) => (c.textContent ?? '').replace(/[▲▼]/g, '').trim()));

test.describe('B1 at desktop and tablet widths', () => {
  test('a click on a cell opens the borrower', async ({ page, backend }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openList(page, backend);
    const row = page.locator('.rdt_TableRow').filter({ hasText: 'Dela Cruz' });

    await row.getByText('1990-01-01', { exact: true }).click();

    await expect(page).toHaveURL(`${APP}/borrowers/7001`, { timeout: 30_000 });
  });

  test('the first name is a link named by the full name; a Ctrl-click on the row opens a new tab', async ({ page, context, backend }) => {
    await context.route(`${BACKEND}/**`, (route) => backend.handle(route));
    await context.route(`${APP}/borrowers/70*`, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<p>E2E borrower page</p>' }));
    await page.setViewportSize({ width: 1280, height: 900 });
    await openList(page, backend);

    const link = page.getByRole('link', { name: 'Dela Cruz, Juan S.', exact: true });
    await expect(link).toHaveAttribute('href', '/borrowers/7001');
    await expect(link).toHaveText('Juan');

    const [tab] = await Promise.all([
      context.waitForEvent('page'),
      page.locator('.rdt_TableRow').filter({ hasText: 'Dela Cruz' }).getByText('1990-01-01', { exact: true }).click({ modifiers: ['Control'] }),
    ]);
    await expect(tab).toHaveURL(`${APP}/borrowers/7001`, { timeout: 30_000 });
    await expect(page).toHaveURL(`${APP}/borrowers`);
    await tab.close();
  });

  test('a text selection and the Remove button do not open the borrower', async ({ page, backend }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openList(page, backend);
    const row = page.locator('.rdt_TableRow').filter({ hasText: 'Dela Cruz' });
    const dob = row.getByText('1990-01-01', { exact: true });
    const box = (await dob.boundingBox())!;

    await page.mouse.move(box.x + 1, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 1, box.y + box.height / 2, { steps: 6 });
    await page.mouse.up();
    expect(await page.evaluate(() => window.getSelection()?.toString() ?? '')).not.toBe('');
    await page.waitForTimeout(800);
    await expect(page).toHaveURL(`${APP}/borrowers`);

    await page.evaluate(() => window.getSelection()?.removeAllRanges());
    await row.getByRole('button', { name: 'Remove Dela Cruz, Juan S.' }).click();
    await page.waitForTimeout(800);
    await expect(page).toHaveURL(`${APP}/borrowers`);
  });

  test('columns: never an address; Middle and Chief only from 1280', async ({ page, backend }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openList(page, backend);
    await expect(page.locator('.rdt_TableRow').first()).toBeVisible({ timeout: 30_000 });
    expect(await headers(page)).toEqual(['Branch', 'Payer', 'First Name', 'Middle Name', 'Last Name', 'Chief', 'Date of Birth', 'Action']);

    await page.setViewportSize({ width: 1024, height: 900 });
    await expect.poll(() => headers(page)).toEqual(['Branch', 'Payer', 'First Name', 'Last Name', 'Date of Birth', 'Action']);

    await page.setViewportSize({ width: 768, height: 900 });
    await expect.poll(() => headers(page)).toEqual(['Branch', 'Payer', 'First Name', 'Last Name', 'Date of Birth', 'Action']);
    await expect(page.getByText('Residence Address')).toHaveCount(0);
  });

  test('the Payer "Problem ›" link keeps its own click: it opens Problem Accounts, not the borrower', async ({ page, backend }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openList(page, backend);

    await page.locator('.rdt_TableRow').filter({ hasText: 'Villanueva-Reyes' }).getByRole('link', { name: /^Problem/ }).click();

    await expect(page).toHaveURL(`${APP}/problem-accounts/borrower/7002`, { timeout: 30_000 });
  });

  for (const width of [768, 1024, 1280]) {
    test(`at ${width}px the table fits its card and every action button is whole, the pending stamp included`, async ({ page, backend }) => {
      await page.setViewportSize({ width, height: 900 });
      await openList(page, backend);
      await expect(page.getByRole('button', { name: /^Pending deletion/ })).toBeVisible({ timeout: 30_000 });

      expect(await tableScroll(page)).toBeLessThanOrEqual(0);
      const overhang = await actionOverhang(page);
      expect(overhang.length).toBe(4);
      expect(Math.max(...overhang)).toBeLessThanOrEqual(0);
      const target = width < 1024 ? 48 : 40;
      for (const box of await page.locator('.rdt_TableRow [data-column-id="8"] button').evaluateAll((bs) => bs.map((b) => b.getBoundingClientRect().height))) {
        expect(box).toBeGreaterThanOrEqual(target);
      }
    });
  }

  test('search has a visible label and says what it matches; the page says "Borrowers" once', async ({ page, backend }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openList(page, backend);

    const search = page.getByRole('searchbox', { name: 'Search borrowers', exact: true });
    await expect(search).toBeVisible({ timeout: 30_000 });
    await expect(search).toHaveAttribute('placeholder', 'Name, mobile no. or chief');
    await expect(page.getByText('Search borrowers', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Borrowers', exact: true })).toHaveCount(1);
  });
});

test.describe('B1 on a phone', () => {
  test('phone rows: one link each, the name then Payer and date of birth; no table, no pencil, no trash', async ({ page, backend }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openList(page, backend);

    const rows = page.locator('main ul li > a[href^="/borrowers/"]');
    await expect(rows).toHaveCount(2, { timeout: 30_000 });
    const first = rows.first();
    await expect(first).toHaveAttribute('href', '/borrowers/7001');
    await expect(first).toContainText('Dela Cruz, Juan S.');
    expect(await first.locator('p').first().evaluate((p) => getComputedStyle(p).textTransform)).toBe('uppercase');
    await expect(first).toContainText('Good');
    await expect(first).toContainText('1990-01-01');
    expect((await first.boundingBox())!.height).toBeGreaterThanOrEqual(56);
    // The Payer pill is plain text here, even Problem's (a link inside the row link would be
    // invalid HTML): row 7002 is the Problem one.
    await expect(rows.nth(1)).toContainText('Problem');
    await expect(rows.nth(1).locator('a')).toHaveCount(0);
    await expect(rows.nth(1)).toContainText('Deletion pending');

    await expect(page.locator('.rdt_Table')).toBeHidden();
    await expect(page.getByRole('button', { name: /^(Edit|Remove) / })).toHaveCount(0);

    await first.click();
    await expect(page).toHaveURL(`${APP}/borrowers/7001`, { timeout: 30_000 });
  });

  test('a long name wraps onto a second line at a space, never inside a word', async ({ page, backend }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openList(page, backend);
    const name = page.locator('main ul li > a').nth(1).locator('p').first();
    await expect(name).toBeVisible({ timeout: 30_000 });

    const { lines, splitWords } = await name.evaluate((p) => {
      const text = p.firstChild as Text;
      const words: { word: string; lines: number }[] = [];
      const re = /\S+/g;
      for (let m = re.exec(text.data); m; m = re.exec(text.data)) {
        const range = document.createRange();
        range.setStart(text, m.index);
        range.setEnd(text, m.index + m[0].length);
        words.push({ word: m[0], lines: new Set(Array.from(range.getClientRects()).map((r) => Math.round(r.top))).size });
      }
      const all = document.createRange();
      all.selectNodeContents(p);
      return {
        lines: new Set(Array.from(all.getClientRects()).map((r) => Math.round(r.top))).size,
        // A hyphen is a word's own break point ("VILLANUEVA-/REYES"); only a split elsewhere fails.
        splitWords: words.filter((w) => w.lines > 1 && !w.word.includes('-')).map((w) => w.word),
      };
    });
    expect(lines).toBe(2);
    expect(splitWords).toEqual([]);
  });

  test('the branch shows only for a user who sees more than one', async ({ page, backend }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openList(page, backend, [9101]);
    const first = page.locator('main ul li > a').first();
    await expect(first).toBeVisible({ timeout: 30_000 });
    await expect(first).not.toContainText('E2E Sub-branch A');
  });

  test('a user with two branches sees each row\'s branch', async ({ page, backend }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openList(page, backend, [9101, 9102]);
    const first = page.locator('main ul li > a').first();
    await expect(first).toContainText('E2E Sub-branch A', { timeout: 30_000 });
  });
});

for (const width of [360, 768, 1280]) {
  test(`nothing scrolls sideways at ${width}px`, async ({ page, backend }) => {
    await page.setViewportSize({ width, height: 900 });
    await openList(page, backend);
    await expect(page.getByRole('searchbox', { name: 'Search borrowers', exact: true })).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(300);
    expect(await sidewaysScroll(page)).toBeLessThanOrEqual(0);
  });
}
