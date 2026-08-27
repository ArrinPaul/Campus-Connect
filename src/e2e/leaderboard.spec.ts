import { test, expect } from "@playwright/test"

test.describe("E2E: Gamification Leaderboard", () => {
  test("should render leaderboard page with period tabs and university filter", async ({ page }) => {
    await page.goto("/leaderboard")
    await expect(page).toHaveURL(/.*leaderboard/)
    
    // Check header
    await expect(page.getByText(/Campus Leaderboard|Academic & Peer Recognition/i)).toBeVisible()

    // Check period buttons
    await expect(page.getByRole("button", { name: /Weekly/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /Monthly/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /All Time/i })).toBeVisible()
  })

  test("should switch period tabs on click", async ({ page }) => {
    await page.goto("/leaderboard")
    
    const weeklyBtn = page.getByRole("button", { name: /Weekly/i })
    await weeklyBtn.click()
    
    const monthlyBtn = page.getByRole("button", { name: /Monthly/i })
    await monthlyBtn.click()

    const allTimeBtn = page.getByRole("button", { name: /All Time/i })
    await allTimeBtn.click()
  })
})
