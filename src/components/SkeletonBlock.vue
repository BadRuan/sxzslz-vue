<script setup lang="ts">
/**
 * 全站骨架原语：一个脉冲灰块，尺寸由调用方传入的 Tailwind class 决定
 * （如 w-4/5、h-4），daisyUI 的 .skeleton 提供底色与脉冲动画。
 */
interface Props {
    /** 宽度 class，如 'w-4/5' */
    w?: string;
    /** 高度 class，如 'h-4' */
    h?: string;
    /** 圆角 class，默认 'rounded' */
    rounded?: string;
    /** 额外 class，合并到根元素（尺寸类通常走这里） */
    class?: string;
}
const props = withDefaults(defineProps<Props>(), {
    rounded: 'rounded',
});
</script>

<template>
    <div :class="['skeleton', props.rounded, props.w, props.h, props.class]"></div>
</template>
