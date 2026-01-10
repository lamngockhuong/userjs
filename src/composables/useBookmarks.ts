import { computed, ref } from 'vue'
import type { Bookmark } from '@/types/script'

const bookmarks = ref<Bookmark[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const fetched = ref(false)

export function useBookmarks() {
  async function fetchBookmarks() {
    if (fetched.value || loading.value) return
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`/scripts-index.json?v=${__BUILD_TIME__}`)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      const data = await res.json()
      if (!data || !Array.isArray(data.bookmarks)) {
        throw new Error('Invalid response structure')
      }
      bookmarks.value = data.bookmarks
      fetched.value = true
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to load bookmarks'
    } finally {
      loading.value = false
    }
  }

  const categories = computed(() =>
    [...new Set(bookmarks.value.map((b) => b.category))].sort(),
  )

  return { bookmarks, loading, error, fetchBookmarks, categories }
}
