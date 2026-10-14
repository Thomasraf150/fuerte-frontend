/**
 * Payment Posting's schedule after a payment (FB Balibago, 2026-10-14): "hindi natatanggal yung
 * amortization kahit paid na" -- a paid instalment showed what was PAID in its Amortization column
 * (5,030.00), not the 0.00 left, and one paid through Other Payments → Advanced Payment read
 * "₱0.00 paid" because only Collection lines were counted. Now:
 *   - a paid row's Amortization and Interest read 0.00 / 0.00 (what is still due, as the server says);
 *   - its badge line says what the payments settled (the server's paid_amount), Advanced Payment included;
 *   - "collected" adds those up.
 * The loan mirrors FB BAL-00001343: 8 instalments of 5,030.00, the 15th's paid early by Advanced
 * Payment (a Collection line of 0.00 beside it), the 30th's by Collection. Fictional names.
 *
 * NO CREDENTIALS AND NO BACKEND: tests/e2e/26-new-application/borrowerFormHarness.ts (fake token,
 * every GraphQL answer stubbed). The clock is Manila 2026-10-14, so Oct 30 is "next due".
 */
import type { Locator, Page } from '@playwright/test';
import { test, expect, signedInAs, BRANCH_SUBS } from '../26-new-application/borrowerFormHarness';

const LOAN_ID = '91343';

const collection = (amount: string, on: string) => ({ description: 'Collection', amount, trans_date: on });
const advance = (amount: string, on: string) => ({ description: 'Advanced Payment', amount, trans_date: on });
const interest = (amount: string, on: string) => ({ description: 'UDI', amount, trans_date: on });

/** One instalment as getLoanSchedule answers since 2026-10-14: amount = what is left, paid_amount = what was settled. */
const instalment = (n: number, due: string, left: string, paid: string, payments: object[]) => ({
  id: String(700 + n), loan_id: LOAN_ID, due_date: due, amount: left, paid_amount: paid, loan_payments: payments,
});

const SCHEDULE = [
  instalment(1, '2026-09-15', '0.00', '5030.00', [collection('0.00', '2026-09-14'), advance('5030.00', '2026-09-14'), interest('900.00', '2026-09-14')]),
  instalment(2, '2026-09-30', '0.00', '5030.00', [collection('5030.00', '2026-09-30'), interest('900.00', '2026-09-30')]),
  instalment(3, '2026-10-15', '0.00', '5030.00', [collection('0.00', '2026-10-13'), advance('5030.00', '2026-10-13'), interest('900.00', '2026-10-13')]),
  instalment(4, '2026-10-30', '5030.00', '0.00', []),
  instalment(5, '2026-11-15', '5030.00', '0.00', []),
  instalment(6, '2026-11-30', '5030.00', '0.00', []),
  instalment(7, '2026-12-15', '5030.00', '0.00', []),
  instalment(8, '2026-12-30', '5030.00', '0.00', []),
];

const LOAN = {
  id: LOAN_ID, loan_ref: 'FB BAL-E2E1343', loan_proceeds: '21520.00', pn_amount: '40240.00', monthly: '10060.00', term: '4',
  status: '3', pn_balance: '25150.00', udi_balance: '4500.00', created_at: '2026-08-28 09:55:10', approved_date: '2026-08-28',
  released_date: '2026-08-30', is_pn_signed: 1, bank_id: null, check_no: null,
  loan_product: { id: '61', description: 'E2E PRODUCT 4MONTHS', terms: '4', interest_rate: '18', udi: '7200', processing: '0', agent_fee: '0', insurance: '0', commission: '0', collection: '0', notarial: '0' },
  loan_details: [],
  borrower: { id: '4801', firstname: 'ANA', middlename: 'E2E', lastname: 'FICTIONAL' },
  loan_bank_details: null,
  loan_schedules: SCHEDULE,
  // The server zeroes the interest of a fully paid instalment.
  loan_udi_schedules: SCHEDULE.map((row) => ({ id: `u${row.id}`, loan_id: LOAN_ID, due_date: row.due_date, amount: row.amount === '0.00' ? '0.00' : '900.00' })),
};

/** One schedule row on screen, by its due date. */
const row = (page: Page, due: string): Locator => page.locator('div.relative.grid').filter({ hasText: due });
/** Its Amortization and Interest cells' text. */
const cells = async (r: Locator): Promise<[string, string]> => {
  const amort = (await r.locator(':scope > div').nth(1).innerText()).trim();
  const interestCell = (await r.locator(':scope > div').nth(2).innerText()).trim();
  return [amort, interestCell];
};

test.describe('Payment Posting: a paid instalment', () => {
  // The dev server compiles the route on its first visit.
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(async ({ page, backend }) => {
    await page.clock.setFixedTime(new Date('2026-10-14T10:00:00+08:00'));
    await signedInAs(page, backend, [Number(BRANCH_SUBS[0].id)]);
    backend.extraGraphql.set('getLoanSchedule', () => ({ data: { getLoanSchedule: LOAN } }));
    backend.extraGraphql.set('getLoanListPymntPosting', () => ({
      data: { getLoanListPymntPosting: { data: [], paginatorInfo: { total: 0, currentPage: 1, lastPage: 1, hasMorePages: false, count: 0, perPage: 10, firstItem: null, lastItem: null } } },
    }));
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto(`/payment-posting/${LOAN_ID}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await expect(row(page, '2026-09-15')).toBeVisible({ timeout: 90_000 });
  });

  test('reads 0.00 / 0.00, and says what was paid -- an Advanced Payment included', async ({ page }) => {
    await page.screenshot({ path: 'test-results/42-payment-schedule-paid.png', fullPage: true });

    for (const [due, paidOn] of [['2026-09-15', 'Sep 14, 2026'], ['2026-09-30', 'Sep 30, 2026'], ['2026-10-15', 'Oct 13, 2026']] as const) {
      const r = row(page, due);
      await expect(r.getByText('Paid', { exact: true }), due).toBeVisible();
      await expect(r.getByText(`₱5,030.00 paid · ${paidOn}`), due).toBeVisible();
      expect(await cells(r), `${due}: what is left, as before 2026-10-10`).toEqual(['0.00', '0.00']);
      await expect(r.getByRole('button', { name: 'Proceed to Pay', exact: true }), `${due}: nothing left to pay`).toHaveCount(0);
    }

    const next = row(page, '2026-10-30');
    await expect(next.getByText('Next due', { exact: true })).toBeVisible();
    expect(await cells(next)).toEqual(['5,030.00', '900.00']);

    // The summary adds up every settling payment: 3 × 5,030.00, not the Collection-only 5,030.00.
    await expect(page.getByText('3 of 8 paid', { exact: true })).toBeVisible();
    await expect(page.getByText('₱15,090.00 collected', { exact: true })).toBeVisible();
    await expect(page.getByText(/Next due\s+Oct 30, 2026/)).toBeVisible();
  });
});
