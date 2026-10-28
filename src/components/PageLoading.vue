<script setup lang="ts">
withDefaults(defineProps<{
    /** 加载提示文案 */
    label?: string,
    /** 是否撑满内容区高度（主页/后台占位更稳定） */
    fullHeight?: boolean,
}>(), {
    label: '加载中...',
    fullHeight: false,
});
</script>

<template>
    <div class="flex flex-col items-center justify-center text-base-content/60"
        :class="fullHeight ? 'min-h-[60vh]' : 'py-16'">
        <span class="loading loading-spinner loading-md mb-4"></span>
        <p class="text-sm">{{ label }}</p>
    </div>
</template>
