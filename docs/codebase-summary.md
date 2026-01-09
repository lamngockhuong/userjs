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
│   └── scripts-index.json  # Generated Script Index
│
├── scripts/           # Project Utility Scripts
│   └── general/       # Sample User Scripts
│
├── config/            # Configuration Files
│
├── index.html        # HTML Entry Point
└── vite.config.ts    # Vite Build Configuration
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
- Dynamic Page Titles per Route
  - Format: `{Page} - UserJS Store | Khuong Dev`
- Keyboard Navigation Shortcuts
  - `/` for Search
  - `Shift+G` to Home
  - `Shift+B` to Bookmarks
  - `Shift+D` for Dark Mode Toggle
- Four Core Pages
  - Home (Script Listing)
  - ScriptDetail (Code Preview)
  - Bookmarks
  - NotFound Error Page
- GitHub API Integration
  - 1-hour cache TTL
- Syntax Highlighting with Shiki
- Full-Text Search Capabilities

## Dependency Highlights
- @vueuse/core: Utility Composables
- fuse.js: Fuzzy Search
- lucide-vue-next: Icon Library
- shiki: Syntax Highlighting
- tsx: TypeScript Execution

## Build Scripts
### generate-index.ts
- Parses User Script Metadata from `.user.js` files
- Reads `BOOKMARKS.md` for additional script information
- Generates `public/scripts-index.json`
- Security Features:
  - Path Traversal Protection
  - URL Encoding
  - Metadata Size Limit (10KB)
  - URL Validation

### NPM Scripts
- `generate-index`: Manually trigger script indexing
- `predev`: Generates script index before development
- `prebuild`: Generates script index before production build

## Configuration Specifics
- TypeScript: `noUncheckedIndexedAccess` enabled
- Vue Router: Hash Mode for compatibility
- Tailwind CSS: CSS-first configuration