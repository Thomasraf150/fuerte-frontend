/**
 * New application (/applications/new) and its way in from the list, stubbed.
 *
 *   1. The list shows New application, which opens /applications/new, and each row's
 *      Saan galing under the name (nothing for a row without one).
 *   2. Only the basics are required: an empty Save flags exactly first name, last name,
 *      mobile, amount, purpose, branch and Saan galing, and posts nothing. A basic of
 *      only spaces gets a plain message, and nothing is posted.
 *   3. With the basics and Facebook Messenger it posts exactly toApplicationInput's
 *      output ("15,000" goes as "15000"), then the list says "Na-save ang application."
 *      until a refresh. 3b: Enter pressed inside the amount, never left, posts it too.
 *   4. No photo and no Check Borrower button; the first card is "Name & Contact".
 *   5. The branch picker offers exactly what getApplicationBranches returned, and Call
 *      Center starts with none picked, although its home branch is a choice.
 *   6. A server refusal shows its message, and the form keeps its values; Back then
 *      returns to the list without the saved note.
 *   7. At 360px nothing scrolls sideways, every Saan galing tile and every text box and
 *      select is 48px or taller, and on the list Upload is outlined, not a second filled
 *      primary button beside New application.
 *   8. Keyboard: Tab reaches the tiles as one stop, the arrow keys change the choice,
 *      and each tile has an accessible name (its hint as the description).
 *   9. Call Center, Owner and Admin get four tiles, Google Form included, and must pick
 *      a branch; branch staff get three, without Google Form, on their home branch.
 *  10. A branch list that fails to load says so, and Retry loads it.
 *  11. The branch picker takes react-hook-form's ref: React logs no ref warning, and a
 *      Save with only the branch missing puts the cursor on it.
 *
 * NO CREDENTIALS AND NO BACKEND: see borrowerFormHarness.ts. The users are fictional
 * Call Center, Owner, Admin and Processing staff, seeded with the harness's made-up token.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/26-new-application --reporter=line
 */
import type { Locator, Page } from '@playwright/test';
import { toApplicationInput } from '../../../src/utils/applicationForm';
import {
  BRANCH_SUBS,
  FAKE_TOKEN,
  type FakeBackend,
  type GraphqlBody,
  expect,
  fakeUser,
  fieldHeights,
  optionsOf,
  pick,
  requiredMarks,
  saveButton,
  selectControl,
  selectedText,
  sidewaysScroll,
  submitAndReadErrors,
  test,
} from './borrowerFormHarness';

test.setTimeout(180_000);

const APP = 'http://localhost:3000';
const REQUIRED = 'This field is required';
const CHANNEL_ERROR = 'Piliin kung saan galing ang application.';
const BLANK_BASICS = 'Kailangan ang pangalan, mobile, amount at purpose.';
const SAVED_NOTE = 'Na-save ang application.';
const ALL_TILES = ['Google Form', 'Facebook Messenger', 'Walk-in', 'Tawag o Text'];
const BRANCH_NAMES = ['E2E Sub-branch A', 'E2E Sub-branch B', 'E2E Sub-branch C'];

// ---------------------------------------------------------------------------
// Fictional users, branches and applications
// ---------------------------------------------------------------------------

const ROLES = {
  ADM: { id: 1, name: 'ADMIN', code: 'ADM' },
  PROC: { id: 3, name: 'PROCESSING', code: 'PROC' },
  OWN: { id: 5, name: 'OWNER', code: 'OWN' },
  CALLCTR: { id: 8, name: 'CALL_CENTER', code: 'CALLCTR' },
} as const;

type RoleCode = keyof typeof ROLES;

/**
 * Every user has a home branch among the choices, as real accounts do: Sub-branch B
 * for the roles that may choose any branch (Call Center, Owner, Admin), which must
 * still start with none picked, and Sub-branch A for Processing staff, who start on it.
 */
