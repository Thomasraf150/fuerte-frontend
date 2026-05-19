/**
 * Deletion-approval authorization rules.
 *
 * 8 scenarios end-to-end through the live UI:
 *   1. PROCESSING delete → "Approval requested" toast
 *   2. BRADMIN-A sees PROCESSING-filed but NOT another BRADMIN's
 *   3. BRADMIN-A delete → "Approval requested" toast
 *   4. OWNER sees both PROCESSING-filed and BRADMIN-filed
 *   5. BRADMIN-B (other branch) sees neither
 *   6. ADMIN sees normal-employee but NOT BRADMIN-filed
 *   7. OWNER approves PROCESSING-filed → "Deletion approved." toast
 *   8. OWNER rejects BRADMIN-filed → "Request rejected." toast
 *
 * Test users from DeletionApprovalTestUsersSeeder (password TestPass2026!).
 * Runs serially because tests 4–8 depend on requests seeded in beforeAll.
 */

import { test, expect, Page } from '@playwright/test';
import { execSync } from 'child_process';

const BASE = 'http://localhost:3000';
const PWD = 'TestPass2026!';

const USERS = {
  owner:       'test.owner@fuerte.test',
  admin:       'test.admin@fuerte.test',
  bradminA:    'test.bradmin.a@fuerte.test',
  bradminB:    'test.bradmin.b@fuerte.test',
  processingA: 'test.processing.a@fuerte.test',
};

interface SeededRequests {
  reqA: number;
  reqB: number;
}
let seeded: SeededRequests;

const pad = (n: number) => String(n).padStart(5, '0');

function clearAllPendingDeletionRequests(): void {
  try {
    const out = execSync(
      'docker exec fuerte-app-1 sh -c "php /var/www/html/test_cleanup.php"',
      { encoding: 'utf8', timeout: 15000 }
    );
    console.log(`   DB cleanup: ${out.trim()}`);
  } catch (e: any) {
    console.warn(`   DB cleanup failed (non-fatal): ${e.message?.slice(0, 200)}`);
  }
}

function seedTestRequests(): SeededRequests {
  const out = execSync(
    'docker exec fuerte-app-1 sh -c "php /var/www/html/test_seed_requests.php seed"',
    { encoding: 'utf8', timeout: 15000 }
  );
  const line = out.trim().split('\n').filter(Boolean).pop() ?? '{}';
  const parsed = JSON.parse(line);
  console.log(`   Seeded test requests: reqA=${parsed.reqA}, reqB=${parsed.reqB}`);
  return parsed;
}

