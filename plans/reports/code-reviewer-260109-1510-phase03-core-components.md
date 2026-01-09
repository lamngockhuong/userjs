# Code Review Report: Phase 03 Core Components

**Date:** 2026-01-09
**Reviewer:** code-reviewer (ab950db)
**Score:** 7.5/10

---

## Executive Summary

Phase 03 implements solid foundation for core components/composables with Vue 3 Composition API. TypeScript passes without errors, build succeeds. Code demonstrates good understanding of Vue patterns, accessibility basics, and dark mode support.

**Major concerns:** Missing error handling in composables, potential XSS vulnerability in template interpolation, no response validation, localStorage SSR incompatibility, accessibility gaps.

---

## Scope

### Files Reviewed (11)
- `src/composables/useScripts.ts`
- `src/composables/useBookmarks.ts`
- `src/composables/useDarkMode.ts`
- `src/composables/useUserscriptManager.ts`
- `src/components/ScriptCard.vue`
- `src/components/BookmarkCard.vue`
- `src/components/Header.vue`
- `src/components/SearchBar.vue`
- `src/components/Footer.vue`
- `src/components/InstallBanner.vue`
- `src/App.vue`

### Lines Analyzed
~470 LOC

### Build Status
✅ TypeScript: Pass
✅ Build: Pass
✅ Bundle: 95.22 kB (37.36 kB gzipped)

---

## Critical Issues

### 1. Missing Response Validation (SECURITY)
**Location:** `useScripts.ts:14`, `useBookmarks.ts:10`

**Issue:** No validation of JSON response structure. Malicious/corrupted JSON can break app or enable XSS.

```typescript
// Current - VULNERABLE
const data = await res.json()
scripts.value = data.scripts  // data.scripts could be undefined/malformed
```

**Fix:**
```typescript
const data = await res.json()
if (!data || !Array.isArray(data.scripts)) {
  throw new Error('Invalid response structure')
}
scripts.value = data.scripts
```

**Impact:** HIGH - Data integrity breach, potential XSS vector

---

### 2. Unhandled Fetch Errors
**Location:** `useBookmarks.ts:7-12`

**Issue:** No try-catch block. Network failures crash app silently.

```typescript
// Current - NO ERROR HANDLING
async function fetchBookmarks() {
  if (bookmarks.value.length) return
  const res = await fetch('/scripts-index.json')
  const data = await res.json()
  bookmarks.value = data.bookmarks
}
```

**Fix:**
```typescript
const error = ref<string | null>(null)

async function fetchBookmarks() {
  if (bookmarks.value.length) return
  try {
    const res = await fetch('/scripts-index.json')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (!Array.isArray(data.bookmarks)) {
      throw new Error('Invalid bookmarks data')
    }
    bookmarks.value = data.bookmarks
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load bookmarks'
  }
}

return { bookmarks, error, fetchBookmarks, categories }
```

**Impact:** HIGH - App crashes on network failure

---

### 3. SSR Incompatibility (RUNTIME ERROR)
**Location:** `useDarkMode.ts:3-6`, `useUserscriptManager.ts:17-18`

**Issue:** Direct localStorage access at module level causes SSR crashes (window undefined).

```typescript
// BREAKS IN SSR
const isDark = ref(
  localStorage.getItem('theme') === 'dark' ||
  (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
)
```

**Fix:**
```typescript
const isDark = ref(false)

export function useDarkMode() {
  // Initialize in composable function
  if (typeof window !== 'undefined') {
    isDark.value =
      localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  }

  watchEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark.value)
      localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    }
  })

  const toggle = () => { isDark.value = !isDark.value }
  return { isDark, toggle }
}
```

**Impact:** CRITICAL - Breaks SSR environments (Nuxt, SSG)

---

## High Priority Issues

### 4. No HTTP Status Validation
**Location:** `useScripts.ts:13`

**Issue:** 404/500 responses treated as success.

```typescript
// Missing status check
const res = await fetch('/scripts-index.json')
const data = await res.json()
```

**Fix:**
```typescript
const res = await fetch('/scripts-index.json')
if (!res.ok) {
  throw new Error(`HTTP ${res.status}: ${res.statusText}`)
}
const data = await res.json()
```

---

### 5. Potential XSS in Template Interpolation
**Location:** `ScriptCard.vue:24,36`, `BookmarkCard.vue:17,25`

**Issue:** Raw text interpolation of user-controlled data without sanitization. If `script.name`, `script.description`, `match` contain HTML, Vue escapes by default BUT URLs in `match.replace()` could be malicious.

```vue
<!-- Safer but verify data source -->
<span>{{ match.replace('https://', '').replace('/*', '') }}</span>
```

**Risk:** LOW (Vue auto-escapes) BUT ensure backend sanitizes all fields. Never use `v-html` with user data.

---

### 6. Missing Clipboard API Permissions
**Location:** `ScriptCard.vue:10-14`

**Issue:** No permission check, no fallback for unsupported browsers.

