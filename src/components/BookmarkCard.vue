<script setup lang="ts">
import type { Bookmark } from '@/types/script'
import { ExternalLink } from 'lucide-vue-next'

defineProps<{ bookmark: Bookmark }>()
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
        <span class="shrink-0 px-2 py-1 text-xs font-medium rounded
                     bg-blue-500/20 text-blue-600 dark:text-blue-400">
          {{ bookmark.category }}
        </span>
      </div>
      <p class="mt-2 text-slate-600 dark:text-slate-300 line-clamp-2">
        {{ bookmark.description }}
      </p>
      <div class="mt-4 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
        <ExternalLink :size="14" />
        <span class="truncate">{{ bookmark.url.replace('https://', '') }}</span>
      </div>
    </article>
  </a>
</template>
