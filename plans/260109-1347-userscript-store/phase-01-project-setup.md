# Phase 01: Project Setup

## Context

- Parent: [plan.md](./plan.md)
- Brainstorm: [brainstorm report](../reports/brainstorm-260109-1347-userscript-store.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-09 |
| Priority | P1 |
| Effort | 1h |
| Status | done |
| Review | approved (8.5/10) |

Initialize Vue 3 + Vite project with Tailwind CSS, Vue Router, and TypeScript.

## Key Insights

- Use Vite's vue-ts template for fast setup
- Hash-based routing for GitHub Pages compatibility
- Tailwind CSS for rapid UI development

## Requirements

- Vue 3 with Composition API
- TypeScript strict mode
- Tailwind CSS with dark mode (class strategy)
- Vue Router with hash mode
- Lucide Vue icons

## Implementation Steps

### 1. Initialize Vite Project

```bash
pnpm create vite@7.3.1 . -- --template vue-ts
pnpm install
```

### 2. Install Dependencies (exact versions, no ^)

```bash
# Runtime dependencies
pnpm add vue-router@4.6.4 @vueuse/core@14.1.0 fuse.js@7.1.0 lucide-vue-next@0.562.0 shiki@3.0.0

# Dev dependencies - Tailwind CSS v4 (CSS-first config)
pnpm add -D tailwindcss@4.1.18 @tailwindcss/vite@4.1.18
```

### 3. Configure Tailwind CSS v4

Tailwind v4 uses CSS-first configuration. Update `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
```

Create `src/assets/main.css`:
```css
@import "tailwindcss";

/* Custom fonts */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

/* Theme configuration (Tailwind v4 CSS-first) */
@theme {
  --font-sans: 'IBM Plex Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

/* Dark mode variant */
@variant dark (&:where(.dark, .dark *));
```

### 3.1 Add Google Fonts (backup in index.html)

`index.html` (in `<head>`):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

### 4. Configure Vue Router

`src/router/index.ts`:
```ts
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: () => import('../pages/Home.vue') },
    { path: '/script/:category/:name', component: () => import('../pages/ScriptDetail.vue') },
    { path: '/bookmarks', component: () => import('../pages/Bookmarks.vue') },
  ]
})
```

### 5. Setup Directory Structure

```
src/
├── App.vue
├── main.ts
├── router/index.ts
├── components/
├── pages/
│   ├── Home.vue
│   ├── ScriptDetail.vue
│   └── Bookmarks.vue
├── composables/
├── types/
│   └── script.ts
└── assets/
    └── main.css
```

### 6. Create Base Types

`src/types/script.ts`:
```ts
export interface Script {
  name: string
  version: string
  description: string
  author: string
  category: string
  filename: string
  matches: string[]
  installUrl: string
  sourceUrl: string
}

export interface Bookmark {
  name: string
  url: string
  description: string
  category: string
}
```

## Todo List

- [x] Run vite create command
- [x] Install all dependencies
- [x] Configure tailwind.config.js (Tailwind v4 CSS-first in main.css)
- [x] Setup vue-router with hash mode
- [x] Create directory structure
- [x] Create base TypeScript types
- [x] Verify dev server runs

## Success Criteria

- [x] `pnpm dev` starts without errors
- [x] Vue Router navigates between routes
- [x] Tailwind classes apply correctly
- [x] Dark mode class toggle works
- [x] TypeScript compiles without errors

## Code Review

**Date:** 2026-01-09
**Score:** 8.5/10
**Report:** [code-reviewer-260109-1436-phase01-setup.md](../reports/code-reviewer-260109-1436-phase01-setup.md)

**Summary:** Strong foundation with TypeScript strict mode, Tailwind v4 CSS-first config, Vue 3 Composition API best practices. Minor improvements needed for route type safety, CSP headers, and accessibility.

**High Priority Actions:**
- Add route param type safety and validation
- Plan CSP headers for Phase 06 deployment
- Add error boundaries to main.ts

**Status:** All Phase 01 requirements completed successfully. Safe to proceed to Phase 02.

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Dependency conflicts | Low | Use exact versions |

## Next Steps

Proceed to Phase 02: Build Scripts
