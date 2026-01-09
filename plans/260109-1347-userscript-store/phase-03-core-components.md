# Phase 03: Core Components

## Context

- Parent: [plan.md](./plan.md)
- Depends on: [Phase 02](./phase-02-build-scripts.md)
- Design: [Design System](./design-system.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-09 |
| Priority | P1 |
| Effort | 2h |
| Status | pending |
| Review | pending |

Build reusable Vue components and composables for the store UI.

## Key Insights

- Composables for data fetching and state management
- Card-based layout for script listing
- Dark mode via CSS variables and class toggle

## Requirements

- ScriptCard component for displaying script info
- BookmarkCard for external scripts
- Header with dark mode toggle
- Composables for scripts and bookmarks data
- Dark mode persistence in localStorage

## Related Code Files

- `src/components/ScriptCard.vue`
- `src/components/BookmarkCard.vue`
- `src/components/Header.vue`
- `src/components/SearchBar.vue`
- `src/composables/useScripts.ts`
- `src/composables/useBookmarks.ts`
- `src/composables/useDarkMode.ts`
- `src/composables/useUserscriptManager.ts`
- `src/components/InstallBanner.vue`

## Implementation Steps

### 1. Create useScripts Composable

`src/composables/useScripts.ts`:
```ts
import { ref, computed } from 'vue'
import type { Script } from '@/types/script'

const scripts = ref<Script[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

export function useScripts() {
  async function fetchScripts() {
    if (scripts.value.length) return
    loading.value = true
    try {
      const res = await fetch('/scripts-index.json')
      const data = await res.json()
      scripts.value = data.scripts
    } catch (e) {
      error.value = 'Failed to load scripts'
    } finally {
      loading.value = false
    }
  }

  const categories = computed(() =>
    [...new Set(scripts.value.map(s => s.category))]
  )

  const getByCategory = (cat: string) =>
    scripts.value.filter(s => s.category === cat)

  const getBySlug = (category: string, filename: string) =>
    scripts.value.find(s => s.category === category && s.filename === filename)

  return { scripts, loading, error, fetchScripts, categories, getByCategory, getBySlug }
}
```

### 2. Create useBookmarks Composable

`src/composables/useBookmarks.ts`:
```ts
import { ref, computed } from 'vue'
import type { Bookmark } from '@/types/script'

const bookmarks = ref<Bookmark[]>([])

export function useBookmarks() {
  async function fetchBookmarks() {
    if (bookmarks.value.length) return
    const res = await fetch('/scripts-index.json')
    const data = await res.json()
    bookmarks.value = data.bookmarks
  }

  const categories = computed(() =>
    [...new Set(bookmarks.value.map(b => b.category))]
  )

  return { bookmarks, fetchBookmarks, categories }
}
```

### 3. Create useDarkMode Composable

`src/composables/useDarkMode.ts`:
```ts
import { ref, watchEffect } from 'vue'

const isDark = ref(localStorage.getItem('theme') === 'dark' ||
  (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches))

export function useDarkMode() {
  watchEffect(() => {
    document.documentElement.classList.toggle('dark', isDark.value)
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  })

  const toggle = () => { isDark.value = !isDark.value }

  return { isDark, toggle }
}
```

### 4. Create ScriptCard Component

`src/components/ScriptCard.vue`:
```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { Script } from '@/types/script'
import { Download, ExternalLink, Copy, Check } from 'lucide-vue-next'

defineProps<{ script: Script }>()

const copied = ref(false)

async function copyUrl(url: string) {
  await navigator.clipboard.writeText(url)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <div class="group p-4 rounded-lg border cursor-pointer transition-colors duration-200
              bg-white border-slate-200 hover:border-blue-500/50
              dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-500/50">
    <div class="flex justify-between items-start">
      <div>
        <h3 class="font-semibold text-lg text-slate-900 dark:text-slate-100">
          {{ script.name }}
        </h3>
        <p class="text-sm font-mono text-slate-500 dark:text-slate-400">
          v{{ script.version }}
        </p>
      </div>
      <span class="px-2 py-1 text-xs font-medium rounded
                   bg-blue-500/20 text-blue-600 dark:text-blue-400">
        {{ script.category }}
      </span>
    </div>
    <p class="mt-2 text-slate-600 dark:text-slate-300 line-clamp-2">
      {{ script.description }}
    </p>
    <div class="mt-3 flex flex-wrap gap-1">
      <span v-for="match in script.matches.slice(0, 2)" :key="match"
            class="px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-600
                   dark:bg-slate-700 dark:text-slate-300">
        {{ match.replace('https://', '').replace('/*', '') }}
      </span>
    </div>
    <div class="mt-4 flex gap-2">
      <a :href="script.installUrl"
         @click.stop
         class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg
                bg-green-500 text-white hover:bg-green-600 transition-colors">
        <Download :size="16" /> Install
      </a>
      <button @click.stop="copyUrl(script.installUrl)"
              class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg
                     border border-slate-300 hover:bg-slate-100
                     dark:border-slate-600 dark:hover:bg-slate-700 transition-colors">
        <Check v-if="copied" :size="16" class="text-green-500" />
        <Copy v-else :size="16" />
        {{ copied ? 'Copied!' : 'Copy URL' }}
      </button>
      <a :href="script.sourceUrl" target="_blank"
         @click.stop
         class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg
                border border-slate-300 hover:bg-slate-100
                dark:border-slate-600 dark:hover:bg-slate-700 transition-colors">
        <ExternalLink :size="16" /> Source
      </a>
    </div>
  </div>
</template>
```

### 5. Create Header Component

`src/components/Header.vue`:
```vue
<script setup lang="ts">
import { useDarkMode } from '@/composables/useDarkMode'
import { Moon, Sun } from 'lucide-vue-next'

const { isDark, toggle } = useDarkMode()
</script>

<template>
  <header class="sticky top-0 z-10 h-16 border-b backdrop-blur-sm
                 bg-white/80 border-slate-200
                 dark:bg-slate-900/80 dark:border-slate-700">
    <div class="max-w-6xl mx-auto px-4 h-full flex justify-between items-center">
      <router-link to="/" class="text-xl font-bold text-slate-900 dark:text-slate-100">
        UserJS Store
      </router-link>
      <nav class="flex items-center gap-6">
        <router-link to="/"
                     class="text-slate-600 hover:text-blue-500 dark:text-slate-300
                            dark:hover:text-blue-400 transition-colors"
                     active-class="text-blue-500 dark:text-blue-400">
          Scripts
        </router-link>
        <router-link to="/bookmarks"
                     class="text-slate-600 hover:text-blue-500 dark:text-slate-300
                            dark:hover:text-blue-400 transition-colors"
                     active-class="text-blue-500 dark:text-blue-400">
          Bookmarks
        </router-link>
        <button @click="toggle"
                class="p-2 rounded-lg cursor-pointer transition-colors
                       hover:bg-slate-100 dark:hover:bg-slate-800">
          <Sun v-if="isDark" :size="20" class="text-slate-400" />
          <Moon v-else :size="20" class="text-slate-600" />
        </button>
      </nav>
    </div>
  </header>
</template>
```

### 6. Create SearchBar Component

`src/components/SearchBar.vue`:
```vue
<script setup lang="ts">
import { Search } from 'lucide-vue-next'

defineProps<{ modelValue: string }>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="relative">
    <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="20" />
    <input
      data-search-input
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      type="text"
      placeholder="Search scripts... (press / to focus)"
      class="w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors
             bg-white border-slate-200 text-slate-900 placeholder-slate-400
             dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100
             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>
</template>
```

### 7. Create Userscript Manager Detection

`src/composables/useUserscriptManager.ts`:
```ts
import { ref, onMounted } from 'vue'

export interface UserscriptManager {
  name: string
  installed: boolean
  installUrl: string
  icon: string
}

const managers: UserscriptManager[] = [
  {
    name: 'Tampermonkey',
    installed: false,
    installUrl: 'https://www.tampermonkey.net/',
    icon: 'https://www.tampermonkey.net/favicon.ico'
  },
  {
    name: 'Violentmonkey',
    installed: false,
    installUrl: 'https://violentmonkey.github.io/',
    icon: 'https://violentmonkey.github.io/favicon.ico'
  },
  {
    name: 'Greasemonkey',
    installed: false,
    installUrl: 'https://www.greasespot.net/',
    icon: 'https://www.greasespot.net/favicon.ico'
  }
]

const isDetected = ref(false)
const dismissed = ref(false)
const detectedManager = ref<string | null>(null)

export function useUserscriptManager() {
  onMounted(() => {
    // Check localStorage for dismissal
    dismissed.value = localStorage.getItem('usm-banner-dismissed') === 'true'

    // Detection methods:
    // 1. Tampermonkey injects GM_info in userscript context
    // 2. Check for specific window properties (not reliable on page context)
    // 3. Best approach: try installing a test script and see if dialog appears

    // Simple heuristic: check if .user.js links trigger install dialog
    // We can't directly detect, so we show banner on first visit
    // and let user dismiss after installing

    // Advanced detection via script injection test:
    detectViaScriptTest()
  })

  async function detectViaScriptTest() {
    // Create a temporary link and check if browser handles .user.js specially
    // This is a heuristic - not 100% reliable but works for most cases

    // Alternative: check for known extension IDs (Chrome only)
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      const extensionIds = [
        'dhdgffkkebhmkfjojejmpbldmpobfkfo', // Tampermonkey
        'jinjaccalgkegednnccohejagnlnfdag', // Violentmonkey
      ]

      for (const id of extensionIds) {
        try {
          // Try to send message to extension
          await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(id, { type: 'ping' }, (response) => {
              if (chrome.runtime.lastError) reject()
              else resolve(response)
            })
          })
          isDetected.value = true
          detectedManager.value = id === extensionIds[0] ? 'Tampermonkey' : 'Violentmonkey'
          return
        } catch {
          // Extension not installed or doesn't respond
        }
      }
    }

    // Fallback: assume not detected, show banner
    isDetected.value = false
  }

  function dismissBanner() {
    dismissed.value = true
    localStorage.setItem('usm-banner-dismissed', 'true')
  }

  function showBanner() {
    return !isDetected.value && !dismissed.value
  }

  return {
    managers,
    isDetected,
    dismissed,
    detectedManager,
    dismissBanner,
    showBanner
  }
}
```

### 8. Create InstallBanner Component

`src/components/InstallBanner.vue`:
```vue
<script setup lang="ts">
import { useUserscriptManager } from '@/composables/useUserscriptManager'
import { X, Download, ExternalLink } from 'lucide-vue-next'

const { managers, showBanner, dismissBanner } = useUserscriptManager()
</script>

<template>
  <div v-if="showBanner()"
       class="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
    <div class="max-w-6xl mx-auto px-4 py-3">
      <div class="flex items-start gap-3">
        <Download :size="20" class="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div class="flex-1">
          <p class="text-sm text-amber-800 dark:text-amber-200 font-medium">
            Userscript manager required
          </p>
          <p class="text-sm text-amber-700 dark:text-amber-300 mt-1">
            Install one of these extensions to use scripts from this store:
          </p>
          <div class="flex flex-wrap gap-3 mt-2">
            <a v-for="manager in managers"
               :key="manager.name"
               :href="manager.installUrl"
               target="_blank"
               class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg
                      bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700
                      text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/30
                      transition-colors">
              <ExternalLink :size="14" />
              {{ manager.name }}
            </a>
          </div>
        </div>
        <button @click="dismissBanner"
                class="p-1 rounded hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
                title="Dismiss">
          <X :size="18" class="text-amber-600 dark:text-amber-400" />
        </button>
      </div>
    </div>
  </div>
</template>
```

### 9. Create Footer Component

`src/components/Footer.vue`:
```vue
<script setup lang="ts">
import { Github } from 'lucide-vue-next'
</script>

<template>
  <footer class="mt-auto py-6 border-t border-slate-200 dark:border-slate-700">
    <div class="max-w-6xl mx-auto px-4 flex justify-between items-center text-sm text-slate-500">
      <span>Made by <a href="https://khuong.dev" target="_blank" class="hover:text-blue-500">Khuong</a></span>
      <a href="https://github.com/lamngockhuong/userjs" target="_blank"
         class="flex items-center gap-1 hover:text-blue-500">
        <Github :size="16" /> GitHub
      </a>
    </div>
  </footer>
</template>
```

## Todo List

- [ ] Create useScripts composable
- [ ] Create useBookmarks composable
- [ ] Create useDarkMode composable
- [ ] Create ScriptCard component
- [ ] Create BookmarkCard component
- [ ] Create Header component with nav
- [ ] Create SearchBar component
- [ ] Create Footer component
- [ ] Create useUserscriptManager composable
- [ ] Create InstallBanner component
- [ ] Test dark mode toggle persistence
- [ ] Test userscript manager detection banner

## Success Criteria

- [ ] Composables fetch and cache data correctly
- [ ] ScriptCard displays all script info
- [ ] Install button links to raw .user.js file
- [ ] Dark mode persists across page reload
- [ ] Components responsive on mobile
- [ ] InstallBanner shows when no userscript manager detected
- [ ] Banner can be dismissed and stays dismissed

## Next Steps

Proceed to Phase 04: Pages & Routing
