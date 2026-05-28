<script setup lang="ts">
/**
 * 兼容旧路径 `views/wms/devanning-order/index`（与后端菜单 component 一致）。
 * 实际页面在 `wms/order/devanning-order`，此处仅做转发，避免重复维护两套业务代码。
 */
import DevanningOrderPage from '@/views/wms/order/devanning-order/index.vue';

defineOptions({
  name: 'DevanningOrderListLegacyPath'
});
</script>

<template>
  <DevanningOrderPage />
</template>
