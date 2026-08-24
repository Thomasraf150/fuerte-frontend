import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const FRONTEND = 'http://localhost:3000';

/**
 * Auth by seeding the store, not by driving the login form.
 *
 * This spec used to log in as fuerterafael@gmail.com with a hardcoded password,
 * which the server now rejects ("Invalid Credentials", HTTP 401) — so the test
 * had been failing at login, before reaching the dropdown it exists to check.
 * /api/login is also rate limited to 5/min per account. Same gitignored fixture
 * as tests/e2e/17-branch-groups; see that file for how to generate it.
 */
const AUTH_FIXTURE = path.resolve(
  __dirname,
  '../../../fuerte-backend/dev/_scratch/auth_payload.json',
);

test('owner: balance sheet branch dropdown lists branches (null-user-id fix)', async ({ page }) => {
  test.setTimeout(120000);
  if (!fs.existsSync(AUTH_FIXTURE)) {
    throw new Error(`Missing auth fixture: ${AUTH_FIXTURE} — see tests/e2e/17-branch-groups for how to mint it.`);
  }
  const auth = fs.readFileSync(AUTH_FIXTURE, 'utf8');
  await page.addInitScript((state) => {
    localStorage.setItem('authStore', state as string);
  }, auth);

  await page.goto(`${FRONTEND}/accounting/balance-sheet`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  // Index 1, not 0: a Group (FA/FB/FC/FD) select now sits ahead of Branch on this
  // filter row. Targeting .first() would still pass — 5 group options clear the
  // >2 bar — while silently testing the wrong control, which is exactly the
  // regression this test exists to catch.
  await page.locator('input[id^="react-select"]').nth(1).click();
  await page.keyboard.press('ArrowDown');
  // Wait for the menu to render (react-select is timing-flaky on cold runs) rather than a fixed delay.
  await expect(page.getByRole('option').first()).toBeVisible({ timeout: 10000 });
  const options = await page.getByRole('option').allInnerTexts();
  console.log('branch options (' + options.length + '):', options.slice(0, 8).join(' | '));
  expect(options.length).toBeGreaterThan(2); // "All Main Branches" + real branches
  // Prove it is the Branch list, not the Group list.
  expect(options.join(' | '), 'targeted the Group select, not Branch').not.toContain('All Groups');
});
