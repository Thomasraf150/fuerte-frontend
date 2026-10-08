/**
 * The header bell's Applications items (spec 2026-10-05-applications-pings-decisions-design.md,
 * Part 3), stubbed.
 *
 *   1. Processing (PROC): the bell asks getApplicationNotifications, and two "is now a borrower"
 *      items are two rows, newest first, with a badge of 2. Opening the bell clears the badge: the
 *      items' keys join the deletion ids in localStorage 'fuerte.notif.seenIds', so a reload keeps
 *      it clear and only a new key brings it back. A row opens the BORROWER (/borrowers/<id>).
 *   2. Call Center (CALLCTR): status changes and decisions, in words ("Interviewed", "back to For
 *      Interview", "Rejected: <reason>", "Approved"), each with its branch and time. A row opens the
 *      APPLICATION, a decision's too: Call Center cannot open a borrower.
 *   3. Everyone else is never asked: Accounting, Marketing (Collection) and the Owner send no
 *      getApplicationNotifications (proved once the page's later requests have gone out).
 *   4. At 360px the open dropdown is on screen whole (it used to hang 32px off the right edge), its
 *      list scrolls inside its 320px, a long reason is two lines at most, every row is 48px or
 *      taller, and nothing scrolls sideways.
 *   5. The keyboard: Enter opens the bell, Tab moves from row to row with the dropdown staying
 *      open, and Escape closes it with the focus back on the bell. A click on the bell with the
 *      focus in the dropdown closes it once (it does not reopen). A corrupt seen list in
 *      localStorage counts as nothing seen and breaks nothing.
 *   6. A Processing item with no borrower opens the application; an Approved with a reason reads
 *      "Approved: <reason>".
 *
 * The browser is in Los Angeles, 15 hours behind Manila: an item from Manila's today shows its
 * time ("2:45 PM"), an older one its day ("Oct 2"), whatever the browser's own date says.
 *
 * NO CREDENTIALS AND NO BACKEND: the fake backend, made-up token and fictional people of
 * tests/e2e/27-application-page/applicationPageHarness.ts. The borrower page a Processing row opens
 * is stood in for by a blank page, so it asks the fake nothing.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/28-applications-pings --reporter=list
 */
import type { Locator, Page } from '@playwright/test';
import { manilaToday } from '../../../src/utils/sourceTracker';
import type { ApplicationNotification } from '../../../src/utils/DataTypes';
import {
  APP,
  type FakeBackend,
  application,
  expect,
  openApplication,
  sidewaysScroll,
  signedInAs,
  test,
} from '../27-application-page/applicationPageHarness';

test.setTimeout(180_000);
test.use({ timezoneId: 'America/Los_Angeles' });

// ---------------------------------------------------------------------------
// Fictional items
// ---------------------------------------------------------------------------

const TODAY = manilaToday();

/** A Manila day `days` before `ymd`, as Y-m-d. */
const daysBefore = (ymd: string, days: number): string => {
  const [year, month, day] = ymd.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day - days)).toISOString().slice(0, 10);
};
const EARLIER = daysBefore(TODAY, 3);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** How the bell shows a day before today: "Oct 2". */
const shortDay = (ymd: string): string => {
  const [, month, day] = ymd.split('-').map(Number);
  return `${MONTHS[month - 1]} ${day}`;
};

/** One item as the server sends it. The key's shape is the server's: status:{application}:{status}:{at}, decision:{id}. */
const item = (over: Partial<ApplicationNotification> & Pick<ApplicationNotification, 'application_id'>): ApplicationNotification => {
  const base: ApplicationNotification = {
    key: '',
    kind: 'status',
    borrower_id: null,
    full_name: `E2E Applicant ${over.application_id}`,
    branch_name: 'E2E Sub-branch A',
    status: 'borrower_created',
    reason: null,
    at: `${TODAY} 14:45:00`,
    ...over,
  };
  return { ...base, key: base.key || `status:${base.application_id}:${base.status}:${base.at}` };
};

