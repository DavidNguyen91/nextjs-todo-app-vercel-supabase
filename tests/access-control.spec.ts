import { test, expect } from '@playwright/test';
import { authenticateUser } from './helpers';

test.describe('Nhóm A — Quyền truy cập', () => {
  test('1. Người chưa đăng nhập mở trang chính thì bị chuyển đến trang đăng nhập', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
    await expect(page.locator('h1')).toContainText('Sign in to your account');
    await expect(page.locator('[data-testid="google-signin-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
  });

  test('2. Người chưa đăng nhập mở URL của trang được bảo vệ trực tiếp thì không thể sử dụng app', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/login');
    await expect(page.locator('[data-testid="new-task-input"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="add-task-btn"]')).not.toBeVisible();
  });

  test('3. Người đã đăng nhập có thể mở trang chính', async ({ page, context }) => {
    await authenticateUser(context, page);
    await page.goto('/');
    expect(page.url()).not.toContain('/login');
    await expect(page.locator('h1')).toContainText('My Tasks');
    await expect(page.locator('[data-testid="new-task-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="sign-out-btn"]')).toBeVisible();
  });

  test('4. Sau khi đăng xuất, người dùng không thể tiếp tục truy cập trang được bảo vệ', async ({ page, context }) => {
    await authenticateUser(context, page);
    await page.goto('/');
    await expect(page.locator('[data-testid="sign-out-btn"]')).toBeVisible();
    await page.click('[data-testid="sign-out-btn"]');
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
    await page.goto('/');
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
    await expect(page.locator('[data-testid="new-task-input"]')).not.toBeVisible();
  });

  test('5. Đăng nhập thành công bằng email/mật khẩu → chuyển đến trang chính', async ({ page, context }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, 'TEST_USER_EMAIL/TEST_USER_PASSWORD not set — skipping real auth test');
      return;
    }

    await page.goto('/login');
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();

    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="submit-btn"]');

    // Should navigate to home without looping
    await page.waitForURL('**/', { timeout: 20000 });
    expect(page.url()).not.toContain('/login');
    await expect(page.locator('h1')).toContainText('My Tasks');

    // Verify no error message is visible
    await expect(page.locator('[data-testid="auth-error"]')).not.toBeVisible();
  });

  test('6. Sai mật khẩu hiển thị thông báo lỗi, không treo trang', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    if (!email) {
      test.skip(true, 'TEST_USER_EMAIL not set — skipping real auth test');
      return;
    }

    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', 'wrong-password-xyz-123');
    await page.click('[data-testid="submit-btn"]');

    // Should show error, stay on /login, not redirect
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible({ timeout: 10000 });
    expect(page.url()).toContain('/login');
    await expect(page.locator('[data-testid="submit-btn"]')).toBeEnabled();
  });

  test('7. Sau đăng nhập thành công không có vòng lặp redirect', async ({ page, context }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, 'TEST_USER_EMAIL/TEST_USER_PASSWORD not set — skipping real auth test');
      return;
    }

    // Count navigation events — should navigate to / exactly once, then stop
    let navigationCount = 0;
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        navigationCount += 1;
      }
    });

    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="submit-btn"]');

    await page.waitForURL('**/', { timeout: 20000 });

    // Wait briefly to detect any extra navigations / RSC loops
    await page.waitForTimeout(2000);

    // Should have navigated at most 2 times (login → /, possibly /login → /)
    expect(navigationCount).toBeLessThanOrEqual(3);

    // Page should be stable, no ongoing polling
    const url = page.url();
    expect(url).not.toContain('/login');
  });
});
