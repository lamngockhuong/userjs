<script setup lang="ts">
import { ArrowUpDown } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import BookmarkCard from '@/components/BookmarkCard.vue'
import SearchBar from '@/components/SearchBar.vue'
import { useBookmarks } from '@/composables/useBookmarks'
import { useSearch } from '@/composables/useSearch'

const { bookmarks, loading, error, fetchBookmarks } = useBookmarks()

onMounted(fetchBookmarks)

// Fuzzy search on name, description, category, and tags
const { query: search, results: searched } = useSearch(bookmarks, [
  'name',
  'description',
  'category',
  'tags',
])

// Sort options
type SortOption = 'name' | 'category' | 'source'
const sortBy = ref<SortOption>('category')

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'category', label: 'Category' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'source', label: 'Source' },
]

// Sorted and filtered bookmarks
const sorted = computed(() => {
  const items = [...searched.value]
  switch (sortBy.value) {
    case 'name':
      return items.sort((a, b) => a.name.localeCompare(b.name))
    case 'source':
      return items.sort((a, b) =>
        (a.source ?? 'other').localeCompare(b.source ?? 'other'),
      )
    default:
      return items.sort((a, b) => a.category.localeCompare(b.category))
  }
})

// Group bookmarks by current sort key
const groupedBookmarks = computed(() => {
  const groups: Record<string, typeof bookmarks.value> = {}
  const groupKey = sortBy.value === 'name' ? null : sortBy.value

  for (const b of sorted.value) {
    const key = groupKey ? (b[groupKey] ?? 'other') : 'all'
    const group = groups[key]
    if (group) {
      group.push(b)
    } else {
      groups[key] = [b]
    }
  }
  return groups
})

const sortedGroupKeys = computed(() =>
  Object.keys(groupedBookmarks.value).sort(),
)

// Format group label
const formatGroupLabel = (key: string): string => {
  if (sortBy.value === 'source') {
    const labels: Record<string, string> = {
      greasyfork: 'GreasyFork',
      openuserjs: 'OpenUserJS',
      github: 'GitHub',
      other: 'Other',
    }
    return labels[key] ?? key
  }
  return key
}
</script>

<template>
  <main id="main-content" class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h1 class="text-2xl font-bold">External Bookmarks</h1>
    </div>

    <!-- Search and Sort controls -->
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <SearchBar v-model="search" />
      </div>
      <div class="flex items-center gap-2">
        <ArrowUpDown :size="16" class="text-slate-500" />
        <select v-model="sortBy"
                class="px-3 py-2 text-sm rounded-lg border
                       bg-white border-slate-200 text-slate-700
                       dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50">
          <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="error" class="text-center py-8 text-red-500">
      {{ error }}
    </div>

    <div v-else-if="loading" class="text-center py-8 text-slate-500">
      Loading bookmarks...
    </div>

    <template v-else>
      <!-- Grouped view (category/source) -->
      <template v-if="sortBy !== 'name'">
        <section v-for="groupKey in sortedGroupKeys" :key="groupKey" class="space-y-3" :aria-label="`${formatGroupLabel(groupKey)} bookmarks`">
          <h2 class="text-lg font-semibold capitalize">{{ formatGroupLabel(groupKey) }}</h2>
          <div class="grid gap-4 md:grid-cols-2">
            <BookmarkCard
              v-for="bookmark in groupedBookmarks[groupKey]"
              :key="bookmark.url"
              :bookmark="bookmark"
            />
          </div>
        </section>
      </template>

      <!-- Flat list (name sort) -->
      <div v-else class="grid gap-4 md:grid-cols-2">
        <BookmarkCard
          v-for="bookmark in sorted"
          :key="bookmark.url"
          :bookmark="bookmark"
        />
      </div>

      <p v-if="!sorted.length" class="text-center text-slate-500 py-8">
        {{ search ? 'No bookmarks found matching your search' : 'No bookmarks yet' }}
      </p>
    </template>
  </main>
</template>