/** Processing's: two applicants who are now borrowers, newest first. */
const PROC_ITEMS = [
  item({ application_id: 21, borrower_id: 77, full_name: 'E2E Applicant Twenty-One', at: `${TODAY} 14:45:00` }),
  item({ application_id: 22, borrower_id: 78, full_name: 'E2E Applicant Twenty-Two', branch_name: 'E2E Sub-branch B', at: `${EARLIER} 09:05:00` }),
];

/** Call Center's: a rejection with its reason, two status changes (one with no branch yet) and an approval. */
const CALLCTR_ITEMS = [
  item({ key: 'decision:501', kind: 'decision', application_id: 31, borrower_id: 81, full_name: 'E2E Applicant Thirty-One', status: 'rejected', reason: 'Kulang ang income', at: `${TODAY} 16:20:00` }),
  item({ application_id: 2, full_name: 'E2E Applicant Two', status: 'interviewed', at: `${TODAY} 10:05:00` }),
  item({ application_id: 33, full_name: 'E2E Applicant Thirty-Three', status: 'for_interview', branch_name: null, at: `${EARLIER} 08:00:00` }),
  item({ key: 'decision:502', kind: 'decision', application_id: 34, borrower_id: 84, full_name: 'E2E Applicant Thirty-Four', status: 'approved', at: `${EARLIER} 07:30:00` }),
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** The bell: a link named by its count ("2 new notification(s)") or "Notifications". */
const bell = (page: Page): Locator => page.locator('header a[aria-expanded]');
/** The dropdown, the bell's sibling. */
const panel = (page: Page): Locator => page.locator('header li:has(> a[aria-expanded]) > div');
/** Its rows: each one link. */
const rows = (page: Page): Locator => panel(page).locator('ul > li > a');

/** What the bell has seen, kept per user since 2026-10-08 (fakeUser's id is 90000 + the role id: Processing = 90003). */
const SEEN_KEY = 'fuerte.notif.seenIds:90003';
const seenIds = (page: Page): Promise<string[]> =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '[]'), SEEN_KEY);

const asked = (backend: FakeBackend): number => backend.calls('getApplicationNotifications').length;

