/**
 * Shared by the specs in this folder: Edit must show a record's saved dropdown value.
 *
 * The bug class (Rafael, 2026-10-13, first seen on Users Setup): a form copies the saved
 * value into a native <select> while that select does not yet hold the option for it (only
 * FormInput's "Loading..." option, or no options at all). A select cannot take a value it
 * has no option for, nothing puts it back once the options render, and Edit opens blank.
 *
 * NO CREDENTIALS AND NO BACKEND, as in tests/e2e/38-users-setup/edit-user-prefill.spec.ts:
 * a made-up Owner token in the persisted auth store, and every request to the backend
 * origin answered here, GraphQL by its root field. Nothing reaches the API.
 */
import { test as base, expect, Route } from '@playwright/test';

export const APP = 'http://localhost:3000';
const BACKEND = 'http://localhost:8080';
const CORS = { 'Access-Control-Allow-Origin': APP, 'Access-Control-Allow-Credentials': 'true' };

const OWNER = {
  id: 90005, name: 'E2E OWNER', email: 'e2e.own@example.test', role_id: 5,
  role: { id: 5, name: 'OWNER', code: 'OWN' }, branch_sub_id: null, branch_sub: null, assignedBranchSubIds: [],
};

const rootField = (query: string): string =>
  query.slice(query.indexOf('{') + 1).match(/^\s*([A-Za-z_]\w*)/)?.[1] ?? '(unparsed)';

const json = (route: Route, body: unknown) =>
  route.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A GraphQL root field's `data` value, given the request's variables. */
type Answer = (variables: Record<string, unknown>) => unknown | Promise<unknown>;

/** The layout's own probes, answered for every page. */
const LAYOUT: Record<string, unknown> = {
  maintenance: { data: { isMaintenanceModeOn: 0 } },
  pendingDeletionRequestsForMe: [],
  getApplicationNotifications: [],
  pendingDeletionsForEntities: [],
};

export class FakeBackend {
  /** The page's own fields, by root field: the value goes under `data.<field>`. */
  readonly answers = new Map<string, Answer>();
  readonly pageErrors: string[] = [];

  async handle(route: Route): Promise<void> {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': '*' },
      });
    }
    if (path === '/api/user') return json(route, OWNER);
    if (path !== '/fuerte-api') return route.abort('blockedbyclient');

    const { query = '', variables = {} } = request.postDataJSON() ?? {};
    const field = rootField(query);
    const answer = this.answers.get(field);
    if (answer) return json(route, { data: { [field]: await answer(variables ?? {}) } });
    return json(route, { data: field in LAYOUT ? { [field]: LAYOUT[field] } : {} });
  }
}

export const test = base.extend<{ backend: FakeBackend }>({
  backend: async ({ page }, use) => {
    const backend = new FakeBackend();
    page.on('pageerror', (error) => backend.pageErrors.push(error.message));
    await page.route(`${BACKEND}/**`, (route) => backend.handle(route));
    await page.route(`${APP}/storage/**`, (route) => route.abort('blockedbyclient'));
    await page.addInitScript(([user, token]) => {
      try {
        localStorage.setItem('authStore', JSON.stringify({ state: { user, authToken: token }, version: 0 }));
      } catch {
        // about:blank and other opaque frames have no storage; the app's own origin does.
      }
    }, [OWNER, 'e2e-fake-token'] as const);
    await use(backend);
    expect(backend.pageErrors, 'uncaught errors in the page').toEqual([]);
  },
});

export { expect };

/** A one-page paginator answer, as the list queries return it. */
export const paginated = (data: unknown[]) => ({
  data,
  paginatorInfo: { total: data.length, currentPage: 1, lastPage: 1, perPage: 20, hasMorePages: false, count: data.length },
});

/**
 * Holds an answer back until the test opens it, so "the options arrive after the form is
 * open" is an order the test sets, not a timing it hopes for. Opened at once, it holds nothing.
 */
export class Gate {
  private release: () => void = () => undefined;
  readonly opened = new Promise<void>((resolve) => { this.release = resolve; });
  constructor(openAtOnce: boolean) { if (openAtOnce) this.open(); }
  open(): void { this.release(); }
}

/** The two orders worth testing: the dropdown's options already there, and arriving after the form opened. */
export const ORDERS = [
  { name: 'options already loaded', late: false },
  { name: 'options arrive after the form opened', late: true },
] as const;
