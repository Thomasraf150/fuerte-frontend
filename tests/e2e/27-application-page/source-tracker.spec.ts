/**
 * Source tracker (/applications/tracker) and the Applications sidebar dropdown.
 *
 *   1. The logic with no browser: the period presets as Manila calendar days, the line
 *      that names a range, the shares, and which sidebar item a path lights up.
 *   2. The sidebar: Applications is a dropdown in every sidebar variant, and in Call
 *      Center's (which shows only it). It is closed away from /applications, opens, both
 *      links work, and the current one is marked.
 *   3. The page: it opens on this month and asks for exactly those days; each preset and
 *      Custom ask for theirs; the counts render with shares, zeros and "Not recorded";
 *      an empty period says so; the browser stops a backwards or half-typed Custom range
 *      before Apply, and a range over a year shows the server's message; the loading
 *      state; a slow answer to an earlier period never replaces the latest; and 360px.
 *
 * NO CREDENTIALS AND NO BACKEND, as in tests/e2e/25-applications/applications.spec.ts: a
 * made-up token and a fictional user are seeded into the persisted auth store (localStorage
 * 'authStore'), and every request to the backend origin is answered here. A request no
 * stub answers is aborted, so it never reaches the API, and fails the test. Nothing is read
 * from or written to the database.
 *
 * THE CLOCK. The page runs on a faked clock (page.clock.install) at 03:00 on Thursday
 * 1 Oct 2026 in Manila, in a browser set to Los Angeles. In both UTC and Los Angeles it is
 * still 30 Sep, so a page that took its days from the browser's zone, or from UTC, would
 * ask for the wrong ones.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/27-application-page/source-tracker.spec.ts --reporter=list
 */
import { test as base, expect, Locator, Page, Route } from '@playwright/test';
import { applicationsNav } from '../../../src/components/Sidebar/applicationsNav';
import {
  applicationsNoun,
  formatPeriod,
  manilaToday,
  presetRange,
  shareLabel,
  summarizeSources,
  type DayRange,
} from '../../../src/utils/sourceTracker';

const APP = 'http://localhost:3000';
/** Where the dev build points: NEXT_PUBLIC_API_URL=<BACKEND>/api, NEXT_PUBLIC_API_GRAPHQL=<BACKEND>/fuerte-api. */
const BACKEND = 'http://localhost:8080';
const FAKE_TOKEN = 'e2e-fake-token';

/** 03:00 on Thursday 1 Oct 2026 in Manila. Still 30 Sep in UTC and in Los Angeles. */
const NOW = new Date('2026-10-01T03:00:00+08:00');

// What the page must ask for at NOW. Written out, not computed by the code under test.
const TODAY: DayRange = { from: '2026-10-01', to: '2026-10-01' };
const THIS_WEEK: DayRange = { from: '2026-09-28', to: '2026-10-04' };
const THIS_MONTH: DayRange = { from: '2026-10-01', to: '2026-10-31' };
const LAST_MONTH: DayRange = { from: '2026-09-01', to: '2026-09-30' };

const RANGE_REFUSED = 'Check the dates: the start date must not be after the end date, and the period can be one year at most.';

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
// The fake backend: answers every request to BACKEND, records what it was sent.
// ---------------------------------------------------------------------------

interface GraphqlCall {
  field: string;
  variables: Record<string, unknown>;
}

/** A whole GraphQL response body, so a stub can answer with `errors` as the server does. */
interface GraphqlBody {
  data?: unknown;
  errors?: { message: string }[];
}

type Variables = Record<string, unknown>;
type SourceCount = { channel: string; count: number };

/** Twenty-four applications: 12 Google Form, 6 Messenger, 4 walk-in, 2 call or text. */
const COUNTS: SourceCount[] = [
  { channel: 'google_form', count: 12 },
  { channel: 'facebook', count: 6 },
  { channel: 'walk_in', count: 4 },
  { channel: 'phone', count: 2 },
];

/** The four sources in the server's order, from their counts, plus `unknown` when there is one. */
const counts = (google: number, facebook: number, walkIn: number, phone: number, unknown?: number): GraphqlBody => ({
  data: {
    getApplicationSourceCounts: [
      { channel: 'google_form', count: google },
      { channel: 'facebook', count: facebook },
      { channel: 'walk_in', count: walkIn },
      { channel: 'phone', count: phone },
      ...(unknown === undefined ? [] : [{ channel: 'unknown', count: unknown }]),
    ],
  },
});

const refusal = (message: string): GraphqlBody => ({ errors: [{ message }], data: null });

/** A funnel with nothing in it. */
const EMPTY_FUNNEL = Object.fromEntries(
  ['applied', 'became_borrower', 'approved', 'loan_released', 'declined', 'rejected', 'loan_cancelled', 'for_interview', 'interviewed',
    'borrower', 'approved_no_loan', 'loan_in_process', 'rejected_with_loan', 'released_without_approval', 'borrower_deleted'].map((key) => [key, 0]),
);

/** The server's rule: both ends inclusive, no reversed range, at most 366 days. */
const refusesRange = ({ from, to }: DayRange): boolean => {
  const days = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000 + 1;
  return !(days >= 1 && days <= 366);
};

/** A cross-origin response (3000 -> 8080) must allow the page's origin. */
const CORS = { 'Access-Control-Allow-Origin': APP, 'Access-Control-Allow-Credentials': 'true' };

/** The first field of the operation's selection set: "getApplicationSourceCounts", "maintenance", ... */
const rootField = (query: string): string =>
  query.slice(query.indexOf('{') + 1).match(/^\s*([A-Za-z_]\w*)/)?.[1] ?? '(unparsed)';

const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });

class FakeBackend {
  /** Who GET /api/user says is signed in. */
  user: ReturnType<typeof fakeUser> | null = null;
  /** What getApplicationSourceCounts answers; a test replaces it. The default follows the server's rule over COUNTS. */
  sourceCounts: (variables: Variables) => GraphqlBody | Promise<GraphqlBody> = (variables) =>
    refusesRange(variables as unknown as DayRange)
      ? refusal(RANGE_REFUSED)
      : { data: { getApplicationSourceCounts: COUNTS } };

