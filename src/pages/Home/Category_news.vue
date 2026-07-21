<script setup lang="ts">
import TitleComponent from '@/components/TitleComponent.vue';
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useArticleStore } from '@/store/article';
import { easy_date_text } from '@/utils/formatters';

const article_store = useArticleStore();
const { notice_article, meeting_article, finance_article } = storeToRefs(article_store);

onMounted(() => {
    article_store.getCategoryArticle();
});

</script>

<template>
    <div class="bg-neutral-100 py-4">
        <section class="mx-auto w-7xl h-full">
            <TitleComponent>
                <template #first>分类资讯</template>
                <template #second>Category News</template>
            </TitleComponent>

            <div class="flex flex-row justify-around">
                <div class="bg-white w-100 p-4 shadow rounded">
                    <div class="flex flex-row justify-between items-center">
                        <div class="text-gray-600 text-sm font-bold my-2">通知公告</div>
                        <RouterLink :to="{ name: 'ArticleList', query: { category: 2 } }"
                            class="text-sm m-4 hover:text-red-700">
                            查看更多 &gt;
                        </RouterLink>
                    </div>
                    <ul class="flex flex-col gap-4 justify-around divide-y divide-dashed divide-gray-200">
                        <RouterLink v-for="item in notice_article" :key="item.id"
                            :to="{ name: 'ArticleDetail', params: { slug: item.slug } }">
                            <li
                                class="flex items-center justify-between group transition-transform duration-300 hover:-translate-y-2">
                                <div class="flex flex-row items-center">
                                    <svg class="text-primary -rotate-90" width="10" height="10" viewBox="0 0 24 24"
                                        fill="currentColor">
                                        <path fill-rule="evenodd"
                                            d="M13.792 20.319c-.781 1.406-2.803 1.406-3.584 0L2.418 6.296c-.76-1.367.228-3.046 1.791-3.046h15.582c1.563 0 2.55 1.68 1.791 3.046l-7.79 14.023Z"
                                            clip-rule="evenodd"></path>
                                    </svg>

                                    <div class="text-gray-900 group-hover:text-primary text-sm py-2 px-2">{{ item.title
                                    }}</div>
                                </div>
                                <div class="text-gray-400 text-right text-sm px-4">{{ easy_date_text(item.create_at) }}
                                </div>
                            </li>
                        </RouterLink>
                    </ul>
                </div>

                <div class="bg-white w-100 p-4 shadow rounded">
                    <div class="flex flex-row justify-between items-center">
                        <div class="text-gray-600 text-sm font-bold my-2">会议公开</div>
                        <RouterLink :to="{ name: 'ArticleList', query: { category: 4 } }"
                            class="text-sm m-4 hover:text-red-700">
                            查看更多 &gt;
                        </RouterLink>
                    </div>
                    <ul class="flex flex-col gap-4 justify-around divide-y divide-dashed divide-gray-200">
                        <RouterLink v-for="item in meeting_article" :key="item.id"
                            :to="{ name: 'ArticleDetail', params: { slug: item.slug } }">
                            <li
                                class="flex items-center justify-between group transition-transform duration-300 hover:-translate-y-2">
                                <div class="flex flex-row items-center">
                                    <svg class="text-primary -rotate-90" width="10" height="10" viewBox="0 0 24 24"
                                        fill="currentColor">
                                        <path fill-rule="evenodd"
                                            d="M13.792 20.319c-.781 1.406-2.803 1.406-3.584 0L2.418 6.296c-.76-1.367.228-3.046 1.791-3.046h15.582c1.563 0 2.55 1.68 1.791 3.046l-7.79 14.023Z"
                                            clip-rule="evenodd"></path>
                                    </svg>

                                    <div class="text-gray-900 group-hover:text-primary text-sm py-2 px-2">{{ item.title
                                    }}</div>
                                </div>
                                <div class="text-gray-400 text-right text-sm px-4">{{ easy_date_text(item.create_at) }}
                                </div>
                            </li>
                        </RouterLink>
                    </ul>
                </div>


                <div class="bg-white w-100 p-4 shadow rounded">
                    <div class="flex flex-row justify-between items-center">
                        <div class="text-gray-600 text-sm font-bold my-2">财务信息</div>
                        <RouterLink :to="{ name: 'ArticleList', query: { category: 5 } }"
                            class="text-sm m-4 hover:text-red-700">
                            查看更多 &gt;
                        </RouterLink>
                    </div>
                    <ul class="flex flex-col gap-4 justify-around divide-y divide-dashed divide-gray-200">
                        <RouterLink v-for="item in finance_article" :key="item.id"
                            :to="{ name: 'ArticleDetail', params: { slug: item.slug } }">
                            <li
                                class="flex items-center justify-between group transition-transform duration-300 hover:-translate-y-2">
                                <div class="flex flex-row items-center">
                                    <svg class="text-primary -rotate-90" width="10" height="10" viewBox="0 0 24 24"
                                        fill="currentColor">
                                        <path fill-rule="evenodd"
                                            d="M13.792 20.319c-.781 1.406-2.803 1.406-3.584 0L2.418 6.296c-.76-1.367.228-3.046 1.791-3.046h15.582c1.563 0 2.55 1.68 1.791 3.046l-7.79 14.023Z"
                                            clip-rule="evenodd"></path>
                                    </svg>

                                    <div class="text-gray-900 group-hover:text-primary text-sm py-2 px-2">{{ item.title
                                        }}</div>
                                </div>
                                <div class="text-gray-400 text-right text-sm px-4">{{ easy_date_text(item.create_at) }}
                                </div>
                            </li>
                        </RouterLink>
                    </ul>
                </div>

            </div>
        </section>
    </div>
</template>