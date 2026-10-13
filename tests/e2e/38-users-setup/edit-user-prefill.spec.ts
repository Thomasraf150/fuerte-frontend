/**
 * Users Setup: Edit shows the user's saved Branch and Role.
 *
 * The bug (Rafael, 2026-10-13, on prod): Edit opened with Branch and Role blank, so the
 * Owner had to pick both again. The form copied the saved values into the two dropdowns
 * while each still held only its "Loading..." option; a select cannot take a value it has
 * no option for, so both fell back to blank once the real options arrived. It turns on
 * which answer comes first, so both orders are tested.
 *
 * NO CREDENTIALS AND NO BACKEND, as in tests/e2e/27-application-page/source-tracker.spec.ts:
 * a made-up Owner token in the persisted auth store, and every backend request answered here.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/38-users-setup --reporter=list
 */
import { test as base, expect, Page, Route } from '@playwright/test';

const APP = 'http://localhost:3000';
const BACKEND = 'http://localhost:8080';
const CORS = { 'Access-Control-Allow-Origin': APP, 'Access-Control-Allow-Credentials': 'true' };

const OWNER = {
  id: 90005, name: 'E2E OWNER', email: 'e2e.own@example.test', role_id: 5,
  role: { id: 5, name: 'OWNER', code: 'OWN' }, branch_sub_id: null, branch_sub: null, assignedBranchSubIds: [],
};

const SUB_BRANCHES = [
  { id: '5', name: 'Telebastagan Main' },
  { id: '16', name: 'MB 1' },
  { id: '50', name: 'FB Telabastagan' },
];
const ROLES = [
  { id: '3', name: 'PROCESSING' },
  { id: '5', name: 'OWNER' },
  { id: '8', name: 'CALL_CENTER' },
];
/** The account being edited: Call Center on MB 1. Neither value is a dropdown's first option. */
const JINKY = { id: '501', name: 'Jinky - EDC MB1', email: 'jinky.edc@example.test', branch_sub_id: 16, role_id: 8 };
/** A second account, for the fast-clicks case. */
const ROSE = { id: '502', name: 'Rose - EDC MB2', email: 'rose.edc@example.test', branch_sub_id: 50, role_id: 3 };
const USERS = [JINKY, ROSE];

const rootField = (query: string): string =>
  query.slice(query.indexOf('{') + 1).match(/^\s*([A-Za-z_]\w*)/)?.[1] ?? '(unparsed)';

const json = (route: Route, body: unknown) =>
  route.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** How long the form's two dropdown sources take to answer, to put them in either order. */
type Delays = { branches: number; roles: number; user?: Record<string, number> };

class FakeBackend {
  delays: Delays = { branches: 0, roles: 0 };
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
    return json(route, await this.answer(rootField(query), variables ?? {}));
  }

  private async answer(field: string, variables: Record<string, unknown>): Promise<unknown> {
    switch (field) {
      case 'users':
        return { data: { users: { data: USERS.map((u) => ({ ...u, role: { id: String(u.role_id), name: 'ROLE', code: 'X' } })),
          paginatorInfo: { total: 2, currentPage: 1, lastPage: 1, perPage: 20, hasMorePages: false } } } };
      case 'user': {
        const user = USERS.find((u) => u.id === String(variables.id)) ?? JINKY;
        await sleep(this.delays.user?.[user.id] ?? 0);
        return { data: { user: { ...user, branchSub: null, additionalBranchSubs: [] } } };
      }
      case 'getAllBranch':
        await sleep(this.delays.branches);
        return { data: { getAllBranch: SUB_BRANCHES } };
      case 'role':
        await sleep(this.delays.roles);
        return { data: { role: ROLES } };
      case 'maintenance':
        return { data: { maintenance: { data: { isMaintenanceModeOn: 0 } } } };
      case 'pendingDeletionRequestsForMe':
        return { data: { pendingDeletionRequestsForMe: [] } };
      default:
        return { data: {} };
    }
  }
}

const test = base.extend<{ backend: FakeBackend }>({
  backend: async ({ page }, use) => {
    const backend = new FakeBackend();
    page.on('pageerror', (error) => backend.pageErrors.push(error.message));
    await page.route(`${BACKEND}/**`, (route) => backend.handle(route));
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

test.setTimeout(120_000);

const editButton = (page: Page, name: string) =>
  page.getByRole('row').filter({ hasText: name }).getByRole('button', { name: 'Edit' });

async function openEdit(page: Page): Promise<void> {
  await page.goto(`${APP}/users-setup`);
  await editButton(page, JINKY.name).click();
}

for (const [order, delays] of [
  ['branches answer first', { branches: 0, roles: 600 }],
  ['roles answer first', { branches: 600, roles: 0 }],
] as const) {
  test(`Edit shows the saved Branch and Role (${order})`, async ({ page, backend }) => {
    backend.delays = delays;
    await openEdit(page);

    const branch = page.locator('#branch_id');
    const role = page.locator('#role_id');
    await expect(branch.locator('option', { hasText: 'MB 1' })).toHaveCount(1);
    await expect(role.locator('option', { hasText: 'CALL_CENTER' })).toHaveCount(1);
    await expect(branch).toHaveValue(String(JINKY.branch_sub_id));
    await expect(role).toHaveValue(String(JINKY.role_id));
    // Each label names its own field (they all used to share id="name").
    await expect(page.getByLabel('Email')).toHaveValue(JINKY.email);
    await expect(page.getByLabel('Name')).toHaveValue(JINKY.name);
  });
}

test('typing into Create User while the lists load is kept when they arrive', async ({ page, backend }) => {
  backend.delays = { branches: 2500, roles: 2500 };
  await page.goto(`${APP}/users-setup`);
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await page.getByLabel('Email').fill('typed.early@example.test');
  await page.getByLabel('Name').fill('Typed Early');

  await expect(page.locator('#branch_id').locator('option', { hasText: 'MB 1' })).toHaveCount(1);
  await expect(page.locator('#role_id').locator('option', { hasText: 'CALL_CENTER' })).toHaveCount(1);
  await expect(page.getByLabel('Email')).toHaveValue('typed.early@example.test');
  await expect(page.getByLabel('Name')).toHaveValue('Typed Early');
});

test('Edit on one user then quickly on another shows the second, even when the first answers last', async ({ page, backend }) => {
  backend.delays = { branches: 0, roles: 0, user: { [JINKY.id]: 2500, [ROSE.id]: 0 } };
  await page.goto(`${APP}/users-setup`);
  const firstUsersAnswer = page.waitForResponse((r) =>
    r.url().endsWith('/fuerte-api') && (r.request().postData() ?? '').includes(`"id":"${JINKY.id}"`));
  await editButton(page, JINKY.name).click();
  await editButton(page, ROSE.name).click();

  await expect(page.getByLabel('Email')).toHaveValue(ROSE.email);
  await firstUsersAnswer; // the first user's slow answer has now landed, and must be ignored
  await expect(page.getByLabel('Email')).toHaveValue(ROSE.email);
  await expect(page.locator('#branch_id')).toHaveValue(String(ROSE.branch_sub_id));
  await expect(page.locator('#role_id')).toHaveValue(String(ROSE.role_id));
});
