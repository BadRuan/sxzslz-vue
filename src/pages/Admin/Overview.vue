<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import apiService from '@/utils/apiService';
import { useBaseinfoStore } from '@/store/base';
import { date_text } from '@/utils/formatters';
import { articleService, type ArticleModel } from '@/store/article';
import { useAuthStore } from '@/store/auth';
import { api_error_detail } from '@/utils/apiError';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import EmptyState from '@/components/EmptyState.vue';

// 概览统计：文章/图片/附件用分页接口的 total；容量与发布量走专用接口
interface CountModel {
    total_article: number,
    image_count: number,
    attachment_count: number,
};

const route = useRoute();
const router = useRouter();
const auth_store = useAuthStore();

const count_info = ref<CountModel>({
    total_article: 0,
    image_count: 0,
    attachment_count: 0,
});
/** GET /base/storage：站点容量（磁盘总量/已用/剩余 + 上传目录占用） */
interface StorageModel {
    total: number,
    used: number,
    free: number,
    usage_percent: number,
    uploads_bytes: number | null,
};

/** GET /articles/stats：超管=本月新增（全站），普通用户=本人近 15 天发布 */
interface ArticleStatsModel {
    scope: 'month' | 'half_month',
    label: string,
    count: number,
    start_at: string,
    end_at: string,
};

const storage = ref<StorageModel | null>(null);
const article_stats = ref<ArticleStatsModel | null>(null);
const system_error = ref('');
const latest_article = ref<ArticleModel[]>();
const stats_error = ref('');
// 最新文章加载失败：与「暂无文章」区分开，避免静默误报为空
const latest_error = ref('');

// 路由守卫拦截普通账号访问分类管理后的提示（?denied=superuser）；读取后清掉 query，刷新/超管不会误提示
const is_denied_visible = ref(false);
const dismiss_denied = () => { is_denied_visible.value = false; };
const consume_denied_query = () => {
    if (route.query.denied !== 'superuser') return;
    if (!auth_store.is_superuser) is_denied_visible.value = true;
    router.replace({ name: 'AdminOverview' });
};

const fetchCountInfo = async () => {
    stats_error.value = '';
    try {
        const [articles_res, images_res, documents_res] = await Promise.all([
            articleService.getArticles({ page: 1, page_size: 1 }),
            apiService.get('/image/', { page: 1, page_size: 1 }),
            apiService.get('/document/', { page: 1, page_size: 1 }),
        ]);
        // 普通账号的数据由后端收敛为本人；超管为全站口径
        count_info.value.total_article = articles_res.total;
        count_info.value.image_count = images_res.total;
        count_info.value.attachment_count = documents_res.total;
    } catch (error) {
        stats_error.value = api_error_detail(error, '获取统计信息失败');
        console.error('获取管理后台统计信息失败:', error)
    }
}

const fetchSystemInfo = async () => {
    system_error.value = '';
    try {
        const [storage_res, stats_res] = await Promise.all([
            apiService.get<StorageModel>('/base/storage'),
            apiService.get<ArticleStatsModel>('/articles/stats'),
        ]);
        storage.value = storage_res;
        article_stats.value = stats_res;
    } catch (error) {
        system_error.value = api_error_detail(error, '容量与发布统计暂不可用（后端未升级到最新版本时该接口不存在）');
        console.error('获取站点容量/发布统计失败:', error);
    }
};

