import { test, expect } from "@playwright/test"

test.describe("E2E: Student Marketplace", () => {
  test("should render marketplace listings page", async ({ page }) => {
    await page.goto("/marketplace")
    await expect(page).toHaveURL(/.*marketplace/)
    await expect(page.locator("body")).toBeVisible()
  })
})
