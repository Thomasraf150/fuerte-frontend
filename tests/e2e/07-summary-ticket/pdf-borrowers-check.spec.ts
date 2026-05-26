import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SHOT_DIR = path.resolve(__dirname, '../../../.playwright-mcp/summary-ticket');
const PDF_URL = 'http://localhost:8080/storage/pdf/Summary_Ticket_All_Branches_Jan_01_2024_to_May_26_2026.pdf';

test('Capture PDF page showing borrower counts in headers', async ({ browser }) => {
  test.setTimeout(60 * 1000);
  if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 1500 } });
  const page = await ctx.newPage();
  await page.goto(PDF_URL, { waitUntil: 'load' });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(SHOT_DIR, 'pdf-borrowers-p1.png'), fullPage: false });
  console.log('   📸 pdf-borrowers-p1.png');
  await ctx.close();
});
