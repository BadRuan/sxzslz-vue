<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { url_prefix } from '@/utils/baseInfo';
import { useBaseinfoStore } from '@/store/base';
import { useArticleStore } from '@/store/article';
import { date_text, category_text } from '@/utils/formatters';

const route = useRoute();
const router = useRouter();
const baseinfo_store = useBaseinfoStore();
const article_store = useArticleStore();

const { categories } = storeToRefs(baseinfo_store);
const { article_list, article_total, article_page, article_has_next } = storeToRefs(article_store);

const loading = ref(true);

const active_category = computed(() => Number(route.query.category) || 3);

watch(
    () => route.query,
    (newQuery, oldQuery) => {
        const categoryId = Number(newQuery.category) || 3;
        const pageNum = Number(newQuery.page) || 1;

        // 首次加载（oldQuery 不存在）或页码变化
        if (!oldQuery || newQuery.category === oldQuery.category) {
            article_store.getArticleList(categoryId, pageNum, 30);
        } else {
            // 分类变化时重置页码为 1
            article_store.getArticleList(categoryId, 1, 45);
            // 如果页码不是 1，需要同步更新路由
            if (pageNum !== 1) {
                router.replace({
                    name: 'ArticleList',
                    query: { category: categoryId, page: 1 }
                });
            }
        }
    },
    { immediate: true }
);

onMounted(async () => {
    loading.value = true;
    await Promise.all([
        baseinfo_store.checkBaseinfo(),
    ]);
    loading.value = false;
});

const handleCategoryClick = (categoryId: number) => {
    // 如果点击的是当前已激活的分类，强制重新 push 当前路由
    // 这样会触发上方的 watch，从而刷新列表数据
    if (active_category.value === categoryId) {
        router.push({
            name: 'ArticleList',
            query: { category: categoryId }
        });
    }
};

// 【功能】翻页功能
const goToPage = (page: number) => {
    router.push({
        name: 'ArticleList',
        query: { category: active_category.value, page }
    });
};

const goToPrevPage = () => {
    if (article_page.value > 1) {
        goToPage(article_page.value - 1);
    }
};

const goToNextPage = () => {
    if (article_has_next.value) {
        goToPage(article_page.value + 1);
    }
};
</script>

