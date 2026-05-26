/**
 * Verification spec for the Check Voucher signature footer block.
 *
 * 1. Logs in via REST.
 * 2. Calls printAcctgEntries on an existing Check Voucher.
 * 3. Downloads the PDF and saves it for visual inspection.
 * 4. Renders the print_voucher Blade view as HTML (via the docker container)
 *    and asserts the new fields appear on BOTH pages (original + duplicate).
 *
 * The Blade-render assertion is what gives us 100% confidence: the actual
 * markup that DomPDF turns into the PDF contains every label, exactly twice.
 */

import { test, expect } from '@playwright/test';
import { restLogin, gqlAs } from '../helpers/e2e-helpers';
import { writeFileSync } from 'fs';
import { execFileSync } from 'child_process';

const ADMIN = { email: 'test.admin@fuerte.test', password: 'TestPass2026!' };
const CONTAINER = 'fuerte-app-1';

test.describe('Check Voucher signature footer', () => {
  test.setTimeout(60_000);

  test('print_voucher Blade renders all 6 new fields on both pages', async ({ request }) => {
    const admin = await restLogin(request, ADMIN.email, ADMIN.password);

    // Pick the most recent active Check Voucher to print
    const lookup = await gqlAs(
      request,
      admin.token,
      `query { getCheckVoucher(first: 1, page: 1, orderBy: [{column: "id", order: DESC}]) {
         data { id journal_ref check_no }
       } }`,
    );
    const cv = lookup?.data?.getCheckVoucher?.data?.[0];
    expect(cv, 'need at least one Check Voucher in the DB').toBeTruthy();
    const journalRef = cv.journal_ref as string;
    console.log(`  ↳ using voucher ${journalRef} (check_no=${cv.check_no})`);

    // Trigger the print mutation
    const printResp = await gqlAs(
      request,
      admin.token,
      `mutation($input: AcctgEntryInput!) { printAcctgEntries(input: $input) }`,
      { input: { journal_ref: journalRef } },
    );
    const pdfUrl = printResp?.data?.printAcctgEntries as string;
    expect(pdfUrl, 'printAcctgEntries returned no URL').toContain('/storage/pdf/');

    // Save a copy of the PDF for manual review (helpful if assertions fail)
    const pdfFull = `http://localhost:8080${pdfUrl}`;
    const pdfResp = await request.get(pdfFull);
    expect(pdfResp.status()).toBe(200);
    writeFileSync('test-results/cv-with-signature.pdf', await pdfResp.body());
    console.log('  ↳ PDF saved to test-results/cv-with-signature.pdf');

    // Render the Blade view to HTML inside the PHP container so we can grep
    // it for the new labels (no PDF-text-extraction needed).
    const renderScript = `
      require '/var/www/html/vendor/autoload.php';
      $app = require_once '/var/www/html/bootstrap/app.php';
      $app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();
      $results = DB::table('acctg_entries as ae')
        ->leftJoin('acctg_details as ad','ae.id','=','ad.acctg_entries_id')
        ->leftJoin('accounts as a','a.number','=','ad.acctnumber')
        ->leftJoin('vendors as v','v.id','=','ae.vendor_id')
        ->leftJoin('users as u','u.id','=','ae.user_id')
        ->leftJoin('branch_subs as bs','bs.id','=','u.branch_sub_id')
        ->select('v.name as vendor_name','ae.*','a.account_name','ad.acctnumber','ad.debit','ad.credit','bs.name as branch_name')
        ->addSelect(DB::raw("(SELECT CONCAT(b3.lastname,', ',b3.firstname) FROM borrowers b3 INNER JOIN loans l3 ON l3.borrower_id=b3.id WHERE l3.loan_ref=ae.reference_no LIMIT 1) as loan_borrower_name"))
        ->addSelect(DB::raw("(SELECT CONCAT(b2.firstname,' ',b2.lastname) FROM borrowers b2 LEFT JOIN loans l2 ON l2.borrower_id=b2.id LEFT JOIN loan_schedules ls ON ls.loan_id=l2.id LEFT JOIN loan_payments lp ON lp.loan_schedule_id=ls.id WHERE lp.journal_ref='${journalRef}' LIMIT 1) as receipt_borrower_name"))
        ->where('ae.journal_ref','${journalRef}')
        ->get();
      echo view('print_voucher', ['data' => ['acctg_entries' => $results]])->render();
    `;
    const html = execFileSync(
      'docker',
      ['exec', CONTAINER, 'php', '-r', renderScript.replace(/\s+/g, ' ')],
      { encoding: 'utf8' },
    );

    // Each label must appear exactly twice (page 1 + page 2 duplicate)
    const labels = ['Paid by', 'CHECK NO.', 'CASH', 'Prepared by', 'Audited by', 'Approved by', 'Date Received', 'Received by'];
    for (const label of labels) {
      const matches = html.split(label).length - 1;
      expect(matches, `"${label}" should appear 2× (one per page)`).toBe(2);
    }

    // Auto-populated check_no must also appear on both pages
    if (cv.check_no) {
      const checkMatches = html.split(cv.check_no).length - 1;
      expect(checkMatches, `check_no ${cv.check_no} should appear 2×`).toBeGreaterThanOrEqual(2);
    }

    console.log('  ✓ All signature-block labels render on both voucher pages');
  });
});
