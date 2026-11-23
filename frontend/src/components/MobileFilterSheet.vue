<!-- H5 日期筛选弹层（D6）：预设范围 + 自定义起止日。
     自定义用两个单日选择器，避免双月面板在 375px 宽度下溢出。 -->
<script setup lang="ts">
import { NButton, NDatePicker, NDrawer, NDrawerContent } from 'naive-ui'
import { computed, ref, watch } from 'vue'

import { dateToTimestamp, timestampToDate } from '../utils/format'
import {
  FILTER_PRESETS,
  formatRangeLabel,
  resolveRange,
} from '../utils/dateRange'
import type { FilterPreset, FilterState } from '../utils/dateRange'

const props = defineProps<{ open: boolean; modelValue: FilterState }>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:modelValue': [value: FilterState]
}>()

const customStart = ref<number | null>(null)
const customEnd = ref<number | null>(null)
const customError = ref('')
// 弹层里的草稿选择：只有点「应用」或选非自定义预设才写回父组件。
const selected = ref<FilterPreset>('this-week')

const range = computed(() => resolveRange(props.modelValue.preset, props.modelValue.custom))
const rangeLabel = computed(() => formatRangeLabel(range.value))

// 每次打开都把草稿同步成当前值，取消后不会留下半截草稿。
watch(
  () => props.open,
  (open) => {
    if (!open) return
    selected.value = props.modelValue.preset
    customStart.value = dateToTimestamp(props.modelValue.custom?.start ?? null)
    customEnd.value = dateToTimestamp(props.modelValue.custom?.end ?? null)
    customError.value = ''
  },
  { immediate: true },
)

/** 关闭弹层。 */
function close(): void {
  emit('update:open', false)
}

/** 选择预设；「自定义」留在弹层里继续选日期。 */
function choose(preset: FilterPreset): void {
  selected.value = preset
  if (preset === 'custom') return
  emit('update:modelValue', { ...props.modelValue, preset })
  close()
}

/** 应用自定义区间；两个日期都合法才写回。 */
function applyCustom(): void {
  const start = timestampToDate(customStart.value)
  const end = timestampToDate(customEnd.value)
  if (!start || !end) {
    customError.value = '请选择完整的起止日期'
    return
  }
  if (start > end) {
    customError.value = '截止日不能早于开始日'
    return
  }
  customError.value = ''
  emit('update:modelValue', { preset: 'custom', custom: { start, end } })
  close()
}
</script>

<template>
  <n-drawer
    :show="open"
    placement="bottom"
    height="auto"
    :bordered="false"
    class="filter-drawer"
    @update:show="(value) => !value && close()"
  >
    <n-drawer-content title="日期筛选" closable :native-scrollbar="false">
      <p class="filter-current">当前：{{ rangeLabel }}</p>

      <div class="preset-grid">
        <button
          v-for="option in FILTER_PRESETS"
          :key="option.value"
          type="button"
          class="preset"
          :class="{ active: selected === option.value }"
          @click="choose(option.value)"
        >
          {{ option.label }}
        </button>
      </div>

      <div v-if="selected === 'custom'" class="custom">
        <label class="field">
          <span class="field-label">开始日</span>
          <n-date-picker
            v-model:value="customStart"
            type="date"
            clearable
            style="width: 100%"
          />
        </label>
        <label class="field">
          <span class="field-label">截止日</span>
          <n-date-picker v-model:value="customEnd" type="date" clearable style="width: 100%" />
        </label>
        <p v-if="customError" class="custom-error">{{ customError }}</p>
        <n-button type="primary" block @click="applyCustom">应用自定义范围</n-button>
      </div>

      <p class="filter-hint">
        区间有交集即显示；日期不全的任务不属于任何周次，在任何筛选下都会显示。
      </p>
    </n-drawer-content>
  </n-drawer>
</template>

<style scoped>
.filter-current {
  color: var(--text-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.preset {
  padding: 11px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 14px;
  text-align: center;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    color 0.15s ease;
}

.preset.active {
  border-color: var(--primary);
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 600;
}

.custom {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed var(--border);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
}

.custom-error {
  color: var(--danger);
  font-size: 12px;
}

.filter-hint {
  margin-top: 16px;
  color: var(--text-faint);
  font-size: 12px;
  line-height: 1.6;
}
</style>
