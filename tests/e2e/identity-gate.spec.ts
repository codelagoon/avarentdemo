import { test, expect } from "@playwright/test"

test.describe("identity gate", () => {
  test("unauthenticated visitors see the login gate", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible()
  })
})
