<script setup lang="ts">
import { ref, onMounted } from 'vue';
import apiService from '@/utils/apiService';

interface Category {
    id: number
    name: string
    article_count: number
    view_count: number
};

const categories = ref<Category[]>([]);

const queryCategoryInfo = async () => {
    try {
        const res = await apiService.get('/admin/category/');
        categories.value = res;
    } catch (error) {
        console.error('获取分类详细信息失败:', error)
    }
}

onMounted(
    async () => {
        queryCategoryInfo();
    }
);
</script>

<template>
    <main class="flex-1 overflow-y-auto p-6">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-gray-800">分类管理</h2>
        </div>

        <div class="bg-white rounded-lg shadow-xs ring-1 ring-border overflow-x-auto">
            <table class="w-full text-sm text-center">
                <thead class="border-b border-border text-gray-500">
                    <tr>
                        <th class="px-5 py-3 font-medium">分类ID</th>
                        <th class="px-5 py-3 font-medium">分类名称</th>
                        <th class="px-5 py-3 font-medium">文章数量</th>
                        <th class="px-5 py-3 font-medium">阅读量</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-border divide-dashed">
                    <tr v-for="(category, index) in categories" :key="index" class="hover:bg-gray-50">
                        <td class="px-5 py-3 text-gray-500">{{ category.id }}</td>
                        <td class="px-5 py-3 text-gray-500">{{ category.name }}</td>
                        <td class="px-5 py-3 text-gray-600">{{ category.article_count }}</td>
                        <td class="px-5 py-3 text-gray-600">{{ category.view_count }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </main>
</template>