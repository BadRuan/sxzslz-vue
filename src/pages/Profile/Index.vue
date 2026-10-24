<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useBaseinfoStore } from '@/store/base';
import { date_text } from '@/utils/formatters';
import { categories_compact } from '@/utils/category';
import { articleService, type ArticleModel } from '@/store/article';
import { url_prefix } from '@/utils/baseInfo';

const route = useRoute();
const user_id = Number(route.params.id);
const head_img = '192878a6502947989a25d49d55f39266.jpg';

// 后端无 /profile/ 接口：从公开文章列表（page_size 上限 100）过滤作者
const latest_article = ref<ArticleModel[]>([]);
const getArticles = async () => {
    try {
        const res = await articleService.getArticles({ page: 1, page_size: 100 });
        latest_article.value = (res.data ?? []).filter(article => article.user?.id === user_id);
    } catch (error) {
        console.error('获取失败:', error)
    }
}

const post_count = computed(() => latest_article.value.length);
const view_count = computed(() =>
    latest_article.value.reduce((sum, article) => sum + article.view_count, 0)
);

const baseinfo_store = useBaseinfoStore();
const { users } = storeToRefs(baseinfo_store);

/** 卡片分类展示：只显示一个二级分类名，多分类折叠为 +N（悬停 title 可看全部） */
const article_categories = (article: ArticleModel) =>
    categories_compact(article.categories);

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


onMounted(
    async () => {
        getArticles();
        baseinfo_store.checkBaseinfo();
    }
);
</script>

<template>
    <main class="bg-background flex flex-col gap-8 py-4">
        <div class="bg-white m-auto w-7xl rounded-2xl shadow-card flex flex-row justify-between p-10">
            <div class="flex flex-row gap-8">
                <div class="w-24 h-24 rounded-2xl">
                    <img :src="url_prefix.pic_prefix + head_img" alt="head_img">
                </div>
                <div class="flex flex-col">
                    <div class="flex flex-row items-center">
                        <span class="text-2xl font-bold text-gray-800">{{ nickname_text(user_id) }}</span><img
                            class="h-6 w-6 mx-4" src="/icon/v.png" alt="v">
                    </div>
                    <span class="py-4 text-gray-700">暂无简介及其他补充信息</span>
                </div>
            </div>
            <div class="flex flex-row p-4 gap-12">
                <div class="flex flex-col items-center">
                    <span class="text-gray-500">发布文章</span>
                    <span class="text-gray-800 text-2xl">{{ post_count }}</span>
                </div>
                <div class="flex flex-col items-center">
                    <span class="text-gray-500">文章累计阅读量</span>
                    <span class="text-gray-800 text-2xl">{{ view_count }}</span>
                </div>
            </div>
        </div>

        <div class="bg-white w-7xl m-auto py-8 px-10 rounded-2xl shadow-card">
            <div class="font-bold mx-2">文章动态</div>
            <ul class="divide-y divide-border divide-dashed">
                <li v-for="(article, index) in latest_article" :key="index"
                    class="px-5 py-3 flex items-center justify-between">
                    <div class="flex flex-row items-center">
                        <div class="bg-gray-400 w-1 h-1 rounded-xl"></div>
                        <div class="px-4 py-2 mr-4 text-sm font-bold rounded-2xl text-gray-700 shrink-0"
                            :title="article_categories(article).title">
                            {{ article_categories(article).label }}
                            <span v-if="article_categories(article).extra > 0"
                                class="ml-1 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600">
                                +{{ article_categories(article).extra }}
                            </span>
                        </div>
                        <RouterLink :to="{ name: 'ArticleDetail', params: { slug: article.slug } }"
                            class="text-base text-gray-500 hover:text-primary-400 truncate">
                            <span class="font-bold">{{ article.title }}</span>
                        </RouterLink>
                    </div>
                    <time class="ml-4 shrink-0 text-xs text-gray-400">{{ date_text(article.create_at) }}</time>
                </li>
            </ul>
        </div>
    </main>
</template>
