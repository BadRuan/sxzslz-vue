<script setup lang="ts">
/**
 * 统一分页条：前台文章列表与后台各管理页共用。
 * 只负责展示与翻页触发，数据获取由调用方自行完成。
 */
defineProps<{
    page: number
    hasNext: boolean
    total: number
    /** 计数单位（条/张/个），默认「条」 */
    unit?: string
}>()

const emit = defineEmits<{
    change: [page: number]
}>()
</script>

<template>
    <nav class="flex items-center justify-between border-t border-base-300 pt-6" aria-label="Pagination">
        <p class="text-sm text-base-content/80">
            共 <span class="font-medium">{{ total }}</span> {{ unit ?? '条' }}，
            第 <span class="font-medium">{{ page }}</span> 页
        </p>
        <div class="join">
            <button class="btn" :disabled="page <= 1" :class="{ 'btn-disabled': page <= 1 }"
                @click="emit('change', page - 1)">
                上一页
            </button>
            <button class="btn btn-primary" :disabled="!hasNext" :class="{ 'btn-disabled': !hasNext }"
                @click="emit('change', page + 1)">
                下一页
            </button>
        </div>
    </nav>
</template>
