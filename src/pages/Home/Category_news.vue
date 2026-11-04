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
    <section class="bg-base-200 section-y">
        <div class="page-container">
            <TitleComponent>
                <template #first>分类资讯</template>
                <template #second>Category News</template>
            </TitleComponent>

            <!-- 接口失败：展示后端 detail，避免分类/文章拉取失败时静默空栏 -->
            <p v-if="baseinfo_error || home_error" role="alert" class="alert alert-error mt-6 text-sm">
                {{ baseinfo_error || home_error }}
            </p>

            <div class="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <div v-for="(col, index) in columns" :key="col.key"
                    class="card flex flex-col rounded-box p-6 card-hover hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] sm:p-7">
                    <div class="flex items-center justify-between gap-3">
                        <div class="flex items-center gap-3">
                            <span class="num text-[0.6875rem] font-medium tracking-widest text-primary/45">
                                0{{ index + 1 }}
                            </span>
                            <h3 class="text-base font-semibold tracking-tight text-base-content">{{ col.title }}</h3>
                        </div>
                        <RouterLink :to="{ name: 'ArticleList', query: { category: col.cid } }"
                            class="group inline-flex items-center gap-1 text-xs text-base-content/45 hover:text-primary">
                            更多
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                                fill="none" class="transition-transform duration-200 group-hover:translate-x-0.5"
                                aria-hidden="true">
                                <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round"></path>
                            </svg>
                        </RouterLink>
                    </div>

                    <ul class="mt-4 flex-1 divide-y divide-base-300/80">
                        <li v-for="item in col.list" :key="item.id">
                            <RouterLink :to="{ name: 'ArticleDetail', params: { slug: item.slug } }"
                                class="group flex items-center justify-between gap-4 py-3">
                                <span
                                    class="min-w-0 flex-1 truncate text-sm text-base-content/75 transition-colors duration-200 group-hover:text-primary">
                                    {{ item.title }}
                                </span>
                                <span class="num shrink-0 text-xs text-base-content/35">{{ easy_date_text(item.create_at) }}</span>
                            </RouterLink>
                        </li>
                    </ul>

                    <p v-if="!col.list.length" class="py-10 text-center text-sm text-base-content/35">暂无内容</p>
                </div>
            </div>
        </div>
    </section>
</template>
