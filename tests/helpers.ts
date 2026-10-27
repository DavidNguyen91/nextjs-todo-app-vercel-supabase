import { Page, BrowserContext } from '@playwright/test';

export const TEST_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: process.env.TEST_USER_EMAIL || 'test-runner@example.com',
};

/**
 * Sets an authenticated test session for the browser context.
 * In test mode (PLAYWRIGHT_TEST=1), this cookie is verified by middleware and server components.
 * If actual Supabase credentials (TEST_USER_EMAIL & TEST_USER_PASSWORD) are provided,
 * it can also authenticate via the real Supabase sign-in form.
 */
export async function authenticateUser(context: BrowserContext, page?: Page) {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (email && password && page) {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="submit-btn"]');
    await page.waitForURL('**/', { timeout: 15000 });
    return;
  }

  // Set test session cookie with baseURL URL
  await context.addCookies([
    {
      name: 'e2e_test_session',
      value: JSON.stringify(TEST_USER),
      url: 'http://localhost:3000',
    },
  ]);
}

/**
 * Clears the test session cookie
 */
export async function clearSession(context: BrowserContext) {
  await context.clearCookies();
}
