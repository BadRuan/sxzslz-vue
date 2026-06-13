<script setup lang="ts">
import { useUserStore } from '@/store/user'
import { storeToRefs } from 'pinia'

const store = useUserStore()
const { nickname } = storeToRefs(store)
</script>


<template>
    <header class="h-16 bg-white border-b border-border flex items-center justify-between px-6">
        <div class="text-lg font-semibold text-gray-900">仪表盘</div>
        <div class="flex items-center gap-4">
            <span class="text-sm text-gray-600">{{ nickname }}</span>
            <RouterLink :to="{ name: 'Home' }" class="text-sm text-primary hover:underline">退出登录</RouterLink>
        </div>
    </header>
</template>