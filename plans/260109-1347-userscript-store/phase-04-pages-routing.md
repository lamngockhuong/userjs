# Phase 04: Pages & Routing

## Context

- Parent: [plan.md](./plan.md)
- Depends on: [Phase 03](./phase-03-core-components.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-09 |
| Priority | P1 |
| Effort | 1.5h |
| Status | done |
| Review | approved (8.5/10 → fixed) |
| Completed | 2026-01-09T15:34:00Z |

Implement page views and routing for the store.

## Requirements

- Home page: List all scripts with category filter
- Script detail page: Full script info + version history
- Bookmarks page: List external script links
- 404 page for invalid routes

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Home.vue | Script listing |
| `/script/:category/:filename` | ScriptDetail.vue | Script details |
| `/bookmarks` | Bookmarks.vue | External links |
| `/:pathMatch(.*)*` | NotFound.vue | 404 page |

## Related Code Files

- `src/pages/Home.vue`
- `src/pages/ScriptDetail.vue`
- `src/pages/Bookmarks.vue`
- `src/pages/NotFound.vue`
- `src/router/index.ts`
- `src/App.vue`

## Implementation Steps

### 1. Update Router Config

`src/router/index.ts`:
```ts
import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('@/pages/Home.vue') },
  { path: '/script/:category/:filename', name: 'script-detail', component: () => import('@/pages/ScriptDetail.vue') },
  { path: '/bookmarks', name: 'bookmarks', component: () => import('@/pages/Bookmarks.vue') },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/pages/NotFound.vue') },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
```

### 2. Create Home Page

`src/pages/Home.vue`:
```vue
<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useScripts } from '@/composables/useScripts'
import ScriptCard from '@/components/ScriptCard.vue'
import SearchBar from '@/components/SearchBar.vue'

const { scripts, loading, fetchScripts, categories } = useScripts()
const search = ref('')
const selectedCategory = ref('')

onMounted(fetchScripts)

const filtered = computed(() => {
  let result = scripts.value
  if (selectedCategory.value) {
    result = result.filter(s => s.category === selectedCategory.value)
  }
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    )
  }
  return result
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row gap-4">
      <SearchBar v-model="search" class="flex-1" />
      <select v-model="selectedCategory"
              class="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700">
        <option value="">All Categories</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
    </div>

    <div v-if="loading" class="text-center py-8">Loading...</div>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <router-link v-for="script in filtered" :key="script.filename"
                   :to="`/script/${script.category}/${script.filename}`">
        <ScriptCard :script="script" />
      </router-link>
    </div>

    <p v-if="!loading && !filtered.length" class="text-center text-gray-500">
      No scripts found
    </p>
  </div>
</template>
```

### 3. Create Script Detail Page

`src/pages/ScriptDetail.vue`:
```vue
<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useScripts } from '@/composables/useScripts'
import { Download, ExternalLink, ArrowLeft, History, Code, Copy, Check } from 'lucide-vue-next'
import { codeToHtml } from 'shiki'

const route = useRoute()
const { scripts, fetchScripts, getBySlug } = useScripts()

const commits = ref<{ sha: string; message: string; date: string }[]>([])
const loadingHistory = ref(false)
const showCode = ref(false)
const sourceCode = ref('')
const highlightedCode = ref('')
const loadingCode = ref(false)
const codeCopied = ref(false)

onMounted(async () => {
  await fetchScripts()
  fetchGitHistory()
})

const script = computed(() =>
  getBySlug(route.params.category as string, route.params.filename as string)
)

async function fetchGitHistory() {
  if (!script.value) return
  loadingHistory.value = true
  try {
    const cached = localStorage.getItem(`history-${script.value.filename}`)
    if (cached) {
      commits.value = JSON.parse(cached)
      return
    }
    const res = await fetch(
      `https://api.github.com/repos/lamngockhuong/userjs/commits?path=scripts/${script.value.category}/${script.value.filename}&per_page=10`
    )
    if (res.ok) {
      const data = await res.json()
      commits.value = data.map((c: any) => ({
        sha: c.sha.slice(0, 7),
        message: c.commit.message.split('\n')[0],
        date: new Date(c.commit.author.date).toLocaleDateString(),
      }))
      localStorage.setItem(`history-${script.value.filename}`, JSON.stringify(commits.value))
    }
  } finally {
    loadingHistory.value = false
  }
}

