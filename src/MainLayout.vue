<script setup lang="ts">
import { useRoute } from 'vue-router'
import Header from '@/common/Header.vue'
import Footer from '@/common/Footer.vue'

const route = useRoute()
</script>

<template>
  <Header />
  <router-view v-slot="{ Component }">
    <!-- 不用 mode="out-in"：Vue 3.5 + vue-router 5 下其出场 wrapper 可能不触发，
         isLeaving 卡住导致后续路由正文永不可见（曾表现为"只有页头页尾"）。
         默认交叉淡入 + :key 保证每次导航都是全新挂载。 -->
    <Transition name="page">
      <!-- 仅路径变化才整页重挂载：同路由 query 变化（列表切分类/翻页）复用组件局部刷新 -->
  <component :is="Component" :key="route.path" />
    </Transition>
  </router-view>
  <Footer />
</template>
