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
            <!-- flex 列布局：仅内容区滚动，footer 按钮固定可见（768 高屏编辑长文时无需滚到底） -->
            <div class="modal-box w-full flex flex-col max-h-[90vh]" :class="maxWidth ?? 'max-w-lg'">
                <h3 class="text-lg font-bold mb-4 shrink-0">{{ title }}</h3>
                <div class="flex-1 overflow-y-auto min-h-0">
                    <slot />
                </div>
                <div v-if="$slots.footer"
                    class="mt-5 pt-3 border-t border-base-300 shrink-0 flex justify-end gap-3 bg-base-100">
                    <slot name="footer" />
                </div>
            </div>
        </div>
    </Transition>
</template>
