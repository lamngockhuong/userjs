<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'

defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function clear() {
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="relative">
    <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="20" aria-hidden="true" />
    <input
      data-search-input
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      type="search"
      aria-label="Search scripts"
      placeholder="Search scripts... (press / to focus)"
      class="w-full pl-10 pr-10 py-2.5 rounded-lg border transition-colors
             bg-white border-slate-200 text-slate-900 placeholder-slate-400
             dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100
             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
    <button
      v-if="modelValue"
      @click="clear"
      type="button"
      aria-label="Clear search"
      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600
             dark:hover:text-slate-300 transition-colors"
    >
      <X :size="18" />
    </button>
  </div>
</template>
