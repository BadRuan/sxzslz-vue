<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import dayjs from 'dayjs';
import { useArticleStore, articleService } from '@/store/article';
import { api_error_detail } from '@/utils/apiError';
import { useBaseinfoStore } from '@/store/base';
import { render_markdown } from '@/utils/markdown';
import { ext_of_filename, is_doc_extension } from '@/utils/docIcon';
import DocumentPreview from '@/components/DocumentPreview.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import 'github-markdown-css/github-markdown.css';

const route = useRoute();
const router = useRouter();
const slug = route.params.slug;
const article_store = useArticleStore();
const baseinfo_store = useBaseinfoStore();

const { article_detail, article_detail_error } = storeToRefs(article_store);

/** 面包屑只显示文章自身的二级分类名（不显示一级分类）；分类树/详情到达后才有值 */
const category_crumb = computed(() => {
    const cat = article_detail.value?.categories?.[0];
    return cat ? { id: cat.id, name: cat.name } : undefined;
});

const error = ref<string | null>(null);
const loading = ref(true);

// —— 正文字号切换：小 / 中 / 大 ——
type FontSize = 'sm' | 'md' | 'lg';
const font_size = ref<FontSize>('md');
const font_size_class = computed(() => {
    return font_size.value === 'sm' ? 'prose-sm' : font_size.value === 'lg' ? 'prose-lg' : 'prose-base';
});

onMounted(async () => {
    if (slug == undefined || typeof slug !== 'string') {
        router.replace({ name: 'Home' });
        return;
    }

    loading.value = true;
    error.value = null;

    baseinfo_store.checkBaseinfo();
    const result = await article_store.getDetail(slug);
    if (result == undefined) {
        // store 已解析后端 detail（404「文章不存在」/ 401/网络异常等），优先展示具体原因
        error.value = article_detail_error.value || '文章不存在或已被删除';
    }

    loading.value = false;
})

// —— 匿名点赞：公开接口每次 +1，localStorage 记录已点赞的浏览器防重复 ——
const LIKED_STORAGE_KEY = 'liked_articles';

const load_liked = (): Set<string> => {
    try {
        return new Set(JSON.parse(localStorage.getItem(LIKED_STORAGE_KEY) ?? '[]'));
    } catch {
        return new Set();
    }
};

const liked_slugs = ref<Set<string>>(load_liked());
const liking = ref(false);
const like_message = ref('');
const like_count = computed(() => article_detail.value?.like_count ?? 0);
const has_liked = computed(() => typeof slug === 'string' && liked_slugs.value.has(slug));

const handle_like = async () => {
    if (typeof slug !== 'string' || has_liked.value || liking.value) return;
    liking.value = true;
    like_message.value = '';
    try {
        const res = await articleService.like(slug);
        if (article_detail.value) {
            article_detail.value.like_count = res.like_count;
        }
        liked_slugs.value.add(slug);
        localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify([...liked_slugs.value]));
        like_message.value = '感谢点赞！';
    } catch (error) {
        console.error('点赞失败:', error);
        like_message.value = api_error_detail(error, '点赞失败，请稍后重试');
    } finally {
        liking.value = false;
        setTimeout(() => { like_message.value = ''; }, 2000);
    }
};

// —— 正文渲染：与后台编辑器预览共用同一条管线（src/utils/markdown.ts）——
const renderedHtml = computed(() => {
    if (!article_detail.value) return '';
    return render_markdown(article_detail.value.content ?? '');
});

// —— 正文附件预览：图片交给浏览器新窗口看原图，文档类在此接管点击 ——
// doc / ppt 这类老二进制格式浏览器渲染不了，仍打开预览面板（给出下载入口），保持交互一致
const PREVIEWABLE_EXTS = ['pdf', 'docx', 'doc', 'xls', 'xlsx', 'csv', 'txt', 'md', 'ppt', 'pptx'];
const preview_open = ref(false);
const preview_url = ref('');
const preview_name = ref('');

const handle_prose_click = (event: MouseEvent) => {
    // 允许 cmd/ctrl/shift 点击走浏览器原生行为（新窗口/新标签下载）
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
    const target = event.target as HTMLElement | null;
    const anchor = target?.closest('a');
    if (!anchor) return;
    // 图片链接指向原图，直接交给浏览器在新窗口打开
    if (anchor.classList.contains('md-image-link')) return;
    const href = anchor.getAttribute('href') ?? '';
    if (!href || !is_doc_extension(href)) return;
    if (!PREVIEWABLE_EXTS.includes(ext_of_filename(href))) return;
    event.preventDefault();
    preview_name.value = (anchor.textContent ?? '').trim() || href.split('/').pop() || '附件';
    preview_url.value = href;
    preview_open.value = true;
};

