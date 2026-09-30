/**
 * Shared by the specs in this folder: a fake backend for /borrowers/new, the
 * fictional picklists it serves, and helpers that read the borrower Details form.
 * New application's own fields (the list, its branches, the save) are answered
 * through FakeBackend.extraGraphql by new-application.spec.ts.
 *
 * NO CREDENTIALS AND NO BACKEND, as in tests/e2e/25-applications/applications.spec.ts:
 * a made-up token and a fictional user are seeded into the persisted zustand store
 * (localStorage 'authStore'), and every request to the backend origin is answered
 * here. A request no stub answers fails the test: it is aborted, so it never reaches
 * the API, or, for a GraphQL field with no stub, answered empty. Nothing is read from
 * or written to the database.
 */
import { test as base, expect, Locator, Page, Route } from '@playwright/test';

const APP = 'http://localhost:3000';
/** Where the dev build points: NEXT_PUBLIC_API_URL=<BACKEND>/api, NEXT_PUBLIC_API_GRAPHQL=<BACKEND>/fuerte-api. */
const BACKEND = 'http://localhost:8080';
export const FAKE_TOKEN = 'e2e-fake-token';

// ---------------------------------------------------------------------------
// Fictional picklists
// ---------------------------------------------------------------------------

/** getMyAccessibleBranchSubs answers all three; a user is assigned some of them. */
export const BRANCH_SUBS = [
  { id: '9101', branch_id: 91, code: 'E2E-A', name: 'E2E Sub-branch A', address: '1 Sample Street' },
  { id: '9102', branch_id: 91, code: 'E2E-B', name: 'E2E Sub-branch B', address: '2 Sample Street' },
  { id: '9103', branch_id: 92, code: 'E2E-C', name: 'E2E Sub-branch C', address: '3 Sample Street' },
];

const CHIEFS = [
  { id: '9201', name: 'E2E Chief One' },
  { id: '9202', name: 'E2E Chief Two' },
];

const COMPANIES = [
  { id: '9301', name: 'E2E Company One' },
  { id: '9302', name: 'E2E Company Two' },
];

export const AREA_WITH_SUB_AREAS = 'E2E Area With Sub-areas';
export const AREA_WITHOUT_SUB_AREAS = 'E2E Area Without Sub-areas';

const SUB_AREAS: Record<string, { id: string; name: string }[]> = {
  '9401': [
    { id: '9501', name: 'E2E Sub-area One' },
    { id: '9502', name: 'E2E Sub-area Two' },
  ],
  '9402': [],
};

const AREAS = [
  { id: '9401', name: AREA_WITH_SUB_AREAS, sub_area: SUB_AREAS['9401'] },
  { id: '9402', name: AREA_WITHOUT_SUB_AREAS, sub_area: SUB_AREAS['9402'] },
];

// ---------------------------------------------------------------------------
// Fictional user
// ---------------------------------------------------------------------------

/** An Admin assigned these sub-branches; the home branch is the first of them unless given. */
export const fakeUser = (assignedBranchSubIds: number[], homeBranchSubId = assignedBranchSubIds[0]) => {
  const home = BRANCH_SUBS.find((b) => Number(b.id) === homeBranchSubId);
  return {
    id: 90001,
    name: 'E2E Admin',
    email: 'e2e.admin@example.test',
    role_id: 1,
    role: { id: 1, name: 'ADMIN', code: 'ADM' },
    branch_sub_id: home ? Number(home.id) : null,
    branch_sub: home ? { id: home.id, name: home.name } : null,
    assignedBranchSubIds,
  };
};

// ---------------------------------------------------------------------------
// The fake backend
// ---------------------------------------------------------------------------

export interface GraphqlCall {
  field: string;
  variables: Record<string, unknown>;
}

/** A whole GraphQL response body, so a stub can answer with `errors` as the server does. */
export interface GraphqlBody {
  data?: unknown;
  errors?: { message: string; extensions?: Record<string, unknown> }[];
}

/** A cross-origin response (3000 -> 8080) must allow the page's origin. */
const CORS = { 'Access-Control-Allow-Origin': APP, 'Access-Control-Allow-Credentials': 'true' };

