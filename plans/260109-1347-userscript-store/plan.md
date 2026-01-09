---
title: "Userscript Store"
description: "Vue 3 SPA for hosting personal userscripts with external bookmarks"
status: in_progress
priority: P2
effort: 8h
branch: main
tags: [vue3, vite, userscript, tampermonkey, github-pages]
created: 2026-01-09
---

# Userscript Store Implementation Plan

## Overview

Build a static SPA to host personal userscripts and bookmark external scripts. Deployed to GitHub Pages with custom domain `userjs.khuong.dev`.

## References

- [Brainstorm Report](../reports/brainstorm-260109-1347-userscript-store.md)
- [Design System](./design-system.md)

## Tech Stack (Exact Versions - No ^)

| Layer | Choice | Version |
|-------|--------|---------|
| Runtime | Node.js | 24 |
| Package Manager | pnpm | 10 |
| Framework | Vue 3 + Composition API | 3.5.26 |
| Build | Vite | 7.3.1 |
| Styling | Tailwind CSS (v4 CSS-first) | 4.1.18 |
| Routing | Vue Router (hash mode) | 4.6.4 |
| Utilities | @vueuse/core | 14.1.0 |
| Search | Fuse.js | 7.1.0 |
| Icons | lucide-vue-next | 0.562.0 |
| Syntax Highlight | Shiki | 3.0.0 |
| Hosting | GitHub Pages | - |
| CI/CD | GitHub Actions | v6 |

## Implementation Phases

| # | Phase | Effort | Status |
|---|-------|--------|--------|
| 1 | [Project Setup](./phase-01-project-setup.md) | 1h | done |
| 2 | [Build Scripts](./phase-02-build-scripts.md) | 1.5h | done |
| 3 | [Core Components](./phase-03-core-components.md) | 2h | pending |
| 4 | [Pages & Routing](./phase-04-pages-routing.md) | 1.5h | pending |
| 5 | [Search & Filter](./phase-05-search-filter.md) | 1h | pending |
| 6 | [CI/CD & Deployment](./phase-06-cicd-deployment.md) | 1h | pending |

## Directory Structure

```
userjs/
├── scripts/                    # Self-written userscripts
│   ├── youtube/
│   ├── github/
│   └── general/
├── BOOKMARKS.md                # External script links
├── src/
│   ├── App.vue
│   ├── main.ts
│   ├── components/
│   ├── pages/
│   ├── composables/
│   └── types/
├── build/                      # Build scripts
│   └── generate-index.ts
├── public/
│   └── scripts-index.json      # Auto-generated
├── vite.config.ts
└── package.json
```

## Success Criteria

- [ ] Scripts installable in 1 click via Tampermonkey
- [ ] Page load < 2s
- [ ] Search results < 100ms
- [ ] Mobile responsive
- [ ] Dark mode support
- [ ] Auto-deploy on push to main

## Risks

| Risk | Mitigation |
|------|------------|
| GitHub API rate limit (60/hr) | Cache in localStorage |
| BOOKMARKS.md parsing errors | Validate in build, fail fast |

## Validation Summary

**Validated:** 2026-01-09
**Questions asked:** 6

### Confirmed Decisions
- **GitHub API caching:** localStorage, no TTL - cache vĩnh viễn
- **Repo URL:** Hardcoded `lamngockhuong/userjs` - không cần config
- **Build errors:** Skip invalid scripts with warning, continue build
- **Dark mode:** System preference (prefers-color-scheme)
- **Search scope:** name + description + @match URLs
- **Footer:** Simple footer (GitHub repo link + "Made by...")

### Action Items
- [x] Update phase-02: Change fail-fast to skip-with-warning for invalid metadata
- [x] Update phase-05: Add @match URLs to Fuse.js search keys
- [x] Update phase-03: Add simple footer component
- [x] Add userscript manager detection + install prompt (phase-03)
- [x] Add copy install URL button (phase-03)
- [x] Add source code preview with syntax highlighting (phase-04)
- [x] Add keyboard shortcuts (phase-04)

## Next Actions

1. ~~Review and approve this plan~~
2. Start with Phase 1: Project Setup
