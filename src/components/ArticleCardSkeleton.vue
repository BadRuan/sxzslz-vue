<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';
</script>

<template>
    <!-- 与 Article/List.vue 真实文章卡片同结构的骨架：封面 + 标题行阶梯 + 日期行占位 -->
    <div class="overflow-hidden rounded-box border border-base-300 bg-base-100">
        <SkeletonBlock class="aspect-[16/10]" rounded="" />
        <!-- 正文占位与真实卡片对齐：标题区 min-h 84px（3×leading-7）+ footer text-xs 行 16px，总高与 List.vue 卡片一致 -->
        <div class="p-5">
            <div class="min-h-[5.25rem] space-y-3">
                <SkeletonBlock class="h-4 w-4/5" />
                <SkeletonBlock class="h-4 w-3/5" />
                <SkeletonBlock class="h-3 w-1/3" />
            </div>
            <div class="border-t border-base-300/70 pt-3.5">
                <SkeletonBlock class="h-4 w-20" />
            </div>
        </div>
    </div>
</template>
