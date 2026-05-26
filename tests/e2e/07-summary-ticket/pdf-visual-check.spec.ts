/**
 * Loads the most recently generated Summary Ticket PDF and captures different
 * pages via Chromium's PDF viewer (URL #page=N fragment).
 */

import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(__dirname, '../../../.playwright-mcp/summary-ticket');
const PDF_URL = 'http://localhost:8080/storage/pdf/Summary_Ticket_All_Branches_Jan_01_2024_to_May_22_2026.pdf';

test('Render generated PDF and capture breakdown pages', async ({ browser }) => {
  test.setTimeout(120 * 1000);

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const ctx = await browser.newContext({ viewport: { width: 1100, height: 1400 } });
  const page = await ctx.newPage();

  // Capture key pages: 1 (top of breakdown), 5 (mid main-branch), 20 (later main branch),
  // 40 (Net Movements section likely starts here, after the 36 summary blocks).
  for (const pageNum of [1, 3, 5, 10, 20, 35, 40, 44]) {
    await page.goto(`${PDF_URL}#page=${pageNum}`, { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `pdf-p${String(pageNum).padStart(2, '0')}.png`),
      fullPage: false,
    });
    console.log(`   📸 pdf-p${String(pageNum).padStart(2, '0')}.png`);
  }

  await ctx.close();
});
