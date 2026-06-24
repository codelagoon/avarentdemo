import { test, expect } from "@playwright/test"

test.describe("identity gate", () => {
  test("unauthenticated visitors see the login screen", async ({ page }) => {
    await page.goto("/")

    await expect(page.getByTestId("login-screen")).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId("password-input")).toBeVisible()
  })
})
