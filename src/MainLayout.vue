<script setup lang="ts">
import Header from '@/common/Header.vue'
import Footer from '@/common/Footer.vue'
// TODO: 调试插桩，定位后移除
const dbg = (ev: string) => console.log('[transition]', ev, location.pathname);
</script>

<template>
  <Header />
  <router-view v-slot="{ Component }">
    <Transition name="page" mode="out-in"
      @enter="dbg('enter')" @after-enter="dbg('after-enter')"
      @leave="dbg('leave')" @after-leave="dbg('after-leave')">
      <component :is="Component" />
    </Transition>
  </router-view>
  <Footer />
</template>
