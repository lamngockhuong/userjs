# Codebase Summary

## Project Structure

```
userjs/
│
├── src/
│   ├── main.ts         # Application Entry Point
│   ├── App.vue         # Root Vue Component
│   ├── router/         # Vue Router Configuration
│   │   └── index.ts
│   │
│   ├── pages/          # Page Components
│   │   ├── Home.vue
│   │   ├── ScriptDetail.vue
│   │   └── Bookmarks.vue
│   │
│   ├── types/          # TypeScript Type Definitions
│   │   └── script.ts
│   │
│   └── assets/         # Static Assets
│       └── main.css
│
├── build/             # Build Process Scripts
│   └── generate-index.ts  # User Script Metadata Generator
│
├── public/            # Public Static Assets
│   ├── scripts-index.json  # Generated Script Index
│   ├── robots.txt          # Search Engine Crawling Rules
│   ├── sitemap.xml         # Sitemap for SEO
│   ├── og-image.png        # Open Graph Image (1200x630)
│   └── og-image.svg        # OG Image Source
│
├── scripts/           # Project Utility Scripts
│   └── general/       # Sample User Scripts
│
├── e2e/               # Playwright E2E Tests
│   ├── home.spec.ts
│   ├── script-detail.spec.ts
│   ├── bookmarks.spec.ts
│   ├── navigation.spec.ts
│   └── dark-mode.spec.ts
│
├── config/            # Configuration Files
│
├── index.html         # HTML Entry Point
├── vite.config.ts     # Vite Build Configuration
└── playwright.config.ts  # Playwright Test Configuration
```

## Key Technical Characteristics

- **Framework**: Vue 3 with Composition API
- **Build Tool**: Vite 7.3.1
- **Language**: TypeScript (Strict Mode)
- **Routing**: Vue Router 4.6.4 (Hash Mode)
- **Styling**: Tailwind CSS v4

## Feature Highlights

- Dark Mode Support
- Accessibility Features
- Error Boundary Implementation
- Responsive Design
- TypeScript Strict Type Checking
- Dynamic User Script Indexing
- SEO Optimized (Open Graph, Twitter Cards, Sitemap)
- Dynamic Page Titles per Route
  - Format: `{Page} - UserJS Store | Khuong Dev`
- Keyboard Navigation Shortcuts
  - `/` for Search
  - `Shift+G` to Home
  - `Shift+B` to Bookmarks
  - `Shift+D` for Dark Mode Toggle
- Four Core Pages
  - Home (Script Listing)
  - ScriptDetail (Code Preview + Optional Markdown Readme)
  - Bookmarks
  - NotFound Error Page
- Optional Markdown Documentation per Script
  - Place `.md` file alongside `.user.js` (same name)
  - Rendered on ScriptDetail page if available
- Enhanced Bookmarks
  - Source badge auto-detection (GreasyFork, OpenUserJS, GitHub)
  - Tags support via `#hashtag` format in BOOKMARKS.md
  - Sort options (Category, Name, Source)
- GitHub API Integration
  - 1-hour cache TTL
- Syntax Highlighting with Shiki
- Full-Text Search Capabilities

## Dependency Highlights

- fuse.js: Fuzzy Search
- lucide-vue-next: Icon Library
- shiki: Syntax Highlighting (fine-grained bundle)
- marked: Markdown Rendering
- tsx: TypeScript Execution

## Dev Dependencies

- @biomejs/biome: Linting & Formatting
- prettier: Markdown Formatting
- @playwright/test: E2E Testing Framework
- playwright: Browser Automation

## Build Scripts

### generate-index.ts

- Parses User Script Metadata from `.user.js` files
- Detects optional `.md` readme files (e.g., `script.md` for `script.user.js`)
- Reads `BOOKMARKS.md` for additional script information
- Generates `public/scripts-index.json` with `readmeUrl` if readme exists
- Security Features:
  - Path Traversal Protection
  - URL Encoding
  - Metadata Size Limit (10KB)
  - URL Validation

### NPM Scripts

- `generate-index`: Manually trigger script indexing
- `predev`: Generates script index before development
- `prebuild`: Generates script index before production build
- `lint`: Check code with Biome
- `lint:fix`: Auto-fix lint issues
- `format:md`: Format markdown files
- `format`: Run lint:fix + format:md
- `test:e2e`: Run Playwright E2E tests
- `test:e2e:ui`: Run tests in interactive UI mode
- `test:e2e:headed`: Run tests with visible browser
- `test:e2e:report`: View HTML test report

## Configuration Specifics

- TypeScript: `noUncheckedIndexedAccess` enabled
- Vue Router: Hash Mode for compatibility
- Tailwind CSS: CSS-first configuration

## Build Optimization

- **Shiki fine-grained bundle**: Only JavaScript lang + github-dark theme loaded
- **Lazy-loaded syntax highlighting**: Shiki loads on-demand when "View Code" clicked
- **Dist size**: ~820KB (optimized from 10MB)
- **Code splitting**: Router-based lazy loading for pages
- **Cache-busting**: Build timestamp injected via Vite `define` and appended to `scripts-index.json`
  fetch URL to bypass CDN/browser cache after deployments
