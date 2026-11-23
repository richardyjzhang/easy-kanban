// 应用入口：装配 Pinia 与路由，注册全局 401 处理，挂载根组件。

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from './api/client'
import { message } from './feedback'
import { useAuthStore } from './stores/auth'
import { useDataStore } from './stores/data'
import './styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 任何请求返回 401：清凭证、清缓存、提示并回登录页。
setUnauthorizedHandler(() => {
  const auth = useAuthStore(pinia)
  const data = useDataStore(pinia)

  auth.clear()
  data.reset()
  message.error('登录状态已失效，请重新登录')

  const current = router.currentRoute.value
  if (current.path !== '/login') {
    void router.replace({
      path: '/login',
      query: current.fullPath === '/' ? {} : { redirect: current.fullPath },
    })
  }
})

app.mount('#app')
