<template>
    <header class="h-16 bg-background flex items-center justify-between px-6">
        <div class="text-lg font-semibold text-gray-900">仪表盘</div>
        <div class="flex items-center gap-4">
            <span class="text-sm text-gray-600">Admin</span>
            <RouterLink :to="{ name: 'Home' }" class="text-sm text-gray-600 hover:text-primary-500">退出登录</RouterLink>
        </div>
    </header>
</template>