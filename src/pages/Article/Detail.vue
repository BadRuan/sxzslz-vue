<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import MarkdownIt from 'markdown-it';
import linkAttributes from 'markdown-it-link-attributes';
import mark from 'markdown-it-mark';
import DOMPurify from 'dompurify';
import dayjs from 'dayjs';
import { useArticleStore, articleService } from '@/store/article';
import { useBaseinfoStore } from '@/store/base';
import { url_prefix } from '@/utils/baseInfo';
import 'github-markdown-css/github-markdown.css';

const route = useRoute();
const router = useRouter();
const slug = route.params.slug;
const article_store = useArticleStore();
const baseinfo_store = useBaseinfoStore();

const { article_detail } = storeToRefs(article_store);

/** 面包屑只显示文章自身的二级分类名（不显示一级分类）；分类树/详情到达后才有值 */
const category_crumb = computed(() => {
    const cat = article_detail.value?.categories?.[0];
    return cat ? { id: cat.id, name: cat.name } : undefined;
});

const error = ref<string | null>(null);
const loading = ref(true);

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
        error.value = '文章不存在或已被删除';
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
        like_message.value = '点赞失败，请稍后重试';
    } finally {
        liking.value = false;
        setTimeout(() => { like_message.value = ''; }, 2000);
    }
};

const md = new MarkdownIt({
    html: false,
    breaks: true,
    linkify: true,
    typographer: true
}).use(linkAttributes, {
    attrs: {
        target: '_blank',
        rel: 'noopener noreferrer'
    }
}).use(mark);

const renderedHtml = computed(() => {
    if (!article_detail.value) {
        return '';
    } else {
        let content = article_detail.value.content ?? '';

        content = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
            if (src.startsWith('http') || src.startsWith('//')) {
                return match;
            }
            return `![${alt}](${url_prefix.pic_prefix}${src})`;
        });

        content = content.replace(/(?<!!)\[([^\]]+)\]\(([^)]+)\)/g, (match, text, href) => {
            // 如果是绝对地址或协议相对地址，直接返回原内容
            if (href.startsWith('http') || href.startsWith('//')) {
                return match;
            }
            // 如果是相对地址，自动添加 document_prefix 前缀
            return `[${text}](${url_prefix.document_prefix}${href})`;
        });

        return DOMPurify.sanitize(md.render(content), {
            ADD_ATTR: ['target']
        });
    }
})


</script>

