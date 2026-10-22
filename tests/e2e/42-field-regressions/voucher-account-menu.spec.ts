/**
 * Voucher Details' Account Title menu (Marikina, 2026-10-21): "sa account title po ang hrap po
 * hnapin ng ieentry.. nawala po ung arrow pbaba" -- "nandyan pa din po di lang mascroll pbaba".
 * The account table sits in an `overflow-x-auto` wrapper, and a box that scrolls on one axis
 * clips on both, so the dropdown opened INSIDE the table's height: two options showed, the rest
 * hid behind a second, table-sized scrollbar. Now the menu renders outside the table and shows
 * its full list, and the wrapper never grows a vertical scrollbar.
 *
 * Every voucher-entry form with an Account Title row is covered: Check Voucher, Journal Voucher,
 * General Journal, Cash Receipt and Disbursement Journals, Adjusting Entries.
 *
 * NO CREDENTIALS AND NO BACKEND: tests/e2e/39-edit-prefill/harness.ts (fake Owner token, every
 * GraphQL answer stubbed). The chart of accounts is fictional.
 */
import type { Locator, Page } from '@playwright/test';
import { test, expect, APP, paginated } from '../39-edit-prefill/harness';

const account = (id: number, number: string, name: string, subAccounts: object[] = []) => ({
  id: String(id), user_id: '1', branch_sub_id: null, account_name: name, number, description: '',
  balance: '0.00', is_debit: 1, is_active: 1, parent_account_id: null, branch_sub: null, subAccounts,
});

const RENT_BRANCHES = ['FB Subic 1', 'FB Subic 2', 'FB MB 1', 'FB MB 2', 'FB Balibago', 'FB Marikina', 'FB Olongapo', 'FB Angeles'];

/** More matches for "rent e" than the menu's own height holds, so the list has to scroll. */
const CHART = [
  account(1, '01', 'Assets', [account(2, '0101', 'Cash in Bank')]),
  account(3, '06', 'Expenses', [
    account(4, '0601', 'Rent Expense', RENT_BRANCHES.map((b, i) => account(10 + i, `06010${i + 1}`, `Rent Expense - ${b}`))),
    account(5, '0602', 'Salaries Expense'),
  ]),
];

const VOUCHER_FORMS = [
  { name: 'Check Voucher', path: '/accounting/general-voucher', open: 'New CV' },
  { name: 'Journal Voucher', path: '/accounting/general-voucher', open: 'New JV' },
  { name: 'Adjusting Entries', path: '/accounting/adjusting-entries', open: 'New Adjusting Entry' },
] as const;

/** True when the centre of `target` is what a click there would land on: on screen, not clipped, not covered. */
const reachable = (target: Locator) =>
  target.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!hit && el.contains(hit);
  });

/** True when the top, middle and bottom of `target` all receive clicks: nothing clips or covers it. */
const unclipped = (target: Locator) =>
  target.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.height > 250 && [r.top + 4, r.top + r.height / 2, r.bottom - 4].every((y) => {
      const hit = document.elementFromPoint(r.left + r.width / 2, y);
      return !!hit && el.contains(hit);
    });
  });

/** The Account Title combobox on a Voucher Details row. */
const accountTitle = (page: Page, row = 0) => page.locator('table').first().locator('.react-select__control').nth(row);

/** Every field the voucher pages ask for on load, answered with fictional or empty data. */
const stubVoucherPages = (answers: Map<string, (v: Record<string, unknown>) => unknown>) => {
  answers.set('getChartOfAccounts', () => CHART);
  for (const list of ['getVendors', 'getBranch', 'getBranchGroups', 'getAllBranch', 'getMyAccessibleBranchSubs']) {
    answers.set(list, () => []);
  }
  for (const list of ['getCheckVoucher', 'getJournal', 'getAdjustingEntries']) answers.set(list, () => paginated([]));
};

