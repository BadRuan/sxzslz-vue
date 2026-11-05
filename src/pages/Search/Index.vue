<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
    articleService,
    type ArticleSearchModel,
    type ArticleSearchScope,
} from '@/store/article';
import { api_error_detail } from '@/utils/apiError';
import { date_text } from '@/utils/formatters';
import { split_keyword } from '@/utils/highlight';
import AppPagination from '@/components/AppPagination.vue';
import ArticleCover from '@/components/ArticleCover.vue';
import HighlightText from './components/HighlightText.vue';

const PAGE_SIZE = 10;
const MAX_KEYWORD_LENGTH = 50;

/** 搜索范围：对应后端 scope（all=标题+正文 / title / content），均为匿名公开全量 */
const SCOPE_OPTIONS: ReadonlyArray<{ value: ArticleSearchScope, label: string }> = [
    { value: 'all', label: '标题 + 正文' },
    { value: 'title', label: '仅标题' },
    { value: 'content', label: '仅正文' },
];

const scope_label = (value: ArticleSearchScope): string =>
    SCOPE_OPTIONS.find((option) => option.value === value)?.label ?? '标题 + 正文';

const route = useRoute();
const router = useRouter();

// —— 表单态 ——
const keyword_input = ref('');
const scope = ref<ArticleSearchScope>('all');
const input_error = ref('');

// —— 结果态 ——
const page = ref(1);
const results = ref<ArticleSearchModel[]>([]);
const total = ref(0);
const has_next = ref(false);
const loading = ref(false);
const error_message = ref('');
/** 已实际执行搜索的关键词 / 范围：结果摘要与高亮以它为准，而不是表单里尚未提交的输入 */
const active_keyword = ref('');
const active_scope = ref<ArticleSearchScope>('all');
/** 高亮词：优先后端 matched_terms（拆分去重规则以后端为准） */
const active_terms = ref<string[]>([]);
/** 是否已发起过搜索：区分「未搜索」提示与「无结果」 */
const has_searched = ref(false);

// —— 路由 query 解析（keyword / scope / page 全部可分享、可刷新） ——
const query_text = (value: unknown): string => {
    const raw = Array.isArray(value) ? value[0] : value;
    return typeof raw === 'string' ? raw : '';
};

const query_page = (value: unknown): number => {
    const parsed = Number(query_text(value));
    return Number.isInteger(parsed) && parsed > 1 ? parsed : 1;
};

const query_scope = (value: unknown): ArticleSearchScope => {
    const raw = query_text(value);
    return SCOPE_OPTIONS.some((option) => option.value === raw)
        ? raw as ArticleSearchScope
        : 'all';
};

/** 输入规整：去首尾空白、连续空白（含全角空格）折叠为单个半角空格 */
const normalize_keyword = (value: string): string =>
    value.trim().replace(/[\s\u3000]+/g, ' ');

/** 只认最后一次请求的响应：连续搜索/翻页时丢弃过期结果，避免旧响应覆盖新结果 */
let request_seq = 0;

const reset_results = () => {
    request_seq += 1;
    results.value = [];
    total.value = 0;
    has_next.value = false;
    page.value = 1;
    active_keyword.value = '';
    active_scope.value = 'all';
    active_terms.value = [];
    has_searched.value = false;
    loading.value = false;
    error_message.value = '';
};

const run_search = async (keyword: string, search_scope: ArticleSearchScope, target_page: number) => {
    // 关键词/范围变化（而不是翻页）：先清空旧结果，避免新旧关键词的结果混在一起
    if (keyword !== active_keyword.value || search_scope !== active_scope.value) {
        results.value = [];
        total.value = 0;
        has_next.value = false;
    }
    const seq = ++request_seq;
    loading.value = true;
    error_message.value = '';
    has_searched.value = true;
    active_keyword.value = keyword;
    active_scope.value = search_scope;
    active_terms.value = split_keyword(keyword);
    try {
        const res = await articleService.search({
            keyword,
            scope: search_scope,
            page: target_page,
            page_size: PAGE_SIZE,
        });
        if (seq !== request_seq) return;
        results.value = res.data ?? [];
        total.value = res.total;
        has_next.value = res.has_next;
        page.value = res.page;
        // 后端按空白拆分并去重（可能去掉全角空格等），以它为准做高亮
        const terms = (res.data ?? []).flatMap((item) => item.matched_terms ?? []);
        if (terms.length > 0) active_terms.value = [...new Set(terms)];
    } catch (error) {
        if (seq !== request_seq) return;
        results.value = [];
        total.value = 0;
        has_next.value = false;
        error_message.value = api_error_detail(error, '搜索失败，请稍后重试');
        console.error('搜索失败:', error);
    } finally {
        if (seq === request_seq) loading.value = false;
    }
};

