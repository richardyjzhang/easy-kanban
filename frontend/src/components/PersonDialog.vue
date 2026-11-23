<!-- 人员新建/编辑弹层：姓名 + 颜色。 -->
<script setup lang="ts">
import { NButton, NForm, NFormItem, NInput, NModal, NSpace } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'

import ColorPicker from './ColorPicker.vue'
import { ApiError, messageOfError } from '../api/client'
import { PALETTE } from '../constants'
import { message } from '../feedback'
import { useDataStore } from '../stores/data'
import type { Person } from '../types'

const props = defineProps<{ open: boolean; person: Person | null }>()
const emit = defineEmits<{ 'update:open': [value: boolean]; saved: [] }>()

const data = useDataStore()

const name = ref('')
const color = ref<string>(PALETTE[0])
const saving = ref(false)
const errors = reactive<Record<string, string>>({})

const title = computed(() => (props.person ? '编辑人员' : '新建人员'))

/** 弹层显隐，关闭时同步给父组件。 */
const show = computed({
  get: () => props.open,
  set: (value: boolean) => {
    if (!value && !saving.value) emit('update:open', false)
  },
})

watch(
  () => props.open,
  (open) => {
    if (!open) return
    name.value = props.person?.name ?? ''
    color.value = props.person?.color ?? PALETTE[0]
    for (const key of Object.keys(errors)) delete errors[key]
  },
  { immediate: true },
)

/** 请求关闭（保存中不允许）。 */
function close(): void {
  if (saving.value) return
  emit('update:open', false)
}

/** 校验并保存人员。 */
async function save(): Promise<void> {
  if (saving.value) return
  for (const key of Object.keys(errors)) delete errors[key]

  const trimmed = name.value.trim()
  if (!trimmed) errors.name = '请输入姓名'
  else if (trimmed.length > 30) errors.name = '姓名不能超过 30 个字符'
  if (Object.keys(errors).length > 0) return

  saving.value = true
  try {
    if (props.person) {
      await data.updatePerson(props.person.id, { name: trimmed, color: color.value })
      message.success('人员已更新')
    } else {
      await data.createPerson({ name: trimmed, color: color.value })
      message.success('人员已创建')
    }
    emit('saved')
    emit('update:open', false)
  } catch (cause) {
    if (cause instanceof ApiError) {
      // 约定：重名由后端返回 409，这里落到姓名字段上展示。
      if (cause.status === 409) errors.name = cause.message
      else if (cause.details.name) errors.name = cause.details.name
    }
    message.error(messageOfError(cause))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <n-modal
    v-model:show="show"
    preset="card"
    :title="title"
    :style="{ width: '460px' }"
    :bordered="false"
    :mask-closable="!saving"
    closable
  >
    <div @keydown.enter.prevent="save">
      <n-form label-placement="top" :show-require-mark="false">
        <n-form-item
          label="姓名"
          required
          :validation-status="errors.name ? 'error' : undefined"
          :feedback="errors.name"
        >
          <n-input
            v-model:value="name"
            maxlength="30"
            show-count
            placeholder="例如：张三"
            autofocus
            :status="errors.name ? 'error' : undefined"
          />
        </n-form-item>

        <n-form-item label="颜色">
          <div>
            <ColorPicker v-model="color" :disabled="saving" />
            <p class="hint">颜色只用于矩阵里区分人员和项目。</p>
          </div>
        </n-form-item>
      </n-form>
    </div>

    <n-space justify="end" class="dialog-actions">
      <n-button :disabled="saving" @click="close">取消</n-button>
      <n-button type="primary" :loading="saving" @click="save">保存</n-button>
    </n-space>
  </n-modal>
</template>

<style scoped>
.hint {
  margin-top: 8px;
  color: var(--text-faint);
  font-size: 12px;
}
</style>
