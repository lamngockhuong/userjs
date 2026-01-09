import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('@/pages/Home.vue') },
  { path: '/script/:category/:filename', name: 'script-detail', component: () => import('@/pages/ScriptDetail.vue') },
  { path: '/bookmarks', name: 'bookmarks', component: () => import('@/pages/Bookmarks.vue') },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/pages/NotFound.vue') },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
