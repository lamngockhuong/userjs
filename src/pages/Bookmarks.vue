<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useBookmarks } from '@/composables/useBookmarks'
import { useSearch } from '@/composables/useSearch'
import BookmarkCard from '@/components/BookmarkCard.vue'
import SearchBar from '@/components/SearchBar.vue'

const { bookmarks, loading, error, fetchBookmarks } = useBookmarks()

onMounted(fetchBookmarks)

// Fuzzy search on name, description, and category
const { query: search, results: filtered } = useSearch(
  bookmarks,
  ['name', 'description', 'category']
)

// Group filtered bookmarks by category
const groupedBookmarks = computed(() => {
  const groups: Record<string, typeof bookmarks.value> = {}
  for (const b of filtered.value) {
    const cat = b.category
    const group = groups[cat]
    if (group) {
      group.push(b)
    } else {
      groups[cat] = [b]
    }
  }
  return groups
})

const sortedCategories = computed(() =>
  Object.keys(groupedBookmarks.value).sort()
)
</script>

<template>
  <main id="main-content" class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h1 class="text-2xl font-bold">External Bookmarks</h1>
    </div>

    <SearchBar v-model="search" />

    <div v-if="error" class="text-center py-8 text-red-500">
      {{ error }}
    </div>

    <div v-else-if="loading" class="text-center py-8 text-slate-500">
      Loading bookmarks...
    </div>

    <template v-else>
      <section v-for="category in sortedCategories" :key="category" class="space-y-3" :aria-label="`${category} bookmarks`">
        <h2 class="text-lg font-semibold capitalize">{{ category }}</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <BookmarkCard
            v-for="bookmark in groupedBookmarks[category]"
            :key="bookmark.url"
            :bookmark="bookmark"
          />
        </div>
      </section>

      <p v-if="!filtered.length" class="text-center text-slate-500 py-8">
        {{ search ? 'No bookmarks found matching your search' : 'No bookmarks yet' }}
      </p>
    </template>
  </main>
</template>
