# Phase 02: Build Scripts

## Context

- Parent: [plan.md](./plan.md)
- Depends on: [Phase 01](./phase-01-project-setup.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-09 |
| Priority | P1 |
| Effort | 1.5h |
| Status | pending |
| Review | pending |

Create build scripts to parse userscript metadata and BOOKMARKS.md, generating `scripts-index.json`.

## Key Insights

- Userscript metadata follows standard `// ==UserScript==` format
- BOOKMARKS.md uses standard markdown link format
- Generate index at prebuild, consume at runtime

## Requirements

- Parse `.user.js` files from `scripts/` directory
- Extract metadata: name, version, description, author, match, grant
- Parse `BOOKMARKS.md` for external script links
- Output combined `public/scripts-index.json`
- Skip invalid scripts with warning, continue build

## Architecture

```
scripts/**/*.user.js  ──┐
                        ├──▶ generate-index.ts ──▶ public/scripts-index.json
BOOKMARKS.md ──────────┘
```

## Related Code Files

- `build/generate-index.ts` - Main build script
- `scripts/**/*.user.js` - Userscript source files
- `BOOKMARKS.md` - External bookmarks
- `public/scripts-index.json` - Generated output

## Implementation Steps

### 1. Create Build Script

`build/generate-index.ts`:
```ts
import { glob } from 'glob'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { basename, dirname, join } from 'path'

interface ScriptMeta {
  name: string
  version: string
  description: string
  author: string
  category: string
  filename: string
  matches: string[]
  installUrl: string
  sourceUrl: string
}

interface Bookmark {
  name: string
  url: string
  description: string
  category: string
}

const REPO_URL = 'https://github.com/lamngockhuong/userjs'
const RAW_URL = 'https://raw.githubusercontent.com/lamngockhuong/userjs/main'

function parseUserscriptMeta(content: string, filepath: string): ScriptMeta | null {
  const metaMatch = content.match(/\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/)
  if (!metaMatch) {
    console.warn(`⚠️ Skipping ${filepath}: No metadata block found`)
    return null
  }

  const meta = metaMatch[1]
  const get = (key: string) => {
    const match = meta.match(new RegExp(`// @${key}\\s+(.+)`))
    return match?.[1]?.trim() || ''
  }
  const getAll = (key: string) => {
    const matches = [...meta.matchAll(new RegExp(`// @${key}\\s+(.+)`, 'g'))]
    return matches.map(m => m[1].trim())
  }

  const category = dirname(filepath).split('/').pop() || 'general'
  const filename = basename(filepath)

  return {
    name: get('name'),
    version: get('version'),
    description: get('description'),
    author: get('author'),
    category,
    filename,
    matches: getAll('match'),
    installUrl: `${RAW_URL}/${filepath}`,
    sourceUrl: `${REPO_URL}/blob/main/${filepath}`,
  }
}

function parseBookmarks(content: string): Bookmark[] {
  const bookmarks: Bookmark[] = []
  let currentCategory = 'general'

  for (const line of content.split('\n')) {
    const categoryMatch = line.match(/^## (.+)/)
    if (categoryMatch) {
      currentCategory = categoryMatch[1].toLowerCase()
      continue
    }

    const linkMatch = line.match(/^- \[(.+?)\]\((.+?)\)(?: - (.+))?/)
    if (linkMatch) {
      bookmarks.push({
        name: linkMatch[1],
        url: linkMatch[2],
        description: linkMatch[3] || '',
        category: currentCategory,
      })
    }
  }

  return bookmarks
}

async function main() {
  // Parse userscripts (skip invalid with warning)
  const files = await glob('scripts/**/*.user.js')
  const scripts = files
    .map(f => {
      const content = readFileSync(f, 'utf-8')
      return parseUserscriptMeta(content, f)
    })
    .filter((s): s is ScriptMeta => s !== null)

  // Parse bookmarks
  let bookmarks: Bookmark[] = []
  try {
    const bookmarkContent = readFileSync('BOOKMARKS.md', 'utf-8')
    bookmarks = parseBookmarks(bookmarkContent)
  } catch { /* No bookmarks file yet */ }

  // Write index
  mkdirSync('public', { recursive: true })
  writeFileSync('public/scripts-index.json', JSON.stringify({ scripts, bookmarks }, null, 2))

  console.log(`Generated index: ${scripts.length} scripts, ${bookmarks.length} bookmarks`)
}

main().catch(console.error)
```

### 2. Add npm Scripts

`package.json`:
```json
{
  "scripts": {
    "prebuild": "npx tsx build/generate-index.ts",
    "predev": "npx tsx build/generate-index.ts",
    "build": "vue-tsc && vite build",
    "dev": "vite"
  }
}
```

### 3. Install Build Dependencies (exact versions)

```bash
pnpm add -D tsx@4.21.0 glob@13.0.0 @types/node@24.0.0
```

### 4. Create Sample Script

`scripts/general/hello-world.user.js`:
```js
// ==UserScript==
// @name         Hello World
// @namespace    https://userjs.khuong.dev/
// @version      1.0.0
// @description  A sample userscript
// @author       Khuong
// @match        https://*/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';
  console.log('Hello from userscript!');
})();
```

### 5. Create Sample BOOKMARKS.md

```markdown
# External Bookmarks

## youtube
- [YouTube Auto HD](https://greasyfork.org/scripts/123) - Force HD playback

## github
- [GitHub Dark](https://greasyfork.org/scripts/456) - Dark theme
```

## Todo List

- [ ] Create build/generate-index.ts
- [ ] Install tsx and glob dependencies
- [ ] Add npm scripts to package.json
- [ ] Create scripts/ directory structure
- [ ] Create sample userscript
- [ ] Create BOOKMARKS.md template
- [ ] Test prebuild generates correct JSON

## Success Criteria

- [ ] `pnpm prebuild` completes without errors
- [ ] `public/scripts-index.json` contains correct data
- [ ] Scripts have correct installUrl and sourceUrl
- [ ] Bookmarks parsed with correct categories
- [ ] Build fails on invalid metadata (missing @name)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Invalid metadata format | Medium | Fail fast with clear error |
| Empty scripts folder | Low | Handle gracefully |

## Next Steps

Proceed to Phase 03: Core Components
