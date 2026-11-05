<script setup lang="ts">
import TitleComponent from '@/components/TitleComponent.vue';
import { Splide, SplideSlide } from '@splidejs/vue-splide';
import '@splidejs/splide/css';
import { date_text, easy_date_text } from '@/utils/formatters';
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useBaseinfoStore } from '@/store/base';
import { useArticleStore } from '@/store/article';
import { name_category_id, categories_label, to_second_level_id } from '@/utils/category';
import { CATEGORY_NAMES } from '@/utils/categoryConfig';
import ArticleCover from '@/components/ArticleCover.vue';

const baseinfo_store = useBaseinfoStore();
const article_store = useArticleStore();

const { categories } = storeToRefs(baseinfo_store);
const { article_obj, loading, home_error } = storeToRefs(article_store);

// 跳列表页：名称命中一级分类时取其第一个子分类（文章只挂二级）
const notice_category_id = computed(() => to_second_level_id(categories.value, name_category_id(categories.value, CATEGORY_NAMES.notice)));
const news_category_id = computed(() => to_second_level_id(categories.value, name_category_id(categories.value, CATEGORY_NAMES.news)));

const options = {
    type: 'loop',        // 无缝循环播放
    autoplay: true,      // 开启自动播放
    interval: 4000,      // 自动播放间隔 4秒
    pauseOnHover: true,  // 鼠标悬停时暂停（提升阅读体验）
    arrows: true,        // 显示上下篇切换箭头
    pagination: true,    // 显示底部分页指示点
    speed: 800,          // 切换动画时长
};

/** 公告列表的年份单独取，MM/DD 用大字号，年份弱化 */
const year_of = (value: string) => date_text(value).slice(0, 4);

onMounted(async () => {
    await Promise.all([
        baseinfo_store.checkBaseinfo(),
        article_store.checkHomeArticle()
    ]);
})
</script>

