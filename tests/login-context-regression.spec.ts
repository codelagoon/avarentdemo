import { test, expect } from "@playwright/test"

test.describe("Login context regression", () => {
  test("loads the login screen without auth 500s and supports demo onboarding", async ({ page }) => {
    // Regression: ISSUE-001 — login bootstrap surfaced auth 500s on first load
    // Found by /qa on 2026-06-24
    // Report: .gstack/qa-reports/qa-report-avarentdemo-2026-06-24.md
    const failures: Array<{ status: number; url: string }> = []
    page.on("response", (res) => {
      if (res.status() >= 500) {
        failures.push({ status: res.status(), url: res.url() })
      }
    })

    await page.goto("/")
    await expect(page.getByTestId("login-screen")).toBeVisible()
    await expect(page.getByTestId("password-input")).toBeVisible()

    await page.getByPlaceholder("you@example.com").fill("test@example.com")
    await page.getByTestId("password-input").fill("197704")
    await page.getByTestId("login-submit").click()

    await expect(page.getByRole("button", { name: "Register New Company" })).toBeVisible()
    await page.getByRole("button", { name: "Register New Company" }).click()

    await expect(page.getByText("Step 1 of 5")).toBeVisible()
    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible()
    expect(failures).toEqual([])
  })
})
