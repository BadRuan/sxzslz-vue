<script setup lang="ts">
import { useUserStore } from '@/store/user'
import { storeToRefs } from 'pinia'

const store = useUserStore()
const { nickname } = storeToRefs(store)
</script>


<template>
    <aside class="w-56 h-full bg-sidebar-bg flex flex-col">
        <div class="h-16 flex items-center px-4 border-b border-white/10">
            <img src="/icon/water-logo.svg" class="h-8 brightness-0 invert" alt="logo" />
            <span class="ml-2 text-white font-semibold">管理后台</span>
        </div>

        <nav class="flex-1 px-4 py-12 space-y-4">
            <RouterLink :to="{ name: 'AdminOverview' }" active-class="!text-white   !bg-sidebar-active"
                class="flex items-center px-3 py-2 rounded-md text-sm text-sidebar-text hover:bg-white/10 hover:text-white">
                <span class="mr-3">📊</span> 仪表盘
            </RouterLink>
            <RouterLink :to="{ name: 'AdminArticleList' }" active-class="!text-white   !bg-sidebar-active"
                class="flex items-center px-3 py-2 rounded-md text-sm text-sidebar-text hover:bg-white/10 hover:text-white">
                <span class="mr-3">📰</span> 文章管理
            </RouterLink>
            <a href="#"
                class="flex items-center px-3 py-2 rounded-md text-sm text-sidebar-text hover:bg-white/10 hover:text-white">
                <span class="mr-3">📁</span> 分类管理
            </a>
            <RouterLink :to="{ name: 'AdminPhoto' }" active-class="!text-white   !bg-sidebar-active"
                class="flex items-center px-3 py-2 rounded-md text-sm text-sidebar-text hover:bg-white/10 hover:text-white">
                <span class="mr-3">🖼️</span> 照片管理
            </RouterLink>
            <a href="#"
                class="flex items-center px-3 py-2 rounded-md text-sm text-sidebar-text hover:bg-white/10 hover:text-white">
                <span class="mr-3">⚙️</span> 系统设置
            </a>
        </nav>

        <div class="p-4 border-t border-white/10">
            <div class="text-xs text-sidebar-text">当前用户：{{ nickname }}</div>
        </div>
    </aside>
</template>