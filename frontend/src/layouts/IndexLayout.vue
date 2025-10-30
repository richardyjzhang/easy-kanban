<template>
  <div class="h-screen flex flex-col">
    <nav-bar />
    <div class="grow flex shadow-md">
      <div
        :class="[
          collapsed ? 'w-0' : 'w-60',
          'h-full bg-red-300',
          'transition-all duration-300 ease-in-out',
        ]"
      ></div>
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useMenuCollapseStore } from '@/stores/counter'
import NavBar from './components/NavBar.vue'

const menuCollapsed = useMenuCollapseStore()
const { collapsed } = storeToRefs(menuCollapsed)
</script>

<style>
@import 'tailwindcss';
</style>
