<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useBaseinfoStore } from '@/store/base';
import { date_text } from '@/utils/formatters';
import { categories_compact } from '@/utils/category';
import { articleService, useArticleStore, type ArticleModel } from '@/store/article';
import { url_prefix } from '@/utils/baseInfo';
import { useInfiniteSentinel } from '@/composables/useInfiniteSentinel';

const route = useRoute();
const raw_user_id = Number(route.params.id);
/** 非法作者 id（NaN / 0 / 负数）不发请求，按「暂无文章」展示 */
const user_id = Number.isInteger(raw_user_id) && raw_user_id > 0 ? raw_user_id : undefined;
const head_img = '192878a6502947989a25d49d55f39266.jpg';

// 后端无 /profile/ 专用接口：用 GET /articles/infinite?user_id= 服务端过滤作者文章（游标滚动加载）。
// 公开页面必须匿名请求：普通账号带 token 时后端会忽略 user_id 只返回本人文章，导致作者主页串号。
const PAGE_SIZE = 20;
const article_store = useArticleStore();
const { infinite_list, infinite_has_more, infinite_loading, infinite_loading_more, infinite_error } = storeToRefs(article_store);
const total = ref(0);

// infinite 响应没有 total：页头「共 N 篇」与名片「发布文章」用 page_size=1 的轻量分页请求取真实总数，
// 失败时按 0 展示且不阻塞列表
const fetch_total = async () => {
    if (user_id === undefined) {
        total.value = 0;
        return;
    }
    try {
        const res = await articleService.getArticles(
            { page: 1, page_size: 1, user_id, sort: 'create_at' },
            { anonymous: true },
        );
        total.value = res.total;
    } catch (error) {
        total.value = 0;
        console.error('获取文章总数失败:', error);
    }
};

const load_first = () => {
    article_store.resetInfiniteList();
    if (user_id === undefined) {
        total.value = 0;
        return;
    }
    void article_store.fetchInfiniteListFirst({ user_id, limit: PAGE_SIZE, sort: 'create_at' });
};

// 统计口径改为服务端 total（列表只随滚动追加，长度不等于发文总数）
const post_count = computed(() => total.value);
const view_count = computed(() =>
    infinite_list.value.reduce((sum, article) => sum + article.view_count, 0)
);

const baseinfo_store = useBaseinfoStore();
const { users } = storeToRefs(baseinfo_store);

/** 卡片分类展示：只显示一个二级分类名，多分类折叠为 +N（悬停 title 可看全部） */
const article_categories = (article: ArticleModel) =>
    categories_compact(article.categories);

const nickname_text = (user_id: number | undefined) => {
    if (!user_id) {
        return '';
    } else {
        for (let item of users.value) {
            if (user_id == item.id) {
                return item.nickname
            }
        }
        return ''
    }
}

// 滚动到底部哨兵：进入视口且无在途请求时追加下一批
const sentinel = useInfiniteSentinel(
    () => { void article_store.loadMoreInfinite(); },
    () => infinite_has_more.value && !infinite_loading_more.value && !infinite_loading.value,
);

onMounted(
    async () => {
        load_first();
        fetch_total();
        baseinfo_store.checkBaseinfo();
    }
);
</script>

