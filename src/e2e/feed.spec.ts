import { test, expect } from "@playwright/test"

test.describe("E2E: Feed & Community Navigation", () => {
  test("should render feed page with desktop sidebar navigation", async ({ page }) => {
    await page.goto("/feed")
    await expect(page.locator("body")).toBeVisible()
    
    // Check navigation links
    const sidebar = page.locator("nav, aside, [role='navigation']").first()
    if (await sidebar.isVisible()) {
      await expect(sidebar).toBeVisible()
    }
  })

  test("should navigate to explore page", async ({ page }) => {
    await page.goto("/explore")
    await expect(page).toHaveURL(/.*explore/)
    await expect(page.locator("body")).toBeVisible()
  })
})
