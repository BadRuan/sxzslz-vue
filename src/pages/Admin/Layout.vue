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
    <div class="bg-base-200 font-sans">
        <div class="flex h-screen overflow-hidden">
            <SideBar />
            <div class="flex-1 flex flex-col overflow-hidden">
                <Header />
                <Suspense>
                    <RouterView />
                    <template #fallback>
                        <PageLoading full-height />
                    </template>
                </Suspense>
            </div>
        </div>
    </div>
</template>
