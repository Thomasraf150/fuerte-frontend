/**
 * E2E Test Suite: Multi-Branch Processing User (per-form dropdown model)
 *
 * Validates the feature that lets one Processing-role account file work
 * under multiple branches (FA + FB + FC + FD), AFTER the redesign that
 * removed the global header switcher in favour of a per-form branch
 * dropdown on the Borrower create form.
 *
 * Safety invariants under test:
 *   1. Existing single-branch users see ZERO UI changes — no header
 *      switcher, no branch dropdown on the borrower form, no behavior
 *      change anywhere.
 *   2. Login response shape is additive only.
 *   3. The header NEVER has an "Active branch:" switcher — for anyone.
 *   4. Multi-branch users see a Branch dropdown ONLY on the borrower
 *      CREATE form. EDIT forms NEVER expose the picker.
 *   5. Borrower writes are stamped with the form's branch_sub_id, not
 *      a hidden global state.
 *   6. Cross-branch grants are still Owner-only (UI + API).
 *   7. createUser is Owner-only at the backend; updateUser stays open
 *      to Owner+Admin.
 *
 * Test user fixtures (seeded by DeletionApprovalTestUsersSeeder):
 *   - test.processing.a@fuerte.test  (role 3, home = Marikina FA / id 1)
 *   - test.owner@fuerte.test          (role 5)
 *   - test.admin@fuerte.test          (role 1)
 *   Default password: TestPass2026!
 */

import { test, expect, Page, APIRequestContext } from '@playwright/test';

const FRONTEND = 'http://localhost:3000';
const REST_BASE = process.env.TEST_REST_URL ?? 'http://localhost:8080';
const GRAPHQL_URL = process.env.TEST_GRAPHQL_URL ?? 'http://localhost:8080/fuerte-api';

const PROCESSING_USER = {
  email: 'test.processing.a@fuerte.test',
  password: 'TestPass2026!',
  homeBranchSubId: 1, // Marikina FA
  userId: 0, // populated at runtime
};

const OWNER_USER = {
  email: 'test.owner@fuerte.test',
  password: 'TestPass2026!',
};

const ADMIN_USER = {
  email: 'test.admin@fuerte.test',
  password: 'TestPass2026!',
};

// FB / FC / FD first sub-branch ids (per DeletionApprovalTestUsersSeeder).
const ADDITIONAL_BRANCH_IDS = [57, 72, 82];

// ============================================================================
// HELPERS
// ============================================================================

