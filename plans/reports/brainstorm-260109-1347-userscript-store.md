# Brainstorm: Userscript Store

## Problem Statement

Build personal userscript store with:
- Host self-written scripts from repo
- Bookmark external scripts (Greasyfork, OpenUserJS, userscripts-mirror)
- Public sharing for community

## Requirements Summary

| Aspect | Decision |
|--------|----------|
| Site Type | Static SPA + script repo |
| Framework | Vue 3 + Vite |
| Hosting | GitHub Pages |
| External Scripts | Bookmark links only (no mirror) |
| Script Structure | Category folders |
| Automation | Auto-gen index from metadata |
| Bookmarks Format | Markdown (BOOKMARKS.md) |
| Version History | Git commits parsing |

### Must-have Features
- Browse & Install scripts
- Search & Filter (name, category, tags)
- Dark mode toggle
- Version history (from git)

## Proposed Architecture

### Directory Structure

```
userjs/
├── scripts/                    # Self-written scripts
│   ├── youtube/
│   │   └── yt-enhancer.user.js
│   ├── github/
│   │   └── gh-dark-mode.user.js
│   └── general/
│       └── auto-scroll.user.js
├── BOOKMARKS.md                # External script links
├── src/                        # Vue SPA source
│   ├── App.vue
│   ├── main.ts
│   ├── components/
│   ├── pages/
│   ├── composables/
│   │   ├── useScripts.ts       # Parse local scripts
│   │   ├── useBookmarks.ts     # Parse BOOKMARKS.md
│   │   └── useGitHistory.ts    # Fetch git history via API
│   └── types/
├── public/
├── scripts-index.json          # Auto-generated at build
├── vite.config.ts
└── package.json
```

### Data Flow

```
┌─────────────────┐     ┌──────────────────┐
│ scripts/*.user.js │────▶│ Build Script     │
│ (userscript files) │     │ (parse metadata) │
└─────────────────┘     └────────┬─────────┘
                                 │
┌─────────────────┐              ▼
│ BOOKMARKS.md    │────▶┌──────────────────┐
│ (external links) │     │ scripts-index.json│
└─────────────────┘     └────────┬─────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │ Vue SPA          │
                        │ (fetch & render) │
                        └──────────────────┘
```

### Userscript Metadata Parsing

Standard userscript header:
```javascript
// ==UserScript==
// @name         Script Name
// @namespace    https://example.com/
// @version      1.0.0
// @description  Script description
// @author       Your Name
// @match        https://youtube.com/*
// @grant        none
// ==/UserScript==
```

Build script extracts: name, version, description, author, match patterns, tags (from @match domains).

### BOOKMARKS.md Format

```markdown
# External Bookmarks

## YouTube
- [YouTube Enhancer](https://greasyfork.org/scripts/123) - Enhance YouTube experience
- [Auto HD](https://openuserjs.org/scripts/xxx/Auto_HD) - Force HD playback

## GitHub
- [GitHub Dark](https://greasyfork.org/scripts/456) - Dark theme for GitHub
```

Parser regex: `/- \[(.+?)\]\((.+?)\)(?: - (.+))?/`

### Version History via GitHub API

```typescript
// Fetch commits for specific file
const response = await fetch(
  `https://api.github.com/repos/${owner}/${repo}/commits?path=scripts/youtube/yt-enhancer.user.js`
);
```

Rate limit: 60 req/hour (unauthenticated). Cache results in localStorage.

## Evaluated Approaches

### Approach 1: Pure Static HTML (Rejected)
**Pros:** Zero build, simple
**Cons:** No search/filter, manual HTML updates, poor DX

### Approach 2: SSG (Hugo/11ty) (Considered)
**Pros:** Markdown-driven, fast builds
**Cons:** Less flexible for rich UI, learning curve for custom features

### Approach 3: Vue 3 SPA (Selected)
**Pros:**
- Rich, reactive UI for search/filter
- Component-based, maintainable
- Vite = fast dev experience
- GitHub Pages compatible (SPA with hash router or 404.html trick)

**Cons:**
- Build step required
- Slightly more complex than static HTML
- JS required for content (SEO concern, but irrelevant for this use case)

## Implementation Considerations

### Build Process
1. `prebuild` script: Parse all `.user.js` files + `BOOKMARKS.md` → generate `scripts-index.json`
2. `build`: Vite builds Vue SPA
3. `deploy`: Push to `gh-pages` branch

### GitHub Pages SPA Routing
Option A: Hash-based routing (`/#/scripts/youtube`)
Option B: 404.html redirect trick (copy index.html to 404.html)

Recommend: **Hash-based** - simpler, no server config needed.

### Search Implementation
Client-side search with Fuse.js or simple filter:
- Index: name, description, category, tags
- Instant results as user types

### Dark Mode
- CSS variables for theming
- `prefers-color-scheme` detection
- localStorage persistence

### Responsive Design
Mobile-first, card-based layout for script list.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| GitHub API rate limit | Cache in localStorage, lazy load history |
| BOOKMARKS.md parsing errors | Validate format in build, fail fast |
| Large number of scripts | Virtual scrolling if >100 scripts |
| External links dead | Manual check, maybe add link checker CI |

## Success Metrics

- Scripts installable in 1 click
- Page load < 2s
- Search results < 100ms
- Mobile-friendly
- Easy to add new scripts (just drop .user.js file)

## Tech Stack Summary

| Layer | Choice |
|-------|--------|
| Framework | Vue 3 (Composition API) |
| Build | Vite |
| Styling | Tailwind CSS or UnoCSS |
| Routing | Vue Router (hash mode) |
| Search | Fuse.js or native filter |
| Icons | Lucide or Heroicons |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

## Next Steps

1. Initialize Vue 3 + Vite project
2. Create build script for metadata parsing
3. Design component structure
4. Implement core pages (Home, Script Detail)
5. Add search/filter functionality
6. Implement dark mode
7. Set up GitHub Actions for auto-deploy
8. Create sample scripts and bookmarks

## Resolved Questions

1. **Custom domain:** Yes - `userjs.khuong.dev`
2. Script update notifications: Out of scope for MVP
3. Installation statistics: Out of scope for MVP
