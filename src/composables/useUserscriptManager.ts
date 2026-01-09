import { ref, onMounted } from 'vue'

export interface UserscriptManager {
  name: string
  installUrl: string
}

const managers: UserscriptManager[] = [
  { name: 'Tampermonkey', installUrl: 'https://www.tampermonkey.net/' },
  { name: 'Violentmonkey', installUrl: 'https://violentmonkey.github.io/' },
  { name: 'Greasemonkey', installUrl: 'https://www.greasespot.net/' }
]

const dismissed = ref(false)

export function useUserscriptManager() {
  onMounted(() => {
    // SSR-safe localStorage access
    if (typeof window !== 'undefined') {
      try {
        dismissed.value = localStorage.getItem('usm-banner-dismissed') === 'true'
      } catch {
        // localStorage unavailable
      }
    }
  })

  function dismissBanner() {
    dismissed.value = true
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('usm-banner-dismissed', 'true')
      } catch {
        // localStorage quota exceeded or unavailable
      }
    }
  }

  function showBanner() {
    return !dismissed.value
  }

  return { managers, dismissed, dismissBanner, showBanner }
}
