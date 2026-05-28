/**
 * Per-sub-branch voucher numbering
 *
 * Verifies the migration + AcctgEntry::boot() refactor that gives each
 * sub-branch its own independent voucher counter. Before this change,
 * concurrent encoders from different branches would interleave global
 * counter values (e.g. CHKV-0021197 for Subic, CHKV-0021198 for MB,
 * CHKV-0021199 for Subic). After: each branch advances independently
 * in a CHKV-{BRANCH}-{NNNNNNN}-{YY} namespace.
 *
 * Three assertions:
 *   1. Each user's voucher gets the correct branch-code prefix.
 *   2. Interleaving two branches in time still yields strictly
 *      sequential counters within each branch (no leakage).
 *   3. The journal_ref carries the user's branch_sub_id (resolution
 *      via authenticated user works end-to-end).
 *
 * Uses GraphQL directly — UI form has react-select pickers and
 * double-entry validation that add flakiness without exercising
 * the server-side numbering logic that's actually under test.
 */

import { test, expect } from '@playwright/test';
import {
  makeMarker,
  restLogin,
  gqlAs,
  cleanupVouchersByMarker,
  cleanupJournalsByMarker,
} from '../../helpers/e2e-helpers';

const USERS = {
  ma:   { email: 'test.admin@fuerte.test',         password: 'TestPass2026!', branchCode: 'MA',   bsubId: 1  },
  mb1:  { email: 'test.bradmin.mb@fuerte.test',    password: 'TestPass2026!', branchCode: 'MB1',  bsubId: 16 },
  fdbal:{ email: 'test.bradmin.fd@fuerte.test',    password: 'TestPass2026!', branchCode: 'FDBAL', bsubId: 82 },
} as const;

const CREATE_GV = `
  mutation CreateGvEntry($input: CvAcctgEntriesInp) {
    createGvEntry(input: $input) { status message }
  }`;

const LOOKUP_BY_DESC = `
  query Recent {
    getCheckVoucher(orderBy: [{column: "id", order: DESC}], first: 50, page: 1) {
      data { id journal_name journal_ref journal_desc }
    }
  }`;

/** Submit a Journal Voucher (balanced double-entry) and return the created journal_ref. */
async function createJv(
  request: any,
  token: string,
  userId: string,
  marker: string,
  label: string,
  accountA: any,
  accountB: any,
): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const amount = '100.00';
  const resp = await gqlAs(request, token, CREATE_GV, {
    input: {
      journal_name: 'Journal Voucher',
      journal_date: today,
      journal_desc: `${marker} ${label}`,
      check_no: '',
      amount,
      user_id: userId,
      acctg_details: [
        { acctnumber: accountA.number, accountLabel: accountA.account_name, debit: amount, credit: '0.00' },
        { acctnumber: accountB.number, accountLabel: accountB.account_name, debit: '0.00', credit: amount },
      ],
    },
  });
  expect(
    resp?.data?.createGvEntry?.status,
    `createGvEntry failed for ${label}: ${JSON.stringify(resp)}`,
  ).toBeTruthy();

  // The mutation returns only {status, message} — look up the new entry by
  // the unique marker+label in journal_desc to grab its journal_ref.
  const lookup = await gqlAs(request, token, LOOKUP_BY_DESC);
  const match = (lookup?.data?.getCheckVoucher?.data ?? []).find((r: any) =>
    String(r?.journal_desc ?? '') === `${marker} ${label}`,
  );
  expect(match, `voucher "${label}" must surface in getCheckVoucher`).toBeTruthy();
  expect(match.journal_ref, `voucher "${label}" must have a journal_ref`).toBeTruthy();
  return match.journal_ref as string;
}

/** Pull the numeric counter from a per-branch ref: "CHKV-MB1-0001292-26" → 1292. */
function counterOf(ref: string): number {
  // Per-branch format has exactly 4 dash-separated parts.
  const parts = ref.split('-');
  expect(parts.length, `ref "${ref}" must have 4 dash-parts (got ${parts.length})`).toBe(4);
  return parseInt(parts[2], 10);
}

/** Pull the branch code from a per-branch ref: "CHKV-MB1-0001292-26" → "MB1". */
function codeOf(ref: string): string {
  const parts = ref.split('-');
  expect(parts.length, `ref "${ref}" must have 4 dash-parts`).toBe(4);
  return parts[1];
}

