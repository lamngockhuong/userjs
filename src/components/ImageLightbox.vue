<script setup lang="ts">
import {
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

export interface LightboxImage {
  src: string
  alt: string
}

const props = defineProps<{
  images: LightboxImage[]
  initialIndex?: number
}>()

const emit = defineEmits<{
  close: []
}>()

const currentIndex = ref(props.initialIndex ?? 0)
const scale = ref(1)
const rotation = ref(0)
const isLoading = ref(true)
const hasError = ref(false)

const MIN_SCALE = 0.5
const MAX_SCALE = 3
const SCALE_STEP = 0.25

const currentImage = computed(() => props.images[currentIndex.value])
const hasMultiple = computed(() => props.images.length > 1)
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < props.images.length - 1)

const imageStyle = computed(() => ({
  transform: `scale(${scale.value}) rotate(${rotation.value}deg)`,
  transition: 'transform 0.2s ease-out',
}))

function zoomIn() {
  scale.value = Math.min(MAX_SCALE, scale.value + SCALE_STEP)
}

function zoomOut() {
  scale.value = Math.max(MIN_SCALE, scale.value - SCALE_STEP)
}

function rotate() {
  rotation.value = (rotation.value + 90) % 360
}

function resetView() {
  scale.value = 1
  rotation.value = 0
}

function goToPrev() {
  if (hasPrev.value) {
    currentIndex.value--
  }
}

function goToNext() {
  if (hasNext.value) {
    currentIndex.value++
  }
}

function handleWheel(e: WheelEvent) {
  e.preventDefault()
  if (e.deltaY < 0) {
    zoomIn()
  } else {
    zoomOut()
  }
}

function handleKeydown(e: KeyboardEvent) {
  switch (e.key) {
    case 'Escape':
      emit('close')
      break
    case 'ArrowLeft':
      goToPrev()
      break
    case 'ArrowRight':
      goToNext()
      break
    case '+':
    case '=':
      zoomIn()
      break
    case '-':
      zoomOut()
      break
    case 'r':
    case 'R':
      rotate()
      break
    case '0':
      resetView()
      break
  }
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}

function onImageLoad() {
  isLoading.value = false
}

function onImageError() {
  isLoading.value = false
  hasError.value = true
}

function downloadImage() {
  if (!currentImage.value) return
  const link = document.createElement('a')
  link.href = currentImage.value.src
  link.download = currentImage.value.alt || 'image'
  link.target = '_blank'
  link.click()
}

// Reset view state when navigating to different image
watch(currentIndex, () => {
  scale.value = 1
  rotation.value = 0
  isLoading.value = true
  hasError.value = false
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      role="dialog"
      aria-modal="true"
      :aria-label="currentImage?.alt || 'Image preview'"
      @click="handleBackdropClick"
      @wheel="handleWheel"
    >
      <!-- Toolbar -->
      <div
        class="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm"
      >
        <button
          type="button"
          class="p-2 rounded-md hover:bg-white/20 text-white transition-colors"
          aria-label="Zoom in"
          title="Zoom in (+)"
          @click="zoomIn"
        >
          <ZoomIn :size="20" />
        </button>
        <span class="text-white text-sm min-w-[4ch] text-center">{{ Math.round(scale * 100) }}%</span>
        <button
          type="button"
          class="p-2 rounded-md hover:bg-white/20 text-white transition-colors"
          aria-label="Zoom out"
          title="Zoom out (-)"
          @click="zoomOut"
        >
          <ZoomOut :size="20" />
        </button>
        <div class="w-px h-6 bg-white/30" />
        <button
          type="button"
          class="p-2 rounded-md hover:bg-white/20 text-white transition-colors"
          aria-label="Rotate"
          title="Rotate (R)"
          @click="rotate"
        >
          <RotateCw :size="20" />
        </button>
        <button
          type="button"
          class="p-2 rounded-md hover:bg-white/20 text-white transition-colors"
          aria-label="Download image"
          title="Download"
          @click="downloadImage"
        >
          <Download :size="20" />
        </button>
        <!-- Image counter -->
        <template v-if="hasMultiple">
          <div class="w-px h-6 bg-white/30" />
          <span class="text-white text-sm px-2">{{ currentIndex + 1 }} / {{ images.length }}</span>
        </template>
      </div>

      <!-- Close button -->
      <button
        type="button"
        class="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 text-white transition-colors"
        aria-label="Close (Escape)"
        title="Close (Escape)"
        @click="$emit('close')"
      >
        <X :size="24" />
      </button>

      <!-- Previous button -->
      <button
        v-if="hasMultiple"
        type="button"
        class="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full text-white transition-colors"
        :class="hasPrev ? 'hover:bg-white/20 cursor-pointer' : 'opacity-30 cursor-not-allowed'"
        :disabled="!hasPrev"
        aria-label="Previous image (←)"
        title="Previous (←)"
        @click="goToPrev"
      >
        <ChevronLeft :size="32" />
      </button>

      <!-- Next button -->
      <button
        v-if="hasMultiple"
        type="button"
        class="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full text-white transition-colors"
        :class="hasNext ? 'hover:bg-white/20 cursor-pointer' : 'opacity-30 cursor-not-allowed'"
        :disabled="!hasNext"
        aria-label="Next image (→)"
        title="Next (→)"
        @click="goToNext"
      >
        <ChevronRight :size="32" />
      </button>

      <!-- Loading state -->
      <div v-if="isLoading" class="text-white">Loading...</div>

      <!-- Error state -->
      <div v-else-if="hasError" class="text-red-400">Failed to load image</div>

      <!-- Image -->
      <img
        v-if="currentImage"
        v-show="!isLoading && !hasError"
        :src="currentImage.src"
        :alt="currentImage.alt"
        class="max-w-[90vw] max-h-[85vh] object-contain select-none"
        :style="imageStyle"
        draggable="false"
        @load="onImageLoad"
        @error="onImageError"
      />

      <!-- Keyboard hints -->
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs text-center">
        <template v-if="hasMultiple">
          <kbd class="px-1 py-0.5 bg-white/10 rounded">←</kbd>
          <kbd class="px-1 py-0.5 bg-white/10 rounded">→</kbd> navigate ·
        </template>
        Scroll to zoom ·
        <kbd class="px-1 py-0.5 bg-white/10 rounded">ESC</kbd> close ·
        <kbd class="px-1 py-0.5 bg-white/10 rounded">0</kbd> reset
      </div>
    </div>
  </Teleport>
</template>
