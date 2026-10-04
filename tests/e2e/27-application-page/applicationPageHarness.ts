/**
 * Shared by application-page.spec.ts: a fake backend for /applications/[id], the fictional
 * users, branches and picklists it serves, and the helpers that read the page.
 *
 * NO CREDENTIALS AND NO BACKEND, as in tests/e2e/25-applications/applications.spec.ts: a
 * made-up token and a fictional user are seeded into the persisted zustand store
 * (localStorage 'authStore'), and every request to the backend origin is answered here, for
 * the whole browser context, so a popup (the printed PDF) is answered too. A request no
 * stub answers fails the test: a non-GraphQL one is aborted, a GraphQL field with no answer
 * is answered empty and recorded. Nothing is read from or written to the database.
 *
 * The fake plays the server for ONE application (`backend.record`): the mutations change
 * it, as the real ones do, so what the page shows after a save or a status change is what
 * the server would have sent back. A test that needs a different answer sets `overrides`.
 */
import { test as base, expect, type Locator, type Page, type Route } from '@playwright/test';
import type { LoanApplicationBorrowerMatch, LoanApplicationRecord, LoanApplicationUpdateInput } from '../../../src/utils/DataTypes';

export const APP = 'http://localhost:3000';
/** Where the dev build points: NEXT_PUBLIC_API_URL=<BACKEND>/api, NEXT_PUBLIC_API_GRAPHQL=<BACKEND>/fuerte-api, NEXT_PUBLIC_BASE_URL=<BACKEND>. */
export const BACKEND = 'http://localhost:8080';
export const FAKE_TOKEN = 'e2e-fake-token';

// ---------------------------------------------------------------------------
// Fictional branches, picklists and users
// ---------------------------------------------------------------------------

export const BRANCHES = [
  { id: '9101', name: 'E2E Sub-branch A' },
  { id: '9102', name: 'E2E Sub-branch B' },
  { id: '9103', name: 'E2E Sub-branch C' },
];

const CHIEFS = [
  { id: '9201', name: 'E2E Chief One' },
  { id: '9202', name: 'E2E Chief Two' },
];

const COMPANIES = [
  { id: '9301', name: 'E2E Company One' },
  { id: '9302', name: 'E2E Company Two' },
];

const SUB_AREAS: Record<string, { id: string; name: string }[]> = {
  '9401': [
    { id: '9501', name: 'E2E Sub-area One' },
    { id: '9502', name: 'E2E Sub-area Two' },
  ],
};

const AREAS = [{ id: '9401', name: 'E2E Area With Sub-areas', sub_area: SUB_AREAS['9401'] }];

/** Role ids and names mirror the roles table. */
const ROLES = {
  ADM: { id: 1, name: 'ADMIN' },
  PROC: { id: 3, name: 'PROCESSING' },
  OWN: { id: 5, name: 'OWNER' },
  CALLCTR: { id: 8, name: 'CALL_CENTER' },
} as const;

export type RoleCode = keyof typeof ROLES;

/**
 * The shape /api/login returns. Owner, Admin and Call Center may place an application on
 * any branch; Processing is branch staff, who may not.
 */
export const fakeUser = (code: RoleCode, assignedBranchSubIds: number[] = [], homeBranchSubId: number | null = null) => {
  const role = ROLES[code];
  const home = BRANCHES.find((branch) => Number(branch.id) === homeBranchSubId);
  return {
    id: 90000 + role.id,
    name: `E2E ${role.name.replace('_', ' ')}`,
    email: `e2e.${code.toLowerCase()}@example.test`,
    role_id: role.id,
    role: { id: role.id, name: role.name, code },
    branch_sub_id: home ? Number(home.id) : null,
    branch_sub: home ? { id: home.id, name: home.name } : null,
    assignedBranchSubIds,
  };
};

// ---------------------------------------------------------------------------
// A fictional application
// ---------------------------------------------------------------------------

const EMPTY_INFO = {
  firstname: null, middlename: null, lastname: null, amount_applied: null, purpose: null, chief_id: null,
  terms_of_payment: null, residence_address: null, is_rent: null, other_source_of_inc: null,
  est_monthly_fam_inc: null, employment_position: null, gender: null,
};

/**
 * What getLoanApplication returns, in the shape of the backend's LoanApplicationRecord:
 * a Facebook application for E2E Applicant Two, on Sub-branch A, still For Interview, with
 * the form's info and detail filled in and nothing else (the other groups are all null).
 */
