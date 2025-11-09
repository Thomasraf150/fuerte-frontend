/**
 * E2E Test: Update Borrower Basic Information
 *
 * This test validates that borrower information can be updated correctly.
 * Tests update functionality from UI to database.
 *
 * Flow:
 * 1. Create a borrower
 * 2. Navigate to edit form
 * 3. Update borrower information
 * 4. Submit changes
 * 5. Verify success message
 * 6. Verify updated data in database
 */

import { test, expect } from '@playwright/test';
import {
  navigateToPage,
  fillBorrowerForm,
  verifySuccessMessage,
  queryGraphQL,
  generateTestData,
  searchInList,
  expectVisible
} from '../../helpers/test-utils';

test.describe('Update Borrower', () => {

  test('should update borrower basic information', async ({ page }) => {
    console.log('\n🧪 Testing borrower update...');

    const originalData = generateTestData('UpdateTest');

    // ========================================================================
    // STEP 1: Create borrower first
    // ========================================================================
    console.log('\n📍 Creating initial borrower...');
    await navigateToPage(page, '/borrowers');
    await page.click('button:has-text("Create")');
    await page.waitForSelector('form', { timeout: 5000 });
    await fillBorrowerForm(page, originalData);
    await page.waitForTimeout(500);
    await page.locator('button[type="submit"]').click();
    await verifySuccessMessage(page);
    console.log('✅ Initial borrower created');

    // ========================================================================
    // STEP 2: Navigate to edit form
    // ========================================================================
    console.log('\n📍 Opening edit form...');
    await navigateToPage(page, '/borrowers');
    await searchInList(page, originalData.email);

    // Click edit button (could be icon or text)
    await page.click('button:has-text("Edit"), button[aria-label="Edit"], svg[data-feather="edit"]').first();
    await page.waitForSelector('form', { timeout: 5000 });
    console.log('✅ Edit form opened');

    // ========================================================================
    // STEP 3: Update borrower information
    // ========================================================================
    console.log('\n📍 Updating borrower information...');

    const updatedData = {
      ...originalData,
      firstname: `${originalData.firstname}_UPDATED`,
      middlename: `${originalData.middlename}_UPDATED`,
      lastname: `${originalData.lastname}_UPDATED`,
      contact_no: '09999999999',
      residence_address: 'UPDATED ADDRESS - 456 New Street, Manila'
    };

    // Update fields
    await page.fill('input[name="firstname"], input#firstname', updatedData.firstname);
    await page.fill('input[name="middlename"], input#middlename', updatedData.middlename);
    await page.fill('input[name="lastname"], input#lastname', updatedData.lastname);
    await page.fill('input[name="contact_no"], input#contact_no', updatedData.contact_no);

    const addressElement = page.locator('input[name="residence_address"], textarea[name="residence_address"]').first();
    if (await addressElement.count() > 0) {
      await addressElement.fill(updatedData.residence_address);
    }

    // Submit update
    await page.waitForTimeout(500);
    await page.locator('button[type="submit"]').click();
    await verifySuccessMessage(page);
    console.log('✅ Update submitted');

    // ========================================================================
    // STEP 4: Verify updated data in database
    // ========================================================================
    console.log('\n📍 Verifying updated data in database...');

    const result = await queryGraphQL(`
      query GetBorrowers($search: String) {
        getBorrowers(search: $search, first: 1, page: 1) {
          data {
            firstname
            middlename
            lastname
            borrower_details {
              email
              contact_no
              residence_address
            }
          }
        }
      }
    `, { search: originalData.email });

    const borrower = result.data.getBorrowers.data[0];

    // Verify updates
    expect(borrower.firstname).toBe(updatedData.firstname);
    expect(borrower.middlename).toBe(updatedData.middlename);
    expect(borrower.lastname).toBe(updatedData.lastname);
    expect(borrower.borrower_details.contact_no).toBe(updatedData.contact_no);
    expect(borrower.borrower_details.residence_address).toBe(updatedData.residence_address);

    // Verify email stayed the same
    expect(borrower.borrower_details.email).toBe(originalData.email);

    console.log('✅ Borrower update test PASSED\n');
  });
});
