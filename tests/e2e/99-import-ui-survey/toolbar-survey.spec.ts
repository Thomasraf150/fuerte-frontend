import { test, expect } from '@playwright/test';
import { restLogin } from '../../helpers/e2e-helpers';

/**
 * Read-only survey of the screens the bulk-import UI has to live inside.
 * Captures a screenshot per page and dumps the real toolbar DOM, so the Import
 * button can be placed against what exists rather than what the code implies.
 *
 * Scoped to the main content region — the sidebar's ~40 nav links are noise here.
 * Each page is its own test so one slow route cannot sink the survey.
 * Writes nothing to the database.
 */

const ADMIN = { email: 'admin@gmail.com', password: '123456' };
const SHOTS = 'test-results/import-ui-survey';

const PAGES = [
  { slug: 'general-voucher', path: '/accounting/general-voucher', why: 'the ONE existing Export button — the anchor' },
  { slug: 'payment-posting', path: '/payment-posting', why: 'import target #1 — collections' },
  { slug: 'borrowers', path: '/borrowers', why: 'import target #2 — historical borrowers' },
  { slug: 'loans-list', path: '/loans-list', why: 'import target #3 — historical loans' },
  { slug: 'approvals', path: '/approvals', why: 'the review pattern the duplicate queue mirrors' },
];

for (const p of PAGES) {
  test(`toolbar survey — ${p.slug}`, async ({ page, request }) => {
    test.setTimeout(120_000);

    const { token, user } = await restLogin(request, ADMIN.email, ADMIN.password);
    expect(token, 'expected a real bearer token').toBeTruthy();

    await page.addInitScript(
      (d) => {
        localStorage.setItem(
          'authStore',
          JSON.stringify({ state: { user: d.user, authToken: d.token }, version: 0 }),
        );
      },
      { user, token },
    );

    // domcontentloaded, not networkidle: a live Pusher socket means the network never idles.
    await page.goto(`http://localhost:3000${p.path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await page.waitForTimeout(4000);

    await page.screenshot({ path: `${SHOTS}/${p.slug}.png`, fullPage: false });

    // Only controls inside the main content region — exclude <aside>/<nav> chrome.
    const found = await page.evaluate(() => {
      const main =
        document.querySelector('main') ||
        document.querySelector('[class*="content"]') ||
        document.body;

      const out: { text: string; classes: string }[] = [];
      main.querySelectorAll('button, a[href]').forEach((el) => {
        if (el.closest('aside') || el.closest('nav') || el.closest('header')) return;
        const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (!text || text.length > 45) return;
        const cls = (el.getAttribute('class') || '').trim();
        if (!/rounded|bg-gradient|bg-primary|bg-purple|border/.test(cls)) return;
        out.push({ text, classes: cls });
      });
      return out.slice(0, 20);
    });

    const heading = await page.evaluate(() => {
      const el = document.querySelector('main h1, main h2, main h3, h2, h3');
      return el ? (el.textContent || '').trim() : null;
    });

    console.log(`\n===== ${p.slug} — ${p.path} =====`);
    console.log(`purpose : ${p.why}`);
    console.log(`heading : ${heading}`);
    console.log(`controls: ${found.length}`);
    for (const b of found) {
      console.log(`  "${b.text}"`);
      console.log(`     ${b.classes.slice(0, 170)}`);
    }
  });
}
