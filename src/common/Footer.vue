<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useBaseinfoStore } from '@/store/base';
import { name_category_id, to_second_level_id } from '@/utils/category';

const baseinfo_store = useBaseinfoStore();
const { categories } = storeToRefs(baseinfo_store);
// 页脚链接不随 CATEGORY_NAMES（首页栏目配置）漂移：保留原有语义，用本地名称数组。
// 名称命中一级分类时取其第一个子分类（文章只挂二级）
const finance_category_id = computed(() => to_second_level_id(categories.value, name_category_id(categories.value, ['财务信息', '财务公开'])));
const notice_category_id = computed(() => to_second_level_id(categories.value, name_category_id(categories.value, ['通知公告'])));
const news_category_id = computed(() => to_second_level_id(categories.value, name_category_id(categories.value, ['新闻动态', '水利站动态', '新闻'])));
</script>

<template>
    <footer class="mt-auto bg-neutral text-neutral-content/70">
        <!-- 一条主色渐变线，把页脚与正文明确切开 -->
        <div class="h-[3px] w-full bg-gradient-to-r from-primary via-secondary to-primary/20" aria-hidden="true"></div>

        <div class="page-container">
            <div class="grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">

                <!-- 单位信息 -->
                <div class="lg:col-span-5">
                    <div class="flex items-center gap-3">
                        <span class="grid size-11 place-items-center rounded-xl bg-white/95 p-1.5">
                            <img src="/icon/water-logo.svg" class="h-full w-auto" alt="沈巷镇水利站标识" />
                        </span>
                        <div>
                            <p class="text-base font-semibold tracking-tight text-white">芜湖市鸠江区沈巷镇水利站</p>
                            <p class="mt-0.5 text-[0.6875rem] tracking-[0.16em] text-neutral-content/40 uppercase">
                                Shenxiang Water Station
                            </p>
                        </div>
                    </div>
                    <p class="mt-5 max-w-sm text-sm leading-7 text-neutral-content/60">
                        负责辖区内的水资源管理、防汛抗旱、灌溉排涝，以及水利工程的运行与维护，守护一方安澜。
                    </p>
                    <div class="mt-6 flex flex-wrap gap-2">
                        <span class="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-content/55">防汛抗旱</span>
                        <span class="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-content/55">灌溉排涝</span>
                        <span class="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-content/55">泵站运维</span>
                    </div>
                </div>

                <!-- 快速导航 -->
                <nav class="lg:col-span-2" aria-label="页脚导航">
                    <h3 class="text-sm font-semibold text-white">快速导航</h3>
                    <ul class="mt-4 space-y-3 text-sm">
                        <li>
                            <RouterLink :to="{ name: 'Home' }" class="footer-link">网站首页</RouterLink>
                        </li>
                        <li>
                            <RouterLink :to="{ name: 'ArticleList', query: { category: news_category_id } }"
                                class="footer-link">新闻列表</RouterLink>
                        </li>
                        <li>
                            <RouterLink :to="{ name: 'About' }" class="footer-link">关于我们</RouterLink>
                        </li>
                        <li>
                            <RouterLink :to="{ name: 'Station' }" class="footer-link">泵站概览</RouterLink>
                        </li>
                        <li>
                            <RouterLink :to="{ name: 'Search' }" class="footer-link">站内搜索</RouterLink>
                        </li>
                    </ul>
                </nav>

                <!-- 内容栏目 -->
                <nav class="lg:col-span-2" aria-label="内容栏目">
                    <h3 class="text-sm font-semibold text-white">内容栏目</h3>
                    <ul class="mt-4 space-y-3 text-sm">
                        <li>
                            <RouterLink :to="{ name: 'ArticleList', query: { category: notice_category_id } }"
                                class="footer-link">通知公告</RouterLink>
                        </li>
                        <li>
                            <RouterLink :to="{ name: 'ArticleList', query: { category: finance_category_id } }"
                                class="footer-link">财务公开</RouterLink>
                        </li>
                        <li>
                            <RouterLink :to="{ name: 'ArticleList', query: { category: news_category_id } }"
                                class="footer-link">水利动态</RouterLink>
                        </li>
                        <li>
                            <RouterLink :to="{ name: 'AdminLogin' }" class="footer-link">管理入口</RouterLink>
                        </li>
                    </ul>
                </nav>

                <!-- 联系方式 -->
                <div class="lg:col-span-3">
                    <h3 class="text-sm font-semibold text-white">联系我们</h3>
                    <ul class="mt-4 space-y-3 text-sm">
                        <li class="flex items-start gap-2.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" class="mt-0.5 shrink-0 text-neutral-content/40" aria-hidden="true">
                                <path d="M12 21s7-5.686 7-11a7 7 0 1 0-14 0c0 5.314 7 11 7 11Z" stroke="currentColor"
                                    stroke-width="1.5" stroke-linejoin="round"></path>
                                <circle cx="12" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"></circle>
                            </svg>
                            <span class="leading-6">安徽省芜湖市鸠江区沈巷镇水利站</span>
                        </li>
                        <li class="flex items-center gap-2.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" class="shrink-0 text-neutral-content/40" aria-hidden="true">
                                <path
                                    d="M5 4h3l2 5-2.5 1.5a12 12 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2.2 2A16 16 0 0 1 3 6.2 2 2 0 0 1 5 4Z"
                                    stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"></path>
                            </svg>
                            <a href="tel:0553-8976603" class="footer-link num">0553-8976603</a>
                        </li>
                        <li class="flex items-center gap-2.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" class="shrink-0 text-neutral-content/40" aria-hidden="true">
                                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.5">
                                </rect>
                                <path d="m4 7 8 6 8-6" stroke="currentColor" stroke-width="1.5"
                                    stroke-linejoin="round"></path>
                            </svg>
                            <a href="mailto:ruanfm@qq.com" class="footer-link">ruanfm@qq.com</a>
                        </li>
                    </ul>
                </div>
            </div>

            <div
                class="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-xs text-neutral-content/45 sm:flex-row">
                <p>© 2026 芜湖市鸠江区沈巷镇水利站 版权所有</p>
                <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>皖ICP备20260101号</span>
                    <span class="text-white/30">|</span>
                    <span>网站找错</span>
                    <span class="text-white/30">|</span>
                    <span>隐私声明</span>
                </div>
            </div>
        </div>
    </footer>
</template>

<style scoped>
.footer-link {
    color: color-mix(in oklab, var(--color-neutral-content) 62%, transparent);
}

.footer-link:hover {
    color: #ffffff;
}
</style>
