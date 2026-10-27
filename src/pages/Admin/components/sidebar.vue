<script setup lang="ts">
const link_active_class = 'menu-active !text-primary font-semibold';
</script>
<template>
    <aside class="w-48 h-full bg-base-100 border-r border-base-300 flex flex-col">
        <div class="h-16 flex items-center px-4">
            <img src="/icon/water-logo.svg" class="h-8" alt="logo" />
            <span class="ml-2 font-semibold text-base-content">管理后台</span>
        </div>

        <ul class="menu w-full flex-1 px-4 py-6 gap-1">
            <li>
                <RouterLink :to="{ name: 'AdminOverview' }" :active-class="link_active_class" class="w-full">
                    数据概览
                </RouterLink>
            </li>
            <li>
                <RouterLink :to="{ name: 'AdminArticleList' }" :active-class="link_active_class" class="w-full">
                    文章管理
                </RouterLink>
            </li>
            <li>
                <RouterLink :to="{ name: 'AdminCategory' }" :active-class="link_active_class" class="w-full">
                    分类管理
                </RouterLink>
            </li>
            <li>
                <RouterLink :to="{ name: 'AdminPhoto' }" :active-class="link_active_class" class="w-full">
                    照片管理
                </RouterLink>
            </li>
            <li>
                <RouterLink :to="{ name: 'AdminDocument' }" :active-class="link_active_class" class="w-full">
                    文档管理
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