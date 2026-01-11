# Code Standards: UserJS Vue Userscript Manager

## General Principles

- Follow Vue 3 Composition API best practices
- Use TypeScript for type safety
- Prioritize readability and maintainability
- Keep components and composables focused and single-responsibility

## Naming Conventions

- Components: PascalCase (e.g., `ScriptCard`)
- Composables: camelCase with 'use' prefix (e.g., `useScripts`)
- Props: camelCase
- Events: kebab-case
- CSS classes: kebab-case

## Composable Design

- Return reactive or computed values
- Handle error states explicitly
- Provide clear type definitions
- Minimize side effects
- Use `ref()` and `reactive()` appropriately

## Component Structure

- Use `<script setup>` syntax
- Define props with `defineProps()`
- Use `defineEmits()` for event emissions
- Keep template logic minimal
- Extract complex logic to composables

## Error Handling

- Provide user-friendly error messages
- Log errors for debugging
- Implement fallback states
- Use try/catch in async operations

## Accessibility

- Follow WCAG 2.1 guidelines
- Use semantic HTML
- Provide proper aria attributes
- Ensure keyboard navigation
- Support color contrast requirements

## Performance

- Use `v-once` for static content
- Implement lazy loading
- Minimize re-renders
- Use `computed` and `watch` efficiently

## Linting & Formatting

- **Biome** for TypeScript/JavaScript/Vue/JSON linting and formatting
- **Prettier** for Markdown files only
- Run `pnpm lint` to check, `pnpm lint:fix` to auto-fix
- Run `pnpm format` to format all files

### Biome Configuration

- Indent: 2 spaces
- Quotes: single
- Semicolons: as needed
- Import organization: enabled
- Excluded: dist, css, md, userscripts, scripts-index.json

### Prettier Configuration

- Prose wrap: always
- Print width: 100
- Only processes: `**/*.md` (except BOOKMARKS.md)

## E2E Testing

### Overview

- **Framework**: Playwright
- **Test location**: `e2e/` directory
- **Config**: `playwright.config.ts`

### Running Tests

```bash
pnpm test:e2e          # Run all tests (headless)
pnpm test:e2e:ui       # Interactive UI mode
pnpm test:e2e:headed   # Run with visible browser
pnpm test:e2e:report   # View HTML report
```

### Running Specific Browser

```bash
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox
pnpm test:e2e --project=webkit
```

### Test Structure

```
e2e/
├── home.spec.ts          # Home page tests
├── script-detail.spec.ts # Script detail page tests
├── bookmarks.spec.ts     # Bookmarks page tests
├── navigation.spec.ts    # Routing & keyboard shortcuts
└── dark-mode.spec.ts     # Theme toggle tests
```

### Writing Tests

```typescript
import { expect, test } from "@playwright/test";

test.describe("Feature", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should do something", async ({ page }) => {
    await expect(page.locator("h1")).toBeVisible();
  });
});
```

### CI Integration

E2E tests can be triggered manually via GitHub Actions:

1. Go to **Actions** → **E2E Tests**
2. Click **Run workflow**
3. Select browser (chromium/firefox/webkit)
4. Test report uploaded as artifact (7-day retention)