/** The first field of the operation's selection set: "saveBorrower", "getChief", ... */
const rootField = (query: string): string =>
  query.slice(query.indexOf('{') + 1).match(/^\s*([A-Za-z_]\w*)/)?.[1] ?? '(unparsed)';

const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });

export class FakeBackend {
  /** Who GET /api/user says is signed in. */
  user: ReturnType<typeof fakeUser> | null = null;

  /** Answers for GraphQL fields beyond /borrowers/new (the New application pages), by root field. */
  readonly extraGraphql = new Map<string, (variables: Record<string, unknown>) => GraphqlBody | Promise<GraphqlBody>>();

  readonly graphql: GraphqlCall[] = [];
  readonly unstubbed: string[] = [];
  readonly pageErrors: string[] = [];

  calls(field: string): GraphqlCall[] {
    return this.graphql.filter((call) => call.field === field);
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
      const extra = this.extraGraphql.get(field);
      return json(route, 200, extra ? await extra(variables ?? {}) : { data: this.graphqlData(field, variables ?? {}) });
    }

    this.unstubbed.push(`${method} ${request.url()}`);
    return route.abort('blockedbyclient');
  }

  private graphqlData(field: string, variables: Record<string, unknown>): unknown {
    switch (field) {
      // The root layout's probe on every page: never in maintenance.
      case 'maintenance':
        return { maintenance: { data: { isMaintenanceModeOn: 0 } } };
      // The approval bell, for approver roles.
      case 'pendingDeletionRequestsForMe':
        return { pendingDeletionRequestsForMe: [] };
      // useBranches() loads the branch list on mount; the Details form does not use it.
      case 'getBranch':
        return { getBranch: [] };
      case 'getChief':
        return { getChief: { data: CHIEFS } };
      case 'getAreas':
        return { getAreas: { data: AREAS } };
      case 'getOneSubArea':
        return { getOneSubArea: SUB_AREAS[String(variables.area_id)] ?? [] };
      case 'getBorrCompanies':
        return { getBorrCompanies: { data: COMPANIES } };
      case 'getMyAccessibleBranchSubs':
        return { getMyAccessibleBranchSubs: BRANCH_SUBS };
      case 'checkBorrowerDuplicate':
        return { checkBorrowerDuplicate: { isDuplicate: false, duplicateType: null, duplicateBorrower: null, duplicateProblem: null } };
      // Not saved: the form stays open, so the test reads what was posted without leaving the page.
      case 'saveBorrower':
        return { saveBorrower: { success: false, message: 'E2E stub: nothing is saved.' } };
      // No stub: answered empty so the page carries on, and recorded so the test fails.
      default:
        this.unstubbed.push(`POST ${BACKEND}/fuerte-api, GraphQL field ${field}`);
        return {};
    }
  }
}

