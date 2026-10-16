<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useBaseinfoStore } from '@/store/base';
import { slug_category_id } from '@/utils/category';
import { CATEGORY_SLUGS } from '@/utils/categoryConfig';

const default_class = 'rounded-md px-3 py-2 font-medium text-gray-500 hover:bg-gray-100 hover:text-primary-400 hover:font-bold flex flex-row items-center'
const active_class = '!bg-gray-100 !text-primary-500 !font-semibold rounded-md'

const baseinfo_store = useBaseinfoStore();
const { categories } = storeToRefs(baseinfo_store);
const news_category_id = computed(() => slug_category_id(categories.value, CATEGORY_SLUGS.news));

onMounted(() => {
    // 导航栏在所有前台页面常驻，由此统一拉取分类树（store 内部有空缓存判断，不会重复请求）
    baseinfo_store.checkBaseinfo();
});
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                            class="mr-1">
                            <path fill="currentColor"
                                d="M3.61325 7.99024L10.6132 3.32358Q11.2431 2.9037 12 2.9037Q12.7569 2.9037 13.3868 3.32358L20.3867 7.99024Q20.9084 8.33799 21.2042 8.89072Q21.5 9.44345 21.5 10.0704L21.5 19C21.5 20.3807 20.3807 21.5 19 21.5L15 21.5C14.7239 21.5 14.5 21.2761 14.5 21L14.5 16C14.5 15.1716 13.8284 14.5 13 14.5L11 14.5C10.1716 14.5 9.5 15.1716 9.5 16L9.5 21C9.5 21.2761 9.27614 21.5 9 21.5L5 21.5C3.61929 21.5 2.5 20.3807 2.5 19L2.5 10.0704Q2.5 9.44346 2.79581 8.89072Q3.09163 8.33799 3.61325 7.99024L3.61325 7.99024ZM4.16795 8.82229Q3.85498 9.03094 3.67749 9.36258Q3.5 9.69422 3.5 10.0704L3.5 19C3.5 19.8284 4.17157 20.5 5 20.5L9 20.5L9 21L8.5 21L8.5 16C8.5 14.6193 9.61929 13.5 11 13.5L13 13.5C14.3807 13.5 15.5 14.6193 15.5 16L15.5 21L15 21L15 20.5L19 20.5C19.8284 20.5 20.5 19.8284 20.5 19L20.5 10.0704Q20.5 9.69422 20.3225 9.36258Q20.145 9.03094 19.8321 8.82229L12.8321 4.15563Q12.4542 3.9037 12 3.9037Q11.5458 3.9037 11.1679 4.15563L4.16795 8.82229Z">
                            </path>
                        </svg>
                        网站首页
                    </RouterLink>

                    <RouterLink :to="{ name: 'ArticleList', query: { category: news_category_id, page: 1 } }"
                        :active-class="active_class" :class="default_class">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                            class="mr-1">
                            <path
                                d="M2 3.90476L8.19048 3.90476L10.0952 6.7619L22 6.7619L22 20.0952L2 20.0952L2 3.90476Z"
                                stroke="currentColor" stroke-width="1" stroke-linejoin="round"></path>
                        </svg>
                        新闻列表
                    </RouterLink>

                    <RouterLink :to="{ name: 'About' }" :active-class="active_class" :class="default_class">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                            class="mr-1">
                            <path d="M2 4.5L22 4.5L22 16.5L2 16.5L2 4.5Z" stroke="currentColor" stroke-width="1"
                                stroke-linejoin="round"></path>
                            <path stroke="currentColor" stroke-width="1" stroke-linejoin="round"
                                d="M21 21L12 19.5L3 21"></path>
                            <path d="M12 19.5L15 20L14 16.5L10 16.5L9 20L12 19.5Z" stroke="currentColor"
                                stroke-width="1" stroke-linejoin="round"></path>
                            <path stroke="currentColor" stroke-width="1" stroke-linejoin="round" d="M10.5 14L13.5 14">
                            </path>
                        </svg>
                        关于我们
                    </RouterLink>

                </nav>

            </div>

        </div>
    </header>
</template>