/** 字节 → 可读容量（1024 进制；上传目录统计失败时为 —） */
const format_bytes = (value: number | null): string => {
    if (value === null) return '—';
    if (value <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const exp = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
    const scaled = value / 1024 ** exp;
    return `${scaled.toFixed(exp === 0 || scaled >= 100 ? 0 : 1)} ${units[exp] ?? 'B'}`;
};

/** 统计区间文案（起止日期，口径由后端按角色给定） */
const stats_period = computed(() => {
    if (!article_stats.value) return '';
    return `${date_text(article_stats.value.start_at)} 起至 ${date_text(article_stats.value.end_at)}`;
});

// 超管看全站最新文章，普通账号看本人最新文章（后端对普通账号强制收敛）
const getAdminLatestArticle = async () => {
    try {
        await auth_store.ensure_user();
        const res = await articleService.getArticles({
            page: 1,
            page_size: 30,
            ...(auth_store.is_superuser ? {} : { user_id: auth_store.user?.id }),
        });
        latest_article.value = res.data ?? [];
    } catch (error) {
        latest_error.value = api_error_detail(error, '获取最新文章失败');
        console.error('获取管理后台最新文章失败:', error)
    }
}

const baseinfo_store = useBaseinfoStore();
const { users } = storeToRefs(baseinfo_store);

// 统计卡数据驱动（4 卡结构一致，仅色相/图标/取值不同）
const stat_items = computed(() => [
    {
        label: auth_store.is_superuser ? '全站文章总数' : '我的文章总数',
        value: count_info.value.total_article,
        unit: '篇',
        color: 'text-info',
        bg: 'bg-info/10',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },
    {
        label: auth_store.is_superuser ? '全站图片数量' : '我的图片数量',
        value: count_info.value.image_count,
        unit: '张',
        color: 'text-secondary',
        bg: 'bg-secondary/10',
        icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
    {
        label: auth_store.is_superuser ? '全站附件数量' : '我的附件数量',
        value: count_info.value.attachment_count,
        unit: '个',
        color: 'text-warning',
        bg: 'bg-warning/10',
        icon: 'M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13',
    },
    {
        label: '系统用户',
        value: users.value.length,
        unit: '人',
        color: 'text-success',
        bg: 'bg-success/10',
        icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
    },
]);

onMounted(
    async () => {
        consume_denied_query();
        fetchCountInfo();
        fetchSystemInfo();
        getAdminLatestArticle();
        baseinfo_store.checkBaseinfo();
    }
);
</script>

<template>
    <main class="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
        <div v-if="is_denied_visible" role="alert" class="alert alert-warning text-sm">
            <span>当前账号为普通用户，无权访问分类管理。</span>
            <button class="btn btn-ghost btn-xs" @click="dismiss_denied">知道了</button>
        </div>

        <p v-if="stats_error" role="alert" class="alert alert-error text-sm">{{ stats_error }}</p>
        <!-- 内容区宽度 = 视口 − 侧栏 240px，lg(1024) 下 4 列偏挤，xl 起才排 4 列 -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <!-- .card（DaisyUI）作白底外壳，内层用 .stat（DaisyUI）语义：stat-title/stat-value/stat-figure -->
            <div v-for="item in stat_items" :key="item.label"
                class="card card-hover rounded-box hover:shadow-lift">
                <div class="stat">
                    <div class="stat-figure">
                        <div class="flex h-11 w-11 items-center justify-center rounded-xl" :class="item.bg">
                            <svg class="h-5 w-5" :class="item.color" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" :d="item.icon" />
                            </svg>
                        </div>
                    </div>
                    <div class="stat-title">{{ item.label }}</div>
                    <div class="stat-value num">{{ item.value }}<span
                            class="ml-1 text-sm font-normal text-base-content/55">{{ item.unit }}</span></div>
                </div>
            </div>
        </div>

        <p v-if="system_error" role="status" class="rounded-field border border-dashed border-base-300 bg-base-100 px-4 py-3 text-xs text-base-content/50">
            {{ system_error }}
        </p>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <!-- 站点容量：剩余空间一眼可见，进度条表示已用比例 -->
            <div class="card rounded-box p-5">
                <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                        <p class="text-xs text-base-content/60">站点可用空间</p>
                        <p class="num mt-1.5 text-2xl font-semibold leading-none tracking-tight text-base-content">
                            {{ format_bytes(storage?.free ?? null) }}
                        </p>
                    </div>
                    <span class="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[0.6875rem] font-medium text-primary">
                        已用 {{ storage ? storage.usage_percent.toFixed(1) : '—' }}%
                    </span>
                </div>
                <progress class="progress progress-primary mt-4 h-1.5 w-full" :value="storage?.usage_percent ?? 0"
                    max="100" aria-label="磁盘已用比例"></progress>
                <dl class="mt-4 grid grid-cols-3 gap-3 text-xs">
                    <div>
                        <dt class="text-base-content/50">总容量</dt>
                        <dd class="num mt-1 text-sm text-base-content/80">{{ format_bytes(storage?.total ?? null) }}</dd>
                    </div>
                    <div>
                        <dt class="text-base-content/50">已用</dt>
                        <dd class="num mt-1 text-sm text-base-content/80">{{ format_bytes(storage?.used ?? null) }}</dd>
                    </div>
                    <div>
                        <dt class="text-base-content/50">上传目录</dt>
                        <dd class="num mt-1 text-sm text-base-content/80">
                            {{ format_bytes(storage?.uploads_bytes ?? null) }}
                        </dd>
                    </div>
                </dl>
            </div>

            <!-- 发布量统计：超管=本月新增，普通用户=本人近半月 -->
            <div class="card rounded-box p-5">
                <p class="text-xs text-base-content/60">{{ article_stats?.label ?? '发布统计' }}</p>
                <p class="num mt-1.5 text-2xl font-semibold leading-none tracking-tight text-base-content">
                    {{ article_stats?.count ?? 0 }}
                    <span class="text-sm font-normal text-base-content/55">篇</span>
                </p>
                <p class="mt-3 text-xs text-base-content/55">{{ stats_period }}</p>
                <p class="mt-1 text-[0.6875rem] text-base-content/45">
                    {{ auth_store.is_superuser ? '超级管理员口径：全站本月新增（按发布时间）' : '普通用户口径：本人近 15 天发布' }}
                </p>
            </div>
        </div>

        <div class="card overflow-hidden rounded-box">
            <div class="flex items-center justify-between gap-3 border-b border-base-300 px-5 py-4">
                <h3 class="text-sm font-semibold text-base-content">
                    {{ auth_store.is_superuser ? '全站最新文章' : '我的最新文章' }}
                </h3>
                <RouterLink :to="{ name: 'AdminArticleList' }"
                    class="group inline-flex items-center gap-1 text-xs text-primary">
                    查看更多
                    <svg class="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        aria-hidden="true">
                        <path d="M9 6l6 6-6 6" />
                    </svg>
                </RouterLink>
            </div>
            <ul class="divide-y divide-base-300">
                <li v-if="latest_error" class="px-5 py-10 text-center text-sm text-error">
                    {{ latest_error }}
                </li>
                <!-- 加载状态：数据未返回（undefined）时给行骨架，行结构与真实行一致（分类标签 + 标题 + 日期） -->
                <li v-else-if="latest_article === undefined">
                    <div v-for="n in 4" :key="n" class="flex items-center justify-between gap-4 px-5 py-3">
                        <div class="flex min-w-0 flex-1 items-center gap-3">
                            <SkeletonBlock class="h-6 w-16 shrink-0" rounded="rounded-md" />
                            <SkeletonBlock class="h-4 min-w-0 flex-1" />
                        </div>
                        <SkeletonBlock class="h-4 w-16 shrink-0" />
                    </div>
                </li>
                <li v-else-if="!latest_article?.length" class="m-3">
                    <EmptyState icon="article" title="暂无文章" />
                </li>
                <li v-for="(article, index) in latest_article" :key="index">
                    <RouterLink :to="{ name: 'ArticleDetail', params: { slug: article.slug } }"
                        class="group flex items-center justify-between gap-4 px-5 py-3 transition-colors duration-200 hover:bg-base-200/60">
                        <div class="flex min-w-0 flex-1 items-center gap-3">
                            <span
                                class="shrink-0 rounded-md bg-base-200 px-2 py-1 text-[0.6875rem] font-medium text-base-content/65 transition-colors duration-200 group-hover:bg-primary/10 group-hover:text-primary">
                                {{ article.categories?.[0]?.name || '—' }}
                            </span>
                            <span class="min-w-0 flex-1 truncate text-sm text-base-content/80 transition-colors duration-200 group-hover:text-primary">
                                {{ article.title }}
                            </span>
                        </div>
                        <time class="num shrink-0 text-xs text-base-content/50">{{ date_text(article.create_at) }}</time>
                    </RouterLink>
                </li>
            </ul>
        </div>
    </main>
</template>
