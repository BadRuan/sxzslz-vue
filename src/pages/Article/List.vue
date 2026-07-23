<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router'; // 引入 useRouter
import { storeToRefs } from 'pinia';
import { url_prefix } from '@/utils/baseInfo';
import { useCategoryStore } from '@/store/category';
import { useArticleStore } from '@/store/article';
import { date_text, category_text } from '@/utils/formatters';

const route = useRoute();
const router = useRouter(); // 实例化 router
const category_store = useCategoryStore();
const article_store = useArticleStore();

const { categories } = storeToRefs(category_store);
const { article_list } = storeToRefs(article_store);

const loading = ref(true);

// 【修复 1】使用计算属性动态获取当前分类 ID，保证高亮状态始终与 URL 同步
const active_category = computed(() => Number(route.query.category) || 3);

// 【修复 2】监听路由 query 变化，自动拉取数据
watch(
    () => route.query.category,
    (newCategory) => {
        // 只要 query 发生变化，就重新请求数据
        const categoryId = typeof newCategory === 'string' ? Number(newCategory) : NaN;
        const safeCategoryId = !isNaN(categoryId) ? categoryId : 3;
        article_store.getArticleList(safeCategoryId);
    },
    { immediate: true } // 首次进入页面时也会立即执行
);

onMounted(async () => {
    loading.value = true;
    await Promise.all([
        category_store.checkCategory(),
        // 初始加载使用计算属性获取的 ID
        article_store.getArticleList(active_category.value)
    ]);
    loading.value = false;
});

// 【修复 3】处理侧边栏点击，解决点击当前分类不触发路由更新的问题
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
                                <RouterLink v-for="item in categories" :key="item.id"
                                    :to="{ name: 'ArticleList', query: { category: item.id } }" :class="[
                                        active_category === item.id
                                            ? 'bg-primary text-white'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-primary'
                                    ]" class="rounded-md px-3 py-2 text-sm"
                                    @click.prevent="handleCategoryClick(item.id)">
                                    {{ item.name }}
                                </RouterLink>
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
                                <article v-for="(article, index) in article_list" :key="index"
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
                                        共 <span class="font-medium">{{ article_list.length }}</span> 条，
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