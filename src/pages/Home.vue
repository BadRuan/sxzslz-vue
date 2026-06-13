<script setup lang="ts">
import { ref } from 'vue'

interface Article {
    title: string
    category: string
    author: string
    is_public: boolean
    is_recommended: boolean
    views: number
    created: string
}

const articles = ref<Article[]>([
    {
        title: '鸠江区编办莅临沈巷镇水利站开展防汛检查工作',
        category: '政策法规',
        author: '系统管理员',
        is_public: true,
        is_recommended: true,
        views: 123,
        created: '2026-05-01'
    },
    {
        title: '冬季检修全面启动保障泵站安全运行',
        category: '通知公告',
        author: '用户01',
        is_public: true,
        is_recommended: true,
        views: 123,
        created: '2026-04-05'
    },
    {
        title: '鸠江区编办莅临沈巷镇水利站开展防汛检查工作',
        category: '工程简报',
        author: '张三',
        is_public: false,
        is_recommended: true,
        views: 5123,
        created: '2025-12-21'
    },
    {
        title: '沈巷镇水利站电网账号管理规定',
        category: '要闻动态',
        author: '李伟',
        is_public: true,
        is_recommended: false,
        views: 9123,
        created: '2025-10-09'
    },
    {
        title: '冬季检修全面启动保障泵站安全运行',
        category: '政策法规',
        author: '张三',
        is_public: false,
        is_recommended: true,
        views: 4123,
        created: '2024-03-08'
    }
])
</script>


<template>
    <main class="bg-background">

        <section class="py-6">
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">

                    <div class="md:col-span-2 bg-white rounded-lg shadow-xs ring-1 ring-border overflow-hidden">
                        <!-- 模块标题 -->
                        <div class="flex items-center px-5 py-4 border-b border-border">
                            <span class="h-5 w-1 rounded bg-primary mr-3"></span>
                            <div>
                                <p class="text-xs text-gray-500">Import News</p>
                                <h2 class="text-lg font-semibold text-gray-900">水利站要闻</h2>
                            </div>
                        </div>

                        <!-- 轮播主体 -->
                        <div id="carousel" class="relative group">
                            <!-- 幻灯片 -->
                            <div class="relative aspect-[16/9] overflow-hidden">
                                <!-- Slide 1 -->
                                <div class="carousel-slide absolute inset-0 transition-opacity duration-700 ease-in-out opacity-100"
                                    data-slide="0">
                                    <a href="#" class="block h-full">
                                        <img src="/pic/banner.jpg" class="w-full h-full object-cover" />
                                        <div
                                            class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-5">
                                            <h3 class="text-white text-lg font-semibold">鸠江区编办莅临沈巷镇水利站开展防汛检查工作</h3>
                                            <p class="text-gray-300 text-sm mt-1">2025‑07‑23</p>
                                        </div>
                                    </a>
                                </div>

                                <!-- Slide 2 -->
                                <div class="carousel-slide absolute inset-0 transition-opacity duration-700 ease-in-out opacity-0"
                                    data-slide="1">
                                    <a href="#" class="block h-full">
                                        <img src="/pic/banner.jpg" class="w-full h-full object-cover" />
                                        <div
                                            class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-5">
                                            <h3 class="text-white text-lg font-semibold">水利工程标准化管理暨安全生产工作会议召开</h3>
                                            <p class="text-gray-300 text-sm mt-1">2025‑07‑21</p>
                                        </div>
                                    </a>
                                </div>

                                <!-- Slide 3 -->
                                <div class="carousel-slide absolute inset-0 transition-opacity duration-700 ease-in-out opacity-0"
                                    data-slide="2">
                                    <a href="#" class="block h-full">
                                        <img src="/pic/banner.jpg" class="w-full h-full object-cover" />
                                        <div
                                            class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-5">
                                            <h3 class="text-white text-lg font-semibold">冬季检修全面启动 保障泵站安全运行</h3>
                                            <p class="text-gray-300 text-sm mt-1">2025‑07‑19</p>
                                        </div>
                                    </a>
                                </div>
                            </div>

                            <!-- 左箭头 -->
                            <button id="prevBtn"
                                class="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center text-gray-600 hover:text-primary opacity-0 group-hover:opacity-100 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" class="w-4 h-4">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>

                            <!-- 右箭头 -->
                            <button id="nextBtn"
                                class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center text-gray-600 hover:text-primary opacity-0 group-hover:opacity-100 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" class="w-4 h-4">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>

                            <!-- 指示器 -->
                            <div class="absolute bottom-4 right-4 flex gap-1.5">
                                <button class="carousel-dot w-2 h-2 rounded-full bg-white opacity-100"
                                    data-index="0"></button>
                                <button class="carousel-dot w-2 h-2 rounded-full bg-white opacity-60"
                                    data-index="1"></button>
                                <button class="carousel-dot w-2 h-2 rounded-full bg-white opacity-60"
                                    data-index="2"></button>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow-xs ring-1 ring-border flex flex-col">
                        <div class="flex items-center justify-between px-5 py-4 border-b border-border">
                            <div class="flex items-center">
                                <span class="h-5 w-1 rounded bg-primary mr-3"></span>
                                <div>
                                    <p class="text-xs text-gray-500">Fast News</p>
                                    <h2 class="text-lg font-semibold text-gray-900">水利站快讯</h2>
                                </div>
                            </div>
                            <RouterLink :to="{ name: 'ArticleList' }" class="text-sm text-gray-600 hover:text-primary">
                                更多 &rsaquo;
                            </RouterLink>
                        </div>

                        <ul class="divide-y divide-gray-200 px-5 py-4">
                            <li v-for="(article, index) in articles" :key="index" class="pb-3 last:pb-0">
                                <RouterLink :to="{ name: 'ArticleDetail' }"
                                    class="text-sm font-medium text-gray-800 hover:text-primary line-clamp-2">
                                    {{ article.title }}
                                </RouterLink>
                                <div class="mt-2 flex items-center justify-between">
                                    <span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                        {{ article.category }}
                                    </span>
                                    <time class="text-xs text-gray-400">2026-06-06</time>
                                </div>
                            </li>

                        </ul>
                    </div>

                </div>
            </div>
        </section>

    </main>

</template>