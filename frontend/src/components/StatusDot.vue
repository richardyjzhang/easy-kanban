<!-- 任务状态色点，颜色取自约定的四态色板。 -->
<script setup lang="ts">
import { computed } from 'vue'

import { STATUS_META } from '../constants'
import type { TaskStatus } from '../types'

const props = withDefaults(defineProps<{ status: TaskStatus; size?: number }>(), {
  size: 8,
})

const meta = computed(() => STATUS_META[props.status])
</script>

<template>
  <span
    class="status-dot"
    :style="{ width: `${size}px`, height: `${size}px`, background: meta.color }"
    :title="meta.label"
  ></span>
</template>

<style scoped>
.status-dot {
  display: inline-block;
  flex: none;
  border-radius: 50%;
}
</style>
