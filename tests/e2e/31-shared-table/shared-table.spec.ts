/**
 * The shared list table v2 (spec docs/superpowers/specs/2026-10-05-shared-table-v2-design.md),
 * through the Borrowers list, the first server-side list every role opens:
 *   - the pager: First / Previous / a window / Next / Last, aria-current, "1–20 of 630 borrowers",
 *     "No borrowers", wrapping at 360 with no sideways scroll, 48px targets below lg and 40px from lg;
 *   - the header: a named search box, full width and 48px on phones;
 *   - no scrollbox inside the card, and the skeleton while loading;
 *   - the page-CSS leak: the Borrowers stylesheet no longer hides column ids outside its own list;
 *   - Payment Posting's row action is a named "Open loan" button that opens the loan, not "Remove";
 *   - a pointer and a hover tint only on rows that open something.
 * Whole-row open (rowHref) is covered on Applications, in tests/e2e/25-applications (section 11).
 *
 * NO CREDENTIALS AND NO BACKEND: borrowerFormHarness's FakeBackend answers every request, a request
 * no stub answers fails the test, and the borrowers are fictional.
 */
import type { Page } from '@playwright/test';
import { test, expect, signedInAs, sidewaysScroll, FakeBackend } from '../26-new-application/borrowerFormHarness';

const TOTAL = 630;
const PER_PAGE = 20;
const LAST_PAGE = Math.ceil(TOTAL / PER_PAGE);

/** A fictional borrower row with the fields the Borrowers columns read. */
const borrower = (id: number) => ({
  id: String(id),
  payer_standing: 'good',
  firstname: `E2E${id}`,
  middlename: 'Sample',
  lastname: 'Borrower',
  residence_address: '1 Sample Street',
  is_deleted: 0,
  chief: { id: '9201', name: 'E2E Chief One' },
  borrower_details: { id: String(id), dob: '1990-01-01', contact_no: '09170000000' },
  branch_sub: { id: '9101', name: 'E2E Sub-branch A' },
});

/** Answer getBorrowers with page `page` of TOTAL borrowers (or none), and the fields the list page asks for. */
function stubBorrowersList(backend: FakeBackend, total = TOTAL): void {
  backend.extraGraphql.set('getBorrowers', (variables) => {
    const page = Number(variables.page ?? 1);
    const first = Number(variables.first ?? PER_PAGE);
    const lastPage = Math.max(1, Math.ceil(total / first));
    const count = Math.max(0, Math.min(first, total - (page - 1) * first));
    return {
      data: {
        getBorrowers: {
          data: Array.from({ length: count }, (_, i) => borrower(7000 + (page - 1) * first + i + 1)),
          paginatorInfo: { total, currentPage: page, lastPage, perPage: first, hasMorePages: page < lastPage },
        },
      },
    };
  });
  backend.extraGraphql.set('getDeletionRequests', () => ({ data: { getDeletionRequests: [] } }));
  backend.extraGraphql.set('myDeletionRequests', () => ({ data: { myDeletionRequests: [] } }));
}

async function openBorrowers(page: Page, backend: FakeBackend, total = TOTAL): Promise<void> {
  stubBorrowersList(backend, total);
  await signedInAs(page, backend, [9101]);
  await page.goto('/borrowers', { waitUntil: 'domcontentloaded' });
  // The root layout's 1s boot Loader covers the page: wait it out before measuring or clicking.
  await expect(page.locator('div.fixed.inset-0.z-9999')).toHaveCount(0, { timeout: 30_000 });
}

const pager = (page: Page) => page.getByRole('navigation', { name: 'Pages' });