<template>
    <main class="bg-background">
        <div class="min-h-screen py-10 px-4">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex flex-col gap-8 lg:flex-row">
                    <aside class="lg:w-64 shrink-0">
                        <div class="rounded-lg bg-white p-4 shadow-xs">
                            <h3 class="text-sm font-semibold text-gray-900 mb-3 flex flex-row items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                                    fill="none" class="mr-1">
                                    <circle cx="15.809047641754152" cy="15.309043827056886" r="6.19"
                                        stroke="currentColor" stroke-width="1"></circle>
                                    <path stroke="currentColor" stroke-width="1" stroke-linejoin="round"
                                        d="M19.1429 7.21428L19.1429 4.95238L8.85714 4.95238L7.14286 2.45238L2 2.45238L2 19.5952L8.19048 19.5952">
                                    </path>
                                    <path stroke="currentColor" stroke-width="1" stroke-linejoin="round"
                                        d="M15.8095 11.5L15.8095 18.6429"></path>
                                    <path stroke="currentColor" stroke-width="1" stroke-linejoin="round"
                                        d="M12.9524 15.7857L15.8095 18.6429L18.6667 15.7857"></path>
                                </svg>
                                新闻分类
                            </h3>
                            <nav class="flex flex-col space-y-1">
                                <RouterLink v-for="item in categories" :key="item.id"
                                    :to="{ name: 'ArticleList', query: { category: item.id } }" :class="[
                                        active_category === item.id
                                            ? 'bg-primary-500 text-white font-bold'
                                            : 'text-gray-700 hover:bg-gray-100 hover:font-bold hover:text-primary-400'
                                    ]" class="rounded-md px-3 py-2 text-sm"
                                    @click.prevent="handleCategoryClick(item.id)">
                                    {{ item.name }}
                                </RouterLink>
                            </nav>
                        </div>
                    </aside>

                    <div class="flex-1 min-w-0">
                        <!-- 加载状态 -->
                        <div v-if="loading" class="bg-white rounded-xl shadow-sm p-12 text-center">
                            <div
                                class="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4">
                            </div>
                            <p class="text-gray-500">加载中...</p>
                        </div>

                        <!-- 正常内容 -->
                        <template v-else>
                            <div class="grid grid-cols-3 gap-8">
                                <article v-for="(article, index) in article_list" :key="index"
                                    class="flex flex-col overflow-hidden bg-white rounded shadow-xs transition-transform duration-300 group hover:-translate-y-2">
                                    <RouterLink :to="{ name: 'ArticleDetail', params: { slug: article.slug } }">
                                        <div class="w-full overflow-hidden">
                                            <img class="w-full h-52" :src="url_prefix.pic_prefix + article.cover_img"
                                                alt="news_pic" />
                                        </div>
                                        <div class="p-4 flex flex-col gap-4 divide-y  divide-gray-100">
                                            <div class="flex flex-row items-center justify-between">
                                                <div class="text-sm text-gray-700 py-1 flex flex-row items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                        viewBox="0 0 24 24" fill="none" class="mx-1">
                                                        <path fill="currentColor"
                                                            d="M11.8419 5.52566L14.8024 4.53883Q16.4189 4 18.1228 4L21 4C21.2761 4 21.5 4.22386 21.5 4.5L21.5 18.5C21.5 18.7761 21.2761 19 21 19L18.1228 19Q16.5811 19 15.1186 19.4875L12.1581 20.4743C11.8343 20.5823 11.5 20.3413 11.5 20L11.5 6C11.5 5.78478 11.6377 5.59372 11.8419 5.52566ZM12.1581 6.47434L12 6L12.5 6L12.5 20L12 20L11.8419 19.5257L14.8024 18.5388Q16.4189 18 18.1228 18L21 18L21 18.5L20.5 18.5L20.5 4.5L21 4.5L21 5L18.1228 5Q16.5811 5 15.1186 5.48751L12.1581 6.47434Z">
                                                        </path>
                                                        <path fill="currentColor"
                                                            d="M12.1581 5.52566L9.19761 4.53883Q7.58114 4 5.87722 4L3 4C2.72386 4 2.5 4.22386 2.5 4.5L2.5 18.5C2.5 18.7761 2.72386 19 3 19L5.87722 19Q7.41887 19 8.88139 19.4875L11.8419 20.4743C12.1657 20.5823 12.5 20.3413 12.5 20L12.5 6C12.5 5.78478 12.3623 5.59372 12.1581 5.52566ZM11.8419 6.47434L12 6L11.5 6L11.5 20L12 20L12.1581 19.5257L9.19761 18.5388Q7.58114 18 5.87722 18L3 18L3 18.5L3.5 18.5L3.5 4.5L3 4.5L3 5L5.87722 5Q7.41886 5 8.88139 5.48751L11.8419 6.47434Z">
                                                        </path>
                                                    </svg>
                                                    {{
                                                        category_text(article.category_id, categories) }}

                                                </div>
                                                <div class="flex flex-row items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                        viewBox="0 0 24 24" fill="none" class="text-gray-500 mr-2">
                                                        <path d="M2 3.5L22 3.5L22 22.5L2 22.5L2 3.5Z"
                                                            stroke="currentColor" stroke-width="1"
                                                            stroke-linejoin="round"></path>
                                                        <path stroke="currentColor" stroke-width="1" d="M6 5L6 2">
                                                        </path>
                                                        <path stroke="currentColor" stroke-width="1" d="M18 5L18 2">
                                                        </path>
                                                        <path stroke="currentColor" stroke-width="1" d="M22 7.5L2 7.5">
                                                        </path>
                                                        <circle cx="12.5" cy="15" r="5" stroke="currentColor"
                                                            stroke-width="1" stroke-linejoin="round"></circle>
                                                        <path stroke="currentColor" stroke-width="1"
                                                            stroke-linejoin="round" d="M12 12.5L12 15.5L15 15.5"></path>
                                                    </svg>
                                                    <time class="text-xs text-gray-600">
                                                        {{ date_text(article.create_at) }}
                                                    </time>
                                                </div>
                                            </div>
                                            <h2
                                                class="text-base font-semibold text-gray-600 group-hover:text-primary-500 h-12 overflow-hidden">
                                                {{ article.title }}
                                            </h2>
                                        </div>
                                    </RouterLink>
                                </article>
                            </div>

                            <nav class="m-8 flex items-center justify-between border-t border-border pt-6"
                                aria-label="Pagination">
                                <div class="hidden sm:block">
                                    <p class="text-sm text-gray-700">
                                        共 <span class="font-medium">{{ article_total }}</span> 条，
                                        第 <span class="font-medium">{{ article_page }}</span> 页
                                    </p>
                                </div>
                                <div class="flex flex-1 justify-between sm:justify-end gap-2">
                                    <button @click="goToPrevPage" :disabled="article_page <= 1" :class="[
                                        article_page <= 1
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-900 hover:bg-gray-50'
                                    ]"
                                        class="relative inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300">
                                        上一页
                                    </button>
                                    <button @click="goToNextPage" :disabled="!article_has_next" :class="[
                                        !article_has_next
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-primary-500 text-white hover:bg-primary-dark'
                                    ]"
                                        class="relative inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold">
                                        下一页
                                    </button>
                                </div>
                            </nav>
                        </template>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>