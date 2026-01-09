<script setup lang="ts">
import { onMounted } from 'vue'
import { useBookmarks } from '@/composables/useBookmarks'
import BookmarkCard from '@/components/BookmarkCard.vue'

const { bookmarks, loading, error, fetchBookmarks, categories } = useBookmarks()

onMounted(fetchBookmarks)
</script>

<template>
  <main id="main-content" class="space-y-8">
    <h1 class="text-2xl font-bold">External Bookmarks</h1>

    <div v-if="error" class="text-center py-8 text-red-500">
      {{ error }}
    </div>

    <div v-else-if="loading" class="text-center py-8 text-slate-500">
      Loading bookmarks...
    </div>

    <template v-else>
      <section v-for="category in categories" :key="category" class="space-y-3" :aria-label="`${category} bookmarks`">
        <h2 class="text-lg font-semibold capitalize">{{ category }}</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <BookmarkCard
            v-for="bookmark in bookmarks.filter(b => b.category === category)"
            :key="bookmark.url"
            :bookmark="bookmark"
          />
        </div>
      </section>

      <p v-if="!bookmarks.length" class="text-center text-slate-500 py-8">
        No bookmarks yet
      </p>
    </template>
  </main>
</template>