test.describe('Per-sub-branch voucher numbering', () => {
  test.setTimeout(120_000);

  test('each branch gets its own counter; interleaving does not leak across branches', async ({ request }) => {
    const marker = makeMarker('PBV');

    try {
      // Auth as three users on three different sub-branches.
      const [ma, mb1, fdbal] = await Promise.all([
        restLogin(request, USERS.ma.email,    USERS.ma.password),
        restLogin(request, USERS.mb1.email,   USERS.mb1.password),
        restLogin(request, USERS.fdbal.email, USERS.fdbal.password),
      ]);

      expect(ma.user.branch_sub_id,    'MA user must be on bsub 1').toBe(USERS.ma.bsubId);
      expect(mb1.user.branch_sub_id,   'MB1 user must be on bsub 16').toBe(USERS.mb1.bsubId);
      expect(fdbal.user.branch_sub_id, 'FDBAL user must be on bsub 82').toBe(USERS.fdbal.bsubId);

      // Need two real active COA accounts for the balanced double-entry.
      const coa = await gqlAs(
        request,
        ma.token,
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
      expect(accounts.length, 'need at least 2 active COA accounts').toBeGreaterThanOrEqual(2);
      const [acctA, acctB] = accounts;

      // Interleave 6 vouchers across 3 branches: MA, MB1, FDBAL, MA, MB1, FDBAL.
      // If counters leak across branches, the second MA voucher's counter
      // would jump (because MB1/FDBAL incremented in between).
      const refs = {
        ma:    [] as string[],
        mb1:   [] as string[],
        fdbal: [] as string[],
      };

      // Round 1
      refs.ma.push(    await createJv(request, ma.token,    String(ma.user.id),    marker, 'MA-1',    acctA, acctB));
      refs.mb1.push(   await createJv(request, mb1.token,   String(mb1.user.id),   marker, 'MB1-1',   acctA, acctB));
      refs.fdbal.push( await createJv(request, fdbal.token, String(fdbal.user.id), marker, 'FDBAL-1', acctA, acctB));

      // Round 2 — same branches, different order to prove independence
      refs.fdbal.push( await createJv(request, fdbal.token, String(fdbal.user.id), marker, 'FDBAL-2', acctA, acctB));
      refs.ma.push(    await createJv(request, ma.token,    String(ma.user.id),    marker, 'MA-2',    acctA, acctB));
      refs.mb1.push(   await createJv(request, mb1.token,   String(mb1.user.id),   marker, 'MB1-2',   acctA, acctB));

      console.log('   ↳ MA refs:   ', refs.ma);
      console.log('   ↳ MB1 refs:  ', refs.mb1);
      console.log('   ↳ FDBAL refs:', refs.fdbal);

      // Assertion 1: every ref follows JV-{BRANCH}-{NNNNNNN}-{YY} format
      const FORMAT = /^JV-[A-Z0-9]+-\d{7}-\d{2}$/;
      for (const branchRefs of Object.values(refs)) {
        for (const ref of branchRefs) {
          expect(ref, `ref "${ref}" must match per-branch format`).toMatch(FORMAT);
        }
      }

      // Assertion 2: each ref carries the correct branch code
      expect(refs.ma.every((r)    => codeOf(r) === 'MA'),    `MA refs must all start CHKV-MA-: ${refs.ma.join(',')}`).toBeTruthy();
      expect(refs.mb1.every((r)   => codeOf(r) === 'MB1'),   `MB1 refs must all start CHKV-MB1-: ${refs.mb1.join(',')}`).toBeTruthy();
      expect(refs.fdbal.every((r) => codeOf(r) === 'FDBAL'), `FDBAL refs must all start CHKV-FDBAL-: ${refs.fdbal.join(',')}`).toBeTruthy();

      // Assertion 3: within each branch the counter is strictly +1 — proves
      // no leakage from the other branches' inserts in between.
      const maStep    = counterOf(refs.ma[1])    - counterOf(refs.ma[0]);
      const mb1Step   = counterOf(refs.mb1[1])   - counterOf(refs.mb1[0]);
      const fdbalStep = counterOf(refs.fdbal[1]) - counterOf(refs.fdbal[0]);
      expect(maStep,    `MA counter must be +1 between round 1 and round 2 (got +${maStep} from ${refs.ma.join(' → ')})`).toBe(1);
      expect(mb1Step,   `MB1 counter must be +1 (got +${mb1Step} from ${refs.mb1.join(' → ')})`).toBe(1);
      expect(fdbalStep, `FDBAL counter must be +1 (got +${fdbalStep} from ${refs.fdbal.join(' → ')})`).toBe(1);

      // Assertion 4: branches are independent — MA's counter does not bear
      // any predictable arithmetic relation to MB1's or FDBAL's.
      // (Existence of separate counters is implied by above; this just
      //  makes the intent loud in the test output.)
      console.log(`   ✓ MA advanced ${counterOf(refs.ma[0])} → ${counterOf(refs.ma[1])}`);
      console.log(`   ✓ MB1 advanced ${counterOf(refs.mb1[0])} → ${counterOf(refs.mb1[1])}`);
      console.log(`   ✓ FDBAL advanced ${counterOf(refs.fdbal[0])} → ${counterOf(refs.fdbal[1])}`);
    } finally {
      // Journal Vouchers are cleaned by journal-desc cleanup since they're
      // not strictly "check" vouchers; cleanupJournalsByMarker handles any
      // journal_name matching the desc prefix.
      const cleaned = cleanupJournalsByMarker(marker)
        + cleanupVouchersByMarker(marker);
      console.log(`   ↳ cleanup soft-deleted ${cleaned} entry(ies)`);
    }
  });
});
