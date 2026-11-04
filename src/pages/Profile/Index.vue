<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useBaseinfoStore } from '@/store/base';
import { date_text } from '@/utils/formatters';
import { categories_compact } from '@/utils/category';
import { api_error_detail } from '@/utils/apiError';
import { articleService, type ArticleModel } from '@/store/article';
import { url_prefix } from '@/utils/baseInfo';
import AppPagination from '@/components/AppPagination.vue';

const route = useRoute();
const raw_user_id = Number(route.params.id);
/** 非法作者 id（NaN / 0 / 负数）不发请求，按「暂无文章」展示 */
const user_id = Number.isInteger(raw_user_id) && raw_user_id > 0 ? raw_user_id : undefined;
const head_img = '192878a6502947989a25d49d55f39266.jpg';

// 后端无 /profile/ 专用接口：用 GET /articles/?user_id= 服务端过滤作者文章。
// 公开页面必须匿名请求：普通账号带 token 时后端会忽略 user_id 只返回本人文章，导致作者主页串号。
const PAGE_SIZE = 20;
const latest_article = ref<ArticleModel[]>([]);
const page = ref(1);
const total = ref(0);
const has_next = ref(false);
// 列表加载失败：与「暂无文章」区分开，避免静默误报为空
const list_error = ref('');
const getArticles = async () => {
    if (user_id === undefined) {
        latest_article.value = [];
        total.value = 0;
        has_next.value = false;
        return;
    }
    list_error.value = '';
    try {
        const res = await articleService.getArticles(
            // 作者主页按发布时间倒序（显式传 sort，不依赖后端匿名默认值）
            { page: page.value, page_size: PAGE_SIZE, user_id, sort: 'create_at' },
            { anonymous: true },
        );
        latest_article.value = res.data ?? [];
        total.value = res.total;
        has_next.value = res.has_next;
    } catch (error) {
        list_error.value = api_error_detail(error, '文章列表加载失败');
        console.error('获取失败:', error)
    }
}

const go_page = (target: number) => {
    page.value = target;
    getArticles();
};

// 统计口径改为服务端 total（分页后列表长度不再等于发文总数）
const post_count = computed(() => total.value);
const view_count = computed(() =>
    latest_article.value.reduce((sum, article) => sum + article.view_count, 0)
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


onMounted(
    async () => {
        getArticles();
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
                            <p class="mt-1.5 text-sm text-base-content/40">暂无简介及其他补充信息</p>
                        </div>
                    </div>

                    <dl class="flex shrink-0 items-center gap-8 sm:gap-10 sm:pb-1">
                        <div>
                            <dd class="num text-xl font-semibold leading-none text-base-content sm:text-2xl">{{ post_count }}</dd>
                            <dt class="mt-1.5 text-xs text-base-content/40">发布文章</dt>
                        </div>
                        <div class="h-8 w-px bg-base-300" aria-hidden="true"></div>
                        <div>
                            <dd class="num text-xl font-semibold leading-none text-base-content sm:text-2xl">{{ view_count }}</dd>
                            <dt class="mt-1.5 text-xs text-base-content/40">文章累计阅读量</dt>
                        </div>
                    </dl>
                </div>
            </section>

            <!-- 文章动态 -->
            <section class="mt-6 overflow-hidden rounded-box border border-base-300 bg-base-100">
                <div class="flex items-center justify-between gap-3 border-b border-base-300 px-6 py-4 sm:px-8">
                    <h2 class="text-sm font-semibold text-base-content">文章动态</h2>
                    <span class="num text-xs text-base-content/35">共 {{ total }} 篇</span>
                </div>

                <ul class="divide-y divide-base-300">
                    <li v-if="list_error" class="px-6 py-10 text-center text-sm text-error">
                        {{ list_error }}
                    </li>
                    <li v-else-if="latest_article.length === 0" class="px-6 py-14 text-center text-sm text-base-content/40">
                        暂无文章
                    </li>
                    <li v-for="(article, index) in latest_article" :key="index">
                        <RouterLink :to="{ name: 'ArticleDetail', params: { slug: article.slug } }"
                            class="group flex items-center gap-4 px-6 py-4 transition-colors duration-200 hover:bg-base-200/60 sm:px-8">
                            <span
                                class="shrink-0 rounded-md bg-base-200 px-2 py-1 text-[0.6875rem] font-medium text-base-content/50 transition-colors duration-200 group-hover:bg-primary/10 group-hover:text-primary"
                                :class="article_categories(article).extra > 0 ? 'max-w-[10em] truncate' : ''"
                                :title="article_categories(article).title">
                                {{ article_categories(article).label }}
                                <span v-if="article_categories(article).extra > 0">+{{ article_categories(article).extra }}</span>
                            </span>
                            <span
                                class="min-w-0 flex-1 truncate text-sm font-medium text-base-content/75 transition-colors duration-200 group-hover:text-primary">
                                {{ article.title }}
                            </span>
                            <time class="num ml-2 shrink-0 text-xs text-base-content/35">{{ date_text(article.create_at) }}</time>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                                fill="none" class="hidden shrink-0 text-base-content/25 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary/60 sm:block"
                                aria-hidden="true">
                                <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round"></path>
                            </svg>
                        </RouterLink>
                    </li>
                </ul>
            </section>

            <AppPagination class="mt-6" :page="page" :has-next="has_next"
                :total="total" unit="条" :page-size="PAGE_SIZE" @change="go_page" />
        </div>
    </main>
</template>
