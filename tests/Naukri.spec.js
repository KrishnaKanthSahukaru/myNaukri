// @ts-check
const { test } = require('@playwright/test');
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
  test(`update Naukri profile ${index + 1}`, async ({ page }) => {
    const profile = getProfile(index);

    await page.goto('https://www.naukri.com/nlogin/login?URL=https://www.naukri.com/mnjuser/homepage');
    if (await page.getByRole('heading', { name: /access denied/i }).isVisible().catch(() => false)) {
      throw new Error('Naukri returned Access Denied to the automation request.');
    }
    await page.getByRole('textbox', { name: 'Enter Email ID / Username' }).fill(profile.email);
    await page.getByRole('textbox', { name: 'Enter Password' }).fill(profile.password);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await page.getByRole('button', { name: 'Open profile menu' }).click();
    await page.getByRole('link', { name: 'View & Update Profile' }).click();
    await page.locator('#lazyResumeHead').getByText('editOneTheme').click();
    await page.getByRole('button', { name: 'Save' }).click();
  });
}