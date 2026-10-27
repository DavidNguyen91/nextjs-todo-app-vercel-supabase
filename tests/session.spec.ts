import { test, expect } from '@playwright/test';
import { authenticateUser } from './helpers';

test.describe('Nhóm C — Session', () => {
  test('1. Kiểm tra session được giữ khi tải lại trang', async ({ page, context }) => {
    // Authenticate session
    await authenticateUser(context, page);

    // Open main app
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('My Tasks');
    await expect(page.locator('[data-testid="user-pill"]')).toBeVisible();

    // Reload the page multiple times
    await page.reload();
    expect(page.url()).not.toContain('/login');
    await expect(page.locator('h1')).toContainText('My Tasks');
    await expect(page.locator('[data-testid="user-pill"]')).toBeVisible();

    await page.reload();
    expect(page.url()).not.toContain('/login');
    await expect(page.locator('h1')).toContainText('My Tasks');
  });

  test('2. Kiểm tra đăng xuất kết thúc quyền truy cập vào các trang được bảo vệ', async ({ page, context }) => {
    // Authenticate and open main app
    await authenticateUser(context, page);
    await page.goto('/');
    await expect(page.locator('[data-testid="sign-out-btn"]')).toBeVisible();

    // Perform sign out
    await page.click('[data-testid="sign-out-btn"]');

    // Confirm redirected to /login
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');

    // Verify test session cookie (if any) is invalidated
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === 'e2e_test_session');
    expect(sessionCookie).toBeUndefined();

    // Attempting to re-open protected page must redirect back to /login
    await page.goto('/');
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });
});