</script>

<template>
    <main class="min-h-screen bg-base-200">
        <div class="page-container py-6 sm:py-8">
            <nav class="breadcrumbs mb-5 text-sm text-base-content/60" aria-label="Breadcrumb">
                <ul>
                    <li>
                        <RouterLink :to="{ name: 'Home' }" class="link-hover">网站首页</RouterLink>
                    </li>
                    <li v-if="category_crumb">
                        <RouterLink :to="{ name: 'ArticleList', query: { category: category_crumb.id } }"
                            class="link-hover">
                            {{ category_crumb.name }}
                        </RouterLink>
                    </li>
                    <li class="font-medium text-base-content/70">正文</li>
                </ul>
            </nav>

            <div class="mx-auto max-w-[64rem]">
                <!-- 加载状态：骨架屏，形状贴近正文避免白屏跳动 -->
                <div v-if="loading" class="overflow-hidden rounded-box border border-base-300 bg-base-100">
                    <div class="space-y-4 px-6 py-12 sm:px-12">
                        <SkeletonBlock class="mx-auto h-7 w-3/4" />
                        <SkeletonBlock class="mx-auto h-4 w-1/3" />
                        <SkeletonBlock class="mx-auto mt-8 h-3 w-full" />
                        <SkeletonBlock class="mx-auto h-3 w-11/12" />
                        <SkeletonBlock class="mx-auto h-3 w-full" />
                        <SkeletonBlock class="mx-auto h-3 w-4/5" />
                    </div>
                </div>

                <!-- 错误状态 -->
                <div v-else-if="error"
                    class="rounded-box border border-base-300 bg-base-100 px-6 py-16 text-center">
                    <svg class="mx-auto mb-5 h-14 w-14 text-base-content/40" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h2 class="mb-2 text-lg font-semibold text-base-content">{{ error }}</h2>
                    <p class="mb-6 text-sm text-base-content/60">请检查文章链接或网络后重试，也可返回其他页面</p>
                    <div class="flex justify-center gap-3">
                        <RouterLink :to="{ name: 'ArticleList' }" class="btn btn-primary btn-sm sm:btn-md">
                            返回列表
                        </RouterLink>
                        <RouterLink :to="{ name: 'Home' }" class="btn btn-ghost btn-sm sm:btn-md">
                            返回首页
                        </RouterLink>
                    </div>
                </div>

                <!-- 正常内容：transition 类为加载→内容切换预留淡入（仅展示层） -->
                <article v-else class="overflow-hidden rounded-box border border-base-300 bg-base-100 transition-opacity duration-200">
                    <header class="px-6 pb-8 pt-10 text-center sm:px-12 sm:pt-12">
                        <RouterLink v-if="category_crumb"
                            :to="{ name: 'ArticleList', query: { category: category_crumb.id } }"
                            class="eyebrow inline-flex items-center gap-1.5 text-primary/70 hover:text-primary">
                            {{ category_crumb.name }}
                        </RouterLink>

                        <h1 class="mx-auto mt-4 max-w-3xl text-[1.375rem] font-bold leading-snug tracking-tight text-base-content sm:text-[1.75rem] sm:leading-[1.45]">
                            {{ article_detail?.title }}
                        </h1>

                        <!-- 元信息：作者 / 时间 / 阅读量，弱化颜色只保留一层信息层级 -->
                        <div class="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-base-content/60">
                            <RouterLink v-if="article_detail?.user"
                                :to="{ name: 'Profile', params: { id: article_detail.user.id } }"
                                class="inline-flex items-center gap-1.5 hover:text-primary">
                                <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[0.625rem] font-semibold text-primary">
                                    {{ article_detail.user.nickname?.slice(0, 1) ?? '佚' }}
                                </span>
                                {{ article_detail.user.nickname }}
                            </RouterLink>
                            <span v-else class="inline-flex items-center gap-1.5">佚名</span>
                            <span class="h-3 w-px bg-base-300" aria-hidden="true"></span>
                            <time class="num" :datetime="article_detail?.create_at">
                                {{ dayjs(article_detail?.create_at).format('YYYY-MM-DD HH:mm') }}
                            </time>
                            <span class="h-3 w-px bg-base-300" aria-hidden="true"></span>
                            <span class="num">阅读 {{ article_detail?.view_count }}</span>
                        </div>
                    </header>

                    <!-- 阅读工具条：字号切换与点赞集中在一行，正文区保持干净 -->
                    <div class="flex flex-wrap items-center justify-between gap-3 border-y border-base-300 bg-base-200/60 px-6 py-3 sm:px-12">
                        <div class="flex items-center gap-2">
                            <span class="text-xs text-base-content/55">字号</span>
                            <div class="inline-flex items-center gap-0.5 rounded-lg bg-base-100 p-0.5">
                                <button v-for="option in ([{ key: 'sm', label: '小' }, { key: 'md', label: '中' }, { key: 'lg', label: '大' }] as const)"
                                    :key="option.key" type="button"
                                    class="rounded-md px-3 py-1 text-xs transition-colors duration-200"
                                    :class="font_size === option.key
                                        ? 'bg-primary/10 font-medium text-primary'
                                        : 'text-base-content/65 hover:text-base-content/80'"
                                    :aria-pressed="font_size === option.key"
                                    @click="font_size = option.key">
                                    {{ option.label }}
                                </button>
                            </div>
                        </div>

                        <div class="flex items-center gap-3">
                            <p v-if="like_message" class="text-xs text-success">{{ like_message }}</p>
                            <button type="button" :disabled="has_liked || liking"
                                class="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs transition-colors duration-200"
                                :class="has_liked
                                    ? 'cursor-default border-primary/25 bg-primary/10 text-primary'
                                    : 'border-base-300 bg-base-100 text-base-content/60 hover:border-primary/40 hover:text-primary'"
                                @click="handle_like">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                                    :fill="has_liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8"
                                    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    <path
                                        d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                                </svg>
                                {{ has_liked ? '已点赞' : '点赞' }}
                                <span v-if="like_count > 0" class="num">{{ like_count }}</span>
                            </button>
                        </div>
                    </div>

                    <!-- 正文区：放宽到 max-w-5xl 并保留舒适留白，长文阅读不局促 -->
                    <div class="prose mx-auto max-w-5xl px-6 py-10 sm:px-10 sm:py-12 prose-headings:mb-4 prose-headings:mt-8 prose-headings:font-bold prose-headings:text-base-content prose-h1:text-2xl prose-h2:text-2xl prose-h3:text-base prose-p:indent-2em prose-p:leading-relaxed prose-strong:font-semibold prose-strong:text-base-content prose-blockquote:rounded-lg prose-blockquote:border-l-primary prose-blockquote:bg-base-200 prose-blockquote:px-4 prose-blockquote:py-2 prose-ul:mx-8 prose-ul:my-4 prose-ul:list-disc prose-ol:mx-8 prose-ol:my-4 prose-ol:list-decimal prose-a:font-semibold prose-a:text-primary prose-a:underline prose-a:underline-offset-2 prose-img:mx-auto prose-img:my-6 prose-img:block prose-img:w-2/3 prose-img:max-w-full prose-img:rounded-sm prose-img:shadow"
                        :class="font_size_class" v-html="renderedHtml" @click="handle_prose_click">
                    </div>

                    <!-- 文末：点赞 + 返回列表，给阅读一个收尾动作 -->
                    <div class="flex flex-col items-center gap-4 border-t border-base-300 px-6 py-10 sm:px-12">
                        <button type="button" :disabled="has_liked || liking"
                            class="btn btn-primary gap-2 rounded-full"
                            :class="has_liked ? 'btn-soft cursor-default' : ''"
                            @click="handle_like">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                :fill="has_liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path
                                    d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                            </svg>
                            {{ has_liked ? '已点赞' : '为这篇文章点赞' }}
                            <span v-if="like_count > 0" class="num opacity-70">{{ like_count }}</span>
                        </button>
                        <RouterLink :to="{ name: 'ArticleList', query: category_crumb ? { category: category_crumb.id } : {} }"
                            class="inline-flex items-center gap-1.5 text-sm text-base-content/60 hover:text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                                fill="none" aria-hidden="true">
                                <path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round"></path>
                            </svg>
                            返回列表
                        </RouterLink>
                    </div>
                </article>
            </div>
        </div>

        <DocumentPreview v-model="preview_open" :url="preview_url" :filename="preview_name" />
    </main>
</template>

<style scoped>
:deep(.prose mark) {
    background-color: var(--color-accent);
    color: var(--color-accent-content);
    padding-left: 0.25rem;
    padding-right: 0.25rem;
    border-radius: 0.125rem;
}

/* 正文图片外层链接：给一个「可放大」的指针暗示，图片本身仍是块级居中 */
:deep(.prose .md-image-link) {
    display: block;
    cursor: zoom-in;
}

/* 附件链接：与普通外链区分开，点击是预览而不是离开页面 */
:deep(.prose .doc-link) {
    cursor: pointer;
}

/* 文档图标：prose-img:block 会把图标也压成独占一行，这里强制回行内并贴合基线 */
:deep(.prose img.doc-icon) {
    display: inline-block;
    width: 1.125rem;
    height: 1.125rem;
    margin: 0 0.25rem 0 0;
    vertical-align: -0.15em;
    border: none;
    border-radius: 0.25rem;
}
</style>
