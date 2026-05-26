/**
 * Phase A.5 — Check Voucher Creation
 *
 * Creates a Check Voucher via the createGvEntry mutation and verifies:
 *   1. The mutation returns success
 *   2. A new acctg_entries row exists with journal_name = "Check Voucher"
 *   3. The acctg_details rows balance (debit total === credit total)
 *
 * Marker-based cleanup soft-deletes the test voucher at the end.
 */

import { test, expect } from '@playwright/test';
import {
  makeMarker,
  restLogin,
  gqlAs,
  cleanupVouchersByMarker,
  readGlBalance,
} from '../../helpers/e2e-helpers';

const ADMIN = { email: 'test.admin@fuerte.test', password: 'TestPass2026!' };

test.describe('Money path: Check Voucher creation', () => {
  test.setTimeout(90_000);

  test('Owner/Admin creates a balanced check voucher; GL entry verified', async ({ request }) => {
    const marker = makeMarker('CV');
    try {
      const admin = await restLogin(request, ADMIN.email, ADMIN.password);
      const token = admin.token;
      const userId = String(admin.user.id);

      // Find two real, active account numbers to use for the dummy
      // double-entry. The COA query returns a nested tree — flatten it
      // and pick any two active leaves so the form's double-entry
      // validator passes.
      const coa = await gqlAs(
        request,
        token,
        `query { getChartOfAccounts { id number account_name is_active subAccounts { id number account_name is_active subAccounts { id number account_name is_active } } } }`,
      );
      const flatten = (nodes: any[]): any[] => {
        const out: any[] = [];
        for (const n of nodes ?? []) {
          if (n?.is_active) out.push(n);
          if (Array.isArray(n?.subAccounts)) out.push(...flatten(n.subAccounts));
        }
        return out;
      };
      const accounts = flatten(coa?.data?.getChartOfAccounts ?? []);
      expect(accounts.length, 'need at least 2 active accounts in COA').toBeGreaterThanOrEqual(2);
      const accountA = accounts[0];
      const accountB = accounts[1];

      const today = new Date().toISOString().slice(0, 10);
      const journalDesc = `${marker} voucher test`;
      const amount = '500.00';

      const mutation = `
        mutation CreateGvEntry($input: CvAcctgEntriesInp) {
          createGvEntry(input: $input) { status message }
        }`;
      const variables = {
        input: {
          journal_name: 'Check Voucher',
          journal_date: today,
          journal_desc: journalDesc,
          check_no: 'E2E-' + Date.now().toString().slice(-6),
          amount: amount,
          user_id: userId,
          acctg_details: [
            { acctnumber: accountA.number, accountLabel: accountA.account_name, debit: amount, credit: '0.00' },
            { acctnumber: accountB.number, accountLabel: accountB.account_name, debit: '0.00', credit: amount },
          ],
        },
      };

      const resp = await gqlAs(request, token, mutation, variables);
      expect(
        resp?.data?.createGvEntry?.status,
        `voucher create failed: ${JSON.stringify(resp)}`,
      ).toBeTruthy();

      // Find the new entry by its unique journal_desc, then assert balance.
      const lookup = await gqlAs(
        request,
        token,
        `query { getCheckVoucher(orderBy: [{column: "id", order: DESC}], first: 5, page: 1) {
           data { id journal_name journal_ref journal_desc }
         } }`,
      );
      const rows = (lookup?.data?.getCheckVoucher?.data ?? []).filter((r: any) =>
        String(r?.journal_desc ?? '').startsWith(marker),
      );
      expect(rows.length, 'newly created voucher must surface in getCheckVoucher').toBeGreaterThan(0);
      const newest = rows[0];
      expect(newest.journal_name).toBe('Check Voucher');
      expect(newest.journal_ref).toBeTruthy();
      console.log(`   ↳ voucher ${newest.id} created, ref=${newest.journal_ref}`);

      const balance = readGlBalance(newest.journal_ref);
      console.log(`   ↳ GL totals:`, balance);
      expect(balance.rows, 'voucher must have GL detail rows').toBeGreaterThan(0);
      expect(Number(balance.total_debit).toFixed(2)).toBe(Number(balance.total_credit).toFixed(2));

      console.log(`   ✓ check voucher posts balanced double-entry`);
    } finally {
      const cleaned = cleanupVouchersByMarker(marker);
      console.log(`   ↳ cleanup soft-deleted ${cleaned} voucher(s)`);
    }
  });
});
