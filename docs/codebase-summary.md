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
├── public/             # Public Static Assets
├── scripts/            # Project Utility Scripts
├── config/             # Configuration Files
│
├── index.html          # HTML Entry Point
└── vite.config.ts      # Vite Build Configuration
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

## Dependency Highlights
- @vueuse/core: Utility Composables
- fuse.js: Fuzzy Search
- lucide-vue-next: Icon Library
- shiki: Syntax Highlighting

## Configuration Specifics
- TypeScript: `noUncheckedIndexedAccess` enabled
- Vue Router: Hash Mode for compatibility
- Tailwind CSS: CSS-first configuration