async function loginAs(page: Page, email: string) {
  await page.context().clearCookies();
  await page.goto(`${BASE}/auth/signin`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    try { localStorage.clear(); sessionStorage.clear(); } catch {}
  });
  await page.goto(`${BASE}/auth/signin`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.waitForTimeout(1000);

  // pressSequentially mimics real typing so react-hook-form registers the change
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.click();
  await emailInput.fill('');
  await emailInput.pressSequentially(email, { delay: 20 });

  const pwdInput = page.locator('input[type="password"]').first();
  await pwdInput.click();
  await pwdInput.fill('');
  await pwdInput.pressSequentially(PWD, { delay: 20 });
  await pwdInput.press('Enter');

  await page.waitForURL((u) => !u.toString().includes('/auth/signin'), { timeout: 25000 });
  // Wait for the user-chip in the header — proves Zustand auth is hydrated
  await page.waitForSelector('text=/TEST [A-Z]/', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
}

async function logout(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
}

/**
 * useDeletionRequests reads the auth token via getState() at hook mount
 * and never re-subscribes. Landing on /approvals before Zustand hydrates
 * leaves the hook with an empty token forever (the bell, which polls
 * with a fresh token each tick, is unaffected). Workaround: warm up on
 * the dashboard, reload /approvals, then toggle tabs to force the hook's
 * `[tab]` useEffect to re-fire fetchPendingForMe.
 */
async function gotoApprovalsFresh(page: Page) {
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await page.waitForSelector('text=/TEST [A-Z]/', { timeout: 10000 }).catch(() => {});

  await page.goto(`${BASE}/approvals`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  for (const label of ['Requests', 'All decisions', 'Pending for me']) {
    const tab = page.locator(`button.appr-tab:has-text("${label}")`);
    if (await tab.count() > 0) {
      await tab.click();
      await page.waitForTimeout(label === 'Pending for me' ? 2000 : 1200);
    }
  }
}

async function deleteFirstBorrowerInList(page: Page, reason: string): Promise<{ toastText: string }> {
  await page.goto(`${BASE}/borrowers`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.rdt_TableRow', { state: 'attached', timeout: 25000 });
  await page.waitForTimeout(1500);

  const rows = page.locator('.rdt_TableRow');
  const rowCount = await rows.count();
  let clicked = false;
  for (let i = 0; i < Math.min(rowCount, 10); i++) {
    const row = rows.nth(i);
    await row.scrollIntoViewIfNeeded();
    await row.hover();
    const actionCell = row.locator('.rdt_TableCell').last();
    // Active trash has Tailwind "hover:text-red-500"; disabled trash has
    // aria-label "Already in deletion queue"
    const activeTrash = actionCell.locator(
      'svg[class*="hover:text-red-500"]:not([aria-label*="Already" i])'
    );
    if (await activeTrash.count() === 0) continue;
    await activeTrash.first().click({ force: true, timeout: 5000 });
    clicked = true;
    break;
  }
  if (!clicked) {
    throw new Error(`No actionable trash icon found in first ${Math.min(rowCount, 10)} rows`);
  }

  await page.waitForSelector('.swal2-popup.swal2-show', { timeout: 5000 });
  await page.waitForTimeout(800);
  const reasonInput = page.locator('.swal2-textarea:visible, .swal2-input:visible').first();
  await reasonInput.waitFor({ state: 'visible', timeout: 5000 }).catch(async () => {
    // SweetAlert2 occasionally fails Playwright's visibility check during
    // the entrance animation — set the value directly as a fallback
    await page.evaluate((r) => {
      const el = document.querySelector('.swal2-textarea, .swal2-input') as HTMLInputElement | HTMLTextAreaElement | null;
      if (el) {
        el.value = r;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, reason);
  });
  if (await reasonInput.isVisible().catch(() => false)) {
    await reasonInput.fill(reason);
  }
  await page.locator('button.swal2-confirm').click();

  return { toastText: await waitForResultToast(page, 60000) };
}

async function waitForResultToast(page: Page, timeoutMs: number): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const t = page.locator('.Toastify__toast').first();
    if (await t.count()) {
      const txt = ((await t.textContent()) ?? '').trim();
      if (txt) return txt;
    }
    await page.waitForTimeout(250);
  }
  throw new Error(`Result toast never appeared within ${timeoutMs / 1000}s`);
}

async function capturePendingRequestIds(page: Page): Promise<string[]> {
  // Wait until fetch resolves: either cards render or the empty-state shows
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const loadingText = page.locator('text=Loading...');
    const stillLoading = (await loadingText.count()) > 0 &&
                         (await loadingText.first().isVisible().catch(() => false));
    if (!stillLoading) {
      const hasCards = (await page.locator('.appr-card').count()) > 0;
      const hasEmptyState = (await page.locator('text=No requests waiting').count()) > 0;
      if (hasCards || hasEmptyState) break;
    }
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(500);

  const cards = await page.locator('.appr-card').all();
  const ids: string[] = [];
  for (const c of cards) {
    const text = (await c.textContent()) ?? '';
    const m = text.match(/REQ-(\d{5})/);
    if (m) ids.push(String(parseInt(m[1], 10)));
  }
  return ids;
}

async function decideRequest(page: Page, requestId: number, action: 'approve' | 'reject', note: string) {
  await gotoApprovalsFresh(page);
  await page.locator('button.appr-tab:has-text("Pending for me")').click();
  await page.waitForTimeout(2000);

  const cardSelector = `.appr-card:has-text("REQ-${pad(requestId)}")`;
  await page.waitForSelector(cardSelector, { timeout: 10000 });
  await page.locator(cardSelector).first().locator(`button.appr-btn-${action}`).click();

  await page.waitForSelector('.swal2-popup.swal2-show', { timeout: 5000 });
  await page.waitForTimeout(600);
  const noteInput = page.locator('.swal2-textarea:visible, .swal2-input:visible').first();
  if (await noteInput.count() > 0) {
    try { await noteInput.fill(note); } catch {}
  }
  await page.locator('button.swal2-confirm').click();

  return waitForResultToast(page, 30000);
}

test.describe.configure({ mode: 'serial' });
test.setTimeout(150_000);
test.describe('Deletion-approval authorization rules', () => {

  test.beforeAll(() => {
    clearAllPendingDeletionRequests();
    seeded = seedTestRequests();
  });

  test.afterAll(() => {
    clearAllPendingDeletionRequests();
  });

  test('1. PROCESSING delete → "Approval requested" toast', async ({ page }) => {
    await loginAs(page, USERS.processingA);
    const { toastText } = await deleteFirstBorrowerInList(page, 'E2E PROCESSING-filed');
    console.log(`   Toast: "${toastText}"`);
    expect(toastText.toLowerCase()).toMatch(/approval|request/i);
    expect(toastText.toLowerCase()).not.toMatch(/^deleted|borrower deleted/i);
    await logout(page);
  });

  test('2. BRADMIN-A sees PROCESSING-filed but NOT another BRADMIN\'s', async ({ page }) => {
    await loginAs(page, USERS.bradminA);
    await gotoApprovalsFresh(page);
    const ids = await capturePendingRequestIds(page);
    console.log(`   BRADMIN-A pending ids: [${ids.join(', ')}]`);
    expect(ids).toContain(String(seeded.reqA));
    expect(ids).not.toContain(String(seeded.reqB));
    await logout(page);
  });

  test('3. BRADMIN-A delete → "Approval requested" toast', async ({ page }) => {
    await loginAs(page, USERS.bradminA);
    const { toastText } = await deleteFirstBorrowerInList(page, 'E2E BRADMIN-filed');
    console.log(`   Toast: "${toastText}"`);
    expect(toastText.toLowerCase()).toMatch(/approval|request/i);
    expect(toastText.toLowerCase()).not.toMatch(/^deleted|borrower deleted/i);
    await logout(page);
  });

  test('4. OWNER sees both PROCESSING-filed and BRADMIN-filed', async ({ page }) => {
    await loginAs(page, USERS.owner);
    await gotoApprovalsFresh(page);
    const ids = await capturePendingRequestIds(page);
    console.log(`   OWNER pending ids: [${ids.join(', ')}]`);
    expect(ids).toContain(String(seeded.reqA));
    expect(ids).toContain(String(seeded.reqB));
    await logout(page);
  });

  test('5. BRADMIN-B (other branch) sees neither', async ({ page }) => {
    await loginAs(page, USERS.bradminB);
    await gotoApprovalsFresh(page);
    const ids = await capturePendingRequestIds(page);
    console.log(`   BRADMIN-B pending ids: [${ids.join(', ')}]`);
    expect(ids).not.toContain(String(seeded.reqA));
    expect(ids).not.toContain(String(seeded.reqB));
    await logout(page);
  });

  test('6. ADMIN sees normal-employee but NOT BRADMIN-filed', async ({ page }) => {
    await loginAs(page, USERS.admin);
    await gotoApprovalsFresh(page);
    const ids = await capturePendingRequestIds(page);
    console.log(`   ADMIN pending ids: [${ids.join(', ')}]`);
    expect(ids).toContain(String(seeded.reqA));
    expect(ids).not.toContain(String(seeded.reqB));
    await logout(page);
  });

  test('7. OWNER approves PROCESSING-filed → "Deletion approved." toast', async ({ page }) => {
    await loginAs(page, USERS.owner);
    const toast = await decideRequest(page, seeded.reqA, 'approve', 'E2E approve note');
    console.log(`   Approve toast: "${toast}"`);
    expect(toast.toLowerCase()).toMatch(/approv/i);
    await logout(page);
  });

  test('8. OWNER rejects BRADMIN-filed → "Request rejected." toast', async ({ page }) => {
    await loginAs(page, USERS.owner);
    const toast = await decideRequest(page, seeded.reqB, 'reject', 'E2E reject note');
    console.log(`   Reject toast: "${toast}"`);
    expect(toast.toLowerCase()).toMatch(/reject/i);
    await logout(page);
  });
});
