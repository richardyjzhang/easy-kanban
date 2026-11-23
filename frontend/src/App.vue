<!-- 根组件：提供 Naive UI 主题与中文语言包。 -->
<script setup lang="ts">
import { NConfigProvider, dateZhCN, zhCN } from 'naive-ui'

import { themeOverrides } from './theme'
</script>

<template>
  <n-config-provider :theme-overrides="themeOverrides" :locale="zhCN" :date-locale="dateZhCN">
    <RouterView />
  </n-config-provider>
</template>
