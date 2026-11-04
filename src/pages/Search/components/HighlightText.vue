<script setup lang="ts">
import { computed } from 'vue';
import { highlight_segments } from '@/utils/highlight';

/**
 * 纯文本关键词高亮：按分段渲染文本节点与 <mark>，不拼接 HTML。
 * 后端搜索接口只返回纯文本与 matched_terms（见对接文档 §7），高亮由前端完成。
 */
const props = withDefaults(defineProps<{
    text?: string | null,
    /** 关键词（直接传后端 matched_terms） */
    terms?: readonly string[],
}>(), {
    text: '',
    terms: () => [],
});

const segments = computed(() => highlight_segments(props.text ?? '', props.terms ?? []));
</script>

<template>
    <template v-for="(segment, index) in segments" :key="index">
        <mark v-if="segment.hit" class="rounded-sm bg-primary/15 px-0.5 font-semibold text-primary">{{ segment.text }}</mark>
        <template v-else>{{ segment.text }}</template>
    </template>
</template>
