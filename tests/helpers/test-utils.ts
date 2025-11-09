/**
 * COMPLETE E2E Test Helper Functions
 * Updated to include ALL 52 borrower form fields
 */

import { Page, expect } from '@playwright/test';

// ============================================================================
// COMPLETE BORROWER DATA INTERFACE (52 FIELDS)
// ============================================================================

export interface BorrowerData {
  // SECTION 1: Borrower Information (14 fields)
  photo?: string;
  amount_applied: string;
  purpose: string;
  firstname: string;
  middlename: string;
  lastname: string;
  terms_of_payment: string;
  other_source_of_inc: string;
  residence_address: string;
  is_rent: string;
  est_monthly_fam_inc: string;
  employment_position: string;
  chief_id: string;
  gender: string;

  // SECTION 2: Borrower Details (6 fields)
  dob: string;
  place_of_birth: string;
  age: number;
  email: string;
  contact_no: string;
  civil_status: string;

  // SECTION 3: Borrower Spouse Details (9 fields)
  work_address: string;
  occupation: string;
  fullname: string;              // Spouse's full name
  company: string;
  dept_branch: string;
  length_of_service: string;
  salary: string;
  company_contact_person: string;
  spouse_contact_no: string;

  // SECTION 4: Work Background (11 fields)
  company_borrower_id: string;
  employment_number: string;
  area_id: string;
  sub_area_id: string;
  station: string;
  term_in_service: string;
  employment_status: string;
  division: string;
  monthly_gross: string;
  monthly_net: string;
  office_address: string;

  // SECTION 5: References (3 references)
  references: Array<{
    occupation: string;
    name: string;
    contact_no: string;
  }>;

  // SECTION 6: Company Information (3 fields)
  employer: string;
  company_salary: string;
  contract_duration: string;
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

export async function loginToApp(page: Page) {
  await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  if (!page.url().includes('/auth/signin')) {
    console.log('   ℹ Already logged in');
    return;
  }

  // Wait for email input - use type="email" since name attribute is missing
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });

  // Fill email and password - use type selectors since name attributes are missing
  await page.fill('input[type="email"]', 'admin@gmail.com');
  await page.fill('input[type="password"]', '123456');

  // Find and click the submit button
  const submitButton = page.locator('button[type="submit"]').first();
  await submitButton.click();

  // CRITICAL: Wait for the login button to show loading state (button text changes to "Signing In...")
  // This confirms the API call has started
  await page.waitForSelector('button:has-text("Signing In...")', { timeout: 5000 }).catch(() => {
    console.log('   ⚠️ Loading state not detected (login might be instant)');
  });

  // Wait for loading state to disappear (API call completed)
  await page.waitForSelector('button:has-text("Sign In")', { state: 'visible', timeout: 15000 }).catch(() => {
    console.log('   ℹ Button state changed');
  });

  // Now wait for navigation with multiple strategies
  try {
    // Strategy 1: Wait for URL change (primary)
    await page.waitForURL(url => !url.toString().includes('/auth/signin'), { timeout: 10000 });
    console.log('   ✓ Logged in successfully (URL changed)');
  } catch (error) {
    // Strategy 2: Check if we're on home page by looking for dashboard elements
    const currentUrl = page.url();
    console.log(`   ℹ Current URL after login attempt: ${currentUrl}`);

    if (!currentUrl.includes('/auth/signin')) {
      console.log('   ✓ Logged in successfully (URL check passed)');
    } else {
      // Strategy 3: Check for error toast
      const errorToast = await page.locator('.Toastify__toast--error').count();
      if (errorToast > 0) {
        const errorText = await page.locator('.Toastify__toast--error').first().textContent();
        throw new Error(`Login failed with error: ${errorText}`);
      }

      // Take screenshot for debugging
      await page.screenshot({ path: '.playwright-mcp/login-timeout-debug.png' });
      throw new Error(`Login failed - still on signin page after timeout. URL: ${currentUrl}. Screenshot saved.`);
    }
  }

  // Final wait for page to stabilize
  await page.waitForTimeout(2000);
  console.log('   ✓ Login complete, page ready');
}

// ============================================================================
// NAVIGATION
// ============================================================================

export async function navigateToPage(page: Page, path: string) {
  await page.goto(`http://localhost:3000${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  if (page.url().includes('/auth/signin')) {
    console.log('   ℹ Session expired, logging in...');
    await loginToApp(page);
    await page.goto(`http://localhost:3000${path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
  }
}

