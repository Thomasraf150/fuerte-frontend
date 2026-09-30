/**
 * BorrowerDetails.tsx's `initialValues` switch, proved before any page uses it.
 *
 * RETIRED IN STEP 3 (Create as borrower): that page is the first to pass initialValues,
 * so this test moves into its spec then, and this file is deleted. The other switches
 * (variant, requiredFields, branchChoices, renderExtraFields) are covered through the
 * real page by new-application.spec.ts.
 *
 * HOW. /borrowers/new is opened as usual (stubbed, see borrowerFormHarness.ts), which
 * loads BorrowerDetails into the page. The test then takes that same module, and the
 * page's own React, from the dev build's webpack registry and mounts a second copy in
 * an overlay, with the props under test. No route or production code exists for this.
 * It relies on the dev server's named module ids, as every spec here runs against
 * `next dev`; on any other build (production, Turbopack) the test skips itself.
 *
 *   4. initialValues: the form starts from them, loads the starting area's
 *      sub-areas, and submits them, never with an `id`.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/26-new-application --reporter=line
 */
import type { Locator, Page } from '@playwright/test';
import {
  AREA_WITH_SUB_AREAS,
  AREA_WITHOUT_SUB_AREAS,
  BRANCH_SUBS,
  expect,
  type FakeBackend,
  fieldErrors,
  openNewBorrower,
  saveButton,
  selectedText,
  signedInAs,
  test,
} from './borrowerFormHarness';

test.setTimeout(180_000);

/** The basics the New application page requires. */
const BASICS = ['firstname', 'lastname', 'contact_no', 'amount_applied', 'purpose', 'branch_sub_id'];

const choice = (index: number) => ({ value: BRANCH_SUBS[index].id, label: BRANCH_SUBS[index].name });

/** Fictional picklists, handed to the mounted copy as props. */
const LISTS = {
  chiefs: [{ id: '9201', name: 'E2E Chief One' }],
  companies: [{ id: '9301', name: 'E2E Company One' }],
  areas: [
    { id: '9401', name: AREA_WITH_SUB_AREAS, sub_area: [{ id: '9501', name: 'E2E Sub-area One' }, { id: '9502', name: 'E2E Sub-area Two' }] },
    { id: '9402', name: AREA_WITHOUT_SUB_AREAS, sub_area: [] },
  ],
  subAreas: {
    '9401': [{ id: '9501', name: 'E2E Sub-area One' }, { id: '9502', name: 'E2E Sub-area Two' }],
    '9402': [],
  } as Record<string, { id: string; name: string }[]>,
  branchSubs: BRANCH_SUBS,
};

interface Switches {
  required?: string[];
  initialValues?: Record<string, unknown>;
  branchChoices?: { value: string; label: string }[];
  /** Render a required "Saan galing" select through renderExtraFields. */
  extraFields?: boolean;
  variant?: 'borrower' | 'application';
}

interface Recorded {
  submitted: { hasId: boolean; data: Record<string, unknown> }[];
  subAreaFetches: unknown[];
}

/** The modules the mount takes from the registry, by the end of their dev-build ids. */
const MODULES = {
  react: '/next/dist/compiled/react/index.js',
  reactDomClient: '/next/dist/compiled/react-dom/client.js',
  borrowerDetails: '/src/app/borrowers/components/TabForm/BorrowerDetails.tsx',
};

/**
 * Whether this is a webpack dev build whose registry holds those modules by path.
 * A production build numbers its modules, and Turbopack has no webpackChunk_N_E.
 */
async function hasDevRegistry(page: Page): Promise<boolean> {
  return page.evaluate((suffixes) => {
    const chunks = (window as unknown as { webpackChunk_N_E?: unknown }).webpackChunk_N_E;
    if (!Array.isArray(chunks)) return false;
    let cache: Record<string, unknown> | undefined;
    chunks.push([[Symbol('e2e-switches-probe')], {}, (r: { c?: Record<string, unknown> }) => { cache = r.c; }]);
    const ids = Object.keys(cache ?? {});
    return suffixes.every((suffix) => ids.some((id) => id.endsWith(suffix)));
  }, Object.values(MODULES));
}