<template>
    <section class="bg-base-100 section-y">
        <div class="page-container">
            <TitleComponent>
                <template #first>水利站动态</template>
                <template #second>Station News</template>
                <template #action>
                    <RouterLink :to="{ name: 'ArticleList', query: { category: news_category_id } }"
                        class="group inline-flex items-center gap-1.5 text-sm font-medium text-base-content/55 hover:text-primary">
                        全部动态
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                            class="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">
                            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8"
                                stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                    </RouterLink>
                </template>
            </TitleComponent>

            <div v-if="loading" class="card mt-8 rounded-box p-12 text-center">
                <span class="loading loading-spinner loading-md mx-auto mb-4 block"></span>
                <p class="text-sm text-base-content/65">正在加载动态…</p>
            </div>

            <!-- 接口失败：展示后端 detail 并提供重试，避免首页静默空白 -->
            <div v-else-if="home_error" class="card mt-8 rounded-box p-12 text-center">
                <p class="text-error mb-4">{{ home_error }}</p>
                <button type="button" class="btn btn-sm btn-primary" @click="article_store.checkHomeArticle()">
                    重新加载
                </button>
            </div>

            <div v-else class="mt-8 grid gap-6 lg:grid-cols-12 lg:gap-8">
                <!-- 推荐动态轮播 -->
                <Splide :options="options"
                    class="news-splide w-full overflow-hidden rounded-box border border-base-300 lg:col-span-8">
                    <SplideSlide v-for="(article, index) in article_obj.recommended" :key="index">
                        <RouterLink :to="{ name: 'ArticleDetail', params: { slug: article.slug } }"
                            class="group relative block h-full w-full overflow-hidden">
                            <ArticleCover :slug="article.cover_img_slug" alt="推荐动态封面"
                                class="transition-transform duration-500 ease-out group-hover:scale-[1.02]" />
                            <!-- 底部深色渐变：保证叠字在任何封面上都可读 -->
                            <div
                                class="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral/80 via-neutral/20 to-transparent">
                            </div>

                            <div class="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                                <div class="flex flex-wrap items-center gap-2.5">
                                    <span
                                        class="rounded-full bg-white/15 px-2.5 py-1 text-[0.6875rem] font-medium text-white backdrop-blur-sm">
                                        {{ categories_label(article.categories) }}
                                    </span>
                                    <span class="text-xs text-white/70">{{ date_text(article.create_at) }}</span>
                                </div>
                                <h3
                                    class="mt-3 max-w-3xl text-lg font-semibold leading-snug tracking-tight text-white line-clamp-2 sm:text-xl">
                                    {{ article.title }}
                                </h3>
                            </div>
                        </RouterLink>
                    </SplideSlide>
                </Splide>

                <!-- 通知公告：lg 下绝对定位铺满右侧格子，高度严格跟随左侧轮播（16/9），
                     条目多时在卡片内部滚动，不再把整行撑高 -->
                <div class="relative lg:col-span-4">
                    <div class="card flex flex-col rounded-box p-6 sm:p-7 lg:absolute lg:inset-0">
                        <div class="flex items-center justify-between">
                            <h3 class="flex items-center gap-2 text-base font-semibold tracking-tight text-base-content">
                                <span class="inline-block size-1.5 rounded-full bg-primary" aria-hidden="true"></span>
                                {{ CATEGORY_NAMES.notice[0] }}
                            </h3>
                            <RouterLink :to="{ name: 'ArticleList', query: { category: notice_category_id } }"
                                class="group inline-flex items-center gap-1 text-xs text-base-content/60 hover:text-primary">
                                更多
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                                    fill="none" class="transition-transform duration-200 group-hover:translate-x-0.5"
                                    aria-hidden="true">
                                    <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round"></path>
                                </svg>
                            </RouterLink>
                        </div>

                        <ul class="mt-3 flex-1 divide-y divide-base-300 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
                            <li v-for="item in article_obj.notice" :key="item.id">
                                <RouterLink :to="{ name: 'ArticleDetail', params: { slug: item.slug } }"
                                    class="group flex items-center gap-3.5 py-3.5">
                                    <span
                                        class="grid w-12 shrink-0 place-items-center rounded-lg bg-base-200 py-1.5 text-center transition-colors duration-200 group-hover:bg-primary/10">
                                        <span class="num text-[0.8125rem] font-semibold leading-none text-base-content/80">{{
                                            easy_date_text(item.create_at) }}</span>
                                        <span class="num mt-1 text-[0.625rem] leading-none text-base-content/50">{{
                                            year_of(item.create_at) }}</span>
                                    </span>
                                    <span
                                        class="min-w-0 flex-1 truncate text-sm text-base-content/75 transition-colors duration-200 group-hover:text-primary">{{
                                            item.title }}</span>
                                </RouterLink>
                            </li>
                        </ul>

                        <p v-if="!article_obj.notice.length" class="py-10 text-center text-sm text-base-content/50">
                            暂无通知公告
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
/* 轮播固定 16/9，slide 高度撑满，封面才能铺满整块 */
.news-splide {
    aspect-ratio: 16 / 9;
}

.news-splide :deep(.splide__track),
.news-splide :deep(.splide__list),
.news-splide :deep(.splide__slide) {
    height: 100%;
}

/* 箭头：半透明玻璃质感，hover 才变实 */
.news-splide :deep(.splide__arrow) {
    width: 2.5rem;
    height: 2.5rem;
    background: rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(6px);
    opacity: 0;
    transition: opacity 200ms ease-out, background-color 200ms ease-out;
}

.news-splide:hover :deep(.splide__arrow) {
    opacity: 1;
}

.news-splide :deep(.splide__arrow svg) {
    fill: #ffffff;
}

.news-splide :deep(.splide__arrow:hover) {
    background: rgba(255, 255, 255, 0.32);
}

/* 指示点：当前页拉成短横条，比一排圆点更克制 */
.news-splide :deep(.splide__pagination) {
    bottom: 0.75rem;
    gap: 0.375rem;
}

.news-splide :deep(.splide__pagination__page) {
    width: 6px;
    height: 6px;
    margin: 0;
    background: rgba(255, 255, 255, 0.45);
    transition: width 260ms cubic-bezier(0.22, 1, 0.36, 1), background-color 200ms ease-out;
}

.news-splide :deep(.splide__pagination__page.is-active) {
    width: 18px;
    border-radius: 999px;
    background: #ffffff;
    transform: none;
}
</style>
