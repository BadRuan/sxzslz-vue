<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const router = useRouter();
const auth_store = useAuthStore();

const handle_logout = () => {
    auth_store.logout();
    // 退出后回网站首页（而非登录页）
    router.replace({ name: 'Home' });
};
</script>

<template>
    <header class="h-16 bg-background flex items-center justify-between px-6">
        <div class="text-lg font-semibold text-gray-900">仪表盘</div>
        <div class="flex items-center gap-4">
            <span class="text-sm text-gray-600">{{ auth_store.user?.nickname ?? '...' }}</span>
            <button class="text-sm text-gray-600 hover:text-primary-600 link-transition"
                @click="handle_logout">
                退出登录
            </button>
        </div>
    </header>
</template>
