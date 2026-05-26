/**
 * Phase A.1 — Loan Origination → Release → GL
 *
 * Verifies the money path FROM creating a borrower TO releasing the loan
 * and confirming the GL auto-posting is balanced (sum(debit) = sum(credit)).
 *
 * Scope cut deliberately: payment-against-schedule + payment reversal +
 * payment GL verification live in a sibling test (02-payment-and-reversal)
 * because they require the full "Compute → saveLoanSchedule → signPN"
 * choreography that the UI walks the user through. Mixing them here would
 * double the runtime without adding coverage that isn't already exercised
 * in payment-form-bugfixes.spec.ts.
 *
 * This test alone exercises:
 *   - saveBorrower mutation (full borrower create with refs + work bg)
 *   - processALoan(Create) mutation (loan_details rows generated)
 *   - saveReleaseLoan mutation + auto-post to acctg_entries/acctg_details
 *   - GL invariant: sum(debit) === sum(credit) on the release journal
 *   - Marker-based cleanup that cascades from borrower → loans → GL
 */

import { test, expect } from '@playwright/test';
import {
  makeMarker,
  restLogin,
  gqlAs,
  cleanupBorrowersByMarker,
  readGlBalance,
} from '../../helpers/e2e-helpers';

const ADMIN = { email: 'test.admin@fuerte.test', password: 'TestPass2026!' };

