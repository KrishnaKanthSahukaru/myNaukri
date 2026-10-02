const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    locale: 'en-US',
    timezoneId: 'Asia/Kolkata'
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined, configurable: true });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4], configurable: true });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'], configurable: true });
    Object.defineProperty(window, 'chrome', { value: { runtime: {} }, configurable: true });
  });

  const page = await context.newPage();
  const response = await page.goto('https://www.naukri.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('status=', response && response.status());
  console.log('title=', await page.title());
  console.log('url=', page.url());
  await browser.close();
})();
