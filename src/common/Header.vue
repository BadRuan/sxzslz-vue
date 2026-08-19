<script setup lang="ts">
const default_class = 'rounded-md px-3 py-2 font-medium text-gray-500 hover:bg-gray-50 hover:text-primary-400 hover:font-bold'
const active_class = '!bg-gray-100 !text-primary-500 !font-semibold rounded-md'
</script>

<template>
    <header class="bg-white">
        <div class="mx-auto max-w-7xl">
            <div class="flex h-16 items-center justify-between">

                <div class="flex items-center gap-2">
                    <img src="/icon/water-logo.svg" class="h-8 w-8" alt="logo" />
                    <RouterLink :to="{ name: 'Home' }">
                        <img src="/icon/logo-text.svg" class="h-6" alt="logo-text" />
                    </RouterLink>
                </div>

                <nav class="hidden sm:flex items-center gap-1">
                    <RouterLink :to="{ name: 'Home' }" :active-class="active_class" :class="default_class">
                        网站首页
                    </RouterLink>

                    <RouterLink :to="{ name: 'ArticleList', query: { category: 3, page: 1 } }"
                        :active-class="active_class" :class="default_class">
                        新闻列表
                    </RouterLink>

                    <RouterLink :to="{ name: 'About' }" :active-class="active_class" :class="default_class">
                        关于我们
                    </RouterLink>

                </nav>

            </div>

        </div>
    </header>
</template>
