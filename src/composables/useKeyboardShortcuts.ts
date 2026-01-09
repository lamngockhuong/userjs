import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDarkMode } from './useDarkMode'

export function useKeyboardShortcuts() {
  const router = useRouter()
  const { toggle } = useDarkMode()

  function handleKeydown(e: KeyboardEvent) {
    // Ignore if typing in input/textarea
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      // Allow Escape to blur input
      if (e.key === 'Escape') {
        (e.target as HTMLElement).blur()
      }
      return
    }

    // Ignore Ctrl/Meta/Alt combinations (browser shortcuts)
    if (e.ctrlKey || e.metaKey || e.altKey) return

    // Slash for search (common convention, no modifier needed)
    if (e.key === '/') {
      e.preventDefault()
      document.querySelector<HTMLInputElement>('[data-search-input]')?.focus()
      return
    }

    // Shift + key for navigation shortcuts (safer, won't conflict with typing)
    if (e.shiftKey) {
      switch (e.key) {
        case 'G':
          // Shift+G: Go to home
          router.push('/')
          break
        case 'B':
          // Shift+B: Go to bookmarks
          router.push('/bookmarks')
          break
        case 'D':
          // Shift+D: Toggle dark mode
          toggle()
          break
        case '?':
          // Shift+?: Show shortcuts help
          console.log('Keyboard shortcuts: / search, Shift+G home, Shift+B bookmarks, Shift+D dark mode, Esc blur')
          break
      }
    }
  }

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeydown)
    }
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeydown)
    }
  })
}
