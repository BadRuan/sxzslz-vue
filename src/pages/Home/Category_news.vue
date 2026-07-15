<script setup lang="ts">
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useArticleStore } from '@/store/article';
import { date_text } from '@/utils/formatters';

const article_store = useArticleStore();
const { notice_article, meeting_article, finance_article } = storeToRefs(article_store);

onMounted(() => {
    article_store.getCategoryArticle();
});

</script>

<template>
    <div class="bg-neutral-100 py-4">
        <section class="mx-auto w-7xl h-full">
            <div class="flex justify-between items-end">
                <div class="flex items-center py-4">
                    <span class="h-5 w-1 rounded bg-primary mr-4"></span>
                    <div>
                        <p class="text-xs text-gray-500">Category News</p>
                        <h2 class="text-lg font-semibold text-gray-900">分类资讯</h2>
                    </div>
                </div>
            </div>

            <div class="flex flex-row justify-around">
                <div class="bg-white w-100 p-4 shadow rounded">
                    <div class="flex flex-row justify-between items-center">
                        <div class="text-gray-600 text-sm font-bold my-2">通知公告</div>
                        <RouterLink :to="{ name: 'ArticleList', query: { category: 2 } }"
                            class="text-sm m-4 hover:text-red-700">
                            More &gt;
                        </RouterLink>
                    </div>
                    <ul class="flex flex-col gap-4 justify-around">
                        <RouterLink v-for="item in notice_article" :key="item.id"
                            :to="{ name: 'ArticleDetail', params: { slug: item.slug } }">
                            <li class="rounded mx-2 py-2 transition-transform duration-300 hover:-translate-y-2">
                                <div class="text-gray-900 text-sm py-2 px-4">{{ item.title }}</div>
                                <div class="text-gray-300 text-sm px-4">{{ date_text(item.create_at) }}</div>
                            </li>
                        </RouterLink>
                    </ul>
                </div>
                <div class="bg-white w-100 p-4 shadow rounded">
                    <div class="flex flex-row justify-between items-center">
                        <div class="text-gray-600 text-sm font-bold my-2">会议公开</div>
                        <RouterLink :to="{ name: 'ArticleList', query: { category: 4 } }"
                            class="text-sm m-4 hover:text-red-700">
                            More &gt;
                        </RouterLink>
                    </div>
                    <ul class="flex flex-col gap-4 justify-around">
                        <RouterLink v-for="item in meeting_article" :key="item.id"
                            :to="{ name: 'ArticleDetail', params: { slug: item.slug } }">
                            <li class="rounded mx-2 py-2 transition-transform duration-300 hover:-translate-y-2">
                                <div class="text-gray-700 text-sm py-2 px-4">{{ item.title }}</div>
                                <div class="text-gray-500 text-sm px-4">{{ date_text(item.create_at) }}</div>
                            </li>
                        </RouterLink>
                    </ul>
                </div>
                <div class="bg-white w-100 p-4 shadow rounded">
                    <div class="flex flex-row justify-between items-center">
                        <div class="text-gray-600 text-sm font-bold my-2">财务信息</div>
                        <RouterLink :to="{ name: 'ArticleList', query: { category: 5 } }"
                            class="text-sm m-4 hover:text-red-700">
                            More &gt;
                        </RouterLink>
                    </div>
                    <ul class="flex flex-col gap-4 justify-around">
                        <RouterLink v-for="item in finance_article" :key="item.id"
                            :to="{ name: 'ArticleDetail', params: { slug: item.slug } }">
                            <li class="rounded mx-2 py-2 transition-transform duration-300 hover:-translate-y-2">
                                <div class="text-gray-700 text-sm py-2 px-4">{{ item.title }}</div>
                                <div class="text-gray-500 text-sm px-4">{{ date_text(item.create_at) }}</div>
                            </li>
                        </RouterLink>
                    </ul>
                </div>
            </div>
        </section>
    </div>
</template>