/** Opens a form, focuses a row's Account Title and searches it. */
async function search(page: Page, path: string, open: string, text = 'rent e'): Promise<Locator> {
  await page.goto(`${APP}${path}`);
  await page.getByRole('button', { name: open }).click();
  const control = accountTitle(page);
  await expect(control).toBeVisible({ timeout: 30_000 });
  await control.click();
  await page.keyboard.type(text);
  await expect(page.locator('.react-select__option').first()).toBeVisible();
  return control;
}

const options = (page: Page) => page.locator('.react-select__option');

test.describe('Voucher Details: the Account Title menu is not clipped by the table', () => {
  for (const form of VOUCHER_FORMS) {
    test(form.name, async ({ page, backend }) => {
      stubVoucherPages(backend.answers);
      const control = await search(page, form.path, form.open);

      // Before the fix one option showed; the menu's own height holds about six.
      const count = await options(page).count();
      expect(count, 'matches for "rent e"').toBeGreaterThanOrEqual(RENT_BRANCHES.length);
      for (let i = 0; i < 5; i++) {
        expect(await reachable(options(page).nth(i)), `option ${i + 1} can be clicked where it shows`).toBe(true);
      }

      // The table wrapper must not turn into a second, vertical scroll box while the menu is open.
      const wrapper = page.locator('table').first().locator('xpath=..');
      expect(await wrapper.evaluate((el) => el.scrollHeight > el.clientHeight + 1), 'table wrapper scrolls vertically').toBe(false);

      // The mouse wheel scrolls the MENU down to the last match, and choosing it fills the row.
      const list = page.locator('.react-select__menu-list');
      await list.hover();
      await page.mouse.wheel(0, 1000);
      await expect.poll(() => list.evaluate((el) => el.scrollTop), { message: 'menu scrolled by the wheel' }).toBeGreaterThan(0);
      const last = options(page).nth(count - 1);
      expect(await reachable(last), 'last option reachable after scrolling the menu').toBe(true);
      await last.click();
      await expect(control).toContainText(`Rent Expense - ${RENT_BRANCHES[RENT_BRANCHES.length - 1]}`);
    });
  }

  // These three open only on a saved entry's page; the Account Title stays editable there.
  const ENTRY = {
    id: '9901', journal_name: 'E2E Journal', journal_ref: 'E2E-0001', journal_date: '2026-10-21', journal_desc: 'E2E entry',
    check_no: '', display_check_no: '', vendor_id: null, vendor: null, borrower_full_name: null, is_cancelled: false,
    acctg_details: [
      { id: '1', acctnumber: '0101', account_name: 'Cash in Bank', debit: '', credit: '15000.00' },
      { id: '2', acctnumber: '0602', account_name: 'Salaries Expense', debit: '15000.00', credit: '' },
    ],
  };
  for (const saved of [
    { name: 'General Journal (saved entry)', path: '/accounting/general-journal/9901?date=2026-10-21&type=GJ' },
    { name: 'Cash Receipt Journal (saved entry)', path: '/accounting/crj/9901?date=2026-10-21' },
    { name: 'Cash Disbursement Journal (saved entry)', path: '/accounting/cdj/9901?date=2026-10-21' },
  ]) {
    test(saved.name, async ({ page, backend }) => {
      stubVoucherPages(backend.answers);
      backend.answers.set('getJournalEntryById', () => ENTRY);
      await page.goto(`${APP}${saved.path}`);
      const control = accountTitle(page, 1);
      await expect(control).toContainText('Salaries Expense', { timeout: 30_000 });
      await control.click();
      await page.keyboard.type('rent e');
      await expect(options(page).first()).toBeVisible();
      // The list opens scrolled to the row's saved value, so check the menu box itself, not the first options.
      expect(await unclipped(page.locator('.react-select__menu-list')), 'whole menu list on screen').toBe(true);
      await options(page).nth(3).click();
      await expect(control).toContainText('Rent Expense - FB MB 1');
    });
  }

  test('a row near the bottom of the screen opens its menu upward, full height', async ({ page, backend }) => {
    stubVoucherPages(backend.answers);
    await page.setViewportSize({ width: 1280, height: 640 });
    const control = await search(page, '/accounting/general-voucher', 'New CV');
    const field = (await control.boundingBox())!;
    const menu = (await page.locator('.react-select__menu').boundingBox())!;
    expect(menu.y + menu.height, 'menu sits above the field').toBeLessThanOrEqual(field.y + 1);
    expect(menu.y, 'menu top inside the viewport').toBeGreaterThanOrEqual(0);
    expect(menu.height, 'menu not squeezed').toBeGreaterThan(250);
    for (let i = 0; i < 4; i++) {
      expect(await reachable(options(page).nth(i)), `option ${i + 1} reachable`).toBe(true);
    }
  });

  test('a short screen keeps the whole menu on screen', async ({ page, backend }) => {
    // A 1366x768 laptop at 125% zoom leaves about this much page.
    stubVoucherPages(backend.answers);
    await page.setViewportSize({ width: 1280, height: 460 });
    const control = await search(page, '/accounting/general-voucher', 'New CV');
    await control.scrollIntoViewIfNeeded();
    const menu = (await page.locator('.react-select__menu').boundingBox())!;
    expect(menu.y, 'menu top inside the viewport').toBeGreaterThanOrEqual(0);
    expect(menu.y + menu.height, 'menu bottom inside the viewport').toBeLessThanOrEqual(460);
    for (let i = 0; i < 3; i++) {
      expect(await reachable(options(page).nth(i)), `option ${i + 1} reachable`).toBe(true);
    }
  });

  test('with room below, the menu opens downward', async ({ page, backend }) => {
    stubVoucherPages(backend.answers);
    await page.setViewportSize({ width: 1280, height: 1000 });
    const control = await search(page, '/accounting/general-voucher', 'New CV');
    const field = (await control.boundingBox())!;
    const menu = (await page.locator('.react-select__menu').boundingBox())!;
    expect(menu.y, 'menu sits below the field').toBeGreaterThanOrEqual(field.y + field.height - 1);
  });

  test('the menu stays attached to its field when the page scrolls', async ({ page, backend }) => {
    stubVoucherPages(backend.answers);
    await page.setViewportSize({ width: 1280, height: 900 });
    const control = await search(page, '/accounting/general-voucher', 'New CV');
    // The layout's own scroll box, not the window, is what scrolls.
    await control.evaluate((el) => {
      let p = el.parentElement;
      while (p && !(p.scrollHeight > p.clientHeight && /(auto|scroll)/.test(getComputedStyle(p).overflowY))) p = p.parentElement;
      (p ?? document.scrollingElement!).scrollBy(0, 60);
    });
    await page.waitForTimeout(300);
    const field = (await control.boundingBox())!;
    const menu = (await page.locator('.react-select__menu').boundingBox())!;
    const gap = menu.y >= field.y ? menu.y - (field.y + field.height) : field.y - (menu.y + menu.height);
    expect(Math.abs(gap), 'distance between field and menu').toBeLessThan(16);
    expect(Math.abs(menu.x - field.x), 'menu lined up with field').toBeLessThan(2);
  });

  test('a second row opens its own menu, and the keyboard picks an option', async ({ page, backend }) => {
    stubVoucherPages(backend.answers);
    const first = await search(page, '/accounting/general-voucher', 'New CV');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Add row' }).first().click();
    const second = accountTitle(page, 1);
    await second.click();
    await page.keyboard.type('rent e');
    await expect(page.locator('.react-select__menu')).toHaveCount(1);
    // The first match is already focused: three steps down is the fourth, FB MB 1.
    for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(second).toContainText('Rent Expense - FB MB 1');
    await expect(first).not.toContainText('Rent Expense -');
  });
});
