<!-- 项目新建/编辑弹层：名称 + 颜色 + 描述。 -->
<script setup lang="ts">
import { NButton, NForm, NFormItem, NInput, NModal, NSpace } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'

import ColorPicker from './ColorPicker.vue'
import { ApiError, messageOfError } from '../api/client'
import { PALETTE } from '../constants'
import { message } from '../feedback'
import { useDataStore } from '../stores/data'
import type { Project } from '../types'

const props = defineProps<{ open: boolean; project: Project | null }>()
const emit = defineEmits<{ 'update:open': [value: boolean]; saved: [] }>()

const data = useDataStore()

const name = ref('')
const color = ref<string>(PALETTE[0])
const description = ref('')
const saving = ref(false)
const errors = reactive<Record<string, string>>({})

const title = computed(() => (props.project ? '编辑项目' : '新建项目'))

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
    name.value = props.project?.name ?? ''
    color.value = props.project?.color ?? PALETTE[0]
    description.value = props.project?.description ?? ''
    for (const key of Object.keys(errors)) delete errors[key]
  },
  { immediate: true },
)

/** 请求关闭（保存中不允许）。 */
function close(): void {
  if (saving.value) return
  emit('update:open', false)
}

/** 校验并保存项目。 */
async function save(): Promise<void> {
  if (saving.value) return
  for (const key of Object.keys(errors)) delete errors[key]

  const trimmed = name.value.trim()
  if (!trimmed) errors.name = '请输入项目名称'
  else if (trimmed.length > 50) errors.name = '项目名称不能超过 50 个字符'
  if (description.value.length > 500) errors.description = '描述不能超过 500 个字符'
  if (Object.keys(errors).length > 0) return

  saving.value = true
  try {
    const input = { name: trimmed, color: color.value, description: description.value }
    if (props.project) {
      await data.updateProject(props.project.id, input)
      message.success('项目已更新')
    } else {
      await data.createProject(input)
      message.success('项目已创建')
    }
    emit('saved')
    emit('update:open', false)
  } catch (cause) {
    if (cause instanceof ApiError) {
      if (cause.status === 409) errors.name = cause.message
      else if (cause.details.name) errors.name = cause.details.name
      else if (cause.details.description) errors.description = cause.details.description
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
    :style="{ width: '500px' }"
    :bordered="false"
    :mask-closable="!saving"
    closable
  >
    <div @keydown.enter.prevent="save">
      <n-form label-placement="top" :show-require-mark="false">
        <n-form-item
          label="项目名称"
          required
          :validation-status="errors.name ? 'error' : undefined"
          :feedback="errors.name"
        >
          <n-input
            v-model:value="name"
            maxlength="50"
            show-count
            placeholder="例如：支付重构"
            autofocus
            :status="errors.name ? 'error' : undefined"
          />
        </n-form-item>

        <n-form-item label="颜色">
          <ColorPicker v-model="color" :disabled="saving" />
        </n-form-item>

        <n-form-item
          label="描述"
          :validation-status="errors.description ? 'error' : undefined"
          :feedback="errors.description"
        >
          <n-input
            v-model:value="description"
            type="textarea"
            maxlength="500"
            show-count
            placeholder="一句话说明这个项目在做什么（可选）"
            :autosize="{ minRows: 3, maxRows: 6 }"
          />
        </n-form-item>
      </n-form>
    </div>

    <n-space justify="end" class="dialog-actions">
      <n-button :disabled="saving" @click="close">取消</n-button>
      <n-button type="primary" :loading="saving" @click="save">保存</n-button>
    </n-space>
  </n-modal>
</template>
