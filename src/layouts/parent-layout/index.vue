<script setup lang="ts">
/** 动态路由中间目录（RuoYi ParentView）占位，仅渲染子路由 */
defineOptions({
  name: 'ParentLayout'
});
</script>

<template>
  <RouterView />
</template>
