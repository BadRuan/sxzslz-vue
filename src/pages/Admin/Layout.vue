<script setup lang="ts">
import { onMounted } from 'vue';
import SideBar from '@/pages/Admin/components/sidebar.vue'
import Header from '@/pages/Admin/components/header.vue'
import PageLoading from '@/components/PageLoading.vue';
import { useAuthStore } from '@/store/auth';

const auth_store = useAuthStore();

onMounted(() => {
    // 进入后台拉取当前登录用户（路由守卫已提前 ensure_user，此处保证刷新后角色信息最新）
    auth_store.fetchMe();
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
