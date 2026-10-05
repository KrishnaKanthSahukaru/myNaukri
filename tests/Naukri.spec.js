// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const credentialsPath = path.resolve(
  __dirname,
  '..',
  process.env.NAUKRI_CREDENTIALS_FILE || 'credentials.json'
);

if (!fs.existsSync(credentialsPath)) {
  throw new Error(`Credentials file not found: ${credentialsPath}`);
}

let profiles;
try {
  profiles = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
} catch {
  throw new Error(`Credentials file is not valid JSON: ${credentialsPath}`);
}

if (!Array.isArray(profiles) || profiles.length !== 2) {
  throw new Error('credentials.json must contain exactly two profile objects.');
}

for (const [index, profile] of profiles.entries()) {
  if (
    !profile ||
    typeof profile.email !== 'string' ||
    !profile.email.trim() ||
    typeof profile.password !== 'string' ||
    !profile.password
  ) {
    throw new Error(`Profile ${index + 1} needs a non-empty email and password.`);
  }
}

const resumeHeadline =
  'Immediate Joiner, Results-driven QA Lead with expertise in API automation, UI Automation (Playwright with JavaScript) and Manual testing with experience in handling multiple QA team members';

async function updateProfile(page, profile) {
  await page.goto(
    'https://www.naukri.com/nlogin/login?URL=https://www.naukri.com/mnjuser/homepage'
  );
  await page.getByRole('link', { name: 'Login', exact: true }).click();

  await page.getByRole('textbox', { name: 'Enter Email ID / Username' }).fill(profile.email);
  await page.getByRole('textbox', { name: 'Enter Password' }).fill(profile.password);
  await page.getByRole('button', { name: 'Login', exact: true }).click();

  const viewProfileLink = page.getByRole('link', { name: 'View profile' });
  await expect(viewProfileLink).toBeVisible({ timeout: 60000 });
  await viewProfileLink.click();

  await page.getByRole('button', { name: 'Resume headline', exact: true }).click();
  await page.getByRole('button', { name: 'Edit resume headline' }).click();
  const headlineTextbox = page.getByRole('textbox', { name: 'Resume headline' });
  await headlineTextbox.fill(resumeHeadline);
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  await page.goto('https://www.naukri.com/mnjuser/profile');
  await page.getByRole('button', { name: 'Open profile menu' }).click();
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
}

test('update Naukri profile 1', async ({ page }) => {
  await updateProfile(page, profiles[0]);
});

test('update Naukri profile 2', async ({ page }) => {
  await updateProfile(page, profiles[1]);
});
