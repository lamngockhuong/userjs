<script setup lang="ts">
import { useDarkMode } from '@/composables/useDarkMode'
import { Moon, Sun } from 'lucide-vue-next'

const { isDark, toggle } = useDarkMode()
</script>

<template>
  <header class="sticky top-0 z-10 h-16 border-b backdrop-blur-sm
                 bg-white/80 border-slate-200
                 dark:bg-slate-900/80 dark:border-slate-700">
    <div class="max-w-6xl mx-auto px-4 h-full flex justify-between items-center">
      <router-link to="/" class="text-xl font-bold text-slate-900 dark:text-slate-100">
        UserJS Store
      </router-link>
      <nav class="flex items-center gap-6">
        <router-link to="/"
                     class="text-slate-600 hover:text-blue-500 dark:text-slate-300
                            dark:hover:text-blue-400 transition-colors"
                     active-class="text-blue-500 dark:text-blue-400">
          Scripts
        </router-link>
        <router-link to="/bookmarks"
                     class="text-slate-600 hover:text-blue-500 dark:text-slate-300
                            dark:hover:text-blue-400 transition-colors"
                     active-class="text-blue-500 dark:text-blue-400">
          Bookmarks
        </router-link>
        <button @click="toggle"
                class="p-2 rounded-lg cursor-pointer transition-colors
                       hover:bg-slate-100 dark:hover:bg-slate-800"
                :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
          <Sun v-if="isDark" :size="20" class="text-slate-400" />
          <Moon v-else :size="20" class="text-slate-600" />
        </button>
      </nav>
    </div>
  </header>
</template>
