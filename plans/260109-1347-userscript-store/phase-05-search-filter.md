# Phase 05: Search & Filter

## Context

- Parent: [plan.md](./plan.md)
- Depends on: [Phase 04](./phase-04-pages-routing.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-09 |
| Priority | P2 |
| Effort | 1h |
| Status | implemented |
| Review | completed - 7.5/10 - see report |

Implement fuzzy search with Fuse.js for better search experience.

## Key Insights

- Fuse.js provides fuzzy matching out of the box
- Index name, description, and @match URLs (for domain search)
- Debounce search input for performance

## Requirements

- Fuzzy search across script name, description, and @match URLs
- Search bookmarks as well
- Debounced input (300ms)
- Highlight matched text (optional, nice-to-have)

## Related Code Files

- `src/composables/useSearch.ts`
- `src/pages/Home.vue` (update)
- `src/pages/Bookmarks.vue` (update)

## Implementation Steps

### 1. Create useSearch Composable

`src/composables/useSearch.ts`:
```ts
import { ref, computed, watch } from 'vue'
import Fuse from 'fuse.js'
import type { Script, Bookmark } from '@/types/script'

export function useSearch<T extends Script | Bookmark>(items: T[], keys: string[]) {
  const query = ref('')
  const debounced = ref('')

  let timeout: ReturnType<typeof setTimeout>
  watch(query, (val) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => { debounced.value = val }, 300)
  })

  const fuse = computed(() => new Fuse(items, {
    keys,
    threshold: 0.3,
    includeScore: true,
  }))

  const results = computed(() => {
    if (!debounced.value) return items
    return fuse.value.search(debounced.value).map(r => r.item)
  })

  return { query, results }
}
```

### 2. Update Home Page

Update `src/pages/Home.vue` to use Fuse.js search:

```vue
<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import Fuse from 'fuse.js'
import { useScripts } from '@/composables/useScripts'
import ScriptCard from '@/components/ScriptCard.vue'
import SearchBar from '@/components/SearchBar.vue'

const { scripts, loading, fetchScripts, categories } = useScripts()
const search = ref('')
const selectedCategory = ref('')

onMounted(fetchScripts)

const fuse = computed(() => new Fuse(scripts.value, {
  keys: ['name', 'description', 'matches'],  // matches = @match URLs
  threshold: 0.3,
}))

const filtered = computed(() => {
  let result = scripts.value

  // Category filter first
  if (selectedCategory.value) {
    result = result.filter(s => s.category === selectedCategory.value)
  }

  // Then fuzzy search
  if (search.value.trim()) {
    const searchResults = fuse.value.search(search.value)
    const matchedNames = new Set(searchResults.map(r => r.item.name))
    result = result.filter(s => matchedNames.has(s.name))
  }

  return result
})
</script>
```

### 3. Add Search to Bookmarks Page

Update `src/pages/Bookmarks.vue`:

```vue
<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import Fuse from 'fuse.js'
import { useBookmarks } from '@/composables/useBookmarks'
import SearchBar from '@/components/SearchBar.vue'
import { ExternalLink } from 'lucide-vue-next'

const { bookmarks, fetchBookmarks, categories } = useBookmarks()
const search = ref('')

onMounted(fetchBookmarks)

const fuse = computed(() => new Fuse(bookmarks.value, {
  keys: ['name', 'description', 'category'],
  threshold: 0.3,
}))

const filtered = computed(() => {
  if (!search.value.trim()) return bookmarks.value
  return fuse.value.search(search.value).map(r => r.item)
})

const groupedBookmarks = computed(() => {
  const groups: Record<string, typeof bookmarks.value> = {}
  for (const b of filtered.value) {
    if (!groups[b.category]) groups[b.category] = []
    groups[b.category].push(b)
  }
  return groups
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">External Bookmarks</h1>
    </div>

    <SearchBar v-model="search" />

    <div v-for="(items, category) in groupedBookmarks" :key="category" class="space-y-3">
      <h2 class="text-lg font-semibold capitalize">{{ category }}</h2>
      <div class="grid gap-3 md:grid-cols-2">
        <a v-for="bookmark in items"
           :key="bookmark.url"
           :href="bookmark.url"
           target="_blank"
           class="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700">
          <ExternalLink :size="18" class="mt-1 text-gray-400" />
          <div>
            <p class="font-medium">{{ bookmark.name }}</p>
            <p class="text-sm text-gray-500">{{ bookmark.description }}</p>
          </div>
        </a>
      </div>
    </div>

    <p v-if="!filtered.length" class="text-center text-gray-500">
      {{ search ? 'No results found' : 'No bookmarks yet' }}
    </p>
  </div>
</template>
```

## Todo List

- [x] Install fuse.js if not already
- [x] Create useSearch composable (optional reusable version)
- [x] Update Home page with Fuse.js
- [x] Add search to Bookmarks page
- [x] Test fuzzy matching works correctly
- [x] Verify debounce delays input

## Success Criteria

- [x] Fuzzy search finds partial matches
- [x] Search is case-insensitive
- [x] Results update after typing stops (300ms)
- [x] Empty search shows all items
- [x] Search works on both scripts and bookmarks

## Review Findings

**Score: 7.5/10**

See detailed review: [code-reviewer-260109-1547-phase05-search-filter.md](../reports/code-reviewer-260109-1547-phase05-search-filter.md)

**Critical Issues to Fix:**
1. Memory leak in useSearch.ts - timeout not cleared on unmount
2. useSearch composable created but not used (code duplication)
3. Non-null assertion in Bookmarks.vue needs safety check
4. Missing aria-label in SearchBar component

**High Priority:**
- Optimize Home.vue filter logic (double filtering inefficiency)
- Add error boundaries to search operations

## Next Steps

1. Fix critical issues before production deployment
2. Update documentation with search feature usage
3. Proceed to Phase 06: CI/CD & Deployment
