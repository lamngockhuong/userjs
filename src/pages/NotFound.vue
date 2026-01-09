<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
</script>

<template>
  <main id="main-content" class="flex flex-col items-center justify-center py-16 text-center">
    <h1 class="text-6xl font-bold text-slate-300 dark:text-slate-700">404</h1>
    <p class="mt-4 text-xl text-slate-600 dark:text-slate-400">Page not found</p>
    <p class="mt-2 text-slate-500">The page you're looking for doesn't exist.</p>
    <router-link
      to="/"
      class="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
      <ArrowLeft :size="18" /> Back to home
    </router-link>
  </main>
</template>