async function signedInAs(page: Page, backend: FakeBackend, code: RoleCode): Promise<void> {
  const role = ROLES[code];
  backend.user = {
    ...(code === 'PROC' ? fakeUser([9101]) : fakeUser([], 9102)),
    name: `E2E ${role.name}`,
    email: `e2e.${code.toLowerCase()}@example.test`,
    role_id: role.id,
    role,
  };
  await page.addInitScript(
    ([user, token]) => {
      localStorage.setItem('authStore', JSON.stringify({ state: { user, authToken: token }, version: 0 }));
    },
    [backend.user, FAKE_TOKEN] as const,
  );
}

/** getApplicationBranches: all three fictional sub-branches, ids and names only. */
const APPLICATION_BRANCHES = BRANCH_SUBS.map(({ id, name }) => ({ id, name }));

const row = (id: string, fullName: string, channel: string | null) => ({
  id, source: channel === 'google_form' ? 'google_form' : 'manual', channel,
  submitted_at: '2026-09-30 09:15:00', location: null, branch_sub: { id: '9101', name: 'E2E Sub-branch A' },
  status: 'for_interview', full_name: fullName, contact_no: `0917000006${id}`,
  amount_applied: '15000.00', purpose: 'Store capital', intake_flags: [],
});

const LIST_ROWS = [
  row('1', 'E2E Applicant One', 'google_form'),
  row('2', 'E2E Applicant Two', 'facebook'),
  row('3', 'E2E Applicant Three', 'walk_in'),
  row('4', 'E2E Applicant Four', 'phone'),
  row('5', 'E2E Applicant Five', null),
];

const SAVED: GraphqlBody = { data: { createLoanApplication: { id: '501' } } };
const REFUSAL = 'You cannot add an application to that branch.';