export const test = base.extend<{ backend: FakeBackend }>({
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

export { expect };

// ---------------------------------------------------------------------------
// Helpers. Each takes the <form> it reads, so a page holding two forms can say which.
// ---------------------------------------------------------------------------

/** Seed the persisted auth store before any app code runs. The token is made up. */
export async function signedInAs(
  page: Page,
  backend: FakeBackend,
  assignedBranchSubIds: number[],
  homeBranchSubId?: number,
): Promise<void> {
  backend.user = fakeUser(assignedBranchSubIds, homeBranchSubId);
  await page.addInitScript(
    ([user, token]) => {
      localStorage.setItem('authStore', JSON.stringify({ state: { user, authToken: token }, version: 0 }));
    },
    [backend.user, FAKE_TOKEN] as const,
  );
}

/** Open /borrowers/new and wait until the Details form is on screen with its picklists loaded. */
export async function openNewBorrower(page: Page): Promise<Locator> {
  // The dev server compiles a route on its first visit.
  await page.goto('/borrowers/new', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  const form = page.locator('form:has(input[name="firstname"])');
  await expect(form.locator('input[name="firstname"]')).toBeVisible({ timeout: 90_000 });
  await expect(selectControl(form, 'chief_id')).toBeVisible();
  return form;
}

export const saveButton = (form: Locator): Locator => form.getByRole('button', { name: 'Save', exact: true });

/**
 * The react-select for a Controller field, found through its label's `for`
 * (chief_id, company_borrower_id, area_id, sub_area_id) or, for the branch
 * picker, its test id.
 */
export function selectControl(form: Locator, field: string): Locator {
  const box = field === 'branch_sub_id'
    ? form.getByTestId('borrower-branch-picker')
    : form.locator(`div:has(> label[for="${field}"])`);
  return box.locator('.react-select__control');
}

/** Open a react-select and pick the option with exactly this text. */
export async function pick(form: Locator, field: string, option: string): Promise<void> {
  await selectControl(form, field).click();
  await form.locator('.react-select__option').filter({ hasText: new RegExp(`^${escapeRegExp(option)}$`) }).click();
}

/** The option texts a react-select offers, read by opening it and closing it again. */
export async function optionsOf(form: Locator, field: string): Promise<string[]> {
  await selectControl(form, field).click();
  const options = form.locator('.react-select__option');
  await expect(options.first()).toBeVisible();
  const texts = await options.allTextContents();
  await form.page().keyboard.press('Escape');
  await expect(options).toHaveCount(0);
  return texts;
}

/** The text a react-select shows as its value, or '' when it shows its placeholder. */
export async function selectedText(form: Locator, field: string): Promise<string> {
  const value = selectControl(form, field).locator('.react-select__single-value');
  return (await value.count()) ? (await value.textContent()) ?? '' : '';
}

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Every field the form shows an error under, as field -> message. A FormInput's
 * error sits next to its input or select, which carries the field `name`; a
 * Controller's sits next to its label, whose `for` is the field name; the branch
 * picker's sits in its test-id box.
 */
export async function fieldErrors(form: Locator): Promise<Record<string, string>> {
  return form.evaluate((el) => {
    const found: Record<string, string> = {};
    for (const p of Array.from(el.querySelectorAll('p'))) {
      const message = (p.textContent ?? '').trim();
      const box = p.parentElement;
      if (!message || !box) continue;
      const control = box.querySelector<HTMLInputElement>('input[name], select[name]');
      const label = box.querySelector<HTMLLabelElement>('label[for]');
      const key = control?.name
        ?? label?.htmlFor
        ?? (box.dataset.testid === 'borrower-branch-picker' ? 'branch_sub_id' : `(unplaced) ${message}`);
      found[key] = message;
    }
    return found;
  });
}

/**
 * Every field whose label carries the red asterisk, sorted. Keyed the same way
 * as fieldErrors: the name of the input or select beside the label, else the
 * label's `for`.
 */
export async function requiredMarks(form: Locator): Promise<string[]> {
  const marks = await form.evaluate((el) =>
    Array.from(el.querySelectorAll('label'))
      .filter((label) => Array.from(label.querySelectorAll('span')).some((span) => span.textContent === '*'))
      .map((label) => {
        const control = label.parentElement?.querySelector<HTMLInputElement>('input[name], select[name]');
        return control?.name || label.htmlFor || `(unplaced) ${label.textContent}`;
      }),
  );
  return marks.sort();
}

/** How far the page's scroll container (and the document) scroll sideways, in px. */
export const sidewaysScroll = (page: Page): Promise<number> =>
  page.evaluate(() => {
    let shell = document.querySelector('main')?.parentElement ?? null;
    while (shell && shell !== document.body && !['auto', 'scroll'].includes(getComputedStyle(shell).overflowX)) {
      shell = shell.parentElement;
    }
    const shellOver = shell && shell !== document.body ? shell.scrollWidth - shell.clientWidth : 0;
    return Math.max(shellOver, document.documentElement.scrollWidth - document.documentElement.clientWidth);
  });

/** Every text box and select FormInput draws in the form, with its height in px. */
export const fieldHeights = (form: Locator): Promise<{ name: string; height: number }[]> =>
  form
    .locator('input[name]:not([type="checkbox"]):not([type="radio"]):not([type="file"]), select[name]')
    .evaluateAll((fields) => fields.map((field) => ({
      name: field.getAttribute('name') ?? '',
      height: field.getBoundingClientRect().height,
    })));

/** Press Save, then wait until the form has drawn its errors (`expected` shows one). */
export async function submitAndReadErrors(form: Locator, expected = 'firstname'): Promise<Record<string, string>> {
  await saveButton(form).click();
  await expect.poll(async () => Object.keys(await fieldErrors(form))).toContain(expected);
  return fieldErrors(form);
}
