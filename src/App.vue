<script setup lang="ts">
import { RouterView } from 'vue-router'
import { usePreferredDark } from '@vueuse/core'
import { watchEffect } from 'vue'

const prefersDark = usePreferredDark()

watchEffect(() => {
  if (prefersDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-500 focus:text-white focus:rounded-lg"
    >
      Skip to main content
    </a>
    <RouterView />
  </div>
</template>
