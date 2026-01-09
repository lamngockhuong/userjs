# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

UserJS Store - A personal userscript hosting platform built with Vue 3 and Vite. Deployed at https://userjs.khuong.dev

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (auto-generates scripts-index.json)
pnpm build            # Type-check + build for production
pnpm type-check       # TypeScript validation only
pnpm generate-index   # Regenerate public/scripts-index.json from scripts/
```

## Architecture

```bash
src/
├── components/       # Reusable UI components
│   ├── Header.vue, Footer.vue
│   ├── SearchBar.vue, ScriptCard.vue, BookmarkCard.vue
│   └── InstallBanner.vue
├── composables/      # Vue composition functions
│   ├── useScripts.ts      # Fetch scripts from scripts-index.json
│   ├── useBookmarks.ts    # Fetch bookmarks from scripts-index.json
│   ├── useSearch.ts       # Fuse.js fuzzy search with debounce
│   ├── useDarkMode.ts     # Theme toggle with localStorage
│   ├── useKeyboardShortcuts.ts  # Global keyboard shortcuts
│   └── useUserscriptManager.ts  # Detect Tampermonkey/Violentmonkey
├── pages/            # Route components
│   ├── Home.vue, Bookmarks.vue
│   ├── ScriptDetail.vue, NotFound.vue
├── router/index.ts   # Vue Router with hash mode
├── types/script.ts   # TypeScript interfaces
└── main.ts           # App entry point

build/
└── generate-index.ts # Build script: parses .user.js metadata + BOOKMARKS.md

public/
├── scripts/          # Userscript files organized by category
│   └── <category>/<name>.user.js
├── scripts-index.json  # Auto-generated index (do not edit manually)
└── CNAME             # Custom domain config
```

## Key Patterns

### Adding Userscripts

1. Add `.user.js` files to `public/scripts/<category>/`
2. Run `pnpm build` or `pnpm generate-index`
3. Metadata parsed from userscript headers automatically

### Composables Pattern

All data fetching and state management uses Vue 3 composables:

- `useScripts()` - Returns `{ scripts, categories, loading, error }`
- `useBookmarks()` - Returns `{ bookmarks, loading, error }`
- `useSearch(items, keys)` - Returns `{ query, results }` with Fuse.js

### Routing

Vue Router with hash mode (`/#/path`) for GitHub Pages compatibility:

- `/` - Home (script listing)
- `/script/:category/:filename` - Script detail with code preview
- `/bookmarks` - External links collection

## Tech Stack

- Vue 3.5 (Composition API)
- Vite 7
- TypeScript (strict mode with noUncheckedIndexedAccess)
- Tailwind CSS v4
- Vue Router 4 (hash mode)
- Fuse.js (fuzzy search)
- Shiki (syntax highlighting)
- Lucide Vue Next (icons)

## Deployment

GitHub Actions auto-deploys to GitHub Pages on push to main. See `.github/workflows/deploy.yml`.
