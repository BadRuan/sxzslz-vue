<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { url_prefix } from '@/utils/baseInfo';
import { useCategoryStore } from '@/store/category';
import { useArticleStore } from '@/store/article';
import { date_text, category_text } from '@/utils/formatters';

const route = useRoute();
const category_store = useCategoryStore();
const article_store = useArticleStore();

let category_id: number = 1;
category_id = Number(route.query.category);
let active_category: number = category_id;
const { categories } = storeToRefs(category_store);
const { latest_article } = storeToRefs(article_store);

const loading = ref(true);

const change_category = async (category_id: number) => {
    loading.value = true;
    active_category = category_id;
    await article_store.getLatest(category_id);
    loading.value = false;
};

onMounted(async () => {
    loading.value = true;
    await Promise.all([
        category_store.checkCategory(),
        article_store.getLatest(category_id)
    ]);
    loading.value = false;
});
</script>

<template>
    <main class="bg-background">
        <div class="min-h-screen py-10 px-4">

            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex flex-col gap-8 lg:flex-row">
                    <aside class="lg:w-64 shrink-0">
                        <div class="rounded-lg bg-white p-4 shadow-xs ring-1 ring-border">
                            <h3 class="text-sm font-semibold text-gray-900 mb-3">新闻分类</h3>
                            <nav class="flex flex-col space-y-1">
                                <a v-for="item in categories" @click="change_category(item.id)" :key="item.id" href="#"
                                    :class="[active_category == item.id ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-50 hover:text-primary']"
                                    class="rounded-md px-3 py-2 text-sm">
                                    {{ item.name }}
                                </a>
                            </nav>
                        </div>
                    </aside>

                    <div class="flex-1 min-w-0">
                        <!-- 加载状态 -->
                        <div v-if="loading" class="bg-white rounded-xl shadow-sm border border-border p-12 text-center">
                            <div
                                class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4">
                            </div>
                            <p class="text-gray-500">加载中...</p>
                        </div>

                        <!-- 正常内容 -->
                        <template v-else>
                            <div class="grid grid-cols-3 gap-8">
                                <article v-for="(article, index) in latest_article" :index="index"
                                    class="flex flex-col overflow-hidden bg-white rounded shadow-xs ring-1 ring-border transition-transform duration-300 hover:-translate-y-2">
                                    <RouterLink :to="{ name: 'ArticleDetail', params: { slug: article.slug } }">
                                        <div class="w-full overflow-hidden">
                                            <img class="w-full h-52" :src="url_prefix.pic_prefix + article.cover_img"
                                                alt="news_pic" />
                                        </div>
                                        <div class="p-4 flex flex-col gap-4">
                                            <div class="flex flex-row items-center justify-between">
                                                <div class="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                    {{ category_text(article.category_id, categories) }}
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
                                        共 <span class="font-medium">{{ latest_article.length }}</span> 条，
                                        第 <span class="font-medium">1</span> 页 / 共 <span class="font-medium">1</span> 页
                                    </p>
                                </div>
                                <div class="flex flex-1 justify-between sm:justify-end gap-2">
                                    <a href="#"
                                        class="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">上一页</a>
                                    <a href="#"
                                        class="relative inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-dark">下一页</a>
                                </div>
                            </nav>
                        </template>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>