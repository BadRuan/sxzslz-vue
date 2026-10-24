<script setup lang="ts">
import { onMounted } from 'vue';
import SideBar from '@/pages/Admin/components/sidebar.vue'
import Header from '@/pages/Admin/components/header.vue'
import { useAuthStore } from '@/store/auth';

const auth_store = useAuthStore();

onMounted(() => {
    // 进入后台拉取当前登录用户（token 无效时拦截器会跳登录页）
    auth_store.fetchMe();
});
</script>

<template>
    <div class="bg-background font-sans">
        <div class="flex h-screen overflow-hidden">
            <SideBar />
            <div class="flex-1 flex flex-col overflow-hidden">
                <Header />
                <RouterView />
            </div>
        </div>
    </div>
</template>
