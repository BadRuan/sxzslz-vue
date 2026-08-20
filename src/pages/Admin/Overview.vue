<script setup lang="ts">
import { onMounted, ref } from 'vue';
import apiService from '@/utils/apiService';
import { storeToRefs } from 'pinia';
import { useBaseinfoStore } from '@/store/base';
import { date_text, category_text } from '@/utils/formatters';
import { type ArticleModel } from '@/store/article';

interface CountModel {
    total_article: number,
    month_article: number,
    image_count: number,
    attachment_count: number,
    user_count: number,
    article_view: number,
    image_view: number,
    download_count: number
};

const count_info = ref<CountModel>({
    total_article: 0,
    month_article: 0,
    image_count: 0,
    attachment_count: 0,
    user_count: 0,
    article_view: 0,
    image_view: 0,
    download_count: 0
});
const latest_article = ref<ArticleModel[]>();

const fetchCountInfo = async () => {
    try {
        const res = await apiService.get('/admin/');
        count_info.value = res;
    } catch (error) {
        console.error('获取管理后台统计信息失败:', error)
    }
}

const getAdminLatestArticle = async () => {
    try {
        const res = await apiService.get('/admin/latest/', { limit: 10 });
        latest_article.value = res;
    } catch (error) {
        console.error('获取管理后台最新文章失败:', error)
    }
}

const baseinfo_store = useBaseinfoStore();
const { categories } = storeToRefs(baseinfo_store);

onMounted(
    async () => {
        fetchCountInfo();
        getAdminLatestArticle();
        baseinfo_store.checkBaseinfo();
    }
);
</script>

