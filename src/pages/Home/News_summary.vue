<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import type { ArticleItem } from '@/types/article'
import { useStationrStore } from '@/store/station';

const station_store = useStationrStore()
const { url_head } = storeToRefs(station_store)

interface Slide {
    title: string
    date: string
    image: string
}

const slides = ref<Slide[]>([
    { title: '鸠江区编办莅临沈巷镇水利站开展防汛检查工作', date: '2025‑07‑23', image: '/pic/banner.jpg' },
    { title: '水利工程标准化管理暨安全生产工作会议召开', date: '2025‑07‑21', image: '/pic/news.webp' },
])

const currentSlide = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function goTo(index: number) {
    currentSlide.value = index
    resetTimer()
}

function prev() {
    currentSlide.value = (currentSlide.value - 1 + slides.value.length) % slides.value.length
    resetTimer()
}

function next() {
    currentSlide.value = (currentSlide.value + 1) % slides.value.length
    resetTimer()
}

function startTimer() {
    timer = setInterval(next, 5000)
}

function resetTimer() {
    if (timer) clearInterval(timer)
    startTimer()
}

onMounted(startTimer)
onUnmounted(() => { if (timer) clearInterval(timer) })

const articles = ref<ArticleItem[]>([
    {
        slug: '',
        title: '鸠江区编办莅临沈巷镇水利站开展防汛检查工作',
        category: '政策法规',
        author: '系统管理员',
        is_public: true,
        is_recommended: true,
        views: 123,
        created: '2026-05-01'
    },
    {
        slug: '',
        title: '冬季检修全面启动保障泵站安全运行',
        category: '通知公告',
        author: '用户01',
        is_public: true,
        is_recommended: true,
        views: 123,
        created: '2026-04-05'
    },
    {
        slug: '',
        title: '鸠江区编办莅临沈巷镇水利站开展防汛检查工作',
        category: '工程简报',
        author: '张三',
        is_public: false,
        is_recommended: true,
        views: 5123,
        created: '2025-12-21'
    },
    {
        slug: '',
        title: '沈巷镇水利站电网账号管理规定',
        category: '要闻动态',
        author: '李伟',
        is_public: true,
        is_recommended: false,
        views: 9123,
        created: '2025-10-09'
    },
    {
        slug: '',
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

                <RouterLink :to="{ name: 'ArticleList' }" class="text-sm m-4 hover:text-red-700">
                    查看更多 &gt;
                </RouterLink>
            </div>
            <div class="w-7xl flex flex-row items-center justify-around py-4">
                <div
                    class="w-100 bg-white rounded-sm overflow-hidden shadow transition-transform duration-300 hover:-translate-y-2">
                    <img class="w-full h-60" :src="url_head + 'image/30a52efbffe742d3a0adea052fdfd43c.JPG'"
                        alt="new_pic">
                    <div class="p-6">
                        <div class="flex flex-row justify-between items-center">
                            <div class="text-sm text-gray-600 bg-gray-100 p-2 rounded">
                                综合新闻
                            </div>
                            <span class="text-gray-600 text-sm text-right">2026-06-08</span>
                        </div>
                        <div class="bg-white my-2">鸠江区编办莅临沈巷镇水利站开展防汛检查工作开</div>
                    </div>
                </div>

                <div
                    class="w-100 bg-white rounded-sm overflow-hidden shadow transition-transform duration-300 hover:-translate-y-2">
                    <img class="w-full h-60" :src="url_head + 'image/2f8ab79b22f44eff834fad97dcd2aca0.JPG'"
                        alt="new_pic">
                    <div class="p-6">
                        <div class="flex flex-row justify-between items-center">
                            <div class="text-sm text-gray-700 bg-gray-100 p-2 rounded">
                                要闻动态
                            </div>
                            <span class="text-gray-600 text-right">2026-06-08</span>
                        </div>
                        <div class="bg-white my-2">水利工程标准化管理暨安全生产工作会议召开</div>
                    </div>
                </div>

                <div
                    class="w-100 bg-white rounded-sm overflow-hidden shadow transition-transform duration-300 hover:-translate-y-2">
                    <img class="w-full h-60" :src="url_head + 'image/649e4d965d23441cb29123100c2289ef.JPG'"
                        alt="new_pic">
                    <div class="p-6">
                        <div class="flex flex-row justify-between items-center">
                            <div class="text-sm text-gray-700 bg-gray-100 p-2 rounded">
                                要闻动态
                            </div>
                            <span class="text-gray-600 text-right">2026-06-08</span>
                        </div>
                        <div class="bg-white my-2">水利工程标准化管理暨安全生产工作会议召开</div>
                    </div>
                </div>
            </div>

        </section>
    </div>
</template>