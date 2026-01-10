import { computed, ref } from 'vue'

export interface UserscriptManager {
  name: string
  installUrl: string
}

const STORAGE_KEY = 'usm-banner-hidden'

const managers: UserscriptManager[] = [
  { name: 'Tampermonkey', installUrl: 'https://www.tampermonkey.net/' },
  { name: 'Violentmonkey', installUrl: 'https://violentmonkey.github.io/' },
  { name: 'Greasemonkey', installUrl: 'https://www.greasespot.net/' },
]

// Read initial state from localStorage immediately (SSR-safe)
function getInitialState(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

const bannerHidden = ref(getInitialState())

// Computed for reactive template binding
const showBanner = computed(() => !bannerHidden.value)

/**
 * Hide banner permanently.
 * Call this when user dismisses banner OR clicks install on any script.
 */
function hideBanner() {
  bannerHidden.value = true
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // localStorage quota exceeded or unavailable
    }
  }
}

export function useUserscriptManager() {
  return { managers, bannerHidden, showBanner, hideBanner }
}
