import { expect, test } from '@playwright/test'

test.describe('Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/')

    // Navigate to bookmarks
    await page.getByRole('link', { name: /bookmarks/i }).click()
    await expect(page).toHaveURL(/\/bookmarks/)
    await expect(page).toHaveTitle(/Bookmarks/)

    // Navigate back to home (Scripts link)
    await page.getByRole('link', { name: /scripts/i }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page).toHaveTitle(/UserJS Store/)
  })

  test('should handle direct URL navigation', async ({ page }) => {
    // Direct navigation to bookmarks
    await page.goto('/#/bookmarks')
    await expect(page).toHaveURL(/\/bookmarks/)

    // Direct navigation to home
    await page.goto('/')
    await expect(page).toHaveURL(/\/$/)
  })

  test('should handle 404 page', async ({ page }) => {
    await page.goto('/#/non-existent-page')

    // Should show not found page
    await expect(page.getByText(/not found/i)).toBeVisible()
  })

  test('should preserve URL hash for routing', async ({ page }) => {
    await page.goto('/')

    // Vue Router uses hash mode
    await page.getByRole('link', { name: /bookmarks/i }).click()

    // URL should contain hash
    const url = page.url()
    expect(url).toContain('#')
  })
})

test.describe('Keyboard Shortcuts', () => {
  test('should focus search with / key', async ({ page }) => {
    await page.goto('/')

    // Wait for page to load
    await page.waitForSelector('input[placeholder*="Search"]', { state: 'visible' })

    // Press / key
    await page.keyboard.press('/')

    // Search input should be focused
    const searchInput = page.getByPlaceholder(/search/i)
    await expect(searchInput).toBeFocused()
  })

  test('should navigate to bookmarks with Shift+B', async ({ page }) => {
    await page.goto('/')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Press Shift+B
    await page.keyboard.press('Shift+B')

    // Should navigate to bookmarks
    await expect(page).toHaveURL(/\/bookmarks/)
  })

  test('should toggle dark mode with Shift+D', async ({ page }) => {
    await page.goto('/')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Get initial theme state
    const html = page.locator('html')
    const initialClass = await html.getAttribute('class')

    // Press Shift+D
    await page.keyboard.press('Shift+D')

    // Theme should change
    const newClass = await html.getAttribute('class')

    // Either dark was added or removed
    if (initialClass?.includes('dark')) {
      expect(newClass).not.toContain('dark')
    } else {
      expect(newClass).toContain('dark')
    }
  })
})
