import { test, expect } from "@playwright/test"

test.describe("E2E: Research Papers & Peer Reviews", () => {
  test("should render research papers browser page", async ({ page }) => {
    await page.goto("/research")
    await expect(page).toHaveURL(/.*research/)
    await expect(page.locator("body")).toBeVisible()
  })
})
