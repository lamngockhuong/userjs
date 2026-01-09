# UserJS Store

A personal userscript hosting platform built with Vue 3 and Vite.

**Live Site:** https://userjs.khuong.dev

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
```

## Adding Scripts

1. Add `.user.js` files to `public/scripts/<category>/`
2. Run `pnpm build` to regenerate the index
3. Scripts are auto-indexed with metadata from userscript headers

## License

MIT
