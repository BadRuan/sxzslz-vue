<script setup lang="ts">
/**
 * 统一分页条：前台文章列表与后台各管理页共用。
 * 只负责展示与翻页触发，数据获取由调用方自行完成。
 */
import { computed } from 'vue';

const props = defineProps<{
    page: number
    hasNext: boolean
    total: number
    /** 计数单位（条/张/个），默认「条」 */
    unit?: string
    /** 每页条数：传入后额外显示总页数（总页数 = ceil(total / pageSize)） */
    pageSize?: number
}>()

const emit = defineEmits<{
    change: [page: number]
}>()

const total_pages = computed(() => {
    if (!props.pageSize || props.pageSize <= 0) return 0;
    return Math.max(1, Math.ceil(props.total / props.pageSize));
});
</script>

<template>
    <nav class="flex items-center justify-between border-t border-base-300 pt-6" aria-label="Pagination">
        <!-- 单行拼接：避免模板换行产生多余空格（「条 ，第」） -->
        <p class="text-sm text-base-content/80">共 <span class="font-medium">{{ total }}</span> {{ unit ?? '条' }}<template v-if="total_pages > 0">，共 <span class="font-medium">{{ total_pages }}</span> 页</template>，第 <span class="font-medium">{{ page }}</span> 页</p>
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
