<script setup lang="ts">
import { Github, ExternalLink, Code2, Heart } from 'lucide-vue-next'

const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="mt-auto border-t border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50">
    <div class="max-w-6xl mx-auto px-4 py-8">
      <!-- Main Footer Content -->
      <div class="flex flex-col sm:flex-row justify-between items-center gap-6">
        <!-- Brand Section -->
        <div class="flex flex-col items-center sm:items-start gap-2">
          <div class="flex items-center gap-2">
            <Code2 :size="20" class="text-blue-500" />
            <span class="font-semibold text-slate-700 dark:text-slate-200">UserJS Store</span>
          </div>
          <p class="text-sm text-slate-500 dark:text-slate-400 text-center sm:text-left">
            Personal userscript collection for browser automation
          </p>
        </div>

        <!-- Links Section -->
        <div class="flex items-center gap-4">
          <a href="https://github.com/lamngockhuong/userjs"
             target="_blank"
             rel="noopener noreferrer"
             class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    text-slate-600 dark:text-slate-300
                    hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
             aria-label="View source on GitHub (opens in new tab)">
            <Github :size="18" />
            <span>Source</span>
            <ExternalLink :size="12" class="opacity-50" />
          </a>
          <a href="https://khuong.dev"
             target="_blank"
             rel="noopener noreferrer"
             class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    text-slate-600 dark:text-slate-300
                    hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
             aria-label="Visit Khuong Dev website (opens in new tab)">
            <span>My Corner</span>
            <ExternalLink :size="12" class="opacity-50" />
          </a>
        </div>
      </div>

      <!-- Divider -->
      <div class="my-6 border-t border-slate-200 dark:border-slate-800" />

      <!-- Copyright Section -->
      <div class="flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <p class="flex items-center gap-1">
          Made with <Heart :size="14" class="text-red-500 animate-heartbeat" /> by
          <a href="https://khuong.dev"
             target="_blank"
             rel="noopener noreferrer"
             class="font-medium text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
            Khuong Dev
          </a>
        </p>
        <p>&copy; {{ currentYear }} All rights reserved</p>
      </div>
    </div>
  </footer>
</template>
