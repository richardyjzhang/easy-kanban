import { createRouter, createWebHashHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import TestView from '../views/TestView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: TestView,
    },
    {
      path: '/main',
      name: 'main-layout',
      component: MainLayout,
      children: [
        {
          path: '/main/test',
          name: 'test-view',
          component: () => import('../views/TestView.vue'),
        },
      ],
    },
  ],
})

export default router
