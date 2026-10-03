// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const credentialsPath = path.resolve(process.env.NAUKRI_CREDENTIALS_FILE || 'credentials.json');
const resumeHeadline = 'Immediate Joiner, Results-driven QA Lead with expertise in API automation, UI Automation (Playwright with JavaScript) and Manual testing with experience in handling multiple QA team members';

function getProfile(index) {
  if (!fs.existsSync(credentialsPath)) {
    throw new Error(`Missing ${credentialsPath}. Provide credentials.json locally or set the CI secret.`);
  }

  const profiles = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  if (!Array.isArray(profiles) || profiles.length !== 2) {
    throw new Error('credentials.json must contain exactly two profile objects.');
  }

  const profile = profiles[index];
  if (!profile || typeof profile.email !== 'string' || typeof profile.password !== 'string') {
    throw new Error(`Profile ${index + 1} needs an email and password in credentials.json.`);
  }

  return profile;
}

for (const index of [0, 1]) {
  test(`update Naukri profile ${index + 1}`, async ({ browser }) => {
    const profile = getProfile(index);
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      locale: 'en-US',
      timezoneId: 'Asia/Kolkata',
      permissions: ['geolocation'],
    });

    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined, configurable: true });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'], configurable: true });
      Object.defineProperty(navigator, 'platform', { get: () => 'Win32', configurable: true });
      Object.defineProperty(window, 'chrome', { value: { runtime: {} }, configurable: true });
    });

    const page = await context.newPage();

    const response = await page.goto('https://www.naukri.com/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    if ((response && response.status() === 403) || (await page.getByRole('heading', { name: /access denied/i }).isVisible().catch(() => false))) {
      throw new Error('Naukri returned Access Denied to the automation request.');
    }

    await page.getByRole('link', { name: 'Login', exact: true }).click();
    await page.getByRole('textbox', { name: 'Email ID / Username' }).fill(profile.email);
    const passwordInput = page.getByRole('textbox', { name: 'Password' });
    await passwordInput.fill(profile.password);
    await passwordInput.press('Enter');

    const profileLink = page.getByRole('link', { name: 'View profile', exact: true });
    await expect(profileLink).toBeVisible({ timeout: 60000 });
    await profileLink.click();

    await page.getByRole('button', { name: 'Resume headline', exact: true }).click();
    await page.getByRole('button', { name: 'Edit resume headline' }).click();

    const headlineInput = page.getByRole('textbox', { name: 'Resume headline' });
    await expect(headlineInput).toBeVisible({ timeout: 30000 });
    const currentHeadline = (await headlineInput.inputValue()).trim();
    const nextHeadline = currentHeadline === resumeHeadline
      ? `${resumeHeadline}.`
      : resumeHeadline;
    await headlineInput.fill(nextHeadline);

    await page.getByRole('button', { name: 'Save', exact: true }).click();

    await expect(page.getByText(nextHeadline, { exact: true })).toBeVisible({ timeout: 30000 });
    await context.close();
  });
}