```typescript
// Current - No error handling
async function copyUrl(url: string) {
  await navigator.clipboard.writeText(url)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
```

**Fix:**
```typescript
async function copyUrl(url: string) {
  try {
    if (!navigator.clipboard) {
      throw new Error('Clipboard API not supported')
    }
    await navigator.clipboard.writeText(url)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (err) {
    console.error('Copy failed:', err)
    // Fallback: show URL in modal/alert
  }
}
```

---

### 7. Race Condition in Shared State
**Location:** `useScripts.ts:10`, `useBookmarks.ts:8`

**Issue:** Early return prevents refetch if first call fails. Multiple components calling simultaneously causes duplicate fetches.

```typescript
// Problematic pattern
async function fetchScripts() {
  if (scripts.value.length) return  // Stuck if first call fails
  loading.value = true
  // ...
}
```

**Fix:**
```typescript
const loading = ref(false)
const fetched = ref(false)

async function fetchScripts() {
  if (fetched.value || loading.value) return
  loading.value = true
  try {
    const res = await fetch('/scripts-index.json')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    scripts.value = data.scripts
    fetched.value = true
  } catch (err) {
    error.value = 'Failed to load scripts'
  } finally {
    loading.value = false
  }
}
```

---

## Medium Priority Issues

### 8. Accessibility Gaps

#### a) Missing ARIA Labels
**Location:** `ScriptCard.vue:46-66`, `BookmarkCard.vue:9-31`

Cards lack semantic structure, button roles unclear:
```vue
<!-- Add aria-label to card -->
<div class="..." role="article" :aria-label="`Script: ${script.name}`">
```

#### b) Icon-Only Buttons
**Location:** `Header.vue:29-35`

Dark mode toggle has aria-label ✅ but copy button in ScriptCard missing:
```vue
<button @click.stop="copyUrl(script.installUrl)"
        :aria-label="copied ? 'URL copied' : 'Copy install URL'"
        class="...">
```

#### c) External Link Announcements
**Location:** `BookmarkCard.vue:9`, `Footer.vue:9`

Missing `aria-label` on external links:
```vue
<a :href="bookmark.url"
   target="_blank"
   rel="noopener noreferrer"
   :aria-label="`${bookmark.name} (opens in new tab)`">
```

---

### 9. Missing Loading States in UI
**Location:** `useScripts.ts:5`, `useBookmarks.ts` (no loading state)

`useBookmarks` has no `loading` state. Parent components can't show spinners.

**Fix:** Add `const loading = ref(false)` and return it.

---

### 10. localStorage Quota Handling
**Location:** `useDarkMode.ts:11`, `useUserscriptManager.ts:23`

No quota exceeded handling. Can fail silently in private browsing.

```typescript
try {
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
} catch (err) {
  console.warn('localStorage unavailable:', err)
}
```

---

### 11. Inconsistent Error Exposure
**Location:** `useScripts.ts:6`, `useBookmarks.ts` (no error state)

`useScripts` exposes error, `useBookmarks` doesn't. Inconsistent API.

---

### 12. Non-Unique Keys in v-for
**Location:** `ScriptCard.vue:39`

**Issue:** Using `match` string as key can cause duplicates if same domain matches twice.

```vue
<!-- Current - potential duplicate keys -->
<span v-for="match in script.matches.slice(0, 2)" :key="match">

<!-- Fix -->
<span v-for="(match, idx) in script.matches.slice(0, 2)" :key="`${match}-${idx}`">
```

---

## Low Priority Suggestions

### 13. Magic Numbers
**Location:** `ScriptCard.vue:13,39`

```typescript
// Extract constants
const COPY_FEEDBACK_DURATION = 2000
const MAX_MATCHES_DISPLAYED = 2

setTimeout(() => { copied.value = false }, COPY_FEEDBACK_DURATION)
script.matches.slice(0, MAX_MATCHES_DISPLAYED)
```

---

### 14. Duplicate Code
**Location:** `useScripts.ts:23-24`, `useBookmarks.ts:14-15`

Identical category computation logic. Extract to shared utility:

```typescript
// utils/collections.ts
export const extractCategories = <T extends { category: string }>(items: T[]) =>
  [...new Set(items.map(item => item.category))]
```

---

### 15. Performance: Unnecessary Computed
**Location:** `useScripts.ts:23-25`

`categories` computed recalculates on every script change. Consider caching:

```typescript
const categories = computed(() => {
  if (!scripts.value.length) return []
  return [...new Set(scripts.value.map(s => s.category))].sort()
})
```

---

### 16. Type Safety: Router Link Type
**Location:** `Header.vue:13,17,23`

`router-link` `to` prop should use typed routes if using typed-router plugin.

---

### 17. Style: Inconsistent Event Naming
**Location:** `SearchBar.vue:5`

Uses generic `update:modelValue`. Consider semantic name like `search`.

---

## Positive Observations

