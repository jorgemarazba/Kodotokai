import { createRouter, createWebHistory } from 'vue-router'
import ChatView from '@/views/ChatView.vue'
import LawyersView from '@/views/LawyersView.vue'
import MultiserviceView from '@/views/MultiserviceView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'chat',
      component: ChatView,
    },
    {
      path: '/lawyers',
      name: 'lawyers',
      component: LawyersView,
    },
    {
      path: '/multiservice',
      name: 'multiservice',
      component: MultiserviceView,
    },
  ],
})

export default router