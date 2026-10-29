import { test, expect } from "@playwright/test";
import { authenticateUser } from "./helpers";

const email = process.env.TEST_USER_EMAIL!;
const password = process.env.TEST_USER_PASSWORD!;

test("chưa đăng nhập → bị chuyển tới /login, không thấy giao diện task", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForURL("**/login");
  await expect(page.locator("h1")).toContainText("Sign in to your account");
  for (const id of ["google-signin-btn", "email-input", "password-input"]) {
    await expect(page.getByTestId(id)).toBeVisible();
  }
  await expect(page.getByTestId("new-task-input")).toHaveCount(0);
});

test("đăng nhập đúng → vào trang chính, không lỗi, không vòng lặp redirect", async ({
  page,
}) => {
  let navigations = 0;
  page.on("framenavigated", (f) => {
    if (f === page.mainFrame()) navigations++;
  });

  await page.goto("/login");
  await page.getByTestId("email-input").fill(email);
  await page.getByTestId("password-input").fill(password);
  await page.getByTestId("submit-btn").click();

  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 20_000,
  });
  await expect(page.locator("h1")).toContainText("My Tasks");
  await expect(page.getByTestId("auth-error")).toHaveCount(0);

  const settled = navigations;
  await page.waitForLoadState("networkidle");
  expect(navigations).toBe(settled); // không có điều hướng thừa sau khi đã vào trang chính
});

test("sai mật khẩu → báo lỗi, vẫn ở /login, nút bấm lại được", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByTestId("email-input").fill(email);
  await page.getByTestId("password-input").fill("wrong-password-xyz-123");
  await page.getByTestId("submit-btn").click();

  await expect(page.getByTestId("auth-error")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByTestId("submit-btn")).toBeEnabled();
});

test("session: giữ qua reload, đăng xuất chặn lại trang được bảo vệ", async ({
  page,
  context,
}) => {
  await authenticateUser(context, page);
  await page.goto("/");
  await expect(page.getByTestId("user-pill")).toBeVisible();

  await page.reload();
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.getByTestId("user-pill")).toBeVisible();

  await page.getByTestId("sign-out-btn").click();
  await page.waitForURL("**/login");

  const authCookies = (await context.cookies()).filter(
    (c) => c.name.startsWith("sb-") && c.name.includes("auth-token"),
  );
  expect(authCookies).toHaveLength(0);

  await page.goto("/");
  await page.waitForURL("**/login");
});

// Chạy riêng trên bản production: BASE_URL=https://... npx playwright test --grep @smoke
test("trang đăng nhập tải được, không lỗi console @smoke", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  await page.goto("/");
  await page.waitForURL("**/login");
  await expect(page.getByTestId("email-input")).toBeVisible();
  expect(errors).toEqual([]);
});
