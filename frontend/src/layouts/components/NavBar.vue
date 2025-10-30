<template>
  <nav class="w-full h-12 bg-green-300 border-b border-b-gray-300 flex items-center">
    <n-button @click="handleClick">点</n-button>
  </nav>
</template>

<script setup lang="ts">
import { useMenuCollapseStore } from '@/stores/counter'
import { NButton } from 'naive-ui'

const menuCollapsed = useMenuCollapseStore()

function handleClick() {
  menuCollapsed.toggle()
}
</script>