/** Mount a second BorrowerDetails, with these switches, over the open /borrowers/new. */
async function mountDetails(page: Page, switches: Switches): Promise<Locator> {
  await page.evaluate(({ switches, lists, modules }) => {
    type Req = ((id: string) => any) & { c: Record<string, unknown> };
    let req: Req | undefined;
    const chunks = (window as unknown as { webpackChunk_N_E: unknown[] }).webpackChunk_N_E;
    chunks.push([[Symbol('e2e-switches')], {}, (r: Req) => { req = r; }]);
    const load = (suffix: string) => {
      const id = Object.keys(req!.c).find((key) => key.endsWith(suffix));
      if (!id) throw new Error(`not in the dev build's module registry: ${suffix}`);
      return req!(id);
    };
    const R = load(modules.react);
    const { createRoot } = load(modules.reactDomClient);
    const BorrowerDetails = load(modules.borrowerDetails).default;
    const h = R.createElement;

    const recorded = { submitted: [], subAreaFetches: [] } as Recorded;
    (window as unknown as { e2eSwitches: Recorded }).e2eSwitches = recorded;

    const renderChannel = ({ register, errors }: { register: any; errors: any }) =>
      h('div', { 'data-testid': 'extra-fields' },
        h('label', { htmlFor: 'channel' }, 'Saan galing'),
        h('select', { id: 'channel', ...register('channel', { required: 'Piliin kung saan galing ang application.' }) },
          h('option', { value: '' }, 'Piliin'),
          h('option', { value: 'facebook' }, 'Facebook Messenger'),
          h('option', { value: 'walk_in' }, 'Walk-in')),
        errors.channel ? h('p', null, errors.channel.message) : null);

    function Host() {
      const [dataSubArea, setDataSubArea] = R.useState(undefined);
      const noop = () => {};
      return h(BorrowerDetails, {
        dataChief: lists.chiefs,
        dataArea: lists.areas,
        dataSubArea,
        dataBorrCompany: lists.companies,
        myAccessibleBranchSubs: lists.branchSubs,
        loadingMyAccessibleBranches: false,
        onSubmitBorrower: async (data: Record<string, unknown>) => {
          recorded.submitted.push({ hasId: 'id' in data, data: JSON.parse(JSON.stringify(data)) });
          return { success: false };
        },
        singleData: undefined,
        setSingleData: noop,
        borrowerLoading: false,
        setShowForm: noop,
        fetchDataBorrower: noop,
        fetchDataChief: noop,
        fetchDataArea: noop,
        fetchDataBorrCompany: noop,
        fetchDataSubArea: (areaId: unknown) => {
          recorded.subAreaFetches.push(areaId);
          setDataSubArea(lists.subAreas[String(areaId)] ?? []);
        },
        requiredFields: switches.required ? new Set(switches.required) : undefined,
        initialValues: switches.initialValues,
        branchChoices: switches.branchChoices,
        renderExtraFields: switches.extraFields ? renderChannel : undefined,
        variant: switches.variant,
      });
    }

    const host = document.createElement('div');
    host.dataset.testid = 'switches-mount';
    Object.assign(host.style, { position: 'fixed', inset: '0', overflow: 'auto', zIndex: '99999', background: '#fff' });
    document.body.appendChild(host);
    createRoot(host).render(h(Host));
  }, { switches, lists: LISTS, modules: MODULES });

  const form = page.getByTestId('switches-mount').locator('form');
  await expect(form.locator('input[name="firstname"]')).toBeVisible();
  return form;
}

const recorded = (page: Page): Promise<Recorded> =>
  page.evaluate(() => (window as unknown as { e2eSwitches: Recorded }).e2eSwitches);

/** Open /borrowers/new as usual for this user, then mount the copy under test. */
async function mountFor(page: Page, backend: FakeBackend, assigned: number[], switches: Switches): Promise<Locator> {
  await signedInAs(page, backend, assigned);
  await openNewBorrower(page);
  test.skip(!(await hasDevRegistry(page)), 'dev build only: mounts BorrowerDetails via the webpack dev registry');
  return mountDetails(page, switches);
}

// ---------------------------------------------------------------------------

test('4. initialValues: the form starts from them, loads the area\'s sub-areas, and submits without an id', async ({ page, backend }) => {
  const form = await mountFor(page, backend, [9101], {
    variant: 'application',
    extraFields: true,
    required: BASICS,
    branchChoices: [choice(0), choice(1)],
    initialValues: {
      id: '70001',
      firstname: 'Maria',
      lastname: 'Reyes',
      contact_no: '09170000041',
      amount_applied: 20000,
      purpose: 'Tuition',
      area_id: '9401',
      sub_area_id: '9502',
      branch_sub_id: '9102',
    },
  });

  await expect(form.locator('input[name="firstname"]')).toHaveValue('Maria');
  await expect(form.locator('input[name="lastname"]')).toHaveValue('Reyes');
  await expect(form.locator('input[name="contact_no"]')).toHaveValue('09170000041');
  await expect(form.locator('input[name="amount_applied"]')).toHaveValue('20,000');
  await expect(form.locator('input[name="purpose"]')).toHaveValue('Tuition');
  // Untouched defaults stay: the three prefilled reference positions.
  await expect(form.locator('input[name="reference.2.occupation"]')).toHaveValue('Co-worker');
  expect(await selectedText(form, 'area_id')).toBe(AREA_WITH_SUB_AREAS);
  await expect.poll(() => selectedText(form, 'sub_area_id')).toBe('E2E Sub-area Two');
  expect((await recorded(page)).subAreaFetches).toEqual([9401]);
  // The starting branch wins over the home-branch default.
  expect(await selectedText(form, 'branch_sub_id')).toBe('E2E Sub-branch B');

  await form.locator('select[name="channel"]').selectOption('facebook');
  await saveButton(form).click();

  await expect.poll(async () => (await recorded(page)).submitted.length).toBe(1);
  expect(await fieldErrors(form)).toEqual({});
  const [{ hasId, data }] = (await recorded(page)).submitted;
  expect(hasId, 'an id from the starting values would turn the create into an update').toBe(false);
  expect(data).toMatchObject({
    firstname: 'Maria',
    lastname: 'Reyes',
    contact_no: '09170000041',
    amount_applied: 20000,
    purpose: 'Tuition',
    area_id: '9401',
    sub_area_id: '9502',
    branch_sub_id: '9102',
    channel: 'facebook',
    chief_id: 0,
    is_rent: 0,
  });
});
