import { test, expect } from "@playwright/test"

test.describe("E2E: Direct Messaging", () => {
  test("should render messages page", async ({ page }) => {
    await page.goto("/messages")
    await expect(page).toHaveURL(/.*messages/)
    await expect(page.locator("body")).toBeVisible()
  })
})
