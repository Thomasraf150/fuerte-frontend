/**
 * Problem Accounts — responsive regression suite.
 *
 * Guards three defects reported on 2026-09-21, all of which reproduce at the
 * measured widths asserted below:
 *
 *  1. The summary cards built their value as `₱ ${amount}`. That plain space is
 *     a break opportunity, so once a card got narrow the browser put "₱" on its
 *     own line. It wrapped at every viewport from 1024px to 1280px — which is
 *     where a 1920px screen at 125–150% Windows scaling lands.
 *  2. The table rendered at a fixed ~1238px intrinsic width at EVERY viewport,
 *     roughly 4x its container on a 360px phone.
 *  3. The "Missed Cut-offs" header rendered as "MISSED CU…" with nothing on
 *     screen explaining what the red figures counted.
 *
 * The suite mocks the GraphQL response rather than reading the database, so it
 * asserts layout at fixed content and cannot flake on changing loan data. Auth
 * on this app is client-side (withAuth reads the persisted zustand store and
 * probes /api/user), so seeding the store plus stubbing that one endpoint is
 * enough to render the page — no credentials are needed.
 */
import { test, expect, Page } from '@playwright/test';

const SUMMARY = {
  total_problem_accounts: 6060,
  total_shortfall: '106692061.06',
  total_ua_amount: '105470926.62',
  total_sp_amount: '1221134.42',
};

/** The longest total in SUMMARY — the one that used to wrap. */
const LONGEST_TOTAL = '105,470,926.62';

const mkRow = (i: number, name: string, ref: string, missed: number) => ({
  loan_id: String(i),
  loan_ref: ref,
  borrower_id: String(i),
  borrower_name: name,
  borrower_phone: null,
  borrower_address: null,
  branch_name: 'Nueva Vizcaya',
  sub_branch_name: 'Nueva Vizcaya Sub 2',
  pn_amount: '250000.00',
  cumulative_scheduled: '216000.00',
  cumulative_collected: '0.00',
  ua_amount: '216000.00',
  sp_amount: '0.00',
  shortfall: '216000.00',
  oldest_unpaid_due_date: '2024-08-20',
  oldest_unpaid_schedule_id: '9001',
  cutoffs_missed: missed,
});

const ROWS = [
  mkRow(1, 'WATANABE, AKIO N/A', 'MB 1-00207', 18),
  mkRow(2, 'DELOS SANTOS, JUSTINA BUMANLAG', 'FBLU-00000087', 69),
  mkRow(3, 'CARINO, MELANIE BADUA', 'NUEV-00225', 72),
];

async function gotoProblemAccounts(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'authStore',
      JSON.stringify({
        state: {
          user: { id: 1, name: 'E2E OWNER', roles: [], assignedBranchSubIds: [] },
          authToken: 'e2e-layout-only',
        },
        version: 0,
      }),
    );
  });

  await page.route('**/api/user', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"id":1}' }),
  );

  await page.route('**/fuerte-api', (route) => {
    const query = (route.request().postDataJSON() || {}).query || '';
    const json = (data: unknown) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data }),
      });

    if (query.includes('getProblemAccounts')) {
      return json({
        getProblemAccounts: {
          data: ROWS,
          summary: SUMMARY,
          pagination: {
            totalRecords: 6060,
            perPage: 20,
            currentPage: 1,
            currentBatch: 1,
            totalBatches: 1,
            batchStartPage: 1,
            batchEndPage: 1,
            hasNextBatch: true,
          },
        },
      });
    }
    if (/getBranchGroup/i.test(query)) return json({ getBranchGroups: [{ id: 1, name: 'FA' }] });
    if (/getBranchSub/i.test(query)) return json({ getBranchSubs: [] });
    if (/getBranch/i.test(query)) return json({ getBranches: [{ id: 1, name: 'Marikina FA' }] });
    return json({});
  });

  await page.goto('/problem-accounts', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText(LONGEST_TOTAL)).toBeVisible({ timeout: 30_000 });
  // The root layout's full-screen Loader stays up for its first 1000ms; a hit
  // test (elementFromPoint) taken under it lands on the overlay, not the page.
  await expect(page.locator('.fixed.inset-0.z-9999')).toHaveCount(0);
}