  readonly graphql: GraphqlCall[] = [];
  /** GraphQL fields nothing here answers: answered empty, as the Applications spec does for the dashboard. */
  readonly unknownFields: string[] = [];
  /** Any other request to the backend: aborted, and the test fails. */
  readonly unstubbed: string[] = [];
  readonly pageErrors: string[] = [];

  calls(field: string): GraphqlCall[] {
    return this.graphql.filter((call) => call.field === field);
  }

  /** The days of the newest getApplicationSourceCounts request. */
  lastRange(): Variables | undefined {
    const calls = this.calls('getApplicationSourceCounts');
    return calls[calls.length - 1]?.variables;
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
    if (method === 'POST' && path === '/fuerte-api') {
      const { query = '', variables = {} } = request.postDataJSON() ?? {};
      const field = rootField(query);
      this.graphql.push({ field, variables: variables ?? {} });
      return json(route, 200, await this.answer(field, variables ?? {}));
    }

    this.unstubbed.push(`${method} ${request.url()}`);
    return route.abort('blockedbyclient');
  }

  private async answer(field: string, variables: Variables): Promise<GraphqlBody> {
    switch (field) {
      case 'getApplicationSourceCounts':
        return this.sourceCounts(variables);
      // The applicant funnel under the counts (tests/e2e/30-applicant-funnel tests it): nothing in it.
      case 'getApplicationFunnel':
        return { data: { getApplicationFunnel: { total: EMPTY_FUNNEL, by_channel: [] } } };
      // The root layout's probe on every page: never in maintenance.
      case 'maintenance':
        return { data: { maintenance: { data: { isMaintenanceModeOn: 0 } } } };
      // The approval bell, for approver roles.
      case 'pendingDeletionRequestsForMe':
        return { data: { pendingDeletionRequestsForMe: [] } };
      // The Applications list, which the sidebar's Applications link opens: nothing in it.
      case 'getLoanApplications':
        return {
          data: {
            getLoanApplications: {
              data: [],
              paginatorInfo: { total: 0, currentPage: 1, lastPage: 1, hasMorePages: false },
            },
          },
        };
      // New application: its branch picker and the borrower Details form's picklists, all empty.
      case 'getApplicationBranches':
        return { data: { getApplicationBranches: [] } };
      case 'getMyAccessibleBranchSubs':
        return { data: { getMyAccessibleBranchSubs: [] } };
      case 'getBranch':
        return { data: { getBranch: [] } };
      case 'getChief':
        return { data: { getChief: { data: [] } } };
      case 'getAreas':
        return { data: { getAreas: { data: [] } } };
      case 'getBorrCompanies':
        return { data: { getBorrCompanies: { data: [] } } };
      default:
        this.unknownFields.push(field);
        return { data: {} };
    }
  }
}

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

const menu = (page: Page): Locator => page.locator('aside nav');
const groupToggle = (page: Page): Locator => menu(page).getByRole('button', { name: 'Applications', exact: true });
const listLink = (page: Page): Locator => menu(page).getByRole('link', { name: 'Applications', exact: true });
const trackerLink = (page: Page): Locator => menu(page).getByRole('link', { name: 'Source tracker', exact: true });

const period = (page: Page): Locator => page.getByRole('group', { name: 'Period' });
const chip = (page: Page, name: string): Locator => period(page).getByRole('button', { name, exact: true });
const fromBox = (page: Page): Locator => page.getByLabel('From', { exact: true });
const toBox = (page: Page): Locator => page.getByLabel('To', { exact: true });
const applyButton = (page: Page): Locator => page.getByRole('button', { name: 'Apply', exact: true });

/** The big number under "Total", with its screen-reader unit: "24 applications". */
/** The source counts' own card: the applicant funnel under it has headings and words of its own (tests/e2e/30-applicant-funnel). */
const sources = (page: Page): Locator => page.getByRole('region', { name: 'Applications by source' });
const total = (page: Page): Locator => page.getByText('Total', { exact: true }).locator('xpath=following-sibling::p[1]');
/** One source's card: found by its heading. */
const card = (page: Page, label: string): Locator =>
  page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: label, exact: true }) });
/** The red alert that holds a message (Next's own route announcer is an alert too, so match the text). */
const alertWith = (page: Page, text: string): Locator => page.getByRole('alert').filter({ hasText: text });
/** The days on screen, as the line under the chips words them. */
const daysLabel = (page: Page, text: string): Locator => page.getByText(text, { exact: true });

