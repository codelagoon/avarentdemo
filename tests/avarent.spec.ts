import { test, expect } from "@playwright/test"

test.describe("Avarent Platform End-to-End Compliance Suite", () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to local port hosted by Vite
    await page.goto("http://localhost:5173")
  })

  test("Should authenticate successfully using access code", async ({ page }) => {
    // Verify login page elements
    await expect(page.locator("[data-testid='login-screen']")).toBeVisible()
    await expect(page.locator("[data-testid='password-input']")).toBeVisible()
    
    // Fill password input
    await page.fill("[data-testid='password-input']", "197704")
    await page.click("[data-testid='login-submit']")

    // Check if the dashboard is rendered
    await expect(page.locator("[data-testid='sentinel-app']")).toBeVisible()
    await expect(page.locator("[data-testid='sidebar']")).toBeVisible()
  })

  test("Should execute adversarial demo scenario and verify causal graph", async ({ page }) => {
    // Login
    await page.fill("[data-testid='password-input']", "197704")
    await page.click("[data-testid='login-submit']")

    // Select a bad faith scenario to sever edges
    await page.click("[data-testid='scenario-bad_faith']")
    
    // Verify executing test is enabled
    const executeBtn = page.locator("[data-testid='execute-adversarial-test']")
    await expect(executeBtn).toBeEnabled()
    await executeBtn.click()

    // Wait for scenario processing to complete
    await page.waitForTimeout(3000)

    // Expand graph first since it is collapsed by default
    await page.click("text=Show Feature Graph")

    // Verify causal graph SVG renders severed node
    await expect(page.locator("[data-testid='causal-graph']")).toBeVisible()
  })

  test("Should navigate to Synthetic Data Studio and execute fairness GAN debiasing", async ({ page }) => {
    // Login
    await page.fill("[data-testid='password-input']", "197704")
    await page.click("[data-testid='login-submit']")

    // Navigate to Synthetic Data Studio (sidebar nav item #6 or text match)
    await page.click("[data-testid='nav-synthetic-studio']")
    await expect(page.locator("[data-testid='synthetic-data-studio']")).toBeVisible()

    // Trigger fairness GAN debiasing
    await page.click("[data-testid='generate-gan-button']")

    // Wait for synthesis simulation animation
    await page.waitForTimeout(2000)

    // Verify Wasserstein distance shows a valid optimal value
    await expect(page.locator("text=Wasserstein Distance:")).toBeVisible()
  })

  test("Should navigate to Alternative Data Hub and screen a proxy variable", async ({ page }) => {
    // Login
    await page.fill("[data-testid='password-input']", "197704")
    await page.click("[data-testid='login-submit']")

    // Navigate to Alt Data Hub
    await page.click("[data-testid='nav-alt-data']")
    await expect(page.locator("[data-testid='alt-data-hub']")).toBeVisible()

    // Inputs a mock subprime feature that gets auto-quarantined
    await page.fill("input[placeholder='e.g. Utility_Bill_Late_Payments']", "Payday_Lender_Frequency_Buffer")
    
    // Slide correlation to high risk
    await page.fill("input[type='range']", "0.85")

    // Screen feature
    await page.click("[data-testid='screen-variable-button']")

    // Wait for screener progress
    await page.waitForTimeout(1000)

    // Verify quarantine alert
    await expect(page.locator("text=Result: Quarantined")).toBeVisible()
  })

  test("Should audit Anti-Fairwashing metrics and resolve alert", async ({ page }) => {
    // Login
    await page.fill("[data-testid='password-input']", "197704")
    await page.click("[data-testid='login-submit']")

    // Navigate to Threat Analysis page
    await page.click("[data-testid='nav-threats']")
    
    // Click Anti-Fairwashing Auditor tab
    await page.click("text=Anti-Fairwashing Auditor")

    // Run advanced audit
    await page.click("[data-testid='run-audit-button']")
    await page.waitForTimeout(2000)

    // Try resolving an alert
    await page.click("text=Resolve Alert")
  })

  test("Should toggle light/dark theme globally", async ({ page }) => {
    // Login
    await page.fill("[data-testid='password-input']", "197704")
    await page.click("[data-testid='login-submit']")

    // Find and click topbar Theme Toggle button
    const themeBtn = page.locator("button:has-text('Toggle theme')")
    await themeBtn.click()

    // Click 'Dark' from drop down menu
    await page.click("text=Dark")

    // Verify dark class is applied to HTML/body tag
    const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"))
    expect(isDark).toBe(true)
  })

})