export function application(overrides: Partial<LoanApplicationRecord> = {}): LoanApplicationRecord {
  return {
    id: '2',
    source: 'manual',
    channel: 'facebook',
    submitted_at: '2026-09-21 20:05:31',
    location: null,
    branch_sub_id: 9101,
    branch_sub: { id: '9101', name: 'E2E Sub-branch A' },
    status: 'for_interview',
    borrower_id: null,
    full_name: 'E2E Applicant Two',
    contact_no: '09170000002',
    amount_applied: '15000.00',
    purpose: 'Store capital',
    intake_flags: [],
    created_at: '2026-09-21 20:05:31',
    details: {
      info: {
        ...EMPTY_INFO, firstname: 'E2E', lastname: 'Applicant Two', amount_applied: '15000.00', purpose: 'Store capital',
        residence_address: '1 Sample Street, Sample Town', is_rent: 1, employment_position: 'Clerk', gender: 'Female',
      },
      detail: {
        contact_no: '09170000002', email: 'e2e.two@example.test', dob: '1990-05-17',
        place_of_birth: 'Sample Town', age: 36, civil_status: 'Single',
      },
      spouse: null, work: null, company: null, references: null,
    },
    form_answers: [],
    // A typed-in application has no key from Google's download.
    exact_time: false,
    ...overrides,
  };
}

/**
 * An application with EVERY group of the form filled in, Interviewed on Sub-branch A: Married
 * with a spouse, a Chief, an Office, an Area and Sub-area, work, company, four references, and
 * money written with commas as the form shows it. Freshly loaded, the form must hold nothing
 * unsaved.
 */
export const fullApplication = (overrides: Partial<LoanApplicationRecord> = {}): LoanApplicationRecord =>
  application({
    status: 'interviewed',
    details: {
      info: {
        firstname: 'E2E', middlename: 'Q', lastname: 'Applicant Two', amount_applied: '15000.00', purpose: 'Store capital',
        chief_id: 9201, terms_of_payment: '12 months', residence_address: '1 Sample Street, Sample Town', is_rent: 1,
        other_source_of_inc: 'Sari-sari store', est_monthly_fam_inc: '12,500.00', employment_position: 'Clerk', gender: 'Female',
      },
      detail: {
        contact_no: '09170000002', email: 'e2e.two@example.test', dob: '1990-05-17', place_of_birth: 'Sample Town',
        age: 36, civil_status: 'Married',
      },
      spouse: {
        work_address: '2 Sample Street', occupation: 'Teacher', fullname: 'E2E Spouse', company: 'E2E School', dept_branch: 'Main Campus',
        length_of_service: '5 years', salary: '25,000.00', company_contact_person: 'E2E Principal', contact_no: '09170000009',
      },
      work: {
        company_borrower_id: 9301, employment_number: 'E2E-1', area_id: 9401, sub_area_id: 9501, station: 'E2E Station',
        term_in_service: '3 years', employment_status: 'Permanent', division: 'E2E Division', monthly_gross: '30,000.00',
        monthly_net: '24,500.00', office_address: '3 Sample Street',
      },
      company: { employer: 'E2E Employer', salary: '12,000.00', contract_duration: '1 year' },
      references: [
        { occupation: 'Supervisor/Princpal', name: 'E2E Reference One', contact_no: '09170000011' },
        { occupation: 'Co-worker', name: 'E2E Reference Two', contact_no: '09170000012' },
        { occupation: 'Neighbour', name: 'E2E Reference Three', contact_no: '09170000013' },
        { occupation: 'Relative', name: 'E2E Reference Four', contact_no: '09170000014' },
      ],
    },
    ...overrides,
  });

/** What getLoanApplicationBorrowerMatch answers when the applicant is nobody's repeat: nothing matched anywhere. */
export const noBorrowerMatch = (): LoanApplicationBorrowerMatch => ({
  existsInMyBranches: false, myBranches: [], myBranchMatchCount: 0, myBranchIsProblem: false, myBranchWorstCutoffs: 0,
  existsElsewhere: false, branches: [], isProblem: false, worstCutoffsMissed: 0,
});

/** A match: `noBorrowerMatch` with what the test says matched. */
export const borrowerMatch = (overrides: Partial<LoanApplicationBorrowerMatch> = {}): LoanApplicationBorrowerMatch => ({
  ...noBorrowerMatch(),
  ...overrides,
});

