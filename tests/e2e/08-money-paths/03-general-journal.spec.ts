/**
 * Phase A.3 — General Journal Entry
 *
 * General Journal entries reuse createGvEntry with journal_name =
 * "Journal Voucher" — the AcctgEntry model boot stamps journal_type
 * = 'jv_entry' so list filtering separates them from check vouchers.
 *
 * Verifies:
 *   1. Mutation succeeds for a balanced 3-line debit/credit entry
 *   2. The entry is reachable via getJournal (not getCheckVoucher)
 *   3. GL totals balance
 */

import { test, expect } from '@playwright/test';
import {
  makeMarker,
  restLogin,
  gqlAs,
  cleanupJournalsByMarker,
  readGlBalance,
} from '../../helpers/e2e-helpers';

const ADMIN = { email: 'test.admin@fuerte.test', password: 'TestPass2026!' };

test.describe('Money path: General Journal entry', () => {
  test.setTimeout(90_000);

  test('Admin posts a balanced 3-line journal entry; GL balanced and discoverable in journal list', async ({ request }) => {
    const marker = makeMarker('JV');
    try {
      const admin = await restLogin(request, ADMIN.email, ADMIN.password);
      const token = admin.token;
      const userId = String(admin.user.id);

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
      expect(accounts.length, 'need at least 3 active accounts').toBeGreaterThanOrEqual(3);
      const [a, b, c] = accounts;

      const today = new Date().toISOString().slice(0, 10);
      const journalDesc = `${marker} journal test`;

      // 3-line entry: 600 debit to A; 400 credit to B; 200 credit to C.
      // Total debit (600) === total credit (600) — server enforces this.
      const resp = await gqlAs(
        request,
        token,
        `mutation CreateGvEntry($input: CvAcctgEntriesInp) {
           createGvEntry(input: $input) { status message }
         }`,
        {
          input: {
            journal_name: 'Journal Voucher',
            journal_date: today,
            journal_desc: journalDesc,
            amount: '600.00',
            user_id: userId,
            acctg_details: [
              { acctnumber: a.number, accountLabel: a.account_name, debit: '600.00', credit: '0.00' },
              { acctnumber: b.number, accountLabel: b.account_name, debit: '0.00', credit: '400.00' },
              { acctnumber: c.number, accountLabel: c.account_name, debit: '0.00', credit: '200.00' },
            ],
          },
        },
      );
      expect(resp?.data?.createGvEntry?.status, `JV create failed: ${JSON.stringify(resp)}`).toBeTruthy();

      // The entry must show up in getJournal (jv_entry filter), NOT
      // mixed in with check vouchers.
      const journals = await gqlAs(
        request,
        token,
        `query { getJournal(first: 10, page: 1, orderBy: [{column: "id", order: DESC}]) {
           data { id journal_name journal_ref journal_desc }
         } }`,
      );
      const matched = (journals?.data?.getJournal?.data ?? []).filter((r: any) =>
        String(r?.journal_desc ?? '').startsWith(marker),
      );
      expect(matched.length, 'new journal entry must appear in getJournal').toBeGreaterThan(0);
      const newest = matched[0];
      expect(newest.journal_ref).toBeTruthy();
      console.log(`   ↳ JV entry ${newest.id} created, ref=${newest.journal_ref}`);

      const balance = readGlBalance(newest.journal_ref);
      console.log(`   ↳ GL totals:`, balance);
      expect(balance.rows).toBeGreaterThanOrEqual(3);
      expect(Number(balance.total_debit).toFixed(2)).toBe(Number(balance.total_credit).toFixed(2));
      expect(Number(balance.total_debit).toFixed(2)).toBe('600.00');

      console.log(`   ✓ 3-line journal entry posts balanced double-entry`);
    } finally {
      const cleaned = cleanupJournalsByMarker(marker);
      console.log(`   ↳ cleanup soft-deleted ${cleaned} journal entry(s)`);
    }
  });
});
