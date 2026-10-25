<script setup lang="ts">
import TitleComponent from '@/components/TitleComponent.vue';
import { Splide, SplideSlide } from '@splidejs/vue-splide';
import '@splidejs/splide/css';
import { url_prefix } from '@/utils/baseInfo';
import { easy_date_text } from '@/utils/formatters';
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useBaseinfoStore } from '@/store/base';
import { useArticleStore } from '@/store/article';
import { name_category_id, categories_label, to_second_level_id } from '@/utils/category';
import { CATEGORY_NAMES } from '@/utils/categoryConfig';

const baseinfo_store = useBaseinfoStore();
const article_store = useArticleStore();

const { categories } = storeToRefs(baseinfo_store);
const { article_obj, loading } = storeToRefs(article_store);

// 跳列表页：名称命中一级分类时取其第一个子分类（文章只挂二级）
const notice_category_id = computed(() => to_second_level_id(categories.value, name_category_id(categories.value, CATEGORY_NAMES.notice)));

const options = {
    type: 'loop',        // 无缝循环播放
    autoplay: true,      // 开启自动播放
    interval: 4000,      // 自动播放间隔 4秒
    pauseOnHover: true,  // 鼠标悬停时暂停（提升阅读体验）
    arrows: true,        // 显示上下篇切换箭头
    pagination: true,    // 显示底部分页指示点
    speed: 800,          // 切换动画时长
};

onMounted(async () => {
    await Promise.all([
        baseinfo_store.checkBaseinfo(),
        article_store.checkHomeArticle()
    ]);
})

</script>

<template>
    <div class="section-y">
        <section class="mx-auto w-7xl h-full">
            <div class="flex justify-between items-end">
                <TitleComponent>
                    <template #first>水利站动态</template>
                    <template #second>Station News</template>
                </TitleComponent>
            </div>

            <div v-if="loading"
                class="max-w-7xl mx-auto card rounded-box border border-base-300 p-12 text-center">
                <span class="loading loading-spinner loading-md mx-auto mb-4 block"></span>
                <p class="text-base-content/60">加载中...</p>
            </div>

            <div v-else class="w-7xl flex flex-row gap-10 items-center justify-around mt-6">

                <Splide :options="options" class="overflow-hidden rounded-box shadow-sm w-180 h-120">
                    <SplideSlide v-for="(article, index) in article_obj.recommended" :key="index">
                        <RouterLink :to="{ name: 'ArticleDetail', params: { slug: article.slug } }"
                            class="relative bg-cover bg-center">
                            <img v-if="article.cover_img_slug" class="w-180 h-120"
                                :src="url_prefix.pic_prefix + article.cover_img_slug" alt="new_pic">
                            <div v-else class="w-180 h-120 bg-base-300"></div>
                            <div
                                class="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none">
                            </div>

                            <div class="absolute bottom-0 left-0 p-6 text-white max-w-2xl">
                                <span
                                    class="badge badge-primary badge-sm mb-3 tracking-wider uppercase">
                                    {{ categories_label(article.categories) }}
                                </span>
                                <h2 class="mb-2 font-bold leading-tight">{{ article.title }}</h2>
                            </div>
                        </RouterLink>
                    </SplideSlide>
                </Splide>

                <div class="card w-140 rounded-box p-6 divide-y divide-base-300">
                    <div class="flex flex-row justify-between items-center">
                        <div class="text-base-content/70 text-base font-bold my-2">{{ CATEGORY_NAMES.notice[0] }}</div>
                        <RouterLink :to="{ name: 'ArticleList', query: { category: notice_category_id } }"
                            class="btn btn-ghost btn-xs mr-4">
                            更多 &gt;
                        </RouterLink>
                    </div>
                    <ul class="flex flex-col gap-4 justify-around divide-y divide-dashed divide-base-300">
                        <RouterLink v-for="item in article_obj.notice" :key="item.id"
                            :to="{ name: 'ArticleDetail', params: { slug: item.slug } }">
                            <li class="flex items-center justify-between">
                                <div class="flex flex-row items-center">
                                    <div class="bg-base-300 w-1 h-1 rounded-xl"></div>

                                    <div class="text-base-content hover:text-primary hover:font-bold text-sm py-2 px-2">
                                        {{
                                            item.title
                                        }}</div>
                                </div>
                                <div class="text-base-content/40 text-right text-sm px-4">{{ easy_date_text(item.create_at) }}
                                </div>
                            </li>
                        </RouterLink>
                    </ul>
                </div>

            </div>

        </section>
    </div>
</template>