<template>
    <header class="h-16 bg-background flex items-center justify-between px-6">
        <div class="text-lg font-semibold text-gray-900">仪表盘</div>
        <RouterLink :to="{ name: 'Home' }" class="text-sm text-gray-600 hover:text-primary-600">退出登录</RouterLink>
    </header>
</template>