test.describe('the pager', () => {
  test('First / Previous / window / Next / Last, with the current page marked', async ({ page, backend }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openBorrowers(page, backend);

    await expect(page.getByText(`1–20 of ${TOTAL} borrowers`)).toBeVisible({ timeout: 30_000 });
    const nav = pager(page);
    await expect(nav.getByRole('button', { name: 'First page' })).toBeDisabled();
    await expect(nav.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    await expect(nav.getByRole('button', { name: 'Page 1', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('button', { name: 'Page 2', exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: `Page ${LAST_PAGE}`, exact: true })).toBeVisible();

    await nav.getByRole('button', { name: 'Next page' }).click();
    await expect(nav.getByRole('button', { name: 'Page 2', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByText(`21–40 of ${TOTAL} borrowers`)).toBeVisible();
    expect(backend.calls('getBorrowers').at(-1)?.variables.page).toBe(2);

    await nav.getByRole('button', { name: 'Last page' }).click();
    await expect(nav.getByRole('button', { name: `Page ${LAST_PAGE}`, exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('button', { name: 'Next page' })).toBeDisabled();
    await expect(nav.getByRole('button', { name: 'Last page' })).toBeDisabled();
    await expect(page.getByText(`621–630 of ${TOTAL} borrowers`)).toBeVisible();

    await nav.getByRole('button', { name: 'First page' }).click();
    await expect(nav.getByRole('button', { name: 'Page 1', exact: true })).toHaveAttribute('aria-current', 'page');
  });

  test('an empty list reads "No borrowers" and draws no page buttons', async ({ page, backend }) => {
    await openBorrowers(page, backend, 0);

    await expect(page.getByText('No borrowers', { exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Showing \d+ to/)).toHaveCount(0);
    await expect(pager(page)).toHaveCount(0);
  });

  for (const { width, target } of [{ width: 360, target: 48 }, { width: 1280, target: 40 }]) {
    test(`at ${width}px it fits without sideways scroll and every control is at least ${target}px`, async ({ page, backend }) => {
      await page.setViewportSize({ width, height: 900 });
      await openBorrowers(page, backend);
      await expect(page.getByText(`1–20 of ${TOTAL} borrowers`)).toBeVisible({ timeout: 30_000 });

      const sizes = await pager(page).getByRole('button').evaluateAll((buttons) =>
        buttons.map((b) => ({ h: b.getBoundingClientRect().height, w: b.getBoundingClientRect().width, right: b.getBoundingClientRect().right, top: b.getBoundingClientRect().top })),
      );
      if (width < 640) {
        // A phone gets the four arrows around "Page 1 of 32", on one row; the numbered window is from `sm`.
        expect(sizes).toHaveLength(4);
        expect(new Set(sizes.map((size) => Math.round(size.top))).size).toBe(1);
        await expect(pager(page).getByText(`Page 1 of ${LAST_PAGE}`)).toBeVisible();
      } else {
        expect(sizes.length).toBeGreaterThanOrEqual(7);
      }
      for (const size of sizes) {
        expect(size.h).toBeGreaterThanOrEqual(target);
        expect(size.w).toBeGreaterThanOrEqual(target);
        expect(size.right).toBeLessThanOrEqual(width);
      }
      const select = page.getByRole('combobox', { name: 'Rows' });
      expect((await select.boundingBox())!.height).toBeGreaterThanOrEqual(target);
      expect(await sidewaysScroll(page)).toBeLessThanOrEqual(0);
    });
  }
});

test.describe('the header and the table body', () => {
  test('the search box has a name, and is full width and 48px tall on a phone', async ({ page, backend }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openBorrowers(page, backend);

    const search = page.getByRole('searchbox').first();
    await expect(search).toBeVisible({ timeout: 30_000 });
    await expect(search).toHaveAccessibleName(/\S/);
    const box = (await search.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(48);
    // Full width: as wide as the header row it sits in (the page pads its own table container).
    const row = await search.evaluate((el) => el.parentElement!.parentElement!.clientWidth);
    expect(box.width).toBeGreaterThanOrEqual(row - 1);
  });

  test('no scrollbox inside the card: the table body is not height-capped', async ({ page, backend }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openBorrowers(page, backend);
    await expect(page.getByText(`1–20 of ${TOTAL} borrowers`)).toBeVisible({ timeout: 30_000 });

    const capped = await page.locator('.rdt_Table').first().evaluate((table) => {
      for (let el: HTMLElement | null = table as HTMLElement; el && !el.classList.contains('responsive-table-container'); el = el.parentElement) {
        const style = getComputedStyle(el);
        if (style.maxHeight !== 'none' && (style.overflowY === 'auto' || style.overflowY === 'scroll')) return style.maxHeight;
      }
      return null;
    });
    expect(capped).toBeNull();
  });

  test('while loading, skeleton rows with a "Loading…" status replace the spinner', async ({ page, backend }) => {
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => { release = resolve; });
    stubBorrowersList(backend);
    const answer = backend.extraGraphql.get('getBorrowers')!;
    backend.extraGraphql.set('getBorrowers', async (variables) => { await held; return answer(variables); });
    await signedInAs(page, backend, [9101]);
    await page.goto('/borrowers', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('status').filter({ hasText: 'Loading…' }).first()).toBeAttached({ timeout: 30_000 });
    await expect(page.getByText('Loading data...')).toHaveCount(0);
    release();
    await expect(page.getByText(`1–20 of ${TOTAL} borrowers`)).toBeVisible({ timeout: 30_000 });
  });
});

test.describe('the page-CSS leak', () => {
  test("the Borrowers stylesheet hides its phone columns only inside its own list, never on another table", async ({ page, backend }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openBorrowers(page, backend);
    await expect(page.getByText(`1–20 of ${TOTAL} borrowers`)).toBeVisible({ timeout: 30_000 });

    // Inside the Borrowers list, Middle Name (column id 3) is still hidden on a phone, as before.
    const inside = await page.locator('.borrowers-list [data-column-id="3"]').first().evaluate((el) => getComputedStyle(el).display);
    expect(inside).toBe('none');

    // Any other table: a column 3 outside the Borrowers list (as on the SOA list, which Next would
    // render with this stylesheet still loaded) stays visible.
    const outside = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.innerHTML = '<div class="responsive-table-container"><div class="rdt_Table"><div class="rdt_TableRow"><div class="rdt_TableCell" data-column-id="3">Borrower</div><div class="rdt_TableCell" data-column-id="6">x</div></div></div></div>';
      document.body.appendChild(probe);
      const cells = Array.from(probe.querySelectorAll('[data-column-id]')).map((el) => getComputedStyle(el).display);
      const margin = getComputedStyle(probe.querySelector('.responsive-table-container')!).marginLeft;
      probe.remove();
      return { cells, margin };
    });
    expect(outside.cells).not.toContain('none');
    expect(outside.margin).toBe('0px');
  });
});

/** A fictional Payment Posting row; `status` is what custom_status reads. */
const ppLoan = (id: string, customStatus: string) => ({
  id, loan_ref: `E2E-${id}`, status: 3, custom_status: customStatus, is_closed: 0,
  pn_amount: '12000.00', loan_proceeds: '10000.00', term: '6',
  loan_product: { id: '1', description: 'E2E 6 months' },
  borrower: { id: '7001', firstname: 'E2E', lastname: 'Borrower' },
});

async function openPaymentPosting(page: Page, backend: FakeBackend): Promise<void> {
  const loans = [ppLoan('8801', 'Released'), ppLoan('8802', 'Posted (Closed)')];
  backend.extraGraphql.set('getLoanListPymntPosting', () => ({
    data: { getLoanListPymntPosting: { data: loans, paginatorInfo: { total: loans.length, currentPage: 1, lastPage: 1, perPage: 20, hasMorePages: false } } },
  }));
  // The loan page itself is not under test: answer its URL (document or RSC fetch) with a placeholder,
  // so the navigation is seen without the loan page asking the backend for anything.
  await page.route('**/payment-posting/8801**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>loan</title><p>E2E loan page</p>' }));
  await signedInAs(page, backend, [9101]);
  await page.goto('/payment-posting', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('div.fixed.inset-0.z-9999')).toHaveCount(0, { timeout: 30_000 });
}

test.describe('Payment Posting', () => {
  test('each row has an "Open loan <ref>" button, not a "Remove" trash icon, and it opens the loan', async ({ page, backend }) => {
    await openPaymentPosting(page, backend);

    const open = page.getByRole('button', { name: 'Open loan E2E-8801', exact: true });
    await expect(open).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Remove', { exact: true })).toHaveCount(0);
    await expect(page.getByText('1–2 of 2 loans', { exact: true })).toBeVisible();

    await open.click();
    await expect(page).toHaveURL(/\/payment-posting\/8801$/, { timeout: 30_000 });
  });

  test('a closed loan does not open: the toast says so and the list stays', async ({ page, backend }) => {
    await openPaymentPosting(page, backend);

    await page.getByRole('button', { name: 'Open loan E2E-8802', exact: true }).click();
    await expect(page.getByText('This loan has already been closed!')).toBeVisible();
    await expect(page).toHaveURL(/\/payment-posting$/);
  });

  test('at 360px the Open button is 48px and its icon is drawn at full size', async ({ page, backend }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openPaymentPosting(page, backend);

    const open = page.getByRole('button', { name: 'Open loan E2E-8801', exact: true });
    const box = (await open.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(48);
    expect(box.width).toBeGreaterThanOrEqual(48);
    const icon = (await open.locator('svg').boundingBox())!;
    expect(icon.width).toBeGreaterThanOrEqual(18);
  });
});

test.describe('pointer and hover', () => {
  test('rows that open nothing (Borrowers, for now) get no pointer and no hover tint; rows that open (Payment Posting) get both', async ({ page, backend }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openBorrowers(page, backend);
    const still = page.locator('.rdt_TableRow').first();
    await still.hover();
    expect(await still.evaluate((row) => [getComputedStyle(row).cursor, getComputedStyle(row).backgroundColor])).toEqual(['default', 'rgb(255, 255, 255)']);

    await openPaymentPosting(page, backend);
    const opens = page.locator('.rdt_TableRow').first();
    await opens.hover();
    // The tint fades in (a background transition): read it once it has settled.
    await expect.poll(() => opens.evaluate((row) => [getComputedStyle(row).cursor, getComputedStyle(row).backgroundColor])).toEqual(['pointer', 'rgb(246, 241, 231)']);
  });
});