/** Open the Applications list (it asks the fake only what it stubs) and wait until this page's bell has asked. */
async function openList(page: Page, backend: FakeBackend): Promise<void> {
  const before = asked(backend);
  await page.goto('/applications', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await expect(page.getByRole('group', { name: 'Filter applications by status' })).toBeVisible({ timeout: 90_000 });
  await expect.poll(() => asked(backend), { timeout: 30_000 }).toBeGreaterThan(before);
}

/** The borrower page a Processing row opens: a blank stand-in (it would ask the fake for a borrower), so only the address is tested. */
async function standInForBorrowerPages(page: Page): Promise<void> {
  await page.route(`${APP}/borrowers/**`, (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>E2E borrower</title><p>E2E borrower page</p>' }),
  );
}

// ---------------------------------------------------------------------------
// 1. Processing
// ---------------------------------------------------------------------------

test('1. Processing: two new borrowers, a badge of 2 that opening clears for good, and a row opens the borrower', async ({ page, backend }) => {
  backend.notifications = PROC_ITEMS;
  await standInForBorrowerPages(page);
  await signedInAs(page, backend, 'PROC', [9101], 9101);
  await openList(page, backend);

  await expect(bell(page)).toHaveAttribute('aria-label', '2 new notification(s)');
  await expect(bell(page)).toHaveText('2');
  await expect(bell(page)).toHaveAttribute('aria-expanded', 'false');

  await bell(page).click();

  await expect(bell(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(rows(page)).toHaveCount(2);
  await expect(rows(page).nth(0)).toContainText('E2E Applicant Twenty-One');
  await expect(rows(page).nth(0)).toContainText('is now a borrower');
  await expect(rows(page).nth(0)).toContainText(/E2E Sub-branch A · 2:45\sPM/);
  await expect(rows(page).nth(1)).toContainText('E2E Applicant Twenty-Two');
  await expect(rows(page).nth(1)).toContainText(`E2E Sub-branch B · ${shortDay(EARLIER)}`);
  // Processing opens the borrower.
  await expect(rows(page).nth(0)).toHaveAttribute('href', '/borrowers/77');
  await expect(rows(page).nth(1)).toHaveAttribute('href', '/borrowers/78');
  // Opening the bell saw them: the badge is gone, and the keys are kept.
  await expect(bell(page)).toHaveAttribute('aria-label', 'Notifications');
  await expect(bell(page)).toHaveText('');
  expect((await seenIds(page)).sort()).toEqual(PROC_ITEMS.map((one) => one.key).sort());

  await rows(page).nth(0).click();
  await expect(page).toHaveURL(`${APP}/borrowers/77`, { timeout: 90_000 });

  // Back on a page with the bell: once the same items are in (the closed dropdown holds its rows), still seen.
  await openList(page, backend);
  await expect(rows(page)).toHaveCount(2);
  await expect(bell(page)).toHaveAttribute('aria-label', 'Notifications');
  await expect(bell(page)).toHaveText('');
  await bell(page).click();
  await expect(rows(page).first()).toBeVisible();

  // A new key brings the badge back, for that one only.
  backend.notifications = [item({ application_id: 23, borrower_id: 79, full_name: 'E2E Applicant Twenty-Three', at: `${TODAY} 15:10:00` }), ...PROC_ITEMS];
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(bell(page)).toHaveAttribute('aria-label', '1 new notification(s)', { timeout: 90_000 });
  await expect(bell(page)).toHaveText('1');
});

// ---------------------------------------------------------------------------
// 2. Call Center
// ---------------------------------------------------------------------------

test('2. Call Center: status changes and decisions, with the reason, and a row opens the application', async ({ page, backend }) => {
  backend.notifications = CALLCTR_ITEMS;
  backend.record = application({ status: 'interviewed' });
  await signedInAs(page, backend, 'CALLCTR');
  await openList(page, backend);

  await expect(bell(page)).toHaveAttribute('aria-label', '4 new notification(s)');
  await bell(page).click();

  await expect(rows(page)).toHaveCount(4);
  const [rejected, interviewed, backToInterview, approved] = [0, 1, 2, 3].map((index) => rows(page).nth(index));
  await expect(rejected).toContainText('E2E Applicant Thirty-One');
  await expect(rejected).toContainText('Rejected: Kulang ang income');
  await expect(rejected).toContainText(/E2E Sub-branch A · 4:20\sPM/);
  await expect(interviewed).toContainText('E2E Applicant Two');
  await expect(interviewed).toContainText('Interviewed');
  await expect(interviewed).toContainText(/E2E Sub-branch A · 10:05\sAM/);
  await expect(backToInterview).toContainText('back to For Interview');
  // No branch yet: the day alone, with no dangling separator.
  await expect(backToInterview).toContainText(shortDay(EARLIER));
  await expect(backToInterview).not.toContainText('·');
  await expect(approved).toContainText('Approved');
  await expect(approved).not.toContainText('Approved:');
  // Call Center opens the application, a decision's too (the borrower is not its to open).
  await expect(rejected).toHaveAttribute('href', '/applications/31');
  await expect(interviewed).toHaveAttribute('href', '/applications/2');
  await expect(backToInterview).toHaveAttribute('href', '/applications/33');
  await expect(approved).toHaveAttribute('href', '/applications/34');
  await expect(panel(page).locator('a[href^="/borrowers"]')).toHaveCount(0);

  await interviewed.click();

  await expect(page).toHaveURL(`${APP}/applications/2`, { timeout: 90_000 });
  await expect(page.getByRole('heading', { name: 'E2E Applicant Two' })).toBeVisible({ timeout: 90_000 });
  await expect(panel(page)).toBeHidden();
});

// ---------------------------------------------------------------------------
// 3. Everyone else
// ---------------------------------------------------------------------------

for (const role of ['ACCTG', 'COL', 'OWN'] as const) {
  test(`3. ${role} is never asked for Applications items`, async ({ page, backend }) => {
    backend.notifications = PROC_ITEMS; // there to be found, if the bell asked
    backend.record = application();
    await signedInAs(page, backend, role, [9101], 9101);
    await openApplication(page, '2');
    await expect(bell(page)).toBeVisible();
    // The bell asks in its mount effects, as soon as it knows the role and the token. The page's
    // repeat-applicant check goes out only after the application itself has loaded, so once it has
    // been asked the bell has long had its chance; the Owner's deletion poll, from the same bell, too.
    await expect.poll(() => backend.calls('getLoanApplicationBorrowerMatch').length, { timeout: 30_000 }).toBeGreaterThan(0);
    if (role === 'OWN') await expect.poll(() => backend.calls('pendingDeletionRequestsForMe').length, { timeout: 30_000 }).toBeGreaterThan(0);

    expect(asked(backend), `${role} asked for getApplicationNotifications`).toBe(0);
    await expect(bell(page)).toHaveAttribute('aria-label', 'Notifications');
    await bell(page).click();
    await expect(panel(page)).toContainText('No notifications');
  });
}

// ---------------------------------------------------------------------------
// 4. At 360px
// ---------------------------------------------------------------------------

test('4. at 360px the open dropdown is whole on screen, its list scrolls inside, and a long reason is two lines', async ({ page, backend }) => {
  const LONG_REASON =
    'Kulang ang income para sa hinihinging halaga, at may dalawang aktibong utang pa sa ibang lending company na hindi pa tapos bayaran ngayong taon';
  backend.notifications = [
    item({
      key: 'decision:601', kind: 'decision', application_id: 41, borrower_id: 91, status: 'rejected', reason: LONG_REASON,
      full_name: 'E2E Applicant With A Very Long Family Name Dela Cruz Santos', branch_name: 'E2E Sub-branch With A Long Name',
    }),
    ...Array.from({ length: 19 }, (_, index) =>
      item({ application_id: 100 + index, status: index % 2 ? 'declined' : 'interviewed', at: `${EARLIER} 0${index % 10}:15:00` })),
  ];
  await page.setViewportSize({ width: 360, height: 800 });
  await signedInAs(page, backend, 'CALLCTR');
  await openList(page, backend);

  await bell(page).click();
  await expect(rows(page)).toHaveCount(20);

  const box = (await panel(page).boundingBox())!;
  expect(box.x, 'the dropdown starts on screen').toBeGreaterThanOrEqual(0);
  expect(box.x + box.width, 'the dropdown ends on screen').toBeLessThanOrEqual(360);
  expect(box.y + box.height, 'the dropdown fits the screen\'s height').toBeLessThanOrEqual(800);
  expect(await sidewaysScroll(page)).toBe(0);

  // Twenty rows scroll inside the list's 320px, not the page.
  const list = await panel(page).locator('ul').evaluate((element) => ({ client: element.clientHeight, scroll: element.scrollHeight }));
  expect(list.client).toBeLessThanOrEqual(320);
  expect(list.scroll).toBeGreaterThan(list.client);

  // Every row is a 48px target.
  const heights = await rows(page).evaluateAll((links) => links.map((link) => link.getBoundingClientRect().height));
  for (const height of heights) expect(height).toBeGreaterThanOrEqual(48);

  // The long reason is cut at two lines, and the name and the branch wrap rather than widen the dropdown.
  const first = rows(page).first();
  await expect(first).toContainText(`Rejected: ${LONG_REASON.slice(0, 40)}`);
  const clamp = await first.getByText(/^Rejected: /).evaluate((element) => {
    const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
    return { height: element.getBoundingClientRect().height, lineHeight, clipped: element.scrollHeight > element.clientHeight };
  });
  expect(clamp.clipped, 'the reason is longer than two lines, and cut').toBe(true);
  expect(clamp.height).toBeLessThanOrEqual(clamp.lineHeight * 2 + 1);
  const rowBox = (await first.boundingBox())!;
  expect(rowBox.x + rowBox.width).toBeLessThanOrEqual(box.x + box.width);
});

// ---------------------------------------------------------------------------
// 5. The keyboard
// ---------------------------------------------------------------------------

test('5. keyboard: Enter opens the bell, Tab walks its rows with the dropdown open, Escape closes it back on the bell', async ({ page, backend }) => {
  backend.notifications = CALLCTR_ITEMS;
  await signedInAs(page, backend, 'CALLCTR');
  await openList(page, backend);
  await expect(rows(page)).toHaveCount(4);

  await bell(page).focus();
  await page.keyboard.press('Enter');
  await expect(panel(page)).toBeVisible();
  await expect(bell(page)).toHaveAttribute('aria-expanded', 'true');

  await page.keyboard.press('Tab');
  await expect(rows(page).nth(0)).toBeFocused();
  // Moving from one row to the next keeps the dropdown open.
  await page.keyboard.press('Tab');
  await expect(rows(page).nth(1)).toBeFocused();
  await expect(panel(page)).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(panel(page)).toBeHidden();
  await expect(bell(page)).toBeFocused();
  await expect(bell(page)).toHaveAttribute('aria-expanded', 'false');
});

test('5. a click on the bell while the focus is in the dropdown closes it, and does not open it again', async ({ page, backend }) => {
  backend.notifications = CALLCTR_ITEMS;
  await signedInAs(page, backend, 'CALLCTR');
  await openList(page, backend);
  await expect(rows(page)).toHaveCount(4);

  await bell(page).click();
  await expect(panel(page)).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(rows(page).nth(0)).toBeFocused();

  // The focus moves to the bell first (a blur), then the click lands: one toggle, closed.
  await bell(page).click();
  await expect(panel(page)).toBeHidden();
  await expect(bell(page)).toHaveAttribute('aria-expanded', 'false');
  await page.waitForTimeout(300);
  await expect(panel(page)).toBeHidden();
});

// Rafael 2026-10-08: on one browser, Processing opening the bell hid the badge from Marketing logging in after it,
// because the seen list was one for the whole browser. Each person now keeps their own.
test('5. two people on one browser: one opening the bell does not hide the badge from the other', async ({ page, backend }) => {
  backend.notifications = PROC_ITEMS;
  await signedInAs(page, backend, 'PROC', [9101], 9101);
  await openList(page, backend);
  await expect(bell(page)).toHaveAttribute('aria-label', '2 new notification(s)');
  await bell(page).click();
  await expect(rows(page)).toHaveCount(2);
  await expect(bell(page)).toHaveAttribute('aria-label', 'Notifications');

  // Another person who is told of Applications items logs in on the same browser: their badge is their own.
  await signedInAs(page, backend, 'CALLCTR');
  await openList(page, backend);
  await expect(bell(page)).toHaveAttribute('aria-label', '2 new notification(s)');
});

test('5. a corrupt seen list in localStorage does not break the bell: everything counts as unseen', async ({ page, backend }) => {
  backend.notifications = PROC_ITEMS;
  // Not a list: the bell must read it as nothing seen, not crash the header (the harness fails on any page error).
  await page.addInitScript((key) => localStorage.setItem(key, '{"status:21":true}'), SEEN_KEY);
  await signedInAs(page, backend, 'PROC', [9101], 9101);
  await openList(page, backend);

  await expect(bell(page)).toHaveAttribute('aria-label', '2 new notification(s)');
  await bell(page).click();
  await expect(rows(page)).toHaveCount(2);
  expect((await seenIds(page)).sort()).toEqual(PROC_ITEMS.map((one) => one.key).sort());
});

// ---------------------------------------------------------------------------
// 6. The edges of an item
// ---------------------------------------------------------------------------

test('6. Processing: an item with no borrower opens the application', async ({ page, backend }) => {
  backend.notifications = [item({ application_id: 25, borrower_id: null, full_name: 'E2E Applicant Twenty-Five' })];
  await signedInAs(page, backend, 'PROC', [9101], 9101);
  await openList(page, backend);

  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toHaveAttribute('href', '/applications/25');
});

test('6. Call Center: an Approved with a reason reads "Approved: <reason>"', async ({ page, backend }) => {
  backend.notifications = [
    item({ key: 'decision:701', kind: 'decision', application_id: 35, borrower_id: 85, status: 'approved', reason: 'Kumpleto ang requirements' }),
  ];
  await signedInAs(page, backend, 'CALLCTR');
  await openList(page, backend);

  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText('Approved: Kumpleto ang requirements');
  await expect(rows(page).first()).toHaveAttribute('href', '/applications/35');
});
