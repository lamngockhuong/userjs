<script setup lang="ts">
import { Github } from 'lucide-vue-next'
</script>

<template>
  <footer class="mt-auto py-6 border-t border-slate-200 dark:border-slate-700">
    <div class="max-w-6xl mx-auto px-4 flex justify-between items-center text-sm text-slate-500">
      <span>Made with <span class="text-red-500 inline-block animate-heartbeat">❤</span> by <a href="https://khuong.dev" target="_blank" rel="noopener noreferrer" class="hover:text-blue-500">Khuong Dev</a></span>
      <a href="https://github.com/lamngockhuong/userjs" target="_blank" rel="noopener noreferrer"
         class="flex items-center gap-1 hover:text-blue-500"
         aria-label="View source on GitHub (opens in new tab)">
        <Github :size="16" /> GitHub
      </a>
    </div>
  </footer>
</template>
