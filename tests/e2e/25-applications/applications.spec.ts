/**
 * Applications page, step 1: the user-facing behaviour.
 *
 *   1. Call Center (CALLCTR) sees one menu, the Applications dropdown (Applications
 *      and Source tracker), is sent back to /applications from any other page, and
 *      can upload.
 *   2. The sidebar carries the Applications dropdown, and its Applications link opens
 *      /applications. One smoke test: every sidebar variant, the open and current-page
 *      rules and Source tracker are tested in tests/e2e/27-application-page.
 *   3. The upload control is shown to Admin, Owner and Call Center only.
 *   4. The status chips send `status` to getLoanApplications, and All sends none.
 *   5. A finished upload shows its tally, the skipped and flagged rows, and
 *      reloads the list.
 *   6. A refused upload shows the server's own message in an alert.
 *   7. Sign-in sends Call Center straight to /applications, everyone else to /.
 *   8. Part 1 borrower-form fixes: Residency reads Own when is_rent is false, and
 *      an existing borrower's first card is "Name & Contact".
 *   9. Rows pasted from the responses Sheet go to /applications/paste exactly as
 *      pasted, tabs and line breaks included, and show the tally as "Paste finished".
 *      The upload button ignores clicks while they are being added, and a Cancel
 *      pressed meanwhile keeps focus where staff move it. A refused paste reads
 *      "Paste failed". A 401 on either JSON endpoint ends the session.
 *  10. One response saved as a PDF is read in the browser: only its answers go to
 *      /applications/pdf, never the file, and a second PDF in the same visit is read
 *      too. A PDF that is not a response, a damaged one and one longer than 20 pages
 *      show the reader's message and send nothing, and a read that stalls is given
 *      up after a minute (on a faked clock) with the worker replaced. The PDFs are
 *      drawn in the test with jsPDF from the fictional layout in googleFormFixture.ts.
 *  11. The list opens an application: the Name is a link to /applications/<id>, reachable
 *      by Tab and shown with a focus ring, and a click anywhere else in the row (text, the
 *      channel line and its icon, the status pill, the flag mark) opens the same page, unless
 *      text is selected (a drag to copy a number) and, with ctrl or cmd held, in a new tab.
 *      A ctrl-click on the link is left to the browser. The page itself is tested in
 *      tests/e2e/27-application-page; here only the URL is asserted.
 *
 *  12. What an upload, a paste or a PDF just added can be opened from its result: one new
 *      application gets a link ("Open the new application: #000228 NAME", the name in
 *      capitals), two to five a short list, newest first, and more than five the newest five
 *      and "and N more at the top of the list." Nothing new, no field, or an entry that is
 *      not a usable one: no link. The links are reachable by keyboard, show a focus ring and
 *      are 48px tall on a phone.
 *
 * NO CREDENTIALS AND NO BACKEND. Auth on this app is client side: withAuth and
 * DefaultLayout read the persisted zustand store (localStorage 'authStore'), and
 * withAuth probes GET /api/user. The tests seed a made-up token and a fictional
 * user, and answer every request to the backend origin themselves. A request no
 * stub answers is aborted, so it never reaches the API, and fails the test.
 * Nothing is read from or written to the database.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/25-applications --reporter=list
 */
import { test as base, expect, Locator, Page, Route } from '@playwright/test';
import { NOT_A_FORM_MESSAGE } from '../../../src/utils/googleFormPdf/layout';
import { FIXTURE_ANSWERS, loadLayout, tickOther } from './googleFormFixture';
import { layoutToPdf, plainPdf } from './googleFormPdfFile';

const APP = 'http://localhost:3000';
/** Where the dev build points: NEXT_PUBLIC_API_URL=<BACKEND>/api, NEXT_PUBLIC_API_GRAPHQL=<BACKEND>/fuerte-api. */
const BACKEND = 'http://localhost:8080';
const FAKE_TOKEN = 'e2e-fake-token';
const FAKE_LOGIN = { email: 'e2e.signin@example.test', password: 'Not-a-real-password-1' };

const UPLOAD_BUTTON = 'Upload Google Form responses';
const FILE_INPUT_LABEL = 'Google Form responses file (.zip, .csv or .pdf)';
const PASTE_TOGGLE = 'Paste rows from the Sheet';
const PASTE_BOX_LABEL = 'Rows from the responses Sheet';
/** Two fictional rows as the Sheet copies them: tab between cells, empty cells kept, a line per row. */
const PASTED_ROWS = [
  '29/09/2026 19:17:09\tSample Town, Rizal\tNabasa ko po at sumasang-ayon ako\tFactory Worker\t\t\tE2E Applicant Five\t09170000005',
  '29/09/2026 19:20:41\tSample Town, Rizal\tNabasa ko po at sumasang-ayon ako\tEmpleyado sa pribadong kompanya\t\t\tE2E Applicant Six\t09170000006\t',
].join('\n');
const CSV = 'Timestamp,Full name,Mobile\n9/21/2026 9:15:00,E2E Applicant Four,09170000004\n';

// ---------------------------------------------------------------------------
// Fictional users. Role ids and names mirror the roles table.
// ---------------------------------------------------------------------------

type RoleCode = 'ADM' | 'OWN' | 'ACCTG' | 'PROC' | 'CALLCTR';

const ROLES: Record<RoleCode, { id: number; name: string }> = {
  ADM: { id: 1, name: 'ADMIN' },
  PROC: { id: 3, name: 'PROCESSING' },
  ACCTG: { id: 4, name: 'ACCOUNTING' },
  OWN: { id: 5, name: 'OWNER' },
  CALLCTR: { id: 8, name: 'CALL_CENTER' },
};

/** The shape /api/login returns: the user with `role` and `branch_sub` loaded. */
const fakeUser = (code: RoleCode) => {
  const role = ROLES[code];
  return {
    id: 90000 + role.id,
    name: `E2E ${role.name.replace('_', ' ')}`,
    email: `e2e.${code.toLowerCase()}@example.test`,
    role_id: role.id,
    role: { id: role.id, name: role.name, code },
    branch_sub_id: null,
    branch_sub: null,
    assignedBranchSubIds: [],
  };
};

// ---------------------------------------------------------------------------
// Fictional applications.
// ---------------------------------------------------------------------------

const APPLICATIONS = [
  {
    id: '1', source: 'google_form', submitted_at: '2026-09-21 09:15:00', location: 'Marikina',
    branch_sub: null, status: 'for_interview', full_name: 'E2E Applicant One',
    contact_no: '09170000001', amount_applied: '15000.00', purpose: 'Store capital', intake_flags: [],
    outcome: 'for_interview', outcome_label: 'Waiting for interview', decline_reason: null,
  },
  {
    id: '2', source: 'google_form', submitted_at: '2026-09-22 14:40:00', location: 'Pasig',
    branch_sub: { id: '1', name: 'E2E Sub-branch' }, status: 'interviewed', full_name: 'E2E Applicant Two',
    contact_no: '09170000002', amount_applied: '20000.00', purpose: 'Tuition',
    intake_flags: ['Amount is above the usual limit'],
    outcome: 'interviewed', outcome_label: 'Interviewed', decline_reason: null,
  },
  {
    id: '3', source: 'manual', submitted_at: '2026-09-23 10:05:00', location: null,
    branch_sub: { id: '1', name: 'E2E Sub-branch' }, status: 'declined', full_name: 'E2E Applicant Three',
    contact_no: '09170000003', amount_applied: '5000.00', purpose: 'Medical', intake_flags: [],
    outcome: 'declined', outcome_label: 'Declined', decline_reason: 'E2E: hindi maabot',
  },
];

// ---------------------------------------------------------------------------
// The fake backend: answers every request to BACKEND, records what it was sent.
// ---------------------------------------------------------------------------

interface GraphqlCall {
  field: string;
  variables: Record<string, unknown>;
}

interface UploadCall {
  contentType: string;
  authorization: string;
  body: string;
}

/** A JSON POST to /api/applications/paste or /api/applications/pdf. */
interface JsonPost {
  path: string;
  contentType: string;
  authorization: string;
  body: unknown;
}

const NOTHING_NEW = { status: true, added: 0, already_here: 0, skipped: [], flagged: [] };

/** A cross-origin response (3000 -> 8080) must allow the page's origin, with credentials for /login. */
const CORS = { 'Access-Control-Allow-Origin': APP, 'Access-Control-Allow-Credentials': 'true' };

/** The first field of the operation's selection set: "getLoanApplications", "maintenance", ... */
const rootField = (query: string): string =>
  query.slice(query.indexOf('{') + 1).match(/^\s*([A-Za-z_]\w*)/)?.[1] ?? '(unparsed)';

class FakeBackend {
  /** Who GET /api/user says is signed in. */
  user: ReturnType<typeof fakeUser> | null = null;
  /** Who POST /api/login signs in. */
  loginRole: RoleCode = 'CALLCTR';
  /** What POST /api/applications/upload answers. */
  upload: { status: number; body: unknown } = { status: 200, body: NOTHING_NEW };
  /** What POST /api/applications/paste and /api/applications/pdf answer. */
  paste: { status: number; body: unknown } = { status: 200, body: NOTHING_NEW };
  pdf: { status: number; body: unknown } = { status: 200, body: NOTHING_NEW };
  /** When set, the paste answer waits for this, so a test can look at the page mid-paste. */
  pasteHold: Promise<void> | null = null;
  /** Extra GraphQL answers by root field, for pages beyond /applications. */
  readonly extraGraphql = new Map<string, (variables: Record<string, unknown>) => unknown>();

