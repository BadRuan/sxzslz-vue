<script setup lang="ts">
import { ref } from 'vue';

// 默认激活第一个选项卡
const activeIndex = ref<number>(0);

const tabs = [
    { title: '产品特性', content: '这是关于产品特性的详细说明。内容在下方撑开显示，不会浮动遮挡其他元素。' },
    { title: '解决方案', content: '针对不同行业提供定制化解决方案，提升业务效率。' },
    { title: '关于我们', content: '了解我们的团队背景、发展历程以及企业愿景。' }
];
</script>

<template>
    <div class="w-full max-w-xl mx-auto p-6">
        <!-- 选项卡头部：使用 flex 布局横向排列 -->
        <div class="flex border-b border-slate-200">
            <button v-for="(tab, index) in tabs" :key="index" @mouseover="activeIndex = index" :class="[
                'px-6 py-3 text-sm font-medium transition-colors duration-200 cursor-pointer',
                activeIndex === index
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-500 hover:text-slate-700'
            ]">
                {{ tab.title }}
            </button>
        </div>

        <div class="bg-white p-6 border border-t-0 border-slate-200 rounded-b-lg">
            <transition name="fade" mode="out-in">
                <div :key="activeIndex">
                    <h3 class="text-lg font-semibold text-slate-800">{{ tabs[activeIndex]?.title ?? '' }}</h3>
                    <p class="mt-2 text-slate-600">{{ tabs[activeIndex]?.content ?? '' }}</p>
                </div>
            </transition>
        </div>
    </div>
</template>

<style scoped>
/* 简单的淡入淡出过渡效果 */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
