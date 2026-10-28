<script setup lang="ts">
import { url_prefix } from '@/utils/baseInfo';

// 封面多为红头文件等竖版公文：object-contain 保证高度撑满、完整展示（含红头），
// 宽度按比例收窄；object-contain 留出的两侧/上下空白用 base-300 衬底，
// 与白纸公文形成柔和对比，避免突兀，也不像 object-cover 那样裁掉文头。
withDefaults(defineProps<{
    /** 图片 slug；为空时展示占位 */
    slug?: string | null,
    alt?: string,
}>(), {
    slug: null,
    alt: '',
});
</script>

<template>
    <!-- 默认懒加载 + 异步解码：首屏外的封面不阻塞 LCP；调用方仍可通过 $attrs 覆盖 -->
    <img v-if="slug" :src="url_prefix.pic_prefix + slug" :alt="alt"
        loading="lazy" decoding="async"
        class="h-full w-full bg-base-300 object-contain" v-bind="$attrs" />
    <div v-else
        class="flex h-full w-full items-center justify-center bg-base-300 text-sm text-base-content/40">
        暂无封面
    </div>
</template>
