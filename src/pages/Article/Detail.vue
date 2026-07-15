<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import MarkdownIt from 'markdown-it';
import dayjs from 'dayjs';
import { useArticleStore } from '@/store/article';
import { useCategoryStore } from '@/store/category';
import { useUserStore } from '@/store/user';
import { pic_prefix } from '@/utils/baseInfo';

const route = useRoute();
const router = useRouter();
const slug = route.params.slug;
const article_store = useArticleStore();
const category_store = useCategoryStore();
const user_store = useUserStore();

const { article_detail } = storeToRefs(article_store);
const { categories } = storeToRefs(category_store);
const { users } = storeToRefs(user_store);

const error = ref<string | null>(null);
const loading = ref(true);

onMounted(async () => {
    if (slug == undefined || typeof slug !== 'string') {
        router.replace({ name: 'Home' });
        return;
    }

    loading.value = true;
    error.value = null;

    const result = await article_store.getDetail(slug);
    if (result == undefined) {
        error.value = '文章不存在或已被删除';
    }
    await user_store.getUsers();

    loading.value = false;
    if (categories.value.length == 0) {
        category_store.fetchCategories()
    }
})

const category_text = (category_id: number | undefined) => {
    if (!category_id) {
        return '';
    } else {
        for (let item of categories.value) {
            if (category_id == item.id) {
                return item.name
            }
        }
        return ''
    }
}

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

const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
})


const renderedHtml = computed(() => {
    if (!article_detail.value) {
        return '';
    } else {
        let content = article_detail.value.content;

        content = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
            // 如果是外部链接，直接返回原内容
            if (src.startsWith('http') || src.startsWith('//')) {
                return match;
            }
            // 拼接前缀，并重新组装成 Markdown 语法
            return `![${alt}](${pic_prefix}${src})`;
        });
        return md.render(content);
    }
})


</script>

<template>
    <main class="bg-background">
        <div class="min-h-screen py-10 px-4">
            <nav class="w-7xl mx-auto mb-6 px-4 sm:px-6 lg:px-8" aria-label="Breadcrumb">
                <ol class="flex items-center gap-2 text-sm text-gray-500">
                    <li>
                        <RouterLink :to="{ name: 'Home' }" class="hover:text-primary transition-colors">
                            网站首页
                        </RouterLink>
                    </li>
                    <li>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7">
                            </path>
                        </svg>
                    </li>
                    <li>
                        <RouterLink :to="{ name: 'ArticleList', query: { category: article_detail?.category_id } }"
                            class="hover:text-primary transition-colors">
                            {{ category_text(article_detail?.category_id) }}
                        </RouterLink>
                    </li>
                    <li>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7">
                            </path>
                        </svg>
                    </li>
                    <li class="text-gray-700 font-medium">正文</li>
                </ol>
            </nav>

            <!-- 加载状态 -->
            <div v-if="loading"
                class="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-border p-12 text-center">
                <div
                    class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4">
                </div>
                <p class="text-gray-500">加载中...</p>
            </div>

            <!-- 错误状态 -->
            <div v-else-if="error"
                class="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-border p-12 text-center">
                <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h2 class="text-xl font-semibold text-gray-700 mb-2">{{ error }}</h2>
                <p class="text-gray-500 mb-6">请检查文章链接是否正确，或返回其他页面</p>
                <div class="flex justify-center gap-4">
                    <RouterLink :to="{ name: 'ArticleList' }"
                        class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                        返回列表
                    </RouterLink>
                    <RouterLink :to="{ name: 'Home' }"
                        class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                        返回首页
                    </RouterLink>
                </div>
            </div>

            <!-- 正常内容 -->
            <article v-else
                class="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                <div class="px-6 sm:px-10 pt-10 pb-6 border-b border-border text-center">
                    <h1 class="text-3xl font-bold text-gray-900 leading-tight mb-4">
                        {{ article_detail?.title }}
                    </h1>
                    <div
                        class="inline-flex items-center justify-center gap-4 text-sm text-gray-500 px-3 py-1 bg-gray-50 rounded-md">
                        <time datetime="2024-07-23">{{ dayjs(article_detail?.create_at).format('YYYY年MM月DD日 HH:mm:ss')
                        }}</time>
                        <span class="hidden sm:inline">|</span>
                        <span>来源：{{ nickname_text(article_detail?.user_id) }}</span>
                        <span class="hidden sm:inline">|</span>
                        <span>阅读量：{{ article_detail?.view_count }}</span>
                    </div>
                </div>
                <div class="px-6 sm:px-10 py-8 prose prose-primary prose-lg max-w-none
                        prose-headings:font-bold prose-headings:text-gray-900 prose-headings:mb-4 prose-headings:mt-8
                        prose-h1:text-2xl prose-h2:text-xl prose-h3:text-base
                        prose-p:my-4 prose-p:leading-relaxed prose-p:indent-2em
                        prose-strong:text-gray-900 prose-strong:font-semibold
                        prose-blockquote:border-l-primary prose-blockquote:bg-red-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded
                        prose-ul:list-disc prose-ul:mx-8 prose-ul:my-4 prose-ul:text-gray-700
                        prose-ol:list-decimal prose-ol:mx-8 prose-ol:my-4 prose-ol:text-gray-700
                        prose-a:text-primary prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-primary/80
                        prose-img:w-2/3 prose-img:shadow prose-img:my-6 prose-img:mx-auto
                        " v-html="renderedHtml">

                </div>

            </article>
        </div>
    </main>
</template>