<template>
    <main class="flex-1 overflow-y-auto p-6 space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-white rounded-lg shadow-xs ring-1 ring-border p-5 flex items-center gap-4">
                <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <div>
                    <div class="text-sm text-gray-500">文章总数</div>
                    <div class="text-2xl font-bold text-foreground mt-1">{{ count_info.total_article }}</div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-xs ring-1 ring-border p-5 flex items-center gap-4">
                <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </div>
                <div>
                    <div class="text-sm text-gray-500">本月发布</div>
                    <div class="text-2xl font-bold text-foreground mt-1">{{ count_info.month_article }}</div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-xs ring-1 ring-border p-5 flex items-center gap-4">
                <div class="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <div>
                    <div class="text-sm text-gray-500">图片数量</div>
                    <div class="text-2xl font-bold text-foreground mt-1">{{ count_info.image_count }}</div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-xs ring-1 ring-border p-5 flex items-center gap-4">
                <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                </div>
                <div>
                    <div class="text-sm text-gray-500">附件数量</div>
                    <div class="text-2xl font-bold text-foreground mt-1">{{ count_info.attachment_count }}</div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-xs ring-1 ring-border p-5 flex items-center gap-4">
                <div class="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                </div>
                <div>
                    <div class="text-sm text-gray-500">系统用户</div>
                    <div class="text-2xl font-bold text-foreground mt-1">{{ count_info.user_count }}</div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-xs ring-1 ring-border p-5 flex items-center gap-4">
                <div class="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24"
                        height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M1 22L1 2L3 2L3 21L22 21L22 23L2 23C1.44772 23 1 22.5523 1 22Z" fill-rule="evenodd"
                            fill="#7948EA"></path>
                        <path
                            d="M21.2565 5.51746C21.5315 5.70764 21.6932 6.02268 21.6875 6.35699L21.6106 10.8633C21.6043 11.232 21.3956 11.5674 21.0675 11.7358C20.7394 11.9042 20.3452 11.8784 20.0419 11.6687L15.9296 8.82454C15.6263 8.61476 15.4631 8.25506 15.5049 7.88864C15.5467 7.52223 15.7868 7.20858 16.1296 7.07257L20.3189 5.41041C20.6297 5.2871 20.9815 5.32727 21.2565 5.51746ZM18.604 8.24248L19.6428 8.96088L19.6622 7.82263L18.604 8.24248Z"
                            fill-rule="evenodd" fill="#7948EA"></path>
                        <path
                            d="M13.7371 14.6229L17.6778 8.93079L19.3222 10.0692L14.8222 16.5692C14.5117 17.0177 13.8991 17.1346 13.4453 16.8321L9.66481 14.3117L5.74329 18.669L4.25671 17.331L8.75671 12.331C9.08888 11.962 9.64155 11.8925 10.0547 12.1679L13.7371 14.6229Z"
                            fill-rule="evenodd" fill="#7948EA"></path>
                    </svg>
                </div>
                <div>
                    <div class="text-sm text-gray-500">文章阅读总量</div>
                    <div class="text-2xl font-bold text-foreground mt-1">{{ count_info.article_view }}</div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-xs ring-1 ring-border p-5 flex items-center gap-4">
                <div class="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24"
                        height="24" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M1 2C1 1.44772 1.44772 1 2 1L22 1C22.5523 1 23 1.44772 23 2L23 22C23 22.5523 22.5523 23 22 23L2 23C1.44772 23 1 22.5523 1 22L1 2ZM3 3L3 21L21 21L21 3L3 3Z"
                            fill-rule="evenodd" fill="#FF8D1A"></path>
                        <path
                            d="M9.4831 7C9.38409 7 9.29867 7.06946 9.27847 7.16639L7.29975 16.6643C7.00106 18.098 5.31341 18.7351 4.14179 17.8563L1.4 15.8L2.6 14.2L5.34179 16.2563L7.32051 6.75848C7.53392 5.73411 8.43674 5 9.4831 5C10.5571 5 11.4754 5.77243 11.6594 6.83052L13.3137 16.3422C13.3295 16.4334 13.4087 16.5 13.5013 16.5C13.5937 16.5 13.6727 16.4337 13.6888 16.3427L14.8098 9.99047C15.0129 8.83924 16.0132 8 17.1822 8C18.0468 8 18.845 8.46324 19.274 9.21387L22.8682 15.5039L21.1318 16.4961L17.5375 10.2062C17.4646 10.0787 17.3291 10 17.1822 10C16.9837 10 16.8138 10.1425 16.7793 10.338L15.6583 16.6902C15.4736 17.7369 14.5641 18.5 13.5013 18.5C12.4363 18.5 11.5257 17.7341 11.3432 16.6849L9.68902 7.1732C9.67161 7.07309 9.58472 7 9.4831 7Z"
                            fill-rule="evenodd" fill="#FF8D1A"></path>
                    </svg>
                </div>
                <div>
                    <div class="text-sm text-gray-500">图片浏览总量</div>
                    <div class="text-2xl font-bold text-foreground mt-1">{{ count_info.image_view }}</div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-xs ring-1 ring-border p-5 flex items-center gap-4">
                <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24"
                        height="24" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M5 15C5 14.4477 5.44772 14 6 14L18 14C18.5523 14 19 14.4477 19 15L19 22C19 22.5523 18.5523 23 18 23L6 23C5.44772 23 5 22.5523 5 22L5 15ZM7 16L7 21L17 21L17 16L7 16Z"
                            fill-rule="evenodd" fill="#4BB8EB"></path>
                        <path
                            d="M5.07152 9.62861C5.22339 9.24895 5.5911 9 6 9L18 9C18.4089 9 18.7766 9.24895 18.9285 9.62861L20.9285 14.6286C21.0517 14.9367 21.0141 15.2859 20.8281 15.5606C20.642 15.8354 20.3318 16 20 16L4 16C3.66818 16 3.35796 15.8354 3.17193 15.5606C2.9859 15.2859 2.94829 14.9367 3.07152 14.6286L5.07152 9.62861ZM6.67703 11L5.47703 14L18.523 14L17.323 11L6.67703 11Z"
                            fill-rule="evenodd" fill="#4BB8EB"></path>
                        <path d="M13 7L13 2L11 2L11 7L13 7Z" fill-rule="evenodd" fill="#4BB8EB"></path>
                        <path
                            d="M11.2929 8.20711C11.6834 8.59763 12.3166 8.59763 12.7071 8.20711L14.7071 6.20711L13.2929 4.79289L12 6.08579L10.7071 4.79289L9.29289 6.20711L11.2929 8.20711Z"
                            fill-rule="evenodd" fill="#4BB8EB"></path>
                        <path d="M15.5 20L13 20L13 18L15.5 18L15.5 20Z" fill-rule="evenodd" fill="#4BB8EB"></path>
                    </svg>
                </div>
                <div>
                    <div class="text-sm text-gray-500">附件下载总次数</div>
                    <div class="text-2xl font-bold text-foreground mt-1">{{ count_info.download_count }}</div>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow-xs ring-1 ring-border">
            <div class="px-5 py-4 border-b border-border">
                <h3 class="text-sm font-semibold text-gray-900">最近新闻</h3>
            </div>
            <ul class="divide-y divide-border">
                <li v-for="(article, index) in latest_article" :key="index"
                    class="px-5 py-3 flex items-center justify-between">
                    <div class="flex flex-row items-center">
                        <div class="bg-gray-200 px-4 py-2 mr-4 text-sm rounded-2xl text-gray-700">{{
                            category_text(article.category_id, categories) }}</div>
                        <RouterLink :to="{ name: 'ArticleDetail', params: { slug: article.slug } }"
                            class="text-base text-gray-500 hover:text-primary-400 truncate">
                            <span class="font-bold">{{ article.title }}</span>
                        </RouterLink>
                    </div>
                    <time class="ml-4 shrink-0 text-xs text-gray-400">{{ date_text(article.create_at) }}</time>
                </li>
            </ul>
        </div>
    </main>
</template>