  readonly graphql: GraphqlCall[] = [];
  readonly uploads: UploadCall[] = [];
  readonly jsonPosts: JsonPost[] = [];
  readonly logins: unknown[] = [];
  readonly unstubbed: string[] = [];
  readonly pageErrors: string[] = [];

  applicationCalls(): GraphqlCall[] {
    return this.graphql.filter((call) => call.field === 'getLoanApplications');
  }

  async handle(route: Route): Promise<void> {
    const request = route.request();
    const method = request.method();
    const path = new URL(request.url()).pathname;

    if (method === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: {
          ...CORS,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] ?? '*',
        },
      });
    }
    if (method === 'GET' && path === '/api/user') {
      return json(route, 200, this.user ?? { id: 0 });
    }
    if (method === 'POST' && path === '/api/login') {
      this.logins.push(request.postDataJSON());
      this.user = fakeUser(this.loginRole);
      return json(route, 200, { message: 'Success', user: this.user, token: FAKE_TOKEN });
    }
    if (method === 'POST' && path === '/api/applications/upload') {
      const headers = request.headers();
      this.uploads.push({
        contentType: headers['content-type'] ?? '',
        authorization: headers['authorization'] ?? '',
        body: request.postDataBuffer()?.toString('latin1') ?? '',
      });
      return json(route, this.upload.status, this.upload.body);
    }
    if (method === 'POST' && (path === '/api/applications/paste' || path === '/api/applications/pdf')) {
      const headers = request.headers();
      this.jsonPosts.push({
        path,
        contentType: headers['content-type'] ?? '',
        authorization: headers['authorization'] ?? '',
        body: request.postDataJSON(),
      });
      const reply = path.endsWith('/paste') ? this.paste : this.pdf;
      if (path.endsWith('/paste') && this.pasteHold) await this.pasteHold;
      return json(route, reply.status, reply.body);
    }
    if (method === 'POST' && path === '/fuerte-api') {
      const { query = '', variables = {} } = request.postDataJSON() ?? {};
      const field = rootField(query);
      this.graphql.push({ field, variables: variables ?? {} });
      return json(route, 200, { data: this.graphqlData(field, variables ?? {}) });
    }

    this.unstubbed.push(`${method} ${request.url()}`);
    return route.abort('blockedbyclient');
  }

  private graphqlData(field: string, variables: Record<string, unknown>): unknown {
    const extra = this.extraGraphql.get(field);
    if (extra) return extra(variables);
    switch (field) {
      case 'getLoanApplications': {
        const rows = variables.status ? APPLICATIONS.filter((row) => row.status === variables.status) : APPLICATIONS;
        return {
          getLoanApplications: {
            data: rows,
            paginatorInfo: { total: rows.length, currentPage: 1, lastPage: 1, hasMorePages: false },
          },
        };
      }
      // The root layout's probe on every page: never in maintenance.
      case 'maintenance':
        return { maintenance: { data: { isMaintenanceModeOn: 0 } } };
      // The approval bell, for approver roles.
      case 'pendingDeletionRequestsForMe':
        return { pendingDeletionRequestsForMe: [] };
      // The bell's Applications items, for Processing and Call Center: nothing.
      case 'getApplicationNotifications':
        return { getApplicationNotifications: [] };
      default:
        return {};
    }
  }
}

const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });

const test = base.extend<{ backend: FakeBackend }>({
  backend: async ({ page }, use) => {
    const backend = new FakeBackend();
    page.on('pageerror', (error) => backend.pageErrors.push(error.message));
    await page.route(`${BACKEND}/**`, (route) => backend.handle(route));
    // Next rewrites these two paths on :3000 to the backend, server side.
    for (const proxied of ['/storage/**', '/api/pdf/**']) {
      await page.route(`${APP}${proxied}`, (route) => {
        backend.unstubbed.push(`${route.request().method()} ${route.request().url()}`);
        return route.abort('blockedbyclient');
      });
    }

    await use(backend);

    const problems = [
      ...backend.unstubbed.map((request) => `request to the backend that no stub answered: ${request}`),
      ...backend.pageErrors.map((error) => `uncaught error in the page: ${error}`),
    ];
    if (problems.length) throw new Error(problems.join('\n'));
  },
});

test.setTimeout(180_000);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Seed the persisted auth store before any app code runs. The token is made up. */
async function signedInAs(page: Page, backend: FakeBackend, code: RoleCode): Promise<void> {
  backend.user = fakeUser(code);
  await page.addInitScript(
    ([user, token]) => {
      localStorage.setItem('authStore', JSON.stringify({ state: { user, authToken: token }, version: 0 }));
    },
    [backend.user, FAKE_TOKEN] as const,
  );
}

/** Open /applications and wait until the first list response is on screen. */
async function openApplications(page: Page): Promise<void> {
  // The dev server compiles a route on its first visit.
  await page.goto('/applications', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await expect(page.getByRole('group', { name: 'Filter applications by status' })).toBeVisible({ timeout: 90_000 });
  await expect(page.getByText(`${APPLICATIONS.length} applications`, { exact: true })).toBeVisible({ timeout: 30_000 });
}

const menu = (page: Page): Locator => page.locator('aside nav');
/** Applications is a dropdown: this button opens it. */
const applicationsToggle = (page: Page): Locator =>
  menu(page).getByRole('button', { name: 'Applications', exact: true });
/** The dropdown's first item, the link to /applications. Out of reach (display:none) while it is closed, as it is away from /applications. */
const applicationsLink = (page: Page): Locator =>
  menu(page).getByRole('link', { name: 'Applications', exact: true });
const uploadSection = (page: Page): Locator => page.getByRole('region', { name: 'Google Form responses' });

/** Every path the main frame commits, including client-side (history API) navigations. */
function trackPaths(page: Page): string[] {
  const paths: string[] = [];
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) paths.push(new URL(frame.url()).pathname);
  });
  return paths;
}

/** One figure of the upload tally: the <dd> next to the <dt> that reads `label`. */
const figure = (panel: Locator, label: string): Locator =>
  panel.locator('dl > div').filter({ has: panel.page().locator('dt', { hasText: new RegExp(`^${label}$`) }) }).locator('dd');

/** The list that follows a heading in the upload result panel. */
const listUnder = (panel: Locator, heading: string): Locator =>
  panel.getByRole('heading', { name: heading, exact: true }).locator('xpath=following-sibling::ul[1]').getByRole('listitem');

// ---------------------------------------------------------------------------
// 1. Call Center
// ---------------------------------------------------------------------------

