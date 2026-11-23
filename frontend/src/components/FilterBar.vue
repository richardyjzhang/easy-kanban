<!-- 日期筛选栏：本周／下周／全部／自定义，筛选条件只在前端生效。 -->
<script setup lang="ts">
import { NButton, NButtonGroup, NDatePicker } from 'naive-ui'
import { computed } from 'vue'

import {
  FILTER_PRESETS,
  formatRangeLabel,
  resolveRange,
  timestampsToRange,
} from '../utils/dateRange'
import { dateToTimestamp } from '../utils/format'
import type { FilterPreset, FilterState } from '../utils/dateRange'

const props = defineProps<{ modelValue: FilterState }>()

const emit = defineEmits<{ 'update:modelValue': [value: FilterState] }>()

// 约定：默认「本周」，周起始为周一。
const range = computed(() => resolveRange(props.modelValue.preset, props.modelValue.custom))
const rangeLabel = computed(() => formatRangeLabel(range.value))

// 自定义区间转成日期选择器需要的 [起, 止] 时间戳。
const customValue = computed<[number, number] | null>(() => {
  const custom = props.modelValue.custom
  if (!custom) return null
  const start = dateToTimestamp(custom.start)
  const end = dateToTimestamp(custom.end)
  if (start === null || end === null) return null
  return [start, end]
})

/** 切换预设；选「自定义」时保留已选区间。 */
function setPreset(preset: FilterPreset): void {
  emit('update:modelValue', { ...props.modelValue, preset })
}

/** 处理自定义起止日。 */
function setCustom(value: unknown): void {
  const picked = Array.isArray(value) && value.length === 2 ? (value as [number, number]) : null
  emit('update:modelValue', {
    ...props.modelValue,
    preset: 'custom',
    custom: timestampsToRange(picked),
  })
}
</script>

<template>
  <div class="filter-bar">
    <n-button-group size="small">
      <n-button
        v-for="option in FILTER_PRESETS"
        :key="option.value"
        :type="modelValue.preset === option.value ? 'primary' : 'default'"
        :secondary="modelValue.preset !== option.value"
        @click="setPreset(option.value)"
      >
        {{ option.label }}
      </n-button>
    </n-button-group>

    <n-date-picker
      v-if="modelValue.preset === 'custom'"
      :value="customValue"
      type="daterange"
      size="small"
      clearable
      class="filter-dates"
      @update:value="setCustom"
    />

    <span class="filter-range" :title="`当前筛选区间：${rangeLabel}`">{{ rangeLabel }}</span>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.filter-dates {
  width: 240px;
}

.filter-range {
  color: var(--text-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
