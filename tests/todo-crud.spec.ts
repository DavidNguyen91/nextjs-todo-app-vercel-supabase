import { test, expect } from '@playwright/test';
import { authenticateUser } from './helpers';
import { e2eTitle } from './helpers/cleanup';


test.describe('Nhóm B — Chức năng To-Do', () => {
  test.beforeEach(async ({ page, context }) => {
    await authenticateUser(context, page);
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('My Tasks');
  });

  test('1. Người đã đăng nhập tạo được task và hiển thị trên giao diện', async ({ page }) => {
    const taskTitle = e2eTitle(`New Test Task ${Date.now()}`);

    // Fill task title and click Add
    await page.fill('[data-testid="new-task-input"]', taskTitle);
    await page.click('[data-testid="add-task-btn"]');

    // The newly created task should be visible in the list
    const taskItem = page.locator('[data-testid="task-item"]', { hasText: taskTitle });
    await expect(taskItem).toBeVisible();

    // Input field should be reset
    await expect(page.locator('[data-testid="new-task-input"]')).toHaveValue('');
  });

  test('2. Người dùng sửa được task (inline edit)', async ({ page }) => {
    const originalTitle = e2eTitle(`Task to edit ${Date.now()}`);
    const updatedTitle = e2eTitle(`Task edited ${Date.now()}`);

    // Create a task to edit
    await page.fill('[data-testid="new-task-input"]', originalTitle);
    await page.click('[data-testid="add-task-btn"]');

    const taskItem = page.locator('[data-testid="task-item"]', { hasText: originalTitle });
    await expect(taskItem).toBeVisible();

    // Hover to reveal action buttons and click Edit icon (or double-click title)
    await taskItem.hover();
    await taskItem.locator('[data-testid="task-edit-btn"]').click({ force: true });

    // Edit input should be visible with current text
    const editInput = page.locator('[data-testid="task-edit-input"]');
    await expect(editInput).toBeVisible();
    await editInput.fill(updatedTitle);

    // Save changes
    await page.locator('[data-testid="task-save-btn"]').click();

    // Verify updated title is rendered
    await expect(page.locator('[data-testid="task-item"]', { hasText: updatedTitle })).toBeVisible();
    await expect(page.locator('[data-testid="task-item"]', { hasText: originalTitle })).not.toBeVisible();
  });

  test('3. Người dùng đánh dấu hoàn thành và bỏ hoàn thành task', async ({ page }) => {
    const taskTitle = e2eTitle(`Completion test task ${Date.now()}`);

    // Create task
    await page.fill('[data-testid="new-task-input"]', taskTitle);
    await page.click('[data-testid="add-task-btn"]');

    const taskItem = page.locator('[data-testid="task-item"]', { hasText: taskTitle });
    await expect(taskItem).toBeVisible();

    const checkbox = taskItem.locator('[data-testid="task-checkbox"]');
    const checkboxLabel = taskItem.locator('[data-testid="task-checkbox-label"]');
    await expect(checkbox).not.toBeChecked();

    // Click checkbox label to complete task
    await checkboxLabel.click();
    await expect(checkbox).toBeChecked();

    // Title should have completed styles (line-through)
    const titleSpan = taskItem.locator('[data-testid="task-title"]');
    await expect(titleSpan).toHaveCSS('text-decoration-line', 'line-through');

    // Click label again to uncheck and mark incomplete
    await checkboxLabel.click();
    await expect(checkbox).not.toBeChecked();
  });

  test('4. Task vẫn tồn tại sau khi tải lại trang (persistence)', async ({ page }) => {
      const persistentTitle = e2eTitle(`Persistent task ${Date.now()}`); 

    // Create task
    await page.fill('[data-testid="new-task-input"]', persistentTitle);
    await page.click('[data-testid="add-task-btn"]');

    await expect(page.locator('[data-testid="task-item"]', { hasText: persistentTitle })).toBeVisible();

    // Reload the page
    await page.reload();

    // Verify task is still present after reload
    await expect(page.locator('[data-testid="task-item"]', { hasText: persistentTitle })).toBeVisible();
  });

  test('5. Người dùng xóa được task', async ({ page }) => {
    const taskToDelete = e2eTitle(`Task to delete ${Date.now()}`);

    // Create task
    await page.fill('[data-testid="new-task-input"]', taskToDelete);
    await page.click('[data-testid="add-task-btn"]');

    const taskItem = page.locator('[data-testid="task-item"]', { hasText: taskToDelete });
    await expect(taskItem).toBeVisible();

    // Hover and click delete icon
    await taskItem.hover();
    await taskItem.locator('[data-testid="task-delete-btn"]').click({ force: true });

    // Task should be removed from view
    await expect(page.locator('[data-testid="task-item"]', { hasText: taskToDelete })).not.toBeVisible();
  });
});
