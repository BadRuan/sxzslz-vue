<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useBaseinfoStore, type CategoryModel } from '@/store/base';
import { useArticleStore, type ArticleModel } from '@/store/article';
import { date_text } from '@/utils/formatters';
import { flatten_categories, name_category_id, categories_compact, to_second_level_id } from '@/utils/category';
import { CATEGORY_NAMES } from '@/utils/categoryConfig';
import AppPagination from '@/components/AppPagination.vue';
import ArticleCover from '@/components/ArticleCover.vue';

const route = useRoute();
const router = useRouter();
const baseinfo_store = useBaseinfoStore();
const article_store = useArticleStore();

const { categories } = storeToRefs(baseinfo_store);
const { article_list, article_total, article_page, article_has_next, article_list_error, article_list_error_message } = storeToRefs(article_store);

const loading = ref(true);

const flattened = computed(() => flatten_categories(categories.value));
// 文章仅挂二级分类，一级分类只做分组展示不可筛选
const second_level = computed(() => flattened.value.filter(({ depth }) => depth > 0));
const page_number = computed(() => Number(route.query.page) || 1);

// 默认分类：集中配置名称（新闻动态）→ 命中一级分类时退化为其第一个子分类 → 找不到则第一个二级分类（兜底）
const default_category_id = computed(() => {
    const configured = name_category_id(categories.value, CATEGORY_NAMES.news);
    if (configured !== undefined) {
        const matched = flattened.value.find(({ node }) => node.id === configured);
        if (matched && matched.depth > 0) return configured;
        return flattened.value.find(({ node }) => node.id === configured)?.node.children[0]?.id
            ?? second_level.value[0]?.node.id;
    }
    return second_level.value[0]?.node.id;
});
// 路由带一级分类 id（旧链接等）时退化为其第一个子分类，避免按一级 id 精确过滤查不到文章
const active_category = computed(() =>
    to_second_level_id(categories.value, Number(route.query.category) || undefined)
    ?? default_category_id.value);

/** 当前激活分类所属的一级分类 id（侧边栏默认展开用） */
const parent_of_active = computed(() => {
    for (const parent of categories.value) {
        if (parent.children.some(child => child.id === active_category.value)) {
            return parent.id;
        }
    }
    return undefined;
});

// —— 侧边栏折叠：默认只展开当前激活分类所在的一级分组 ——
const expanded_ids = ref<Set<number>>(new Set());

const sync_expanded_with_active = () => {
    if (parent_of_active.value !== undefined) {
        expanded_ids.value.add(parent_of_active.value);
    }
};

// 分类树异步到达 / 路由切换分类时，自动展开激活项所在分组
watch([categories, parent_of_active], () => sync_expanded_with_active(), { immediate: true });

const is_expanded = (id: number) => expanded_ids.value.has(id);

const toggle_group = (parent: CategoryModel) => {
    // 无子分类的一级分类不可挂文章，仅展示
    if (parent.children.length === 0) return;
    const next = new Set(expanded_ids.value);
    if (next.has(parent.id)) next.delete(parent.id);
    else next.add(parent.id);
    expanded_ids.value = next;
};

// 监听计算属性而非 route.query：分类树异步到达时也能自动补一次取数
watch([active_category, page_number], ([categoryId, pageNum]) => {
    if (categoryId) {
        article_store.getArticleList(categoryId, pageNum, 30);
    }
}, { immediate: true });

onMounted(async () => {
    loading.value = true;
    await Promise.all([
        baseinfo_store.checkBaseinfo(),
    ]);
    loading.value = false;
});

/** 卡片分类展示：优先当前浏览分类，多分类折叠为 +N（悬停 title 可看全部） */
const article_categories = (article: ArticleModel) =>
    categories_compact(article.categories, active_category.value);

