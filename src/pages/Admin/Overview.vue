<script setup lang="ts">
import { ref } from 'vue'
import type { ArticleBasic } from '@/types/article'

const article_count = ref(1243)
const this_mounth_article_count = ref(10)
const image_count = ref(123)
const attachment_count = ref(132)
const user_count = ref(19)

const article_list = ref<ArticleBasic[]>([
    {
        slug: '',
        category: '',
        author: '',
        title: '鸠江区编办莅临沈巷镇水利站开展防汛检查工作',
        created: '2026-06-09'
    },
    {
        slug: '',
        category: '',
        author: '',
        title: '水利工程标准化管理暨安全生产工作会议召开',
        created: '2026-06-08'
    },
    {
        slug: '',
        category: '',
        author: '',
        title: '冬季检修全面启动保障泵站安全运行',
        created: '2026-06-07'
    },
    {
        slug: '',
        category: '',
        author: '',
        title: '关于进一步加强水资源管理的通知',
        created: '2026-06-06'
    },
    {
        slug: '',
        category: '',
        author: '',
        title: '沈巷镇水利站电网账号管理规定',
        created: '2026-06-05'
    },
    {
        slug: '',
        category: '',
        author: '',
        title: '鸠江区编办莅临沈巷镇水利站开展防汛检查工作',
        created: '2026-06-09'
    },
    {
        slug: '',
        category: '',
        author: '',
        title: '水利工程标准化管理暨安全生产工作会议召开',
        created: '2026-06-08'
    },
    {
        slug: '',
        category: '',
        author: '',
        title: '冬季检修全面启动保障泵站安全运行',
        created: '2026-06-07'
    },
    {
        slug: '',
        category: '',
        author: '',
        title: '关于进一步加强水资源管理的通知',
        created: '2026-06-06'
    },
    {
        slug: '',
        category: '',
        author: '',
        title: '沈巷镇水利站电网账号管理规定',
        created: '2026-06-05'
    },
    {
        slug: '',
        category: '',
        author: '',
        title: '鸠江区编办莅临沈巷镇水利站开展防汛检查工作',
        created: '2026-06-09'
    },
    {
        slug: '',
        category: '',
        author: '',
        title: '水利工程标准化管理暨安全生产工作会议召开',
        created: '2026-06-08'
    },
    {
        slug: '',
        category: '',
        author: '',
        title: '冬季检修全面启动保障泵站安全运行',
        created: '2026-06-07'
    },
    {
        slug: '',
        category: '',
        author: '',
        title: '关于进一步加强水资源管理的通知',
        created: '2026-06-06'
    },
    {
        slug: '',
        category: '',
        author: '',
        title: '沈巷镇水利站电网账号管理规定',
        created: '2026-06-05'
    },
])
</script>


<template>
    <main class="flex-1 overflow-y-auto p-6 space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="bg-white rounded-lg shadow-xs ring-1 ring-border p-5 flex items-center gap-4">
                <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <div>
                    <div class="text-sm text-gray-500">文章总数</div>
                    <div class="text-2xl font-bold text-gray-900 mt-1">{{ article_count }}</div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-xs ring-1 ring-border p-5 flex items-center gap-4">
                <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </div>
                <div>
                    <div class="text-sm text-gray-500">本月发布</div>
                    <div class="text-2xl font-bold text-gray-900 mt-1">{{ this_mounth_article_count }}</div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-xs ring-1 ring-border p-5 flex items-center gap-4">
                <div class="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <div>
                    <div class="text-sm text-gray-500">图片数量</div>
                    <div class="text-2xl font-bold text-gray-900 mt-1">{{ image_count }}</div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-xs ring-1 ring-border p-5 flex items-center gap-4">
                <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                </div>
                <div>
                    <div class="text-sm text-gray-500">附件数量</div>
                    <div class="text-2xl font-bold text-gray-900 mt-1">{{ attachment_count }}</div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-xs ring-1 ring-border p-5 flex items-center gap-4">
                <div class="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                </div>
                <div>
                    <div class="text-sm text-gray-500">系统用户</div>
                    <div class="text-2xl font-bold text-gray-900 mt-1">{{ user_count }}</div>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow-xs ring-1 ring-border">
            <div class="px-5 py-4 border-b border-border">
                <h3 class="text-sm font-semibold text-gray-900">最近新闻</h3>
            </div>
            <ul class="divide-y divide-border">
                <li v-for="(article, index) in article_list" :key="index"
                    class="px-5 py-3 flex items-center justify-between">
                    <a href="#" class="text-sm text-gray-700 hover:text-primary truncate">{{ article.title }}</a>
                    <time class="ml-4 shrink-0 text-xs text-gray-400">{{ article.created }}</time>
                </li>
            </ul>
        </div>
    </main>
</template>