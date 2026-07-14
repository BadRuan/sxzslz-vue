<template>
    <header class="bg-white border-b border-border">
        <div class="mx-auto max-w-7xl">
            <div class="flex h-16 items-center justify-between">

                <div class="flex items-center gap-2">
                    <img src="/icon/water-logo.svg" class="h-8 w-8" alt="logo" />
                    <img src="/icon/logo-text.svg" class="h-6" alt="logo-text" />
                </div>

                <nav class="hidden sm:flex items-center gap-1">
                    <RouterLink :to="{ name: 'Home' }"
                        active-class="!bg-gray-100 !text-primary !font-semibold rounded-md"
                        class="rounded-md px-3 py-2 font-medium text-gray-700 hover:bg-gray-50 hover:text-primary">
                        网站首页
                    </RouterLink>

                    <RouterLink :to="{ name: 'ArticleList', query: { category: 1 } }"
                        active-class="!bg-gray-100 !text-primary !font-semibold rounded-md"
                        class="rounded-md px-3 py-2 font-medium text-gray-700 hover:bg-gray-50 hover:text-primary">
                        新闻列表
                    </RouterLink>

                    <RouterLink :to="{ name: 'About' }"
                        active-class="!bg-gray-100 !text-primary !font-semibold rounded-md"
                        class="rounded-md px-3 py-2 font-medium text-gray-700 hover:bg-gray-50 hover:text-primary">
                        关于我们
                    </RouterLink>

                </nav>

            </div>

        </div>
    </header>
</template>
