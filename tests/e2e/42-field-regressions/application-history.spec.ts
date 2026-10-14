/**
 * The application page's History tab (Rafael, 2026-10-14): "a history tab so people know who is
 * making edits" -- by name and role, newest first, under a heading per Manila day:
 *   - WAI-ARIA tabs: Application | History, one tab stop, Left / Right / Home / End;
 *   - a System line for an automatic fix (never mistaken for a person), with its note;
 *   - old -> new per field, as the page words them (a date, a status), the decline's reason;
 *   - how it came in ("Pasted it from the Google Sheet");
 *   - the form keeps what was typed and not saved while History is open;
 *   - at 360px: 48px tabs and no sideways scroll.
 *
 * NO CREDENTIALS AND NO BACKEND: tests/e2e/27-application-page/applicationPageHarness.ts. The
 * clock is Manila 2026-10-14 10:00, so the 14th is "Today" and the 13th "Yesterday".
 */
import type { Page } from '@playwright/test';
import { test, expect, signedInAs, openApplication, googleFormApplication, field, statusSelect, toolbar } from '../27-application-page/applicationPageHarness';
import { sidewaysScroll } from '../26-new-application/borrowerFormHarness';
import type { ApplicationHistoryEntry } from '../../../src/utils/DataTypes';

const HISTORY: ApplicationHistoryEntry[] = [
  {
    kind: 'system_fix', at: '2026-10-14 09:00:00', actor_name: null, actor_role: null, via: null,
    note: 'The Google Sheet showed this date month first (10/4/2026 is October 4), and it had been read day first. Corrected automatically.',
    changes: [{ field: 'submitted_at', from: '2026-04-10 13:45:00', to: '2026-10-04 13:45:00' }],
  },
  {
    kind: 'status', at: '2026-10-13 15:20:00', actor_name: 'Jen Fictional Faye', actor_role: 'Call Center', via: null, note: null,
    changes: [{ field: 'status', from: 'for_interview', to: 'declined' }, { field: 'decline_reason', from: null, to: 'Hindi maabot sa numero' }],
  },
  {
    kind: 'edited', at: '2026-10-13 15:10:00', actor_name: 'Jen Fictional Faye', actor_role: 'Call Center', via: null, note: null,
    changes: [{ field: 'contact_no', from: '09170000002', to: '09170000999' }, { field: 'details', from: null, to: 'work' }],
  },
  { kind: 'added', at: '2026-10-12 10:05:00', actor_name: 'Jen Fictional Faye', actor_role: 'Call Center', via: 'paste', note: null, changes: [] },
];

const tab = (page: Page, name: string) => page.getByRole('tab', { name: new RegExp(`^${name}`) });
const historyPanel = (page: Page) => page.getByRole('tabpanel', { name: /^History/ });

