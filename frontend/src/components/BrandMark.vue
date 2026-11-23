<!-- 产品图标：2×2 圆角方块，模拟矩阵的两个维度。 -->
<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 22 })
</script>

<template>
  <span class="brand-mark" :style="{ width: `${size}px`, height: `${size}px` }" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" fill="currentColor" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" fill="currentColor" opacity="0.55" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" fill="currentColor" opacity="0.55" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" fill="currentColor" opacity="0.3" />
    </svg>
  </span>
</template>

<style scoped>
.brand-mark {
  display: inline-flex;
  flex: none;
  color: var(--primary);
}

.brand-mark svg {
  width: 100%;
  height: 100%;
}
</style>