/** The list, the branch choices and the save, answered here. */
function stubApplications(backend: FakeBackend, save: () => GraphqlBody = () => SAVED): void {
  backend.extraGraphql.set('getApplicationBranches', () => ({ data: { getApplicationBranches: APPLICATION_BRANCHES } }));
  backend.extraGraphql.set('createLoanApplication', save);
  backend.extraGraphql.set('getLoanApplications', () => ({
    data: {
      getLoanApplications: {
        data: LIST_ROWS,
        paginatorInfo: { total: LIST_ROWS.length, currentPage: 1, lastPage: 1, hasMorePages: false },
      },
    },
  }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Open /applications/new and wait for the form, its picklists and this role's tiles. */
async function openNewApplication(page: Page, tiles = ALL_TILES.length): Promise<Locator> {
  // The dev server compiles a route on its first visit.
  await page.goto('/applications/new', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  const form = page.locator('form:has(input[name="firstname"])');
  await expect(form.locator('input[name="firstname"]')).toBeVisible({ timeout: 90_000 });
  await expect(selectControl(form, 'chief_id')).toBeVisible();
  // Saan galing reads the role after mount, so wait for this role's tiles.
  await expect(form.getByRole('radio')).toHaveCount(tiles);
  return form;
}

/** A Saan galing tile, clicked as staff do (the radio itself is visually hidden). */
const tile = (form: Locator, name: string): Locator => form.locator('fieldset label').filter({ hasText: name });
const radio = (form: Locator, name: string): Locator => form.getByRole('radio', { name, exact: true });

/** The basics as typed. */
const TYPED = {
  firstname: 'Juana',
  lastname: 'Dela Cruz',
  contact_no: '09170000051',
  amount_applied: '15000',
  purpose: 'Store capital',
};

/** The basics as the form holds them: a number field keeps its displayed text once it loses focus. */
const HELD = { ...TYPED, amount_applied: '15,000' };

async function fillBasics(form: Locator): Promise<void> {
  for (const [name, value] of Object.entries(TYPED)) {
    await form.locator(`input[name="${name}"]`).fill(value);
  }
  await tile(form, 'Facebook Messenger').click();
  await pick(form, 'branch_sub_id', 'E2E Sub-branch B');
}

// ---------------------------------------------------------------------------
// 1. The list
// ---------------------------------------------------------------------------

test('1. the list shows New application, which opens /applications/new, and each row\'s Saan galing', async ({ page, backend }) => {
  stubApplications(backend);
  await signedInAs(page, backend, 'CALLCTR');
  await page.goto('/applications', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await expect(page.getByText(`${LIST_ROWS.length} applications`, { exact: true })).toBeVisible({ timeout: 90_000 });

  const nameCell = (name: string) => page.getByRole('cell', { name });
  await expect(nameCell('E2E Applicant One')).toContainText('Google Form');
  await expect(nameCell('E2E Applicant Two')).toContainText('Messenger');
  await expect(nameCell('E2E Applicant Three')).toContainText('Walk-in');
  await expect(nameCell('E2E Applicant Four')).toContainText('Tawag/Text');
  await expect(nameCell('E2E Applicant Five')).toHaveText('E2E Applicant Five');

  const link = page.getByRole('link', { name: 'New application', exact: true });
  await expect(link).toHaveAttribute('href', '/applications/new');
  await link.click();

  await expect(page).toHaveURL(`${APP}/applications/new`, { timeout: 90_000 });
  await expect(page.getByRole('heading', { name: 'New application', exact: true })).toBeVisible({ timeout: 90_000 });
});

// ---------------------------------------------------------------------------
// 2. Only the basics
// ---------------------------------------------------------------------------

test('2. an empty Save flags exactly the basics, the branch and Saan galing, and posts nothing', async ({ page, backend }) => {
  stubApplications(backend);
  await signedInAs(page, backend, 'CALLCTR');
  const form = await openNewApplication(page);

  expect(await submitAndReadErrors(form)).toEqual({
    firstname: REQUIRED,
    lastname: REQUIRED,
    contact_no: REQUIRED,
    amount_applied: REQUIRED,
    purpose: REQUIRED,
    branch_sub_id: 'Branch is required',
    channel: CHANNEL_ERROR,
  });
  // FormLabel takes no `for`, so the harness names the Branch label by its text.
  expect(await requiredMarks(form)).toEqual(['(unplaced) Branch*', 'amount_applied', 'contact_no', 'firstname', 'lastname', 'purpose']);
  await expect(form.locator('fieldset legend')).toHaveText('Saan galing ang application?*');
  await expect(radio(form, 'Walk-in')).toHaveAccessibleDescription(`Pumunta mismo sa branch ${CHANNEL_ERROR}`);
  // The branch error is drawn in tailwind.config.ts `danger` (#D34053).
  const branchError = form.getByTestId('borrower-branch-picker').locator('p', { hasText: 'Branch is required' });
  expect(await branchError.evaluate((p) => getComputedStyle(p).color)).toBe('rgb(211, 64, 83)');
  expect(backend.calls('createLoanApplication')).toHaveLength(0);
});

// Spaces pass react-hook-form's `required`, and the server would read them as null.
test('2b. a first name of only spaces gets a plain message, and nothing is posted', async ({ page, backend }) => {
  stubApplications(backend);
  await signedInAs(page, backend, 'CALLCTR');
  const form = await openNewApplication(page);

  await fillBasics(form);
  await form.locator('input[name="firstname"]').fill('   ');
  await saveButton(form).click();

  await expect(page.getByRole('alert').filter({ hasText: BLANK_BASICS })).toBeVisible({ timeout: 30_000 });
  expect(backend.calls('createLoanApplication')).toHaveLength(0);
  await expect(page).toHaveURL(`${APP}/applications/new`);
  await expect(form.locator('input[name="lastname"]')).toHaveValue('Dela Cruz');
});

// ---------------------------------------------------------------------------
// 3. What Save posts
// ---------------------------------------------------------------------------

test('3. the basics and Facebook Messenger post exactly toApplicationInput\'s output, then the list says so', async ({ page, backend }) => {
  stubApplications(backend);
  await signedInAs(page, backend, 'CALLCTR');
  const form = await openNewApplication(page);

  await fillBasics(form);
  await saveButton(form).click();

  // The list opens with ?saved=1, says so, and drops the query.
  await expect(page.getByRole('status').filter({ hasText: SAVED_NOTE })).toBeVisible({ timeout: 90_000 });
  await expect(page).toHaveURL(`${APP}/applications`);
  const posted = backend.calls('createLoanApplication');
  expect(posted).toHaveLength(1);
  expect(posted[0].variables).toEqual({ input: toApplicationInput(HELD, 'facebook', '9102') });
  expect(posted[0].variables).toEqual({
    input: {
      channel: 'facebook',
      branch_sub_id: 9102,
      info: { firstname: 'Juana', lastname: 'Dela Cruz', amount_applied: '15000', purpose: 'Store capital' },
      detail: { contact_no: '09170000051' },
    },
  });
  await expect(page.getByText(`${LIST_ROWS.length} applications`, { exact: true })).toBeVisible({ timeout: 90_000 });

  // A refresh does not say it again.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByText(`${LIST_ROWS.length} applications`, { exact: true })).toBeVisible({ timeout: 90_000 });
  await expect(page.getByText(SAVED_NOTE)).toHaveCount(0);
});

// The amount used to reach react-hook-form only on blur, so Enter posted the form's 0.
test('3b. Enter pressed inside the amount, before it is ever left, posts that amount', async ({ page, backend }) => {
  stubApplications(backend);
  await signedInAs(page, backend, 'CALLCTR');
  const form = await openNewApplication(page);

  for (const [name, value] of Object.entries(TYPED)) {
    if (name !== 'amount_applied') await form.locator(`input[name="${name}"]`).fill(value);
  }
  await tile(form, 'Facebook Messenger').click();
  await pick(form, 'branch_sub_id', 'E2E Sub-branch B');
  const amount = form.locator('input[name="amount_applied"]');
  await amount.pressSequentially(TYPED.amount_applied);
  await expect(amount).toHaveValue('15,000');
  await expect(amount).toBeFocused();
  await amount.press('Enter');

  await expect(page.getByRole('status').filter({ hasText: SAVED_NOTE })).toBeVisible({ timeout: 90_000 });
  const posted = backend.calls('createLoanApplication');
  expect(posted).toHaveLength(1);
  expect(posted[0].variables).toEqual({ input: toApplicationInput(TYPED, 'facebook', '9102') });
});

// ---------------------------------------------------------------------------
// 4. No photo, no Check Borrower
// ---------------------------------------------------------------------------

test('4. no photo and no Check Borrower button, under "Name & Contact"', async ({ page, backend }) => {
  stubApplications(backend);
  await signedInAs(page, backend, 'CALLCTR');
  const form = await openNewApplication(page);

  await expect(form.getByRole('img', { name: 'profile' })).toHaveCount(0);
  await expect(form.locator('input#photo')).toHaveCount(0);
  await expect(form.getByRole('button', { name: 'Check Borrower' })).toHaveCount(0);
  expect(await form.locator('h3').allTextContents()).toEqual([
    'Name & Contact',
    'Borrower Information',
    'Borrower Details',
    'Work Background',
    'References',
    'Company Information',
  ]);
  await expect(page.getByRole('link', { name: 'Back to Applications' })).toHaveAttribute('href', '/applications');
});

// ---------------------------------------------------------------------------
// 5. Branch choices
// ---------------------------------------------------------------------------

test('5. the branch picker offers exactly what getApplicationBranches returned, with none picked for Call Center', async ({ page, backend }) => {
  stubApplications(backend);
  await signedInAs(page, backend, 'CALLCTR');
  const form = await openNewApplication(page);

  await expect(form.getByRole('combobox', { name: 'Branch' })).toBeVisible();
  expect(await optionsOf(form, 'branch_sub_id')).toEqual(BRANCH_NAMES);
  // The choices are in, and Call Center's home branch (Sub-branch B) is one of them: still none picked.
  expect(await selectedText(form, 'branch_sub_id')).toBe('');
  await expect(selectControl(form, 'branch_sub_id').locator('.react-select__placeholder'))
    .toHaveText('Select the branch for this application...');
  expect(backend.calls('getMyAccessibleBranchSubs')).toHaveLength(0);
});

// ---------------------------------------------------------------------------
// 6. A refusal
// ---------------------------------------------------------------------------

test('6. a server refusal shows its message, the form keeps its values, and Back does not claim a save', async ({ page, backend }) => {
  stubApplications(backend, () => ({
    data: { createLoanApplication: null },
    errors: [{ message: REFUSAL, extensions: { category: 'graphql' } }],
  }));
  await signedInAs(page, backend, 'CALLCTR');
  const form = await openNewApplication(page);

  await fillBasics(form);
  await saveButton(form).click();

  await expect(page.getByRole('alert').filter({ hasText: REFUSAL })).toBeVisible({ timeout: 30_000 });
  expect(backend.calls('createLoanApplication')).toHaveLength(1);
  await expect(page).toHaveURL(`${APP}/applications/new`);
  for (const [name, value] of Object.entries(HELD)) {
    await expect(form.locator(`input[name="${name}"]`)).toHaveValue(value);
  }
  await expect(radio(form, 'Facebook Messenger')).toBeChecked();
  expect(await selectedText(form, 'branch_sub_id')).toBe('E2E Sub-branch B');
  await expect(saveButton(form)).toBeEnabled();

  await form.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByText(`${LIST_ROWS.length} applications`, { exact: true })).toBeVisible({ timeout: 90_000 });
  await expect(page).toHaveURL(`${APP}/applications`);
  await expect(page.getByText(SAVED_NOTE)).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// 7. Phones
// ---------------------------------------------------------------------------

test('7. at 360px nothing scrolls sideways, and every tile, field and the new controls are 48px or taller', async ({ page, backend }) => {
  stubApplications(backend);
  await page.setViewportSize({ width: 360, height: 800 });
  await signedInAs(page, backend, 'CALLCTR');
  const form = await openNewApplication(page);

  expect(await sidewaysScroll(page), 'New application scrolled sideways at 360px').toBeLessThanOrEqual(0);
  const short = (await fieldHeights(form)).filter(({ height }) => height < 48);
  expect(short, 'fields under 48px at 360px').toEqual([]);
  const tiles = form.locator('fieldset label');
  await expect(tiles).toHaveCount(4);
  for (const box of await tiles.all()) {
    expect((await box.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(48);
  }
  const back = page.getByRole('link', { name: 'Back to Applications' });
  expect((await back.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(48);

  await back.click();
  await expect(page.getByText(`${LIST_ROWS.length} applications`, { exact: true })).toBeVisible({ timeout: 90_000 });
  expect(await sidewaysScroll(page), 'the list scrolled sideways at 360px').toBeLessThanOrEqual(0);
  const newApplication = page.getByRole('link', { name: 'New application', exact: true });
  expect((await newApplication.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(48);

  // New application is the one filled primary action: Upload is outlined in the primary colour.
  const upload = page.getByRole('button', { name: 'Upload Google Form responses', exact: true });
  expect((await upload.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(48);
  const primary = await newApplication.evaluate((link) => getComputedStyle(link).backgroundColor);
  const uploadColours = await upload.evaluate((button) => {
    const style = getComputedStyle(button);
    return { fill: style.backgroundColor, border: style.borderTopColor, text: style.color };
  });
  expect(uploadColours.fill, 'Upload is filled like the primary action').not.toBe(primary);
  expect({ border: uploadColours.border, text: uploadColours.text }).toEqual({ border: primary, text: primary });
});

// ---------------------------------------------------------------------------
// 8. Keyboard
// ---------------------------------------------------------------------------

test('8. Tab reaches the tiles as one stop, the arrow keys change the choice, and each tile is named', async ({ page, backend }) => {
  stubApplications(backend);
  await signedInAs(page, backend, 'CALLCTR');
  const form = await openNewApplication(page);

  for (const name of ALL_TILES) await expect(radio(form, name)).toHaveCount(1);
  await expect(radio(form, 'Facebook Messenger')).toHaveAccessibleDescription('Nag-message sa FB page');

  // Email is the last field before Borrower Information, whose first field is Saan galing.
  await form.locator('input[name="email"]').focus();
  await page.keyboard.press('Tab');
  await expect(radio(form, 'Google Form')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(radio(form, 'Facebook Messenger')).toBeFocused();
  await expect(radio(form, 'Facebook Messenger')).toBeChecked();
  await page.keyboard.press('ArrowRight');
  await expect(radio(form, 'Walk-in')).toBeChecked();
  await page.keyboard.press('ArrowLeft');
  await expect(radio(form, 'Facebook Messenger')).toBeChecked();
  await expect(radio(form, 'Walk-in')).not.toBeChecked();
  // One Tab leaves the group, for the branch picker.
  await page.keyboard.press('Tab');
  await expect(form.getByRole('combobox', { name: 'Branch' })).toBeFocused();
});

// ---------------------------------------------------------------------------
// 9. Google Form by role
// ---------------------------------------------------------------------------

test.describe('9. Google Form and any branch only for Call Center, Owner and Admin', () => {
  for (const code of ['CALLCTR', 'OWN', 'ADM'] as const) {
    test(`${code}: four tiles, Google Form first, and no branch picked although the home branch is a choice`, async ({ page, backend }) => {
      stubApplications(backend);
      await signedInAs(page, backend, code);
      const form = await openNewApplication(page);

      expect(await form.getByRole('radio').evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value)))
        .toEqual(['google_form', 'facebook', 'walk_in', 'phone']);
      expect(await optionsOf(form, 'branch_sub_id')).toEqual(BRANCH_NAMES);
      expect(await selectedText(form, 'branch_sub_id')).toBe('');
    });
  }

  test('branch staff (Processing) get three, without Google Form, on their home branch', async ({ page, backend }) => {
    stubApplications(backend);
    await signedInAs(page, backend, 'PROC');
    const form = await openNewApplication(page, 3);

    for (const name of ['Facebook Messenger', 'Walk-in', 'Tawag o Text']) await expect(radio(form, name)).toHaveCount(1);
    await expect(radio(form, 'Google Form')).toHaveCount(0);
    await expect(tile(form, 'Google Form')).toHaveCount(0);
    await expect.poll(() => selectedText(form, 'branch_sub_id')).toBe('E2E Sub-branch A');
  });
});

// ---------------------------------------------------------------------------
// 10. Branches that fail to load
// ---------------------------------------------------------------------------

test('10. a branch list that fails to load says so, and Retry loads it', async ({ page, backend }) => {
  stubApplications(backend);
  let failNext = true;
  backend.extraGraphql.set('getApplicationBranches', () => {
    if (failNext) return { data: null, errors: [{ message: 'Could not load branches.' }] };
    return { data: { getApplicationBranches: APPLICATION_BRANCHES } };
  });
  await signedInAs(page, backend, 'CALLCTR');
  const form = await openNewApplication(page);

  const alert = page.getByRole('alert').filter({ hasText: 'Could not load branches.' });
  await expect(alert).toBeVisible();
  failNext = false;
  await alert.getByRole('button', { name: 'Retry' }).click();

  await expect(alert).toHaveCount(0);
  expect(await optionsOf(form, 'branch_sub_id')).toEqual(BRANCH_NAMES);
});

// ---------------------------------------------------------------------------
// 11. The branch picker takes its ref
// ---------------------------------------------------------------------------

test('11. the branch picker takes the ref react-hook-form gives it: no ref warning, and a missing branch gets the cursor', async ({ page, backend }) => {
  const refWarnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('cannot be given refs')) refWarnings.push(message.text());
  });
  stubApplications(backend);
  await signedInAs(page, backend, 'CALLCTR');
  const form = await openNewApplication(page);
  expect(await optionsOf(form, 'branch_sub_id')).toEqual(BRANCH_NAMES);
  // React logs the warning when the picker mounts with the ref.
  expect(refWarnings).toEqual([]);

  for (const [name, value] of Object.entries(TYPED)) await form.locator(`input[name="${name}"]`).fill(value);
  await tile(form, 'Facebook Messenger').click();
  await saveButton(form).click();

  await expect(form.getByRole('combobox', { name: 'Branch' })).toBeFocused();
  expect(backend.calls('createLoanApplication')).toHaveLength(0);
});
