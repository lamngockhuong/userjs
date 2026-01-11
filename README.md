<p align="center">
  <img src="public/og-image.svg" alt="UserJS Store" width="400">
</p>

<h1 align="center">UserJS Store</h1>

<p align="center">
  <a href="https://github.com/lamngockhuong/userjs/actions/workflows/ci.yml"><img src="https://github.com/lamngockhuong/userjs/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/lamngockhuong/userjs/actions/workflows/deploy.yml"><img src="https://github.com/lamngockhuong/userjs/actions/workflows/deploy.yml/badge.svg" alt="Deploy"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://vuejs.org/"><img src="https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js&logoColor=white" alt="Vue"></a>
  <a href="https://userjs.khuong.dev"><img src="https://img.shields.io/website?url=https%3A%2F%2Fuserjs.khuong.dev" alt="Website"></a>
</p>

<p align="center">
  A personal userscript hosting platform built with Vue 3 and Vite.<br>
  <a href="https://userjs.khuong.dev"><strong>Live Site »</strong></a>
</p>

## Preview

### Home Page

| Light Mode                                | Dark Mode                               |
| ----------------------------------------- | --------------------------------------- |
| ![Home Light](docs/images/home-light.png) | ![Home Dark](docs/images/home-dark.png) |

### Script Detail

| Code Preview                                 | Documentation                                 |
| -------------------------------------------- | --------------------------------------------- |
| ![Code Preview](docs/images/script-code.png) | ![Documentation](docs/images/script-docs.png) |

### Bookmarks

![Bookmarks](docs/images/bookmarks.png)

## Features

- Browse and install userscripts
- Fuzzy search with Fuse.js
- Category filtering
- Script version history from GitHub commits
- Syntax-highlighted code preview with Shiki
- External bookmarks collection
- Dark mode support
- Dynamic page titles per route
- Keyboard shortcuts (/, Shift+G, Shift+B, Shift+D)

## Tech Stack

- Vue 3 (Composition API)
- Vite 7
- TypeScript
- Tailwind CSS v4
- Vue Router (hash mode)
- Fuse.js (fuzzy search)
- Shiki (syntax highlighting)
- Biome (linting)
- Prettier (markdown formatting)

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Type check
pnpm type-check

# Lint code
pnpm lint

# Auto-fix lint issues
pnpm lint:fix

# Format all files
pnpm format
```

## Adding Scripts

1. Add `.user.js` files to `scripts/<category>/`
2. Optionally add `.md` file with same name for documentation
3. Run `pnpm build` to regenerate the index
4. Scripts are auto-indexed with metadata from userscript headers

## License

MIT