async function toggleCodePreview() {
  showCode.value = !showCode.value
  if (showCode.value && !sourceCode.value) {
    loadingCode.value = true
    try {
      const res = await fetch(script.value!.installUrl)
      sourceCode.value = await res.text()
      highlightedCode.value = await codeToHtml(sourceCode.value, {
        lang: 'javascript',
        theme: 'github-dark'
      })
    } finally {
      loadingCode.value = false
    }
  }
}

async function copyCode() {
  await navigator.clipboard.writeText(sourceCode.value)
  codeCopied.value = true
  setTimeout(() => { codeCopied.value = false }, 2000)
}
</script>

<template>
  <div v-if="script" class="max-w-4xl mx-auto space-y-6">
    <router-link to="/" class="inline-flex items-center gap-1 text-blue-500 hover:underline">
      <ArrowLeft :size="16" /> Back
    </router-link>

    <div class="p-6 border rounded-lg dark:border-slate-700">
      <div class="flex justify-between items-start">
        <h1 class="text-2xl font-bold">{{ script.name }}</h1>
        <span class="px-2 py-1 text-sm font-mono bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded">
          v{{ script.version }}
        </span>
      </div>

      <p class="mt-2 text-slate-600 dark:text-slate-300">{{ script.description }}</p>
      <p class="mt-1 text-sm text-slate-500">by {{ script.author }}</p>

      <div class="mt-4 flex flex-wrap gap-2">
        <span v-for="match in script.matches" :key="match"
              class="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 rounded">
          {{ match }}
        </span>
      </div>

      <div class="mt-6 flex flex-wrap gap-3">
        <a :href="script.installUrl"
           class="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
          <Download :size="18" /> Install Script
        </a>
        <button @click="toggleCodePreview"
                class="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 dark:border-slate-600 transition-colors">
          <Code :size="18" /> {{ showCode ? 'Hide Code' : 'View Code' }}
        </button>
        <a :href="script.sourceUrl" target="_blank"
           class="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 dark:border-slate-600 transition-colors">
          <ExternalLink :size="18" /> GitHub
        </a>
      </div>
    </div>

    <!-- Code Preview Panel -->
    <div v-if="showCode" class="border rounded-lg dark:border-slate-700 overflow-hidden">
      <div class="flex justify-between items-center px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b dark:border-slate-700">
        <span class="text-sm font-medium">{{ script.filename }}</span>
        <button @click="copyCode"
                class="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          <Check v-if="codeCopied" :size="14" class="text-green-500" />
          <Copy v-else :size="14" />
          {{ codeCopied ? 'Copied!' : 'Copy' }}
        </button>
      </div>
      <div v-if="loadingCode" class="p-4 text-slate-500">Loading source code...</div>
      <div v-else class="overflow-x-auto max-h-96 text-sm [&_pre]:p-4 [&_pre]:m-0" v-html="highlightedCode" />
    </div>

    <!-- Version History -->
    <div class="p-6 border rounded-lg dark:border-slate-700">
      <h2 class="flex items-center gap-2 text-lg font-semibold mb-4">
        <History :size="20" /> Version History
      </h2>
      <div v-if="loadingHistory" class="text-slate-500">Loading...</div>
      <ul v-else class="space-y-2">
        <li v-for="commit in commits" :key="commit.sha" class="flex gap-3 text-sm">
          <code class="text-blue-500 font-mono">{{ commit.sha }}</code>
          <span class="flex-1 truncate">{{ commit.message }}</span>
          <span class="text-slate-500">{{ commit.date }}</span>
        </li>
        <li v-if="!commits.length" class="text-slate-500">No history available</li>
      </ul>
    </div>
  </div>

  <div v-else class="text-center py-12">
    <p class="text-xl text-slate-500">Script not found</p>
    <router-link to="/" class="text-blue-500 hover:underline">Go home</router-link>
  </div>
