<script setup lang="ts">
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import dayjs from 'dayjs';
import { pic_prefix } from '@/utils/baseInfo';
import { useCategoryStore } from '@/store/category';
import { useArticleStore } from '@/store/article';

const category_store = useCategoryStore()
const article_store = useArticleStore()

const { categories } = storeToRefs(category_store)
const { latest_article } = storeToRefs(article_store)

const date_text = (date_value: string) => {
    return dayjs(date_value).format('YYYY-MM-DD')
}

const category_text = (category_id: number) => {
    let text: string = '默认分类'
    for (let item of categories.value) {
        if (category_id == item.id) {
            text = item.name
        }
    }
    return text
}

onMounted(() => {
    category_store.fetchCategories();
    article_store.getLatest();
})
</script>

<template>
    <main class="bg-background">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="py-4 flex flex-col gap-8 lg:flex-row">
                <aside class="lg:w-64 shrink-0">
                    <div class="rounded-lg bg-white p-4 shadow-xs ring-1 ring-border">
                        <h3 class="text-sm font-semibold text-gray-900 mb-3">新闻分类</h3>
                        <nav class="flex flex-col space-y-1">
                            <!-- 当前选中 -->
                            <a href="#" class="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white">
                                全部分类
                            </a>
                            <a v-for="item in categories" :key="item.id" href="#"
                                class="rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary">
                                {{ item.name }}
                            </a>
                        </nav>
                    </div>
                </aside>

                <div class="flex-1 min-w-0">
                    <div class="mb-4 text-sm text-gray-500">
                        <RouterLink :to="{ name: 'Home' }" class="hover:text-primary">首页</RouterLink>
                        <span class="mx-2">/</span>
                        <span class="text-gray-900">新闻中心</span>
                    </div>

                    <div class="grid grid-cols-3 gap-8">
                        <article v-for="(article, index) in latest_article" :index="index"
                            class="flex flex-col overflow-hidden bg-white rounded shadow-xs ring-1 ring-border  transition-transform duration-300 hover:-translate-y-2">
                            <RouterLink :to="{ name: 'ArticleDetail', params: { slug: article.slug } }">
                                <div class="w-full overflow-hidden">
                                    <img class="w-full h-52" :src="pic_prefix + article.cover_img" alt="news_pic" />
                                </div>
                                <div class="p-4 flex flex-col gap-4">
                                    <div class="flex flex-row items-center justify-between">
                                        <div class="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                            {{ category_text(article.category_id) }}
                                        </div>
                                        <div>
                                            <time class="text-xs text-gray-600">
                                                {{ date_text(article.create_at) }}
                                            </time>
                                        </div>
                                    </div>
                                    <h2
                                        class="text-base font-semibold text-gray-800 hover:text-primary h-12 overflow-hidden">
                                        {{
                                            article.title }}
                                    </h2>
                                </div>
                            </RouterLink>
                        </article>
                    </div>


                    <nav class="m-8 flex items-center justify-between border-t border-border pt-6"
                        aria-label="Pagination">
                        <div class="hidden sm:block">
                            <p class="text-sm text-gray-700">
                                共 <span class="font-medium">42</span> 条，
                                第 <span class="font-medium">1</span> 页 / 共 <span class="font-medium">5</span> 页
                            </p>
                        </div>
                        <div class="flex flex-1 justify-between sm:justify-end gap-2">
                            <a href="#"
                                class="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">上一页</a>
                            <a href="#"
                                class="relative inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-dark">下一页</a>
                        </div>
                    </nav>
                </div>

            </div>
        </div>
    </main>
</template>