<template>
    <main class="bg-base-200">
        <div class="min-h-screen pt-5 pb-14 px-4">
            <nav class="breadcrumbs page-container mb-4 text-base text-base-content/60"
                aria-label="Breadcrumb">
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
                    <li class="text-base-content/80 font-medium">正文</li>
                </ul>
            </nav>

            <!-- 加载状态 -->
            <div v-if="loading" class="max-w-7xl mx-auto card rounded-box p-12 text-center">
                <span class="loading loading-spinner loading-md mx-auto mb-4 block"></span>
                <p class="text-base-content/60">加载中...</p>
            </div>

            <!-- 错误状态 -->
            <div v-else-if="error" class="max-w-7xl mx-auto card rounded-box p-12 text-center">
                <svg class="w-16 h-16 text-base-content/40 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h2 class="text-xl font-semibold text-base-content/80 mb-2">{{ error }}</h2>
                <p class="text-base-content/60 mb-6">请检查文章链接是否正确，或返回其他页面</p>
                <div class="flex justify-center gap-4">
                    <RouterLink :to="{ name: 'ArticleList' }" class="btn btn-primary">
                        返回列表
                    </RouterLink>
                    <RouterLink :to="{ name: 'Home' }" class="btn">
                        返回首页
                    </RouterLink>
                </div>
            </div>

            <!-- 正常内容 -->
            <article v-else class="max-w-7xl mx-auto min-h-120 px-4 card rounded-box overflow-hidden">
                <div class="px-6 sm:px-10 pt-12 pb-8 border-b border-base-300 text-center">
                    <h1 class="text-2xl md:text-3xl font-bold text-base-content/90 leading-tight mb-5">
                        {{ article_detail?.title }}
                    </h1>

                    <div class="flex flex-wrap items-center justify-center gap-6 md:gap-12 text-sm text-base-content/60">
                        <div class="flex flex-row items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="text-base-content/60 mr-2" width="20" height="20"
                                viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="7" r="5" stroke="currentColor" stroke-width="1"
                                    stroke-linejoin="bevel"></circle>
                                <path stroke="currentColor" stroke-width="1" stroke-linejoin="bevel"
                                    d="M22 22C22 16.4772 17.5228 12 12 12C6.47715 12 2 16.4772 2 22"></path>
                            </svg>
                            <RouterLink v-if="article_detail?.user"
                                :to="{ name: 'Profile', params: { id: article_detail.user.id } }"
                                class="text-base text-base-content/60 hover:text-primary truncate">
                                <span>{{ article_detail.user.nickname }}</span>
                            </RouterLink>
                            <span v-else class="text-base text-base-content/60">佚名</span>
                        </div>
                        <div class="flex flex-row items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                                fill="none" class="text-base-content/60 mr-2">
                                <path d="M2 3.5L22 3.5L22 22.5L2 22.5L2 3.5Z" stroke="currentColor" stroke-width="1"
                                    stroke-linejoin="round"></path>
                                <path stroke="currentColor" stroke-width="1" d="M6 5L6 2"></path>
                                <path stroke="currentColor" stroke-width="1" d="M18 5L18 2"></path>
                                <path stroke="currentColor" stroke-width="1" d="M22 7.5L2 7.5"></path>
                                <circle cx="12.5" cy="15" r="5" stroke="currentColor" stroke-width="1"
                                    stroke-linejoin="round"></circle>
                                <path stroke="currentColor" stroke-width="1" stroke-linejoin="round"
                                    d="M12 12.5L12 15.5L15 15.5"></path>
                            </svg>
                            <time datetime="2024-07-23">
                                {{ dayjs(article_detail?.create_at).format('YYYY-MM-DD HH:mm')
                                }}</time>
                        </div>
                        <div class="flex flex-row items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                                fill="none" class="text-base-content/60 mr-2">
                                <path stroke="currentColor" stroke-width="1" stroke-linejoin="round"
                                    d="M2 2L2 22L22 22"></path>
                                <path d="M20.6107 10.8462L20.6877 6.33992L16.4984 8.00208L20.6107 10.8462Z"
                                    stroke="currentColor" stroke-width="1" stroke-linejoin="round"></path>
                                <path stroke="currentColor" stroke-width="1" stroke-linejoin="round"
                                    d="M18.5 9.5L14 16L9.5 13L5 18"></path>
                            </svg>
                            <span>阅读量: {{ article_detail?.view_count }}</span>
                        </div>
                    </div>
                </div>
                <!-- 正文区：加宽到 max-w-5xl（原 768px 在大屏下卡片内两侧留白过多），并保留上下留白 -->
                <div class="px-6 sm:px-10 py-12 mx-auto max-w-5xl prose prose-lg
                        prose-headings:font-bold prose-headings:text-base-content/90 prose-headings:mb-4 prose-headings:mt-8
                        prose-h1:text-2xl prose-h2:text-2xl prose-h3:text-base
                        prose-p:leading-relaxed prose-p:indent-2em
                        prose-strong:text-base-content/80 prose-strong:font-semibold
                        prose-blockquote:border-l-primary prose-blockquote:bg-error/10 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-lg
                        prose-ul:list-disc prose-ul:mx-8 prose-ul:my-4 prose-ul:text-base-content/80
                        prose-ol:list-decimal prose-ol:mx-8 prose-ol:my-4 prose-ol:text-base-content/80
                        prose-a:text-primary prose-a:underline prose-a:underline-offset-2 prose-a:font-bold
                        prose-img:w-full prose-img:shadow prose-img:rounded-sm prose-img:my-6 prose-img:mx-auto
                        " v-html="renderedHtml">

                </div>

                <!-- 匿名点赞 -->
                <div class="px-6 sm:px-10 pb-10 flex flex-col items-center gap-2 border-t border-base-300 pt-8">
                    <button type="button" :disabled="has_liked || liking"
                        class="btn btn-main gap-2"
                        :class="has_liked
                            ? 'btn-primary btn-soft btn-disabled cursor-default'
                            : 'btn-primary'"
                        @click="handle_like">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                            :fill="has_liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round">
                            <path
                                d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                        </svg>
                        {{ has_liked ? '已点赞' : '点赞' }} {{ like_count > 0 ? `· ${like_count}` : '' }}
                    </button>
                    <p v-if="like_message" class="text-sm text-base-content/60">{{ like_message }}</p>
                </div>

            </article>
        </div>
    </main>
</template>

<style scoped>
:deep(.prose mark) {
    background-color: #fce852;
    color: #1b1b1b;
    padding-left: 0.25rem;
    padding-right: 0.25rem;
    border-radius: 0.125rem;
}
</style>