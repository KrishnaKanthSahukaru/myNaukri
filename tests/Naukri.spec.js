// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const credentialsPath = path.resolve(process.env.NAUKRI_CREDENTIALS_FILE || 'credentials.json');

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

    const response = await page.goto('https://www.naukri.com/nlogin/login?URL=https://www.naukri.com/mnjuser/homepage', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    if (response && response.status() === 403) {
      throw new Error('Naukri returned HTTP 403: the site is blocking automated browser access.');
    }

    const emailInput = page.locator('input[type="email"], input[name*="email" i], input[placeholder*="Email" i], input[aria-label*="Email" i]').first();
    const passwordInput = page.locator('input[type="password"], input[name*="password" i], input[placeholder*="Password" i], input[aria-label*="Password" i]').first();

    await expect(emailInput).toBeVisible({ timeout: 30000 });
    await emailInput.fill(profile.email);

    await expect(passwordInput).toBeVisible({ timeout: 30000 });
    await passwordInput.fill(profile.password);

    const loginButton = page.locator('button:has-text("Login"), input[type="submit"][value*="Login" i]').first();
    await expect(loginButton).toBeVisible({ timeout: 30000 });
    await loginButton.click();

    const profileMenuButton = page.locator('button:has-text("Open profile menu"), button[aria-label*="profile" i]').first();
    await expect(profileMenuButton).toBeVisible({ timeout: 60000 });
    await profileMenuButton.click();

    const profileLink = page.locator('a:has-text("View & Update Profile"), a:has-text("View and Update Profile")').first();
    await expect(profileLink).toBeVisible({ timeout: 30000 });
    await profileLink.click();

    await page.waitForLoadState('networkidle');

    const editButton = page.locator('#lazyResumeHead, [data-testid="resume-head"], [id*="resume"]').getByText(/editOneTheme|Edit/i).first();
    await expect(editButton).toBeVisible({ timeout: 60000 });
    await editButton.click();

    const saveButton = page.locator('button:has-text("Save")').last();
    await expect(saveButton).toBeVisible({ timeout: 30000 });
    await saveButton.click();

    await context.close();
  });
}