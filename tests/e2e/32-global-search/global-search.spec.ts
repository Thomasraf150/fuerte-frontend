/**
 * The top bar's universal search (UI modernisation B, Phase 5): the box from lg, the magnifier link
 * on phones, the /search page's three groups, where each row opens, the voucher group left out for
 * roles that do not see vouchers, a refused search shown as a sentence (not a toast), and none of
 * it for Call Center.
 *
 * NO CREDENTIALS AND NO BACKEND: borrowerFormHarness's FakeBackend answers every request; the
 * people are fictional.
 */
import type { Page } from '@playwright/test';
import { test, expect, signedInAs, FakeBackend } from '../26-new-application/borrowerFormHarness';

const APP = 'http://localhost:3000';

const RESULT = {
  term: 'reyes',
  vouchers_included: true,
  borrowers: [{ id: '7001', title: 'REYES, ANA S.', detail: 'E2E Sub-branch A · Chief E2E Chief One', kind: 'borrower' }],
  loans: [{ id: '6101', title: 'MA-0511', detail: 'REYES, ANA S.', kind: 'loan' }],
  vouchers: [{ id: '501', title: 'Check Voucher CV-0012', detail: 'E2E Hardware · MA-0511 · 2026-10-01', kind: 'cv' }],
};

function stubSearch(backend: FakeBackend, result: object | null, error?: string): void {
  backend.extraGraphql.set('globalSearch', (variables) =>
    error
      ? { errors: [{ message: error }] }
      : { data: { globalSearch: { ...(result as object), term: String(variables.term) } } });
}

async function settle(page: Page): Promise<void> {
  await expect(page.locator('div.fixed.inset-0.z-9999')).toHaveCount(0, { timeout: 30_000 });
}

test('desktop: the top-bar box takes a term to /search, which lists the three groups with links to each record', async ({ page, backend }) => {
  stubSearch(backend, RESULT);
  await page.setViewportSize({ width: 1280, height: 900 });
  await signedInAs(page, backend, [9101]);
  await page.goto('/search', { waitUntil: 'domcontentloaded' });
  await settle(page);

  const box = page.getByRole('searchbox', { name: 'Search borrowers, loans and vouchers' }).first();
  await box.fill('reyes');
  await box.press('Enter');

  await expect(page).toHaveURL(`${APP}/search?q=reyes`, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: 'Borrowers' })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('link', { name: /^REYES, ANA S\./ })).toHaveAttribute('href', '/borrowers/7001');
  await expect(page.getByRole('link', { name: /^MA-0511/ })).toHaveAttribute('href', '/loans-list/6101');
  await expect(page.getByRole('link', { name: /^Check Voucher CV-0012/ })).toHaveAttribute('href', '/accounting/general-voucher/501?type=cv');
  expect(backend.calls('globalSearch').at(-1)?.variables).toEqual({ term: 'reyes' });
});

test('a role without vouchers gets no Vouchers group; an empty group says so in words', async ({ page, backend }) => {
  stubSearch(backend, { ...RESULT, vouchers_included: false, vouchers: [], loans: [] });
  await signedInAs(page, backend, [9101]);
  await page.goto('/search?q=reyes', { waitUntil: 'domcontentloaded' });
  await settle(page);

  await expect(page.getByRole('heading', { name: 'Borrowers' })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('No loans found.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Vouchers' })).toHaveCount(0);
});

test('one letter asks for more and searches nothing', async ({ page, backend }) => {
  stubSearch(backend, RESULT);
  await signedInAs(page, backend, [9101]);
  await page.goto('/search?q=r', { waitUntil: 'domcontentloaded' });
  await settle(page);

  await expect(page.getByText('Type at least 2 letters or numbers, then press Search.')).toBeVisible({ timeout: 30_000 });
  expect(backend.calls('globalSearch')).toHaveLength(0);
});

test('a refused search shows the sentence on the page, with Retry', async ({ page, backend }) => {
  stubSearch(backend, null, 'Search is not available right now. Please try again.');
  await signedInAs(page, backend, [9101]);
  await page.goto('/search?q=reyes', { waitUntil: 'domcontentloaded' });
  await settle(page);

  await expect(page.getByRole('alert').filter({ hasText: 'Search is not' })).toContainText('Search is not available right now. Please try again.', { timeout: 30_000 });
  stubSearch(backend, RESULT);
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByRole('heading', { name: 'Borrowers' })).toBeVisible({ timeout: 30_000 });
});

test('phones: no box in the top bar, a named magnifier link to /search instead', async ({ page, backend }) => {
  stubSearch(backend, RESULT);
  await page.setViewportSize({ width: 360, height: 800 });
  await signedInAs(page, backend, [9101]);
  await page.goto('/search', { waitUntil: 'domcontentloaded' });
  await settle(page);

  await expect(page.locator('#global-search')).toBeHidden();
  const link = page.getByRole('link', { name: 'Search', exact: true });
  await expect(link).toBeVisible({ timeout: 30_000 });
  await expect(link).toHaveAttribute('href', '/search');
  const box = (await link.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(40);
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(scroll).toBeLessThanOrEqual(0);
});
