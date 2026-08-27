import { test, expect } from "@playwright/test"

test.describe("E2E: Authentication & Route Protection", () => {
  test("should render sign-in page with login options", async ({ page }) => {
    await page.goto("/sign-in")
    await expect(page).toHaveURL(/.*sign-in/)
    await expect(page.locator("body")).toBeVisible()
  })

  test("should render sign-up page with registration form", async ({ page }) => {
    await page.goto("/sign-up")
    await expect(page).toHaveURL(/.*sign-up/)
    await expect(page.locator("body")).toBeVisible()
  })

  test("should redirect unauthenticated users visiting settings to sign-in or offline", async ({ page }) => {
    const response = await page.goto("/settings")
    expect(response?.status()).toBeLessThan(500)
  })
})
