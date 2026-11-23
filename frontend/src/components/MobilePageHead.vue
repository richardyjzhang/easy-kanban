<!-- H5 二级页顶栏：返回 + 标题 + 右侧操作。 -->
<script setup lang="ts">
import { NButton, NIcon } from 'naive-ui'
import { ArrowBackOutline } from '@vicons/ionicons5'
import { useRouter } from 'vue-router'

const props = withDefaults(defineProps<{ title: string; backTo?: string }>(), {
  backTo: '/m/settings',
})

const router = useRouter()

/** 返回上一级；深链进入时也能回到设置首页。 */
function back(): void {
  void router.push(props.backTo)
}
</script>

<template>
  <header class="m-subbar">
    <n-button quaternary circle size="small" aria-label="返回" @click="back">
      <template #icon>
        <n-icon :component="ArrowBackOutline" :size="20" />
      </template>
    </n-button>
    <h1 class="m-subbar-title">{{ title }}</h1>
    <div class="m-subbar-action">
      <slot />
    </div>
  </header>
</template>

<style scoped>
.m-subbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 52px;
  padding: 0 10px;
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(10px);
}

.m-subbar-title {
  flex: 1;
  min-width: 0;
  font-size: 16px;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.m-subbar-action {
  display: flex;
  flex: none;
  align-items: center;
  gap: 4px;
}
</style>