/** An application as the Google Form delivers it: a source of its own, answers, and flags. */
export const googleFormApplication = (overrides: Partial<LoanApplicationRecord> = {}): LoanApplicationRecord =>
  application({
    source: 'google_form',
    channel: 'google_form',
    location: 'Sample Town, Rizal',
    form_answers: [
      { question: 'Buong pangalan', answer: 'E2E Applicant Two' },
      { question: 'Mobile number', answer: '09170000002' },
      { question: 'Magkano ang nais ninyong utangin?', answer: '15000' },
      { question: 'Para saan ang gagamitin ng pera? Ilarawan po nang buo ang inyong pangangailangan.', answer: 'Pambili ng paninda sa tindahan ko sa palengke, at pambayad sa upa ng puwesto para sa susunod na tatlong buwan.' },
      { question: 'Karagdagang sagot', answer: '' },
    ],
    intake_flags: ['Amount is above the usual limit', 'Mobile number looks short'],
    ...overrides,
  });

// ---------------------------------------------------------------------------
// The fake backend
// ---------------------------------------------------------------------------

export interface GraphqlCall {
  field: string;
  variables: Record<string, any>;
}

/** A whole GraphQL response body, so a stub can answer with `errors` as the server does. */
export interface GraphqlBody {
  data?: unknown;
  errors?: { message: string; extensions?: Record<string, unknown> }[];
}

type FakeUser = ReturnType<typeof fakeUser>;

/** A cross-origin response (3000 -> 8080) must allow the page's origin. */
const CORS = { 'Access-Control-Allow-Origin': APP, 'Access-Control-Allow-Credentials': 'true' };

/** The first field of the operation's selection set: "getLoanApplication", "setLoanApplicationStatus", ... */
const rootField = (query: string): string =>
  query.slice(query.indexOf('{') + 1).match(/^\s*([A-Za-z_]\w*)/)?.[1] ?? '(unparsed)';

const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });

const refusal = (message: string): GraphqlBody => ({ errors: [{ message }] });

export const NOT_FOUND = 'Application not found.';

/** The record as the server would hold it after an update: the form's groups and the facts the list shows. */
function updated(record: LoanApplicationRecord, input: LoanApplicationUpdateInput): LoanApplicationRecord {
  const info = input.info as Record<string, unknown>;
  const branch = BRANCHES.find((candidate) => Number(candidate.id) === input.branch_sub_id);
  return {
    ...record,
    full_name: [info.firstname, info.middlename, info.lastname].filter(Boolean).join(' '),
    contact_no: String(input.detail.contact_no),
    amount_applied: info.amount_applied === undefined ? null : String(info.amount_applied),
    purpose: info.purpose === undefined ? null : String(info.purpose),
    ...(branch ? { branch_sub_id: Number(branch.id), branch_sub: { id: branch.id, name: branch.name } } : {}),
    // A corrected day is stored at 00:00 (the server's rule), so the header shows the date alone.
    ...(input.submitted_on ? { submitted_at: `${input.submitted_on} 00:00:00` } : {}),
  };
}

export class FakeBackend {
  /** Who GET /api/user says is signed in. */
  user: FakeUser | null = null;
  /** The one application this server holds; getLoanApplication, updateLoanApplication and setLoanApplicationStatus work on it. */
  record: LoanApplicationRecord | null = null;
  /** Replaces the default answer to a GraphQL root field. */
  readonly overrides = new Map<string, (variables: Record<string, any>) => GraphqlBody | Promise<GraphqlBody>>();
  /** When set, printLoanApplication waits for it, so a test can look at the page while the PDF is made. */
  printHold: Promise<void> | null = null;
  /** When set, updateLoanApplication waits for it, so a test can look at the page while a save is out. */
  saveHold: Promise<void> | null = null;
  /** What getLoanApplicationBorrowerMatch answers: nothing matched, until a test says what did (null is Call Center's answer). */
  match: LoanApplicationBorrowerMatch | null = noBorrowerMatch();
  /** When set, getLoanApplicationBorrowerMatch waits for it, so a test can look at the page while the check is out. */
  matchHold: Promise<void> | null = null;
  /**
   * The branch_sub ids getMyAccessibleBranchSubs answers: the user's own branches, the very list the
   * server checks a new borrower's branch against. The Owner is never asked. All three by default.
   */
  myBranches: number[] = BRANCHES.map((branch) => Number(branch.id));

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
    // The printed PDF, which useDownloadPdf sends the popup to. A page stands in for it: a headless browser would download a real PDF instead of showing it.
    if (method === 'GET' && path.startsWith('/storage/pdf/')) {
      return route.fulfill({ status: 200, contentType: 'text/html', headers: CORS, body: '<!doctype html><title>E2E printed application</title><p>E2E printed application</p>' });
    }
    if (method === 'POST' && path === '/fuerte-api') {
      const { query = '', variables = {} } = request.postDataJSON() ?? {};
      const field = rootField(query);
      this.graphql.push({ field, variables: variables ?? {} });
      const override = this.overrides.get(field);
      return json(route, 200, override ? await override(variables ?? {}) : await this.answer(field, variables ?? {}));
    }

