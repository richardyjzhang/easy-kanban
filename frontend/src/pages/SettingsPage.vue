<!-- 设置页：左侧分区导航，右侧人员 / 项目 / 账号内容。 -->
<script setup lang="ts">
import { NButton, NCard, NEmpty, NIcon, NMenu, NSpace, NSpin } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import {
  FolderOpenOutline,
  KeyOutline,
  PeopleOutline,
  RefreshOutline,
} from '@vicons/ionicons5'
import { h, onMounted, ref } from 'vue'
import type { Component } from 'vue'

import AccountSection from '../components/AccountSection.vue'
import PeopleSection from '../components/PeopleSection.vue'
import ProjectsSection from '../components/ProjectsSection.vue'
import { useDataStore } from '../stores/data'

type SectionKey = 'people' | 'projects' | 'account'

const data = useDataStore()
const current = ref<SectionKey>('people')

/** 为菜单项生成图标 VNode。 */
function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions: MenuOption[] = [
  { label: '人员', key: 'people', icon: renderIcon(PeopleOutline) },
  { label: '项目', key: 'projects', icon: renderIcon(FolderOpenOutline) },
  { label: '账号', key: 'account', icon: renderIcon(KeyOutline) },
]

onMounted(() => {
  // 错误已写入 store，页面会展示重试入口。
  data.load().catch(() => {})
})

/** 手动重试拉取全量数据。 */
function retry(): void {
  data.load(true).catch(() => {})
}

/** 切换设置分区。 */
function onMenuSelect(key: unknown): void {
  if (key === 'people' || key === 'projects' || key === 'account') {
    current.value = key
  }
}
</script>

<template>
  <div class="settings">
    <header class="page-head">
      <div>
        <h1>设置</h1>
        <p class="page-sub">人员、项目与账号</p>
      </div>
    </header>

    <n-card v-if="data.loading && !data.loaded" :bordered="false">
      <div class="state"><n-spin size="small" /><span>正在加载数据…</span></div>
    </n-card>

    <n-card v-else-if="data.error && !data.loaded" :bordered="false">
      <n-empty description="数据加载失败">
        <template #extra>
          <n-space vertical align="center" :size="12">
            <span class="muted">{{ data.error }}</span>
            <n-button type="primary" @click="retry">
              <template #icon>
                <n-icon :component="RefreshOutline" />
              </template>
              重试
            </n-button>
          </n-space>
        </template>
      </n-empty>
    </n-card>

    <div v-else class="settings-layout">
      <n-card :bordered="false" size="small" class="settings-nav">
        <n-menu :value="current" :options="menuOptions" @update:value="onMenuSelect" />
      </n-card>

      <n-card :bordered="false" class="settings-panel">
        <people-section v-if="current === 'people'" />
        <projects-section v-else-if="current === 'projects'" />
        <account-section v-else />
      </n-card>
    </div>
  </div>
</template>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 0;
  color: var(--text-muted);
  font-size: 13px;
}

.settings-layout {
  display: grid;
  grid-template-columns: 208px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.settings-nav {
  border-radius: 12px;
}

.settings-nav :deep(.n-card__content) {
  padding: 8px;
}

.settings-panel {
  min-width: 0;
  border-radius: 12px;
}

.settings-panel :deep(.n-card__content) {
  padding: 24px 26px 26px;
}

@media (max-width: 860px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }

  .settings-panel :deep(.n-card__content) {
    padding: 20px 16px;
  }
}
</style>
