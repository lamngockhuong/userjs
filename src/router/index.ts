import { createRouter, createWebHashHistory } from 'vue-router'

const BASE_TITLE = 'UserJS Store | Khuong Dev'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/Home.vue'),
    meta: { title: BASE_TITLE },
  },
  {
    path: '/script/:category/:filename',
    name: 'script-detail',
    component: () => import('@/pages/ScriptDetail.vue'),
    // Title set dynamically in component
  },
  {
    path: '/bookmarks',
    name: 'bookmarks',
    component: () => import('@/pages/Bookmarks.vue'),
    meta: { title: `Bookmarks - ${BASE_TITLE}` },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/NotFound.vue'),
    meta: { title: `Not Found - ${BASE_TITLE}` },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// Update document title on route change
router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  if (title) {
    document.title = title
  }
})

export default router

export { BASE_TITLE }