    this.unstubbed.push(`${method} ${request.url()}`);
    return route.abort('blockedbyclient');
  }

  private async answer(field: string, variables: Record<string, any>): Promise<GraphqlBody> {
    switch (field) {
      // The root layout's probe on every page: never in maintenance.
      case 'maintenance':
        return { data: { maintenance: { data: { isMaintenanceModeOn: 0 } } } };
      // The approval bell, for approver roles.
      case 'pendingDeletionRequestsForMe':
        return { data: { pendingDeletionRequestsForMe: [] } };
      // BorrowerDetails' picklists.
      case 'getChief':
        return { data: { getChief: { data: CHIEFS } } };
      case 'getAreas':
        return { data: { getAreas: { data: AREAS } } };
      case 'getOneSubArea':
        return { data: { getOneSubArea: SUB_AREAS[String(variables.area_id)] ?? [] } };
      case 'getBorrCompanies':
        return { data: { getBorrCompanies: { data: COMPANIES } } };
      case 'getApplicationBranches':
        return { data: { getApplicationBranches: BRANCHES } };
      // Where Back leads: an empty list.
      case 'getLoanApplications':
        return { data: { getLoanApplications: { data: [], paginatorInfo: { total: 0, currentPage: 1, lastPage: 1, hasMorePages: false } } } };
      case 'getLoanApplication':
        return this.record && String(this.record.id) === String(variables.id)
          ? { data: { getLoanApplication: this.record } }
          : refusal(NOT_FOUND);
      case 'updateLoanApplication':
        if (this.saveHold) await this.saveHold;
        return this.update(variables);
      case 'setLoanApplicationStatus':
        return this.setStatus(variables);
      case 'printLoanApplication':
        if (this.printHold) await this.printHold;
        return { data: { printLoanApplication: `/storage/pdf/application-${variables.application_id}.pdf` } };
      // The user's own branches: what New Borrower's picker lists, and what the page judges an application's branch by.
      case 'getMyAccessibleBranchSubs':
        return {
          data: {
            getMyAccessibleBranchSubs: this.myBranches.map((id) => ({
              id: String(id),
              branch_id: 91,
              code: `E2E-${id}`,
              name: BRANCHES.find((branch) => Number(branch.id) === id)?.name ?? `E2E Sub-branch ${id}`,
              address: '1 Sample Street',
            })),
          },
        };
      // The branch list New Borrower loads on mount; its form does not use it.
      case 'getBranch':
        return { data: { getBranch: [] } };
      // Whether the applicant is a borrower already. The page never asks Call Center, nor for a converted application.
      case 'getLoanApplicationBorrowerMatch':
        if (this.matchHold) await this.matchHold;
        return { data: { getLoanApplicationBorrowerMatch: this.match } };
      // No stub: answered empty so the page carries on, and recorded so the test fails.
      default:
        this.unstubbed.push(`POST ${BACKEND}/fuerte-api, GraphQL field ${field}`);
        return { data: {} };
    }
  }

  private update(variables: Record<string, any>): GraphqlBody {
    if (!this.record || String(this.record.id) !== String(variables.id)) return refusal(NOT_FOUND);
    this.record = updated(this.record, variables.input);
    return { data: { updateLoanApplication: this.record } };
  }

  private setStatus(variables: Record<string, any>): GraphqlBody {
    if (!this.record || String(this.record.id) !== String(variables.id)) return refusal(NOT_FOUND);
    this.record = { ...this.record, status: variables.status };
    return { data: { setLoanApplicationStatus: { id: this.record.id, status: this.record.status, borrower_id: this.record.borrower_id } } };
  }
}

