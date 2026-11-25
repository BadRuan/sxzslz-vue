<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useBaseinfoStore, type CategoryModel } from '@/store/base';
import { useArticleStore, type ArticleModel } from '@/store/article';
import { date_text } from '@/utils/formatters';
import { flatten_categories, name_category_id, categories_compact, to_second_level_id } from '@/utils/category';
import { CATEGORY_NAMES } from '@/utils/categoryConfig';
import { useInfiniteSentinel } from '@/composables/useInfiniteSentinel';
import ArticleCover from '@/components/ArticleCover.vue';

const route = useRoute();
const baseinfo_store = useBaseinfoStore();
const article_store = useArticleStore();

/** 每批文章数：游标滚动加载的 limit */
const PAGE_SIZE = 30;

const { categories, error_message: categories_error } = storeToRefs(baseinfo_store);
const { infinite_list, infinite_has_more, infinite_loading, infinite_loading_more, infinite_error } = storeToRefs(article_store);

const loading = ref(true);

const flattened = computed(() => flatten_categories(categories.value));
// 文章仅挂二级分类，一级分类只做分组展示不可筛选
const second_level = computed(() => flattened.value.filter(({ depth }) => depth > 0));

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

/** 当前分类名称：用于列表页头和「更多」定位，避免只显示 id */
const active_category_name = computed(() => {
    for (const parent of categories.value) {
        const child = parent.children.find(item => item.id === active_category.value);
        if (child) return child.name;
    }
    return '新闻资讯';
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
watch(active_category, (categoryId) => {
    if (categoryId) {
        article_store.resetInfiniteList();
        void article_store.fetchInfiniteListFirst({ category_id: categoryId, limit: PAGE_SIZE, sort: 'create_at' });
    } else {
        article_store.resetInfiniteList();
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
        article_store.resetInfiniteList();
        void article_store.fetchInfiniteListFirst({ category_id: categoryId, limit: PAGE_SIZE, sort: 'create_at' });
    }
};

/** 加载失败重试：分类树可能尚未到达，此时不给按钮可点（active_category 未知） */
const reload_articles = () => {
    if (active_category.value === undefined) return;
    article_store.resetInfiniteList();
    void article_store.fetchInfiniteListFirst({ category_id: active_category.value, limit: PAGE_SIZE, sort: 'create_at' });
};

// 滚动到底部哨兵：进入视口且无在途请求时追加下一批
const sentinel = useInfiniteSentinel(
    () => { void article_store.loadMoreInfinite(); },
    () => infinite_has_more.value && !infinite_loading_more.value && !infinite_loading.value,
);
</script>

<template>
    <main class="min-h-screen bg-base-200">
        <!-- 页头：标题与当前分类，替代原先直接进入列表的突兀感 -->
        <section class="border-b border-base-300 bg-base-100">
            <div class="page-container py-10 sm:py-12">
                <p class="eyebrow text-primary/60">News Center</p>
                <div class="mt-2.5 flex flex-wrap items-end justify-between gap-4">
                    <h1 class="text-2xl font-bold tracking-tight text-base-content sm:text-[1.875rem]">
                        新闻资讯
                    </h1>
                    <p class="text-sm text-base-content/60">
                        当前浏览 <span class="font-medium text-base-content/75">{{ active_category_name }}</span>
                    </p>
                </div>
            </div>
        </section>

        <div class="page-container py-8 sm:py-12">
            <div class="flex flex-col gap-8 lg:flex-row lg:gap-10">
                <aside class="shrink-0 lg:sticky lg:top-28 lg:z-10 lg:w-64 lg:self-start">
                    <div class="rounded-box border border-base-300 bg-base-100 p-5 shadow-[var(--shadow-card)]">
                        <h3 class="mb-3 flex items-center gap-2 text-sm font-semibold text-base-content">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                fill="none" class="text-primary/70" aria-hidden="true">
                                <path d="M4 5.5h11.5V19H4z" stroke="currentColor" stroke-width="1.6"
                                    stroke-linejoin="round"></path>
                                <path d="M15.5 8.5h4.5V19h-4.5" stroke="currentColor" stroke-width="1.6"
                                    stroke-linejoin="round"></path>
                                <path d="M7 9h5.5M7 12.5h5.5M7 16h3.5" stroke="currentColor" stroke-width="1.6"
                                    stroke-linecap="round"></path>
                            </svg>
                            新闻分类
                        </h3>
                        <nav class="flex flex-col gap-0.5">
                            <template v-for="parent in categories" :key="parent.id">
                                <!-- 一级分类：折叠分组头，点击展开/收起（文章只挂二级，一级不可筛选） -->
                                <button type="button"
                                    class="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-base-content/85 transition-colors duration-200"
                                    :class="parent.children.length === 0
                                        ? 'cursor-default text-base-content/65'
                                        : 'cursor-pointer hover:bg-base-200'"
                                    @click="toggle_group(parent)">
                                    <span>{{ parent.name }}</span>
                                    <svg v-if="parent.children.length > 0" xmlns="http://www.w3.org/2000/svg"
                                        class="h-3.5 w-3.5 shrink-0 text-base-content/50 transition-transform duration-200"
                                        :class="is_expanded(parent.id) ? 'rotate-90' : ''" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                                <template v-if="is_expanded(parent.id)">
                                    <RouterLink v-for="child in parent.children" :key="child.id"
                                        :to="{ name: 'ArticleList', query: { category: child.id } }" :class="[
                                            active_category === child.id
                                                ? 'bg-primary text-primary-content font-semibold shadow-sm'
                                                : 'text-base-content/65 hover:bg-base-200 hover:text-primary'
                                        ]"
                                        class="ml-1 rounded-lg py-2 pl-4 pr-3 text-[0.8125rem] transition-colors duration-200"
                                        @click="handleCategoryClick(child.id)">
                                        {{ child.name }}
                                    </RouterLink>
                                </template>
                            </template>
                        </nav>
                        <!-- 分类树加载失败：给出后端原因与重试，而不是静默展示空侧栏 -->
                        <div v-if="categories_error" class="mt-3">
                            <p class="alert alert-error text-xs">{{ categories_error }}</p>
                            <button type="button" class="btn btn-xs btn-primary mt-2"
                                @click="baseinfo_store.checkBaseinfo()">重新加载分类</button>
                        </div>
                    </div>
                </aside>

                <div class="min-w-0 flex-1">
                    <!-- 加载状态：骨架屏，比单行 spinner 更少布局跳动 -->
                    <div v-if="loading || infinite_loading" class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                        <div v-for="i in 6" :key="i"
                            class="overflow-hidden rounded-box border border-base-300 bg-base-100">
                            <div class="aspect-[16/10] animate-pulse bg-base-300"></div>
                            <div class="space-y-3 p-5">
                                <div class="h-4 w-4/5 animate-pulse rounded bg-base-300"></div>
                                <div class="h-4 w-3/5 animate-pulse rounded bg-base-300"></div>
                                <div class="h-3 w-1/3 animate-pulse rounded bg-base-300"></div>
                            </div>
                        </div>
                    </div>

                    <!-- 正常内容 -->
                    <template v-else>
                        <!-- 接口失败与空数据区分：失败给出后端原因与重试，而非误报「暂无文章」 -->
                        <div v-if="infinite_error && infinite_list.length === 0"
                            class="rounded-box border border-base-300 bg-base-100 p-12 text-center text-base-content/60">
                            <p class="mb-2 text-error">{{ infinite_error || '文章加载失败' }}</p>
                            <p class="mb-4 text-sm">请检查网络后重试</p>
                            <button type="button" class="btn btn-sm btn-primary" @click="reload_articles">
                                重新加载
                            </button>
                        </div>
                        <div v-else-if="infinite_list.length === 0"
                            class="rounded-box border border-dashed border-base-300 bg-base-100 px-6 py-20 text-center">
                            <p class="text-base-content/55">暂无文章</p>
                            <p class="mt-1.5 text-sm text-base-content/50">该分类下还没有发布内容，换个分类看看</p>
                        </div>
                        <div v-else class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                            <article v-for="article in infinite_list" :key="article.slug"
                                class="group overflow-hidden rounded-box border border-base-300 bg-base-100 card-hover hover:-translate-y-1 hover:border-primary/25 hover:shadow-[var(--shadow-lift)]">
                                <RouterLink :to="{ name: 'ArticleDetail', params: { slug: article.slug } }"
                                    class="flex h-full flex-col">
                                    <div class="relative aspect-[16/10] w-full overflow-hidden bg-base-300">
                                        <ArticleCover :slug="article.cover_img_slug" alt="news_pic"
                                            class="transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
                                        <!-- 分类胶囊浮于封面：优先当前浏览分类，多分类折叠 +N -->
                                        <span
                                            class="absolute left-3 top-3 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-1 rounded-full bg-base-100/90 px-2.5 py-1 text-[0.6875rem] font-medium text-base-content/70 shadow-sm backdrop-blur-sm"
                                            :title="article_categories(article).title">
                                            <span class="truncate">{{ article_categories(article).label }}</span>
                                            <span v-if="article_categories(article).extra > 0" class="shrink-0 text-base-content/55">
                                                +{{ article_categories(article).extra }}
                                            </span>
                                        </span>
                                    </div>
                                    <div class="flex flex-1 flex-col p-5">
                                        <!-- 标题最多展示 3 行（至少预留 3 行高度）：公文类长标题不满足阅读需要时也不跳版 -->
                                        <h2 class="line-clamp-3 min-h-[5.25rem] text-[0.95rem] font-semibold leading-7 text-base-content transition-colors duration-200 group-hover:text-primary">
                                            {{ article.title }}
                                        </h2>
                                        <div
                                            class="mt-auto flex items-center justify-between gap-3 border-t border-base-300/70 pt-3.5 text-xs text-base-content/55">
                                            <time class="num">{{ date_text(article.create_at) }}</time>
                                            <span class="inline-flex items-center gap-1 transition-transform duration-200 group-hover:translate-x-0.5">
                                                阅读全文
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"
                                                    viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor"
                                                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                                </svg>
                                            </span>
                                        </div>
                                    </div>
                                </RouterLink>
                            </article>
                        </div>

                        <!-- 滚动加载状态：追加中 / 追加失败行内重试 / 已到底 -->
                        <div class="mt-10 flex min-h-8 items-center justify-center text-sm text-base-content/55">
                            <span v-if="infinite_loading_more" class="loading loading-spinner loading-sm"></span>
                            <span v-else-if="infinite_error && infinite_list.length > 0" class="flex items-center gap-3">
                                <span class="text-error">加载失败</span>
                                <button type="button" class="btn btn-xs btn-primary"
                                    @click="() => { void article_store.loadMoreInfinite(); }">重试</button>
                            </span>
                            <span v-else-if="infinite_list.length > 0 && !infinite_has_more">没有更多了</span>
                        </div>
                        <div ref="sentinel" class="h-px" aria-hidden="true"></div>
                    </template>
                </div>
            </div>
        </div>
    </main>
</template>
