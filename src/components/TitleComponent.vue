<script setup lang="ts">
/**
 * 栏目头：中文主标题 + 英文眉标 + 右侧动作区。
 * 保持既有用法（slots: first / second）不变，新增 action 插槽与 invert 反色（深色底）。
 */
withDefaults(defineProps<{ invert?: boolean }>(), { invert: false });
</script>

<template>
    <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div class="min-w-0">
            <p class="eyebrow" :class="invert ? '!text-white/70' : '!text-primary/75'">
                <span class="h-px w-7 bg-current opacity-60" aria-hidden="true"></span>
                <span class="truncate"><slot name="second"></slot></span>
            </p>
            <h2 class="mt-2.5 text-[1.55rem] font-bold leading-tight tracking-tight sm:text-[1.75rem]"
                :class="invert ? 'text-white' : 'text-base-content'">
                <slot name="first"></slot>
            </h2>
        </div>
        <div v-if="$slots.action" class="shrink-0 pb-1">
            <slot name="action"></slot>
        </div>
    </div>
</template>