</template>
```

### 4. Create Bookmarks Page

`src/pages/Bookmarks.vue`:
```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useBookmarks } from '@/composables/useBookmarks'
import { ExternalLink } from 'lucide-vue-next'

const { bookmarks, fetchBookmarks, categories } = useBookmarks()

onMounted(fetchBookmarks)
</script>

<template>
  <div class="space-y-8">
    <h1 class="text-2xl font-bold">External Bookmarks</h1>

    <div v-for="category in categories" :key="category" class="space-y-3">
      <h2 class="text-lg font-semibold capitalize">{{ category }}</h2>
      <div class="grid gap-3 md:grid-cols-2">
        <a v-for="bookmark in bookmarks.filter(b => b.category === category)"
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

    <p v-if="!bookmarks.length" class="text-center text-gray-500">No bookmarks yet</p>
  </div>
</template>
```

### 5. Update App.vue

`src/App.vue`:
```vue
<script setup lang="ts">
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import InstallBanner from '@/components/InstallBanner.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
    <InstallBanner />
    <Header />
    <main class="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
      <router-view />
    </main>
    <Footer />
  </div>
</template>
```

### 6. Create Keyboard Shortcuts Composable

`src/composables/useKeyboardShortcuts.ts`:
```ts
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

export function useKeyboardShortcuts() {
  const router = useRouter()

  function handleKeydown(e: KeyboardEvent) {
    // Ignore if typing in input/textarea
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      // Allow Escape to blur input
      if (e.key === 'Escape') {
        (e.target as HTMLElement).blur()
      }
      return
    }

    switch (e.key) {
      case '/':
        // Focus search bar
        e.preventDefault()
        document.querySelector<HTMLInputElement>('[data-search-input]')?.focus()
        break
      case 'g':
        // Go to home
        if (e.ctrlKey || e.metaKey) return
        router.push('/')
        break
      case 'b':
        // Go to bookmarks
        if (e.ctrlKey || e.metaKey) return
        router.push('/bookmarks')
        break
      case 'd':
        // Toggle dark mode
        if (e.ctrlKey || e.metaKey) return
        document.documentElement.classList.toggle('dark')
        localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light')
        break
      case '?':
        // Show shortcuts help (optional)
        console.log('Shortcuts: / search, g home, b bookmarks, d dark mode')
        break
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
}
```

### 7. Update SearchBar with data attribute

Update `src/components/SearchBar.vue` to add `data-search-input`:
```vue
<input
  data-search-input
  :value="modelValue"
  ...
/>
```

### 8. Use Shortcuts in App.vue

Update `src/App.vue`:
```vue
<script setup lang="ts">
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import InstallBanner from '@/components/InstallBanner.vue'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'

useKeyboardShortcuts()
</script>
```

## Todo List

- [ ] Update router configuration
- [ ] Create Home page with filtering
- [ ] Create ScriptDetail page with code preview
- [ ] Create Bookmarks page
- [ ] Create NotFound page
- [ ] Update App.vue layout
- [ ] Create useKeyboardShortcuts composable
- [ ] Test all navigation flows
- [ ] Test keyboard shortcuts

## Success Criteria

- [ ] All routes render correctly
- [ ] Script detail shows version history
- [ ] Code preview with syntax highlighting works
- [ ] Category filter works on home page
- [ ] Bookmarks grouped by category
- [ ] 404 page shows for invalid routes
- [ ] Keyboard shortcuts: `/` search, `g` home, `b` bookmarks, `d` dark mode

## Next Steps

Proceed to Phase 05: Search & Filter
