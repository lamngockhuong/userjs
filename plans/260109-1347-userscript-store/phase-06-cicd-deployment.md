# Phase 06: CI/CD & Deployment

## Context

- Parent: [plan.md](./plan.md)
- Depends on: [Phase 05](./phase-05-search-filter.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-09 |
| Priority | P1 |
| Effort | 1h |
| Status | pending |
| Review | pending |

Set up GitHub Actions for auto-deploy to GitHub Pages with custom domain.

## Key Insights

- Use GitHub Actions for CI/CD
- Deploy to gh-pages branch
- Configure CNAME for custom domain

## Requirements

- Auto-build on push to main
- Deploy to GitHub Pages
- Custom domain: `userjs.khuong.dev`
- Generate scripts-index.json before build

## Related Code Files

- `.github/workflows/deploy.yml`
- `public/CNAME`
- `vite.config.ts` (update base path)

## Implementation Steps

### 1. Create GitHub Actions Workflow

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0  # For git history

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v6
        with:
          node-version: 24
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm build

      - uses: actions/upload-pages-artifact@v4
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v5
        id: deployment
```

### 2. Create CNAME File

`public/CNAME`:
```
userjs.khuong.dev
```

### 3. Update Vite Config

`vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  base: '/',  // Custom domain, use root
})
```

### 4. Configure GitHub Pages

Manual steps in GitHub repo settings:
1. Go to Settings > Pages
2. Source: GitHub Actions
3. Custom domain: `userjs.khuong.dev`
4. Enforce HTTPS: checked

### 5. Configure DNS (at domain registrar)

Add CNAME record:
```
userjs.khuong.dev -> lamngockhuong.github.io
```

### 6. Create 404.html for SPA routing (optional backup)

Add to `vite.config.ts` build hooks or post-build script:
```ts
// In package.json scripts:
"postbuild": "cp dist/index.html dist/404.html"
```

Update `package.json`:
```json
{
  "scripts": {
    "prebuild": "npx tsx build/generate-index.ts",
    "build": "vue-tsc && vite build",
    "postbuild": "cp dist/index.html dist/404.html"
  }
}
```

## Todo List

- [ ] Create .github/workflows/deploy.yml
- [ ] Create public/CNAME file
- [ ] Update vite.config.ts with alias and base
- [ ] Add postbuild script for 404.html
- [ ] Push to main and verify deployment
- [ ] Configure custom domain in GitHub settings
- [ ] Set up DNS CNAME record
- [ ] Verify HTTPS works

## Success Criteria

- [ ] Push to main triggers auto-deploy
- [ ] Site accessible at userjs.khuong.dev
- [ ] HTTPS enforced
- [ ] Hash routing works correctly
- [ ] Scripts installable from deployed site

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| DNS propagation delay | Low | Wait 24-48h |
| Build failure | Medium | Check Actions logs |
| CORS issues with GitHub API | Low | Already handled with fetch |

## Security Considerations

- No secrets in repo (all public data)
- GitHub API rate limit handled client-side
- No user input stored server-side

## Post-Deployment Checklist

- [ ] Test install flow in Tampermonkey
- [ ] Verify dark mode works
- [ ] Check mobile responsiveness
- [ ] Test search functionality
- [ ] Verify git history loads

## Next Steps

After deployment:
1. Add more userscripts
2. Expand bookmarks collection
3. Consider adding script ratings/comments (future)
