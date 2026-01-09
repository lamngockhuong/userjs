<script setup lang="ts">
import { ref } from 'vue'
import type { Script } from '@/types/script'
import { Download, ExternalLink, Copy, Check } from 'lucide-vue-next'

defineProps<{ script: Script }>()

const copied = ref(false)
const copyError = ref(false)

async function copyUrl(url: string) {
  try {
    if (!navigator.clipboard) {
      throw new Error('Clipboard API not supported')
    }
    await navigator.clipboard.writeText(url)
    copied.value = true
    copyError.value = false
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    copyError.value = true
    setTimeout(() => { copyError.value = false }, 2000)
  }
}
</script>

<template>
  <article
    class="group p-4 rounded-lg border cursor-pointer transition-colors duration-200
           bg-white border-slate-200 hover:border-blue-500/50
           dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-500/50"
    :aria-label="`Script: ${script.name}`">
    <div class="flex justify-between items-start">
      <div>
        <h3 class="font-semibold text-lg text-slate-900 dark:text-slate-100">
          {{ script.name }}
        </h3>
        <p class="text-sm font-mono text-slate-500 dark:text-slate-400">
          v{{ script.version }}
        </p>
      </div>
      <span class="px-2 py-1 text-xs font-medium rounded
                   bg-blue-500/20 text-blue-600 dark:text-blue-400">
        {{ script.category }}
      </span>
    </div>
    <p class="mt-2 text-slate-600 dark:text-slate-300 line-clamp-2">
      {{ script.description }}
    </p>
    <div class="mt-3 flex flex-wrap gap-1">
      <span v-for="(match, idx) in script.matches.slice(0, 2)" :key="`${match}-${idx}`"
            class="px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-600
                   dark:bg-slate-700 dark:text-slate-300">
        {{ match.replace('https://', '').replace('/*', '') }}
      </span>
    </div>
    <div class="mt-4 flex gap-2">
      <a :href="script.installUrl"
         @click.stop
         class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg
                bg-green-500 text-white hover:bg-green-600 transition-colors"
         :aria-label="`Install ${script.name}`">
        <Download :size="16" /> Install
      </a>
      <button @click.stop="copyUrl(script.installUrl)"
              :aria-label="copied ? 'URL copied' : copyError ? 'Copy failed' : 'Copy install URL'"
              class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg
                     border border-slate-300 hover:bg-slate-100 cursor-pointer
                     dark:border-slate-600 dark:hover:bg-slate-700 transition-colors">
        <Check v-if="copied" :size="16" class="text-green-500" />
        <Copy v-else :size="16" :class="copyError ? 'text-red-500' : ''" />
        {{ copied ? 'Copied!' : copyError ? 'Failed' : 'Copy URL' }}
      </button>
      <a :href="script.sourceUrl" target="_blank" rel="noopener noreferrer"
         @click.stop
         class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg
                border border-slate-300 hover:bg-slate-100
                dark:border-slate-600 dark:hover:bg-slate-700 transition-colors"
         :aria-label="`View source code for ${script.name} (opens in new tab)`">
        <ExternalLink :size="16" /> Source
      </a>
    </div>
  </article>
</template>
