<script setup lang="ts">
import TitleComponent from '@/components/TitleComponent.vue';
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useArticleStore } from '@/store/article';
import { useBaseinfoStore } from '@/store/base';
import { easy_date_text } from '@/utils/formatters';
import { name_category_id, to_second_level_id } from '@/utils/category';
import { CATEGORY_NAMES } from '@/utils/categoryConfig';
import type { ArticleModel } from '@/store/article';

const article_store = useArticleStore();
const baseinfo_store = useBaseinfoStore();
const { article_obj, home_error } = storeToRefs(article_store);
const { categories, error_message: baseinfo_error } = storeToRefs(baseinfo_store);

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

// 三栏配置驱动：避免同结构卡片模板复制三份
const columns = computed(() => [
    { key: 'meeting', title: CATEGORY_NAMES.meeting[0], list: article_obj.value.metting as ArticleModel[], cid: meeting_category_id.value },
    { key: 'hr', title: CATEGORY_NAMES.hr[0], list: article_obj.value.hr_job as ArticleModel[], cid: hr_category_id.value },
    { key: 'finance', title: CATEGORY_NAMES.finance[0], list: article_obj.value.finance as ArticleModel[], cid: finance_category_id.value },
]);
</script>

<template>
    <div class="section-y">
        <section class="page-container h-full">
            <TitleComponent>
                <template #first>分类资讯</template>
                <template #second>Category News</template>
            </TitleComponent>

            <!-- 接口失败：展示后端 detail，避免分类/文章拉取失败时静默空栏 -->
            <p v-if="baseinfo_error || home_error" role="alert" class="alert alert-error mt-4 text-sm">
                {{ baseinfo_error || home_error }}
            </p>

            <div class="grid gap-6 mt-6 md:grid-cols-2 xl:grid-cols-3">
                <div v-for="col in columns" :key="col.key" class="card rounded-box p-6 divide-y divide-base-300">
                    <div class="flex flex-row justify-between items-center">
                        <div class="text-base-content/70 text-base font-bold my-2">{{ col.title }}</div>
                        <RouterLink :to="{ name: 'ArticleList', query: { category: col.cid } }"
                            class="btn btn-ghost btn-xs mr-4">
                            更多 &gt;
                        </RouterLink>
                    </div>
                    <ul class="flex flex-col gap-4 justify-around divide-y divide-dashed divide-base-300">
                        <RouterLink v-for="item in col.list" :key="item.id"
                            :to="{ name: 'ArticleDetail', params: { slug: item.slug } }">
                            <li class="flex items-center justify-between">
                                <div class="flex flex-row items-center min-w-0 flex-1">
                                    <div class="bg-base-300 w-1 h-1 rounded-xl shrink-0"></div>

                                    <div
                                        class="text-base-content hover:text-primary text-sm py-2 px-2 truncate">
                                        {{ item.title }}</div>
                                </div>
                                <div class="text-base-content/40 text-right text-sm px-4 shrink-0">{{ easy_date_text(item.create_at) }}
                                </div>
                            </li>
                        </RouterLink>
                    </ul>
                </div>
            </div>
        </section>
    </div>
</template>
