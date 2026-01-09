<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useScripts } from '@/composables/useScripts'
import { BASE_TITLE } from '@/router'
import { Download, ExternalLink, ArrowLeft, History, Code, Copy, Check, FileText } from 'lucide-vue-next'
import { codeToHtml } from 'shiki'
import { marked } from 'marked'

const route = useRoute()
const { fetchScripts, getBySlug } = useScripts()

// Cache TTL: 1 hour
const CACHE_TTL_MS = 60 * 60 * 1000

interface Commit {
  sha: string
  message: string
  date: string
}

interface CachedData {
  commits: Commit[]
  timestamp: number
}

const commits = ref<Commit[]>([])
const loadingHistory = ref(false)
const historyError = ref<string | null>(null)
const showCode = ref(false)
const sourceCode = ref('')
const highlightedCode = ref('')
const loadingCode = ref(false)
const codeCopied = ref(false)
const copyError = ref(false)
const readmeHtml = ref('')
const loadingReadme = ref(false)

// Validate route params (alphanumeric, dash, underscore, dot only)
const isValidParam = (param: string) => /^[\w\-.]+$/.test(param)

const category = computed(() => {
  const param = route.params.category as string
  return isValidParam(param) ? param : ''
})

const filename = computed(() => {
  const param = route.params.filename as string
  return isValidParam(param) ? param : ''
})

onMounted(async () => {
  await fetchScripts()
  fetchGitHistory()
})

const script = computed(() => {
  if (!category.value || !filename.value) return undefined
  return getBySlug(category.value, filename.value)
})

// Update page title when script loads
watch(script, (s) => {
  document.title = s ? `${s.name} - ${BASE_TITLE}` : `Script - ${BASE_TITLE}`
  // Fetch readme if available
  if (s?.readmeUrl) {
    fetchReadme(s.readmeUrl)
  }
}, { immediate: true })

async function fetchReadme(remoteUrl: string) {
  if (!script.value) return

  loadingReadme.value = true
  readmeHtml.value = ''

  // Local fallback: same filename but .md extension
  const localUrl = `/scripts/${script.value.category}/${script.value.filename.replace(/\.user\.js$/, '.md')}`

  try {
    // Try remote first, fallback to local for dev
    let res = await fetch(remoteUrl)
    if (!res.ok) {
      res = await fetch(localUrl)
    }
    if (res.ok) {
      const markdown = await res.text()
      const html = await marked(markdown)
      readmeHtml.value = html
    }
  } catch {
    // Readme fetch failed - silently ignore
  } finally {
    loadingReadme.value = false
  }
}

async function fetchGitHistory() {
  if (!script.value) return
  loadingHistory.value = true
  historyError.value = null

  try {
    const cacheKey = `history-${script.value.category}-${script.value.filename}`

    // Check localStorage cache with TTL
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const data: CachedData = JSON.parse(cached)
          const isExpired = Date.now() - data.timestamp > CACHE_TTL_MS
          if (!isExpired && Array.isArray(data.commits)) {
            commits.value = data.commits
            loadingHistory.value = false
            return
          }
          // Remove expired cache
          localStorage.removeItem(cacheKey)
        }
      } catch {
        // localStorage unavailable or invalid data
      }
    }

    const res = await fetch(
      `https://api.github.com/repos/lamngockhuong/userjs/commits?path=scripts/${script.value.category}/${script.value.filename}&per_page=10`
    )

    // Handle rate limiting
    if (res.status === 403) {
      historyError.value = 'GitHub API rate limit exceeded. Try again later.'
      return
    }

    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        commits.value = data.map((c: { sha: string; commit: { message: string; author: { date: string } } }) => ({
          sha: c.sha.slice(0, 7),
          message: c.commit.message?.split('\n')[0] ?? '',
          date: new Date(c.commit.author.date).toLocaleDateString(),
        }))

        // Cache with timestamp
        if (typeof window !== 'undefined') {
          try {
            const cacheData: CachedData = {
              commits: commits.value,
              timestamp: Date.now()
            }
            localStorage.setItem(cacheKey, JSON.stringify(cacheData))
          } catch {
            // localStorage quota exceeded
          }
        }
      }
    }
  } catch {
    // Network error - commits will remain empty
  } finally {
    loadingHistory.value = false
  }
}

async function toggleCodePreview() {
  showCode.value = !showCode.value
  if (showCode.value && !sourceCode.value && script.value) {
    loadingCode.value = true
    try {
      // Try remote URL first, fallback to local for dev
      const localUrl = `/scripts/${script.value.category}/${script.value.filename}`
      let res = await fetch(script.value.installUrl)
      if (!res.ok) {
        res = await fetch(localUrl)
      }
      if (!res.ok) throw new Error('Failed to fetch')
      sourceCode.value = await res.text()

      // Generate highlighted HTML via Shiki (trusted source)
      const html = await codeToHtml(sourceCode.value, {
        lang: 'javascript',
        theme: 'github-dark'
      })

      // Basic validation: Shiki output starts with <pre
      if (html.startsWith('<pre')) {
        highlightedCode.value = html
      } else {
        throw new Error('Invalid highlight output')
      }
    } catch {
      sourceCode.value = '// Failed to load source code'
      highlightedCode.value = '<pre class="shiki"><code>// Failed to load source code</code></pre>'
    } finally {
      loadingCode.value = false
    }
  }
}

