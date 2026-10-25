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

// 后端无 /profile/ 专用接口：用 GET /articles/?user_id= 服务端过滤作者文章
const latest_article = ref<ArticleModel[]>([]);
const getArticles = async () => {
    try {
        const res = await articleService.getArticles({ page: 1, page_size: 100, user_id });
        latest_article.value = res.data ?? [];
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
    <main class="bg-base-200 flex flex-col gap-8 py-4">
        <div class="card rounded-box m-auto w-7xl flex flex-row justify-between p-10">
            <div class="flex flex-row gap-8">
                <div class="w-24 h-24 rounded-2xl">
                    <img :src="url_prefix.pic_prefix + head_img" alt="head_img">
                </div>
                <div class="flex flex-col">
                    <div class="flex flex-row items-center">
                        <span class="text-2xl font-bold text-base-content/90">{{ nickname_text(user_id) }}</span><img
                            class="h-6 w-6 mx-4" src="/icon/v.png" alt="v">
                    </div>
                    <span class="py-4 text-base-content/80">暂无简介及其他补充信息</span>
                </div>
            </div>
            <div class="flex flex-row p-4 gap-12">
                <div class="flex flex-col items-center">
                    <span class="text-base-content/60">发布文章</span>
                    <span class="text-base-content/90 text-2xl">{{ post_count }}</span>
                </div>
                <div class="flex flex-col items-center">
                    <span class="text-base-content/60">文章累计阅读量</span>
                    <span class="text-base-content/90 text-2xl">{{ view_count }}</span>
                </div>
            </div>
        </div>

        <div class="card rounded-box w-7xl m-auto py-8 px-10">
            <div class="font-bold mx-2">文章动态</div>
            <ul class="divide-y divide-base-300 divide-dashed">
                <li v-for="(article, index) in latest_article" :key="index"
                    class="px-5 py-3 flex items-center justify-between">
                    <div class="flex flex-row items-center">
                        <div class="bg-base-300 w-1 h-1 rounded-xl"></div>
                        <div class="px-4 py-2 mr-4 text-sm font-bold rounded-2xl text-base-content/80 shrink-0"
                            :title="article_categories(article).title">
                            {{ article_categories(article).label }}
                            <span v-if="article_categories(article).extra > 0"
                                class="badge badge-ghost badge-xs ml-1">
                                +{{ article_categories(article).extra }}
                            </span>
                        </div>
                        <RouterLink :to="{ name: 'ArticleDetail', params: { slug: article.slug } }"
                            class="text-sm text-base-content/80 hover:text-primary truncate">
                            <span class="font-semibold">{{ article.title }}</span>
                        </RouterLink>
                    </div>
                    <time class="ml-4 shrink-0 text-xs text-base-content/40">{{ date_text(article.create_at) }}</time>
                </li>
            </ul>
        </div>
    </main>
</template>
