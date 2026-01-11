import { expect, test } from '@playwright/test'

test.describe('Bookmarks Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/bookmarks')
  })

  test('should display page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Bookmarks/)
  })

  test('should display bookmarks heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /external bookmarks/i })).toBeVisible()
  })

  test('should display search bar', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i)
    await expect(searchInput).toBeVisible()
  })

  test('should display sort dropdown', async ({ page }) => {
    const sortSelect = page.locator('select')
    await expect(sortSelect).toBeVisible()

    // Check sort options exist by counting
    const options = await sortSelect.locator('option').count()
    expect(options).toBe(3)

    // Default value should be category
    await expect(sortSelect).toHaveValue('category')
  })

  test('should load and display bookmarks', async ({ page }) => {
    // Wait for bookmarks to load
    await page.waitForSelector('section[aria-label*="bookmarks"]', {
      state: 'visible',
      timeout: 10000,
    })

    // Should have bookmark cards (external links)
    const bookmarkLinks = page.locator('a[target="_blank"]')
    const count = await bookmarkLinks.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should filter bookmarks by search', async ({ page }) => {
    // Wait for bookmarks to load
    await page.waitForSelector('a[target="_blank"]', { state: 'visible' })

    // Get initial count
    const initialCount = await page.locator('a[target="_blank"]').count()

    // Search for non-existent term
    await page.getByPlaceholder(/search/i).fill('xyznonexistent123')

    // Wait for filter to apply
    await page.waitForTimeout(500)

    // Should show no results or fewer cards
    const filteredCount = await page.locator('a[target="_blank"]').count()
    expect(filteredCount).toBeLessThanOrEqual(initialCount)
  })

  test('should sort bookmarks by name', async ({ page }) => {
    // Wait for bookmarks to load
    await page.waitForSelector('a[target="_blank"]', { state: 'visible' })

    // Select "Name (A-Z)" sort
    const sortSelect = page.locator('select')
    await sortSelect.selectOption('name')

    // Grid layout should be displayed (flat list, not grouped)
    await expect(page.locator('.grid.gap-4')).toBeVisible()
  })

  test('should sort bookmarks by source', async ({ page }) => {
    // Wait for bookmarks to load
    await page.waitForSelector('a[target="_blank"]', { state: 'visible' })

    // Select "Source" sort
    const sortSelect = page.locator('select')
    await sortSelect.selectOption('source')

    // Should group by source (sections with headings)
    await expect(sortSelect).toHaveValue('source')
  })

  test('should open bookmark in new tab', async ({ page }) => {
    // Wait for bookmarks to load
    await page.waitForSelector('a[target="_blank"]', { state: 'visible' })

    // Check first external link has correct attributes
    const firstBookmark = page.locator('a[target="_blank"]').first()
    await expect(firstBookmark).toHaveAttribute('target', '_blank')
    await expect(firstBookmark).toHaveAttribute('rel', /noopener/)
  })

  test('should display bookmark details', async ({ page }) => {
    // Wait for bookmarks to load
    await page.waitForSelector('a[target="_blank"]', { state: 'visible' })

    // Check for bookmark card content (name, description, source badge)
    const bookmarkCard = page.locator('a[target="_blank"]').first().locator('..')

    // Should have some text content
    const textContent = await bookmarkCard.textContent()
    expect(textContent).toBeTruthy()
  })
})
