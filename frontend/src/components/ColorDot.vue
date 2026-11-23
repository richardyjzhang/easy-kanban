<!-- 颜色圆点：用于人员/项目标识。 -->
<script setup lang="ts">
withDefaults(defineProps<{ color: string; size?: number }>(), { size: 10 })
</script>

<template>
  <span
    class="color-dot"
    :style="{ width: `${size}px`, height: `${size}px`, background: color }"
  ></span>
</template>

<style scoped>
.color-dot {
  display: inline-block;
  flex: none;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(16, 24, 40, 0.08) inset;
}
</style>
