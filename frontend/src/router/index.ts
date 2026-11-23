// 路由表与登录守卫。使用 hash 模式，子路径部署时无需服务端回退。

import { createRouter, createWebHashHistory } from 'vue-router'

import { getToken } from '../api/client'
import { useAuthStore } from '../stores/auth'
import { defaultRoute } from '../utils/device'
import AppLayout from '../layouts/AppLayout.vue'
import MobileLayout from '../layouts/MobileLayout.vue'
import LoginPage from '../pages/LoginPage.vue'
import MatrixPage from '../pages/MatrixPage.vue'
import MobileMatrixPage from '../pages/MobileMatrixPage.vue'
import MobilePasswordPage from '../pages/MobilePasswordPage.vue'
import MobilePeoplePage from '../pages/MobilePeoplePage.vue'
import MobileProjectsPage from '../pages/MobileProjectsPage.vue'
import MobileSettingsPage from '../pages/MobileSettingsPage.vue'
import SettingsPage from '../pages/SettingsPage.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      // 约定：入口按登录态与 UA 分流；真正的守卫在 beforeEach 里再兜一次。
      redirect: () => (getToken() ? defaultRoute() : '/login'),
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
        { path: '', name: 'matrix', component: MatrixPage },
        { path: 'settings', name: 'settings', component: SettingsPage },
      ],
    },
    {
      path: '/m',
      component: MobileLayout,
      children: [
        {
          path: '',
          name: 'mobile-matrix',
          component: MobileMatrixPage,
          meta: { showTab: true },
        },
        {
          path: 'settings',
          name: 'mobile-settings',
          component: MobileSettingsPage,
          meta: { showTab: true },
        },
        // 设置子页是全屏的二级页面，不显示底部 Tab。
        { path: 'settings/people', name: 'mobile-people', component: MobilePeoplePage },
        { path: 'settings/projects', name: 'mobile-projects', component: MobileProjectsPage },
        { path: 'settings/password', name: 'mobile-password', component: MobilePasswordPage },
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
    if (to.name === 'login' && auth.isAuthenticated) return { path: defaultRoute() }
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