async function restLogin(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<{ token: string; user: any }> {
  const res = await request.post(`${REST_BASE}/api/login`, {
    headers: { 'Content-Type': 'application/json' },
    data: { email, password },
  });
  expect(res.ok(), `login failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  return res.json();
}

async function gqlAs(
  request: APIRequestContext,
  token: string,
  query: string,
  variables: any = {},
): Promise<any> {
  const res = await request.post(GRAPHQL_URL, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    data: { query, variables },
  });
  return res.json();
}

async function setProcessingUserBranches(
  request: APIRequestContext,
  branchSubIds: number[],
): Promise<void> {
  const owner = await restLogin(request, OWNER_USER.email, OWNER_USER.password);
  if (!PROCESSING_USER.userId) {
    const procLogin = await restLogin(request, PROCESSING_USER.email, PROCESSING_USER.password);
    PROCESSING_USER.userId = Number(procLogin.user?.id ?? 0);
  }
  const json = await gqlAs(
    request,
    owner.token,
    `mutation SetUserBranchAccess($user_id: ID!, $branch_sub_ids: [ID!]!) {
       setUserBranchAccess(user_id: $user_id, branch_sub_ids: $branch_sub_ids) {
         id
         additionalBranchSubs { id name }
       }
     }`,
    {
      user_id: String(PROCESSING_USER.userId),
      branch_sub_ids: branchSubIds.map(String),
    },
  );
  expect(
    json?.data?.setUserBranchAccess,
    `setUserBranchAccess failed: ${JSON.stringify(json?.errors)}`,
  ).toBeTruthy();
}

async function uiLoginAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto(`${FRONTEND}/auth/signin`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear()).catch(() => {});
  if (!page.url().includes('/auth/signin')) {
    await page.goto(`${FRONTEND}/auth/signin`, { waitUntil: 'domcontentloaded' });
  }
  await page.waitForTimeout(800);
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.locator('button[type="submit"]').first().click();
  await page
    .waitForSelector('button:has-text("Signing In...")', { timeout: 3000 })
    .catch(() => {});
  await page
    .waitForSelector('button:has-text("Signing In...")', { state: 'detached', timeout: 20000 })
    .catch(() => {});
  try {
    await page.waitForURL((u) => !u.toString().includes('/auth/signin'), { timeout: 20000 });
  } catch {
    const err = await page.locator('.Toastify__toast--error').first().textContent().catch(() => '');
    throw new Error(
      `login did not redirect for ${email} (url=${page.url()}, errorToast="${err ?? ''}")`,
    );
  }
  await page.waitForTimeout(1500);
}

async function readPersistedAuth(page: Page): Promise<any> {
  return page.evaluate(() => {
    const raw = localStorage.getItem('authStore');
    if (!raw) return null;
    try {
      return JSON.parse(raw)?.state ?? null;
    } catch {
      return null;
    }
  });
}

// ============================================================================
// TEST SUITE
// ============================================================================

test.describe('Multi-Branch Processing User (per-form picker)', () => {
  test.beforeAll(async ({ request }) => {
    await setProcessingUserBranches(request, []);
  });

  test.afterAll(async ({ request }) => {
    await setProcessingUserBranches(request, []);
  });

  // ==========================================================================
  // TEST 1 — Single-branch invariance (UI surface unchanged)
  // ==========================================================================
  test('Single-branch Processing user: no switcher, no borrower-form picker', async ({ page, request }) => {
    await setProcessingUserBranches(request, []);

    console.log('\n🔐 Logging in as single-branch Processing user...');
    await uiLoginAs(page, PROCESSING_USER.email, PROCESSING_USER.password);

    // 1a. Header must NOT contain the deprecated active-branch switcher.
    const switcher = page.locator('#active-branch-switcher');
    await expect(switcher, 'switcher must not exist anywhere in the app').toHaveCount(0);

    // 1b. Persisted auth shape — additive only, no activeBranchSubId field.
    const auth = await readPersistedAuth(page);
    expect(auth?.user?.branch_sub_id).toBe(PROCESSING_USER.homeBranchSubId);
    expect(auth?.user?.assignedBranchSubIds).toEqual([PROCESSING_USER.homeBranchSubId]);
    expect(auth?.user?.activeBranchSubId, 'activeBranchSubId must no longer be persisted').toBeUndefined();
    expect(auth?.user?.branch_sub?.name).toBeTruthy();
    expect(auth?.user?.role?.code).toBe('PROC');

    // 1c. Header still shows the user's home branch label (legacy DropdownUser behavior).
    await page.locator('button:visible, a:visible').first().waitFor({ timeout: 5000 });
    const headerText = await page.locator('header').first().innerText();
    expect(headerText.toUpperCase()).toContain('MARIKINA FA');

    // 1d. Borrower CREATE form must NOT show the branch dropdown for a
    //     single-branch user.
    await page.goto(`${FRONTEND}/borrowers/new`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const picker = page.locator('[data-testid="borrower-branch-picker"]');
    await expect(picker, 'branch picker must be hidden for single-branch users').toHaveCount(0);

    console.log('   ✓ no switcher, no form picker, auth shape additive');
  });

  // ==========================================================================
  // TEST 2 — Header NEVER has switcher (even for multi-branch users)
  // ==========================================================================
  test('Header has no active-branch switcher even for multi-branch users', async ({ page, request }) => {
    await setProcessingUserBranches(request, ADDITIONAL_BRANCH_IDS);

    console.log('\n🔐 Logging in as multi-branch Processing user...');
    await uiLoginAs(page, PROCESSING_USER.email, PROCESSING_USER.password);

    const switcher = page.locator('#active-branch-switcher');
    await expect(switcher, 'switcher must NEVER render').toHaveCount(0);

    // The header must NOT contain the text "Active branch:" anywhere.
    const headerText = await page.locator('header').first().innerText();
    expect(headerText.toLowerCase(), 'header must not advertise an active-branch concept').not.toContain('active branch');

    await setProcessingUserBranches(request, []);
    console.log('   ✓ header is clean — no switcher, no active-branch label');
  });

  // ==========================================================================
  // TEST 3 — Multi-branch borrower form: dropdown renders + 4 options
  // ==========================================================================
  test('Multi-branch user: borrower CREATE form renders a branch dropdown with all accessible branches', async ({ page, request }) => {
    await setProcessingUserBranches(request, ADDITIONAL_BRANCH_IDS);

    await uiLoginAs(page, PROCESSING_USER.email, PROCESSING_USER.password);

    // Persisted auth should now contain 4 branches.
    const auth = await readPersistedAuth(page);
    expect(auth?.user?.assignedBranchSubIds).toEqual(
      expect.arrayContaining([
        PROCESSING_USER.homeBranchSubId,
        ...ADDITIONAL_BRANCH_IDS,
      ]),
    );
    expect((auth?.user?.assignedBranchSubIds ?? []).length).toBeGreaterThanOrEqual(4);

    // Navigate to the borrower CREATE page.
    await page.goto(`${FRONTEND}/borrowers/new`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    // Picker must be visible.
    const picker = page.locator('[data-testid="borrower-branch-picker"]');
    await expect(picker, 'branch picker must render for multi-branch users on create').toBeVisible({
      timeout: 15000,
    });

    // Open the dropdown using the exact pattern the loan-branch-access
    // test already uses successfully (loan-branch-access.spec.ts:84-93).
    // react-select wraps the control in a div with class containing
    // "react-select"; clicking that div opens the menu.
    const branchSelect = picker.locator('[class*="react-select"]').first();
    await branchSelect.click();
    // Wait for the menu options to actually appear in the DOM, not just a
    // fixed timeout — fixes the "0 options" race where the click landed
    // before the options finished mounting.
    await page.waitForSelector('[class*="react-select__option"]', { timeout: 10000 });
    const options = page.locator('[class*="react-select__option"]');
    const optionCount = await options.count();
    expect(optionCount, 'dropdown must list 4 branches').toBeGreaterThanOrEqual(4);

    const optionTexts = await options.allTextContents();
    console.log('   ↳ dropdown options:', optionTexts);
    // Sanity-check the names. Sub-branch names contain FB / FC / FD strings
    // (per the clone migrations) for the seeded ids 57/72/82.
    const joined = optionTexts.join(' | ');
    expect(joined).toMatch(/Marikina FA/i);
    expect(joined).toMatch(/FB/i);
    expect(joined).toMatch(/FC/i);
    expect(joined).toMatch(/FD/i);

    await setProcessingUserBranches(request, []);
    console.log('   ✓ multi-branch picker renders with 4 branches');
  });

  // ==========================================================================
  // TEST 4 — Borrower stamped with the form's branch_sub_id (API path)
  // ==========================================================================
  test('Multi-branch user: borrower saved is stamped with the branch_sub_id from the form', async ({ request }) => {
    await setProcessingUserBranches(request, ADDITIONAL_BRANCH_IDS);
    const targetBranch = ADDITIONAL_BRANCH_IDS[1]; // FC Balibago

    const procLogin = await restLogin(request, PROCESSING_USER.email, PROCESSING_USER.password);
    const procToken = procLogin.token;

    const stamp = Date.now().toString().slice(-6);
    const uniqueLast = `Stamp${stamp}`;
    const uniquePhone = `09${Date.now().toString().slice(-9)}`;

    const mutation = `
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

    const variables = {
      inputBorrInfo: {
        user_id: PROCESSING_USER.userId || 77,
        chief_id: '1',
        amount_applied: '50000',
        purpose: 'multi-branch attribution test',
        firstname: 'Multi',
        middlename: null,
        lastname: uniqueLast,
        terms_of_payment: '12 months',
        residence_address: 'Test Address',
        is_rent: 0,
        other_source_of_inc: 'none',
        est_monthly_fam_inc: '30000',
        employment_position: 'Tester',
        gender: 'Male',
        // The form now passes branch_sub_id directly (no more
        // active_branch_sub_id hidden hint). The backend validates this
        // against the user's accessible branches.
        branch_sub_id: String(targetBranch),
      },
      inputBorrDetail: {
        dob: '1990-01-01',
        place_of_birth: 'Manila',
        age: 35,
        email: `multi.${stamp}@test.com`,
        contact_no: uniquePhone,
        civil_status: 'Single',
      },
      inputBorrSpouseDetail: {
        work_address: '',
        occupation: '',
        fullname: '',
        company: '',
        dept_branch: '',
        length_of_service: '',
        salary: '',
        company_contact_person: '',
        contact_no: '',
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
        office_address: 'Test Office',
      },
      inputBorrReference: {
        reference: [
          { occupation: 'Boss', name: 'Ref One', contact_no: '09111111111' },
          { occupation: 'Coworker', name: 'Ref Two', contact_no: '09222222222' },
          { occupation: 'Friend', name: 'Ref Three', contact_no: '09333333333' },
        ],
      },
      inputBorrCompInfo: {
        employer: 'Test Co',
        salary: '20000',
        contract_duration: '1 year',
      },
    };

    const saveResp = await gqlAs(request, procToken, mutation, variables);
    expect(
      saveResp?.data?.saveBorrower?.success,
      `saveBorrower failed: ${JSON.stringify(saveResp)}`,
    ).toBeTruthy();

    const lookup = await gqlAs(
      request,
      procToken,
      `query($search: String){
         getBorrowers(first: 5, page: 1, search: $search, orderBy: [{column: "id", order: DESC}]) {
           data { id firstname lastname branch_sub { id name } }
         }
       }`,
      { search: uniqueLast },
    );
    const rows = lookup?.data?.getBorrowers?.data ?? [];
    expect(rows.length, 'new borrower must be visible').toBeGreaterThan(0);
    expect(Number(rows[0].branch_sub?.id)).toBe(targetBranch);
    console.log(`   ✓ borrower ${rows[0].id} stamped with branch_sub_id=${rows[0].branch_sub?.id}`);

    await setProcessingUserBranches(request, []);
  });

  // ==========================================================================
  // TEST 5 — Invalid branch_sub_id from form falls back to home (security)
  // ==========================================================================
  test('Multi-branch user: invalid branch_sub_id falls back to home branch (no cross-branch leak)', async ({ request }) => {
    await setProcessingUserBranches(request, ADDITIONAL_BRANCH_IDS);

    const procLogin = await restLogin(request, PROCESSING_USER.email, PROCESSING_USER.password);
    const procToken = procLogin.token;

    const stamp = Date.now().toString().slice(-6);
    const uniqueLast = `Fallback${stamp}`;

    // Send branch_sub_id=999 (does not exist / definitely not in accessible list)
    const variables = {
      inputBorrInfo: {
        user_id: PROCESSING_USER.userId || 77,
        chief_id: '1',
        amount_applied: '10000',
        purpose: 'fallback test',
        firstname: 'Fallback',
        middlename: null,
        lastname: uniqueLast,
        terms_of_payment: '6 months',
        residence_address: 'Test Address',
        is_rent: 0,
        other_source_of_inc: 'none',
        est_monthly_fam_inc: '20000',
        employment_position: 'Tester',
        gender: 'Female',
        branch_sub_id: '999', // bogus
      },
      inputBorrDetail: {
        dob: '1992-01-01',
        place_of_birth: 'Manila',
        age: 33,
        email: `fallback.${stamp}@test.com`,
        contact_no: `09${Date.now().toString().slice(-9)}`,
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
        monthly_gross: '15000',
        monthly_net: '12000',
        office_address: 'Test',
      },
      inputBorrReference: {
        reference: [
          { occupation: 'X', name: 'A', contact_no: '09111111112' },
          { occupation: 'Y', name: 'B', contact_no: '09222222223' },
          { occupation: 'Z', name: 'C', contact_no: '09333333334' },
        ],
      },
      inputBorrCompInfo: { employer: 'X', salary: '15000', contract_duration: '1y' },
    };

    const mutation = `mutation($inputBorrInfo: BorrowerInput!, $inputBorrDetail: BorrowerDetailsInput!, $inputBorrSpouseDetail: BorrowerSpouseDetailsInput!, $inputBorrWorkBg: BorrowerWorkBgInput!, $inputBorrReference: BorrowerReferenceInput!, $inputBorrCompInfo: BorrowerCompInfoInput!) { saveBorrower(inputBorrInfo: $inputBorrInfo, inputBorrDetail: $inputBorrDetail, inputBorrSpouseDetail: $inputBorrSpouseDetail, inputBorrWorkBg: $inputBorrWorkBg, inputBorrReference: $inputBorrReference, inputBorrCompInfo: $inputBorrCompInfo) { success message } }`;
    const saveResp = await gqlAs(request, procToken, mutation, variables);
    expect(saveResp?.data?.saveBorrower?.success).toBeTruthy();

    const lookup = await gqlAs(
      request,
      procToken,
      `query($search: String){ getBorrowers(first: 5, page: 1, search: $search, orderBy: [{column: "id", order: DESC}]) { data { id branch_sub { id } } } }`,
      { search: uniqueLast },
    );
    const rows = lookup?.data?.getBorrowers?.data ?? [];
    expect(rows.length).toBeGreaterThan(0);
    expect(
      Number(rows[0].branch_sub?.id),
      'invalid branch_sub_id must fall back to home branch, never honored',
    ).toBe(PROCESSING_USER.homeBranchSubId);
    console.log(`   ✓ invalid 999 fell back to home (id ${rows[0].branch_sub?.id})`);

    await setProcessingUserBranches(request, []);
  });

  // ==========================================================================
  // TEST 6 — Multi-branch user EDIT form has NO branch dropdown
  // ==========================================================================
  test('Multi-branch user: EDIT borrower form does NOT expose the branch picker', async ({ page, request }) => {
    await setProcessingUserBranches(request, ADDITIONAL_BRANCH_IDS);

    // Find an existing borrower to edit. Look up the most recent one
    // visible to the user.
    const procLogin = await restLogin(request, PROCESSING_USER.email, PROCESSING_USER.password);
    const list = await gqlAs(
      request,
      procLogin.token,
      `query { getBorrowers(first: 1, page: 1, orderBy: [{column: "id", order: DESC}]) { data { id } } }`,
    );
    const existingId = list?.data?.getBorrowers?.data?.[0]?.id;
    expect(existingId, 'need at least one existing borrower for edit-mode test').toBeTruthy();

    await uiLoginAs(page, PROCESSING_USER.email, PROCESSING_USER.password);
    await page.goto(`${FRONTEND}/borrowers/${existingId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    const picker = page.locator('[data-testid="borrower-branch-picker"]');
    await expect(picker, 'branch picker must NOT render in edit mode').toHaveCount(0);

    await setProcessingUserBranches(request, []);
    console.log('   ✓ edit form correctly hides the branch picker');
  });

  // ==========================================================================
  // TEST 7 — Backend's getMyAccessibleBranchSubs reflects pivot grants
  // ==========================================================================
  test('Multi-branch read path: getMyAccessibleBranchSubs returns home + extras', async ({ request }) => {
    await setProcessingUserBranches(request, ADDITIONAL_BRANCH_IDS);

    const procLogin = await restLogin(request, PROCESSING_USER.email, PROCESSING_USER.password);
    const accessible = await gqlAs(
      request,
      procLogin.token,
      `query { getMyAccessibleBranchSubs { id name } }`,
    );
    const ids: number[] = (accessible?.data?.getMyAccessibleBranchSubs ?? []).map((b: any) =>
      Number(b.id),
    );
    expect(ids).toEqual(
      expect.arrayContaining([
        PROCESSING_USER.homeBranchSubId,
        ...ADDITIONAL_BRANCH_IDS,
      ]),
    );
    console.log('   ↳ accessible from backend:', ids);

    await setProcessingUserBranches(request, []);
  });

  // ==========================================================================
  // TEST 8 — NEGATIVE: Admin still cannot create accounts or grant cross-branch
  // ==========================================================================
  test('Admin user: no Create button, no Cross-Branch section, createUser denied', async ({ page, request }) => {
    await uiLoginAs(page, ADMIN_USER.email, ADMIN_USER.password);

    await page.goto(`${FRONTEND}/users-setup`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.rdt_TableRow', { timeout: 15000 });

    // No Create button.
    expect(await page.locator('button:has-text("Create")').count(), 'Create button must be hidden').toBe(0);

    // Edit form still works.
    const firstRow = page.locator('.rdt_TableRow').first();
    const actionIcons = firstRow.locator('svg.cursor-pointer');
    expect(await actionIcons.count()).toBeGreaterThanOrEqual(2);
    await actionIcons.nth(1).click({ force: true });
    await page.waitForTimeout(2500);
    await expect(page.locator('text=Update User').first()).toBeVisible({ timeout: 5000 });

    // No Cross-Branch Access section.
    expect(await page.locator('text=Cross-Branch Access').count(), 'section must be hidden').toBe(0);

    // Backend rejects createUser.
    const admin = await restLogin(request, ADMIN_USER.email, ADMIN_USER.password);
    const denyResp = await gqlAs(
      request,
      admin.token,
      `mutation($input: UserInput!) { createUser(input: $input) { id name } }`,
      {
        input: {
          name: `Should Not Exist ${Date.now()}`,
          email: `admin-denied-${Date.now()}@test.invalid`,
          password: 'whatever',
          branch_sub_id: 1,
          role_id: 3,
        },
      },
    );
    expect(denyResp?.data?.createUser ?? null).toBeNull();
    expect(JSON.stringify(denyResp?.errors ?? []).toLowerCase()).toContain('owner');
    console.log('   ✓ Admin: no create, no cross-branch UI, API denied');
  });

  // ==========================================================================
  // TEST 9 — Owner: Cross-Branch Access section still works
  // ==========================================================================
  test('Owner: User Setup form exposes a working Cross-Branch Access section', async ({ page }) => {
    await uiLoginAs(page, OWNER_USER.email, OWNER_USER.password);

    await page.goto(`${FRONTEND}/users-setup`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.rdt_TableRow', { timeout: 15000 });

    const firstRow = page.locator('.rdt_TableRow').first();
    const actionIcons = firstRow.locator('svg.cursor-pointer');
    expect(await actionIcons.count()).toBeGreaterThanOrEqual(2);
    await actionIcons.nth(1).click({ force: true });
    await page.waitForTimeout(2500);

    await expect(page.locator('text=Cross-Branch Access').first()).toBeVisible({ timeout: 5000 });
    await page.waitForFunction(
      () => document.querySelectorAll('input[type="checkbox"]:not([disabled])').length > 0,
      { timeout: 15000 },
    );

    const checkboxes = page.locator('input[type="checkbox"]:not([disabled])');
    expect(await checkboxes.count()).toBeGreaterThan(0);
    await checkboxes.first().check({ force: true });

    const saveBtn = page.locator('button:has-text("Save"), button[type="submit"]').first();
    await saveBtn.click();
    await page.waitForTimeout(2500);

    const errCount = await page.locator('.Toastify__toast--error').count();
    if (errCount > 0) {
      const text = await page.locator('.Toastify__toast--error').first().textContent();
      throw new Error(`Save produced an error toast: ${text}`);
    }
    console.log('   ✓ Owner-only cross-branch flow works end-to-end');
  });
});