test.describe('1. Call Center', () => {
  test('the sidebar menu holds one group, Applications, with its two links', async ({ page, backend }) => {
    await signedInAs(page, backend, 'CALLCTR');
    await openApplications(page);

    // The one menu is the Applications dropdown, open on /applications: its toggle, then
    // Applications and Source tracker. Nothing else is in it.
    await expect(menu(page).getByRole('button')).toHaveCount(1);
    await expect(applicationsToggle(page)).toHaveAttribute('aria-expanded', 'true');
    const links = menu(page).getByRole('link');
    await expect(links).toHaveCount(2);
    await expect(links).toHaveText(['Applications', 'Source tracker']);
    await expect(links.nth(0)).toHaveAttribute('href', '/applications');
    await expect(links.nth(0)).toHaveAttribute('aria-current', 'page');
    await expect(links.nth(1)).toHaveAttribute('href', '/applications/tracker');
    await expect(links.nth(1)).not.toHaveAttribute('aria-current', 'page');
    // The logo would otherwise send Call Center to "/" only to be bounced back.
    await expect(page.locator('aside').getByRole('link', { name: 'Logo' })).toHaveAttribute('href', '/applications');
  });

  test('visiting /borrowers ends on /applications', async ({ page, backend }) => {
    await signedInAs(page, backend, 'CALLCTR');
    await page.goto('/borrowers', { waitUntil: 'domcontentloaded', timeout: 120_000 });

    await expect(page).toHaveURL(`${APP}/applications`, { timeout: 90_000 });
    await expect(page.getByRole('group', { name: 'Filter applications by status' })).toBeVisible({ timeout: 90_000 });
  });

  test('/applications shows the upload button', async ({ page, backend }) => {
    await signedInAs(page, backend, 'CALLCTR');
    await openApplications(page);

    await expect(page.getByRole('button', { name: UPLOAD_BUTTON })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. The Applications dropdown outside Call Center's menu
// ---------------------------------------------------------------------------

// A smoke test only. Every sidebar variant (Owner, Accounting, default), the open and
// current-page rules and Source tracker are tested in tests/e2e/27-application-page/source-tracker.spec.ts.
test.describe('2. Applications dropdown in the sidebar', () => {
  test('the sidebar carries the dropdown, and its Applications link opens /applications', async ({ page, backend }) => {
    await signedInAs(page, backend, 'ADM');
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 120_000 });

    // Away from /applications the dropdown is closed: open it to reach the link.
    await expect(applicationsToggle(page)).toBeVisible({ timeout: 90_000 });
    await applicationsToggle(page).click();
    await applicationsLink(page).click();

    await expect(page).toHaveURL(`${APP}/applications`, { timeout: 90_000 });
    await expect(page.getByRole('group', { name: 'Filter applications by status' })).toBeVisible({ timeout: 90_000 });
  });
});

// ---------------------------------------------------------------------------
// 3. Who sees the upload
// ---------------------------------------------------------------------------

test.describe('3. Upload visibility', () => {
  for (const code of ['ADM', 'OWN', 'CALLCTR'] as const) {
    test(`${code} sees the upload button`, async ({ page, backend }) => {
      await signedInAs(page, backend, code);
      await openApplications(page);

      await expect(page.getByRole('button', { name: UPLOAD_BUTTON })).toBeVisible();
    });
  }

  test('PROC does not see the upload button', async ({ page, backend }) => {
    await signedInAs(page, backend, 'PROC');
    // Waits for the list, so the role check (an effect on mount) has long since run.
    await openApplications(page);

    await expect(page.getByRole('button', { name: UPLOAD_BUTTON })).toHaveCount(0);
    await expect(uploadSection(page)).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// 4. Status filter wiring
// ---------------------------------------------------------------------------

test('4. status chips send status to getLoanApplications, and All sends none', async ({ page, backend }) => {
  await signedInAs(page, backend, 'CALLCTR');
  await openApplications(page);

  const chips = page.getByRole('group', { name: 'Filter applications by status' });
  const chip = (name: string) => chips.getByRole('button', { name, exact: true });

  const onMount = backend.applicationCalls();
  expect(onMount.length).toBeGreaterThan(0);
  for (const call of onMount) expect(call.variables, 'the first load is unfiltered').not.toHaveProperty('status');
  await expect(chip('All')).toHaveAttribute('aria-pressed', 'true');

  let before = backend.applicationCalls().length;
  await chip('Interviewed').click();
  await expect.poll(() => backend.applicationCalls().length).toBeGreaterThan(before);
  for (const call of backend.applicationCalls().slice(before)) {
    expect(call.variables).toHaveProperty('status', 'interviewed');
  }
  await expect(chip('Interviewed')).toHaveAttribute('aria-pressed', 'true');
  await expect(chip('All')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('cell', { name: 'E2E Applicant Two' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'E2E Applicant One' })).toHaveCount(0);

  before = backend.applicationCalls().length;
  await chip('All').click();
  await expect.poll(() => backend.applicationCalls().length).toBeGreaterThan(before);
  for (const call of backend.applicationCalls().slice(before)) {
    expect(call.variables, 'All must not send status at all').not.toHaveProperty('status');
  }
  await expect(chip('All')).toHaveAttribute('aria-pressed', 'true');
  await expect(chip('Interviewed')).toHaveAttribute('aria-pressed', 'false');

  // The backend's rules reject an explicit null for either.
  for (const { variables } of backend.applicationCalls()) {
    expect(typeof variables.first, `first was ${JSON.stringify(variables.first)}`).toBe('number');
    expect(typeof variables.page, `page was ${JSON.stringify(variables.page)}`).toBe('number');
  }
});

/**
 * A row pasted from the Sheet with only its day ("10/1/2026") is stored at
 * midnight: the Submitted column shows the date alone, not "12:00 AM".
 * Every other time shows as it is.
 */
test('4b. Submitted shows the time, and a row pasted with only its day shows the date alone', async ({ page, backend }) => {
  const rows = APPLICATIONS.map((row) => (row.id === '2' ? { ...row, submitted_at: '2026-10-01 00:00:00' } : row));
  backend.extraGraphql.set('getLoanApplications', () => ({
    getLoanApplications: { data: rows, paginatorInfo: { total: rows.length, currentPage: 1, lastPage: 1, hasMorePages: false } },
  }));
  await signedInAs(page, backend, 'CALLCTR');
  await openApplications(page);

  await expect(page.getByRole('cell', { name: /^Sep 21, 2026, 9:15\sAM$/ })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Oct 1, 2026', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: /^Oct 1, 2026,/ })).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// 5. Upload result
// ---------------------------------------------------------------------------

test('5. a finished upload shows its tally and rows, and reloads the list', async ({ page, backend }) => {
  backend.upload = {
    status: 200,
    body: {
      status: true,
      added: 4,
      already_here: 12,
      skipped: [
        { row: 7, reason: 'No mobile number' },
        { row: 9, reason: 'No name given' },
      ],
      flagged: [{ row: 3, note: 'Amount is above the usual limit' }],
    },
  };
  await signedInAs(page, backend, 'CALLCTR');
  await openApplications(page);
  const before = backend.applicationCalls().length;

  const section = uploadSection(page);
  await section.getByLabel(FILE_INPUT_LABEL).setInputFiles({
    name: 'responses.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(CSV),
  });

  const panel = section.getByRole('status');
  await expect(panel).toContainText('Upload finished', { timeout: 30_000 });
  await expect(panel).toContainText('responses.csv');
  await expect(figure(panel, 'New')).toHaveText('4');
  await expect(figure(panel, 'Already here')).toHaveText('12');
  await expect(figure(panel, 'Skipped')).toHaveText('2');
  await expect(listUnder(panel, 'Skipped')).toHaveText(['Row 7: No mobile number', 'Row 9: No name given']);
  await expect(listUnder(panel, 'Check these')).toHaveText(['Row 3: Amount is above the usual limit']);

  // The list is fetched again so the new applicants show.
  await expect.poll(() => backend.applicationCalls().length, { timeout: 30_000 }).toBeGreaterThan(before);

  // What went over the wire: one multipart POST carrying the chosen file, with the (fake) token.
  expect(backend.uploads).toHaveLength(1);
  expect(backend.uploads[0].contentType).toMatch(/^multipart\/form-data; boundary=/);
  expect(backend.uploads[0].authorization).toBe(`Bearer ${FAKE_TOKEN}`);
  expect(backend.uploads[0].body).toContain('filename="responses.csv"');
});

// ---------------------------------------------------------------------------
// 6. Upload failure
// ---------------------------------------------------------------------------

test('6. a refused upload shows the server message in an alert', async ({ page, backend }) => {
  const message = 'This is not a Google Form download. Download the responses again and upload that file.';
  backend.upload = { status: 422, body: { status: false, message } };
  await signedInAs(page, backend, 'CALLCTR');
  await openApplications(page);
  const before = backend.applicationCalls().length;

  // Through the button this time, so the button -> file picker wiring is covered too.
  const section = uploadSection(page);
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    section.getByRole('button', { name: UPLOAD_BUTTON }).click(),
  ]);
  await chooser.setFiles({ name: 'responses.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV) });

  const alert = section.getByRole('alert');
  await expect(alert).toContainText('Upload failed', { timeout: 30_000 });
  await expect(alert.getByText(message, { exact: true })).toBeVisible();
  await expect(section.getByRole('status')).toBeEmpty();
  expect(backend.uploads).toHaveLength(1);
  expect(backend.applicationCalls()).toHaveLength(before);
});

// ---------------------------------------------------------------------------
// 7. Where sign-in lands
// ---------------------------------------------------------------------------

async function signInThroughForm(page: Page): Promise<void> {
  await page.goto('/auth/signin', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  const email = page.getByPlaceholder('Enter your email');
  await expect(email).toBeVisible({ timeout: 90_000 });
  // Typing before React hydrates is lost: the box keeps the text, the form state stays empty.
  await page.waitForFunction(() => {
    const input = document.querySelector('input[type="email"]');
    return !!input && Object.keys(input).some((key) => key.startsWith('__reactProps'));
  }, undefined, { timeout: 60_000 });

  await email.fill(FAKE_LOGIN.email);
  await page.getByPlaceholder('6+ Characters, 1 Capital letter').fill(FAKE_LOGIN.password);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
}

test.describe('7. Sign-in landing', () => {
  test('Call Center lands on /applications, without passing through /', async ({ page, backend }) => {
    backend.loginRole = 'CALLCTR';
    const paths = trackPaths(page);

    await signInThroughForm(page);

    await expect(page).toHaveURL(`${APP}/applications`, { timeout: 90_000 });
    await expect(page.getByRole('button', { name: UPLOAD_BUTTON })).toBeVisible({ timeout: 90_000 });
    expect(backend.logins).toEqual([FAKE_LOGIN]);
    expect(paths, 'Call Center was routed through the dashboard').not.toContain('/');
  });

  test('Owner lands on /', async ({ page, backend }) => {
    backend.loginRole = 'OWN';
    const paths = trackPaths(page);

    await signInThroughForm(page);

    await expect(page).toHaveURL(`${APP}/`, { timeout: 90_000 });
    // The layout (and so withAuth) has mounted, and the Owner stays put.
    await expect(applicationsToggle(page)).toBeVisible({ timeout: 90_000 });
    await expect(page).toHaveURL(`${APP}/`);
    expect(backend.logins).toEqual([FAKE_LOGIN]);
    expect(paths).toContain('/');
    expect(paths).not.toContain('/applications');
  });
});

// ---------------------------------------------------------------------------
// 8. Part 1 borrower-form fixes (BorrowerDetails.tsx)
// ---------------------------------------------------------------------------

/** A fictional borrower in the shape GET_SINGLE_BORROWER_QUERY returns. */
const borrower = (isRent: boolean) => ({
  id: '70001', payer_standing: 'NONE', user_id: '90001', chief_id: null,
  amount_applied: '10000.00', purpose: 'Store capital',
  firstname: 'E2E', middlename: 'Sample', lastname: 'Borrower', terms_of_payment: '6',
  residence_address: '1 Sample Street, Sample City',
  // GraphQL sends a Boolean here, although the frontend type says string.
  is_rent: isRent,
  other_source_of_inc: '', est_monthly_fam_inc: '20000.00', employment_position: 'Clerk', gender: 'Female',
  photo: 'e2e-photo.png', is_deleted: 0, chief: null,
  borrower_details: {
    id: '70001', dob: '1990-01-15', place_of_birth: 'Sample City', age: 36,
    email: 'e2e.borrower@example.test', contact_no: '09170000009', civil_status: 'Single',
  },
  borrower_spouse_details: {
    work_address: '', occupation: '', fullname: '', company: '', dept_branch: '',
    length_of_service: '', salary: '', company_contact_person: '', contact_no: '',
  },
  borrower_work_background: {
    id: '70001', company_borrower_id: null, employment_number: 'E2E-0001', area_id: null, sub_area_id: null,
    station: '', term_in_service: '', employment_status: '', division: '',
    monthly_gross: '0.00', monthly_net: '0.00', office_address: '', area: null,
  },
  borrower_company_info: { id: '70001', employer: '', salary: '', contract_duration: '' },
  borrower_reference: [],
  user: null,
  branch_sub: null,
});

/** 1x1 transparent PNG, for the profile photo the form loads from the backend's /storage. */
const BLANK_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

/** The borrower page shows an error instead of the form unless all three reference lists load. */
async function stubBorrowerPage(page: Page, backend: FakeBackend, isRent: boolean): Promise<void> {
  backend.extraGraphql.set('getChief', () => ({ getChief: { data: [] } }));
  backend.extraGraphql.set('getAreas', () => ({ getAreas: { data: [] } }));
  backend.extraGraphql.set('getBorrCompanies', () => ({ getBorrCompanies: { data: [] } }));
  backend.extraGraphql.set('getMyAccessibleBranchSubs', () => ({ getMyAccessibleBranchSubs: [] }));
  backend.extraGraphql.set('getBorrower', () => ({ getBorrower: borrower(isRent) }));
  await page.route(`${BACKEND}/storage/**`, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', headers: CORS, body: BLANK_PNG }),
  );
}

test.describe('8. Borrower form, Part 1 fixes', () => {
  // Rent is the control case: the form's default is already Own, so "Own" alone
  // could pass without the borrower ever being written into the form.
  for (const { isRent, value, label } of [
    { isRent: false, value: '0', label: 'Own' },
    { isRent: true, value: '1', label: 'Rent' },
  ]) {
    test(`an existing borrower with is_rent ${isRent} opens as ${label}, under "Name & Contact"`, async ({ page, backend }) => {
      await signedInAs(page, backend, 'ADM');
      await stubBorrowerPage(page, backend, isRent);
      await page.goto('/borrowers/70001', { waitUntil: 'domcontentloaded', timeout: 120_000 });

      await expect(page.getByRole('heading', { name: 'Name & Contact', exact: true })).toBeVisible({ timeout: 90_000 });
      // The same effect writes the name and the residency, so once the name is in, so is the residency.
      await expect(page.locator('#firstname')).toHaveValue('E2E', { timeout: 30_000 });
      const residency = page.getByLabel('Type of Residency', { exact: true });
      await expect(residency).toHaveValue(value);
      await expect(residency.locator('option:checked')).toHaveText(label);
      await expect(page.getByRole('heading', { name: 'Check for Existing Borrower' })).toHaveCount(0);
    });
  }

  test('/borrowers/new still opens on "Check for Existing Borrower"', async ({ page, backend }) => {
    await signedInAs(page, backend, 'ADM');
    await stubBorrowerPage(page, backend, false);
    await page.goto('/borrowers/new', { waitUntil: 'domcontentloaded', timeout: 120_000 });

    await expect(page.getByRole('heading', { name: 'Check for Existing Borrower', exact: true })).toBeVisible({ timeout: 90_000 });
    await expect(page.getByRole('heading', { name: 'Name & Contact' })).toHaveCount(0);
    expect(backend.graphql.map((call) => call.field), 'a new borrower is never fetched').not.toContain('getBorrower');
  });
});

// ---------------------------------------------------------------------------
// 9. Rows pasted from the responses Sheet
// ---------------------------------------------------------------------------

/** Opens the paste box from its toggle, which reports itself expanded and hands the cursor to the box. */
async function openPasteBox(section: Locator): Promise<Locator> {
  const toggle = section.getByRole('button', { name: PASTE_TOGGLE });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const box = section.getByLabel(PASTE_BOX_LABEL);
  await expect(box).toBeFocused();
  return box;
}

test.describe('9. Paste rows from the Sheet', () => {
  test('the rows are posted exactly as pasted, the tally shows, and the box closes', async ({ page, backend }) => {
    backend.paste = {
      status: 200,
      body: { status: true, added: 1, already_here: 1, skipped: [{ row: 3, reason: 'No mobile number' }], flagged: [] },
    };
    let release = () => {};
    backend.pasteHold = new Promise<void>((resolve) => {
      release = resolve;
    });
    await signedInAs(page, backend, 'CALLCTR');
    await openApplications(page);
    const before = backend.applicationCalls().length;
    const section = uploadSection(page);

    const box = await openPasteBox(section);
    const add = section.getByRole('button', { name: 'Add pasted rows' });
    await expect(add).toBeDisabled();
    await box.fill(PASTED_ROWS);
    await expect(add).toBeEnabled();
    await add.click();

    // While the rows are being added, the upload button says so and ignores clicks: no file picker opens.
    const upload = section.getByRole('button', { name: UPLOAD_BUTTON });
    await expect(section.getByRole('button', { name: 'Adding…' })).toBeVisible();
    await expect(upload).toHaveAttribute('aria-disabled', 'true');
    const picker = page.waitForEvent('filechooser', { timeout: 1_500 }).then(() => true, () => false);
    await upload.click({ force: true }); // force: Playwright itself treats aria-disabled as disabled
    expect(await picker, 'a file picker opened while rows were being added').toBe(false);
    release();

    const panel = section.getByRole('status');
    await expect(panel).toContainText('Paste finished', { timeout: 30_000 });
    await expect(panel).toContainText('Pasted rows');
    await expect(upload).toHaveAttribute('aria-disabled', 'false');
    await expect(figure(panel, 'New')).toHaveText('1');
    await expect(figure(panel, 'Already here')).toHaveText('1');
    await expect(listUnder(panel, 'Skipped')).toHaveText(['Row 3: No mobile number']);
    // Cleared and closed, and the cursor is back on the toggle.
    await expect(section.getByLabel(PASTE_BOX_LABEL)).toHaveCount(0);
    await expect(section.getByRole('button', { name: PASTE_TOGGLE })).toBeFocused();
    await expect.poll(() => backend.applicationCalls().length, { timeout: 30_000 }).toBeGreaterThan(before);

    // One JSON POST with the (fake) token, its text byte for byte: tabs, empty cells and line breaks survive.
    expect(backend.jsonPosts).toHaveLength(1);
    expect(backend.jsonPosts[0].path).toBe('/api/applications/paste');
    expect(backend.jsonPosts[0].contentType).toMatch(/^application\/json/);
    expect(backend.jsonPosts[0].authorization).toBe(`Bearer ${FAKE_TOKEN}`);
    expect(backend.jsonPosts[0].body).toEqual({ text: PASTED_ROWS });
    expect(backend.uploads).toHaveLength(0);
  });

  test('a refused paste shows the server message, and the rows stay for another try', async ({ page, backend }) => {
    const message = 'Paste fewer rows at a time, or upload the Google Forms download instead.';
    backend.paste = { status: 422, body: { status: false, message } };
    await signedInAs(page, backend, 'CALLCTR');
    await openApplications(page);
    const section = uploadSection(page);

    const box = await openPasteBox(section);
    await box.fill(PASTED_ROWS);
    await section.getByRole('button', { name: 'Add pasted rows' }).click();

    const alert = section.getByRole('alert');
    await expect(alert).toContainText('Paste failed', { timeout: 30_000 });
    await expect(alert.getByText(message, { exact: true })).toBeVisible();
    await expect(section.getByRole('status')).toBeEmpty();
    await expect(box).toHaveValue(PASTED_ROWS);
    expect(backend.jsonPosts).toHaveLength(1);
  });

  test('a 429 from the rate limit says to wait a minute, not "Too Many Attempts."', async ({ page, backend }) => {
    backend.paste = { status: 429, body: { message: 'Too Many Attempts.' } };
    await signedInAs(page, backend, 'CALLCTR');
    await openApplications(page);
    const section = uploadSection(page);

    const box = await openPasteBox(section);
    await box.fill(PASTED_ROWS);
    await section.getByRole('button', { name: 'Add pasted rows' }).click();

    const alert = section.getByRole('alert');
    await expect(alert).toContainText('Paste failed', { timeout: 30_000 });
    await expect(alert).toContainText('Too many uploads and pastes in one minute. Wait a minute, then try again — nothing from this one was saved.');
    await expect(alert).not.toContainText('Too Many Attempts.');
    await expect(box).toHaveValue(PASTED_ROWS);
  });

  test('Cancel during an add closes the box, and the finished add leaves focus where staff put it', async ({ page, backend }) => {
    let release = () => {};
    backend.pasteHold = new Promise<void>((resolve) => {
      release = resolve;
    });
    await signedInAs(page, backend, 'CALLCTR');
    await openApplications(page);
    const section = uploadSection(page);

    const box = await openPasteBox(section);
    await box.fill(PASTED_ROWS);
    await section.getByRole('button', { name: 'Add pasted rows' }).click();
    await section.getByRole('button', { name: 'Cancel' }).click();
    await expect(box).toHaveCount(0);
    // Staff move on while the rows are still being added.
    const allChip = page.getByRole('group', { name: 'Filter applications by status' }).getByRole('button', { name: 'All', exact: true });
    await allChip.focus();
    release();

    await expect(section.getByRole('status')).toContainText('Paste finished', { timeout: 30_000 });
    await expect(allChip).toBeFocused();
  });
});

test.describe('9b. A 401 on the JSON endpoints', () => {
  for (const way of ['paste', 'pdf'] as const) {
    test(`a 401 on /applications/${way} ends the session and goes to sign-in`, async ({ page, backend }) => {
      backend[way] = { status: 401, body: { message: 'Unauthenticated.' } };
      const paths = trackPaths(page);
      await signedInAs(page, backend, 'CALLCTR');
      await openApplications(page);
      const section = uploadSection(page);

      if (way === 'paste') {
        const box = await openPasteBox(section);
        await box.fill(PASTED_ROWS);
        await section.getByRole('button', { name: 'Add pasted rows' }).click();
      } else {
        await chooseFile(page, section, 'response.pdf', layoutToPdf(loadLayout()));
      }

      await expect.poll(() => paths, { timeout: 90_000 }).toContain('/auth/signin');
      expect(backend.jsonPosts.map((post) => post.path)).toEqual([`/api/applications/${way}`]);
    });
  }
});

// ---------------------------------------------------------------------------
// 10. One response saved as a PDF
// ---------------------------------------------------------------------------

/** Chooses a file through the upload button, as staff do. */
async function chooseFile(page: Page, section: Locator, name: string, buffer: Buffer): Promise<void> {
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    section.getByRole('button', { name: UPLOAD_BUTTON }).click(),
  ]);
  await chooser.setFiles({ name, mimeType: 'application/pdf', buffer });
}

test.describe('10. One response as a PDF', () => {
  test('the PDF is read in the browser and only its answers are posted', async ({ page, backend }) => {
    backend.pdf = { status: 200, body: { status: true, added: 1, already_here: 0, skipped: [], flagged: [] } };
    await signedInAs(page, backend, 'CALLCTR');
    await openApplications(page);
    const before = backend.applicationCalls().length;
    const section = uploadSection(page);

    await chooseFile(page, section, 'Juana Dela Cruz - response.pdf', layoutToPdf(loadLayout()));

    const panel = section.getByRole('status');
    // pdf.js loads on this first PDF, and the dev server may compile its chunk.
    await expect(panel).toContainText('Upload finished', { timeout: 90_000 });
    await expect(panel).toContainText('Juana Dela Cruz - response.pdf');
    await expect(figure(panel, 'New')).toHaveText('1');
    await expect.poll(() => backend.applicationCalls().length, { timeout: 30_000 }).toBeGreaterThan(before);

    expect(backend.uploads, 'the file itself is never sent').toHaveLength(0);
    expect(backend.jsonPosts).toHaveLength(1);
    const [post] = backend.jsonPosts;
    expect(post.path).toBe('/api/applications/pdf');
    expect(post.authorization).toBe(`Bearer ${FAKE_TOKEN}`);
    expect(post.body).toEqual({ file_name: 'Juana Dela Cruz - response.pdf', answers: FIXTURE_ANSWERS });
  });

  test('a PDF that is not a form response shows the reader message, and nothing is posted', async ({ page, backend }) => {
    await signedInAs(page, backend, 'CALLCTR');
    await openApplications(page);
    const section = uploadSection(page);

    await chooseFile(page, section, 'receipt.pdf', plainPdf('Official receipt no. 0001'));

    const alert = section.getByRole('alert');
    await expect(alert).toContainText('Upload failed', { timeout: 90_000 });
    await expect(alert.getByText(NOT_A_FORM_MESSAGE, { exact: true })).toBeVisible();
    await expect(section.getByRole('status')).toBeEmpty();
    expect(backend.jsonPosts).toHaveLength(0);
    expect(backend.uploads).toHaveLength(0);
  });

  test('a second PDF in the same visit is read too', async ({ page, backend }) => {
    backend.pdf = { status: 200, body: { status: true, added: 1, already_here: 0, skipped: [], flagged: [] } };
    await signedInAs(page, backend, 'CALLCTR');
    await openApplications(page);
    const section = uploadSection(page);
    const panel = section.getByRole('status');
    const purpose = 'Para saan po ang loan?';
    const second = loadLayout();
    tickOther(second, purpose, 'Pambili ng tricycle');

    await chooseFile(page, section, 'first.pdf', layoutToPdf(loadLayout()));
    await expect(panel).toContainText('first.pdf', { timeout: 90_000 });
    await chooseFile(page, section, 'second.pdf', layoutToPdf(second));
    await expect(panel).toContainText('second.pdf', { timeout: 60_000 });

    expect(backend.jsonPosts.map((post) => post.path)).toEqual(['/api/applications/pdf', '/api/applications/pdf']);
    expect(backend.jsonPosts[1].body).toEqual({
      file_name: 'second.pdf',
      answers: FIXTURE_ANSWERS.map((entry) => (entry.question === purpose ? { question: purpose, answer: 'Pambili ng tricycle' } : entry)),
    });
  });

  test('a PDF of more than 20 pages is not read as one response, and nothing is posted', async ({ page, backend }) => {
    await signedInAs(page, backend, 'CALLCTR');
    await openApplications(page);
    const section = uploadSection(page);

    // The fictional response on its 7 pages, then blank pages up to 21.
    await chooseFile(page, section, 'responses.pdf', layoutToPdf(loadLayout(), 21));

    const alert = section.getByRole('alert');
    await expect(alert).toContainText('Upload failed', { timeout: 90_000 });
    await expect(alert.getByText(NOT_A_FORM_MESSAGE, { exact: true })).toBeVisible();
    expect(backend.jsonPosts).toHaveLength(0);
  });

  test('a PDF that stalls the reader is given up after a minute, and the next PDF gets a fresh worker', async ({ page, backend }) => {
    // Fake time, so the one-minute watchdog can be passed without waiting a minute.
    await page.clock.install();
    // A stand-in for the pdf.js worker that says "ready" and then never answers: the read stalls.
    await page.addInitScript(() => {
      const stall = { terminated: 0, realWorker: window.Worker };
      class StalledWorker extends EventTarget {
        constructor() {
          super();
          const ready = { sourceName: 'worker', targetName: 'main', action: 'ready', data: null };
          queueMicrotask(() => this.dispatchEvent(new MessageEvent('message', { data: ready })));
        }
        postMessage(): void {}
        terminate(): void {
          stall.terminated += 1;
        }
      }
      Object.assign(window, { Worker: StalledWorker, e2eStall: stall });
    });
    await signedInAs(page, backend, 'CALLCTR');
    await openApplications(page);
    const section = uploadSection(page);
    const alert = section.getByRole('alert');
    const stall = () => page.evaluate(() => (window as unknown as { e2eStall: { terminated: number } }).e2eStall.terminated);

    await chooseFile(page, section, 'stalls.pdf', layoutToPdf(loadLayout()));
    await expect(section.getByRole('button', { name: 'Uploading…' })).toBeVisible({ timeout: 30_000 });
    // Jump the clock ahead until the watchdog fires; the read starts a moment after "Uploading…".
    await expect(async () => {
      await page.clock.fastForward(15_000);
      await expect(alert).toContainText('This PDF could not be opened.', { timeout: 1_000 });
    }).toPass({ timeout: 60_000 });
    await expect(alert).toContainText('Upload failed');
    await expect(section.getByRole('button', { name: UPLOAD_BUTTON })).toHaveAttribute('aria-disabled', 'false');
    expect(await stall(), 'the stalled worker was not stopped').toBe(1);
    expect(backend.jsonPosts).toHaveLength(0);

    // The stalled worker was forgotten: with the real worker back, the next PDF starts a fresh one and reads.
    await page.evaluate(() => {
      const w = window as unknown as { Worker: typeof Worker; e2eStall: { realWorker: typeof Worker } };
      w.Worker = w.e2eStall.realWorker;
    });
    await chooseFile(page, section, 'next.pdf', layoutToPdf(loadLayout()));
    await expect(section.getByRole('status')).toContainText('next.pdf', { timeout: 90_000 });
    expect(backend.jsonPosts.map((post) => post.body)).toEqual([{ file_name: 'next.pdf', answers: FIXTURE_ANSWERS }]);
  });

  test('a damaged PDF says it could not be opened, and nothing is posted', async ({ page, backend }) => {
    await signedInAs(page, backend, 'CALLCTR');
    await openApplications(page);
    const section = uploadSection(page);

    await chooseFile(page, section, 'response.pdf', Buffer.from('This is not a PDF at all.'));

    const alert = section.getByRole('alert');
    await expect(alert).toContainText('This PDF could not be opened.', { timeout: 90_000 });
    expect(backend.jsonPosts).toHaveLength(0);
    expect(backend.uploads).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 11. A row opens its application
// ---------------------------------------------------------------------------

/**
 * The same three applications, each with the channel it came in by, so every kind of
 * thing a row holds is there to click: the name, the channel line and its icon, the
 * status pill, and (row 2) the intake-flag mark.
 */
const APPLICATIONS_BY_CHANNEL = [
  { ...APPLICATIONS[0], channel: 'facebook' },
  { ...APPLICATIONS[1], channel: 'walk_in' },
  { ...APPLICATIONS[2], channel: 'phone' },
];

/**
 * What /applications/<id> asks for, in the shape of the backend's LoanApplicationRecord.
 * The page asks for it once it opens. These tests assert only the URL; the page itself is tested in tests/e2e/27-application-page.
 */
function stubApplicationRecords(backend: FakeBackend): void {
  backend.extraGraphql.set('getLoanApplication', (variables) => {
    const row = APPLICATIONS_BY_CHANNEL.find((application) => application.id === String(variables.id));
    if (!row) return { getLoanApplication: null };
    return {
      getLoanApplication: {
        ...row,
        branch_sub_id: row.branch_sub ? Number(row.branch_sub.id) : null,
        borrower_id: null,
        created_at: row.submitted_at,
        // An application with no stored form: details is an object whose groups are all null.
        details: { info: null, detail: null, spouse: null, work: null, company: null, references: null },
        form_answers: [],
      },
    };
  });
}

/**
 * RootLayout's loader (app/layout.tsx): for the first second after a page loads, a full-screen
 * overlay takes every click. Wait it out before a click that must land on the list.
 */
const bootOverlay = (page: Page): Locator => page.locator('div.fixed.inset-0.z-9999');

/** Opens the list as Call Center, with the channel on every row and the application page's data stubbed. */
async function openListWithChannels(page: Page, backend: FakeBackend): Promise<void> {
  backend.extraGraphql.set('getLoanApplications', () => ({
    getLoanApplications: {
      data: APPLICATIONS_BY_CHANNEL,
      paginatorInfo: { total: APPLICATIONS_BY_CHANNEL.length, currentPage: 1, lastPage: 1, hasMorePages: false },
    },
  }));
  stubApplicationRecords(backend);
  await signedInAs(page, backend, 'CALLCTR');
  await openApplications(page);
  await expect(bootOverlay(page)).toHaveCount(0, { timeout: 10_000 });
}

const nameLink = (page: Page, name: string): Locator => page.getByRole('link', { name, exact: true });
const rowOf = (page: Page, name: string): Locator => page.getByRole('row').filter({ hasText: name });

/**
 * The requests this page makes for /applications/<id>, as they happen. A router push asks for the
 * page at once, so "no request" says no navigation was started, without waiting for it to land: a
 * push to a page that is not built yet takes seconds to land, and a fixed wait would pass first.
 */
function watchRequestsFor(page: Page, id: string): string[] {
  const seen: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === `/applications/${id}`) seen.push(`${request.resourceType()} ${request.method()}`);
  });
  return seen;
}

/**
 * Records what each click lands on ("a" for a link or something inside one, else the tag), as
 * the click happens, so it survives the navigation the click causes. The Name link and the row's
 * own click open the same page, so the URL alone cannot say which of the two did it.
 */
async function recordClicks(page: Page): Promise<string[]> {
  const landed: string[] = [];
  await page.exposeFunction('reportClick', (kind: string) => landed.push(kind));
  await page.evaluate(() => {
    document.addEventListener('click', (event) => {
      const target = event.target as Element;
      (window as unknown as { reportClick: (kind: string) => void }).reportClick(target.closest('a') ? 'a' : target.tagName.toLowerCase());
    }, true);
  });
  return landed;
}

/** What a click can land on in a row besides the name link: each must open the row's application. */
const OTHER_ROW_TARGETS: { what: string; applicant: string; id: string; target: (row: Locator) => Locator; force?: boolean }[] = [
  // Not exact: this cell also holds the screen-reader text "Not assigned. The form says: ".
  { what: 'a cell of text', applicant: 'E2E Applicant One', id: '1', target: (row) => row.getByText('Marikina') },
  { what: 'the amount', applicant: 'E2E Applicant Three', id: '3', target: (row) => row.getByText('₱5,000.00', { exact: true }) },
  { what: 'the channel line', applicant: 'E2E Applicant One', id: '1', target: (row) => row.getByText('Messenger') },
  // The icon lets clicks through to its line (pointer-events-none), so Playwright would wait forever
  // for a click that "never reaches" it: force the click onto its pixels, as a thumb or a mouse does.
  { what: 'the channel icon', applicant: 'E2E Applicant Two', id: '2', target: (row) => row.locator('[data-column-id="name"] svg'), force: true },
  { what: 'the status pill', applicant: 'E2E Applicant Three', id: '3', target: (row) => row.getByTitle('Declined', { exact: true }) },
  { what: 'the intake-flag mark', applicant: 'E2E Applicant Two', id: '2', target: (row) => row.getByRole('img', { name: /^Check: / }) },
];

// Applicant names are filed in capitals, but a row that came in from the Google Form holds them as the
// applicant typed them. The list draws them in capitals (CSS only): the text is not rewritten.
test('10b. a name stored in lowercase is drawn in CAPITALS in the list, and its text is left as stored', async ({ page, backend }) => {
  const [first, ...others] = APPLICATIONS_BY_CHANNEL;
  const rows = [{ ...first, full_name: 'maria dela peña' }, ...others];
  backend.extraGraphql.set('getLoanApplications', () => ({
    getLoanApplications: { data: rows, paginatorInfo: { total: rows.length, currentPage: 1, lastPage: 1, hasMorePages: false } },
  }));
  stubApplicationRecords(backend);
  await signedInAs(page, backend, 'CALLCTR');
  await openApplications(page);

  const link = nameLink(page, 'maria dela peña');
  await expect(link).toBeVisible();
  await expect(link).toHaveText('maria dela peña');
  await expect(link).toHaveAttribute('title', 'maria dela peña');
  expect(await link.evaluate((element) => getComputedStyle(element).textTransform)).toBe('uppercase');
  // What it is drawn as: the capitals are really on the page, not just a class.
  expect(await link.evaluate((element) => (element as HTMLElement).innerText)).toBe('MARIA DELA PEÑA');
  // The line under the name (where it came from) is not a name.
  const source = rowOf(page, 'maria dela peña').getByText('Messenger');
  expect(await source.evaluate((element) => getComputedStyle(element).textTransform)).toBe('none');
});

test.describe('11. A row opens its application', () => {
  test('the name is a link to /applications/<id>; a click opens it, and Back is the list', async ({ page, backend }) => {
    await openListWithChannels(page, backend);
    const link = nameLink(page, 'E2E Applicant Two');
    await expect(link).toHaveAttribute('href', '/applications/2');

    await link.click();

    await expect(page).toHaveURL(`${APP}/applications/2`, { timeout: 90_000 });
    // One history entry for the page, not two: Back is the list.
    await page.goBack();
    await expect(page).toHaveURL(`${APP}/applications`);
  });

  /*
   * No double navigation. A click on the link already navigates, so the row's own click
   * (onRowClicked) must not run for it too. RDT runs the row click only for a target that
   * carries data-tag="allowRowEvents" (see CellText in ApplicationColumns), so the link,
   * and what is inside it, must not carry one. The effect cannot be seen on a plain click:
   * Next drops the second push to the same URL. It shows with a ctrl- or cmd-click: the
   * link leaves that to the browser (its own new tab), while a row click opens the
   * application in a new tab of the page's own, so a row click that ran anyway would open
   * a second one.
   */
  test('the name link and what is in it carry no data-tag, so the row never navigates for it as well', async ({ page, backend }) => {
    await openListWithChannels(page, backend);

    const tagged = await nameLink(page, 'E2E Applicant Two').evaluate(
      (link) => link.matches('[data-tag]') || link.querySelector('[data-tag]') !== null,
    );
    expect(tagged).toBe(false);
  });

  for (const { what, applicant, id, target, force } of OTHER_ROW_TARGETS) {
    test(`a click on ${what} in ${applicant}'s row opens /applications/${id}`, async ({ page, backend }) => {
      await openListWithChannels(page, backend);
      const landed = await recordClicks(page);
      const row = rowOf(page, applicant);
      // Hovering a row reveals what its cells cut off (app/styles.css), which reflows it: a name that
      // wrapped now pushes the channel line down. Hover first, so the click is aimed at the row as it is
      // with the pointer on it, not at the spot where the target used to be (the Name link, say).
      await row.hover();

      await target(row).click({ force });

      await expect(page).toHaveURL(`${APP}/applications/${id}`, { timeout: 90_000 });
      expect(landed, 'the click landed on the Name link, which opens the same page for another reason').toHaveLength(1);
      expect(landed).not.toContain('a');
    });
  }

  // Call Center drag-selects a mobile number to copy it: the click that ends the drag must not open the row.
  test('a drag across a number selects it and stays on the list; a plain click elsewhere in the row then opens the application', async ({ page, backend }) => {
    await openListWithChannels(page, backend);
    const asked = watchRequestsFor(page, '1');
    const row = rowOf(page, 'E2E Applicant One');
    await row.hover(); // the row reflows on hover: read the box as it is with the pointer on it
    const mobile = row.getByText('09170000001', { exact: true });
    const box = (await mobile.boundingBox())!;
    const y = box.y + box.height / 2;

    await page.mouse.move(box.x + 2, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 2, y, { steps: 8 });
    await page.mouse.up();

    // The premise: the drag did select some of the number.
    expect(await page.evaluate(() => window.getSelection()?.toString() ?? '')).not.toBe('');
    // Its click (RDT runs the row click for it: it ends on the cell) did not start a navigation.
    await page.waitForTimeout(1_000);
    expect(asked, 'the click that ended the drag opened the application').toEqual([]);
    await expect(page).toHaveURL(`${APP}/applications`);

    // The check is about the selection, not the row: a click elsewhere in it first drops the selection
    // (a click on the selected text itself is still taken as working with the selection), and opens.
    await row.getByText('Store capital', { exact: true }).click();
    await expect(page).toHaveURL(`${APP}/applications/1`, { timeout: 90_000 });
  });

  for (const modifier of ['Control', 'Meta'] as const) {
    test(`a ${modifier}-click on a row, outside the link, opens the application in a new tab and leaves this one on the list`, async ({ page, context, backend }) => {
      // The new tab has no page.route of its own: answer the backend for the whole context, as for this page.
      await context.route(`${BACKEND}/**`, (route) => backend.handle(route));
      await openListWithChannels(page, backend);
      const row = rowOf(page, 'E2E Applicant Two');
      await row.hover();

      const [tab] = await Promise.all([
        context.waitForEvent('page'),
        row.getByText('Tuition', { exact: true }).click({ modifiers: [modifier] }),
      ]);

      await expect(tab).toHaveURL(`${APP}/applications/2`, { timeout: 90_000 });
      await expect(page).toHaveURL(`${APP}/applications`);
      await tab.close();
    });
  }

  test('keyboard: Tab reaches the name link, it shows a focus ring, and Enter opens the application', async ({ page, backend }) => {
    await openListWithChannels(page, backend);
    const link = nameLink(page, 'E2E Applicant One');
    const isFocused = () => link.evaluate((element) => element === document.activeElement);

    // Tab on from the status filter until the first row's link has the focus.
    await page.getByRole('group', { name: 'Filter applications by status' }).getByRole('button', { name: 'All', exact: true }).focus();
    for (let presses = 0; presses < 15 && !(await isFocused()); presses += 1) await page.keyboard.press('Tab');
    await expect(link).toBeFocused();
    // The ring is a box-shadow in the primary colour (rgb(90, 107, 44)); at rest the shadow is transparent.
    await expect(link).toHaveCSS('box-shadow', /rgb\(90, 107, 44\)/);

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(`${APP}/applications/1`, { timeout: 90_000 });
  });

  // The behaviour behind the data-tag check above: a row click that ran for the link would open the
  // application in a tab of the page's own (as a ctrl-click on a row does), on top of the browser's.
  test('a ctrl-click on the name is left to the browser: this tab does not navigate, and the page opens no tab of its own', async ({ page, context, backend }) => {
    await openListWithChannels(page, backend);
    // Stop the browser opening its own new tab for the link (it would not have the fake backend).
    // A tab that opens anyway is one the page opened itself.
    await page.evaluate(() => document.addEventListener('click', (event) => event.preventDefault()));
    // The page opens its tab with window.open, inside the click: record the calls. The browser reports a
    // tab the page opened only once that page has started (about two seconds on the dev server, past the
    // wait below), so the count of new pages is the backstop, and this is the check that sees it at once.
    await page.evaluate(() => {
      const opens: string[] = [];
      const open = window.open.bind(window);
      window.open = (...args: Parameters<typeof window.open>) => {
        opens.push(String(args[0]));
        return open(...args);
      };
      (window as unknown as { __opens: string[] }).__opens = opens;
    });
    const opened: string[] = [];
    context.on('page', (tab) => opened.push(tab.url()));
    const asked = watchRequestsFor(page, '2');

    await nameLink(page, 'E2E Applicant Two').click({ modifiers: ['Control'] });
    await page.waitForTimeout(1_000);

    const calls = await page.evaluate(() => (window as unknown as { __opens: string[] }).__opens);
    expect(calls, 'a ctrl-click on the name made the page call window.open').toEqual([]);
    expect(opened, 'a ctrl-click on the name opened a tab of the page\'s own').toEqual([]);
    expect(asked, 'a ctrl-click started a navigation in this tab').toEqual([]);
    await expect(page).toHaveURL(`${APP}/applications`);
  });

  test('the column ids are unchanged', async ({ page, backend }) => {
    await openListWithChannels(page, backend);

    const ids = await page.getByRole('columnheader').evaluateAll((headers) => headers.map((header) => header.getAttribute('data-column-id')));
    expect(ids).toEqual(['submitted', 'name', 'mobile', 'branch', 'amount', 'purpose', 'status']);
  });
});

// ---------------------------------------------------------------------------
// 12. What was just added can be opened from the result
// ---------------------------------------------------------------------------

/** What an intake answers when it added these, in the order the input had them (oldest first). */
const added = (...people: [number, string][]) => ({
  status: true,
  added: people.length,
  already_here: 0,
  skipped: [],
  flagged: [],
  new_applications: people.map(([id, full_name]) => ({ id, full_name })),
});

/** The links in the result panel that go to an application. */
const applicationLinks = (panel: Locator): Locator => panel.locator('a[href^="/applications/"]');

/** Upload the CSV and wait for the result panel. */
async function finishedUpload(page: Page, backend: FakeBackend, body: unknown): Promise<Locator> {
  backend.upload = { status: 200, body };
  stubApplicationRecords(backend);
  await signedInAs(page, backend, 'CALLCTR');
  await openApplications(page);
  const section = uploadSection(page);
  await section.getByLabel(FILE_INPUT_LABEL).setInputFiles({ name: 'responses.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV) });
  const panel = section.getByRole('status');
  await expect(panel).toContainText('Upload finished', { timeout: 30_000 });
  return panel;
}

const textTransform = (locator: Locator): Promise<string> => locator.evaluate((element) => getComputedStyle(element).textTransform);

test.describe('12. What was just added can be opened from the result', () => {
  test('one new application: one clear link to it, with its number and its name in capitals', async ({ page, backend }) => {
    const panel = await finishedUpload(page, backend, added([228, 'e2e applicant seven']));

    const link = applicationLinks(panel);
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', '/applications/228');
    // The words, the number to six digits (as everywhere), and the name drawn in capitals (the text is as the server sent it).
    await expect(link).toHaveText('Open the new application: #000228 e2e applicant seven');
    expect(await link.evaluate((element) => (element as HTMLElement).innerText)).toBe('Open the new application: #000228 E2E APPLICANT SEVEN');
    expect(await textTransform(link.locator('span.uppercase'))).toBe('uppercase');
    expect(await textTransform(link)).toBe('none');
    await expect(link).toHaveAccessibleName('Open the new application: #000228 e2e applicant seven');
    // One link is not a list: no heading.
    await expect(panel.getByRole('heading', { name: 'New applications' })).toHaveCount(0);

    await link.click();

    await expect(page).toHaveURL(`${APP}/applications/228`, { timeout: 90_000 });
  });

  test('two new applications: a short list of two links, the newest first', async ({ page, backend }) => {
    const panel = await finishedUpload(page, backend, added([229, 'e2e applicant eight'], [230, 'e2e applicant nine']));

    await expect(panel.getByRole('heading', { name: 'New applications', exact: true })).toBeVisible();
    await expect(panel.getByText('Newest first.', { exact: true })).toBeVisible();
    const links = applicationLinks(panel);
    await expect(links).toHaveCount(2);
    // The input had 229 then 230; the list shows the newest at the top, so does the panel.
    expect(await links.evaluateAll((items) => items.map((item) => item.getAttribute('href')))).toEqual(['/applications/230', '/applications/229']);
    // ("Open" is for screen readers, and is in the text a reader gets; the sighted see the number and the name.)
    expect(await links.evaluateAll((items) => items.map((item) => (item as HTMLElement).innerText.replace(/\s+/g, ' ')))).toEqual([
      'Open #000230 E2E APPLICANT NINE',
      'Open #000229 E2E APPLICANT EIGHT',
    ]);
    expect(await links.first().locator('span.sr-only').evaluate((element) => element.getBoundingClientRect().width)).toBeLessThanOrEqual(1);
    await expect(links.first()).toHaveAccessibleName('Open #000230 e2e applicant nine');
    await expect(panel.getByText(/more at the top of the list/)).toHaveCount(0);
  });

  test('five new applications: all five, newest first, and nothing about more', async ({ page, backend }) => {
    const people = [301, 302, 303, 304, 305].map((id): [number, string] => [id, `E2E Applicant ${id}`]);
    const panel = await finishedUpload(page, backend, added(...people));

    expect(await applicationLinks(panel).evaluateAll((items) => items.map((item) => item.getAttribute('href')))).toEqual([
      '/applications/305', '/applications/304', '/applications/303', '/applications/302', '/applications/301',
    ]);
    await expect(panel.getByText(/more at the top of the list/)).toHaveCount(0);
  });

  test('seven new applications: the newest five are linked, and "and 2 more at the top of the list." says the rest', async ({ page, backend }) => {
    const people = [401, 402, 403, 404, 405, 406, 407].map((id): [number, string] => [id, `E2E Applicant ${id}`]);
    const panel = await finishedUpload(page, backend, added(...people));

    expect(await applicationLinks(panel).evaluateAll((items) => items.map((item) => item.getAttribute('href')))).toEqual([
      '/applications/407', '/applications/406', '/applications/405', '/applications/404', '/applications/403',
    ]);
    await expect(panel.getByText('and 2 more at the top of the list.', { exact: true })).toBeVisible();
    // The tally still counts them all.
    await expect(figure(panel, 'New')).toHaveText('7');
  });

  test('six new applications: five links and "and 1 more at the top of the list."', async ({ page, backend }) => {
    const people = [501, 502, 503, 504, 505, 506].map((id): [number, string] => [id, `E2E Applicant ${id}`]);
    const panel = await finishedUpload(page, backend, added(...people));

    await expect(applicationLinks(panel)).toHaveCount(5);
    await expect(panel.getByText('and 1 more at the top of the list.', { exact: true })).toBeVisible();
  });

  test('nothing new: no links, whether the list is empty, the field is missing, or what is in it is not usable', async ({ page, backend }) => {
    const unusable = [null, 7, 'x', {}, { id: 'abc', full_name: 'E2E Not A Number' }, { id: 0, full_name: 'E2E Zero' }, { id: -4, full_name: 'E2E Negative' }, { id: 1.5, full_name: 'E2E Fraction' }, { id: 12 }, { id: 13, full_name: 99 }];
    const bodies: { name: string; body: Record<string, unknown> }[] = [
      { name: 'an empty list', body: { ...added(), already_here: 3 } },
      { name: 'no field at all (an answer from before it existed)', body: { status: true, added: 2, already_here: 0, skipped: [], flagged: [] } },
      { name: 'a field that is not a list', body: { ...added(), new_applications: 'none' } },
      { name: 'entries that are not applications', body: { ...added(), new_applications: unusable } },
    ];
    stubApplicationRecords(backend);
    await signedInAs(page, backend, 'CALLCTR');
    await openApplications(page);
    for (let index = 0; index < bodies.length; index += 1) {
      const { name, body } = bodies[index];
      backend.upload = { status: 200, body };
      const section = uploadSection(page);
      // A file of its own each time, so the result waited for is this one's and not the last one's.
      const file = `nothing-new-${index}.csv`;
      await section.getByLabel(FILE_INPUT_LABEL).setInputFiles({ name: file, mimeType: 'text/csv', buffer: Buffer.from(CSV) });
      const panel = section.getByRole('status');
      await expect(panel).toContainText(file, { timeout: 30_000 });

      await expect(applicationLinks(panel), name).toHaveCount(0);
      await expect(panel.getByText(/Open the new application|more at the top of the list/), name).toHaveCount(0);
      await expect(panel.getByRole('heading', { name: 'New applications' }), name).toHaveCount(0);
      await expect(panel.getByText('Already here', { exact: true }), name).toBeVisible();
    }
  });

  test('an entry that is not usable is left out; the usable ones around it are linked', async ({ page, backend }) => {
    const panel = await finishedUpload(page, backend, {
      ...added(),
      added: 3,
      new_applications: [{ id: 601, full_name: 'E2E Applicant 601' }, { id: 'abc', full_name: 'E2E Broken' }, { id: '602', full_name: 'E2E Applicant 602' }],
    });

    // A whole id as text is a whole id; the broken one is gone.
    expect(await applicationLinks(panel).evaluateAll((items) => items.map((item) => item.getAttribute('href')))).toEqual([
      '/applications/602', '/applications/601',
    ]);
  });

  test('a paste shows them too, under "Paste finished"', async ({ page, backend }) => {
    backend.paste = { status: 200, body: added([701, 'e2e applicant 701'], [702, 'e2e applicant 702']) };
    stubApplicationRecords(backend);
    await signedInAs(page, backend, 'CALLCTR');
    await openApplications(page);
    const section = uploadSection(page);

    const box = await openPasteBox(section);
    await box.fill(PASTED_ROWS);
    await section.getByRole('button', { name: 'Add pasted rows' }).click();

    const panel = section.getByRole('status');
    await expect(panel).toContainText('Paste finished', { timeout: 30_000 });
    expect(await applicationLinks(panel).evaluateAll((items) => items.map((item) => item.getAttribute('href')))).toEqual([
      '/applications/702', '/applications/701',
    ]);
    await expect(applicationLinks(panel).first()).toHaveAccessibleName('Open #000702 e2e applicant 702');
  });

  test('a PDF shows it too, under "Upload finished"', async ({ page, backend }) => {
    backend.pdf = { status: 200, body: added([801, 'e2e applicant 801']) };
    stubApplicationRecords(backend);
    await signedInAs(page, backend, 'CALLCTR');
    await openApplications(page);
    const section = uploadSection(page);

    await chooseFile(page, section, 'Juana Dela Cruz - response.pdf', layoutToPdf(loadLayout()));

    const panel = section.getByRole('status');
    // pdf.js loads on the first PDF of a visit, and the dev server may compile its chunk.
    await expect(panel).toContainText('Upload finished', { timeout: 90_000 });
    await expect(panel).toContainText('Juana Dela Cruz - response.pdf');
    const link = applicationLinks(panel);
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', '/applications/801');
    await expect(link).toHaveText('Open the new application: #000801 e2e applicant 801');
  });

  test('the next try replaces the links: they belong to the last result only', async ({ page, backend }) => {
    const panel = await finishedUpload(page, backend, added([901, 'e2e applicant 901']));
    await expect(applicationLinks(panel)).toHaveCount(1);

    backend.upload = { status: 200, body: added() };
    await uploadSection(page).getByLabel(FILE_INPUT_LABEL).setInputFiles({ name: 'again.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV) });

    await expect(panel).toContainText('again.csv', { timeout: 30_000 });
    await expect(applicationLinks(panel)).toHaveCount(0);
  });

  test('a failed upload shows no links', async ({ page, backend }) => {
    backend.upload = { status: 422, body: { status: false, message: 'This is not a Google Form download.', new_applications: [{ id: 5, full_name: 'E2E Should Not Show' }] } };
    stubApplicationRecords(backend);
    await signedInAs(page, backend, 'CALLCTR');
    await openApplications(page);
    const section = uploadSection(page);

    await section.getByLabel(FILE_INPUT_LABEL).setInputFiles({ name: 'responses.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV) });

    await expect(section.getByRole('alert')).toContainText('Upload failed', { timeout: 30_000 });
    await expect(applicationLinks(section)).toHaveCount(0);
  });

  test('keyboard: Tab reaches a link, it shows a focus ring, and Enter opens the application', async ({ page, backend }) => {
    const panel = await finishedUpload(page, backend, added([951, 'e2e applicant 951'], [952, 'e2e applicant 952']));
    const links = applicationLinks(panel);
    const first = links.first();
    const isFocused = () => first.evaluate((element) => element === document.activeElement);

    await uploadSection(page).getByRole('button', { name: PASTE_TOGGLE }).focus();
    for (let presses = 0; presses < 10 && !(await isFocused()); presses += 1) await page.keyboard.press('Tab');
    await expect(first).toBeFocused();
    // The ring is a box-shadow in the primary colour (rgb(90, 107, 44)).
    await expect(first).toHaveCSS('box-shadow', /rgb\(90, 107, 44\)/);
    // Tab goes on to the next link, in the order they are drawn.
    await page.keyboard.press('Tab');
    await expect(links.nth(1)).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(first).toBeFocused();

    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(`${APP}/applications/952`, { timeout: 90_000 });
  });

  test('at 360px each link is 48px tall, and a very long name wraps inside the panel instead of widening the page', async ({ page, backend }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const long = 'Napakahabangpangalanngsangsangayngbangkonawalangputolputolparangtalagangsinasadyakungmaaringlumabasngkahon';
    // A short name too: it fits on one line, so only the link's own height makes it 48px.
    const panel = await finishedUpload(page, backend, added([961, long], [962, 'ab'], [963, `${long} ${long}`]));
    const links = applicationLinks(panel);
    await expect(links).toHaveCount(3);

    const frame = (await panel.boundingBox())!;
    for (let index = 0; index < 3; index += 1) {
      const box = (await links.nth(index).boundingBox())!;
      expect(box.height, `link ${index} is under 48px`).toBeGreaterThanOrEqual(47.5);
      expect(box.x + box.width, `link ${index} leaves the panel`).toBeLessThanOrEqual(frame.x + frame.width + 0.5);
      const cut = await links.nth(index).evaluate((element) => element.scrollWidth > element.clientWidth);
      expect(cut, `link ${index} cuts its name`).toBe(false);
    }
    const scrolled = await page.evaluate(() => {
      let shell = document.querySelector('main')?.parentElement ?? null;
      while (shell && shell !== document.body && !['auto', 'scroll'].includes(getComputedStyle(shell).overflowX)) shell = shell.parentElement;
      const over = shell && shell !== document.body ? shell.scrollWidth - shell.clientWidth : 0;
      return Math.max(over, document.documentElement.scrollWidth - document.documentElement.clientWidth);
    });
    expect(scrolled, 'the page scrolled sideways').toBeLessThanOrEqual(0);
  });
});
