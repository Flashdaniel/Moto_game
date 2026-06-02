const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');

  // Wait for scene to init
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({ path: 'verify_fix_1.png' });

  // Check for any JS errors in console
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  // Click Race Start
  await page.click('button.btn');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'verify_fix_2_racing.png' });

  await browser.close();
})();
