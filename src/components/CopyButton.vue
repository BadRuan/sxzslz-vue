<script setup lang="ts">
import { ref } from 'vue';
import { copy_text } from '@/utils/clipboard';

const props = withDefaults(defineProps<{
    /** 待复制文本（slug 或 Markdown 片段） */
    text: string,
    /** 默认按钮文案 */
    label?: string,
}>(), {
    label: '复制 slug',
});

const copied = ref(false);
const failed = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

const flash = (done: () => void, ms: number) => {
    clearTimeout(timer);
    done();
    timer = setTimeout(() => {
        copied.value = false;
        failed.value = false;
    }, ms);
};

const on_copy = async () => {
    if (await copy_text(props.text)) {
        flash(() => { copied.value = true; failed.value = false; }, 1500);
    } else {
        flash(() => { copied.value = false; failed.value = true; }, 2000);
    }
};
</script>

<template>
    <button type="button" class="btn btn-ghost btn-xs"
        :class="failed ? 'text-error' : 'text-primary'" @click="on_copy">
        {{ copied ? '已复制' : failed ? '复制失败' : label }}
    </button>
</template>
