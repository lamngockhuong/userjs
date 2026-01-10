import { ref, watchEffect } from 'vue'

const isDark = ref(false)
let initialized = false

export function useDarkMode() {
  // SSR-safe initialization - only run in browser
  if (!initialized && typeof window !== 'undefined') {
    try {
      isDark.value =
        localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
    } catch {
      // localStorage unavailable (private browsing)
    }
    initialized = true
  }

  watchEffect(() => {
    if (typeof window === 'undefined') return
    document.documentElement.classList.toggle('dark', isDark.value)
    try {
      localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    } catch {
      // localStorage quota exceeded or unavailable
    }
  })

  const toggle = () => {
    isDark.value = !isDark.value
  }

  return { isDark, toggle }
}
