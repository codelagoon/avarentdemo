import { test, expect } from "@playwright/test"

test.describe("identity gate", () => {
  test("unauthenticated visitors are sent to sign-in", async ({ page }) => {
    await page.goto("/")

    const workosRedirect = page.getByText(/redirecting to sign in/i)
    const legacyLogin = page.getByRole("button", { name: /sign in/i })

    await expect(workosRedirect.or(legacyLogin)).toBeVisible({ timeout: 10_000 })
  })
})
