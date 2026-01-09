import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: () => import('@/pages/Home.vue') },
    { path: '/script/:category/:name', component: () => import('@/pages/ScriptDetail.vue') },
    { path: '/bookmarks', component: () => import('@/pages/Bookmarks.vue') },
  ],
})

export default router
