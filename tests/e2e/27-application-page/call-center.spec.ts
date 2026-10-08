/**
 * Call Center (CALLCTR, role 8) and the server, stubbed.
 *
 * The server answers a Call Center account only the Applications pages' own calls, and refuses
 * everything else with "This is not available to Call Center accounts.", which the UI shows as a
 * toast. A Call Center user must never see that toast, so:
 *
 *   1. THE CONTRACT. Signed in as Call Center, the tests walk /applications (list, upload,
 *      paste), /applications/new (save), /applications/<id> (load, save, Save status, print) and
 *      /applications/tracker, and sign in. Every GraphQL root field the pages ask for is in
 *      ALLOWED_GRAPHQL and every request to the REST API is in ALLOWED_REST. The two lists MIRROR
 *      the backend's App\Support\CallCenterAllowList: change them together. The fake plays that
 *      server, too: a field outside the list is refused with the server's sentence, so a page
 *      that asked would show the toast, and every walk checks there is none.
 *   2. KEPT ON /applications. Opening /, /borrowers/12, /borrowers, /loans-list, /users-setup or
 *      the sign-in page, or following the Dashboard breadcrumb or the phone header's logo, ends
 *      on /applications and asks for nothing outside the list: CallCenterGuard (in the root
 *      layout) never mounts the page it bounces Call Center from, and some of those pages ask
 *      for their data in their own effects, outside DefaultLayout and withAuth. The maintenance
 *      page is the one other page Call Center stays on. (A path with no page at all, such as
 *      /loans, is bounced too, with one recoverable hydration warning in the console, so it is
 *      not walked here.)
 *   3. A converted application has no link to the borrower for Call Center (the borrower's page
 *      is not its to open), and still has it for the Owner.
 *
 * NO CREDENTIALS AND NO BACKEND: see applicationPageHarness.ts. The REST routes the walks reach
 * (sign-in, the upload, the paste, the printed PDF) are answered here, in front of the harness.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/27-application-page/call-center.spec.ts --reporter=line
 */
import type { Page, Route } from '@playwright/test';
import {
  APP,
  BACKEND,
  FAKE_TOKEN,
  application,
  expect,
  fakeUser,
  field,
  openApplication,
  pickBranch,
  rootField,
  saveButton,
  signedInAs,
  statusSelect,
  test as harness,
  toolbar,
} from './applicationPageHarness';

// ---------------------------------------------------------------------------
// The contract
// ---------------------------------------------------------------------------

/** The GraphQL root fields a Call Center account may ask for. MIRRORS App\Support\CallCenterAllowList (backend). */
const ALLOWED_GRAPHQL: ReadonlySet<string> = new Set([
  'maintenance',
  'getLoanApplications',
  'getApplicationBranches',
  'getLoanApplication',
  'getApplicationSourceCounts',
  'getChief',
  'getAreas',
  'getOneSubArea',
  'getBorrCompanies',
  'createLoanApplication',
  'updateLoanApplication',
  'setLoanApplicationStatus',
  'printLoanApplication',
  // The header bell's Applications items, and the repeat-applicant check on an application (2026-10-05).
  'getApplicationNotifications',
  'getLoanApplicationBorrowerMatch',
  // The Source tracker's applicant funnel (2026-10-05, spec applicant-funnel-design).
  'getApplicationFunnel',
]);

/** The requests to the REST API a Call Center account may make, as "METHOD /path". MIRRORS the same backend list. */
const ALLOWED_REST: RegExp[] = [
  /^GET \/api\/user$/,
  /^POST \/api\/login$/,
  /^POST \/api\/applications\/(upload|paste|pdf)$/,
  /^GET \/api\/pdf\/.+/,
];

/** What the server says to a Call Center account for anything outside the list. */
const NOT_AVAILABLE = 'This is not available to Call Center accounts.';

// ---------------------------------------------------------------------------
// What the walks see: every request, in front of the harness
// ---------------------------------------------------------------------------

