/**
 * E2E Test: Delete Borrower
 *
 * This test validates the borrower deletion functionality.
 * Tests soft delete, confirmation dialogs, and data removal.
 *
 * Flow:
 * 1. Create a test borrower
 * 2. Navigate to borrowers list
 * 3. Click delete button
 * 4. Confirm deletion in dialog
 * 5. Verify borrower removed from list
 * 6. Verify borrower soft-deleted in database
 */

import { test, expect } from '@playwright/test';
import {
  loginToApp,
  navigateToPage,
  fillBorrowerForm,
  verifySuccessMessage,
  queryGraphQL,
  generateTestData,
  searchInList,
  expectVisible
} from '../../helpers/test-utils';

test.describe('Delete Borrower', () => {

  test('should delete borrower and remove from list', async ({ page }) => {
    console.log('\n🧪 Testing borrower deletion...');

    // ========================================================================
    // STEP 0: Login to application
    // ========================================================================
    console.log('\n🔐 Logging in to application...');
    await loginToApp(page);

    const testData = generateTestData('DeleteTest');
    console.log(`   Using email: ${testData.email}`);
    console.log(`   Using name: ${testData.firstname} ${testData.lastname}`);

    // ========================================================================
    // STEP 1: Create borrower to delete
    // ========================================================================
    console.log('\n📍 Step 1: Creating borrower for deletion test...');
    await navigateToPage(page, '/borrowers');
    await page.click('button:has-text("Create")');
    await page.waitForSelector('form', { timeout: 5000 });

    console.log('   📝 Filling form...');
    await fillBorrowerForm(page, testData);

    console.log('   💾 Submitting form...');
    await page.waitForTimeout(500);
    await page.locator('button[type="submit"]').click();
    await verifySuccessMessage(page);

    // Wait for form to close after successful creation
    await page.waitForSelector('form', { state: 'hidden', timeout: 10000 });
    console.log('✅ Test borrower created successfully');

    // ========================================================================
    // STEP 2: Verify borrower exists in list before deletion
    // ========================================================================
    console.log('\n📍 Step 2: Verifying borrower exists in list...');

    // Wait for table to be visible
    await page.waitForSelector('table, [role="table"]', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(1000);

    // Search for the borrower by firstname (email not shown in table)
    await searchInList(page, testData.firstname);
    await expectVisible(page, `text=${testData.firstname}`);
    console.log('✅ Borrower found in list');

    // ========================================================================
    // STEP 3: Delete the borrower
    // ========================================================================
    console.log('\n📍 Step 3: Deleting borrower...');

    // Click delete button (trash icon or delete text) for the first matching row
    await page.click('button:has-text("Delete"), button[aria-label="Delete"], [data-feather="trash"]');

    // Wait for confirmation dialog
    await page.waitForTimeout(1000);

    // Handle confirmation dialog (SweetAlert2)
    const swalConfirm = page.locator('button.swal2-confirm, button:has-text("Yes"), button:has-text("Confirm"), button:has-text("OK")');
    if (await swalConfirm.count() > 0) {
      console.log('   🔔 Confirming deletion...');
      await swalConfirm.click();
    } else {
      // If native confirm dialog, it's handled automatically by Playwright
      page.on('dialog', dialog => dialog.accept());
    }

    // Wait for success message after deletion
    await verifySuccessMessage(page);
    console.log('✅ Deletion confirmed and completed');

    // ========================================================================
    // STEP 4: Verify borrower removed from list
    // ========================================================================
    console.log('\n📍 Step 4: Verifying borrower removed from list...');

    // Refresh the list
    await page.waitForTimeout(2000);

    // Search again for the borrower
    await searchInList(page, testData.firstname);

    // Borrower should NOT be visible anymore
    const borrowerLocator = page.locator(`text=${testData.firstname}`);
    const isVisible = await borrowerLocator.isVisible().catch(() => false);
    expect(isVisible).toBe(false);

    console.log('✅ Borrower removed from UI list');

    // ========================================================================
    // STEP 5: Verify deletion in database
    // ========================================================================
    console.log('\n📍 Step 5: Verifying database state...');

    // Try to fetch deleted borrower (should return empty)
    const result = await queryGraphQL(`
      query GetBorrowers($search: String) {
        getBorrowers(search: $search, first: 10, page: 1) {
          data {
            firstname
            borrower_details {
              email
            }
          }
        }
      }
    `, { search: testData.email });

    // Should return no results (soft deleted borrowers are excluded from getBorrowers)
    expect(result.data.getBorrowers.data.length).toBe(0);
    console.log('   ✓ No records found in database (soft deleted)');

    console.log('\n🎉 Borrower Deletion Test PASSED');
    console.log('   ✓ Borrower created successfully');
    console.log('   ✓ Borrower found in list');
    console.log('   ✓ Deletion confirmed');
    console.log('   ✓ Borrower removed from UI');
    console.log('   ✓ Borrower soft-deleted in database\n');
  });
});
