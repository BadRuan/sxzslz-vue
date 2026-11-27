<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';
</script>

<template>
    <!-- 与 Article/List.vue 真实文章卡片同结构的骨架：封面 + 标题行阶梯 + 日期行占位 -->
    <div class="overflow-hidden rounded-box border border-base-300 bg-base-100">
        <SkeletonBlock class="aspect-[16/10]" rounded="" />
        <div class="space-y-3 p-5">
            <SkeletonBlock class="h-4 w-4/5" />
            <SkeletonBlock class="h-4 w-3/5" />
            <SkeletonBlock class="h-3 w-1/3" />
            <div class="border-t border-base-300/70 pt-3.5">
                <SkeletonBlock class="h-3 w-20" />
            </div>
        </div>
    </div>
</template>
