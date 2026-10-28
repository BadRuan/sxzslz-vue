<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useBaseinfoStore } from '@/store/base';
import { date_text } from '@/utils/formatters';
import { categories_compact } from '@/utils/category';
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
const getArticles = async () => {
    if (user_id === undefined) {
        latest_article.value = [];
        total.value = 0;
        has_next.value = false;
        return;
    }
    try {
        const res = await articleService.getArticles(
            { page: page.value, page_size: PAGE_SIZE, user_id },
            { anonymous: true },
        );
        latest_article.value = res.data ?? [];
        total.value = res.total;
        has_next.value = res.has_next;
    } catch (error) {
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
    <main class="bg-base-200 flex flex-col gap-8 py-4">
        <div class="page-container">
            <div class="card rounded-box flex flex-col sm:flex-row sm:justify-between gap-6 p-6 sm:p-10">
            <div class="flex flex-row gap-6 sm:gap-8 min-w-0">
                <div class="w-24 h-24 rounded-xl shrink-0">
                    <img class="w-full h-full object-cover rounded-xl" :src="url_prefix.pic_prefix + head_img" alt="head_img">
                </div>
                <div class="flex flex-col min-w-0">
                    <div class="flex flex-row items-center min-w-0">
                        <span class="text-2xl font-bold text-base-content/90 truncate">{{ nickname_text(user_id) }}</span><img
                            class="h-6 w-6 mx-4 shrink-0" src="/icon/v.png" alt="v">
                    </div>
                    <span class="py-4 text-base-content/80">暂无简介及其他补充信息</span>
                </div>
            </div>
            <div class="flex flex-row p-4 gap-8 sm:gap-12 shrink-0 flex-wrap">
                <div class="flex flex-col items-center">
                    <span class="text-base-content/60">发布文章</span>
                    <span class="text-base-content/90 text-2xl">{{ post_count }}</span>
                </div>
                <div class="flex flex-col items-center">
                    <span class="text-base-content/60">文章累计阅读量</span>
                    <span class="text-base-content/90 text-2xl">{{ view_count }}</span>
                </div>
            </div>
        </div>
        </div>

        <div class="page-container">
            <div class="card rounded-box py-8 px-6 sm:px-10">
            <div class="font-bold mx-2">文章动态</div>
            <ul class="divide-y divide-base-300 divide-dashed">
                <li v-if="latest_article.length === 0" class="px-5 py-8 text-center text-sm text-base-content/40">
                    暂无文章
                </li>
                <li v-for="(article, index) in latest_article" :key="index"
                    class="px-5 py-3 flex items-center justify-between">
                    <div class="flex flex-row items-center min-w-0">
                        <div class="bg-base-300 w-1 h-1 rounded-xl shrink-0"></div>
                        <div class="px-4 py-2 mr-4 text-sm font-medium rounded-lg text-base-content/80 shrink-0 max-w-[8em] truncate"
                            :title="article_categories(article).title">
                            {{ article_categories(article).label }}
                            <span v-if="article_categories(article).extra > 0"
                                class="badge badge-ghost badge-xs ml-1">
                                +{{ article_categories(article).extra }}
                            </span>
                        </div>
                        <RouterLink :to="{ name: 'ArticleDetail', params: { slug: article.slug } }"
                            class="text-sm text-base-content/80 hover:text-primary truncate min-w-0 flex-1">
                            <span class="font-semibold">{{ article.title }}</span>
                        </RouterLink>
                    </div>
                    <time class="ml-4 shrink-0 text-xs text-base-content/40">{{ date_text(article.create_at) }}</time>
                </li>
            </ul>
            </div>
            <AppPagination class="mt-4" :page="page" :has-next="has_next"
                :total="total" unit="条" @change="go_page" />
        </div>
    </main>
</template>
