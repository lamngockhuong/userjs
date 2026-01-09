<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const category = computed(() => {
  const param = route.params.category
  return typeof param === 'string' ? param : ''
})

const name = computed(() => {
  const param = route.params.name
  return typeof param === 'string' ? param : ''
})
</script>

<template>
  <main id="main-content" class="max-w-6xl mx-auto px-4 py-6">
    <h1 class="text-2xl font-bold mb-4">Script Detail</h1>
    <p class="text-slate-400">Category: {{ category }}</p>
    <p class="text-slate-400">Name: {{ name }}</p>
  </main>
</template>
