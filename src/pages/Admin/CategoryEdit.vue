<script setup lang="ts">
import { ref } from 'vue'

interface Category {
    id: number
    name: string
    article_count: number
    created: string
}

const categories = ref<Category[]>([
    {
        id: 1,
        name: '单位简介',
        article_count: 10,
        created: '2026-01-06'
    },
    {
        id: 2,
        name: '水利站新闻',
        article_count: 14,
        created: '2026-01-07'
    },
    {
        id: 3,
        name: '党建工作',
        article_count: 220,
        created: '2026-02-01'
    },
    {
        id: 4,
        name: '通知公告',
        article_count: 673,
        created: '2026-02-16'
    },
    {
        id: 5,
        name: '会议记录',
        article_count: 161,
        created: '2026-03-26'
    },
    {
        id: 6,
        name: '文件公示',
        article_count: 2,
        created: '2026-04-19'
    },
    {
        id: 7,
        name: '财政信息',
        article_count: 140,
        created: '2026-04-06'
    },
    {
        id: 8,
        name: '工程项目',
        article_count: 810,
        created: '2026-04-16'
    },
    {
        id: 9,
        name: '人事招考',
        article_count: 110,
        created: '2026-06-01'
    },
    {
        id: 10,
        name: '信息转载',
        article_count: 5,
        created: '2026-06-06'
    },
])
</script>

<template>
    <main class="flex-1 overflow-y-auto p-6">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-gray-900">分类管理</h2>
        </div>


        <div class="bg-white rounded-lg shadow-xs ring-1 ring-border p-5 mb-6">
            <h3 class="text-sm font-semibold text-gray-900 mb-3">新增分类</h3>
            <form method="POST" action="/admin/category/create" class="flex gap-3">
                <input type="text" name="name" placeholder="请输入分类名称" required
                    class="flex-1 rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <button type="submit"
                    class="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90">添加</button>
            </form>
        </div>


        <div class="bg-white rounded-lg shadow-xs ring-1 ring-border overflow-x-auto">
            <table class="w-full text-sm text-left min-w-[600px]">
                <thead class="border-b border-border text-gray-500">
                    <tr>
                        <th class="px-5 py-3 font-medium">ID</th>
                        <th class="px-5 py-3 font-medium">分类名称</th>
                        <th class="px-5 py-3 font-medium">文章数</th>
                        <th class="px-5 py-3 font-medium">创建时间</th>
                        <th class="px-5 py-3 font-medium text-center">操作</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-border">
                    <tr v-for="(category, index) in categories" :key="index" class="hover:bg-gray-50">
                        <td class="px-5 py-3 text-gray-500">{{ category.id }}</td>
                        <td class="px-5 py-3 text-gray-500">{{ category.name }}</td>
                        <td class="px-5 py-3 text-gray-600">{{ category.article_count }}</td>
                        <td class="px-5 py-3 text-gray-500">{{ category.created }}</td>
                        <td class="px-5 py-3 text-center">
                            <button type="submit" class="text-xs text-red-600 hover:underline">删除</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </main>
</template>