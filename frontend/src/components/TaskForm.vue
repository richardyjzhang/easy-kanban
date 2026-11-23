<!-- 任务表单：新建/编辑共用，负责字段校验与草稿变更提示。 -->
<script setup lang="ts">
import {
  NAlert,
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NRadioButton,
  NRadioGroup,
  NSelect,
} from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { computed, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'

import { STATUS_META, TASK_STATUSES } from '../constants'
import { dateToTimestamp, timestampToDate } from '../utils/format'
import type { Person, Project, Task, TaskStatus, TaskInput } from '../types'

const props = withDefaults(
  defineProps<{
    task: Task | null
    people: Person[]
    projects: Project[]
    defaultPersonId?: number
    defaultProjectId?: number
    defaultTitle?: string
    defaultStartDate?: string | null
    defaultEndDate?: string | null
    disabled?: boolean
    serverErrors?: Record<string, string>
  }>(),
  {
    defaultPersonId: 0,
    defaultProjectId: 0,
    defaultTitle: '',
    defaultStartDate: null,
    defaultEndDate: null,
    disabled: false,
    serverErrors: () => ({}),
  },
)

const emit = defineEmits<{ dirty: [value: boolean] }>()

const route = useRoute()

// 提示里的「设置」跟随当前端，H5 不会把用户带回 PC 布局。
const settingsPath = computed(() => (route.path.startsWith('/m') ? '/m/settings' : '/pc/settings'))

// 约定：新建时人员默认落到「待分配」，项目、标题与日期取传入的默认值。
const form = reactive({
  title: props.task?.title ?? props.defaultTitle,
  person_id: (props.task?.person_id ?? props.defaultPersonId ?? null) as number | null,
  project_id: (props.task?.project_id ?? props.defaultProjectId ?? null) as number | null,
  startAt: dateToTimestamp(props.task?.start_date ?? props.defaultStartDate),
  endAt: dateToTimestamp(props.task?.end_date ?? props.defaultEndDate),
  status: (props.task?.status ?? 'todo') as TaskStatus,
  note: props.task?.note ?? '',
})

const baseline = JSON.stringify(snapshot())

/** 收集当前表单值，用于判断是否有未保存修改。 */
function snapshot(): Record<string, unknown> {
  return {
    title: form.title,
    person_id: form.person_id,
    project_id: form.project_id,
    startAt: form.startAt,
    endAt: form.endAt,
    status: form.status,
    note: form.note,
  }
}

const isDirty = computed(() => JSON.stringify(snapshot()) !== baseline)

watch(isDirty, (value) => emit('dirty', value), { immediate: true })

const localErrors = reactive<Record<string, string>>({})

/** 返回某个字段当前应显示的错误文案。 */
function errorFor(field: string): string {
  return localErrors[field] ?? props.serverErrors[field] ?? ''
}

/** 生成人员下拉选项。 */
const personOptions = computed<SelectOption[]>(() =>
  props.people.map((person) => {
    const base = person.is_system ? `${person.name}（未指派）` : person.name
    return {
      label: person.archived_at ? `${base}（已归档）` : base,
      value: person.id,
    }
  }),
)

/** 生成项目下拉选项。 */
const projectOptions = computed<SelectOption[]>(() =>
  props.projects.map((project) => ({
    label: project.archived_at ? `${project.name}（已归档）` : project.name,
    value: project.id,
  })),
)

/** 处理人员选择。 */
function setPerson(value: unknown): void {
  form.person_id = typeof value === 'number' ? value : null
}

/** 处理项目选择。 */
function setProject(value: unknown): void {
  form.project_id = typeof value === 'number' ? value : null
}

/** 处理开始日选择。 */
function setStartAt(value: unknown): void {
  form.startAt = typeof value === 'number' ? value : null
}

/** 处理截止日选择。 */
function setEndAt(value: unknown): void {
  form.endAt = typeof value === 'number' ? value : null
}

/** 处理状态选择。 */
function setStatus(value: unknown): void {
  if (typeof value === 'string' && (TASK_STATUSES as string[]).includes(value)) {
    form.status = value as TaskStatus
  }
}

/** 校验表单；通过时返回接口需要的完整任务对象。 */
function validate(): TaskInput | null {
  for (const key of Object.keys(localErrors)) delete localErrors[key]

  const title = form.title.trim()
  if (!title) localErrors.title = '请输入任务标题'
  else if (title.length > 120) localErrors.title = '标题不能超过 120 个字符'

  if (!form.project_id) localErrors.project_id = '请选择项目'
  if (!form.person_id) localErrors.person_id = '请选择人员'

  // 约定：两个日期都可为空，都填时开始日不得晚于截止日。
  if (form.startAt !== null && form.endAt !== null && form.startAt > form.endAt) {
    localErrors.end_date = '截止日不能早于开始日'
  }
  if (form.note.length > 500) localErrors.note = '备注不能超过 500 个字符'

  if (Object.keys(localErrors).length > 0) return null
  // 兜底：错误表为空时这两个值一定已经通过校验。
  if (!form.person_id || !form.project_id) return null

  return {
    title,
    person_id: form.person_id,
    project_id: form.project_id,
    start_date: timestampToDate(form.startAt),
    end_date: timestampToDate(form.endAt),
    status: form.status,
    note: form.note,
  }
}

defineExpose({ validate })
</script>

<template>
  <div class="task-form" :class="{ disabled }">
    <n-alert v-if="!projects.length" type="warning" :show-icon="true" class="notice">
      还没有可用项目，请先到 <RouterLink :to="settingsPath">设置</RouterLink> 里创建一个项目。
    </n-alert>

    <n-form :model="form" label-placement="top" :show-require-mark="false">
      <n-form-item
        label="标题"
        required
        :validation-status="errorFor('title') ? 'error' : undefined"
        :feedback="errorFor('title')"
      >
        <n-input
          v-model:value="form.title"
          maxlength="120"
          show-count
          placeholder="例如：接口拆分"
          :status="errorFor('title') ? 'error' : undefined"
          :disabled="disabled"
        />
      </n-form-item>

      <div class="field-row">
        <n-form-item
          label="人员"
          required
          :validation-status="errorFor('person_id') ? 'error' : undefined"
          :feedback="errorFor('person_id') || '留「待分配」即表示还未指派。'"
        >
          <n-select
            :value="form.person_id"
            :options="personOptions"
            placeholder="选择人员"
            :disabled="disabled"
            @update:value="setPerson"
          />
        </n-form-item>

        <n-form-item
          label="项目"
          required
          :validation-status="errorFor('project_id') ? 'error' : undefined"
          :feedback="errorFor('project_id')"
        >
          <n-select
            :value="form.project_id"
            :options="projectOptions"
            placeholder="选择项目"
            :disabled="disabled"
            @update:value="setProject"
          />
        </n-form-item>
      </div>

      <div class="field-row">
        <n-form-item
          label="开始日"
          :validation-status="errorFor('start_date') ? 'error' : undefined"
          :feedback="errorFor('start_date')"
        >
          <n-date-picker
            :value="form.startAt"
            type="date"
            clearable
            style="width: 100%"
            :disabled="disabled"
            @update:value="setStartAt"
          />
        </n-form-item>

        <n-form-item
          label="截止日"
          :validation-status="errorFor('end_date') ? 'error' : undefined"
          :feedback="errorFor('end_date') || '日期可以留空，表示还没定。'"
        >
          <n-date-picker
            :value="form.endAt"
            type="date"
            clearable
            style="width: 100%"
            :disabled="disabled"
            @update:value="setEndAt"
          />
        </n-form-item>
      </div>

      <n-form-item label="状态">
        <n-radio-group
          :value="form.status"
          :disabled="disabled"
          @update:value="setStatus"
        >
          <n-radio-button v-for="status in TASK_STATUSES" :key="status" :value="status">
            {{ STATUS_META[status].label }}
          </n-radio-button>
        </n-radio-group>
      </n-form-item>

      <n-form-item
        label="备注"
        :validation-status="errorFor('note') ? 'error' : undefined"
        :feedback="errorFor('note')"
      >
        <n-input
          v-model:value="form.note"
          type="textarea"
          maxlength="500"
          show-count
          placeholder="补充说明，纯文本即可"
          :autosize="{ minRows: 3, maxRows: 6 }"
          :disabled="disabled"
        />
      </n-form-item>
    </n-form>
  </div>
</template>

<style scoped>
.task-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notice {
  margin-bottom: 4px;
}

.notice :deep(a) {
  color: var(--primary);
  font-weight: 500;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 14px;
}

.task-form :deep(.n-form-item) {
  margin-bottom: 18px;
}

.task-form :deep(.n-form-item-label) {
  font-size: 13px;
  color: var(--text-secondary);
}

@media (max-width: 560px) {
  .field-row {
    grid-template-columns: 1fr;
  }
}
</style>
