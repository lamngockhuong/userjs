<script setup lang="ts">
import { computed } from 'vue'
import type { Bookmark } from '@/types/script'
import { ExternalLink } from 'lucide-vue-next'

const props = defineProps<{ bookmark: Bookmark }>()

// Source badge configuration
const sourceConfig = computed(() => {
  const configs = {
    greasyfork: { label: 'GreasyFork', class: 'bg-red-500/20 text-red-600 dark:text-red-400' },
    openuserjs: { label: 'OpenUserJS', class: 'bg-green-500/20 text-green-600 dark:text-green-400' },
    github: { label: 'GitHub', class: 'bg-slate-500/20 text-slate-600 dark:text-slate-400' },
    other: { label: 'Other', class: 'bg-purple-500/20 text-purple-600 dark:text-purple-400' },
  }
  return configs[props.bookmark.source ?? 'other']
})
</script>

<template>
  <a :href="bookmark.url"
     target="_blank"
     rel="noopener noreferrer"
     :aria-label="`${bookmark.name} (opens in new tab)`"
     class="group block p-4 rounded-lg border cursor-pointer transition-colors duration-200 overflow-hidden
            bg-white border-slate-200 hover:border-blue-500/50
            dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-500/50">
    <article>
      <div class="flex justify-between items-start gap-2">
        <h3 class="font-semibold text-lg text-slate-900 dark:text-slate-100 group-hover:text-blue-500 min-w-0 truncate">
          {{ bookmark.name }}
        </h3>
        <div class="flex shrink-0 gap-1.5">
          <span class="px-2 py-1 text-xs font-medium rounded"
                :class="sourceConfig.class">
            {{ sourceConfig.label }}
          </span>
          <span class="px-2 py-1 text-xs font-medium rounded capitalize
                       bg-blue-500/20 text-blue-600 dark:text-blue-400">
            {{ bookmark.category }}
          </span>
        </div>
      </div>
      <p v-if="bookmark.description" class="mt-2 text-slate-600 dark:text-slate-300 line-clamp-2">
        {{ bookmark.description }}
      </p>
      <!-- Tags -->
      <div v-if="bookmark.tags?.length" class="mt-2 flex flex-wrap gap-1.5">
        <span v-for="tag in bookmark.tags" :key="tag"
              class="px-1.5 py-0.5 text-xs rounded
                     bg-slate-100 text-slate-600
                     dark:bg-slate-700 dark:text-slate-300">
          #{{ tag }}
        </span>
      </div>
      <div class="mt-3 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
        <ExternalLink :size="14" />
        <span class="truncate">{{ bookmark.url.replace('https://', '') }}</span>
      </div>
    </article>
  </a>
</template>
