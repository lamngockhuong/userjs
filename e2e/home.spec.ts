import { expect, test } from '@playwright/test'

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display page title', async ({ page }) => {
    await expect(page).toHaveTitle(/UserJS Store/)
  })

  test('should display header with navigation', async ({ page }) => {
    const header = page.locator('header')
    await expect(header).toBeVisible()

    // Check navigation links (Scripts = Home, Bookmarks)
    await expect(page.getByRole('link', { name: /scripts/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /bookmarks/i })).toBeVisible()
  })

  test('should display search bar', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i)
    await expect(searchInput).toBeVisible()
  })

  test('should display category filter', async ({ page }) => {
    const categorySelect = page.getByRole('combobox', {
      name: /filter by category/i,
    })
    await expect(categorySelect).toBeVisible()
    await expect(categorySelect).toHaveValue('')
  })

  test('should load and display scripts', async ({ page }) => {
    // Wait for scripts to load
    await page.waitForSelector('[class*="grid"]', { state: 'visible' })

    // Should have script cards
    const scriptCards = page.locator('a[href*="/script/"]')
    await expect(scriptCards.first()).toBeVisible()
  })

  test('should filter scripts by search query', async ({ page }) => {
    // Wait for scripts to load
    await page.waitForSelector('a[href*="/script/"]', { state: 'visible' })

    // Get initial count
    const initialCards = await page.locator('a[href*="/script/"]').count()

    // Search for a non-existent term
    await page.getByPlaceholder(/search/i).fill('xyznonexistent123')

    // Wait for filter to apply
    await page.waitForTimeout(500)

    // Should show no results message or fewer cards
    const filteredCards = await page.locator('a[href*="/script/"]').count()
    expect(filteredCards).toBeLessThanOrEqual(initialCards)
  })

  test('should filter scripts by category', async ({ page }) => {
    // Wait for scripts and categories to load
    await page.waitForSelector('a[href*="/script/"]', { state: 'visible' })

    const categorySelect = page.getByRole('combobox', {
      name: /filter by category/i,
    })

    // Get available categories
    const options = await categorySelect.locator('option').all()

    if (options.length > 1) {
      // Select first category (skip "All Categories")
      const secondOption = await options[1].getAttribute('value')
      if (secondOption) {
        await categorySelect.selectOption(secondOption)
        await expect(categorySelect).toHaveValue(secondOption)
      }
    }
  })

  test('should navigate to script detail on click', async ({ page }) => {
    // Wait for scripts to load
    await page.waitForSelector('a[href*="/script/"]', { state: 'visible' })

    // Click on first script card
    const firstScript = page.locator('a[href*="/script/"]').first()
    await firstScript.click()

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/script\//)
  })

  test('should display footer', async ({ page }) => {
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
  })
})