interface Seen {
  /** Every GraphQL root field asked for, in order, allowed or not. */
  graphql: string[];
  /** Every other request to the backend (the CORS preflights apart), as "METHOD /path". */
  rest: string[];
}

/** A cross-origin response (3000 -> 8080) must allow the page's origin. */
const CORS = { 'Access-Control-Allow-Origin': APP, 'Access-Control-Allow-Credentials': 'true' };

const reply = (route: Route, body: unknown): Promise<void> =>
  route.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });

/** What POST /api/applications/upload, /paste and /pdf answer: one new applicant. */
const ADDED_ONE = { status: true, added: 1, already_here: 0, skipped: [], flagged: [] };

/** The printed PDF, which a headless browser would download instead of showing: a page stands in. */
const PRINTED_PAGE = '<!doctype html><title>E2E printed application</title><p>E2E printed application</p>';

/** The signed link printLoanApplication answers: relative, and under /api/pdf, as the server's is. */
const PRINT_LINK = '/api/pdf/loan-application?application_id=2&signature=e2e';

const test = harness.extend<{ seen: Seen }>({
  seen: async ({ context, backend }, use) => {
    const seen: Seen = { graphql: [], rest: [] };
    backend.overrides.set('printLoanApplication', () => ({ data: { printLoanApplication: PRINT_LINK } }));

    // Registered after the harness's own, so it sees every request first; what it does not answer it passes on.
    await context.route(`${BACKEND}/**`, async (route) => {
      const request = route.request();
      const method = request.method();
      const path = new URL(request.url()).pathname;
      if (method === 'OPTIONS') return route.fallback();

      if (path === '/fuerte-api') {
        const field = rootField(request.postDataJSON()?.query ?? '');
        seen.graphql.push(field);
        return ALLOWED_GRAPHQL.has(field) ? route.fallback() : reply(route, { errors: [{ message: NOT_AVAILABLE }] });
      }

      seen.rest.push(`${method} ${path}`);
      if (method === 'POST' && path === '/api/login') {
        return reply(route, { message: 'Success', user: backend.user, token: FAKE_TOKEN });
      }
      if (method === 'POST' && /^\/api\/applications\/(upload|paste|pdf)$/.test(path)) return reply(route, ADDED_ONE);
      if (method === 'GET' && path.startsWith('/api/pdf/')) {
        return route.fulfill({ status: 200, contentType: 'text/html', headers: CORS, body: PRINTED_PAGE });
      }
      return route.fallback();
    });

    await use(seen);
  },
});

test.setTimeout(180_000);

const distinct = (names: string[]): string[] => Array.from(new Set(names));

/** Nothing outside the lists was asked for. */
function expectInsideTheLists(seen: Seen): void {
  expect(distinct(seen.graphql.filter((name) => !ALLOWED_GRAPHQL.has(name))), 'GraphQL fields outside the Call Center allow-list').toEqual([]);
  expect(
    distinct(seen.rest.filter((request) => !ALLOWED_REST.some((allowed) => allowed.test(request)))),
    'REST requests outside the Call Center allow-list',
  ).toEqual([]);
}

/**
 * The walk really asked for these, so a page that stopped asking cannot pass the contract by asking for nothing.
 * Polled: a page draws its controls before its first request has gone out.
 */
async function expectAsked(seen: Seen, graphql: string[], rest: string[] = []): Promise<void> {
  await expect.poll(() => seen.graphql, { timeout: 30_000 }).toEqual(expect.arrayContaining(graphql));
  await expect.poll(() => seen.rest, { timeout: 30_000 }).toEqual(expect.arrayContaining(rest));
}

/** The refusal above, or any other failure, would show as a toast. */
const expectNoErrorToast = (page: Page) => expect(page.locator('.Toastify__toast--error')).toHaveCount(0);

/** The list's own controls: it has loaded. */
const statusFilter = (page: Page) => page.getByRole('group', { name: 'Filter applications by status' });

/** Every path the main frame commits, client-side (history API) navigations included. */
function trackPaths(page: Page): string[] {
  const paths: string[] = [];
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) paths.push(new URL(frame.url()).pathname);
  });
  return paths;
}

