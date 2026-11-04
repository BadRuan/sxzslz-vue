<script setup lang="ts">
import { onMounted } from 'vue';
import SideBar from '@/pages/Admin/components/sidebar.vue'
import Header from '@/pages/Admin/components/header.vue'
import PageLoading from '@/components/PageLoading.vue';
import { useAuthStore } from '@/store/auth';

const auth_store = useAuthStore();

onMounted(() => {
    // 路由守卫已 ensure_user；这里仅在缓存缺失时补拉，避免每次进后台都重复请求 /auth/me
    auth_store.ensure_user();
});
</script>

<template>
    <!-- 后台独立骨架：左侧固定导航 + 右侧「顶栏 + 可滚动内容区」，内容区自己滚动，页面不会整屏跳 -->
    <div class="flex h-screen overflow-hidden bg-base-200 font-sans">
        <SideBar />
        <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
            <Header />
            <Suspense>
                <RouterView />
                <template #fallback>
                    <PageLoading full-height />
                </template>
            </Suspense>
        </div>
    </div>
</template>
