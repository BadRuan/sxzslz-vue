<script setup lang="ts">
import { reactive, computed } from 'vue';
import MarkdownIt from 'markdown-it';

interface Article {
    slug: string
    category: string
    author: string
    title: string
    content: string
    created: string
    view: number
}

const article = reactive<Article>({
    slug: 'string',
    category: 'string',
    author: '沈巷镇水利站',
    title: '鸠江区编办莅临沈巷镇水利站开展防汛备汛专项检查',
    content: '### 标题',
    created: '2024年07月23日',
    view: 121221
})

const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
})

const renderedHtml = computed(() => {
    return md.render(article.content)
})

</script>

<template>
    <main class="bg-background">
        <div class="min-h-screen py-10 px-4">
            <nav class="max-w-6xl mx-auto mb-6 px-4 sm:px-6 lg:px-8" aria-label="Breadcrumb">
                <ol class="flex items-center gap-2 text-sm text-gray-500">
                    <li>
                        <a href="#" class="hover:text-primary transition-colors">
                            网站首页
                        </a>
                    </li>
                    <li>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7">
                            </path>
                        </svg>
                    </li>
                    <li>
                        <a href="#" class="hover:text-primary transition-colors">
                            通知公告
                        </a>
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

            <article class="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                <div class="px-6 sm:px-10 pt-10 pb-6 border-b border-border text-center">
                    <h1 class="text-3xl font-bold text-gray-900 leading-tight mb-4">
                        {{ article.title }}
                    </h1>
                    <div
                        class="flex items-center justify-center gap-4 text-sm text-gray-500 px-3 py-1 bg-gray-50 rounded-md inline-flex">
                        <time datetime="2024-07-23">{{ article.created }}</time>
                        <span class="hidden sm:inline">|</span>
                        <span>来源：{{ article.author }}</span>
                        <span class="hidden sm:inline">|</span>
                        <span>阅读量：{{ article.view }}</span>
                    </div>
                </div>
                <div class="px-6 sm:px-10 py-8 prose prose-primary prose-lg max-w-none
                        prose-headings:font-bold prose-headings:text-gray-900 prose-headings:mb-4 prose-headings:mt-8
                        prose-h1:text-2xl prose-h2:text-xl prose-h2:border-l-2 prose-h2:border-primary-light prose-h2:pl-2
                        prose-p:my-4 prose-p:leading-relaxed
                        prose-strong:text-gray-900 prose-strong:font-semibold
                        prose-blockquote:border-l-primary prose-blockquote:bg-red-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded
                        prose-ul:list-disc prose-ul:pl-5 prose-ul:my-4 prose-ul:text-gray-700
                        prose-ol:list-decimal prose-ol:pl-5 prose-ol:my-4 prose-ol:text-gray-700
                        prose-a:text-primary prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-primary/80
                        " v-html="renderedHtml">

                </div>

            </article>
        </div>
    </main>
</template>