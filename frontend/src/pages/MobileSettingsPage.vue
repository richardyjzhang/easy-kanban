<!-- H5 设置页（P5）：单列入口，人员／项目／密码进入全屏子页。 -->
<script setup lang="ts">
import { NIcon } from 'naive-ui'
import {
  ChevronForwardOutline,
  FolderOpenOutline,
  KeyOutline,
  LogOutOutline,
  PeopleOutline,
} from '@vicons/ionicons5'
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { dialog } from '../feedback'
import { useAuthStore } from '../stores/auth'
import { useDataStore } from '../stores/data'

const auth = useAuthStore()
const data = useDataStore()
const router = useRouter()

// 「待分配」不算真实人员，设置页只展示可管理的成员数。
const peopleCount = computed(() => data.activePeople.filter((person) => !person.is_system).length)
const projectCount = computed(() => data.activeProjects.length)

onMounted(() => {
  // 错误已写入 store；设置页以已有数据为准，不阻塞入口展示。
  data.load().catch(() => {})
})

/** 退出登录并清空本地数据。 */
function logout(): void {
  auth.logout()
  data.reset()
  void router.replace('/login')
}

/** 退出前二次确认。 */
function askLogout(): void {
  dialog.warning({
    title: '退出登录',
    content: '退出后需要重新输入用户名和密码。',
    positiveText: '退出登录',
    negativeText: '取消',
    onPositiveClick: () => {
      logout()
    },
  })
}
</script>

<template>
  <div class="m-settings">
    <header class="m-settings-head">
      <h1>设置</h1>
      <p class="m-settings-sub">当前账号：{{ auth.username || '管理者' }}</p>
    </header>

    <section class="m-group" aria-label="管理">
      <RouterLink to="/m/settings/people" class="m-entry">
        <span class="m-entry-icon"><n-icon :component="PeopleOutline" :size="19" /></span>
        <span class="m-entry-label">人员管理</span>
        <span class="m-entry-value">{{ peopleCount }} 人</span>
        <n-icon :component="ChevronForwardOutline" :size="15" class="m-entry-arrow" />
      </RouterLink>

      <RouterLink to="/m/settings/projects" class="m-entry">
        <span class="m-entry-icon"><n-icon :component="FolderOpenOutline" :size="19" /></span>
        <span class="m-entry-label">项目管理</span>
        <span class="m-entry-value">{{ projectCount }} 个</span>
        <n-icon :component="ChevronForwardOutline" :size="15" class="m-entry-arrow" />
      </RouterLink>

      <RouterLink to="/m/settings/password" class="m-entry">
        <span class="m-entry-icon"><n-icon :component="KeyOutline" :size="19" /></span>
        <span class="m-entry-label">修改密码</span>
        <n-icon :component="ChevronForwardOutline" :size="15" class="m-entry-arrow" />
      </RouterLink>
    </section>

    <section class="m-group" aria-label="账号">
      <button type="button" class="m-entry is-danger" @click="askLogout">
        <span class="m-entry-icon"><n-icon :component="LogOutOutline" :size="19" /></span>
        <span class="m-entry-label">退出登录</span>
      </button>
    </section>

    <p class="m-settings-foot">easy-kanban · 单账号自部署</p>
  </div>
</template>

<style scoped>
.m-settings {
  padding: 14px 14px 24px;
}

.m-settings-head {
  padding: 4px 2px 16px;
}

.m-settings-head h1 {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.m-settings-sub {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 12px;
}

.m-group {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}

.m-group + .m-group {
  margin-top: 14px;
}

.m-entry {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 14px 14px;
  border: 0;
  border-bottom: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}

.m-entry:last-child {
  border-bottom: 0;
}

.m-entry:active {
  background: var(--surface-muted);
}

.m-entry-icon {
  display: inline-flex;
  flex: none;
  color: var(--primary);
}

.m-entry-label {
  flex: 1;
  min-width: 0;
}

.m-entry-value {
  color: var(--text-muted);
  font-size: 12px;
}

.m-entry-arrow {
  flex: none;
  color: var(--text-faint);
}

.m-entry.is-danger {
  color: var(--danger);
}

.m-entry.is-danger .m-entry-icon {
  color: var(--danger);
}

.m-settings-foot {
  margin-top: 20px;
  color: var(--text-faint);
  font-size: 11px;
  text-align: center;
}
</style>
