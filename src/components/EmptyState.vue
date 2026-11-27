<!-- EmptyState：全站统一空状态。默认变体为虚线圆角卡片（图标+标题+可选描述+可选动作按钮），
     compact 为单行紧凑文案（用于表格 td / 侧栏等嵌入位）。加载失败（错误+重试）不归本组件管。 -->
<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

/** 可选语义图标 */
type EmptyStateIcon = 'article' | 'category' | 'image' | 'file' | 'user' | 'log' | 'search' | 'inbox';

const props = defineProps<{
    /** 空状态标题（必填） */
    title: string;
    /** 补充说明（可选） */
    description?: string;
    /** 语义图标（可选，默认 inbox） */
    icon?: EmptyStateIcon;
    /** 动作按钮文案（可选） */
    actionLabel?: string;
    /** 有值时按钮渲染为 RouterLink 跳转；缺省则按钮触发 action 事件 */
    actionTo?: RouteLocationRaw;
    /** 紧凑单行模式（表格单元格 / 侧栏等嵌入位） */
    compact?: boolean;
}>();

const emit = defineEmits<{ action: [] }>();

const resolvedIcon = computed<EmptyStateIcon>(() => props.icon ?? 'inbox');
</script>

<template>
    <div :class="compact
        ? 'flex flex-col items-center gap-1 text-center text-sm text-base-content/50'
        : 'rounded-box border border-dashed border-base-300 bg-base-100 px-6 py-16 text-center'">
        <div :class="compact ? 'flex items-center gap-1.5' : ''">
            <svg :class="compact
                ? 'h-4 w-4 shrink-0 text-base-content/40'
                : 'mx-auto h-12 w-12 text-base-content/40'"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <template v-if="resolvedIcon === 'article'">
                    <path d="M6 3.5h7.5L18 8v12.5H6z" />
                    <path d="M13.5 3.5V8H18" />
                    <path d="M9 12.5h6M9 16h4" />
                </template>
                <template v-else-if="resolvedIcon === 'category'">
                    <path d="M3 7a2 2 0 0 1 2-2h3.6l1.8 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </template>
                <template v-else-if="resolvedIcon === 'image'">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                </template>
                <template v-else-if="resolvedIcon === 'file'">
                    <path d="M7 3.5h7l4 4v13H7z" />
                    <path d="M14 3.5v4h4" />
                </template>
                <template v-else-if="resolvedIcon === 'user'">
                    <circle cx="12" cy="8.5" r="3.5" />
                    <path d="M5.5 19.5c.9-3.4 3.5-5.2 6.5-5.2s5.6 1.8 6.5 5.2" />
                </template>
                <template v-else-if="resolvedIcon === 'log'">
                    <path d="M8.5 6.5h11M8.5 12h11M8.5 17.5h11" />
                    <path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" />
                </template>
                <template v-else-if="resolvedIcon === 'search'">
                    <circle cx="11" cy="11" r="6.5" />
                    <path d="M15.8 15.8 20.5 20.5" />
                </template>
                <template v-else>
                    <path d="M3.5 13h5l1.5 2.5h4L15.5 13h5" />
                    <path d="M5.8 5.5h12.4l2.3 7.5v5.5H3.5V13z" />
                </template>
            </svg>
            <span v-if="compact" class="font-medium text-base-content/65">{{ title }}</span>
        </div>
        <p v-if="!compact" class="mt-4 text-base-content/70 font-medium">{{ title }}</p>
        <p v-if="description" :class="compact
            ? 'text-xs text-base-content/45'
            : 'mt-1.5 text-sm text-base-content/50'">{{ description }}</p>
        <RouterLink v-if="actionTo && actionLabel" class="btn btn-primary btn-sm mt-6" :to="actionTo">
            {{ actionLabel }}
        </RouterLink>
        <button v-else-if="actionLabel" type="button" class="btn btn-primary btn-sm mt-6"
            @click="emit('action')">
            {{ actionLabel }}
        </button>
    </div>
</template>
