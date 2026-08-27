import { test, expect } from "@playwright/test"

test.describe("E2E: User Profile & Gamification Stats", () => {
  test("should render own profile redirect handler", async ({ page }) => {
    const response = await page.goto("/profile/me")
    expect(response?.status()).toBeLessThan(500)
  })
})
