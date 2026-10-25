<script setup lang="ts">
/**
 * 统一弹窗外壳：v-model 控制开合，点击遮罩关闭。
 * default slot 放表单内容，footer slot 放按钮排（取消/保存等）。
 */
defineProps<{
    modelValue: boolean
    title: string
    /** modal-box 宽度类，默认 max-w-lg；可传 max-w-3xl / max-w-sm 等 */
    maxWidth?: string
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
}>()

const close = () => emit('update:modelValue', false)
</script>

<template>
    <Transition name="modal">
        <div v-if="modelValue" class="modal modal-open">
            <div class="modal-backdrop" @click="close"></div>
            <div class="modal-box w-full overflow-y-auto" :class="[maxWidth ?? 'max-w-lg', 'max-h-[90vh]']">
                <h3 class="text-lg font-bold mb-4">{{ title }}</h3>
                <slot />
                <div v-if="$slots.footer" class="mt-5 flex justify-end gap-3">
                    <slot name="footer" />
                </div>
            </div>
        </div>
    </Transition>
</template>
