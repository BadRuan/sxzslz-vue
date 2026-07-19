<script setup lang="ts">
import { pic_prefix } from '@/utils/baseInfo';
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useCategoryStore } from '@/store/category';
import { useArticleStore } from '@/store/article';
import { date_text, category_text } from '@/utils/formatters';

const category_store = useCategoryStore()
const article_store = useArticleStore()

const { categories } = storeToRefs(category_store)
const { recommended_article } = storeToRefs(article_store)

onMounted(async () => {
    await Promise.all([
        category_store.checkCategory(),
        article_store.getRecommended()
    ]);
})

</script>

<template>
    <div class="bg-neutral-100 py-4">
        <section class="mx-auto w-7xl h-full">
            <div class="flex justify-between items-end">
                <div class="flex items-center py-4">
                    <span class="h-5 w-1 rounded bg-primary mr-4"></span>
                    <div>
                        <p class="text-xs text-gray-500">Station News</p>
                        <h2 class="text-lg font-semibold text-gray-900">水利站动态</h2>
                    </div>
                </div>

                <RouterLink :to="{ name: 'ArticleList', query: { category: 1 } }"
                    class="text-sm m-4 hover:text-red-700">
                    查看更多 &gt;
                </RouterLink>
            </div>

            <div class="w-7xl flex flex-row items-center justify-around py-4">
                <div v-for="(article, index) in recommended_article" :key="index"
                    class="w-72 bg-white group rounded-sm overflow-hidden shadow transition-transform duration-300 hover:-translate-y-2">
                    <RouterLink :to="{ name: 'ArticleDetail', params: { slug: article.slug } }">

                        <img class="w-72 h-48" :src="pic_prefix + article.cover_img" alt="new_pic">
                        <div class="p-4">
                            <div class="flex flex-row justify-between items-center">
                                <div class="text-sm text-gray-700 bg-gray-100 p-2 rounded">
                                    {{ category_text(article.category_id, categories) }}
                                </div>
                                <span class="text-gray-600 text-sm text-right">
                                    {{ date_text(article.create_at) }}</span>
                            </div>
                            <div class="group-hover:text-primary my-4 h-12 overflow-hidden">{{ article.title }}
                            </div>
                        </div>
                    </RouterLink>
                </div>
            </div>

        </section>
    </div>
</template>