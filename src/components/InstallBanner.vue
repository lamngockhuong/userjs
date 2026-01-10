<script setup lang="ts">
import { Download, ExternalLink, X } from 'lucide-vue-next'
import { useUserscriptManager } from '@/composables/useUserscriptManager'

const { managers, showBanner, hideBanner } = useUserscriptManager()
</script>

<template>
  <div v-if="showBanner"
       class="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
    <div class="max-w-6xl mx-auto px-4 py-3">
      <div class="flex items-start gap-3">
        <Download :size="20" class="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div class="flex-1">
          <p class="text-sm text-amber-800 dark:text-amber-200 font-medium">
            Userscript manager required
          </p>
          <p class="text-sm text-amber-700 dark:text-amber-300 mt-1">
            Install one of these extensions to use scripts from this store:
          </p>
          <div class="flex flex-wrap gap-3 mt-2">
            <a v-for="manager in managers"
               :key="manager.name"
               :href="manager.installUrl"
               target="_blank"
               rel="noopener noreferrer"
               class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg
                      bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700
                      text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/30
                      transition-colors">
              <ExternalLink :size="14" />
              {{ manager.name }}
            </a>
          </div>
        </div>
        <button @click="hideBanner"
                class="p-1 rounded hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors cursor-pointer"
                title="Dismiss"
                aria-label="Dismiss banner">
          <X :size="18" class="text-amber-600 dark:text-amber-400" />
        </button>
      </div>
    </div>
  </div>
</template>
