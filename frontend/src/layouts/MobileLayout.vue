<!-- H5 端整体布局：全屏内容区 + 底部 Tab。
     设置子页通过路由 meta 隐藏 Tab，留出返回按钮的位置。 -->
<script setup lang="ts">
import { NIcon } from 'naive-ui'
import { GridOutline, SettingsOutline } from '@vicons/ionicons5'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const showTab = computed(() => route.meta.showTab === true)
</script>

<template>
  <div class="m-shell" :class="{ 'has-tab': showTab }">
    <main class="m-main">
      <RouterView />
    </main>

    <nav v-if="showTab" class="m-tabbar" aria-label="主导航">
      <RouterLink to="/m" class="m-tab" :class="{ active: route.path === '/m' }">
        <n-icon :component="GridOutline" :size="21" />
        <span>矩阵</span>
      </RouterLink>
      <RouterLink
        to="/m/settings"
        class="m-tab"
        :class="{ active: route.path.startsWith('/m/settings') }"
      >
        <n-icon :component="SettingsOutline" :size="21" />
        <span>设置</span>
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
.m-shell {
  min-height: 100%;
  min-height: 100dvh;
  background: var(--bg);
}

.m-main {
  min-height: 100%;
  min-height: 100dvh;
}

/* 底部 Tab 固定，内容区让出等高的安全距离。 */
.m-shell.has-tab .m-main {
  padding-bottom: calc(56px + env(safe-area-inset-bottom));
}

.m-tabbar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 40;
  display: flex;
  height: calc(56px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  border-top: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(12px);
}

.m-tab {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--text-muted);
  font-size: 11px;
  transition: color 0.15s ease;
}

.m-tab.active {
  color: var(--primary);
  font-weight: 600;
}
</style>
