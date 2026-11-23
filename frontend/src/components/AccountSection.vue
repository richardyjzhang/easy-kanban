<!-- 设置页账号分区：展示当前账号、修改密码与退出登录。 -->
<script setup lang="ts">
import { NButton, NIcon } from 'naive-ui'
import { LogOutOutline } from '@vicons/ionicons5'
import { useRouter } from 'vue-router'

import PasswordSection from './PasswordSection.vue'
import { dialog } from '../feedback'
import { useAuthStore } from '../stores/auth'
import { useDataStore } from '../stores/data'

const auth = useAuthStore()
const data = useDataStore()
const router = useRouter()

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
  <section class="section" aria-label="账号">
    <header class="section-head">
      <div>
        <p class="section-sub">系统只有一个账号。用户名在部署时由环境变量决定，之后不可修改。</p>
      </div>
    </header>

    <div class="account-block">
      <div class="account-row">
        <div>
          <p class="account-label">当前账号</p>
          <p class="account-value">{{ auth.username || '管理者' }}</p>
        </div>
        <n-button secondary @click="askLogout">
          <template #icon>
            <n-icon :component="LogOutOutline" />
          </template>
          退出登录
        </n-button>
      </div>
    </div>

    <div class="account-block">
      <password-section />
    </div>
  </section>
</template>

<style scoped>
.section {
  padding: 2px 2px 4px;
}

.account-block {
  padding: 18px 20px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface-muted);
}

.account-block + .account-block {
  margin-top: 16px;
}

.account-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.account-label {
  color: var(--text-muted);
  font-size: 12px;
}

.account-value {
  margin-top: 2px;
  font-size: 15px;
  font-weight: 600;
}
</style>
