<script setup lang="ts">
import { computed } from 'vue';
import { usePermissions } from '@/composables/usePermissions';

const { is_superuser, can_manage_categories } = usePermissions();

interface NavItem {
    name: string
    label: string
    icon: string
}

interface NavGroup {
    label: string
    items: NavItem[]
}

const icon_document = 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
const icon_chart = 'M4 19V5m0 14h16M8 16v-4m4 4V9m4 7v-6';
const icon_folder = 'M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z';
const icon_users = 'M16 19v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 11a3 3 0 100-6 3 3 0 000 6zm11.5 8v-1a4 4 0 00-3-3.87M16.5 5.13A4 4 0 0119 9';
const icon_photo = 'M4 5h16v14H4V5zm2 10l3.5-3.5 3 3L16 11l4 4M15 9h.01';
const icon_file = 'M12 4v9m0 0l3-3m-3 3l-3-3M5 17v2a2 2 0 002 2h10a2 2 0 002-2v-2';
const icon_lock = 'M6 11h12v9H6v-9zm3 0V8a3 3 0 016 0v3';
const icon_logs = 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';

/**
 * 侧边栏菜单：分类管理 / 账户管理仅超级管理员可见（普通账号访问路由也会被守卫拦截）
 * 后台信息量大，按「总览 / 内容 / 资源 / 系统」分组，组间用小标题分隔，扫读更快。
 */
const nav_groups = computed<NavGroup[]>(() => [
    {
        label: '总览',
        items: [{ name: 'AdminOverview', label: '数据概览', icon: icon_chart }],
    },
    {
        label: '内容',
        items: [
            { name: 'AdminArticleList', label: '文章管理', icon: icon_document },
            ...(can_manage_categories.value
                ? [{ name: 'AdminCategory', label: '分类管理', icon: icon_folder }]
                : []),
        ],
    },
    {
        label: '资源',
        items: [
            { name: 'AdminPhoto', label: '照片管理', icon: icon_photo },
            { name: 'AdminDocument', label: '文档管理', icon: icon_file },
        ],
    },
    {
        label: '系统',
        items: [
            ...(is_superuser.value
                ? [
                    { name: 'AdminUsers', label: '账户管理', icon: icon_users },
                    { name: 'AdminLogs', label: '操作日志', icon: icon_logs },
                ]
                : []),
            { name: 'AdminPassword', label: '修改密码', icon: icon_lock },
        ],
    },
]);
</script>

<template>
    <!-- 宽屏 240px 带文字，窄屏收成 64px 图标条（带 title 提示），后台在小屏也能操作 -->
    <aside class="flex h-full w-16 shrink-0 flex-col border-r border-base-300 bg-base-100 lg:w-60">
        <RouterLink :to="{ name: 'AdminOverview' }"
            class="flex h-16 shrink-0 items-center gap-2.5 border-b border-base-300 px-4">
            <img src="/icon/water-logo.svg" class="h-8 w-8 shrink-0" alt="logo" />
            <span class="hidden min-w-0 flex-col leading-tight lg:flex">
                <span class="truncate text-sm font-semibold text-base-content">管理后台</span>
                <span class="truncate text-[0.625rem] text-base-content/50">沈巷镇水利站</span>
            </span>
        </RouterLink>

        <nav class="flex-1 space-y-5 overflow-y-auto px-2 py-5 lg:px-3">
            <div v-for="group in nav_groups" :key="group.label">
                <p class="hidden px-2.5 pb-1.5 text-[0.625rem] font-medium tracking-[0.14em] text-base-content/45 lg:block">
                    {{ group.label }}
                </p>
                <ul class="space-y-0.5">
                    <li v-for="item in group.items" :key="item.name">
                        <RouterLink :to="{ name: item.name }" :title="item.label" class="admin-nav-link"
                            active-class="is-active">
                            <svg class="h-[1.125rem] w-[1.125rem] shrink-0" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
                                aria-hidden="true">
                                <path :d="item.icon" />
                            </svg>
                            <span class="hidden truncate lg:block">{{ item.label }}</span>
                        </RouterLink>
                    </li>
                </ul>
            </div>
        </nav>

        <div class="hidden border-t border-base-300 px-4 py-3 lg:block">
            <p class="text-[0.625rem] leading-relaxed text-base-content/40">沈巷镇水利站 · 内容管理系统</p>
        </div>
    </aside>
</template>

<style scoped>
/* 导航项：常规态低调，激活态用主色底 + 主色字，与站内前台保持同一套选中语言 */
.admin-nav-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.625rem;
    font-size: 0.875rem;
    color: color-mix(in oklab, var(--color-base-content) 62%, transparent);
    transition: background-color 180ms ease-out, color 180ms ease-out;
}

@media (min-width: 1024px) {
    .admin-nav-link {
        justify-content: flex-start;
    }
}

.admin-nav-link:hover {
    background-color: var(--color-base-200);
    color: var(--color-base-content);
}

.admin-nav-link.is-active {
    background-color: color-mix(in oklab, var(--color-primary) 10%, transparent);
    color: var(--color-primary);
    font-weight: 600;
}
</style>
