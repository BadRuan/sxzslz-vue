<script setup lang="ts">
import Section_1 from './Section_1.vue';
import Section_2 from './Section_2.vue';
</script>

<template>
    <!-- 必须单根：MainLayout 的页面过渡 <Transition> 需要真实根元素，
         fragment 根会让过渡异常，导致路由切换后正文不渲染 -->
    <main>
        <Section_1 />
        <Section_2 />
    </main>
</template>