export const test = base.extend<{ backend: FakeBackend }>({
  backend: async ({ page, context }, use) => {
    const backend = new FakeBackend();
    page.on('pageerror', (error) => backend.pageErrors.push(error.message));
    // The whole context, not the page: the printed PDF opens in a window of its own.
    await context.route(`${BACKEND}/**`, (route) => backend.handle(route));
    // Next rewrites these two paths on :3000 to the backend, server side.
    for (const proxied of ['/storage/**', '/api/pdf/**']) {
      await context.route(`${APP}${proxied}`, (route) => {
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
// Helpers
// ---------------------------------------------------------------------------

/** Seed the persisted auth store before any app code runs. The token is made up. */
export async function signedInAs(
  page: Page,
  backend: FakeBackend,
  code: RoleCode,
  assignedBranchSubIds: number[] = [],
  homeBranchSubId: number | null = null,
): Promise<void> {
  backend.user = fakeUser(code, assignedBranchSubIds, homeBranchSubId);
  await page.addInitScript(
    ([user, token]) => {
      localStorage.setItem('authStore', JSON.stringify({ state: { user, authToken: token }, version: 0 }));
    },
    [backend.user, FAKE_TOKEN] as const,
  );
}

/** The page's own actions, found by their group's name. */
export const toolbar = (page: Page): Locator => page.getByRole('group', { name: 'Application actions' });

/** Open /applications/<id> and wait until the actions are on screen (the record has loaded). */
export async function openApplication(page: Page, id = '2'): Promise<void> {
  // The dev server compiles a route on its first visit.
  await page.goto(`/applications/${id}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await expect(toolbar(page)).toBeVisible({ timeout: 90_000 });
}

/** A Details form field, by its name. */
export const field = (page: Page, name: string): Locator => page.locator(`input[name="${name}"], select[name="${name}"]`);

export const saveButton = (page: Page): Locator => page.getByRole('button', { name: 'Save', exact: true });

/** The application's status select, by its label. */
export const statusSelect = (page: Page): Locator => toolbar(page).getByLabel('Status', { exact: true });

/** The branch picker BorrowerDetails draws for a user who may place an application. */
export const branchPicker = (page: Page): Locator => page.getByTestId('borrower-branch-picker');

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

/** Every field whose label carries the red asterisk, by the field's name, sorted. */
export const requiredMarks = (page: Page): Promise<string[]> =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll('form label'))
      .filter((label) => Array.from(label.querySelectorAll('span')).some((span) => span.textContent === '*'))
      .map((label) => {
        const control = label.parentElement?.querySelector<HTMLInputElement>('input[name], select[name]');
        return control?.name || (label as HTMLLabelElement).htmlFor || `(unplaced) ${label.textContent}`;
      })
      .sort(),
  );

/** The text a react-select shows as its value, or '' when it shows its placeholder. */
export async function pickerValue(page: Page): Promise<string> {
  const value = branchPicker(page).locator('.react-select__single-value');
  return (await value.count()) ? ((await value.textContent()) ?? '') : '';
}

/** The option texts the branch picker offers, read by opening it and closing it again. */
export async function pickerOptions(page: Page): Promise<string[]> {
  await branchPicker(page).locator('.react-select__control').click();
  const options = page.locator('.react-select__option');
  await expect(options.first()).toBeVisible();
  const texts = await options.allTextContents();
  await page.keyboard.press('Escape');
  await expect(options).toHaveCount(0);
  return texts;
}

/** Pick a branch in the picker by its name. */
export async function pickBranch(page: Page, name: string): Promise<void> {
  await branchPicker(page).locator('.react-select__control').click();
  await page.locator('.react-select__option').filter({ hasText: new RegExp(`^${name}$`) }).click();
}

/** The react-select the form names `name` (Branch, Chief, Office Where Currently Employed, Area, Sub Area): its search box, which carries the name. */
export const selectNamed = (page: Page, name: string): Locator => page.getByRole('combobox', { name, exact: true });

/** The box a react-select draws around its value, which is the thing a finger presses. */
export const selectControl = (page: Page, name: string): Locator =>
  selectNamed(page, name).locator('xpath=ancestor::div[contains(@class, "react-select__control")][1]');

/** Open the react-select named `name` and pick an option by its text. */
export async function pickFromSelect(page: Page, name: string, option: string): Promise<void> {
  await selectControl(page, name).click();
  await page.locator('.react-select__option').filter({ hasText: new RegExp(`^${option}$`) }).click();
}
