<template>
    <aside class="w-48 h-full bg-background flex flex-col">
        <div class="h-16 flex items-center px-4">
            <img src="/icon/water-logo.svg" class="h-8" alt="logo" />
            <span class="ml-2  font-semibold">管理后台</span>
        </div>

        <nav class="flex-1 px-4 py-8 space-y-2">
            <RouterLink :to="{ name: 'AdminOverview' }" active-class="text-white bg-primary font-bold"
                class="flex items-center px-4 py-2 rounded hover:bg-primary hover:text-white hover:font-bold">
                仪表盘
            </RouterLink>
            <RouterLink :to="{ name: 'AdminArticleList' }" active-class="text-white bg-primary font-bold"
                class="flex items-center px-4 py-2 rounded hover:bg-primary hover:text-white hover:font-bold">
                文章管理
            </RouterLink>
            <RouterLink :to="{ name: 'AdminCategory' }" active-class="text-white bg-primary font-bold"
                class="flex items-center px-4 py-2 rounded hover:bg-primary hover:text-white hover:font-bold">
                分类管理
            </RouterLink>
            <RouterLink :to="{ name: 'AdminPhoto' }" active-class="text-white bg-primary font-bold"
                class="flex items-center px-4 py-2 rounded hover:bg-primary hover:text-white hover:font-bold">
                照片管理
            </RouterLink>
        </nav>

        <div class="p-4 border-t border-white/10">
            <div class="text-base text-sidebar-text flex flex-row items-center">
                <span>当前用户：</span>
                <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
                    width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3ZM6 7C6 3.68629 8.68629 1 12 1C15.3137 1 18 3.68629 18 7C18 10.3137 15.3137 13 12 13C8.68629 13 6 10.3137 6 7Z"
                        fill-rule="evenodd" fill="#000000"></path>
                    <path
                        d="M12 13C7.02944 13 3 17.0294 3 22L1 22C1 15.9249 5.92487 11 12 11C18.0751 11 23 15.9249 23 22L21 22C21 17.0294 16.9706 13 12 13Z"
                        fill-rule="evenodd" fill="#000000"></path>
                </svg>
                <span class="px-2">Admin</span>
            </div>
        </div>
    </aside>
</template>