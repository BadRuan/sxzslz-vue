<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import apiService from '@/utils/apiService';
import { useBaseinfoStore } from '@/store/base';
import { date_text } from '@/utils/formatters';
import { articleService, type ArticleModel } from '@/store/article';
import { useAuthStore } from '@/store/auth';

// 后端无 /admin/ 统计接口，用公开分页接口的 total 与 /base/ 用户列表近似
interface CountModel {
    total_article: number,
    image_count: number,
    attachment_count: number,
};

const count_info = ref<CountModel>({
    total_article: 0,
    image_count: 0,
    attachment_count: 0,
});
const latest_article = ref<ArticleModel[]>();

const fetchCountInfo = async () => {
    try {
        const [articles_res, images_res, documents_res] = await Promise.all([
            articleService.getArticles({ page: 1, page_size: 1 }),
            apiService.get('/image/', { page: 1, page_size: 1 }),
            apiService.get('/document/', { page: 1, page_size: 1 }),
        ]);
        count_info.value.total_article = articles_res.total;
        count_info.value.image_count = images_res.total;
        count_info.value.attachment_count = documents_res.total;
    } catch (error) {
        console.error('获取管理后台统计信息失败:', error)
    }
}

const auth_store = useAuthStore();

// 默认展示登录账户的最新文章（含分类信息）；Layout 的 fetchMe 可能尚未完成，这里自行等待
const getAdminLatestArticle = async () => {
    try {
        await auth_store.fetchMe();
        const user_id = auth_store.user?.id;
        const res = await articleService.getArticles({ page: 1, page_size: 30, user_id });
        latest_article.value = res.data ?? [];
    } catch (error) {
        console.error('获取管理后台最新文章失败:', error)
    }
}

const baseinfo_store = useBaseinfoStore();
const { users } = storeToRefs(baseinfo_store);

// 统计卡数据驱动（4 卡结构一致，仅色相/图标/取值不同）
const stat_items = computed(() => [
    {
        label: '文章总数',
        value: count_info.value.total_article,
        color: 'text-info',
        bg: 'bg-info/10',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },
    {
        label: '图片数量',
        value: count_info.value.image_count,
        color: 'text-secondary',
        bg: 'bg-secondary/10',
        icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
    {
        label: '附件数量',
        value: count_info.value.attachment_count,
        color: 'text-warning',
        bg: 'bg-warning/10',
        icon: 'M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13',
    },
    {
        label: '系统用户',
        value: users.value.length,
        color: 'text-success',
        bg: 'bg-success/10',
        icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
    },
]);

onMounted(
    async () => {
        fetchCountInfo();
        getAdminLatestArticle();
        baseinfo_store.checkBaseinfo();
    }
);
</script>

<template>
    <main class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- 内容区宽度 = 视口 − 侧栏 192px，lg(1024) 下 4 列仅剩 ~180px/卡，xl 起才 4 列 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <div v-for="item in stat_items" :key="item.label"
                class="card rounded-box p-5 flex flex-row items-center gap-4">
                <div class="w-10 h-10 rounded-box flex items-center justify-center shrink-0" :class="item.bg">
                    <svg class="w-5 h-5" :class="item.color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
                    </svg>
                </div>
                <div>
                    <div class="text-sm text-base-content/60">{{ item.label }}</div>
                    <div class="text-2xl font-bold text-base-content mt-1">{{ item.value }}</div>
                </div>
            </div>
        </div>

        <div class="card rounded-box">
            <div class="px-5 py-4 border-b border-base-300 flex items-center justify-between">
                <h3 class="text-sm font-semibold text-base-content">我的最新文章</h3>
                <RouterLink :to="{ name: 'AdminArticleList' }" class="text-xs text-primary hover:underline">查看更多</RouterLink>
            </div>
            <ul class="divide-y divide-base-300">
                <li v-if="!latest_article?.length" class="px-5 py-8 text-center text-sm text-base-content/40">
                    暂无文章
                </li>
                <li v-for="(article, index) in latest_article" :key="index"
                    class="px-5 py-3 flex items-center justify-between gap-4">
                    <div class="flex flex-row items-center min-w-0 flex-1">
                        <div class="badge badge-ghost mr-4 shrink-0">{{
                            article.categories?.[0]?.name || '—' }}</div>
                        <RouterLink :to="{ name: 'ArticleDetail', params: { slug: article.slug } }"
                            class="text-sm text-base-content/80 hover:text-primary truncate min-w-0 flex-1">
                            <span class="font-semibold">{{ article.title }}</span>
                        </RouterLink>
                    </div>
                    <time class="shrink-0 text-xs text-base-content/40">{{ date_text(article.create_at) }}</time>
                </li>
            </ul>
        </div>
    </main>
</template>