/** Open the tracker and wait for its page, not its numbers. */
async function gotoTracker(page: Page): Promise<void> {
  await page.clock.install({ time: NOW });
  // The dev server compiles a route on its first visit.
  await page.goto('/applications/tracker', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await expect(page.getByRole('heading', { name: 'Applications by source' })).toBeVisible({ timeout: 90_000 });
  // Every date below is only right if the page really runs at NOW. The real day may be this very one,
  // so a clock that did not take would pass by luck: check it did.
  expect((await page.evaluate(() => new Date().toISOString())).slice(0, 13), 'the page is on the faked clock').toBe('2026-09-30T19');
}

/** Open the tracker as `role`, and wait until the first answer is on screen. */
async function openTracker(page: Page, backend: FakeBackend, role: RoleCode = 'ADM'): Promise<void> {
  await signedInAs(page, backend, role);
  await gotoTracker(page);
  await expect(total(page)).toBeVisible({ timeout: 30_000 });
}

/** How far the page's scroll container (and the document) scroll sideways, in px. */
const sidewaysScroll = (page: Page): Promise<number> =>
  page.evaluate(() => {
    let shell = document.querySelector('main')?.parentElement ?? null;
    while (shell && shell !== document.body && !['auto', 'scroll'].includes(getComputedStyle(shell).overflowX)) {
      shell = shell.parentElement;
    }
    const shellOver = shell && shell !== document.body ? shell.scrollWidth - shell.clientWidth : 0;
    return Math.max(shellOver, document.documentElement.scrollWidth - document.documentElement.clientWidth);
  });

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

// ---------------------------------------------------------------------------
// 1. The logic, with no browser
// ---------------------------------------------------------------------------

test.describe('1. Period presets are Manila calendar days', () => {
  test('manilaToday follows Manila, not UTC, across its midnight', () => {
    // 15:59:59 UTC is 23:59:59 in Manila; one second later it is the next day there.
    expect(manilaToday(new Date('2026-09-30T15:59:59Z'))).toBe('2026-09-30');
    expect(manilaToday(new Date('2026-09-30T16:00:00Z'))).toBe('2026-10-01');
    expect(manilaToday(new Date('2026-12-31T16:00:00Z'))).toBe('2027-01-01');
    expect(manilaToday(NOW)).toBe('2026-10-01');
  });

  const CASES: { today: string; label: string; today_: DayRange; week: DayRange; month: DayRange; lastMonth: DayRange }[] = [
    {
      // Thursday, mid-week, and the week starts in the month before.
      today: '2026-10-01', label: 'Thu 1 Oct 2026',
      today_: { from: '2026-10-01', to: '2026-10-01' },
      week: { from: '2026-09-28', to: '2026-10-04' },
      month: { from: '2026-10-01', to: '2026-10-31' },
      lastMonth: { from: '2026-09-01', to: '2026-09-30' },
    },
    {
      // Monday: the week starts today.
      today: '2026-09-28', label: 'Mon 28 Sep 2026',
      today_: { from: '2026-09-28', to: '2026-09-28' },
      week: { from: '2026-09-28', to: '2026-10-04' },
      month: { from: '2026-09-01', to: '2026-09-30' },
      lastMonth: { from: '2026-08-01', to: '2026-08-31' },
    },
    {
      // Sunday: still the week that began on the Monday before, not the next one.
      today: '2026-10-04', label: 'Sun 4 Oct 2026',
      today_: { from: '2026-10-04', to: '2026-10-04' },
      week: { from: '2026-09-28', to: '2026-10-04' },
      month: { from: '2026-10-01', to: '2026-10-31' },
      lastMonth: { from: '2026-09-01', to: '2026-09-30' },
    },
    {
      // January: last month is December of the year before, and the week crosses New Year.
      today: '2027-01-01', label: 'Fri 1 Jan 2027',
      today_: { from: '2027-01-01', to: '2027-01-01' },
      week: { from: '2026-12-28', to: '2027-01-03' },
      month: { from: '2027-01-01', to: '2027-01-31' },
      lastMonth: { from: '2026-12-01', to: '2026-12-31' },
    },
    {
      // A leap year's February has 29 days; March's "last month" ends on the 29th.
      today: '2028-03-15', label: 'Wed 15 Mar 2028',
      today_: { from: '2028-03-15', to: '2028-03-15' },
      week: { from: '2028-03-13', to: '2028-03-19' },
      month: { from: '2028-03-01', to: '2028-03-31' },
      lastMonth: { from: '2028-02-01', to: '2028-02-29' },
    },
    {
      // The last day of a 30-day month.
      today: '2026-11-30', label: 'Mon 30 Nov 2026',
      today_: { from: '2026-11-30', to: '2026-11-30' },
      week: { from: '2026-11-30', to: '2026-12-06' },
      month: { from: '2026-11-01', to: '2026-11-30' },
      lastMonth: { from: '2026-10-01', to: '2026-10-31' },
    },
  ];

  for (const c of CASES) {
    test(`every preset on ${c.label}`, () => {
      expect(presetRange('today', c.today)).toEqual(c.today_);
      expect(presetRange('week', c.today)).toEqual(c.week);
      expect(presetRange('month', c.today)).toEqual(c.month);
      expect(presetRange('lastMonth', c.today)).toEqual(c.lastMonth);
    });
  }

  test('formatPeriod names a range in fixed words', () => {
    expect(formatPeriod({ from: '2026-10-01', to: '2026-10-31' })).toBe('Oct 1 – Oct 31, 2026');
    expect(formatPeriod({ from: '2026-09-28', to: '2026-10-04' })).toBe('Sep 28 – Oct 4, 2026');
    expect(formatPeriod({ from: '2026-12-28', to: '2027-01-03' })).toBe('Dec 28, 2026 – Jan 3, 2027');
    expect(formatPeriod({ from: '2026-10-01', to: '2026-10-01' })).toBe('Oct 1, 2026');
  });
});

test.describe('1. Shares and counts', () => {
  test('shareLabel rounds, and never rounds into a lie', () => {
    expect(shareLabel(12, 24)).toBe('50%');
    expect(shareLabel(4, 24)).toBe('17%');
    expect(shareLabel(2, 24)).toBe('8%');
    expect(shareLabel(0, 24)).toBe('0%');
    expect(shareLabel(24, 24)).toBe('100%');
    expect(shareLabel(0, 0)).toBe('—');
    // 1 in 401 is a quarter of a percent: not "0%", because there is one.
    expect(shareLabel(1, 401)).toBe('<1%');
    // 999 in 1000 rounds to 100, but it is not everything.
    expect(shareLabel(999, 1000)).toBe('99%');
  });

  test('applicationsNoun is singular for one only', () => {
    expect(applicationsNoun(0)).toBe('applications');
    expect(applicationsNoun(1)).toBe('application');
    expect(applicationsNoun(2)).toBe('applications');
  });

  test('summarizeSources keeps the four in order, zeros included, and puts the rest in Not recorded', () => {
    expect(summarizeSources([])).toEqual({
      total: 0,
      rows: [
        { channel: 'google_form', count: 0 },
        { channel: 'facebook', count: 0 },
        { channel: 'walk_in', count: 0 },
        { channel: 'phone', count: 0 },
      ],
      notRecorded: 0,
    });
    // Out of order, with `unknown`, a channel this page has no card for, and counts that are not whole numbers.
    const summary = summarizeSources([
      { channel: 'unknown', count: 3 },
      { channel: 'phone', count: 2 },
      { channel: 'email', count: 1 },
      { channel: 'google_form', count: 12 },
      { channel: 'walk_in', count: -5 },
      { channel: 'facebook', count: Number.NaN },
    ]);
    expect(summary.rows).toEqual([
      { channel: 'google_form', count: 12 },
      { channel: 'facebook', count: 0 },
      { channel: 'walk_in', count: 0 },
      { channel: 'phone', count: 2 },
    ]);
    expect(summary.notRecorded).toBe(4);
    expect(summary.total).toBe(18);
  });
});

test.describe('1. Which sidebar item a path lights up', () => {
  const CASES: { path: string; inGroup: boolean; list: boolean; tracker: boolean }[] = [
    { path: '/applications', inGroup: true, list: true, tracker: false },
    { path: '/applications/new', inGroup: true, list: true, tracker: false },
    { path: '/applications/123', inGroup: true, list: true, tracker: false },
    { path: '/applications/tracker', inGroup: true, list: false, tracker: true },
    // Never a sibling route, nor a page that merely starts with the word.
    { path: '/applications-archive', inGroup: false, list: false, tracker: false },
    { path: '/applicationsX', inGroup: false, list: false, tracker: false },
    { path: '/', inGroup: false, list: false, tracker: false },
    { path: '/borrowers', inGroup: false, list: false, tracker: false },
  ];

  for (const { path, ...expected } of CASES) {
    test(`${path}`, () => {
      expect(applicationsNav(path)).toEqual(expected);
    });
  }
});

// ---------------------------------------------------------------------------
// 2. The sidebar
// ---------------------------------------------------------------------------

test.describe('2. Applications dropdown in every sidebar', () => {
  const VARIANTS: { code: RoleCode; sidebar: string }[] = [
    { code: 'OWN', sidebar: 'SidebarOwner' },
    { code: 'ACCTG', sidebar: 'SidebarAcctg' },
    { code: 'ADM', sidebar: 'Sidebar' },
    { code: 'PROC', sidebar: 'Sidebar' },
  ];

  for (const { code, sidebar } of VARIANTS) {
    test(`${code} (${sidebar}): closed away from /applications; it opens, both links work, the current one is marked`, async ({ page, backend }) => {
      await signedInAs(page, backend, code);
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 120_000 });

      const toggle = groupToggle(page);
      await expect(toggle).toBeVisible({ timeout: 90_000 });
      expect(await sidebarVariant(page), `${code} rendered the wrong sidebar`).toBe(sidebar);

      // Closed, and its links are out of reach until it opens.
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(trackerLink(page)).toBeHidden();
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      await expect(listLink(page)).toHaveAttribute('href', '/applications');
      await expect(trackerLink(page)).toHaveAttribute('href', '/applications/tracker');
      // Away from /applications neither is current.
      await expect(listLink(page)).not.toHaveAttribute('aria-current', 'page');
      await expect(trackerLink(page)).not.toHaveAttribute('aria-current', 'page');

      await trackerLink(page).click();
      await expect(page).toHaveURL(`${APP}/applications/tracker`, { timeout: 90_000 });
      await expect(page.getByRole('heading', { name: 'Applications by source' })).toBeVisible({ timeout: 90_000 });
      await expect(trackerLink(page)).toHaveAttribute('aria-current', 'page');
      await expect(listLink(page)).not.toHaveAttribute('aria-current', 'page');
      await expect(groupToggle(page)).toHaveAttribute('aria-expanded', 'true');

      await listLink(page).click();
      await expect(page).toHaveURL(`${APP}/applications`, { timeout: 90_000 });
      await expect(page.getByRole('group', { name: 'Filter applications by status' })).toBeVisible({ timeout: 90_000 });
      await expect(listLink(page)).toHaveAttribute('aria-current', 'page');
      await expect(trackerLink(page)).not.toHaveAttribute('aria-current', 'page');
      await expect(groupToggle(page)).toHaveAttribute('aria-expanded', 'true');
    });
  }

  test('New application marks Applications, not Source tracker, and the group is open there', async ({ page, backend }) => {
    await signedInAs(page, backend, 'OWN');
    await page.goto('/applications/new', { waitUntil: 'domcontentloaded', timeout: 120_000 });

    await expect(groupToggle(page)).toBeVisible({ timeout: 90_000 });
    await expect(groupToggle(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(listLink(page)).toHaveAttribute('aria-current', 'page');
    await expect(trackerLink(page)).not.toHaveAttribute('aria-current', 'page');
  });

  test('the toggle is a real button: Enter and Space both open and close it, and it can be closed on the page', async ({ page, backend }) => {
    await signedInAs(page, backend, 'ADM');
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 120_000 });

    const toggle = groupToggle(page);
    await expect(toggle).toBeVisible({ timeout: 90_000 });
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(trackerLink(page)).toBeVisible();
    await page.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(trackerLink(page)).toBeHidden();
    // aria-controls names the sub-menu it opens.
    const controls = await toggle.getAttribute('aria-controls');
    expect(controls, 'the toggle names the menu it controls').toBeTruthy();
    await expect(page.locator(`[id="${controls}"]`)).toContainText('Source tracker');
  });

  test('the phone drawer: the toggle and both links are 48px touch targets, and a tap on Source tracker goes there', async ({ page, backend }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await signedInAs(page, backend, 'ADM');
    await page.goto('/applications', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await expect(page.getByRole('group', { name: 'Filter applications by status' })).toBeVisible({ timeout: 90_000 });

    // Below lg the sidebar is a drawer behind the header's menu button (which has no name of its own).
    await page.locator('header button[aria-controls="sidebar"]').click();
    await expect(groupToggle(page)).toHaveAttribute('aria-expanded', 'true');
    // The drawer slides in over 300ms: wait until the menu has arrived on screen before measuring.
    await expect.poll(async () => (await groupToggle(page).boundingBox())?.x ?? -1).toBeGreaterThanOrEqual(0);
    const targets: [string, Locator][] = [
      ['the toggle', groupToggle(page)],
      ['Applications', listLink(page)],
      ['Source tracker', trackerLink(page)],
    ];
    for (const [name, target] of targets) {
      const box = await target.boundingBox();
      expect(box, `${name} has a box`).not.toBeNull();
      expect(box!.height, `${name} is at least 48px tall`).toBeGreaterThanOrEqual(47.5);
      expect(box!.x + box!.width, `${name} fits the 360px screen`).toBeLessThanOrEqual(360);
    }

    await trackerLink(page).click();
    await expect(page).toHaveURL(`${APP}/applications/tracker`, { timeout: 90_000 });
    await expect(page.getByRole('heading', { name: 'Applications by source' })).toBeVisible({ timeout: 90_000 });
  });

  test('Call Center: the menu is the Applications group alone, open on the tracker', async ({ page, backend }) => {
    await signedInAs(page, backend, 'CALLCTR');
    await gotoTracker(page);

    await expect(groupToggle(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(menu(page).getByRole('button')).toHaveCount(1);
    const links = menu(page).getByRole('link');
    await expect(links).toHaveCount(2);
    await expect(links).toHaveText(['Applications', 'Source tracker']);
    await expect(trackerLink(page)).toHaveAttribute('aria-current', 'page');
    await expect(listLink(page)).not.toHaveAttribute('aria-current', 'page');

    // The breadcrumb starts at Applications: a first link to the Dashboard would bounce Call Center straight back.
    const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(crumbs.getByRole('link', { name: 'Applications' })).toHaveAttribute('href', '/applications');
    await expect(crumbs.getByRole('link', { name: 'Dashboard' })).toHaveCount(0);

    // Source tracker did not make Call Center's one menu any bigger: the other way in is still Applications.
    await listLink(page).click();
    await expect(page).toHaveURL(`${APP}/applications`, { timeout: 90_000 });
    await expect(page.getByRole('group', { name: 'Filter applications by status' })).toBeVisible({ timeout: 90_000 });
    await expect(listLink(page)).toHaveAttribute('aria-current', 'page');
  });
});

// ---------------------------------------------------------------------------
// 3. The page
// ---------------------------------------------------------------------------

test.describe('3. Source tracker page', () => {
  // The browser is in Los Angeles: every day the page asks for must come from Manila, not from here.
  test.use({ timezoneId: 'America/Los_Angeles' });

  // The browser tab keeps the root layout's own <title> (app-wide, not this page's doing), so the page's metadata is read from the server's HTML.
  test('its metadata names the page "Source tracker | Fuerte"', async ({ page }) => {
    const response = await page.request.get('/applications/tracker', { timeout: 120_000 });
    expect(response.ok()).toBe(true);
    expect(await response.text()).toContain('<title>Source tracker | Fuerte</title>');
  });

  test('the premise: the browser is in Los Angeles, where it is still 30 Sep, yet Today asks for 1 Oct', async ({ page, backend }) => {
    await openTracker(page, backend);

    const browser = await page.evaluate(() => ({
      zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      day: new Date().toLocaleDateString('en-CA'),
    }));
    expect(browser).toEqual({ zone: 'America/Los_Angeles', day: '2026-09-30' });

    await chip(page, 'Today').click();
    await expect.poll(() => backend.lastRange()).toEqual(TODAY);
  });

  test('it opens on this month and asks for exactly those Manila days', async ({ page, backend }) => {
    await openTracker(page, backend);

    const asked = backend.calls('getApplicationSourceCounts');
    expect(asked.length).toBeGreaterThan(0);
    for (const call of asked) expect(call.variables).toEqual(THIS_MONTH);
    await expect(chip(page, 'This month')).toHaveAttribute('aria-pressed', 'true');
    for (const other of ['Today', 'This week', 'Last month', 'Custom']) {
      await expect(chip(page, other)).toHaveAttribute('aria-pressed', 'false');
    }
    await expect(daysLabel(page, 'Oct 1 – Oct 31, 2026')).toBeVisible();
    expect(backend.unknownFields, 'the page asked for a field the test does not know').toEqual([]);
  });

  test('each preset asks for its own days, and the chip and the label follow', async ({ page, backend }) => {
    await openTracker(page, backend);

    const PRESETS: { name: string; days: DayRange; label: string }[] = [
      { name: 'Today', days: TODAY, label: 'Oct 1, 2026' },
      { name: 'This week', days: THIS_WEEK, label: 'Sep 28 – Oct 4, 2026' },
      { name: 'Last month', days: LAST_MONTH, label: 'Sep 1 – Sep 30, 2026' },
      { name: 'This month', days: THIS_MONTH, label: 'Oct 1 – Oct 31, 2026' },
    ];
    for (const { name, days, label } of PRESETS) {
      await chip(page, name).click();
      await expect.poll(() => backend.lastRange(), { message: `${name} asks for ${days.from} to ${days.to}` }).toEqual(days);
      await expect(chip(page, name)).toHaveAttribute('aria-pressed', 'true');
      await expect(period(page).locator('button[aria-pressed="true"]')).toHaveCount(1);
      await expect(daysLabel(page, label)).toBeVisible();
      await expect(total(page)).toBeVisible();
    }
  });

  test('the chips are real buttons: Enter on one chooses it', async ({ page, backend }) => {
    await openTracker(page, backend);

    await chip(page, 'Last month').focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => backend.lastRange()).toEqual(LAST_MONTH);
    await expect(chip(page, 'Last month')).toHaveAttribute('aria-pressed', 'true');
  });

  test('Custom starts from the days on screen, asks nothing until Apply, then sends the two dates', async ({ page, backend }) => {
    await openTracker(page, backend);

    await chip(page, 'Custom').click();
    await expect(chip(page, 'Custom')).toHaveAttribute('aria-pressed', 'true');
    await expect(fromBox(page)).toHaveValue('2026-10-01');
    await expect(toBox(page)).toHaveValue('2026-10-31');

    const before = backend.calls('getApplicationSourceCounts').length;
    await fromBox(page).fill('2026-08-15');
    await toBox(page).fill('2026-09-14');
    // A request on change would have gone by now.
    await page.waitForTimeout(500);
    expect(backend.calls('getApplicationSourceCounts')).toHaveLength(before);
    // Still showing the days the numbers are for.
    await expect(daysLabel(page, 'Oct 1 – Oct 31, 2026')).toBeVisible();

    await applyButton(page).click();
    await expect.poll(() => backend.lastRange()).toEqual({ from: '2026-08-15', to: '2026-09-14' });
    await expect(daysLabel(page, 'Aug 15 – Sep 14, 2026')).toBeVisible();
    await expect(total(page)).toBeVisible();

    // Back to a preset: the boxes go, and the preset's days are asked for again.
    await chip(page, 'This week').click();
    await expect.poll(() => backend.lastRange()).toEqual(THIS_WEEK);
    await expect(fromBox(page)).toHaveCount(0);
    // Custom again starts from what is on screen now, not from the range it was last given.
    await chip(page, 'Custom').click();
    await expect(fromBox(page)).toHaveValue('2026-09-28');
    await expect(toBox(page)).toHaveValue('2026-10-04');
  });

  test('a range of more than a year shows the server\'s message, Retry asks again, and a preset recovers', async ({ page, backend }) => {
    await openTracker(page, backend);

    await chip(page, 'Custom').click();
    await fromBox(page).fill('2025-01-01');
    await toBox(page).fill('2026-10-01');
    await applyButton(page).click();

    const alert = alertWith(page, RANGE_REFUSED);
    await expect(alert).toBeVisible();
    await expect.poll(() => backend.lastRange()).toEqual({ from: '2025-01-01', to: '2026-10-01' });
    // No numbers under an error, and no skeleton either.
    await expect(total(page)).toHaveCount(0);
    await expect(daysLabel(page, 'Jan 1, 2025 – Oct 1, 2026')).toBeVisible();

    const before = backend.calls('getApplicationSourceCounts').length;
    await alert.getByRole('button', { name: 'Retry' }).click();
    await expect.poll(() => backend.calls('getApplicationSourceCounts').length).toBeGreaterThan(before);
    await expect(alertWith(page, RANGE_REFUSED)).toBeVisible();

    await chip(page, 'This month').click();
    await expect(total(page)).toHaveText('24 applications');
    await expect(alertWith(page, RANGE_REFUSED)).toHaveCount(0);
  });

  test('To cannot be earlier than From: the browser stops a backwards range, so nothing is asked', async ({ page, backend }) => {
    await openTracker(page, backend);

    await chip(page, 'Custom').click();
    // To's earliest day follows From. From has no ceiling of its own: one would grey out every
    // day after the To already chosen in From's calendar, so a range could not move forward From-first.
    await expect(toBox(page)).toHaveAttribute('min', '2026-10-01');
    expect(await fromBox(page).getAttribute('max'), 'From has no max').toBeNull();
    await fromBox(page).fill('2026-10-20');
    await expect(toBox(page)).toHaveAttribute('min', '2026-10-20');

    const before = backend.calls('getApplicationSourceCounts').length;
    await toBox(page).fill('2026-10-10');
    await applyButton(page).click();
    expect(await toBox(page).evaluate((el: HTMLInputElement) => el.validity.rangeUnderflow)).toBe(true);
    // A request on Apply would have gone by now.
    await page.waitForTimeout(500);
    expect(backend.calls('getApplicationSourceCounts')).toHaveLength(before);
    await expect(alertWith(page, RANGE_REFUSED)).toHaveCount(0);
    await expect(daysLabel(page, 'Oct 1 – Oct 31, 2026')).toBeVisible();

    // One day is a range: a To on the same day as From goes through.
    await toBox(page).fill('2026-10-20');
    await applyButton(page).click();
    await expect.poll(() => backend.lastRange()).toEqual({ from: '2026-10-20', to: '2026-10-20' });
    await expect(daysLabel(page, 'Oct 20, 2026')).toBeVisible();
  });

  test('a From moved past the To on screen is fine once To follows it', async ({ page, backend }) => {
    await openTracker(page, backend);

    await chip(page, 'Custom').click();
    // Picking From first, forward past the To shown (31 Oct), then To.
    await fromBox(page).fill('2026-11-05');
    await expect(toBox(page)).toHaveAttribute('min', '2026-11-05');
    await toBox(page).fill('2026-11-30');
    await applyButton(page).click();

    await expect.poll(() => backend.lastRange()).toEqual({ from: '2026-11-05', to: '2026-11-30' });
    await expect(daysLabel(page, 'Nov 5 – Nov 30, 2026')).toBeVisible();
    await expect(alertWith(page, RANGE_REFUSED)).toHaveCount(0);
  });

  test('the browser stops an empty date and a year typed halfway, so nothing is asked', async ({ page, backend }) => {
    await openTracker(page, backend);

    await chip(page, 'Custom').click();
    const before = backend.calls('getApplicationSourceCounts').length;

    await fromBox(page).fill('');
    await applyButton(page).click();
    expect(await fromBox(page).evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
    // With no From, To's earliest day is just the floor every date box shares.
    await expect(toBox(page)).toHaveAttribute('min', '2022-01-01');

    // Chrome commits "0002-10-01" the moment the first digit of 2026 is typed.
    await fromBox(page).fill('0002-10-01');
    await applyButton(page).click();
    expect(await fromBox(page).evaluate((el: HTMLInputElement) => el.validity.rangeUnderflow)).toBe(true);
    // A half-typed From must not become To's earliest day: that would be a year-0002 floor, i.e. none.
    await expect(toBox(page)).toHaveAttribute('min', '2022-01-01');

    await page.waitForTimeout(500);
    expect(backend.calls('getApplicationSourceCounts')).toHaveLength(before);
    await expect(alertWith(page, RANGE_REFUSED)).toHaveCount(0);
  });

  test('the counts render with their shares, and Not recorded stays away when there are none', async ({ page, backend }) => {
    backend.sourceCounts = () => counts(12, 6, 4, 2, 0);
    await openTracker(page, backend);

    await expect(total(page)).toHaveText('24 applications');
    await expect(card(page, 'Google Form')).toHaveText(/Google Form\s*12 applications\s*50% of the total/);
    await expect(card(page, 'Facebook Messenger')).toHaveText(/Facebook Messenger\s*6 applications\s*25% of the total/);
    await expect(card(page, 'Walk-in')).toHaveText(/Walk-in\s*4 applications\s*17% of the total/);
    await expect(card(page, 'Tawag o Text')).toHaveText(/Tawag o Text\s*2 applications\s*8% of the total/);
    await expect(sources(page).getByRole('heading', { level: 4 })).toHaveText(['Google Form', 'Facebook Messenger', 'Walk-in', 'Tawag o Text']);
    await expect(sources(page).getByText('No applications in this period.')).toHaveCount(0);
    await expect(sources(page).getByText('Not recorded', { exact: true })).toHaveCount(0);
  });

  test('zeros show, and a source that is everything is 100%', async ({ page, backend }) => {
    backend.sourceCounts = () => counts(0, 0, 7, 0);
    await openTracker(page, backend);

    await expect(total(page)).toHaveText('7 applications');
    await expect(card(page, 'Walk-in')).toHaveText(/Walk-in\s*7 applications\s*100% of the total/);
    await expect(card(page, 'Google Form')).toHaveText(/Google Form\s*0 applications\s*0% of the total/);
    await expect(card(page, 'Facebook Messenger')).toHaveText(/Facebook Messenger\s*0 applications\s*0% of the total/);
    await expect(card(page, 'Tawag o Text')).toHaveText(/Tawag o Text\s*0 applications\s*0% of the total/);
    await expect(sources(page).getByText('No applications in this period.')).toHaveCount(0);
  });

  test('a source with some applications is never 0%, nor 100% beside another with some', async ({ page, backend }) => {
    backend.sourceCounts = () => counts(999, 1, 0, 0);
    await openTracker(page, backend);

    await expect(total(page)).toHaveText('1,000 applications');
    await expect(card(page, 'Google Form')).toHaveText(/999 applications\s*99% of the total/);
    await expect(card(page, 'Facebook Messenger')).toHaveText(/1 application\s*<1% of the total/);
  });

  test('no applications at all: the empty message, every count 0 and every share a dash', async ({ page, backend }) => {
    backend.sourceCounts = () => counts(0, 0, 0, 0);
    await openTracker(page, backend);

    await expect(sources(page).getByText('No applications in this period.')).toBeVisible();
    await expect(total(page)).toHaveText('0 applications');
    for (const label of ['Google Form', 'Facebook Messenger', 'Walk-in', 'Tawag o Text']) {
      await expect(card(page, label)).toHaveText(new RegExp(`${label}\\s*0 applications\\s*—`));
    }
  });

  test('Not recorded shows the applications with no source, and counts them in the total', async ({ page, backend }) => {
    backend.sourceCounts = () => counts(12, 6, 4, 2, 3);
    await openTracker(page, backend);

    await expect(total(page)).toHaveText('27 applications');
    // 12 of 27 is 44%: the shares are of everything, Not recorded included.
    await expect(card(page, 'Google Form')).toHaveText(/12 applications\s*44% of the total/);
    const notRecorded = sources(page).getByText('Not recorded', { exact: true });
    await expect(notRecorded).toBeVisible();
    await expect(notRecorded.locator('xpath=..')).toHaveText(/Not recorded\s*3 applications\s*11% of the total\.\s*·\s*No source was saved with these\./);
    await expect(sources(page).getByText('No applications in this period.')).toHaveCount(0);
  });

  test('Not recorded alone is still a period with applications', async ({ page, backend }) => {
    backend.sourceCounts = () => counts(0, 0, 0, 0, 5);
    await openTracker(page, backend);

    await expect(total(page)).toHaveText('5 applications');
    await expect(sources(page).getByText('No applications in this period.')).toHaveCount(0);
    await expect(sources(page).getByText('Not recorded', { exact: true })).toBeVisible();
    await expect(card(page, 'Google Form')).toHaveText(/Google Form\s*0 applications\s*0% of the total/);
  });

  for (const { code, scope } of [
    { code: 'CALLCTR', scope: 'All branches' },
    { code: 'OWN', scope: 'All branches' },
    { code: 'ADM', scope: 'All branches' },
    { code: 'PROC', scope: 'Your branches' },
    { code: 'ACCTG', scope: 'Your branches' },
  ] as { code: RoleCode; scope: string }[]) {
    test(`${code}: the scope line says "${scope}"`, async ({ page, backend }) => {
      await openTracker(page, backend, code);

      await expect(page.getByText(scope, { exact: true })).toBeVisible();
      await expect(page.getByText(scope === 'All branches' ? 'Your branches' : 'All branches', { exact: true })).toHaveCount(0);
    });
  }

  test('while the counts are on their way: a skeleton, busy, and a spoken status; then the numbers', async ({ page, backend }) => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    backend.sourceCounts = async () => {
      await gate;
      return counts(12, 6, 4, 2);
    };
    await signedInAs(page, backend, 'ADM');
    await gotoTracker(page);

    await expect(page.locator('[aria-busy="true"]')).toHaveCount(1);
    await expect(page.getByRole('status').filter({ hasText: 'Loading the counts…' })).toHaveCount(1);
    await expect(total(page)).toHaveCount(0);
    // The days and whose applications they are are already there.
    await expect(daysLabel(page, 'Oct 1 – Oct 31, 2026')).toBeVisible();
    await expect(page.getByText('All branches', { exact: true })).toBeVisible();

    release();
    await expect(total(page)).toHaveText('24 applications');
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
    await expect(page.getByRole('status').filter({ hasText: '24 applications, Oct 1 – Oct 31, 2026, All branches' })).toHaveCount(1);
  });

  test('a load that fails shows its message, and Retry loads the same days again', async ({ page, backend }) => {
    let down = true;
    backend.sourceCounts = () => (down ? refusal('E2E: the counts are not available right now.') : counts(12, 6, 4, 2));
    await signedInAs(page, backend, 'ADM');
    await gotoTracker(page);

    const alert = alertWith(page, 'E2E: the counts are not available right now.');
    await expect(alert).toBeVisible();
    await expect(total(page)).toHaveCount(0);
    // The chips are still there: another period is one tap away.
    await expect(chip(page, 'Today')).toBeVisible();

    down = false;
    await alert.getByRole('button', { name: 'Retry' }).click();
    await expect(total(page)).toHaveText('24 applications');
    await expect(alertWith(page, 'E2E: the counts')).toHaveCount(0);
    // Both asks were for this month.
    for (const call of backend.calls('getApplicationSourceCounts')) expect(call.variables).toEqual(THIS_MONTH);
  });

  test('a slow answer to an earlier period never replaces the latest', async ({ page, backend }) => {
    let releaseSlow = () => {};
    const slow = new Promise<void>((resolve) => {
      releaseSlow = resolve;
    });
    backend.sourceCounts = async (variables) => {
      if (variables.from === LAST_MONTH.from) {
        await slow;
        return counts(99, 0, 0, 0);
      }
      return variables.from === TODAY.from && variables.to === TODAY.to ? counts(1, 0, 0, 0) : counts(12, 6, 4, 2);
    };
    await openTracker(page, backend);
    await expect(total(page)).toHaveText('24 applications');

    await chip(page, 'Last month').click();
    await expect(total(page)).toHaveCount(0);
    await chip(page, 'Today').click();
    await expect(total(page)).toHaveText('1 application');

    // Last month's answer arrives late. Wait for the page to have it (the held response itself, not
    // a pause), then for two frames, which is all the page needs to act on it if it were going to.
    const lateAnswer = page.waitForResponse(
      (response) =>
        response.url().endsWith('/fuerte-api') &&
        (response.request().postData() ?? '').includes(`"from":"${LAST_MONTH.from}"`),
    );
    releaseSlow();
    await (await lateAnswer).finished();
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await expect(total(page)).toHaveText('1 application');
    await expect(daysLabel(page, 'Oct 1, 2026')).toBeVisible();
    await expect(card(page, 'Google Form')).toHaveText(/Google Form\s*1 application\s*100% of the total/);
  });

  test('360px: nothing scrolls sideways, cards stack, and every control is at least 48px tall', async ({ page, backend }) => {
    backend.sourceCounts = () => counts(12, 6, 4, 2, 3);
    await page.setViewportSize({ width: 360, height: 740 });
    await openTracker(page, backend);
    await chip(page, 'Custom').click();
    await expect(applyButton(page)).toBeVisible();

    expect(await sidewaysScroll(page), 'the page scrolls sideways').toBeLessThanOrEqual(0);

    const controls: [string, Locator][] = [
      ...['Today', 'This week', 'This month', 'Last month', 'Custom'].map((name): [string, Locator] => [`chip ${name}`, chip(page, name)]),
      ['From', fromBox(page)],
      ['To', toBox(page)],
      ['Apply', applyButton(page)],
    ];
    for (const [name, control] of controls) {
      const box = await control.boundingBox();
      expect(box, `${name} has a box`).not.toBeNull();
      expect(box!.height, `${name} is at least 48px tall`).toBeGreaterThanOrEqual(47.5);
      expect(box!.x + box!.width, `${name} fits the 360px screen`).toBeLessThanOrEqual(360);
    }

    // One column: each card sits below the one before it and as wide as the other.
    const boxes: { x: number; y: number; width: number; height: number }[] = [];
    for (const label of ['Google Form', 'Facebook Messenger', 'Walk-in', 'Tawag o Text']) {
      boxes.push((await card(page, label).boundingBox())!);
    }
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i].y, 'cards stack on a phone').toBeGreaterThan(boxes[i - 1].y + boxes[i - 1].height - 1);
      expect(Math.abs(boxes[i].x - boxes[0].x), 'cards share one column').toBeLessThanOrEqual(1);
    }

    // The error state fits too, and its Retry is a touch target. A range over a year is the one the server refuses.
    backend.sourceCounts = () => refusal(RANGE_REFUSED);
    await fromBox(page).fill('2025-01-01');
    await toBox(page).fill('2026-10-01');
    await applyButton(page).click();
    const alert = alertWith(page, RANGE_REFUSED);
    await expect(alert).toBeVisible();
    const retry = await alert.getByRole('button', { name: 'Retry' }).boundingBox();
    expect(retry!.height, 'Retry is at least 48px tall').toBeGreaterThanOrEqual(47.5);
    expect(await sidewaysScroll(page), 'the error state scrolls sideways').toBeLessThanOrEqual(0);
  });

  test('desktop: four cards in a row beside the sidebar, and nothing scrolls sideways', async ({ page, backend }) => {
    backend.sourceCounts = () => counts(12, 6, 4, 2, 3);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openTracker(page, backend);

    const boxes: { x: number; y: number; width: number; height: number }[] = [];
    for (const label of ['Google Form', 'Facebook Messenger', 'Walk-in', 'Tawag o Text']) {
      boxes.push((await card(page, label).boundingBox())!);
    }
    for (let i = 1; i < boxes.length; i++) {
      expect(Math.abs(boxes[i].y - boxes[0].y), 'one row of four').toBeLessThanOrEqual(1);
      expect(boxes[i].x, 'left to right').toBeGreaterThan(boxes[i - 1].x);
    }
    expect(await sidewaysScroll(page), 'the page scrolls sideways').toBeLessThanOrEqual(0);
  });
});