const gotoPage = (page: Page, path: string) => page.goto(path, { waitUntil: 'domcontentloaded', timeout: 120_000 });

// ---------------------------------------------------------------------------
// 1. The contract: what each page asks for
// ---------------------------------------------------------------------------

const FILE_INPUT_LABEL = 'Google Form responses file (.zip, .csv or .pdf)';
const CSV = 'Timestamp,Full name,Mobile\n9/21/2026 9:15:00,E2E Applicant Four,09170000004\n';
const PASTED_ROWS =
  '29/09/2026 19:17:09\tSample Town, Rizal\tNabasa ko po at sumasang-ayon ako\tFactory Worker\t\t\tE2E Applicant Five\t09170000005';

test.describe('1. The contract: what each page asks for', () => {
  test('the Applications list, an upload and a paste', async ({ page, backend, seen }) => {
    await signedInAs(page, backend, 'CALLCTR');
    await gotoPage(page, '/applications');
    await expect(statusFilter(page)).toBeVisible({ timeout: 90_000 });

    const section = page.getByRole('region', { name: 'Google Form responses' });
    await section.getByLabel(FILE_INPUT_LABEL).setInputFiles({ name: 'responses.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV) });
    await expect(section.getByRole('status')).toContainText('Upload finished', { timeout: 30_000 });

    await section.getByRole('button', { name: 'Paste rows from the Sheet' }).click();
    await section.getByLabel('Rows from the responses Sheet').fill(PASTED_ROWS);
    await section.getByRole('button', { name: 'Add pasted rows' }).click();
    await expect(section.getByRole('status')).toContainText('Paste finished', { timeout: 30_000 });

    await expectAsked(seen, ['maintenance', 'getLoanApplications'], ['GET /api/user', 'POST /api/applications/upload', 'POST /api/applications/paste']);
    expectInsideTheLists(seen);
    await expectNoErrorToast(page);
  });

  test('New application and its save', async ({ page, backend, seen }) => {
    backend.overrides.set('createLoanApplication', () => ({ data: { createLoanApplication: { id: '501' } } }));
    await signedInAs(page, backend, 'CALLCTR');
    await gotoPage(page, '/applications/new');
    await expect(field(page, 'firstname')).toBeVisible({ timeout: 90_000 });
    // Saan galing reads the role after mount: Call Center's four tiles are there when it has.
    await expect(page.getByRole('radio')).toHaveCount(4);

    await field(page, 'firstname').fill('Juana');
    await field(page, 'lastname').fill('Dela Cruz');
    await field(page, 'contact_no').fill('09170000051');
    await field(page, 'amount_applied').fill('15000');
    await field(page, 'purpose').fill('Store capital');
    await page.locator('fieldset label').filter({ hasText: 'Facebook Messenger' }).click();
    await pickBranch(page, 'E2E Sub-branch B');
    await saveButton(page).click();

    await expect(page).toHaveURL(`${APP}/applications`, { timeout: 90_000 });
    await expect(page.getByRole('status').filter({ hasText: 'Na-save ang application.' })).toBeVisible({ timeout: 90_000 });
    await expectAsked(seen, ['getApplicationBranches', 'getChief', 'getAreas', 'getBorrCompanies', 'createLoanApplication', 'getLoanApplications']);
    expectInsideTheLists(seen);
    await expectNoErrorToast(page);
  });

  test('an application: load, save, Save status and print', async ({ page, backend, seen }) => {
    backend.record = application();
    await signedInAs(page, backend, 'CALLCTR');
    await openApplication(page, '2');

    await field(page, 'firstname').fill('E2E Edited');
    await saveButton(page).click();
    await expect(page.getByTestId('save-note')).toHaveAttribute('data-state', 'saved', { timeout: 30_000 });

    await statusSelect(page).selectOption('interviewed');
    await toolbar(page).getByRole('button', { name: 'Save status', exact: true }).click();
    await expect(toolbar(page).getByRole('button', { name: 'Saved', exact: true })).toBeVisible({ timeout: 30_000 });

    const [popup] = await Promise.all([page.waitForEvent('popup'), toolbar(page).getByRole('button', { name: 'Print Application' }).click()]);
    await expect(popup).toHaveURL(`${BACKEND}${PRINT_LINK}`, { timeout: 30_000 });

    await expectAsked(
      seen,
      [
        'getLoanApplication', 'getApplicationBranches', 'getChief', 'getAreas', 'getBorrCompanies', 'updateLoanApplication', 'setLoanApplicationStatus', 'printLoanApplication',
        'getLoanApplicationBorrowerMatch', 'getApplicationNotifications',
      ],
      ['GET /api/user', 'GET /api/pdf/loan-application'],
    );
    expectInsideTheLists(seen);
    await expectNoErrorToast(page);
  });

  test('the Source tracker', async ({ page, backend, seen }) => {
    backend.overrides.set('getApplicationSourceCounts', () => ({
      data: { getApplicationSourceCounts: [{ channel: 'google_form', count: 12 }, { channel: 'facebook', count: 6 }] },
    }));
    const none = Object.fromEntries(
      ['applied', 'became_borrower', 'approved', 'loan_released', 'declined', 'rejected', 'loan_cancelled', 'for_interview', 'interviewed',
        'borrower', 'approved_no_loan', 'loan_in_process', 'rejected_with_loan', 'released_without_approval', 'borrower_deleted'].map((key) => [key, 0]),
    );
    backend.overrides.set('getApplicationFunnel', () => ({ data: { getApplicationFunnel: { total: { ...none, applied: 18 }, by_channel: [] } } }));
    await signedInAs(page, backend, 'CALLCTR');
    await gotoPage(page, '/applications/tracker');
    await expect(page.getByRole('heading', { name: 'Applications by source' })).toBeVisible({ timeout: 90_000 });
    await expect(page.getByText('Total', { exact: true }).locator('xpath=following-sibling::p[1]')).toContainText('18', { timeout: 30_000 });

    await expectAsked(seen, ['getApplicationSourceCounts', 'getApplicationFunnel']);
    expectInsideTheLists(seen);
    await expectNoErrorToast(page);
  });

  test('signing in lands on /applications', async ({ page, backend, seen }) => {
    backend.user = fakeUser('CALLCTR');
    await gotoPage(page, '/auth/signin');
    const email = page.getByPlaceholder('Enter your email');
    await expect(email).toBeVisible({ timeout: 90_000 });
    // Typing before React hydrates is lost: the box keeps the text, the form state stays empty.
    await page.waitForFunction(() => {
      const input = document.querySelector('input[type="email"]');
      return !!input && Object.keys(input).some((key) => key.startsWith('__reactProps'));
    }, undefined, { timeout: 60_000 });
    await email.fill('e2e.signin@example.test');
    await page.getByPlaceholder('6+ Characters, 1 Capital letter').fill('Not-a-real-password-1');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    await expect(page).toHaveURL(`${APP}/applications`, { timeout: 90_000 });
    await expect(statusFilter(page)).toBeVisible({ timeout: 90_000 });
    await expectAsked(seen, ['getLoanApplications'], ['POST /api/login']);
    expectInsideTheLists(seen);
    await expectNoErrorToast(page);
  });
});

// ---------------------------------------------------------------------------
// 2. Kept on /applications
// ---------------------------------------------------------------------------

test.describe('2. Kept on /applications', () => {
  for (const path of ['/', '/borrowers/12', '/borrowers', '/loans-list', '/users-setup', '/auth/signin']) {
    test(`opening ${path} ends on /applications, and the page it bounces from asks for nothing`, async ({ page, backend, seen }) => {
      await signedInAs(page, backend, 'CALLCTR');

      await gotoPage(page, path);

      await expect(page).toHaveURL(`${APP}/applications`, { timeout: 90_000 });
      await expect(statusFilter(page)).toBeVisible({ timeout: 90_000 });
      await expectAsked(seen, ['getLoanApplications']);
      expectInsideTheLists(seen);
      await expectNoErrorToast(page);
    });
  }

  test('with maintenance on, Call Center is sent to /maintenance and stays there: the guard does not send it back', async ({ page, backend, seen }) => {
    backend.overrides.set('maintenance', () => ({ data: { maintenance: { data: { isMaintenanceModeOn: 1 } } } }));
    await signedInAs(page, backend, 'CALLCTR');
    const paths = trackPaths(page);

    await gotoPage(page, '/applications');

    await expect(page.getByRole('heading', { name: 'We\'ll Be Back Soon!' })).toBeVisible({ timeout: 90_000 });
    // A bounce back to /applications would have happened by now, and the maintenance probe would send it here again.
    await page.waitForTimeout(3_000);
    await expect(page).toHaveURL(`${APP}/maintenance`);
    const sinceMaintenance = paths.slice(paths.indexOf('/maintenance'));
    expect(sinceMaintenance.every((path) => path === '/maintenance'), `Call Center was sent back: ${paths.join(' -> ')}`).toBe(true);
    expectInsideTheLists(seen);
  });

  test('the Dashboard breadcrumb on the list leads back to /applications, and the Dashboard asks for nothing', async ({ page, backend, seen }) => {
    await signedInAs(page, backend, 'CALLCTR');
    await gotoPage(page, '/applications');
    await expect(statusFilter(page)).toBeVisible({ timeout: 90_000 });
    const paths = trackPaths(page);

    await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Dashboard' }).click();

    // It did go to / (the link is the way Call Center gets there), and came back.
    await expect.poll(() => paths, { timeout: 90_000 }).toContain('/');
    await expect.poll(() => paths.at(-1), { timeout: 90_000 }).toBe('/applications');
    await expect(statusFilter(page)).toBeVisible({ timeout: 90_000 });
    expectInsideTheLists(seen);
    await expectNoErrorToast(page);
  });

  test('the phone header\'s logo leads back to /applications, and the Dashboard asks for nothing', async ({ page, backend, seen }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await signedInAs(page, backend, 'CALLCTR');
    await gotoPage(page, '/applications');
    await expect(statusFilter(page)).toBeVisible({ timeout: 90_000 });
    const paths = trackPaths(page);

    await page.locator('header').getByRole('link', { name: 'Fuerte home' }).click();

    await expect.poll(() => paths, { timeout: 90_000 }).toContain('/');
    await expect.poll(() => paths.at(-1), { timeout: 90_000 }).toBe('/applications');
    await expect(statusFilter(page)).toBeVisible({ timeout: 90_000 });
    expectInsideTheLists(seen);
    await expectNoErrorToast(page);
  });
});

// ---------------------------------------------------------------------------
// 3. A converted application
// ---------------------------------------------------------------------------

test.describe('3. A converted application', () => {
  const converted = () => application({ status: 'borrower_created', borrower_id: 77 });
  const openTheBorrower = (page: Page) => page.getByRole('link', { name: 'Open the borrower' });

  test('shows Call Center the state, with no link to the borrower', async ({ page, backend, seen }) => {
    backend.record = converted();
    await signedInAs(page, backend, 'CALLCTR');

    await openApplication(page, '2');

    const state = page.getByRole('region', { name: 'Borrower created' });
    await expect(state).toBeVisible();
    await expect(state).toContainText('This application is now a borrower and can no longer be edited.');
    await expect(openTheBorrower(page)).toHaveCount(0);
    await expect(page.locator('main a[href*="/borrowers"]')).toHaveCount(0);
    // The borrower IS linked: this is not the "not linked" state.
    await expect(state).not.toContainText('The borrower is not linked to this application.');
    expectInsideTheLists(seen);
    await expectNoErrorToast(page);
  });

  test('still gives the Owner the link', async ({ page, backend }) => {
    backend.record = converted();
    await signedInAs(page, backend, 'OWN');

    await openApplication(page, '2');

    await expect(page.getByRole('region', { name: 'Borrower created' })).toBeVisible();
    await expect(openTheBorrower(page)).toHaveAttribute('href', '/borrowers/77');
  });
});
