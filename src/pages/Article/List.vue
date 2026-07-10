<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { ArticleSummary } from '@/types/article'
import { storeToRefs } from 'pinia';
import type { ArticleItem } from '@/types/article'
import { useStationrStore } from '@/store/station';

const station_store = useStationrStore()
const { url_head } = storeToRefs(station_store)

const pic_str = url_head.value + 'image/649e4d965d23441cb29123100c2289ef.JPG'

const categories = ref<string[]>([
    '要闻动态',
    '通知公告',
    '政策法规',
    '防汛抗旱',
    '工程简报',
    '党建引领',
    '财务公示',
    '人事公开'
])

const article_list = reactive<ArticleSummary[]>([
    {
        title: '鸠江区编办莅临沈巷镇水利站开展防汛检查工作1鸠江区编办莅鸠江区编办莅临沈巷镇水利站开展防汛检查工作1临沈巷镇水利站开展防汛检查工作1',
        summary: '1为进一步做好汛期安全防范工作，确保泵站设备正常运行，鸠江区编办一行于今日上午莅临我站开展专项检查...',
        date: '2025-05-21'
    },
    {
        title: '鸠江区编办莅临沈巷镇水利站开展防汛检查工作2',
        summary: '2为进一步做好汛期安全防范工作，确保泵站设备正常运行，鸠江区编办一行于今日上午莅临我站开展专项检查...',
        date: '2025-06-23'
    },
    {
        title: '鸠江区编办莅临沈巷镇水利站开展防汛检查工作3',
        summary: '3为进一步做好汛期安全防范工作，确保泵站设备正常运行，鸠江区编办一行于今日上午莅临我站开展专项检查...',
        date: '2025-07-23'
    },
    {
        title: '鸠江区编办莅临沈巷镇水利站开展防汛检查工作3',
        summary: '3为进一步做好汛期安全防范工作，确保泵站设备正常运行，鸠江区编办一行于今日上午莅临我站开展专项检查...',
        date: '2025-07-23'
    }, {
        title: '鸠江区编办莅临沈巷镇水利站开展防汛检查工作3',
        summary: '3为进一步做好汛期安全防范工作，确保泵站设备正常运行，鸠江区编办一行于今日上午莅临我站开展专项检查...',
        date: '2025-07-23'
    },
    {
        title: '鸠江区编办莅临沈巷镇水利站开展防汛检查工作3',
        summary: '3为进一步做好汛期安全防范工作，确保泵站设备正常运行，鸠江区编办一行于今日上午莅临我站开展专项检查...',
        date: '2025-07-23'
    }, {
        title: '鸠江区编办莅临沈巷镇水利站开展防汛检查工作3',
        summary: '3为进一步做好汛期安全防范工作，确保泵站设备正常运行，鸠江区编办一行于今日上午莅临我站开展专项检查...',
        date: '2025-07-23'
    },
    {
        title: '鸠江区编办莅临沈巷镇水利站开展防汛检查工作3',
        summary: '3为进一步做好汛期安全防范工作，确保泵站设备正常运行，鸠江区编办一行于今日上午莅临我站开展专项检查...',
        date: '2025-07-23'
    }, {
        title: '鸠江区编办莅临沈巷镇水利站开展防汛检查工作3',
        summary: '3为进一步做好汛期安全防范工作，确保泵站设备正常运行，鸠江区编办一行于今日上午莅临我站开展专项检查...',
        date: '2025-07-23'
    },
    {
        title: '鸠江区编办莅临沈巷镇水利站开展防汛检查工作3',
        summary: '3为进一步做好汛期安全防范工作，确保泵站设备正常运行，鸠江区编办一行于今日上午莅临我站开展专项检查...',
        date: '2025-07-23'
    },
])
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
                                全部新闻
                            </a>
                            <a v-for="(category, index) in categories" :key="index" href="#"
                                class="rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary">
                                {{ category }}
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
                        <article v-for="(article, index) in article_list" :index="index"
                            class="flex flex-col overflow-hidden bg-white rounded shadow-xs ring-1 ring-border">
                            <div class="w-full overflow-hidden">
                                <img class="w-full h-full" :src="pic_str" alt="news_pic" />
                            </div>
                            <div class="p-4 flex flex-col gap-4">
                                <div>
                                    <time class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                        {{ article.date }}
                                    </time>
                                </div>
                                <h2
                                    class="text-base font-semibold text-gray-800 hover:text-primary h-12 overflow-hidden">
                                    <RouterLink :to="{ name: 'ArticleDetail' }">{{ article.title }}</RouterLink>
                                </h2>
                            </div>
                        </article>

                    </div>

                    <!-- ========== 分页 ========== -->
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