/** 表单校验：空关键词 / 超过后端 50 字上限都在前端先拦一次（后端同样会 422） */
const read_valid_keyword = (): string | null => {
    const keyword = normalize_keyword(keyword_input.value);
    if (!keyword) {
        input_error.value = '请输入搜索关键词';
        return null;
    }
    if ([...keyword].length > MAX_KEYWORD_LENGTH) {
        input_error.value = `关键词最多 ${MAX_KEYWORD_LENGTH} 个字符，请精简后再试`;
        return null;
    }
    input_error.value = '';
    return keyword;
};

/** 统一走路由：query 是搜索态的唯一来源（刷新、分享、浏览器前进后退都能还原） */
const push_query = (next: { keyword: string, scope: ArticleSearchScope, page: number }) => {
    const same = query_text(route.query.keyword) === next.keyword
        && query_scope(route.query.scope) === next.scope
        && query_page(route.query.page) === next.page;
    if (same) {
        // 路由不变不会触发 watch：例如同词重试、从第 2 页提交同词回第 1 页
        run_search(next.keyword, next.scope, next.page);
        return;
    }
    router.push({
        name: 'Search',
        query: {
            keyword: next.keyword,
            ...(next.scope !== 'all' ? { scope: next.scope } : {}),
            ...(next.page > 1 ? { page: String(next.page) } : {}),
        },
    });
};

const submit_search = () => {
    const keyword = read_valid_keyword();
    if (!keyword) return;
    push_query({ keyword, scope: scope.value, page: 1 });
};

const change_scope = (next_scope: ArticleSearchScope) => {
    scope.value = next_scope;
    // 已有输入时切换范围视为新的搜索（回第 1 页）；未输入则仅切换表单选项
    if (!normalize_keyword(keyword_input.value)) return;
    const keyword = read_valid_keyword();
    if (!keyword) return;
    push_query({ keyword, scope: next_scope, page: 1 });
};

const clear_keyword = () => {
    keyword_input.value = '';
    input_error.value = '';
    reset_results();
    if (query_text(route.query.keyword)) {
        router.push({ name: 'Search' });
    }
};

const go_to_page = (next_page: number) => {
    if (next_page < 1) return;
    if (next_page > page.value && !has_next.value) return;
    push_query({ keyword: active_keyword.value, scope: active_scope.value, page: next_page });
};

const retry_search = () => {
    if (!active_keyword.value) return;
    run_search(active_keyword.value, active_scope.value, page.value);
};

const item_categories = (item: ArticleSearchModel) => item.categories ?? [];

// 路由 query 变化（含首次进入、浏览器前进后退、头部搜索框跳转）统一驱动一次搜索
watch(
    () => route.query,
    () => {
        const keyword = normalize_keyword(query_text(route.query.keyword));
        keyword_input.value = keyword;
        scope.value = query_scope(route.query.scope);
        const target_page = query_page(route.query.page);
        if (!keyword) {
            reset_results();
            return;
        }
        run_search(keyword, scope.value, target_page);
    },
    { immediate: true },
);
</script>