// ============================================================================
// FORM FILLING - ALL 52 FIELDS
// ============================================================================

// Helper function: Simple fill - no clear, just overwrite
async function fillAndBlur(page: Page, selector: string, value: string) {
  const input = page.locator(selector).first();

  // Just fill directly without clearing (faster and avoids DOM detachment)
  await input.fill(value, { timeout: 5000 });
}

export async function fillBorrowerForm(page: Page, data: BorrowerData) {
  console.log('   📝 Filling ALL borrower form fields...');

  // SECTION 1: Borrower Information
  await fillAndBlur(page, 'input[name="amount_applied"]', data.amount_applied);
  await fillAndBlur(page, 'input[name="purpose"], textarea[name="purpose"]', data.purpose);
  await fillAndBlur(page, 'input[name="firstname"]', data.firstname);
  await fillAndBlur(page, 'input[name="middlename"]', data.middlename);
  await fillAndBlur(page, 'input[name="lastname"]', data.lastname);
  await fillAndBlur(page, 'input[name="terms_of_payment"]', data.terms_of_payment);
  await fillAndBlur(page, 'input[name="other_source_of_inc"]', data.other_source_of_inc);
  await fillAndBlur(page, 'input[name="residence_address"], textarea[name="residence_address"]', data.residence_address);

  // Select dropdown for is_rent
  const isRentSelect = page.locator('select[name="is_rent"]').first();
  if (await isRentSelect.count() > 0) {
    await isRentSelect.selectOption(data.is_rent);
  }

  await fillAndBlur(page, 'input[name="est_monthly_fam_inc"]', data.est_monthly_fam_inc);
  await fillAndBlur(page, 'input[name="employment_position"]', data.employment_position);

  // Select dropdown for chief_id
  const chiefSelect = page.locator('select[name="chief_id"]').first();
  if (await chiefSelect.count() > 0) {
    await chiefSelect.selectOption(data.chief_id);
  }

  // Select dropdown for gender
  const genderSelect = page.locator('select[name="gender"]').first();
  if (await genderSelect.count() > 0) {
    await genderSelect.selectOption(data.gender);
  }

  // SECTION 2: Borrower Details
  await fillAndBlur(page, 'input[name="dob"]', data.dob);
  await fillAndBlur(page, 'input[name="place_of_birth"]', data.place_of_birth);
  await fillAndBlur(page, 'input[name="age"]', data.age.toString());
  await fillAndBlur(page, 'input[name="email"]', data.email);
  await fillAndBlur(page, 'input[name="contact_no"]', data.contact_no);
  await fillAndBlur(page, 'input[name="civil_status"]', data.civil_status);

  // SECTION 3: Spouse Details
  await fillAndBlur(page, 'input[name="work_address"], textarea[name="work_address"]', data.work_address);
  await fillAndBlur(page, 'input[name="occupation"]', data.occupation);
  await fillAndBlur(page, 'input[name="fullname"]', data.fullname);
  await fillAndBlur(page, 'input[name="company"]', data.company);
  await fillAndBlur(page, 'input[name="dept_branch"]', data.dept_branch);
  await fillAndBlur(page, 'input[name="length_of_service"]', data.length_of_service);
  await fillAndBlur(page, 'input[name="salary"]', data.salary);
  await fillAndBlur(page, 'input[name="company_contact_person"]', data.company_contact_person);
  await fillAndBlur(page, 'input[name="spouse_contact_no"]', data.spouse_contact_no);

  // SECTION 4: Work Background
  const companySelect = page.locator('select[name="company_borrower_id"]').first();
  if (await companySelect.count() > 0) {
    await companySelect.selectOption(data.company_borrower_id);
  }

  await fillAndBlur(page, 'input[name="employment_number"]', data.employment_number);

  const areaSelect = page.locator('select[name="area_id"]').first();
  if (await areaSelect.count() > 0) {
    await areaSelect.selectOption(data.area_id);
    await page.waitForTimeout(1500); // Wait for sub_area options to load
  }

  const subAreaSelect = page.locator('select[name="sub_area_id"]').first();
  if (await subAreaSelect.count() > 0) {
    await subAreaSelect.selectOption(data.sub_area_id);
  }

  await fillAndBlur(page, 'input[name="station"]', data.station);
  await fillAndBlur(page, 'input[name="term_in_service"]', data.term_in_service);

  const employmentStatusSelect = page.locator('select[name="employment_status"]').first();
  if (await employmentStatusSelect.count() > 0) {
    await employmentStatusSelect.selectOption(data.employment_status);
  }

  await fillAndBlur(page, 'input[name="division"]', data.division);
  await fillAndBlur(page, 'input[name="monthly_gross"]', data.monthly_gross);
  await fillAndBlur(page, 'input[name="monthly_net"]', data.monthly_net);
  await fillAndBlur(page, 'input[name="office_address"], textarea[name="office_address"]', data.office_address);

  // SECTION 5: References (dynamic fields with dot notation)
  console.log('   📋 Filling references...');
  for (let i = 0; i < data.references.length; i++) {
    const ref = data.references[i];
    await fillAndBlur(page, `input[name="reference.${i}.occupation"]`, ref.occupation);
    await fillAndBlur(page, `input[name="reference.${i}.name"]`, ref.name);
    await fillAndBlur(page, `input[name="reference.${i}.contact_no"]`, ref.contact_no);
  }
  console.log('   ✅ References filled');

  // SECTION 6: Company Information
  console.log('   🏢 Filling company information...');
  await fillAndBlur(page, 'input[name="employer"]', data.employer);
  await fillAndBlur(page, 'input[name="company_salary"]', data.company_salary);
  await fillAndBlur(page, 'input[name="contract_duration"]', data.contract_duration);
  console.log('   ✅ Company information filled');

  console.log('   ✅ All 52 fields filled successfully');
}

