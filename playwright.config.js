// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('node:path');

// Safe conditional check for dotenv execution
try {
  require('dotenv').config({ path: path.resolve(__dirname, '.env') });
} catch (e) {
  // Silent fallback if dotenv is missing globally
}

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // Runs profiles sequentially to avoid account lockouts
  reporter: process.env.CI ? 'list' : 'html',
  use: {
    headless: !!process.env.CI,
    browserName: 'chromium',
    launchOptions: {
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'
      ],
      ignoreDefaultArgs: ['--enable-automation']
    },
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
