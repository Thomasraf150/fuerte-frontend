/**
 * Desktop responsiveness guard for the shared list-table presentation.
 *
 * Fuerte targets phones at 360px for the borrower and applications pages, and
 * desktops from ~1280 CSS px everywhere (a 1920px screen at 150% Windows scaling
 * lands there). This suite is the desktop half; phone layouts are guarded by
 * their pages' own suites (e.g. tests/e2e/25-applications, 29-borrower-pages,
 * 23-problem-accounts). Before 2026-09-22 every list page
 * sized its table from its CONTENT rather than the screen, because
 * react-data-table-component wraps the table in a `display: table` box and a
 * CSS table can never be narrower than its min-content width. The width was
 * decided by the longest borrower or branch name on the page, so ten list pages
 * scrolled sideways.
 *
 * The fix is shared (`useDatatableTheme` + `src/app/styles.css`), so this guards
 * the behaviour on representative pages rather than all 41 list routes:
 *
 *   1. the content area never scrolls sideways
 *   2. a table's rows are never wider than their scroll viewport
 *   3. a column HEADER is never cut off — you must always be able to read what
 *      a column is. Cell VALUES may be clipped by design (one line per cell is
 *      what keeps a uniform row height): with a mouse, row hover reveals them,
 *      and a list that needs "…" truncates its own cells (see useDatatableTheme).
 *   4. every row in a table is the same height (a wrapped cell used to make
 *      each row a different height, which destroyed scannability)
 *
 * Credentials come from the environment so none is committed. Without them the
 * suite skips rather than failing:
 *   TEST_OWNER_EMAIL=... TEST_OWNER_PASSWORD=... npx playwright test tests/e2e/24-desktop-responsive
 */
import { test, expect, Page } from '@playwright/test';

const EMAIL = process.env.TEST_OWNER_EMAIL;
const PASSWORD = process.env.TEST_OWNER_PASSWORD;
const REST = process.env.TEST_REST_URL ?? 'http://localhost:8080';

/** The two desktop sizes we support: smallest realistic, and a full monitor. */
const WIDTHS = [1280, 1920];

/**
 * Representative of each list shape:
 *  - /borrowers            the borrower list
 *  - /loans-list           9 columns, all structured
 *  - /area                 master/detail shell (list beside a form)
 *  - /statement-of-account 7 columns, money-heavy
 */
const ROUTES = ['/borrowers', '/loans-list', '/area', '/statement-of-account'];

test.skip(
  !EMAIL || !PASSWORD,
  'Set TEST_OWNER_EMAIL and TEST_OWNER_PASSWORD to run the desktop responsiveness guard.',
);

async function signIn(page: Page) {
  const res = await page.request.post(`${REST}/api/login`, {
    data: { email: EMAIL, password: PASSWORD },
    headers: { Accept: 'application/json' },
  });
  expect(res.ok(), `login failed: ${res.status()}`).toBeTruthy();
  const { user, token } = await res.json();
  await page.addInitScript(
    ([u, t]) => {
      localStorage.setItem('authStore', JSON.stringify({ state: { user: u, authToken: t }, version: 0 }));
    },
    [user, token],
  );
}