async function copyCode() {
  try {
    if (!navigator.clipboard) throw new Error('Clipboard not supported')
    await navigator.clipboard.writeText(sourceCode.value)
    codeCopied.value = true
    copyError.value = false
    setTimeout(() => { codeCopied.value = false }, 2000)
  } catch {
    copyError.value = true
    setTimeout(() => { copyError.value = false }, 2000)
  }
}
</script>

<template>
  <main id="main-content">
    <div v-if="script" class="max-w-4xl mx-auto space-y-6">
      <router-link to="/" class="inline-flex items-center gap-1 text-blue-500 hover:underline">
        <ArrowLeft :size="16" /> Back to scripts
      </router-link>

      <article class="p-6 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700">
        <div class="flex justify-between items-start flex-wrap gap-2">
          <h1 class="text-2xl font-bold">{{ script.name }}</h1>
          <span class="px-2 py-1 text-sm font-mono bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded">
            v{{ script.version }}
          </span>
        </div>

        <p class="mt-2 text-slate-600 dark:text-slate-300">{{ script.description }}</p>
        <p class="mt-1 text-sm text-slate-500">by {{ script.author }}</p>

        <div class="mt-4 flex flex-wrap gap-2">
          <span v-for="(match, idx) in script.matches" :key="`${match}-${idx}`"
                class="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 rounded">
            {{ match }}
          </span>
        </div>

        <div class="mt-6 flex flex-wrap gap-3">
          <a :href="script.installUrl"
             class="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
             :aria-label="`Install ${script.name}`">
            <Download :size="18" /> Install Script
          </a>
          <button @click="toggleCodePreview"
                  class="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer
                         hover:bg-slate-100 dark:hover:bg-slate-700 dark:border-slate-600 transition-colors">
            <Code :size="18" /> {{ showCode ? 'Hide Code' : 'View Code' }}
          </button>
          <a :href="script.sourceUrl" target="_blank" rel="noopener noreferrer"
             class="flex items-center gap-2 px-4 py-2 border rounded-lg
                    hover:bg-slate-100 dark:hover:bg-slate-700 dark:border-slate-600 transition-colors"
             aria-label="View on GitHub (opens in new tab)">
            <ExternalLink :size="18" /> GitHub
          </a>
        </div>
      </article>

      <!-- Readme Section (optional) -->
      <section v-if="loadingReadme || readmeHtml"
               class="p-6 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700"
               aria-label="Script documentation">
        <h2 class="flex items-center gap-2 text-lg font-semibold mb-4">
          <FileText :size="20" /> Documentation
        </h2>
        <div v-if="loadingReadme" class="text-slate-500">Loading documentation...</div>
        <div v-else
             class="prose prose-slate dark:prose-invert max-w-none
                    prose-headings:font-semibold prose-a:text-blue-500
                    prose-img:rounded-lg prose-img:shadow-md
                    prose-code:bg-slate-100 prose-code:dark:bg-slate-700 prose-code:px-1 prose-code:rounded"
             v-html="readmeHtml" />
      </section>

      <!-- Code Preview Panel -->
      <section v-if="showCode" class="border rounded-lg dark:border-slate-700 overflow-hidden" aria-label="Source code preview">
        <div class="flex justify-between items-center px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b dark:border-slate-700">
          <span class="text-sm font-medium font-mono">{{ script.filename }}</span>
          <button @click="copyCode"
                  :aria-label="codeCopied ? 'Code copied' : copyError ? 'Copy failed' : 'Copy code'"
                  class="flex items-center gap-1 px-2 py-1 text-sm rounded cursor-pointer
                         hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <Check v-if="codeCopied" :size="14" class="text-green-500" />
            <Copy v-else :size="14" :class="copyError ? 'text-red-500' : ''" />
            {{ codeCopied ? 'Copied!' : copyError ? 'Failed' : 'Copy' }}
          </button>
        </div>
        <div v-if="loadingCode" class="p-4 text-slate-500">Loading source code...</div>
        <div v-else class="overflow-x-auto max-h-96 text-sm [&_pre]:p-4 [&_pre]:m-0" v-html="highlightedCode" />
      </section>

      <!-- Version History -->
      <section class="p-6 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700" aria-label="Version history">
        <h2 class="flex items-center gap-2 text-lg font-semibold mb-4">
          <History :size="20" /> Version History
        </h2>
        <div v-if="loadingHistory" class="text-slate-500">Loading history...</div>
        <div v-else-if="historyError" class="text-amber-600 dark:text-amber-400 text-sm">{{ historyError }}</div>
        <ul v-else class="space-y-2">
          <li v-for="commit in commits" :key="commit.sha" class="flex gap-3 text-sm">
            <code class="text-blue-500 font-mono">{{ commit.sha }}</code>
            <span class="flex-1 truncate">{{ commit.message }}</span>
            <span class="text-slate-500 shrink-0">{{ commit.date }}</span>
          </li>
          <li v-if="!commits.length" class="text-slate-500">No history available</li>
        </ul>
      </section>
    </div>

    <div v-else class="text-center py-12">
      <p class="text-xl text-slate-500 mb-4">Script not found</p>
      <router-link to="/" class="text-blue-500 hover:underline">Back to home</router-link>
    </div>
  </main>
</template>