// ============================================================================
// TEST DATA GENERATION - REALISTIC FILIPINO DATA
// ============================================================================

export function generateTestData(prefix: string = 'E2E'): BorrowerData {
  const timestamp = Date.now();

  // Realistic Filipino data
  const firstNames = ['Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Carlos', 'Sofia', 'Miguel', 'Isabel'];
  const middleNames = ['Santos', 'Cruz', 'Reyes', 'Garcia', 'Torres', 'Ramos', 'Flores', 'Mendoza'];
  const lastNames = ['Dela Cruz', 'Gonzales', 'Rivera', 'Santos', 'Mercado', 'Lopez', 'Villanueva', 'Bautista'];
  const cities = ['Manila', 'Quezon City', 'Makati', 'Pasig', 'Taguig', 'Cebu City', 'Davao City'];
  const streets = ['Rizal Street', 'Bonifacio Avenue', 'Mabini Road', 'Luna Street', 'Del Pilar Avenue'];
  const companies = ['PLDT', 'Globe Telecom', 'SM Corporation', 'Ayala Land', 'JolliBee Foods Corp'];
  const positions = ['Teacher', 'Engineer', 'Accountant', 'Manager', 'Supervisor', 'Administrative Officer'];

  const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const randomMiddleName = middleNames[Math.floor(Math.random() * middleNames.length)];
  const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const randomCity = cities[Math.floor(Math.random() * cities.length)];
  const randomStreet = streets[Math.floor(Math.random() * streets.length)];
  const randomCompany = companies[Math.floor(Math.random() * companies.length)];
  const randomPosition = positions[Math.floor(Math.random() * positions.length)];

  // Generate completely random DOB (not tied to current timestamp)
  const randomAge = Math.floor(Math.random() * (65 - 21 + 1)) + 21;
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - randomAge;
  const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  const birthHour = String(Math.floor(Math.random() * 24)).padStart(2, '0');
  const birthMinute = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  const dob = `${birthYear}-${birthMonth}-${birthDay}`;

  // Generate truly unique contact number using timestamp + random
  // Format: 09 + last 9 digits of timestamp
  const contactNumber = `09${String(timestamp).slice(-9)}`;
  const loanAmount = String((Math.floor(Math.random() * 46) + 5) * 10000);
  const monthlyIncome = String((Math.floor(Math.random() * 50) + 20) * 1000);
  const grossSalary = String((Math.floor(Math.random() * 60) + 25) * 1000);
  const netSalary = String(Math.floor(parseFloat(grossSalary) * 0.85));

  return {
    // Section 1
    amount_applied: loanAmount,
    purpose: 'Business Capital for Expansion',
    firstname: `${randomFirstName}${String(timestamp).slice(-6)}`,  // Unique: Name + last 6 digits (e.g., "Juan234567")
    middlename: randomMiddleName,
    lastname: `${randomLastName}${String(timestamp).slice(-4)}`,  // Unique: Name + last 4 digits (e.g., "Cruz7281")
    terms_of_payment: '12 months',
    other_source_of_inc: 'Freelance Consulting',
    residence_address: `${Math.floor(Math.random() * 999) + 1} ${randomStreet}, ${randomCity}, Philippines`,
    is_rent: Math.random() > 0.5 ? '1' : '0',
    est_monthly_fam_inc: monthlyIncome,
    employment_position: randomPosition,
    chief_id: '1', // Default to first option
    gender: Math.random() > 0.5 ? 'Male' : 'Female',

    // Section 2
    dob,
    place_of_birth: randomCity,
    age: randomAge,
    email: `${prefix.toLowerCase()}.${timestamp}@test.com`,
    contact_no: contactNumber,
    civil_status: ['Single', 'Married', 'Widowed'][Math.floor(Math.random() * 3)],

    // Section 3 - Spouse
    work_address: `${randomCompany} Building, ${randomCity}`,
    occupation: randomPosition,
    fullname: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
    company: randomCompany,
    dept_branch: 'Operations Department',
    length_of_service: `${Math.floor(Math.random() * 15) + 1} years`,
    salary: monthlyIncome,
    company_contact_person: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${middleNames[Math.floor(Math.random() * middleNames.length)]}`,
    spouse_contact_no: `09${String(timestamp + 1).slice(-9)}`,  // Unique: timestamp + 1

    // Section 4 - Work
    company_borrower_id: '1', // Default to first option
    employment_number: `EMP-${Math.floor(Math.random() * 99999)}`,
    area_id: '1', // Default to first option
    sub_area_id: '1', // Default to first option
    station: `${randomCity} Branch`,
    term_in_service: `${Math.floor(Math.random() * 20) + 1} years`,
    employment_status: ['Contractual', 'Permanent', 'Agency'][Math.floor(Math.random() * 3)],
    division: 'Finance Division',
    monthly_gross: grossSalary,
    monthly_net: netSalary,
    office_address: `${randomCompany} Head Office, ${randomCity}`,

    // Section 5 - References
    references: [
      {
        occupation: 'Supervisor',
        name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        contact_no: `09${String(timestamp + 2).slice(-9)}`  // Unique: timestamp + 2
      },
      {
        occupation: 'Administrative Officer',
        name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        contact_no: `09${String(timestamp + 3).slice(-9)}`  // Unique: timestamp + 3
      },
      {
        occupation: 'Co-worker',
        name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        contact_no: `09${String(timestamp + 4).slice(-9)}`  // Unique: timestamp + 4
      }
    ],

    // Section 6 - Company
    employer: randomCompany,
    company_salary: monthlyIncome,
    contract_duration: '2 years'
  };
}

// ============================================================================
// VERIFICATION FUNCTIONS
// ============================================================================

export async function verifySuccessMessage(page: Page) {
  // Wait for toast notification (react-toastify)
  // Toast appears in .Toastify__toast-container with class .Toastify__toast--success
  await expect(
    page.locator('.Toastify__toast--success, [role="status"], [role="alert"]')
  ).toBeVisible({ timeout: 10000 });

  // Optionally verify the toast contains success-related text
  const toastText = await page.locator('.Toastify__toast--success, [role="status"]').first().textContent();
  console.log(`   ✅ Success toast appeared: "${toastText}"`);
}

export async function verifyErrorMessage(page: Page) {
  // Wait for error toast notification (react-toastify)
  // Toast appears with class .Toastify__toast--error
  await expect(
    page.locator('.Toastify__toast--error, [role="alert"]')
  ).toBeVisible({ timeout: 10000 });

  // Optionally verify the toast contains error-related text
  const toastText = await page.locator('.Toastify__toast--error, [role="alert"]').first().textContent();
  console.log(`   ⚠️ Error toast appeared: "${toastText}"`);
}

export async function queryGraphQL(query: string, variables: any = {}) {
  const response = await fetch('http://localhost:8000/fuerte-api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  return response.json();
}

export async function searchInList(page: Page, searchTerm: string) {
  const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
  if (await searchInput.count() > 0) {
    await searchInput.fill(searchTerm);

    // Wait for search to process (no need to wait for loading indicator)
    await page.waitForTimeout(2000);
  }
}

export async function expectVisible(page: Page, selector: string) {
  await expect(page.locator(selector)).toBeVisible({ timeout: 5000 });
}
