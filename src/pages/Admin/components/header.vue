<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const route = useRoute();
const router = useRouter();
const auth_store = useAuthStore();

// 各后台路由 meta.title 动态显示，避免所有页面都叫「仪表盘」
const page_title = computed(() => String(route.meta.title ?? '管理后台'));

const nickname = computed(() => auth_store.user?.nickname ?? '…');

/** 头像占位：取昵称首字，比通用人形图标更有辨识度 */
const initial = computed(() => nickname.value.trim().charAt(0) || '管');

const handle_logout = () => {
    auth_store.logout();
    // 退出后回网站首页（而非登录页）
    router.replace({ name: 'Home' });
};
</script>

<template>
    <header class="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-base-300 bg-base-100 px-4 sm:px-6">
        <div class="flex min-w-0 items-center gap-3">
            <div class="h-4 w-1 shrink-0 rounded-full bg-ink" aria-hidden="true"></div>
            <h1 class="truncate text-[0.9375rem] font-semibold text-base-content">{{ page_title }}</h1>
            <span class="hidden text-xs text-base-content/45 md:inline">管理后台</span>
        </div>

        <div class="flex shrink-0 items-center gap-2 sm:gap-3">
            <div class="flex items-center gap-2.5">
                <span
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-ink/10 text-xs font-semibold text-ink">
                    {{ initial }}
                </span>
                <div class="hidden flex-col leading-tight sm:flex">
                    <span class="max-w-[9rem] truncate text-sm font-medium text-base-content">{{ nickname }}</span>
                    <span class="text-[0.625rem] text-base-content/50">
                        {{ auth_store.is_superuser ? '超级管理员' : auth_store.is_normal_user ? '普通账号' : '已登录' }}
                    </span>
                </div>
                <span v-if="auth_store.is_superuser"
                    class="badge badge-sm whitespace-nowrap border-ink/20 bg-ink/10 text-ink">超级管理员</span>
            </div>

            <div class="mx-1 hidden h-6 w-px bg-base-300 sm:block" aria-hidden="true"></div>

            <button class="btn btn-ghost btn-sm gap-1.5 rounded-lg text-base-content/60 hover:text-error" @click="handle_logout">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
                    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M15 17l5-5-5-5M20 12H9M12 20H6a2 2 0 01-2-2V6a2 2 0 012-2h6" />
                </svg>
                <span class="hidden sm:inline">退出登录</span>
            </button>
        </div>
    </header>
</template>
