<!-- PC 端整体布局：顶部导航、账号信息与页面内容容器。 -->
<script setup lang="ts">
import { NButton, NIcon } from 'naive-ui'
import { LogOutOutline } from '@vicons/ionicons5'
import { useRoute, useRouter } from 'vue-router'

import BrandMark from '../components/BrandMark.vue'
import { useAuthStore } from '../stores/auth'
import { useDataStore } from '../stores/data'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const data = useDataStore()

/** 退出登录并回到登录页。 */
function logout(): void {
  auth.logout()
  data.reset()
  void router.replace('/login')
}
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <div class="topbar-inner">
        <RouterLink class="brand" to="/pc">
          <BrandMark :size="24" />
          <span class="brand-name">easy-kanban</span>
        </RouterLink>

        <nav class="nav" aria-label="主导航">
          <RouterLink to="/pc" class="nav-link" :class="{ active: route.path === '/pc' }">
            任务
          </RouterLink>
          <RouterLink
            to="/pc/settings"
            class="nav-link"
            :class="{ active: route.path.startsWith('/pc/settings') }"
          >
            设置
          </RouterLink>
        </nav>

        <div class="account">
          <span class="account-name">{{ auth.username || '管理者' }}</span>
          <n-button quaternary size="small" @click="logout">
            <template #icon>
              <n-icon :component="LogOutOutline" />
            </template>
            退出登录
          </n-button>
        </div>
      </div>
    </header>

    <main class="page">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100%;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--topbar-height);
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.topbar-inner {
  display: flex;
  align-items: center;
  gap: 32px;
  max-width: 1280px;
  height: 100%;
  margin: 0 auto;
  padding: 0 32px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.brand-name {
  color: var(--text);
}

.nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link {
  padding: 6px 12px;
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.nav-link:hover {
  background: var(--surface-sunken);
  color: var(--text);
}

.nav-link.active {
  background: var(--primary-soft);
  color: var(--primary);
}

.account {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.account-name {
  max-width: 180px;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 28px 32px 64px;
}

@media (max-width: 720px) {
  .topbar-inner {
    gap: 16px;
    padding: 0 16px;
  }

  .account-name {
    display: none;
  }

  .page {
    padding: 20px 16px 48px;
  }
}
</style>
