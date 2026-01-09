import { ref, computed } from 'vue'
import type { Script } from '@/types/script'

const scripts = ref<Script[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const fetched = ref(false)

export function useScripts() {
  async function fetchScripts() {
    if (fetched.value || loading.value) return
    loading.value = true
    error.value = null
    try {
      const res = await fetch('/scripts-index.json')
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      const data = await res.json()
      if (!data || !Array.isArray(data.scripts)) {
        throw new Error('Invalid response structure')
      }
      scripts.value = data.scripts
      fetched.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load scripts'
    } finally {
      loading.value = false
    }
  }

  const categories = computed(() =>
    [...new Set(scripts.value.map(s => s.category))].sort()
  )

  const getByCategory = (cat: string) =>
    scripts.value.filter(s => s.category === cat)

  const getBySlug = (category: string, filename: string) =>
    scripts.value.find(s => s.category === category && s.filename === filename)

  return { scripts, loading, error, fetchScripts, categories, getByCategory, getBySlug }
}