<template>
    <main class="min-h-screen bg-base-200 py-8 sm:py-10">
        <div class="page-container">
            <!-- 作者名片：头像 / 昵称 / 统计一屏读完 -->
            <section class="overflow-hidden rounded-box border border-base-300 bg-base-100">
                <div class="h-20 bg-gradient-to-r from-primary/85 via-primary/70 to-secondary/60 sm:h-24"></div>
                <div class="flex flex-col gap-6 px-6 pb-7 sm:flex-row sm:items-end sm:justify-between sm:px-10">
                    <div class="flex flex-row items-end gap-5">
                        <div class="-mt-10 h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-base-100 bg-base-200 sm:-mt-12 sm:h-24 sm:w-24">
                            <img class="h-full w-full object-cover" :src="url_prefix.pic_prefix + head_img" alt="作者头像">
                        </div>
                        <div class="min-w-0 pb-1">
                            <div class="flex flex-row items-center gap-2">
                                <h1 class="truncate text-xl font-bold tracking-tight text-base-content sm:text-2xl">
                                    {{ nickname_text(user_id) }}
                                </h1>
                                <img class="h-5 w-5 shrink-0" src="/icon/v.png" alt="认证">
                            </div>
                            <p class="mt-1.5 text-sm text-base-content/55">暂无简介及其他补充信息</p>
                        </div>
                    </div>

                    <dl class="flex shrink-0 items-center gap-8 sm:gap-10 sm:pb-1">
                        <div>
                            <dd class="num text-xl font-semibold leading-none text-base-content sm:text-2xl">{{ post_count }}</dd>
                            <dt class="mt-1.5 text-xs text-base-content/55">发布文章</dt>
                        </div>
                        <div class="h-8 w-px bg-base-300" aria-hidden="true"></div>
                        <div>
                            <dd class="num text-xl font-semibold leading-none text-base-content sm:text-2xl">{{ view_count }}</dd>
                            <dt class="mt-1.5 text-xs text-base-content/55">文章累计阅读量</dt>
                        </div>
                    </dl>
                </div>
            </section>

            <!-- 文章动态 -->
            <section class="mt-6 overflow-hidden rounded-box border border-base-300 bg-base-100">
                <div class="flex items-center justify-between gap-3 border-b border-base-300 px-6 py-4 sm:px-8">
                    <h2 class="text-sm font-semibold text-base-content">文章动态</h2>
                    <span class="num text-xs text-base-content/50">共 {{ total }} 篇</span>
                </div>

                <ul class="divide-y divide-base-300">
                    <li v-if="infinite_error && infinite_list.length === 0" class="px-6 py-10 text-center text-sm text-error">
                        {{ infinite_error }}
                    </li>
                    <li v-else-if="infinite_loading" class="px-6 py-10 text-center text-sm text-base-content/55">
                        <span class="loading loading-spinner loading-sm align-middle"></span>
                        <span class="ml-2">加载中…</span>
                    </li>
                    <li v-else-if="infinite_list.length === 0" class="px-6 py-14 text-center text-sm text-base-content/55">
                        暂无文章
                    </li>
                    <li v-for="article in infinite_list" :key="article.slug">
                        <RouterLink :to="{ name: 'ArticleDetail', params: { slug: article.slug } }"
                            class="group flex items-center gap-4 px-6 py-4 transition-colors duration-200 hover:bg-base-200/60 sm:px-8">
                            <span
                                class="shrink-0 rounded-md bg-base-200 px-2 py-1 text-[0.6875rem] font-medium text-base-content/65 transition-colors duration-200 group-hover:bg-primary/10 group-hover:text-primary"
                                :class="article_categories(article).extra > 0 ? 'max-w-[10em] truncate' : ''"
                                :title="article_categories(article).title">
                                {{ article_categories(article).label }}
                                <span v-if="article_categories(article).extra > 0">+{{ article_categories(article).extra }}</span>
                            </span>
                            <span
                                class="min-w-0 flex-1 truncate text-sm font-medium text-base-content/75 transition-colors duration-200 group-hover:text-primary">
                                {{ article.title }}
                            </span>
                            <time class="num ml-2 shrink-0 text-xs text-base-content/50">{{ date_text(article.create_at) }}</time>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                                fill="none" class="hidden shrink-0 text-base-content/40 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary/60 sm:block"
                                aria-hidden="true">
                                <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round"></path>
                            </svg>
                        </RouterLink>
                    </li>
                </ul>

                <!-- 滚动加载状态：追加中 / 已到底 -->
                <div class="flex min-h-10 items-center justify-center border-t border-base-300 px-6 py-3 text-xs text-base-content/55">
                    <span v-if="infinite_loading_more" class="loading loading-spinner loading-xs"></span>
                    <span v-else-if="infinite_error" class="flex items-center gap-3">
                        <span class="text-error">加载失败</span>
                        <button type="button" class="btn btn-xs btn-primary"
                            @click="() => { void article_store.loadMoreInfinite(); }">重试</button>
                    </span>
                    <span v-else-if="infinite_list.length > 0 && !infinite_has_more">没有更多了</span>
                </div>
                <div ref="sentinel" class="h-px" aria-hidden="true"></div>
            </section>
        </div>
    </main>
</template>
