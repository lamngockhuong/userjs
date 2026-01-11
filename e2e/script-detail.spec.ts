import { expect, test } from '@playwright/test'

test.describe('Script Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home first
    await page.goto('/')

    // Wait for scripts to load and click first one
    await page.waitForSelector('a[href*="/script/"]', { state: 'visible' })
    await page.locator('a[href*="/script/"]').first().click()

    // Wait for detail page to load
    await page.waitForURL(/\/script\//)
  })

  test('should display script information', async ({ page }) => {
    // Wait for article to load
    await page.waitForSelector('article', { state: 'visible' })

    // Check for main content elements
    await expect(page.locator('h1').first()).toBeVisible()

    // Version badge (format: vX.X.X)
    await expect(page.locator('span:has-text("v")')).toBeVisible()
  })

  test('should have back to scripts link', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /back to scripts/i })
    await expect(backLink).toBeVisible()

    await backLink.click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('should display install button', async ({ page }) => {
    // Wait for script detail to load
    await page.waitForSelector('article', { state: 'visible' })

    const installButton = page.locator('a:has-text("Install")')
    await expect(installButton).toBeVisible()

    // Should have correct href (ending with .user.js)
    const href = await installButton.getAttribute('href')
    expect(href).toMatch(/\.user\.js$/)
  })

  test('should toggle code preview', async ({ page }) => {
    // Find and click View Code button
    const viewCodeButton = page.getByRole('button', { name: /view code/i })
    await expect(viewCodeButton).toBeVisible()

    await viewCodeButton.click()

    // Wait for code to load
    await page.waitForSelector('[aria-label="Source code preview"]', {
      state: 'visible',
      timeout: 10000,
    })

    // Code preview should be visible
    const codePreview = page.locator('[aria-label="Source code preview"]')
    await expect(codePreview).toBeVisible()

    // Button text should change to "Hide Code"
    await expect(page.getByRole('button', { name: /hide code/i })).toBeVisible()

    // Click again to hide
    await page.getByRole('button', { name: /hide code/i }).click()

    // Code preview should be hidden
    await expect(codePreview).not.toBeVisible()
  })

  test('should copy code to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    // Open code preview
    await page.getByRole('button', { name: /view code/i }).click()

    // Wait for code to load
    await page.waitForSelector('[aria-label="Source code preview"]', {
      state: 'visible',
      timeout: 10000,
    })

    // Click copy button
    const copyButton = page.getByRole('button', { name: /copy/i })
    await expect(copyButton).toBeVisible()
    await copyButton.click()

    // Should show "Copied!" feedback
    await expect(page.getByText('Copied!')).toBeVisible()
  })

  test('should display GitHub link', async ({ page }) => {
    // Wait for script detail to load
    await page.waitForSelector('article', { state: 'visible' })

    // Use more specific selector for the GitHub button in article
    const githubLink = page.locator('article a:has-text("GitHub")').first()
    await expect(githubLink).toBeVisible()

    const href = await githubLink.getAttribute('href')
    expect(href).toMatch(/github\.com/)
  })

  test('should display version history section', async ({ page }) => {
    const historySection = page.locator('[aria-label="Version history"]')
    await expect(historySection).toBeVisible()

    await expect(page.getByText('Version History')).toBeVisible()
  })

  test('should handle non-existent script', async ({ page }) => {
    // Navigate to non-existent script
    await page.goto('/#/script/fake-category/fake-script.user.js')

    // Should show not found message
    await expect(page.getByText(/script not found/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /back to home/i })).toBeVisible()
  })
})
