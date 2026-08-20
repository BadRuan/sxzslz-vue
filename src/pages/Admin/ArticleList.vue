<script setup lang="ts">
import { ref, onMounted } from 'vue';
import apiService from '@/utils/apiService';
import { storeToRefs } from 'pinia';
import dayjs from 'dayjs';
import { useBaseinfoStore } from '@/store/base';
import { category_text } from '@/utils/formatters';
import { type ArticleModel } from '@/store/article';

const latest_article = ref<ArticleModel[]>();

const getAdminLatestArticle = async () => {
    try {
        const res = await apiService.get('/admin/latest/', { limit: 50 });
        latest_article.value = res;
    } catch (error) {
        console.error('获取管理后台最新文章失败:', error)
    }
};

const baseinfo_store = useBaseinfoStore();
const { categories, users } = storeToRefs(baseinfo_store);

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
};
onMounted(
    async () => {
        getAdminLatestArticle();
        baseinfo_store.checkBaseinfo();
    }
);
</script>

<template>
    <main class="flex-1 overflow-y-auto p-6">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-gray-900">文章管理</h2>
            <a href="#"
                class="rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-400">
                + 新增文章
            </a>
        </div>

        <div class="bg-white rounded-lg shadow-xs ring-1 ring-border overflow-x-auto">
            <table class="w-full text-sm text-left">
                <thead class="border-b border-border text-gray-500">
                    <tr class="text-center">
                        <th class="px-5 py-3 font-medium">分类</th>
                        <th class="px-5 py-3 font-medium">标题</th>
                        <th class="px-5 py-3 font-medium">作者</th>
                        <th class="px-5 py-3 font-medium">推荐</th>
                        <th class="px-5 py-3 font-medium">浏览量</th>
                        <th class="px-5 py-3 font-medium">发布时间</th>
                        <th class="px-5 py-3 font-medium">操作</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-border divide-dashed">
                    <tr v-for="(article, index) in latest_article" :key="index" class="text-center">
                        <td class="px-5 py-3 text-gray-600">
                            {{ category_text(article.category_id, categories) }}
                        </td>
                        <td class="px-5 py-3 text-gray-700 text-left max-w-xs truncate">
                            {{ article.title }}
                        </td>
                        <td class="px-5 py-3 text-gray-600 text-left">
                            {{ nickname_text(article.user_id) }}
                        </td>
                        <td class="px-5 py-3">
                            <button v-if="article.is_recommended" class="inline-flex items-center rounded-full px-2 py-0.5 text-xs  cursor-pointer transition-colors
                                        bg-green-100 text-primary-700 hover:bg-yellow-100">
                                已推荐
                            </button>
                            <button v-else class="inline-flex items-center rounded-full px-2 py-0.5 text-xs cursor-pointer transition-colors
                                        bg-gray-100 text-gray-400 hover:bg-gray-200">
                                未推荐
                            </button>
                        </td>
                        <td class="px-5 py-3 text-gray-600">{{ article.view_count }}</td>
                        <td class="px-5 py-3 text-gray-500">{{ dayjs(article.create_at).format('YYYY-MM-DD HH:mm:ss')
                            }}</td>
                        <td class="px-5 py-3">
                            <div class="flex items-center justify-center gap-3">
                                <button class="text-xs text-primary-700 hover:underline">编辑</button>
                                <button class="text-xs text-red-600 hover:underline">删除</button>
                            </div>
                        </td>
                    </tr>

                </tbody>
            </table>


        </div>
    </main>
</template>