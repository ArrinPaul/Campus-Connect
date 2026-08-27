import { test, expect } from "@playwright/test"

test.describe("E2E: Notification Center", () => {
  test("should render notifications page", async ({ page }) => {
    await page.goto("/notifications")
    await expect(page).toHaveURL(/.*notifications/)
    await expect(page.locator("body")).toBeVisible()
  })
})