<template>
    <main class="min-h-screen bg-base-200">
        <!-- 搜索头：把搜索框放在深色主视觉里，成为页面唯一焦点 -->
        <section class="bg-neutral">
            <div class="page-container py-10 sm:py-14">
                <p class="eyebrow text-white/60">Search</p>
                <h1 class="mt-2.5 text-2xl font-bold tracking-tight text-white sm:text-[1.875rem]">站内搜索</h1>
                <p class="mt-2.5 max-w-2xl text-sm leading-6 text-white/70">
                    同时检索全站文章的标题与正文；多个关键词用空格分隔，需同时命中（AND），结果按发布时间倒序。
                </p>

                <form role="search" class="mt-7 rounded-box bg-base-100 p-4 shadow-[var(--shadow-lift)] sm:p-5"
                    @submit.prevent="submit_search">
                    <div class="flex flex-col gap-4">
                        <div class="flex flex-col gap-2">
                            <label for="search-keyword" class="sr-only">搜索关键词</label>
                            <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                                <label
                                    class="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-base-300 bg-base-100 px-4 py-3 transition-colors duration-200 focus-within:border-ink/50">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"
                                        fill="none" class="shrink-0 text-base-content/55" aria-hidden="true">
                                        <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="1.6"></circle>
                                        <path d="M15.5 15.5L21 21" stroke="currentColor" stroke-width="1.6"
                                            stroke-linecap="round"></path>
                                    </svg>
                                    <input id="search-keyword" v-model="keyword_input" type="search"
                                        class="w-full min-w-0 bg-transparent text-sm text-base-content outline-none placeholder:text-base-content/50"
                                        :maxlength="MAX_KEYWORD_LENGTH" autocomplete="off"
                                        placeholder="输入关键词，如：泵站 托管" aria-label="搜索关键词"
                                        @keydown.enter.prevent="submit_search" />
                                    <button v-if="keyword_input" type="button"
                                        class="shrink-0 text-xs text-base-content/55 transition-colors hover:text-base-content/70"
                                        aria-label="清空关键词" @click="clear_keyword">
                                        清空
                                    </button>
                                </label>
                                <button type="submit"
                                    class="btn btn-primary btn-main shrink-0 rounded-xl px-7"
                                    :disabled="loading">
                                    <span v-if="loading" class="loading loading-spinner loading-xs"></span>
                                    <span>搜索</span>
                                </button>
                            </div>
                            <p v-if="input_error" class="text-sm text-error" role="alert">{{ input_error }}</p>
                        </div>

                        <div class="flex flex-wrap items-center gap-3">
                            <span class="text-xs text-base-content/55">搜索范围</span>
                            <div class="inline-flex items-center gap-0.5 rounded-full bg-base-200 p-1" role="group"
                                aria-label="搜索范围">
                                <button v-for="option in SCOPE_OPTIONS" :key="option.value" type="button"
                                    class="rounded-full px-3.5 py-1.5 text-xs transition-colors duration-200"
                                    :class="scope === option.value
                                        ? 'bg-base-100 font-medium text-ink shadow-sm'
                                        : 'text-base-content/65 hover:text-base-content/80'"
                                    :aria-pressed="scope === option.value" @click="change_scope(option.value)">
                                    {{ option.label }}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </section>

        <div class="page-container py-8 sm:py-10">
            <!-- 首次搜索中（旧结果为空）：加载提示，而不是空白 -->
            <div v-if="loading && results.length === 0"
                class="flex flex-col items-center gap-3 rounded-box border border-base-300 bg-base-100 p-12 text-center">
                <span class="loading loading-spinner loading-md text-ink"></span>
                <p class="text-sm text-base-content/65">正在搜索…</p>
            </div>

            <!-- 接口失败：展示后端原因并提供重试，而不是误报「无结果」 -->
            <div v-else-if="error_message"
                class="rounded-box border border-base-300 bg-base-100 p-10 text-center" role="alert">
                <p class="mb-2 text-error">{{ error_message }}</p>
                <p class="mb-4 text-sm text-base-content/60">请检查网络后重试</p>
                <button type="button" class="btn btn-sm btn-primary" @click="retry_search">
                    重新搜索
                </button>
            </div>

            <!-- 未发起搜索：引导输入 -->
            <div v-else-if="!has_searched"
                class="rounded-box border border-dashed border-base-300 bg-base-100 px-6 py-16 text-center">
                <div
                    class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink/10 text-ink">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
                        aria-hidden="true">
                        <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="1.6"></circle>
                        <path d="M15.5 15.5L21 21" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
                    </svg>
                </div>
                <p class="text-base-content/75">输入关键词，搜索全站文章的标题与正文</p>
                <p class="mt-2 text-sm text-base-content/55">支持多关键词（空格分隔、同时命中）与按标题/正文限定范围</p>
            </div>

            <!-- 有结果：摘要 + 列表 + 分页 -->
            <template v-else-if="results.length > 0">
                <div class="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-base-content/55">
                    <span>共 <b class="num text-base-content">{{ total }}</b> 条结果</span>
                    <span class="h-3 w-px bg-base-300" aria-hidden="true"></span>
                    <span>关键词：<span class="font-medium text-base-content/80">{{ active_keyword }}</span></span>
                    <span class="h-3 w-px bg-base-300" aria-hidden="true"></span>
                    <span>范围：{{ scope_label(active_scope) }}</span>
                    <span class="ml-auto text-xs text-base-content/50">按发布时间倒序</span>
                </div>

                <!-- 翻页时保留旧结果并降透明度，避免整块闪烁 -->
                <div class="space-y-3"
                    :class="loading ? 'pointer-events-none opacity-60 transition-opacity duration-150' : ''"
                    :aria-busy="loading">
                    <article v-for="item in results" :key="item.id"
                        class="group overflow-hidden rounded-box border border-base-300 bg-base-100 card-hover hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-[var(--shadow-card)]">
                        <RouterLink :to="{ name: 'ArticleDetail', params: { slug: item.slug } }"
                            class="flex gap-4 p-4 sm:gap-5 sm:p-5">
                            <div class="hidden h-28 w-40 shrink-0 overflow-hidden rounded-lg bg-base-300 sm:block">
                                <ArticleCover :slug="item.cover_img_slug" :alt="item.title"
                                    class="transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
                            </div>
                            <div class="min-w-0 flex-1">
                                <div class="mb-2 flex flex-wrap items-center gap-1.5">
                                    <span v-if="item.matched_fields?.includes('title')"
                                        class="rounded-full bg-ink/10 px-2 py-0.5 text-[0.6875rem] font-medium text-ink">
                                        标题命中
                                    </span>
                                    <span v-if="item.matched_fields?.includes('content')"
                                        class="rounded-full bg-base-200 px-2 py-0.5 text-[0.6875rem] text-base-content/55">
                                        正文命中
                                    </span>
                                    <span v-for="category in item_categories(item).slice(0, 3)" :key="category.id"
                                        class="rounded-full bg-base-200 px-2 py-0.5 text-[0.6875rem] text-base-content/60">
                                        {{ category.name }}
                                    </span>
                                </div>
                                <h2 class="line-clamp-2 text-[0.95rem] font-semibold leading-6 text-base-content transition-colors duration-200 group-hover:text-ink">
                                    <HighlightText :text="item.title" :terms="active_terms" />
                                </h2>
                                <p v-if="item.content_snippet"
                                    class="mt-2 line-clamp-2 text-sm leading-6 text-base-content/55">
                                    <HighlightText :text="item.content_snippet" :terms="active_terms" />
                                </p>
                                <p v-else class="mt-2 text-sm text-base-content/55">仅标题命中，正文未包含关键词</p>
                                <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-base-content/50">
                                    <span v-if="item.user">{{ item.user.nickname }}</span>
                                    <time class="num">{{ date_text(item.create_at) }}</time>
                                    <span class="num">阅读 {{ item.view_count }}</span>
                                </div>
                            </div>
                        </RouterLink>
                    </article>
                </div>

                <AppPagination class="mt-8" :page="page" :has-next="has_next" :total="total" unit="条"
                    :page-size="PAGE_SIZE" @change="go_to_page" />
            </template>

            <!-- 已搜索但无结果：给出可操作的下一步，而不是只说「暂无数据」 -->
            <div v-else class="rounded-box border border-base-300 bg-base-100 px-6 py-14 text-center">
                <p class="text-base-content/75">
                    未找到与「<span class="font-medium text-base-content">{{ active_keyword }}</span>」相关的文章
                </p>
                <ul class="mx-auto mt-4 max-w-md list-disc space-y-1.5 pl-5 text-left text-sm text-base-content/65">
                    <li>试试更短或更通用的关键词</li>
                    <li>多个关键词需同时命中，可减少关键词数量</li>
                    <li>切换搜索范围（标题 / 正文 / 标题 + 正文）</li>
                </ul>
                <button v-if="page > 1" type="button" class="btn btn-sm btn-primary mt-6" @click="go_to_page(1)">
                    返回第一页
                </button>
            </div>
        </div>
    </main>
</template>
