import { test, expect, Page } from "@playwright/test";
import { authenticateUser } from "./helpers";
import { e2eTitle } from "./helpers/cleanup";

test.beforeEach(async ({ page, context }) => {
  await authenticateUser(context, page);
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("My Tasks");
  await page.waitForLoadState("networkidle");
});

const item = (page: Page, text: string) =>
  page.getByTestId("task-item").filter({ hasText: text });

async function addTask(page: Page, title: string) {
  await page.getByTestId("new-task-input").fill(title);
  await page.getByTestId("add-task-btn").click();
  await expect(item(page, title)).toBeVisible();
}

test("vòng đời task: tạo → sửa → hoàn thành → lưu bền → xóa", async ({
  page,
  browser,
}) => {
  const id = Date.now();
  const title = e2eTitle(`Lifecycle ${id}`);
  const edited = e2eTitle(`Lifecycle edited ${id}`);

  await test.step("tạo", async () => {
    await addTask(page, title);
    await expect(page.getByTestId("new-task-input")).toHaveValue("");
  });

  await test.step("sửa", async () => {
    await item(page, title).getByTestId("task-edit-btn").click(); // không hover, không force
    await page.getByTestId("task-edit-input").fill(edited);
    await page.getByTestId("task-save-btn").click();
    await expect(item(page, edited)).toBeVisible();
    await expect(item(page, title)).toHaveCount(0);
  });

  await test.step("hoàn thành và bỏ hoàn thành", async () => {
    const row = item(page, edited);
    await row.getByTestId("task-checkbox-label").click();
    await expect(row.getByTestId("task-checkbox")).toBeChecked();
    await expect(row.getByTestId("task-title")).toHaveCSS(
      "text-decoration-line",
      "line-through",
    );
    await row.getByTestId("task-checkbox-label").click();
    await expect(row.getByTestId("task-checkbox")).not.toBeChecked();
  });

  await test.step("dữ liệu nằm ở database: đăng nhập lại ở context mới vẫn thấy", async () => {
    const ctx = await browser.newContext();
    const page2 = await ctx.newPage();
    await authenticateUser(ctx, page2);
    await page2.goto("/");
    await expect(item(page2, edited)).toBeVisible();
    await ctx.close();
  });

  await test.step("xóa, và reload vẫn không còn", async () => {
    await item(page, edited).getByTestId("task-delete-btn").click();
    await expect(item(page, edited)).toHaveCount(0);
    await page.reload();
    await expect(item(page, edited)).toHaveCount(0);
  });
});

const inputCases: {
  name: string;
  created: boolean;
  build: (stamp: string) => string;
}[] = [
  { name: "rỗng", created: false, build: () => "" },
  { name: "chỉ khoảng trắng", created: false, build: () => "   " },
  {
    name: "emoji và unicode",
    created: true,
    build: (s) => e2eTitle(`${s} Mua sữa 🥛 ☕`),
  },
  {
    name: "HTML không bị thực thi (XSS)",
    created: true,
    build: (s) =>
      e2eTitle(`${s} <b>x</b> <img src=x onerror="window.__xss=1">`),
  },
  {
    name: "tiêu đề rất dài",
    created: true,
    build: (s) => e2eTitle(`${s} ${"A".repeat(300)}`),
  },
];

for (const c of inputCases) {
  test(`nhập liệu: ${c.name}`, async ({ page }) => {
    const stamp = `T${Date.now()}`; // duy nhất cho mỗi lần chạy, tránh trùng với dữ liệu cũ
    const title = c.build(stamp);
    const items = page.getByTestId("task-item");
    const input = page.getByTestId("new-task-input");
    const addBtn = page.getByTestId("add-task-btn");
    const before = await items.count();

    await input.fill(title);

    if (!c.created) {
      // Đầu vào không hợp lệ: nút Add bị chặn, và Enter cũng không tạo task
      await expect(addBtn).toBeDisabled();
      await input.press("Enter");
      await expect(items).toHaveCount(before);
      return;
    }

    await addBtn.click();

    // Tìm theo stamp, không phụ thuộc nội dung có bị cắt ngắn hay không
    await expect(item(page, stamp)).toHaveCount(1);

    expect(
      await page.evaluate(
        () => (window as unknown as { __xss?: number }).__xss,
      ),
    ).toBeUndefined();
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);

    // Lưu bền: sau khi tải lại, task vẫn còn đúng 1 bản
    await page.reload();
    await expect(item(page, stamp)).toHaveCount(1);
  });
}

test("bộ lọc All/Active/Completed và xóa task đã hoàn thành", async ({
  page,
}) => {
  const id = Date.now();
  const active = e2eTitle(`Active ${id}`);
  const done = e2eTitle(`Done ${id}`);
  await addTask(page, active);
  await addTask(page, done);
  await item(page, done).getByTestId("task-checkbox-label").click();

  await page.getByTestId("filter-active").click();
  await expect(item(page, active)).toBeVisible();
  await expect(item(page, done)).toHaveCount(0);

  await page.getByTestId("filter-completed").click();
  await expect(item(page, done)).toBeVisible();
  await expect(item(page, active)).toHaveCount(0);

  await page.getByTestId("filter-all").click();
  await expect(item(page, active)).toBeVisible();
  await expect(item(page, done)).toBeVisible();

  // nút chỉ xuất hiện khi có task đã hoàn thành
  await page.getByTestId("clear-completed-btn").click();
  await expect(item(page, done)).toHaveCount(0);
  await expect(item(page, active)).toBeVisible();
});

test("nút Clear completed ẩn khi không có task nào hoàn thành", async ({
  page,
}) => {
  // Dọn trước để chắc chắn không còn task hoàn thành nào từ test khác
  if (await page.getByTestId("clear-completed-btn").isVisible()) {
    await page.getByTestId("clear-completed-btn").click();
  }
  await expect(page.getByTestId("clear-completed-btn")).toHaveCount(0);
});
