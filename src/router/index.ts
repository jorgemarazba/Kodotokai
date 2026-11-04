import { createRouter, createWebHistory } from 'vue-router'
import ChatView from '@/views/ChatView.vue'
import LawyersView from '@/views/LawyersView.vue'
import StatsView from '@/views/StatsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'chat',
      component: ChatView,
    },
    {
      path: '/servicios',
      alias: '/lawyers',
      name: 'servicios',
      component: LawyersView,
    },
    {
      path: '/stats',
      name: 'stats',
      component: StatsView,
    },
  ],
})

export default router