/** How many lines the element's text occupies, from its height vs line-height. */
async function lineCount(page: Page, text: string): Promise<number> {
  return page.evaluate((needle) => {
    const el = Array.from(document.querySelectorAll('main p')).find((p) =>
      (p.textContent || '').includes(needle),
    );
    if (!el) return -1;
    const lh = parseFloat(getComputedStyle(el).lineHeight);
    return lh ? Math.round(el.getBoundingClientRect().height / lh) : -1;
  }, text);
}

/** Any visible header or cell whose box escapes the table's visible viewport. */
async function overflowingCells(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const table = document.querySelector('.rdt_Table');
    const view = document.querySelector('.responsive-table-container');
    if (!table || !view || table.getBoundingClientRect().width === 0) return [];
    const vb = view.getBoundingClientRect();
    const bad: string[] = [];
    table.querySelectorAll('.rdt_TableCol, .rdt_TableCell').forEach((el) => {
      if (getComputedStyle(el).display === 'none') return;
      const r = el.getBoundingClientRect();
      if (r.right > vb.right + 1 || r.left < vb.left - 1) {
        bad.push(`${el.getAttribute('data-column-id')}:${Math.round(r.right - vb.right)}px`);
      }
    });
    return Array.from(new Set(bad));
  });
}

test.describe('Problem Accounts — responsive layout', () => {
  // Every width at which the column ladder changes, plus both sides of each
  // measured boundary so an off-by-one in a `hide` value fails the suite.
  const WIDTHS = [360, 390, 768, 1024, 1278, 1279, 1280, 1366, 1598, 1599, 1600, 1920];

  test('the peso total never breaks onto a second line', async ({ page }) => {
    await gotoProblemAccounts(page);
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(250);
      expect(await lineCount(page, LONGEST_TOTAL), `₱ total wrapped at ${width}px`).toBe(1);
    }
  });

  test('nothing overflows horizontally at any width', async ({ page }) => {
    await gotoProblemAccounts(page);
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(250);

      expect(await overflowingCells(page), `table overflowed at ${width}px`).toEqual([]);

      const pageOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(pageOverflow, `page scrolled sideways at ${width}px`).toBeLessThanOrEqual(0);
    }
  });

  test('phones get the card list, not the table', async ({ page }) => {
    await gotoProblemAccounts(page);
    await page.setViewportSize({ width: 360, height: 740 });
    await page.waitForTimeout(250);

    // Each card holds one link, so Ctrl/Cmd-click and a long-press open a tab.
    const cards = page.locator('main ul li:has(a)');
    await expect(cards).toHaveCount(ROWS.length);

    // The card must carry the borrower, what is owed, and the missed count —
    // those are the three things the table columns provided.
    const first = cards.first();
    await expect(first).toContainText('WATANABE, AKIO N/A');
    await expect(first).toContainText('216,000.00');
    await expect(first).toContainText('Missed cut-offs');
    await expect(first).toContainText('18');

    // The link is named by the borrower alone and goes where the table row goes.
    const link = first.getByRole('link', { name: 'WATANABE, AKIO N/A', exact: true });
    await expect(link).toHaveAttribute(
      'href',
      /^\/collection-list\/9001\?date=\d{4}-\d{2}-\d{2}&ref=MB%201-00207$/,
    );

    // Tap target must clear the 48px minimum on a budget Android handset, and is
    // the whole card: the link is stretched over it, so its centre hits the link.
    await first.scrollIntoViewIfNeeded();
    const box = await first.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(48);
    const hit = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x, y)?.closest('a')?.textContent ?? null,
      [box!.x + box!.width / 2, box!.y + box!.height / 2],
    );
    expect(hit, 'a tap on the card does not reach its link').toBe('WATANABE, AKIO N/A');

    // The desktop table must not be rendered underneath it.
    const tableWidth = await page.evaluate(() => {
      const t = document.querySelector('.rdt_Table');
      return t ? t.getBoundingClientRect().width : 0;
    });
    expect(tableWidth, 'the 1238px table is still rendered on a phone').toBe(0);
  });

  test('the Missed Cut-offs header is never ellipsized, and is explained', async ({ page }) => {
    await gotoProblemAccounts(page);

    for (const width of [768, 1024, 1279, 1280, 1366, 1440, 1599, 1600, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(250);

      await expect(
        page.locator('.rdt_TableCol', { hasText: 'Missed Cut-offs' }).first(),
        `header missing at ${width}px`,
      ).toBeVisible();

      // "MISSED CU…" was the reported symptom, but the same failure mode hit
      // "UNCOLLECTED (UA)" from the other side: a right-aligned column narrower
      // than a single long word overflows LEFT into `overflow: hidden` and
      // renders as "NCOLLECTED UA)". So check EVERY visible header, measuring
      // each text line's own box against the column's content box — an
      // element-level scrollWidth check misses the left-hand overflow.
      const clipped = await page.evaluate(() => {
        const bad: string[] = [];
        document.querySelectorAll('.rdt_TableHeadRow .rdt_TableCol').forEach((col) => {
          if (getComputedStyle(col).display === 'none') return;
          const label = col.querySelector('span') ?? col;
          const box = label.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(label);
          for (const line of Array.from(range.getClientRects())) {
            if (line.left < box.left - 1 || line.right > box.right + 1) {
              bad.push(`${col.getAttribute('data-column-id')}:"${col.textContent?.trim()}"`);
              break;
            }
          }
        });
        return Array.from(new Set(bad));
      });
      expect(clipped, `header text clipped at ${width}px`).toEqual([]);
    }

    // The legend states what the red figures are, on every screen size.
    await expect(page.getByText('are money still owed')).toBeVisible();
    await expect(page.getByText('Missed cut-offs:').first()).toBeVisible();
    await expect(page.getByText('Uncollected (UA):').first()).toBeVisible();
    await expect(page.getByText('Shorts (SP):').first()).toBeVisible();
  });

  test('the column ladder sheds columns instead of scrolling', async ({ page }) => {
    await gotoProblemAccounts(page);

    const visibleColumnIds = async () =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll('.rdt_TableHeadRow .rdt_TableCol'))
          .filter((c) => getComputedStyle(c).display !== 'none')
          .map((c) => c.getAttribute('data-column-id')),
      );

    // These four carry the report and are never dropped.
    const CORE = ['pa-borrower', 'pa-loan-ref', 'pa-missed', 'pa-shortfall'];

    await page.setViewportSize({ width: 1200, height: 900 });
    await page.waitForTimeout(250);
    expect(await visibleColumnIds()).toEqual(CORE);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(250);
    expect(await visibleColumnIds()).toEqual([
      'pa-borrower',
      'pa-loan-ref',
      'pa-branch',
      'pa-missed',
      'pa-ua',
      'pa-sp',
      'pa-shortfall',
    ]);

    await page.setViewportSize({ width: 1920, height: 900 });
    await page.waitForTimeout(250);
    expect((await visibleColumnIds()).length).toBe(10);
  });

  test('columns use stable string ids, immune to the borrowers stylesheet', async ({ page }) => {
    await gotoProblemAccounts(page);
    await page.setViewportSize({ width: 1920, height: 900 });
    await page.waitForTimeout(250);

    // react-data-table-component falls back to a positional id (1, 2, 3 …) when
    // a column has none. `borrowers/styles.css` hides bare [data-column-id="3"]
    // and ["6"] at =<768px and, because a Next.js CSS import is global once
    // loaded, those rules reach any table rendered afterwards. String ids make
    // this page immune.
    const ids = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.rdt_TableHeadRow .rdt_TableCol')).map((c) =>
        c.getAttribute('data-column-id'),
      ),
    );
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(id, 'positional column id is vulnerable to leaked CSS').not.toMatch(/^\d+$/);
    }
  });
});
