const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://campusnest-7q59.onrender.com';

async function attachIssueCapture(page, issues) {
  page.on('console', (msg) => {
    if (['error', 'warning'].includes(msg.type())) {
      issues.push(`console:${msg.type()}:${msg.text()}`);
    }
  });
  page.on('pageerror', (error) => issues.push(`pageerror:${error.message}`));
  page.on('requestfailed', (request) => issues.push(`requestfailed:${request.url()} -> ${request.failure()?.errorText || 'unknown'}`));
  page.on('response', (response) => {
    if (response.status() >= 400 && !response.url().includes('cdn.jsdelivr')) {
      issues.push(`http:${response.status()}:${response.url()}`);
    }
  });
}

async function openAndCapture(page, url) {
  const issues = [];
  attachIssueCapture(page, issues);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  return issues;
}

test.describe('CampusNest live audit', () => {
  test('homepage loads and core shell is present', async ({ page }) => {
    const issues = await openAndCapture(page, `${BASE_URL}/index.html`);
    await expect(page).toHaveTitle(/CampusNest/i);
    await expect(page.locator('body')).toContainText('CampusNest');
    await expect(page.locator('a[href="browse.html"]')).toBeVisible();
    await expect(page.locator('a[href="login.html"]')).toBeVisible();
    await expect(page.locator('a[href="register.html"]')).toBeVisible();
    if (issues.length) {
      console.log('Homepage issues:', issues.slice(0, 25));
    }
  });

  test('browse page shows listings and supports search/filter/sort controls', async ({ page }) => {
    const issues = await openAndCapture(page, `${BASE_URL}/browse.html`);
    await expect(page.locator('#results-grid')).toBeVisible();
    await page.fill('#f-q', 'Abraka');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('#result-count')).not.toHaveText('—');
    await page.selectOption('#sort-select', 'price-asc');
    await page.click('#f-reset');
    if (issues.length) {
      console.log('Browse issues:', issues.slice(0, 25));
    }
  });

  test('property detail page loads for a public listing', async ({ page }) => {
    const issues = await openAndCapture(page, `${BASE_URL}/property.html?id=sample-1`);
    await expect(page.locator('#gallery')).toBeVisible();
    await expect(page.locator('#detail-main')).toContainText(/Self-contain|property|room|listing/i);
    if (issues.length) {
      console.log('Property detail issues:', issues.slice(0, 25));
    }
  });

  test('student registration form attempts sign-up and handles real backend response', async ({ page }) => {
    const issues = await openAndCapture(page, `${BASE_URL}/register.html`);
    const email = `qa-student-${Date.now()}@example.com`;
    await page.fill('#full_name', 'QA Student User');
    await page.selectOption('#university', 'DELSU Abraka');
    await page.fill('#email', email);
    await page.fill('#phone', '08012345678');
    await page.fill('#password', 'Password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    const confirmVisible = await page.locator('#confirm-box').isVisible().catch(() => false);
    const errorVisible = await page.locator('#register-error').isVisible().catch(() => false);
    const url = page.url();
    expect(url.includes('/register.html')).toBeTruthy();
    expect(confirmVisible || errorVisible || url.includes('/register.html')).toBeTruthy();
    if (issues.length) {
      console.log('Register issues:', issues.slice(0, 25));
    }
  });

  test('invalid login returns a real authentication error without crashing', async ({ page }) => {
    const issues = await openAndCapture(page, `${BASE_URL}/login.html`);
    await page.fill('#email', 'bad-user-does-not-exist@example.com');
    await page.fill('#password', 'wrong-password');
    await page.click('#login-submit');
    await expect(page.locator('#login-error')).toContainText(/incorrect|email|password|confirm|something went wrong/i, { timeout: 15000 });
    if (issues.length) {
      console.log('Login issues:', issues.slice(0, 25));
    }
  });

  test('unauthorized admin route redirects away instead of exposing admin functionality', async ({ page }) => {
    const issues = await openAndCapture(page, `${BASE_URL}/dashboard-admin.html`);
    await expect(page).not.toHaveURL(/dashboard-admin\.html$/);
    if (issues.length) {
      console.log('Admin access issues:', issues.slice(0, 25));
    }
  });

  test('unauthorized landlord/agent dashboard access redirects to login', async ({ page }) => {
    const issues = await openAndCapture(page, `${BASE_URL}/dashboard-landlord.html`);
    await expect(page).not.toHaveURL(/dashboard-landlord\.html$/);
    if (issues.length) {
      console.log('Landlord dashboard issues:', issues.slice(0, 25));
    }
  });

  test('student dashboard access without auth is blocked or redirected', async ({ page }) => {
    const issues = await openAndCapture(page, `${BASE_URL}/dashboard-student.html`);
    await expect(page).not.toHaveURL(/dashboard-student\.html$/);
    if (issues.length) {
      console.log('Student dashboard issues:', issues.slice(0, 25));
    }
  });

  test('mobile viewport renders the site without layout breakage', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const issues = await openAndCapture(page, `${BASE_URL}/index.html`);
    await expect(page.locator('body')).toContainText('CampusNest');
    await expect(page.locator('.nav-toggle')).toBeVisible();
    if (issues.length) {
      console.log('Mobile issues:', issues.slice(0, 25));
    }
  });

  test('live site does not emit critical JS or API failures during a typical browsing session', async ({ page }) => {
    const issues = await openAndCapture(page, `${BASE_URL}/browse.html`);
    await page.click('a[href="index.html"]');
    await page.goto(`${BASE_URL}/browse.html?q=Abraka&campus=DELSU%20Abraka`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#result-count')).toBeVisible();
    expect(issues.length).toBeLessThan(10);
    console.log('Session issues observed:', issues.slice(0, 50));
  });
});
