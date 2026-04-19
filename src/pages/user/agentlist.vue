<template>
  <bd-page class="flex-col">
    <HotlineCustomerConfigPanel />
  </bd-page>
</template>

<route lang="yaml">
meta:
  title: 客服配置管理
  isAffix: false
</route>

<script setup lang="ts">
import HotlineCustomerConfigPanel from '@/components/hotline/HotlineCustomerConfigPanel.vue';
</script>
