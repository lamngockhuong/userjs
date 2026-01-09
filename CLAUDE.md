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
│   └── useUserscriptManager.ts  # Banner dismiss state management
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
├── robots.txt        # SEO: crawling rules
├── sitemap.xml       # SEO: sitemap
├── og-image.png      # SEO: Open Graph image (1200x630)
└── CNAME             # Custom domain config
```

## Key Patterns

### Adding Userscripts

1. Add `.user.js` files to `scripts/<category>/`
2. Optionally add `.md` file with same name for documentation (e.g., `hello-world.md` for `hello-world.user.js`)
3. Run `pnpm build` or `pnpm generate-index`
4. Metadata parsed from userscript headers automatically
5. Readme markdown is rendered on script detail page if available

### Composables Pattern

All data fetching and state management uses Vue 3 composables:

- `useScripts()` - Returns `{ scripts, categories, loading, error }`
- `useBookmarks()` - Returns `{ bookmarks, loading, error }`
- `useSearch(items, keys)` - Returns `{ query, results }` with Fuse.js

### Routing

Vue Router with hash mode (`/#/path`) for GitHub Pages compatibility:

- `/` - Home (script listing) → `UserJS Store | Khuong Dev`
- `/script/:category/:filename` - Script detail → `{Script Name} - UserJS Store | Khuong Dev`
- `/bookmarks` - External links → `Bookmarks - UserJS Store | Khuong Dev`

Page titles are managed via `router.afterEach` hook and route meta.

## Tech Stack

- Vue 3.5 (Composition API)
- Vite 7
- TypeScript (strict mode with noUncheckedIndexedAccess)
- Tailwind CSS v4
- Vue Router 4 (hash mode)
- Fuse.js (fuzzy search)
- Shiki (syntax highlighting)
- Lucide Vue Next (icons)

## SEO

- Meta tags in `index.html`: description, keywords, author, canonical, Open Graph, Twitter Cards
- `robots.txt` + `sitemap.xml` for search engines
- Hash routing (`/#/`) limits per-page SEO; detail pages not individually indexed

## Deployment

GitHub Actions auto-deploys to GitHub Pages on push to main. See `.github/workflows/deploy.yml`.