✅ **Vue 3 Composition API:** Proper use of shared state pattern (refs outside composable)
✅ **TypeScript:** Strict types, no `any`, proper interface definitions
✅ **Dark Mode:** Clean implementation with system preference detection
✅ **Accessibility Baseline:** Skip-to-content link, semantic HTML, focus styles
✅ **Component Structure:** Small, focused components with clear responsibilities
✅ **Build Optimization:** Bundle size reasonable (37 kB gzipped)
✅ **Icon Library:** Consistent use of lucide-vue-next with size props
✅ **Responsive Design:** Proper Tailwind classes with dark mode variants
✅ **rel="noopener noreferrer":** Correct security attribute on external links
✅ **No console.log pollution:** Clean production code

---

## Recommended Actions (Prioritized)

### Immediate (Block Release)
1. Add SSR guards to localStorage/window access in `useDarkMode`, `useUserscriptManager`
2. Add try-catch + error state to `useBookmarks.fetchBookmarks()`
3. Validate response structure in both `useScripts` and `useBookmarks`
4. Add HTTP status validation (`res.ok` check)

### High Priority (Before Phase 04)
5. Fix race condition in fetch with `fetched` flag
6. Add error handling to clipboard API with fallback
7. Add loading state to `useBookmarks`
8. Add aria-labels to all interactive elements (buttons, external links)
9. Fix v-for key uniqueness in ScriptCard

### Medium Priority (Technical Debt)
10. Extract duplicate category logic to shared util
11. Add localStorage quota error handling
12. Standardize error exposure across composables
13. Add role="article" to cards for screen readers

### Nice-to-Have
14. Extract magic numbers to constants
15. Add TypeScript for router if using typed-router
16. Memoize categories computed with sorting

---

## Security Checklist (OWASP Top 10)

| Risk | Status | Notes |
|------|--------|-------|
| A01: Broken Access Control | ✅ N/A | Static site, no auth |
| A02: Cryptographic Failures | ✅ N/A | No sensitive data stored |
| A03: Injection | ⚠️ MEDIUM | Vue auto-escapes but validate backend data |
| A04: Insecure Design | ⚠️ MEDIUM | No response validation enables data tampering |
| A05: Security Misconfiguration | ✅ GOOD | `rel="noopener noreferrer"` present |
| A06: Vulnerable Components | ✅ GOOD | Dependencies up-to-date (checked package.json) |
| A07: Auth Failures | ✅ N/A | No authentication |
| A08: Software Integrity | ⚠️ MEDIUM | No SRI/CSP headers (check Vite config) |
| A09: Logging Failures | ⚠️ MEDIUM | Errors caught but not logged to monitoring |
| A10: SSRF | ✅ N/A | All URLs user-visible, no backend proxy |

---

## Performance Metrics

**Bundle Analysis:**
- Main bundle: 95.22 kB (37.36 kB gzipped) ✅
- CSS: 23.44 kB (5.11 kB gzipped) ✅
- Code splitting: Home/Bookmarks/ScriptDetail lazy-loaded ✅

**Optimization Opportunities:**
- Fuse.js (7.1.0) adds ~10 kB - evaluate if needed in Phase 03 (not used yet)
- Shiki (3.0.0) adds ~50 kB - ensure lazy-loaded for syntax highlighting

---

## Architecture Assessment

**Pattern Compliance:**
- ✅ YAGNI: No premature optimization, components focused
- ✅ KISS: Simple shared state, no complex abstractions
- ⚠️ DRY: Category extraction duplicated (minor)

**Vue 3 Best Practices:**
- ✅ Composition API over Options API
- ✅ Shared state via module-level refs
- ✅ Computed properties for derived state
- ✅ Proper TypeScript integration
- ⚠️ Missing `readonly()` for exposed state (prevents external mutation)

---

## Unresolved Questions

1. **SRI/CSP:** Are Content-Security-Policy headers configured in deployment? Check Vite build output and hosting config.

2. **Analytics:** Should errors be sent to monitoring (Sentry, LogRocket)? Current silent failures in production undetectable.

3. **i18n:** Will project support internationalization? Current hardcoded strings would need refactor.

4. **Cache Strategy:** Should `scripts-index.json` have cache headers? Consider adding `Cache-Control` or using service worker.

5. **Accessibility Audit:** Has WCAG 2.1 AA automated testing been run? Recommend axe-core or Lighthouse CI.

6. **Browser Support:** Target browsers? Safari clipboard API requires user gesture - current impl may fail.

---

## Next Phase Checklist

Before starting Phase 04:
- [ ] Fix all critical issues (SSR, error handling, validation)
- [ ] Add unit tests for composables (especially error paths)
- [ ] Run Lighthouse accessibility audit
- [ ] Test keyboard navigation (tab order, focus trap)
- [ ] Verify dark mode persistence across sessions
- [ ] Test clipboard in Safari/Firefox
- [ ] Document error handling patterns for Phase 04

---

**Review Completed:** 2026-01-09
**Est. Fix Time:** 2-3 hours for critical issues
**Recommend:** Do NOT merge until critical issues resolved
