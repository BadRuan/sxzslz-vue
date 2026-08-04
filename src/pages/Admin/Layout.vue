<script setup lang="ts">
import SideBar from '@/pages/Admin/components/sidebar.vue'
import Header from '@/pages/Admin/components/header.vue'
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