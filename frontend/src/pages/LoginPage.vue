<!-- 登录页：品牌介绍 + 用户名密码表单。 -->
<script setup lang="ts">
import { NAlert, NButton, NCard, NIcon, NInput } from 'naive-ui'
import { LockClosedOutline, LogInOutline, PersonOutline } from '@vicons/ionicons5'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BrandMark from '../components/BrandMark.vue'
import { messageOfError } from '../api/client'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const shake = ref(false)

/** 触发卡片抖动，用于错误反馈。 */
function triggerShake(): void {
  shake.value = false
  window.setTimeout(() => {
    shake.value = true
    window.setTimeout(() => {
      shake.value = false
    }, 420)
  }, 0)
}

/** 校验输入并登录，成功后回到来源页或任务页。 */
async function submit(): Promise<void> {
  if (loading.value) return
  error.value = ''

  if (!username.value.trim() || !password.value) {
    error.value = '请输入用户名和密码'
    triggerShake()
    return
  }

  loading.value = true
  try {
    await auth.login(username.value, password.value)
    // 只接受站内路径，避免 redirect 参数被用来跳出应用。
    const redirect =
      typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
        ? route.query.redirect
        : '/pc'
    await router.replace(redirect)
  } catch (cause) {
    error.value = messageOfError(cause)
    triggerShake()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login">
    <section class="intro">
      <div class="intro-brand">
        <BrandMark :size="30" />
        <span>easy-kanban</span>
      </div>

      <h1 class="intro-title">
        谁在给哪个项目<br />
        干活，一眼看清。
      </h1>
      <p class="intro-desc">
        人 × 项目的任务分配矩阵。把散在群聊和记忆里的分工，放回一张表里。
      </p>

      <div class="mini-matrix" aria-hidden="true">
        <span
          v-for="n in 24"
          :key="n"
          class="mini-cell"
          :class="{ filled: [2, 3, 8, 11, 15, 20].includes(n), strong: [2, 11].includes(n) }"
        ></span>
      </div>

      <p class="intro-foot">单账号 · 自部署 · 数据留在自己的服务器</p>
    </section>

    <section class="panel">
      <n-card class="login-card" :class="{ shake }" :bordered="false">
        <h2 class="login-title">登录</h2>
        <p class="login-sub">使用部署时配置的账号进入数据后台。</p>

        <form class="login-form" @submit.prevent="submit">
          <label class="field">
            <span class="field-label">用户名</span>
            <n-input
              v-model:value="username"
              placeholder="manager"
              clearable
              autofocus
              :input-props="{ autocomplete: 'username', spellcheck: false }"
            >
              <template #prefix>
                <n-icon :component="PersonOutline" />
              </template>
            </n-input>
          </label>

          <label class="field">
            <span class="field-label">密码</span>
            <n-input
              v-model:value="password"
              type="password"
              show-password-on="click"
              placeholder="请输入密码"
              :input-props="{ autocomplete: 'current-password' }"
            >
              <template #prefix>
                <n-icon :component="LockClosedOutline" />
              </template>
            </n-input>
          </label>

          <n-alert v-if="error" type="error" :show-icon="false" class="login-error">
            {{ error }}
          </n-alert>

          <n-button type="primary" attr-type="submit" size="large" block :loading="loading">
            <template #icon>
              <n-icon :component="LogInOutline" />
            </template>
            登录
          </n-button>
        </form>

        <p class="login-foot">M1 · 数据录入后台</p>
      </n-card>
    </section>
  </div>
</template>

<style scoped>
.login {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  min-height: 100%;
  background:
    radial-gradient(900px 500px at 12% 0%, rgba(30, 58, 138, 0.12), transparent 60%),
    radial-gradient(700px 500px at 95% 100%, rgba(29, 78, 216, 0.1), transparent 60%),
    var(--bg);
}

.intro {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 64px clamp(32px, 7vw, 96px);
}

.intro-brand {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 48px;
  font-size: 17px;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.intro-title {
  font-size: clamp(28px, 3.4vw, 42px);
  font-weight: 700;
  line-height: 1.28;
  letter-spacing: -0.02em;
}

.intro-desc {
  max-width: 460px;
  margin-top: 18px;
  color: var(--text-muted);
  font-size: 15px;
  line-height: 1.75;
}

.mini-matrix {
  display: grid;
  grid-template-columns: repeat(6, 34px);
  gap: 8px;
  margin: 40px 0 36px;
}

.mini-cell {
  height: 34px;
  border: 1px dashed var(--border-strong);
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.6);
}

.mini-cell.filled {
  border-style: solid;
  border-color: rgba(30, 58, 138, 0.24);
  background: rgba(30, 58, 138, 0.08);
}

.mini-cell.strong {
  border-color: rgba(30, 58, 138, 0.42);
  background: rgba(30, 58, 138, 0.2);
}

.intro-foot {
  color: var(--text-faint);
  font-size: 12px;
  letter-spacing: 0.02em;
}

.panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
}

.login-card {
  width: min(400px, 100%);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.1);
}

.login-title {
  font-size: 22px;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.login-sub {
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 13px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
}

.login-error {
  margin-bottom: 0;
}

.login-foot {
  margin-top: 22px;
  color: var(--text-faint);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.shake {
  animation: shake 0.4s ease;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-6px);
  }
  50% {
    transform: translateX(5px);
  }
  75% {
    transform: translateX(-3px);
  }
}

@media (max-width: 960px) {
  .login {
    grid-template-columns: 1fr;
  }

  .intro {
    padding: 40px 28px 8px;
  }

  .intro-brand {
    margin-bottom: 24px;
  }

  .mini-matrix,
  .intro-foot {
    display: none;
  }

  .intro-desc {
    margin-top: 10px;
    font-size: 14px;
  }

  .panel {
    padding: 24px 20px 48px;
  }
}
</style>
