import Fuse, { type IFuseOptions } from 'fuse.js'
import { computed, onUnmounted, type Ref, ref, watch } from 'vue'

const DEBOUNCE_MS = 300

/**
 * Reusable fuzzy search composable using Fuse.js
 * @param items - Reactive array of items to search
 * @param keys - Fields to search (e.g., ['name', 'description'])
 * @param options - Additional Fuse.js options
 */
export function useSearch<T>(
  items: Ref<T[]>,
  keys: string[],
  options?: Partial<IFuseOptions<T>>,
) {
  const query = ref('')
  const debouncedQuery = ref('')

  // Debounce search input
  let timeout: ReturnType<typeof setTimeout> | null = null
  watch(query, (val) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      debouncedQuery.value = val
    }, DEBOUNCE_MS)
  })

  // Clear timeout on unmount to prevent memory leak
  onUnmounted(() => {
    if (timeout) clearTimeout(timeout)
  })

  // Create Fuse instance (recreate when items change)
  const fuse = computed(() => {
    try {
      return new Fuse(items.value, {
        keys,
        threshold: 0.3,
        includeScore: true,
        ignoreLocation: true,
        ...options,
      })
    } catch {
      // Return empty Fuse instance on error
      return new Fuse([], { keys })
    }
  })

  // Search results with error boundary
  const results = computed(() => {
    const q = debouncedQuery.value.trim()
    if (!q) return items.value
    try {
      return fuse.value.search(q).map((r) => r.item)
    } catch {
      return items.value
    }
  })

  return { query, debouncedQuery, results }
}
