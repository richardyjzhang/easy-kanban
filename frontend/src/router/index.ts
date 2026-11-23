// 路由表与登录守卫。使用 hash 模式，子路径部署时无需服务端回退。

import { createRouter, createWebHashHistory } from 'vue-router'

import { getToken } from '../api/client'
import { useAuthStore } from '../stores/auth'
import AppLayout from '../layouts/AppLayout.vue'
import LoginPage from '../pages/LoginPage.vue'
import SettingsPage from '../pages/SettingsPage.vue'
import TaskListPage from '../pages/TaskListPage.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      // 约定：入口按登录态分流；真正的守卫在 beforeEach 里再兜一次。
      redirect: () => (getToken() ? '/pc' : '/login'),
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
      meta: { public: true },
    },
    {
      path: '/pc',
      component: AppLayout,
      children: [
        { path: '', name: 'tasks', component: TaskListPage },
        { path: 'settings', name: 'settings', component: SettingsPage },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  // 已登录访问登录页时直接回默认页。
  if (to.meta.public) {
    if (to.name === 'login' && auth.isAuthenticated) return { path: '/pc' }
    return true
  }

  if (!auth.isAuthenticated) {
    // 记下原地址，登录成功后回到这里。
    return {
      path: '/login',
      query: to.fullPath === '/' ? {} : { redirect: to.fullPath },
    }
  }
  return true
})

export default router
