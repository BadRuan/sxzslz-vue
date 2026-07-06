<script setup lang="ts">
import { ref } from 'vue'
import type { ArticleItem } from '@/types/article'

const articles = ref<ArticleItem[]>([
    {
        slug: '',
        title: '鸠江区编办莅临沈巷镇水利站开展防汛检查工作',
        category: '政策法规',
        author: '系统管理员',
        is_public: true,
        is_recommended: true,
        views: 123,
        created: '2026-05-01'
    },
    {
        slug: '',
        title: '冬季检修全面启动保障泵站安全运行',
        category: '通知公告',
        author: '用户01',
        is_public: true,
        is_recommended: true,
        views: 123,
        created: '2026-04-05'
    },
    {
        slug: '',
        title: '鸠江区编办莅临沈巷镇水利站开展防汛检查工作',
        category: '工程简报',
        author: '张三',
        is_public: false,
        is_recommended: true,
        views: 5123,
        created: '2025-12-21'
    },
    {
        slug: '',
        title: '沈巷镇水利站电网账号管理规定',
        category: '要闻动态',
        author: '李伟',
        is_public: true,
        is_recommended: false,
        views: 9123,
        created: '2025-10-09'
    },
    {
        slug: '',
        title: '冬季检修全面启动保障泵站安全运行',
        category: '政策法规',
        author: '张三',
        is_public: false,
        is_recommended: true,
        views: 4123,
        created: '2024-03-08'
    },
    {
        slug: '',
        title: '水利工程标准化管理暨安全生产工作会议召开',
        category: '要闻动态',
        author: '赵四',
        is_public: true,
        is_recommended: false,
        views: 1123,
        created: '2023-09-05'
    },
    {
        slug: '',
        title: '鸠江区编办莅临沈巷镇水利站开展防汛检查工作',
        category: '工程简报',
        author: '张强',
        is_public: false,
        is_recommended: false,
        views: 3,
        created: '2022-11-09'
    },
])
</script>

<template>
    <main class="flex-1 overflow-y-auto p-6">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-gray-900">文章管理</h2>
            <a href="#" class="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                + 新增文章
            </a>
        </div>

        <div class="bg-white rounded-lg shadow-xs ring-1 ring-border overflow-x-auto">
            <table class="w-full text-sm text-left min-w-[900px]">
                <thead class="border-b border-border text-gray-500">
                    <tr class="text-center">
                        <th class="px-5 py-3 font-medium">标题</th>
                        <th class="px-5 py-3 font-medium">分类</th>
                        <th class="px-5 py-3 font-medium">作者</th>
                        <th class="px-5 py-3 font-medium">状态</th>
                        <th class="px-5 py-3 font-medium">推荐</th>
                        <th class="px-5 py-3 font-medium">浏览量</th>
                        <th class="px-5 py-3 font-medium">发布时间</th>
                        <th class="px-5 py-3 font-medium">操作</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-border">
                    <tr v-for="(article, index) in articles" :key="index" class="hover:bg-gray-50 text-center">
                        <td class="px-5 py-3 text-gray-900 font-medium max-w-xs truncate">
                            {{ article.title }}
                        </td>
                        <td class="px-5 py-3 text-gray-600">
                            {{ article.category }}
                        </td>
                        <td class="px-5 py-3 text-gray-600">
                            {{ article.author }}
                        </td>
                        <td class="px-5 py-3">
                            <button v-if="article.is_public" type="submit" class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer transition-colors
                                        bg-green-50 text-green-600 hover:bg-green-100">
                                公开
                            </button>
                            <button v-else type="submit" class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer transition-colors
                                        bg-gray-100 text-gray-500 hover:bg-gray-200">
                                隐藏
                            </button>
                        </td>
                        <td class="px-5 py-3">
                            <button v-if="article.is_recommended" type="submit" class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer transition-colors
                                        bg-yellow-50 text-yellow-600 hover:bg-yellow-100">
                                ★ 推荐
                            </button>
                            <button v-else type="submit" class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer transition-colors
                                        bg-gray-100 text-gray-400 hover:bg-gray-200">
                                ☆ 未推荐
                            </button>
                        </td>
                        <td class="px-5 py-3 text-gray-600">{{ article.views }}</td>
                        <td class="px-5 py-3 text-gray-500">{{ article.created }}</td>
                        <td class="px-5 py-3">
                            <div class="flex items-center justify-center gap-3">
                                <a href="#" class="text-xs text-primary hover:underline">编辑</a>
                                <button type="submit" class="text-xs text-red-600 hover:underline">删除</button>
                            </div>
                        </td>
                    </tr>

                </tbody>
            </table>


        </div>
    </main>
</template>