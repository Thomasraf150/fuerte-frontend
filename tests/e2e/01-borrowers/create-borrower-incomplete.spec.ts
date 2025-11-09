/**
 * E2E Test: Create Borrower with Missing Required Fields (Validation Test)
 *
 * This test validates that the system PREVENTS borrower creation when required fields are missing.
 *
 * Flow:
 * 1. Login and open create borrower form
 * 2. Fill ONLY 3 fields (firstname, middlename, lastname)
 * 3. Click Save
 * 4. Verify "This field is required" text appears
 * 5. Go back to borrower list
 * 6. Search for the name
 * 7. Verify name is NOT in search results (borrower was not created)
 */

import { test, expect } from '@playwright/test';
import {
  loginToApp,
  navigateToPage,
  searchInList,
  generateTestData
} from '../../helpers/test-utils';

test.describe('Create Incomplete Borrower - Validation Test', () => {

  test('should show validation errors when required fields are missing', async ({ page }) => {
    console.log('\n🧪 Testing incomplete borrower form validation...');

    // ========================================================================
    // STEP 1: Login and navigate
    // ========================================================================
    console.log('\n🔐 Logging in...');
    await loginToApp(page);

    console.log('\n📍 Navigating to borrowers page...');
    await navigateToPage(page, '/borrowers');

    // ========================================================================
    // STEP 2: Open create form
    // ========================================================================
    console.log('\n📍 Opening create form...');
    await page.click('button:has-text("Create")');
    await page.waitForSelector('form', { timeout: 5000 });
    console.log('✅ Form opened');

    // ========================================================================
    // STEP 3: Fill ONLY 3 fields (leave rest empty)
    // ========================================================================
    console.log('\n📍 Filling ONLY 3 fields...');

    const testData = generateTestData('IncompleteTest');

    await page.fill('input[name="firstname"]', testData.firstname);
    await page.fill('input[name="middlename"]', testData.middlename);
    await page.fill('input[name="lastname"]', testData.lastname);

    console.log(`   ✓ Filled: ${testData.firstname} ${testData.middlename} ${testData.lastname}`);
    console.log('   ❌ Left ALL other 49 required fields EMPTY');

    // ========================================================================
    // STEP 4: Click Save (should fail validation)
    // ========================================================================
    console.log('\n📍 Attempting to submit incomplete form...');
    await page.click('button:has-text("Save"), button:has-text("Submit"), button[type="submit"]');

    // Wait for validation to trigger
    await page.waitForTimeout(2000);

    // ========================================================================
    // STEP 5: Verify "This field is required" text appears
    // ========================================================================
    console.log('\n📍 Checking for validation error text...');

    // Look for "required" text anywhere on the page
    const requiredText = page.locator('text=/required|Required|campo requerido/i');
    const isVisible = await requiredText.first().isVisible({ timeout: 5000 }).catch(() => false);

    expect(isVisible).toBe(true);
    const count = await requiredText.count();
    console.log(`✅ Found ${count} "required" validation message(s) on page`);

    // ========================================================================
    // STEP 6: Go back to borrower list
    // ========================================================================
    console.log('\n📍 Navigating back to borrower list...');
    await navigateToPage(page, '/borrowers');

    // Wait for table to be visible
    await page.waitForSelector('table, [role="table"]', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(1000);

    // ========================================================================
    // STEP 7: Search for the name and verify NOT found
    // ========================================================================
    console.log(`\n📍 Searching for "${testData.firstname}" in list...`);
    await searchInList(page, testData.firstname);

    // Borrower should NOT be visible (because validation failed)
    const borrowerLocator = page.locator(`text=${testData.firstname}`);
    const borrowerVisible = await borrowerLocator.isVisible().catch(() => false);

    expect(borrowerVisible).toBe(false);
    console.log('✅ Confirmed: Borrower NOT in list (validation prevented creation)');

    console.log('\n🎉 VALIDATION TEST PASSED');
    console.log('   ✓ Validation errors displayed');
    console.log('   ✓ Form submission prevented');
    console.log('   ✓ No incomplete data saved\n');
  });
});
