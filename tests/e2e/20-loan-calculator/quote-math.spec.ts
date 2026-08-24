/**
 * Differential tests for loanQuote.ts — pure money math, no browser.
 *
 * WHY THIS FILE EXISTS
 * The loan calculator shows a borrower an amortization schedule for a loan that
 * does not exist yet. The server cannot produce it (due dates are generated on
 * the client and posted to the server as `selectedDate`), so the per-installment
 * split is the ONE backend formula reproduced in TypeScript.
 *
 * Reproduced logic lives in `saveLoanSchedule`
 * (fuerte-backend/app/GraphQL/Mutations/Loans/LoanMutation.php, search `$perMonthPn`):
 *     $per  = bcdiv($total, (string)$count, 2);              // TRUNCATES
 *     $last = bcsub($total, bcmul($per, $count - 1, 2), 2);  // absorbs remainder
 *
 * The EXPECTED values below are not hand-derived — they were produced by running
 * that exact bcmath sequence inside the running PHP container (`fuerte-app-1`,
 * PHP 8.1) on 2026-08-23. If a change to loanQuote.ts breaks these, the
 * calculator has started quoting a different installment than the schedule the
 * backend will actually write.
 *
 * To regenerate the reference vectors:
 *   docker exec -i fuerte-app-1 php <<'PHP'
 *   <?php $per = bcdiv($total, (string)$n, 2);
 *         $last = bcsub($total, bcmul($per, (string)($n-1), 2), 2); ...
 *   PHP
 */

import { test, expect } from '@playwright/test';
import { branchSubIdForCompute, deriveInstallments, totalPayable, sanitizeAmount } from '../../../src/utils/loanQuote';
import type { ComputeResponse } from '../../../src/utils/loanQuote';

/** Verbatim output of PHP bcmath in fuerte-app-1 — see file header. */
const PHP_BCMATH_VECTORS = [
  { total: '250000.00', n: 24, per: '10416.66', last: '10416.82' },
  { total: '50000.00', n: 4, per: '12500.00', last: '12500.00' },
  { total: '100000.00', n: 3, per: '33333.33', last: '33333.34' },
  { total: '33333.33', n: 7, per: '4761.90', last: '4761.93' },
  { total: '120000.00', n: 48, per: '2500.00', last: '2500.00' },
  { total: '1.00', n: 3, per: '0.33', last: '0.34' },
  { total: '99999.99', n: 13, per: '7692.30', last: '7692.39' },
  { total: '250000.00', n: 60, per: '4166.66', last: '4167.06' },
  { total: '75000.00', n: 5, per: '15000.00', last: '15000.00' },
  { total: '0.01', n: 2, per: '0.00', last: '0.01' },
  { total: '1000000.00', n: 36, per: '27777.77', last: '27778.05' },
  { total: '12345.67', n: 11, per: '1122.33', last: '1122.37' },
] as const;

test.describe('deriveInstallments matches PHP bcmath exactly', () => {
  for (const v of PHP_BCMATH_VECTORS) {
    test(`${v.total} over ${v.n} installments -> ${v.per} x ${v.n - 1}, last ${v.last}`, () => {
      const rows = deriveInstallments(v.total, v.n);

      expect(rows).toHaveLength(v.n);
      // Every row but the last is the TRUNCATED quotient.
      for (let i = 0; i < v.n - 1; i++) {
        expect(rows[i]).toBe(v.per);
      }
      // The last row absorbs the cent remainder.
      expect(rows[v.n - 1]).toBe(v.last);
    });
  }

  for (const v of PHP_BCMATH_VECTORS) {
    test(`${v.total} over ${v.n} sums back to the exact total`, () => {
      const rows = deriveInstallments(v.total, v.n);
      // Sum in centavos as integers so the assertion itself cannot drift.
      const centavos = rows.reduce((acc, r) => acc + Math.round(parseFloat(r) * 100), 0);
      expect(centavos).toBe(Math.round(parseFloat(v.total) * 100));
    });
  }
});

test.describe('deriveInstallments truncates, never rounds', () => {
  test('rounds DOWN where ROUND_HALF_UP would round up', () => {
    // 100.00 / 8 = 12.50 exactly -> no truncation visible.
    // 0.05 / 3  = 0.01666... -> bcdiv gives 0.01, half-up would give 0.02.
    const rows = deriveInstallments('0.05', 3);
    expect(rows[0]).toBe('0.01');
    expect(rows[1]).toBe('0.01');
    expect(rows[2]).toBe('0.03');
  });

  test('a single installment is the whole total', () => {
    expect(deriveInstallments('12345.67', 1)).toEqual(['12345.67']);
  });

  test('a non-positive count yields no rows rather than throwing', () => {
    expect(deriveInstallments('1000.00', 0)).toEqual([]);
    expect(deriveInstallments('1000.00', -3)).toEqual([]);
    expect(deriveInstallments('1000.00', NaN)).toEqual([]);
  });
});