const handleCategoryClick = (categoryId: number) => {
    // 点击当前已激活的分类：路由不变不会再触发导航，直接重新拉取
    if (active_category.value === categoryId) {
        article_store.getArticleList(categoryId, page_number.value, 30);
    }
};

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
    <main class="bg-base-200">
        <div class="min-h-screen section-y px-4">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex flex-col gap-8 lg:flex-row">
                    <aside class="lg:w-64 shrink-0">
                        <div class="card rounded-box p-5">
                            <h3 class="text-sm font-semibold text-base-content mb-3 flex flex-row items-center">
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
                                <template v-for="parent in categories" :key="parent.id">
                                    <!-- 一级分类：折叠分组头，点击展开/收起（文章只挂二级，一级不可筛选） -->
                                    <button type="button" class="flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm font-semibold text-base-content/90 hover:bg-base-200 link-transition"
                                        :class="parent.children.length === 0 ? 'cursor-default text-base-content/60 font-medium' : 'cursor-pointer'"
                                        @click="toggle_group(parent)">
                                        <span>{{ parent.name }}</span>
                                        <svg v-if="parent.children.length > 0" xmlns="http://www.w3.org/2000/svg"
                                            class="h-4 w-4 text-base-content/40 transition-transform duration-200"
                                            :class="is_expanded(parent.id) ? 'rotate-90' : ''"
                                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                    <template v-if="is_expanded(parent.id)">
                                        <RouterLink v-for="child in parent.children" :key="child.id"
                                            :to="{ name: 'ArticleList', query: { category: child.id } }" :class="[
                                                active_category === child.id
                                                    ? 'bg-primary/10 text-primary font-semibold'
                                                    : 'text-base-content/80 hover:bg-base-200 hover:text-primary/80'
                                            ]" class="rounded-lg px-3 py-2 text-sm link-transition"
                                            style="padding-left: 1.5rem"
                                            @click="handleCategoryClick(child.id)">
                                            <span class="text-xs">{{ child.name }}</span>
                                        </RouterLink>
                                    </template>
                                </template>
                            </nav>
                        </div>
                    </aside>

                    <div class="flex-1 min-w-0">
                        <!-- 加载状态 -->
                        <div v-if="loading" class="card rounded-box p-12 text-center">
                            <span class="loading loading-spinner loading-md mx-auto mb-4 block"></span>
                            <p class="text-base-content/60">加载中...</p>
                        </div>

                        <!-- 正常内容 -->
                        <template v-else>
                            <!-- 接口失败与空数据区分：失败给出后端原因与重试，而非误报「暂无文章」 -->
                            <div v-if="article_list_error"
                                class="card rounded-box p-12 text-center text-base-content/60">
                                <p class="mb-2 text-error">{{ article_list_error_message || '文章加载失败' }}</p>
                                <p class="mb-4">请检查网络后重试</p>
                                <button type="button" class="btn btn-sm btn-primary"
                                    @click="article_store.getArticleList(active_category, page_number, 30)">
                                    重新加载
                                </button>
                            </div>
                            <div v-else-if="article_list.length === 0"
                                class="card rounded-box p-12 text-center text-base-content/60">
                                暂无文章
                            </div>
                            <div v-else class="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
                                <article v-for="(article, index) in article_list" :key="index"
                                    class="card rounded-box card-hover group hover:-translate-y-0.5 overflow-hidden">
                                    <RouterLink :to="{ name: 'ArticleDetail', params: { slug: article.slug } }">
                                        <div class="h-52 w-full overflow-hidden bg-base-300">
                                            <ArticleCover :slug="article.cover_img_slug" alt="news_pic"
                                                class="transition-transform duration-200 ease-out group-hover:scale-105" />
                                        </div>
                                        <div class="p-5 flex flex-col gap-4 divide-y divide-base-200">
                                            <div class="flex flex-row items-center justify-between gap-2">
                                                <div class="min-w-0 flex flex-row items-center text-sm text-base-content/80 py-1"
                                                    :title="article_categories(article).title">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                        viewBox="0 0 24 24" fill="none" class="mx-1 shrink-0">
                                                        <path fill="currentColor"
                                                            d="M11.8419 5.52566L14.8024 4.53883Q16.4189 4 18.1228 4L21 4C21.2761 4 21.5 4.22386 21.5 4.5L21.5 18.5C21.5 18.7761 21.2761 19 21 19L18.1228 19Q16.5811 19 15.1186 19.4875L12.1581 20.4743C11.8343 20.5823 11.5 20.3413 11.5 20L11.5 6C11.5 5.78478 11.6377 5.59372 11.8419 5.52566ZM12.1581 6.47434L12 6L12.5 6L12.5 20L12 20L11.8419 19.5257L14.8024 18.5388Q16.4189 18 18.1228 18L21 18L21 18.5L20.5 18.5L20.5 4.5L21 4.5L21 5L18.1228 5Q16.5811 5 15.1186 5.48751L12.1581 6.47434Z">
                                                        </path>
                                                        <path fill="currentColor"
                                                            d="M12.1581 5.52566L9.19761 4.53883Q7.58114 4 5.87722 4L3 4C2.72386 4 2.5 4.22386 2.5 4.5L2.5 18.5C2.5 18.7761 2.72386 19 3 19L5.87722 19Q7.41887 19 8.88139 19.4875L11.8419 20.4743C12.1657 20.5823 12.5 20.3413 12.5 20L12.5 6C12.5 5.78478 12.3623 5.59372 12.1581 5.52566ZM11.8419 6.47434L12 6L11.5 6L11.5 20L12 20L12.1581 19.5257L9.19761 18.5388Q7.58114 18 5.87722 18L3 18L3 18.5L3.5 18.5L3.5 4.5L3 4.5L3 5L5.87722 5Q7.41886 5 8.88139 5.48751L11.8419 6.47434Z">
                                                        </path>
                                                    </svg>
                                                    <span class="truncate">{{ article_categories(article).label }}</span>
                                                    <span v-if="article_categories(article).extra > 0"
                                                        class="badge badge-ghost badge-xs ml-1">
                                                        +{{ article_categories(article).extra }}
                                                    </span>
                                                </div>
                                                <div class="flex flex-row items-center shrink-0">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                        viewBox="0 0 24 24" fill="none" class="text-base-content/60 mr-2">
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
                                                    <time class="text-xs text-base-content/70">
                                                        {{ date_text(article.create_at) }}
                                                    </time>
                                                </div>
                                            </div>
                                            <h2
                                                class="text-base font-semibold text-base-content/70 group-hover:text-primary line-clamp-2 min-h-12">
                                                {{ article.title }}
                                            </h2>
                                        </div>
                                    </RouterLink>
                                </article>
                            </div>

                            <AppPagination class="m-8" :page="article_page" :has-next="article_has_next"
                                :total="article_total" unit="条" @change="goToPage" />
                        </template>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>