/**
 * Applications page, step 1: the user-facing behaviour.
 *
 *   1. Call Center (CALLCTR) sees one menu link, Applications, is sent back to
 *      /applications from any other page, and can upload.
 *   2. Every other sidebar variant (Owner, Accounting, default) carries the link,
 *      it opens /applications and marks itself as the current page there.
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
  },
  {
    id: '2', source: 'google_form', submitted_at: '2026-09-22 14:40:00', location: 'Pasig',
    branch_sub: { id: '1', name: 'E2E Sub-branch' }, status: 'interviewed', full_name: 'E2E Applicant Two',
    contact_no: '09170000002', amount_applied: '20000.00', purpose: 'Tuition',
    intake_flags: ['Amount is above the usual limit'],
  },
  {
    id: '3', source: 'manual', submitted_at: '2026-09-23 10:05:00', location: null,
    branch_sub: { id: '1', name: 'E2E Sub-branch' }, status: 'declined', full_name: 'E2E Applicant Three',
    contact_no: '09170000003', amount_applied: '5000.00', purpose: 'Medical', intake_flags: [],
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
const applicationsLink = (page: Page): Locator =>
  menu(page).getByRole('link', { name: 'Applications', exact: true });
const uploadSection = (page: Page): Locator => page.getByRole('region', { name: 'Google Form responses' });

/** Which of the three sidebar components rendered, told apart by links only one of them has. */
async function sidebarVariant(page: Page): Promise<string> {
  const has = async (href: string) => (await page.locator(`aside a[href="${href}"]`).count()) > 0;
  if (await has('/accounting-dashboard')) return 'SidebarOwner';
  const accounting = await has('/accounting/coa');
  const borrowers = await has('/borrowers');
  if (accounting && !borrowers) return 'SidebarAcctg';
  if (borrowers && !accounting) return 'Sidebar';
  return 'unknown';
}

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
  test('the sidebar menu holds exactly one link: Applications', async ({ page, backend }) => {
    await signedInAs(page, backend, 'CALLCTR');
    await openApplications(page);

    const links = menu(page).getByRole('link');
    await expect(links).toHaveCount(1);
    await expect(links).toHaveText('Applications');
    await expect(links).toHaveAttribute('href', '/applications');
    await expect(links).toHaveAttribute('aria-current', 'page');
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
// 2. The Applications link on every other sidebar variant
// ---------------------------------------------------------------------------

test.describe('2. Applications link in every sidebar', () => {
  const VARIANTS: { code: RoleCode; sidebar: string }[] = [
    { code: 'OWN', sidebar: 'SidebarOwner' },
    { code: 'ACCTG', sidebar: 'SidebarAcctg' },
    { code: 'ADM', sidebar: 'Sidebar' },
    { code: 'PROC', sidebar: 'Sidebar' },
  ];

  for (const { code, sidebar } of VARIANTS) {
    test(`${code} (${sidebar}): the link opens /applications and is marked current there`, async ({ page, backend }) => {
      await signedInAs(page, backend, code);
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 120_000 });

      const link = applicationsLink(page);
      await expect(link).toBeVisible({ timeout: 90_000 });
      expect(await sidebarVariant(page), `${code} rendered the wrong sidebar`).toBe(sidebar);
      await expect(link).not.toHaveAttribute('aria-current', 'page');

      await link.click();

      await expect(page).toHaveURL(`${APP}/applications`, { timeout: 90_000 });
      await expect(page.getByRole('group', { name: 'Filter applications by status' })).toBeVisible({ timeout: 90_000 });
      await expect(link).toHaveAttribute('aria-current', 'page');
    });
  }
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
    await expect(applicationsLink(page)).toBeVisible({ timeout: 90_000 });
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