test.describe('totalPayable includes the add-on', () => {
  const base = (over: Partial<ComputeResponse>): ComputeResponse =>
    ({
      deductions: null, deduction_rate: null, total_deductions: null,
      loan_proceeds: null, terms: null, pn: null, monthly_amort: null,
      ob: null, rebates: null, penalty: null, addon_terms: null,
      addon_udi_rate: null, addon_amount: null, addon_udi: null,
      addon_total: null, new_loan_proceeds: null, success: null,
      loan_id: null, message: null, ...over,
    }) as ComputeResponse;

  test('pn + addon_amount, matching saveLoanSchedule $pnTotal', () => {
    expect(totalPayable(base({ pn: '250000.00', addon_amount: '150000.00' }))).toBe('400000.00');
  });

  test('a product with no add-on is just pn', () => {
    expect(totalPayable(base({ pn: '50000.00', addon_amount: '0.00' }))).toBe('50000.00');
  });

  test('null add-on is treated as zero, not NaN', () => {
    expect(totalPayable(base({ pn: '50000.00', addon_amount: null }))).toBe('50000.00');
  });

  test('differs from monthly_amort, which is why monthly_amort is never shown', () => {
    // Product 8-shaped: 60 terms, 36 addon months, twice-a-month cadence.
    const comp = base({ pn: '250000.00', addon_amount: '150000.00', monthly_amort: '4166.66' });
    const real = deriveInstallments(totalPayable(comp), (60 + 36) * 2);
    // monthly_amort would quote 4,166.66; the borrower actually pays ~2,083.
    expect(parseFloat(real[0])).toBeLessThan(parseFloat(comp.monthly_amort as string));
    expect(real).toHaveLength(192);
  });
});

/**
 * Pinned against a REAL Compute response, captured live on 2026-08-23 from
 * loan product 8 ("NEW LOAN - MANILA TEACHER 60 MOS.": 60 terms, 36 add-on
 * months, udi 42%, base_deduction 1) at loan_amount 250,000:
 *
 *   pn = 250000.00   addon_amount = 149999.76   monthly_amort = 4166.66
 *
 * The `per`/`last` expectations below came from running the backend's own
 * bcmath sequence inside fuerte-app-1 on that response.
 */
test.describe('live product 8 — monthly_amort vs the real installment', () => {
  const PN = '250000.00';
  const ADDON_AMOUNT = '149999.76';
  const MONTHLY_AMORT = '4166.66'; // what Compute returns
  const TOTAL_PAYABLE = '399999.76';

  test('total payable folds in the add-on', () => {
    const sum = Math.round(parseFloat(PN) * 100) + Math.round(parseFloat(ADDON_AMOUNT) * 100);
    expect(sum).toBe(Math.round(parseFloat(TOTAL_PAYABLE) * 100));
  });

  test('once a month over 96 dates matches PHP bcmath', () => {
    const rows = deriveInstallments(TOTAL_PAYABLE, 96);
    expect(rows[0]).toBe('4166.66');
    expect(rows[95]).toBe('4167.06');
  });

  test('twice a month over 192 dates is HALF of monthly_amort', () => {
    const rows = deriveInstallments(TOTAL_PAYABLE, 192);
    expect(rows[0]).toBe('2083.33');
    expect(rows[191]).toBe('2083.73');
    // The exact trap this module exists to avoid: quoting 4,166.66 to a
    // borrower whose real payment is 2,083.33.
    expect(parseFloat(MONTHLY_AMORT) / parseFloat(rows[0])).toBeCloseTo(2, 2);
  });
});

test.describe('sanitizeAmount is the only guard on an unvalidated GraphQL String', () => {
  test('strips grouping commas that PHP would truncate the value at', () => {
    // (float)"50,000.00" === 50.0 in PHP 8 with only an E_WARNING.
    expect(sanitizeAmount('50,000.00')).toBe('50000.00');
  });

  test('accepts plain decimals and integers', () => {
    expect(sanitizeAmount('50000')).toBe('50000');
    expect(sanitizeAmount('50000.50')).toBe('50000.50');
  });

  test('rejects non-numeric, zero, and negative input', () => {
    expect(sanitizeAmount('abc')).toBe('');
    expect(sanitizeAmount('50000abc')).toBe('');
    expect(sanitizeAmount('-5000')).toBe('');
    expect(sanitizeAmount('0')).toBe('');
    expect(sanitizeAmount('')).toBe('');
    expect(sanitizeAmount(null)).toBe('');
    expect(sanitizeAmount(undefined)).toBe('');
  });
});

/**
 * Regression guard for a real production-shaped failure.
 *
 * Laravel's ConvertEmptyStringsToNull middleware (backend Http/Kernel.php:23)
 * rewrites "" to null before Lighthouse validates variables. Because
 * `branch_sub_id` is `String!`, sending an empty string fails with:
 *   Variable "$input" got invalid value null at "input.branch_sub_id"
 *
 * OWNER users have branch_sub_id = null in the database, so a `?? ''` fallback
 * broke the calculator for every Owner. Reproduced against the live API on
 * 2026-08-24: "" -> that exact error; "0" -> a valid quote.
 */
test.describe('branchSubIdForCompute never emits an empty string', () => {
  test('null and undefined become "0", not ""', () => {
    expect(branchSubIdForCompute(null)).toBe('0');
    expect(branchSubIdForCompute(undefined)).toBe('0');
  });

  test('an empty or whitespace string becomes "0"', () => {
    expect(branchSubIdForCompute('')).toBe('0');
    expect(branchSubIdForCompute('   ')).toBe('0');
  });

  test('a real branch id is preserved', () => {
    expect(branchSubIdForCompute(1)).toBe('1');
    expect(branchSubIdForCompute('57')).toBe('57');
  });

  test('no input shape can ever produce an empty string', () => {
    for (const input of [null, undefined, '', '  ', 0, 1, '9', 'x']) {
      expect(branchSubIdForCompute(input)).not.toBe('');
    }
  });
});
