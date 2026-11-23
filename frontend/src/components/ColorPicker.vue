<!-- 色板选择器：只允许选择约定好的 8 个颜色。 -->
<script setup lang="ts">
import { PALETTE } from '../constants'

withDefaults(defineProps<{ modelValue: string; disabled?: boolean }>(), {
  disabled: false,
})
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="color-picker" role="radiogroup" aria-label="颜色">
    <button
      v-for="color in PALETTE"
      :key="color"
      type="button"
      class="swatch"
      :class="{ active: color === modelValue }"
      :style="{ background: color, color }"
      :disabled="disabled"
      role="radio"
      :aria-checked="color === modelValue"
      :aria-label="color"
      @click="emit('update:modelValue', color)"
    >
      <span v-if="color === modelValue" class="tick">✓</span>
    </button>
  </div>
</template>

<style scoped>
.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.swatch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 50%;
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease;
}

.swatch:hover:not(:disabled) {
  transform: scale(1.08);
}

.swatch.active {
  box-shadow:
    0 0 0 2px var(--surface),
    0 0 0 4px currentColor;
}

.swatch:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.tick {
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}
</style>
