<!-- H5 修改密码（P5 子页）：复用账号分区的密码表单。 -->
<script setup lang="ts">
import MobilePageHead from '../components/MobilePageHead.vue'
import PasswordSection from '../components/PasswordSection.vue'
</script>

<template>
  <div class="m-subpage">
    <mobile-page-head title="修改密码" />

    <div class="m-body">
      <section class="m-card">
        <password-section />
      </section>
    </div>
  </div>
</template>

<style scoped>
.m-subpage {
  min-height: 100dvh;
  background: var(--bg);
}

.m-body {
  padding: 12px 12px 28px;
}

.m-card {
  padding: 18px 16px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}
</style>
