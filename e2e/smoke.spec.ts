import { expect, test } from '@playwright/test'

test('landing page renders', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/\| UIPKGE$/)
  await expect(page.getByRole('heading', { level: 1, name: /the platform your team will actually use/i })).toBeVisible()
  await expect(page.locator('main#main-content')).toBeVisible()
})
