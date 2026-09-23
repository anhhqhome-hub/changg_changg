import { expect, test } from "@playwright/test";

test("public pages render", async ({ page }) => {
  await page.goto("/vi/login");
  await expect(page.getByRole("heading", { name: "Đăng nhập" })).toBeVisible();

  await page.goto("/vi/register");
  await expect(page.getByRole("heading", { name: "Đăng ký học viên" })).toBeVisible();
  await expect(page.getByLabel("Trường học")).toBeVisible();
});
