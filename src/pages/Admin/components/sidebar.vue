<script setup lang="ts">
import { computed } from 'vue';
import { usePermissions } from '@/composables/usePermissions';

const link_active_class = 'menu-active !text-primary font-semibold';

const { can_manage_categories } = usePermissions();

interface NavItem {
    name: string
    label: string
    visible: boolean
}

/** 侧边栏菜单：分类管理仅超级管理员可见（普通账号访问路由也会被守卫拦截） */
const nav_items = computed<NavItem[]>(() => [
    { name: 'AdminOverview', label: '数据概览', visible: true },
    { name: 'AdminArticleList', label: '文章管理', visible: true },
    { name: 'AdminCategory', label: '分类管理', visible: can_manage_categories.value },
    { name: 'AdminPhoto', label: '照片管理', visible: true },
    { name: 'AdminDocument', label: '文档管理', visible: true },
]);
</script>

<template>
    <aside class="w-48 h-full bg-base-100 border-r border-base-300 flex flex-col">
        <div class="h-16 flex items-center px-4">
            <img src="/icon/water-logo.svg" class="h-8" alt="logo" />
            <span class="ml-2 font-semibold text-base-content">管理后台</span>
        </div>

        <ul class="menu w-full flex-1 px-4 py-6 gap-1">
            <li v-for="item in nav_items" :key="item.name" v-show="item.visible">
                <RouterLink :to="{ name: item.name }" :active-class="link_active_class" class="w-full">
                    {{ item.label }}
                </RouterLink>
            </li>

            <li class="mt-auto">
                <RouterLink :to="{ name: 'AdminPassword' }" :active-class="link_active_class" class="w-full">
                    修改密码
                </RouterLink>
            </li>
        </ul>
    </aside>
</template>
