import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Fuerte E2E Tests
 *
 * This configuration runs complete end-to-end tests that validate:
 * - Frontend UI (Next.js) - Forms, buttons, navigation
 * - Backend API (Laravel GraphQL) - Mutations, queries
 * - Database (MySQL) - Data persistence
 *
 * Prerequisites:
 * - Frontend running: npm run dev (http://localhost:3000)
 * - Backend running: php artisan serve (http://localhost:8000)
 * - Database: MySQL with fuerte database
 */

export default defineConfig({
  // Where test files are located
  testDir: './tests/e2e',

  // Maximum time one test can run (60 seconds)
  timeout: 60 * 1000,

  // Run tests sequentially (not parallel)
  // Why: Tests depend on each other (borrowers → loans → payments)
  fullyParallel: false,

  // Fail build if test.only is accidentally left in code
  forbidOnly: !!process.env.CI,

  // Retry failed tests (only in CI environment)
  retries: process.env.CI ? 2 : 0,

  // Number of worker processes (1 = run tests one at a time)
  workers: 1,

  // Test report format
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'] // Shows progress in terminal
  ],

  // Shared settings for all tests
  use: {
    // Base URL for your application
    baseURL: 'http://localhost:3000',

    // Collect trace when test fails (for debugging)
    trace: 'on-first-retry',

    // Take screenshot when test fails
    screenshot: 'only-on-failure',

    // Record video when test fails
    video: 'retain-on-failure',

    // Browser viewport size
    viewport: { width: 1280, height: 720 },
  },

  // Browser configuration
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Browser runs in headed mode (visible) by default
        // Set headless: true to run in background
        headless: false,
      },
    },
  ],

  // Web Server Configuration
  // Uncomment if you want Playwright to auto-start your servers
  // webServer: [
  //   {
  //     command: 'npm run dev',
  //     url: 'http://localhost:3000',
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 120 * 1000,
  //   },
  // ],
});
