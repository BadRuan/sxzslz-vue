<script setup lang="ts">
import TitleComponent from '@/components/TitleComponent.vue';
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useArticleStore } from '@/store/article';
import { useBaseinfoStore } from '@/store/base';
import { easy_date_text } from '@/utils/formatters';
import { name_category_id, to_second_level_id } from '@/utils/category';
import { CATEGORY_NAMES } from '@/utils/categoryConfig';

const article_store = useArticleStore();
const baseinfo_store = useBaseinfoStore();
const { article_obj } = storeToRefs(article_store);
const { categories } = storeToRefs(baseinfo_store);

// 「更多」跳列表页：名称命中一级分类时取其第一个子分类（文章只挂二级）
const meeting_category_id = computed(() => to_second_level_id(categories.value, name_category_id(categories.value, CATEGORY_NAMES.meeting)));
const hr_category_id = computed(() => to_second_level_id(categories.value, name_category_id(categories.value, CATEGORY_NAMES.hr)));
const finance_category_id = computed(() => to_second_level_id(categories.value, name_category_id(categories.value, CATEGORY_NAMES.finance)));

onMounted(() => {
    Promise.all([
        article_store.checkHomeArticle(),
        baseinfo_store.checkBaseinfo(),
    ]);
});

const more_link_class = 'text-sm mr-4 px-3 py-1 hover:text-primary-500 hover:font-bold transition-transform duration-300 hover:translate-x-1';
const item_title_class = 'text-gray-900 hover:text-primary-500 hover:font-bold text-sm py-2 px-2';
</script>

<template>
    <div class="section-y">
        <section class="mx-auto w-7xl h-full">
            <TitleComponent>
                <template #first>分类资讯</template>
                <template #second>Category News</template>
            </TitleComponent>

            <div class="flex flex-row justify-around gap-8 pt-2">

                <div class="bg-white w-100 p-6 rounded-2xl shadow-card divide-y divide-border">
                    <div class="flex flex-row justify-between items-center">
                        <div class="text-gray-600 text-base font-bold my-2">会议公开</div>
                        <RouterLink :to="{ name: 'ArticleList', query: { category: meeting_category_id } }" :class="more_link_class">
                            更多 &gt;
                        </RouterLink>
                    </div>
                    <ul class="flex flex-col gap-4 justify-around divide-y divide-dashed divide-border">
                        <RouterLink v-for="item in article_obj.metting" :key="item.id"
                            :to="{ name: 'ArticleDetail', params: { slug: item.slug } }">
                            <li class="flex items-center justify-between">
                                <div class="flex flex-row items-center">
                                    <div class="bg-gray-400 w-1 h-1 rounded-xl"></div>

                                    <div :class="item_title_class">{{ item.title }}</div>
                                </div>
                                <div class="text-gray-400 text-right text-sm px-4">{{ easy_date_text(item.create_at) }}
                                </div>
                            </li>
                        </RouterLink>
                    </ul>
                </div>

                <div class="bg-white w-100 p-6 rounded-2xl shadow-card divide-y divide-border">
                    <div class="flex flex-row justify-between items-center">
                        <div class="text-gray-600 text-base font-bold my-2">人事动态</div>
                        <RouterLink :to="{ name: 'ArticleList', query: { category: hr_category_id } }" :class="more_link_class">
                            更多 &gt;
                        </RouterLink>
                    </div>
                    <ul class="flex flex-col gap-4 justify-around divide-y divide-dashed divide-border">
                        <RouterLink v-for="item in article_obj.hr_job" :key="item.id"
                            :to="{ name: 'ArticleDetail', params: { slug: item.slug } }">
                            <li class="flex items-center justify-between">
                                <div class="flex flex-row items-center">
                                    <div class="bg-gray-400 w-1 h-1 rounded-xl"></div>

                                    <div :class="item_title_class">{{ item.title }}</div>
                                </div>
                                <div class="text-gray-400 text-right text-sm px-4">{{ easy_date_text(item.create_at) }}
                                </div>
                            </li>
                        </RouterLink>
                    </ul>
                </div>




                <div class="bg-white w-100 p-6 rounded-2xl shadow-card divide-y divide-border">
                    <div class="flex flex-row justify-between items-center">
                        <div class="text-gray-600 text-base font-bold my-2">财务信息</div>
                        <RouterLink :to="{ name: 'ArticleList', query: { category: finance_category_id } }" :class="more_link_class">
                            更多 &gt;
                        </RouterLink>
                    </div>
                    <ul class="flex flex-col gap-4 justify-around divide-y divide-dashed divide-border">
                        <RouterLink v-for="item in article_obj.finance" :key="item.id"
                            :to="{ name: 'ArticleDetail', params: { slug: item.slug } }">
                            <li class="flex items-center justify-between">
                                <div class="flex flex-row items-center">
                                    <div class="bg-gray-400 w-1 h-1 rounded-xl"></div>

                                    <div :class="item_title_class">{{ item.title }}</div>
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