test.describe('Application page: the History tab', () => {
  // The dev server compiles the route on its first visit.
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(async ({ page, backend }) => {
    await page.clock.setFixedTime(new Date('2026-10-14T10:00:00+08:00'));
    backend.record = googleFormApplication({ exact_time: true, submitted_at: '2026-10-04 13:45:00', history: HISTORY });
    await signedInAs(page, backend, 'CALLCTR');
  });

  test('two tabs, keyboard reachable, and the lines say who changed what', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    await openApplication(page, '2');

    await expect(page.getByRole('tablist', { name: 'Application sections' })).toBeVisible();
    await expect(tab(page, 'Application')).toHaveAttribute('aria-selected', 'true');
    await expect(tab(page, 'History')).toHaveAttribute('aria-selected', 'false');
    await expect(tab(page, 'History')).toHaveAccessibleName(/^History\s*,\s*4 lines$/);
    await expect(historyPanel(page)).toBeHidden();

    // One tab stop; the arrows move between the tabs and open them; Home goes back.
    await tab(page, 'Application').focus();
    await page.keyboard.press('ArrowRight');
    await expect(tab(page, 'History')).toBeFocused();
    await expect(tab(page, 'History')).toHaveAttribute('aria-selected', 'true');
    await expect(tab(page, 'Application')).toHaveAttribute('tabindex', '-1');
    const panel = historyPanel(page);
    await expect(panel).toBeVisible();

    // Newest first, a heading per Manila day.
    await expect(panel.getByRole('heading', { level: 4 })).toHaveText(['Today', 'Yesterday', 'Monday, October 12, 2026']);
    const lines = panel.locator('li[data-history]');
    await expect(lines).toHaveCount(4);

    // The automatic fix is the System's, with its note and the date old -> new as the page writes dates.
    const fix = lines.nth(0);
    await expect(fix.getByText('System', { exact: true })).toBeVisible();
    await expect(fix.getByText('Corrected automatically', { exact: true })).toBeVisible();
    await expect(fix.getByText(/read day first/)).toBeVisible();
    await expect(fix.locator('del')).toHaveText('Apr 10, 2026, 1:45 PM');
    await expect(fix.locator('ins')).toHaveText('Oct 4, 2026, 1:45 PM');

    // A person by name and role: the status in words, and the decline's reason.
    const status = lines.nth(1);
    await expect(status.getByText('Jen Fictional Faye', { exact: true })).toBeVisible();
    await expect(status.getByText('· Call Center', { exact: true })).toBeVisible(); // the role, after its separator
    await expect(status.locator('del')).toHaveText('For Interview');
    await expect(status.locator('ins')).toHaveText('Declined');
    await expect(status.getByText('Hindi maabot sa numero', { exact: true })).toBeVisible();

    const edited = lines.nth(2);
    await expect(edited.getByText('Edited the application', { exact: true })).toBeVisible();
    await expect(edited.locator('del')).toHaveText('09170000002');
    await expect(edited.locator('ins')).toHaveText('09170000999');
    await expect(edited.getByText('work', { exact: true })).toBeVisible();

    await expect(lines.nth(3).getByText('Pasted it from the Google Sheet', { exact: true })).toBeVisible();
    await page.screenshot({ path: 'test-results/42-application-history.png', fullPage: true });

    await page.keyboard.press('Home');
    await expect(tab(page, 'Application')).toBeFocused();
    await expect(historyPanel(page)).toBeHidden();
  });

  test('a status saved shows its History line straight away', async ({ page, backend }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    await openApplication(page, '2');
    const line: ApplicationHistoryEntry = {
      kind: 'status', at: '2026-10-14 10:00:00', actor_name: 'E2E Call Center', actor_role: 'Call Center', via: null, note: null,
      changes: [{ field: 'status', from: 'for_interview', to: 'interviewed' }],
    };
    backend.overrides.set('setLoanApplicationStatus', () => ({
      data: { setLoanApplicationStatus: { id: '2', status: 'interviewed', borrower_id: null, outcome: 'interviewed', outcome_label: 'Interviewed', decline_reason: null, notes: [], history: [line, ...HISTORY] } },
    }));

    await statusSelect(page).selectOption('interviewed');
    await toolbar(page).getByRole('button', { name: /^(Save status|Saving…|Saved)$/ }).click();
    await expect(tab(page, 'History')).toHaveAccessibleName(/^History\s*,\s*5 lines$/);
    await tab(page, 'History').click();

    const first = historyPanel(page).locator('li[data-history]').first();
    await expect(first.getByText('E2E Call Center', { exact: true })).toBeVisible();
    await expect(first.locator('ins')).toHaveText('Interviewed');
  });

  test('the form keeps what was typed while History is open', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    await openApplication(page, '2');
    const purpose = field(page, 'purpose');
    await purpose.fill('E2E: typed, not saved');

    await tab(page, 'History').click();
    await expect(historyPanel(page)).toBeVisible();
    await tab(page, 'Application').click();

    await expect(purpose).toHaveValue('E2E: typed, not saved');
  });

  test('on a phone: 48px tabs and no sideways scroll', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openApplication(page, '2');
    await tab(page, 'History').click();
    await expect(historyPanel(page)).toBeVisible();

    for (const name of ['Application', 'History']) {
      const box = await tab(page, name).boundingBox();
      expect(box?.height ?? 0, `${name} tab height`).toBeGreaterThanOrEqual(48);
    }
    expect(await sidewaysScroll(page), 'the page does not scroll sideways').toBeLessThanOrEqual(1);
    await page.screenshot({ path: 'test-results/42-application-history-phone.png', fullPage: true });
  });
});