test.describe('Money path: loan origination → release → GL', () => {
  // Several backend auto-posts run in series — give the test room to breathe.
  test.setTimeout(180_000);

  test('creates borrower, originates loan, releases it, verifies GL is balanced', async ({ request }) => {
    const marker = makeMarker('LIFE');
    try {
      const admin = await restLogin(request, ADMIN.email, ADMIN.password);
      const token = admin.token;
      const userId = Number(admin.user.id);
      const branchSubId = Number(admin.user.branch_sub_id ?? 1);

      // Discover prerequisites.
      const lp = await gqlAs(
        request,
        token,
        `query { getLoanProducts(first: 1, page: 1, orderBy: [{column: "id", order: ASC}]) { data { id } } }`,
      );
      const loanProductId = lp?.data?.getLoanProducts?.data?.[0]?.id;
      expect(loanProductId, 'need at least one loan product seeded').toBeTruthy();

      const banks = await gqlAs(
        request,
        token,
        `query { getBanks(first: 5, page: 1, orderBy: [{column: "id", order: ASC}]) { data { id name } } }`,
      );
      const bankId = banks?.data?.getBanks?.data?.[0]?.id;
      expect(bankId, 'need at least one bank seeded').toBeTruthy();

      // === 1. CREATE BORROWER ===
      const stamp = Date.now().toString().slice(-8);
      const lastname = `${marker}_Doe`;
      const uniquePhone = `09${Date.now().toString().slice(-9)}`;

      const saveBorrowerMutation = `
        mutation SaveBorrower(
          $inputBorrInfo: BorrowerInput!
          $inputBorrDetail: BorrowerDetailsInput!
          $inputBorrSpouseDetail: BorrowerSpouseDetailsInput!
          $inputBorrWorkBg: BorrowerWorkBgInput!
          $inputBorrReference: BorrowerReferenceInput!
          $inputBorrCompInfo: BorrowerCompInfoInput!
        ) {
          saveBorrower(
            inputBorrInfo: $inputBorrInfo
            inputBorrDetail: $inputBorrDetail
            inputBorrSpouseDetail: $inputBorrSpouseDetail
            inputBorrWorkBg: $inputBorrWorkBg
            inputBorrReference: $inputBorrReference
            inputBorrCompInfo: $inputBorrCompInfo
          ) { success message }
        }`;
      const saveBorrResp = await gqlAs(request, token, saveBorrowerMutation, {
        inputBorrInfo: {
          user_id: userId,
          chief_id: '1',
          amount_applied: '50000',
          purpose: 'lifecycle test',
          firstname: 'Life',
          middlename: null,
          lastname,
          terms_of_payment: '12 months',
          residence_address: 'Test Address',
          is_rent: 0,
          other_source_of_inc: 'none',
          est_monthly_fam_inc: '30000',
          employment_position: 'Tester',
          gender: 'Male',
        },
        inputBorrDetail: {
          dob: '1990-01-01',
          place_of_birth: 'Manila',
          age: 35,
          email: `${marker}.${stamp}@test.invalid`,
          contact_no: uniquePhone,
          civil_status: 'Single',
        },
        inputBorrSpouseDetail: {
          work_address: '', occupation: '', fullname: '', company: '', dept_branch: '',
          length_of_service: '', salary: '', company_contact_person: '', contact_no: '',
        },
        inputBorrWorkBg: {
          company_borrower_id: '1',
          employment_number: `EMP-${stamp}`,
          area_id: '1',
          sub_area_id: null,
          station: 'Test',
          term_in_service: '1 year',
          employment_status: 'Permanent',
          division: 'Test',
          monthly_gross: '20000',
          monthly_net: '17000',
          office_address: 'Test',
        },
        inputBorrReference: {
          reference: [
            { occupation: 'Boss', name: 'Ref One', contact_no: '09111111111' },
            { occupation: 'Coworker', name: 'Ref Two', contact_no: '09222222222' },
            { occupation: 'Friend', name: 'Ref Three', contact_no: '09333333333' },
          ],
        },
        inputBorrCompInfo: { employer: 'Test Co', salary: '20000', contract_duration: '1 year' },
      });
      expect(
        saveBorrResp?.data?.saveBorrower?.success,
        `borrower create failed: ${JSON.stringify(saveBorrResp)}`,
      ).toBeTruthy();

      const borrLookup = await gqlAs(
        request,
        token,
        `query($s: String){ getBorrowers(first: 1, page: 1, search: $s, orderBy: [{column: "id", order: DESC}]) { data { id firstname lastname } } }`,
        { s: lastname },
      );
      const createdBorrowerId = Number(borrLookup?.data?.getBorrowers?.data?.[0]?.id);
      expect(createdBorrowerId, 'must be able to read back the new borrower').toBeTruthy();

      // === 2. CREATE LOAN (Compute is skipped; Create writes loan + loan_details) ===
      const loanResp = await gqlAs(
        request,
        token,
        `mutation ProcessALoan($input: LoanComputationInput, $process_type: String!) {
           processALoan(input: $input, process_type: $process_type) { success message loan_id }
         }`,
        {
          input: {
            borrower_id: createdBorrowerId,
            user_id: userId,
            loan_amount: '50000',
            branch_sub_id: String(branchSubId),
            loan_product_id: String(loanProductId),
            ob: '0',
            penalty: '0',
            rebates: '0',
          },
          process_type: 'Create',
        },
      );
      expect(
        loanResp?.data?.processALoan?.success,
        `loan create failed: ${JSON.stringify(loanResp)}`,
      ).toBeTruthy();
      const loanId = Number(loanResp.data.processALoan.loan_id);
      expect(loanId).toBeGreaterThan(0);

      // === 3. RELEASE LOAN — triggers auto-post to GL ===
      const releaseResp = await gqlAs(
        request,
        token,
        `mutation SaveReleaseLoan($input: InputLoanRelease) {
           saveReleaseLoan(input: $input) { success message auto_posted posting_warning }
         }`,
        {
          input: {
            id: String(loanId),
            released_date: new Date().toISOString().slice(0, 10),
            bank_id: String(bankId),
            check_no: 'E2E-CHK-' + stamp,
          },
        },
      );
      expect(
        releaseResp?.data?.saveReleaseLoan?.success,
        `loan release failed: ${JSON.stringify(releaseResp)}`,
      ).toBeTruthy();

      const loanLookup = await gqlAs(
        request,
        token,
        `query($id: Int){ getLoan(loan_id: $id) { id loan_ref status } }`,
        { id: loanId },
      );
      const loanRef: string = loanLookup?.data?.getLoan?.loan_ref;
      expect(loanRef, 'released loan must carry a loan_ref').toBeTruthy();
      console.log(`   ↳ loan ${loanId} released, ref=${loanRef}`);

      // === 4. INVARIANT — GL must balance ===
      const balance = readGlBalance(loanRef);
      console.log(`   ↳ GL totals:`, balance);
      expect(balance.rows, 'release must produce GL detail rows').toBeGreaterThan(0);
      // Equality with BCMath semantics: total_debit and total_credit are
      // decimal strings; .toFixed(2) normalises any trailing-zero differences.
      expect(
        Number(balance.total_debit).toFixed(2),
        `release GL must balance (debit=${balance.total_debit} credit=${balance.total_credit})`,
      ).toBe(Number(balance.total_credit).toFixed(2));

      console.log(`   ✓ end-to-end: borrower → loan ${loanId} → released → GL balanced`);
    } finally {
      const cleaned = cleanupBorrowersByMarker(marker);
      console.log(`   ↳ cleanup soft-deleted ${cleaned} borrower(s) + cascaded loan/GL rows`);
    }
  });
});
