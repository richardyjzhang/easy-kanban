<!-- 设置页：顶部分区 Tab + 内容卡片。 -->
<script setup lang="ts">
import { NButton, NCard, NEmpty, NIcon, NSpace, NSpin, NTabPane, NTabs } from 'naive-ui'
import { RefreshOutline } from '@vicons/ionicons5'
import { onMounted, ref } from 'vue'

import AccountSection from '../components/AccountSection.vue'
import PeopleSection from '../components/PeopleSection.vue'
import ProjectsSection from '../components/ProjectsSection.vue'
import { useDataStore } from '../stores/data'

type SectionKey = 'people' | 'projects' | 'account'

const data = useDataStore()
const current = ref<SectionKey>('people')

onMounted(() => {
  // 错误已写入 store，页面会展示重试入口。
  data.load().catch(() => {})
})

/** 手动重试拉取全量数据。 */
function retry(): void {
  data.load(true).catch(() => {})
}

/** 切换设置分区。 */
function onTabChange(key: string | number): void {
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

    <n-card v-else :bordered="false" class="settings-panel">
      <n-tabs
        type="line"
        size="large"
        :value="current"
        :animated="false"
        @update:value="onTabChange"
      >
        <n-tab-pane name="people" tab="人员">
          <people-section />
        </n-tab-pane>
        <n-tab-pane name="projects" tab="项目">
          <projects-section />
        </n-tab-pane>
        <n-tab-pane name="account" tab="账号">
          <account-section />
        </n-tab-pane>
      </n-tabs>
    </n-card>
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

.settings-panel {
  border-radius: 12px;
}

.settings-panel :deep(.n-card__content) {
  padding: 14px 26px 26px;
}

.settings-panel :deep(.n-tab-pane) {
  padding-top: 8px;
}

@media (max-width: 860px) {
  .settings-panel :deep(.n-card__content) {
    padding: 10px 16px 20px;
  }
}
</style>
