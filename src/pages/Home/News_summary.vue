<script setup lang="ts">
import TitleComponent from '@/components/TitleComponent.vue';
import { Splide, SplideSlide } from '@splidejs/vue-splide';
import '@splidejs/splide/css';
import { url_prefix } from '@/utils/baseInfo';
import { easy_date_text } from '@/utils/formatters';
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useBaseinfoStore } from '@/store/base';
import { useArticleStore } from '@/store/article';
import { category_text } from '@/utils/formatters';

const baseinfo_store = useBaseinfoStore();
const article_store = useArticleStore();

const { categories } = storeToRefs(baseinfo_store);
const { article_obj, loading } = storeToRefs(article_store);

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
    <div class="">
        <section class="mx-auto w-7xl h-full">
            <div class="flex justify-between items-end">
                <TitleComponent>
                    <template #first>水利站动态</template>
                    <template #second>Station News</template>
                </TitleComponent>
            </div>

            <div v-if="loading"
                class="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-border p-12 text-center">
                <div
                    class="animate-spin w-8 h-8 border-4 border-primary-400 border-t-transparent rounded-full mx-auto mb-4">
                </div>
                <p class="text-primary-500">加载中...</p>
            </div>

            <div v-else class="w-7xl flex flex-row gap-8 items-center justify-around ">

                <Splide :options="options" class="overflow-hidden shadow rounded w-180 h-120">
                    <SplideSlide v-for="(article, index) in article_obj.recommended" :key="index">
                        <RouterLink :to="{ name: 'ArticleDetail', params: { slug: article.slug } }"
                            class="relative bg-cover bg-center">
                            <img class="w-180 h-120" :src="url_prefix.pic_prefix + article.cover_img" alt="new_pic">
                            <div
                                class="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none">
                            </div>

                            <div class="absolute bottom-0 left-0 p-6 text-white max-w-2xl">
                                <span
                                    class="inline-block px-3 py-1 mb-3 text-xs font-semibold tracking-wider text-white uppercase bg-primary-500 rounded-full">
                                    {{ category_text(article.category_id, categories) }}
                                </span>
                                <h2 class="mb-2 font-bold leading-tight">{{ article.title }}</h2>
                            </div>
                        </RouterLink>
                    </SplideSlide>
                </Splide>

                <div class="bg-white w-140 p-4 shadow rounded divide-y divide-border">
                    <div class="flex flex-row justify-between items-center">
                        <div class="text-gray-600 text-base font-bold my-2">通知公告</div>
                        <RouterLink :to="{ name: 'ArticleList', query: { category: 4 } }"
                            class="text-sm mr-4 px-3 py-1 hover:text-primary-500 hover:font-bold transition-transform duration-300 hover:translate-x-1">
                            更多 &gt;
                        </RouterLink>
                    </div>
                    <ul class="flex flex-col gap-4 justify-around divide-y divide-dashed divide-border">
                        <RouterLink v-for="item in article_obj.notice" :key="item.id"
                            :to="{ name: 'ArticleDetail', params: { slug: item.slug } }">
                            <li class="flex items-center justify-between">
                                <div class="flex flex-row items-center">
                                    <div class="bg-gray-400 w-1 h-1 rounded-xl"></div>

                                    <div class="text-gray-900 hover:text-primary-500 hover:font-bold text-sm py-2 px-2">
                                        {{
                                            item.title
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