<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useScripts } from '@/composables/useScripts'
import ScriptCard from '@/components/ScriptCard.vue'
import SearchBar from '@/components/SearchBar.vue'

const { scripts, loading, error, fetchScripts, categories } = useScripts()
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
      s.description.toLowerCase().includes(q) ||
      s.matches.some(m => m.toLowerCase().includes(q))
    )
  }
  return result
})
</script>

<template>
  <main id="main-content" class="space-y-6">
    <div class="flex flex-col sm:flex-row gap-4">
      <SearchBar v-model="search" class="flex-1" />
      <select v-model="selectedCategory"
              aria-label="Filter by category"
              class="px-4 py-2.5 border rounded-lg cursor-pointer transition-colors
                     bg-white border-slate-200 text-slate-900
                     dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100
                     focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">All Categories</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
    </div>

    <div v-if="error" class="text-center py-8 text-red-500">
      {{ error }}
    </div>

    <div v-else-if="loading" class="text-center py-8 text-slate-500">
      Loading scripts...
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <router-link v-for="script in filtered" :key="script.filename"
                   :to="`/script/${script.category}/${script.filename}`">
        <ScriptCard :script="script" />
      </router-link>
    </div>

    <p v-if="!loading && !error && !filtered.length" class="text-center text-slate-500 py-8">
      No scripts found
    </p>
  </main>
</template>
