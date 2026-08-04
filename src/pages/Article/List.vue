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
            article_store.getArticleList(categoryId, 1, 30);
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
                            <h3 class="text-sm font-semibold text-gray-900 mb-3">新闻分类</h3>
                            <nav class="flex flex-col space-y-1">
                                <RouterLink v-for="item in categories" :key="item.id"
                                    :to="{ name: 'ArticleList', query: { category: item.id } }" :class="[
                                        active_category === item.id
                                            ? 'bg-primary text-white font-bold'
                                            : 'text-gray-700 hover:bg-gray-50 hover:font-bold hover:text-primary'
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
                                class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4">
                            </div>
                            <p class="text-gray-500">加载中...</p>
                        </div>

                        <!-- 正常内容 -->
                        <template v-else>
                            <div class="grid grid-cols-3 gap-8">
                                <article v-for="(article, index) in article_list" :key="index"
                                    class="flex flex-col overflow-hidden bg-white rounded shadow-xs transition-transform duration-300 hover:-translate-y-2">
                                    <RouterLink :to="{ name: 'ArticleDetail', params: { slug: article.slug } }">
                                        <div class="w-full overflow-hidden">
                                            <img class="w-full h-52" :src="url_prefix.pic_prefix + article.cover_img"
                                                alt="news_pic" />
                                        </div>
                                        <div class="p-4 flex flex-col gap-4 divide-y  divide-gray-100">
                                            <div class="flex flex-row items-center justify-between">
                                                <div class="text-sm text-gray-700 py-1 rounded">
                                                    <span class="text-secondary font-bold">|</span> {{
                                                        category_text(article.category_id, categories) }}
                                                </div>
                                                <div>
                                                    <time class="text-xs text-gray-600">
                                                        {{ date_text(article.create_at) }}
                                                    </time>
                                                </div>
                                            </div>
                                            <h2
                                                class="text-base font-semibold text-gray-800 hover:text-primary h-12 overflow-hidden">
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
                                            : 'bg-primary text-white hover:bg-primary-dark'
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