/** All four measurements in one pass, so a page only has to load once. */
function measure() {
  const mainEl = document.querySelector('main');
  let shell: HTMLElement | null = mainEl as HTMLElement | null;
  while (shell && shell !== document.body) {
    const ox = getComputedStyle(shell).overflowX;
    if (ox === 'auto' || ox === 'scroll') break;
    shell = shell.parentElement;
  }
  const shellOver = shell && shell !== document.body ? shell.scrollWidth - shell.clientWidth : 0;

  let rowOver = 0;
  const heights = new Set<number>();
  const clippedHeaders: string[] = [];

  document.querySelectorAll('.rdt_Table').forEach((table) => {
    let sc: HTMLElement | null = table.parentElement;
    while (sc && sc !== document.body) {
      const ox = getComputedStyle(sc).overflowX;
      if (ox === 'auto' || ox === 'scroll') break;
      sc = sc.parentElement;
    }
    const viewW = sc && sc !== document.body ? sc.clientWidth : 0;

    table.querySelectorAll('.rdt_TableHeadRow, .rdt_TableRow').forEach((r) => {
      rowOver = Math.max(rowOver, Math.round(r.getBoundingClientRect().width) - viewW, r.scrollWidth - viewW);
    });
    table.querySelectorAll('.rdt_TableRow').forEach((r) => {
      heights.add(Math.round(r.getBoundingClientRect().height));
    });

    // A header is cut off by the box that CLIPS it: `.rdt_TableCol_Sortable`,
    // which has `overflow: hidden`. The label inside it is unclipped
    // (app/styles.css), so a too-long word widens the label's own box with it
    // and both spill past the clipping box — measuring the label against
    // itself never sees the cut. Two checks against the clipping box: its
    // scrollWidth catches an overflow to the right, and each text line's box
    // catches one to the LEFT, which a right-aligned column produces and
    // scrollWidth cannot see.
    table.querySelectorAll('.rdt_TableHeadRow .rdt_TableCol').forEach((col) => {
      if (getComputedStyle(col).display === 'none') return;
      const clip = (col.querySelector('.rdt_TableCol_Sortable') ?? col) as HTMLElement;
      const box = clip.getBoundingClientRect();
      const lines: DOMRect[] = [];
      const walker = document.createTreeWalker(clip, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const range = document.createRange();
        range.selectNodeContents(node);
        lines.push(...Array.from(range.getClientRects()));
      }
      // 2px / 1px of tolerance: fractional flex widths put a line a sub-pixel
      // outside its box on some column counts, which is not a real clip.
      const lineOut = lines.some((line) => line.left < box.left - 2 || line.right > box.right + 2);
      if (lineOut || clip.scrollWidth - clip.clientWidth > 1) {
        clippedHeaders.push(`${col.getAttribute('data-column-id')}:${(col.textContent ?? '').trim()}`);
      }
    });
  });

  return {
    shellOver: Math.max(0, shellOver),
    rowOver: Math.max(0, rowOver),
    rowHeights: Array.from(heights),
    clippedHeaders: Array.from(new Set(clippedHeaders)),
    rowCount: document.querySelectorAll('.rdt_TableRow').length,
  };
}

for (const route of ROUTES) {
  test(`${route} fits every supported desktop width`, async ({ page }) => {
    await signIn(page);
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    // An empty table cannot reveal an overflow, and dev GraphQL has a ~5.4s
    // floor, so wait for rows before measuring.
    await page.waitForSelector('.rdt_TableRow', { timeout: 30_000 });
    await page.waitForTimeout(1500);

    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      // Under `next dev` StrictMode fires each list query twice, and the late
      // duplicate puts CustomDatatable back into `progressPending`, which
      // unmounts every row for a few seconds. Measuring in that window sees an
      // empty table, so wait for rows to come back after each resize.
      await page.waitForSelector('.rdt_TableRow', { timeout: 30_000 });
      await page.waitForTimeout(700);
      const m = await page.evaluate(measure);

      expect(m.rowCount, `${route} rendered no rows at ${width}px`).toBeGreaterThan(0);
      expect(m.shellOver, `${route} scrolls sideways at ${width}px`).toBe(0);
      expect(m.rowOver, `${route} table is wider than its viewport at ${width}px`).toBe(0);
      expect(
        m.clippedHeaders,
        `${route} has an unreadable column header at ${width}px`,
      ).toEqual([]);
      expect(
        m.rowHeights.length,
        `${route} rows are not a uniform height at ${width}px (${m.rowHeights.join('/')}px) — a wrapping cell breaks scannability`,
      ).toBe(1);
    }
  });
}
