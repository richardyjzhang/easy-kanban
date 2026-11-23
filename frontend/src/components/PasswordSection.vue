<!-- 修改密码表单：PC 设置页与 H5 设置子页共用。 -->
<script setup lang="ts">
import { NButton, NForm, NFormItem, NIcon, NInput } from 'naive-ui'
import { SaveOutline } from '@vicons/ionicons5'
import { reactive, ref } from 'vue'

import { ApiError, messageOfError } from '../api/client'
import { message } from '../feedback'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const saving = ref(false)
const errors = reactive<Record<string, string>>({})

/** 清空字段级错误。 */
function clearErrors(): void {
  for (const key of Object.keys(errors)) delete errors[key]
}

/** 校验并提交修改密码。 */
async function submit(): Promise<void> {
  if (saving.value) return
  clearErrors()

  if (!oldPassword.value) errors.old_password = '请输入旧密码'
  if (newPassword.value.length < 8) errors.new_password = '新密码至少 8 个字符'
  else if (newPassword.value.length > 128) errors.new_password = '新密码不能超过 128 个字符'
  if (confirmPassword.value !== newPassword.value) errors.confirm_password = '两次输入的新密码不一致'
  if (Object.keys(errors).length > 0) return

  saving.value = true
  try {
    await auth.changePassword(oldPassword.value, newPassword.value)
    message.success('密码已更新，当前登录状态已刷新')
    oldPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (cause) {
    if (cause instanceof ApiError) {
      if (cause.details.old_password) errors.old_password = cause.details.old_password
      else if (cause.details.new_password) errors.new_password = cause.details.new_password
    }
    message.error(messageOfError(cause))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="password-section">
    <h3 class="block-title">修改密码</h3>
    <p class="block-sub">修改后其他设备上的登录会立即失效，当前会话会自动续期。</p>

    <n-form label-placement="top" :show-require-mark="false" class="password-form">
      <n-form-item
        label="旧密码"
        :validation-status="errors.old_password ? 'error' : undefined"
        :feedback="errors.old_password"
      >
        <n-input
          v-model:value="oldPassword"
          type="password"
          show-password-on="click"
          placeholder="请输入旧密码"
          :status="errors.old_password ? 'error' : undefined"
          :input-props="{ autocomplete: 'current-password' }"
        />
      </n-form-item>

      <n-form-item
        label="新密码"
        :validation-status="errors.new_password ? 'error' : undefined"
        :feedback="errors.new_password || '至少 8 个字符'"
      >
        <n-input
          v-model:value="newPassword"
          type="password"
          show-password-on="click"
          placeholder="请输入新密码"
          :status="errors.new_password ? 'error' : undefined"
          :input-props="{ autocomplete: 'new-password' }"
        />
      </n-form-item>

      <n-form-item
        label="确认新密码"
        :validation-status="errors.confirm_password ? 'error' : undefined"
        :feedback="errors.confirm_password"
      >
        <n-input
          v-model:value="confirmPassword"
          type="password"
          show-password-on="click"
          placeholder="再次输入新密码"
          :status="errors.confirm_password ? 'error' : undefined"
          :input-props="{ autocomplete: 'new-password' }"
        />
      </n-form-item>
    </n-form>

    <div class="form-actions">
      <n-button type="primary" :loading="saving" @click="submit">
        <template #icon>
          <n-icon :component="SaveOutline" />
        </template>
        更新密码
      </n-button>
    </div>
  </div>
</template>

<style scoped>
.block-title {
  font-size: 14px;
  font-weight: 600;
}

.block-sub {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 13px;
}

.password-form {
  max-width: 420px;
  margin-top: 16px;
}

.password-form :deep(.n-form-item) {
  margin-bottom: 16px;
}

.password-form :deep(.n-form-item-label) {
  font-size: 13px;
  color: var(--text-secondary);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  max-width: 420px;
}
</style>
